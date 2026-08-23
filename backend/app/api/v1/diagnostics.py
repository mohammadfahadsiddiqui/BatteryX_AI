"""BatteryX AI – Diagnostic Sessions API"""
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import (
    DiagnosticSession, Battery, HardwareDevice, User, AuditLog,
    SOHPrediction, RULPrediction, RiskAssessment, SecondLifeAssessment,
    DiagnosticTest, BatteryLifecycleEvent
)
from app.api.deps import get_current_user
from app.services.analysis.engine import BatteryInput, run_full_analysis

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class DiagnosticCreateRequest(BaseModel):
    battery_id: str
    diagnostic_type: str = "Full Battery Diagnostic"
    data_source: str = "manual"       # manual, esp32, bms, can, csv, demo
    device_id: Optional[str] = None
    notes: Optional[str] = None

class DiagnosticCompleteRequest(BaseModel):
    """Supply measurements to run AI analysis on completion."""
    voltage_v: Optional[float] = None
    current_a: Optional[float] = None
    temperature_c: Optional[float] = None
    soc_pct: Optional[float] = None
    internal_resistance_mohm: Optional[float] = None
    measured_capacity_ah: Optional[float] = None
    charge_rate_c: Optional[float] = None
    discharge_rate_c: Optional[float] = None


def _session_dict(s: DiagnosticSession) -> dict:
    return {
        "id": s.id,
        "session_id": s.session_id,
        "battery_id": s.battery_id,
        "device_id": s.device_id,
        "diagnostic_type": s.diagnostic_type,
        "data_source": s.data_source,
        "status": s.status,
        "data_quality_score": s.data_quality_score,
        "measurements_count": s.measurements_count,
        "notes": s.notes,
        "error_message": s.error_message,
        "started_at": s.started_at,
        "completed_at": s.completed_at,
        "created_at": s.created_at,
        "result_soh_pct": s.result_soh_pct,
        "result_rul_years": s.result_rul_years,
        "result_risk_level": s.result_risk_level,
        "result_second_life_score": s.result_second_life_score,
        "result_second_life_class": s.result_second_life_class,
        "result_recommended_action": s.result_recommended_action,
        "result_anomalies": s.result_anomalies,
        "result_explanation": s.result_explanation,
        "ai_model_version": s.ai_model_version,
    }


def _resolve_battery(battery_id: str, db: Session) -> Battery:
    battery = (
        db.query(Battery).filter(Battery.battery_id == battery_id).first()
        or db.query(Battery).filter(Battery.id == battery_id).first()
    )
    if not battery:
        raise HTTPException(status_code=404, detail=f"Battery '{battery_id}' not found")
    return battery


# ── POST /diagnostics ─────────────────────────────────────────────────────────

@router.post("", status_code=201)
def create_diagnostic_session(
    req: DiagnosticCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new diagnostic session."""
    battery = _resolve_battery(req.battery_id, db)

    device = None
    if req.device_id:
        device = (
            db.query(HardwareDevice).filter(
                (HardwareDevice.device_id == req.device_id) |
                (HardwareDevice.id == req.device_id)
            ).first()
        )

    session_id = f"DIAG-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    session = DiagnosticSession(
        session_id=session_id,
        battery_id=battery.id,
        device_id=device.id if device else None,
        run_by_user_id=current_user.id,
        diagnostic_type=req.diagnostic_type,
        data_source=req.data_source,
        status="CREATED",
        notes=req.notes,
    )
    db.add(session)

    log = AuditLog(
        user_id=current_user.id,
        action="diagnostic.created",
        resource_type="diagnostic_session",
        resource_id=session_id,
        details={"battery_id": battery.battery_id, "type": req.diagnostic_type},
    )
    db.add(log)
    db.commit()
    db.refresh(session)
    return _session_dict(session)


# ── GET /diagnostics ──────────────────────────────────────────────────────────

@router.get("", response_model=List[dict])
def list_diagnostic_sessions(
    battery_id: Optional[str] = None,
    status: Optional[str] = None,
    data_source: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(DiagnosticSession)
    if battery_id:
        battery = _resolve_battery(battery_id, db)
        q = q.filter(DiagnosticSession.battery_id == battery.id)
    if status:
        q = q.filter(DiagnosticSession.status == status)
    if data_source:
        q = q.filter(DiagnosticSession.data_source == data_source)

    sessions = q.order_by(DiagnosticSession.created_at.desc()).offset(skip).limit(limit).all()

    # Enrich with battery_id string
    result = []
    for s in sessions:
        d = _session_dict(s)
        battery = db.query(Battery).filter(Battery.id == s.battery_id).first()
        d["battery_id_str"] = battery.battery_id if battery else None
        d["battery_manufacturer"] = battery.manufacturer if battery else None
        result.append(d)
    return result


# ── GET /diagnostics/{id} ─────────────────────────────────────────────────────

@router.get("/{session_id}")
def get_diagnostic_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(DiagnosticSession).filter(
            (DiagnosticSession.session_id == session_id) |
            (DiagnosticSession.id == session_id)
        ).first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")

    d = _session_dict(session)
    battery = db.query(Battery).filter(Battery.id == session.battery_id).first()
    d["battery_id_str"] = battery.battery_id if battery else None
    return d


# ── POST /diagnostics/{id}/start ─────────────────────────────────────────────

@router.post("/{session_id}/start")
def start_diagnostic_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(DiagnosticSession).filter(
            (DiagnosticSession.session_id == session_id) |
            (DiagnosticSession.id == session_id)
        ).first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")
    if session.status not in ("CREATED", "READY", "PAUSED"):
        raise HTTPException(status_code=400, detail=f"Cannot start session in status {session.status}")

    session.status = "RUNNING"
    session.started_at = datetime.utcnow()
    db.commit()
    return _session_dict(session)


# ── POST /diagnostics/{id}/complete ──────────────────────────────────────────

@router.post("/{session_id}/complete")
def complete_diagnostic_session(
    session_id: str,
    req: DiagnosticCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Complete a diagnostic session and run the AI analysis pipeline."""
    session = (
        db.query(DiagnosticSession).filter(
            (DiagnosticSession.session_id == session_id) |
            (DiagnosticSession.id == session_id)
        ).first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")

    battery = db.query(Battery).filter(Battery.id == session.battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    # Provide safe defaults if measurements are missing
    voltage = req.voltage_v or battery.rated_voltage_v or 400.0
    current = req.current_a or 0.0
    temperature = req.temperature_c or 25.0
    soc = req.soc_pct or 80.0
    resistance = req.internal_resistance_mohm or 10.0

    # Run AI analysis
    inp = BatteryInput(
        voltage_v=voltage,
        current_a=current,
        rated_voltage_v=battery.rated_voltage_v or 400.0,
        rated_capacity_ah=battery.rated_capacity_ah or 100.0,
        internal_resistance_mohm=resistance,
        soc_pct=soc,
        temperature_c=temperature,
        cycle_count=battery.cycle_count or 0,
        age_years=battery.age_years or 0.0,
        chemistry=battery.chemistry or "Li-ion NMC",
        measured_capacity_ah=req.measured_capacity_ah,
        charge_rate_c=req.charge_rate_c,
        discharge_rate_c=req.discharge_rate_c,
    )
    result = run_full_analysis(inp)

    # Persist analysis results
    diag_test = DiagnosticTest(
        battery_id=battery.id,
        run_by_user_id=current_user.id,
        status="complete",
        input_data=req.model_dump(),
        started_at=session.started_at or datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(diag_test)
    db.flush()

    db.add(SOHPrediction(
        battery_id=battery.id, diagnostic_test_id=diag_test.id,
        soh_pct=result.soh.soh_pct, health_status=result.soh.health_status,
        confidence_pct=result.soh.confidence_pct, method=result.soh.method,
        features_used=result.soh.features_used, prediction_notes=result.soh.notes,
    ))
    db.add(RULPrediction(
        battery_id=battery.id, diagnostic_test_id=diag_test.id,
        rul_years=result.rul.rul_years, rul_cycles=result.rul.rul_cycles,
        confidence_pct=result.rul.confidence_pct,
        degradation_projections={"6": result.rul.degradation.months_6,
                                  "12": result.rul.degradation.months_12,
                                  "24": result.rul.degradation.months_24,
                                  "36": result.rul.degradation.months_36},
    ))
    db.add(RiskAssessment(
        battery_id=battery.id, diagnostic_test_id=diag_test.id,
        risk_score=result.risk.risk_score, risk_level=result.risk.risk_level,
        risk_factors=[{"factor": f.factor, "severity": f.severity,
                       "description": f.description, "value": f.value}
                      for f in result.risk.risk_factors],
        recommended_action=result.risk.recommended_action,
    ))
    db.add(SecondLifeAssessment(
        battery_id=battery.id, diagnostic_test_id=diag_test.id,
        second_life_score=result.second_life.second_life_score,
        classification=result.second_life.classification,
        recommended_application=result.second_life.recommended_application,
        reasoning=result.second_life.reasoning,
    ))

    # Update session with results
    session.status = "COMPLETED"
    session.completed_at = datetime.utcnow()
    session.diagnostic_test_id = diag_test.id
    session.result_soh_pct = result.soh.soh_pct
    session.result_rul_years = result.rul.rul_years
    session.result_risk_level = result.risk.risk_level
    session.result_second_life_score = result.second_life.second_life_score
    session.result_second_life_class = result.second_life.classification
    session.result_recommended_action = result.recommended_action
    session.result_explanation = result.explanation_points
    session.data_quality_score = 100.0 if req.voltage_v else 60.0

    # Record lifecycle event
    db.add(BatteryLifecycleEvent(
        battery_id=battery.id,
        event_type="diagnostic_completed",
        title=f"Diagnostic Completed — {session.diagnostic_type}",
        description=f"SOH: {result.soh.soh_pct:.1f}% | Risk: {result.risk.risk_level} | {result.second_life.classification}",
        soh_at_event=result.soh.soh_pct,
        rul_at_event=result.rul.rul_years,
        risk_at_event=result.risk.risk_level,
        performed_by=current_user.id,
        details={"session_id": session.session_id, "data_source": session.data_source},
    ))

    log = AuditLog(
        user_id=current_user.id,
        action="diagnostic.completed",
        resource_type="diagnostic_session",
        resource_id=session.session_id,
        details={"soh": result.soh.soh_pct, "risk": result.risk.risk_level},
    )
    db.add(log)
    db.commit()
    return _session_dict(session)


# ── POST /diagnostics/{id}/cancel ────────────────────────────────────────────

@router.post("/{session_id}/cancel")
def cancel_diagnostic_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(DiagnosticSession).filter(
            (DiagnosticSession.session_id == session_id) |
            (DiagnosticSession.id == session_id)
        ).first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")

    session.status = "CANCELLED"
    db.commit()
    return {"message": f"Session {session.session_id} cancelled"}

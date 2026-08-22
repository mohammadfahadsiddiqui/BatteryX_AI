"""BatteryX AI – Analysis API: run full battery diagnostic"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import (Battery, BatteryReading, DiagnosticTest,
                           SOHPrediction, RULPrediction, RiskAssessment,
                           SecondLifeAssessment, AuditLog, User)
from app.models.schemas import AnalysisRequest, AnalysisResponse
from app.api.deps import get_current_user
from app.services.analysis.engine import BatteryInput, run_full_analysis

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("/{battery_id}", response_model=AnalysisResponse)
def run_analysis(
    battery_id: str,
    request: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run the full battery intelligence analysis pipeline."""
    # Look up battery by battery_id string or UUID
    battery = db.query(Battery).filter(Battery.battery_id == battery_id).first()
    if not battery:
        battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    # Save the reading
    reading = BatteryReading(
        battery_id=battery.id,
        voltage_v=request.voltage_v,
        current_a=request.current_a,
        temperature_c=request.temperature_c,
        soc_pct=request.soc_pct,
        internal_resistance_mohm=request.internal_resistance_mohm,
        capacity_ah=request.measured_capacity_ah,
        source="analysis",
    )
    db.add(reading)

    # Create diagnostic test record
    diag = DiagnosticTest(
        battery_id=battery.id,
        run_by_user_id=current_user.id,
        status="running",
        input_data=request.model_dump(),
    )
    db.add(diag)
    db.flush()

    # Run analysis engine
    inp = BatteryInput(
        voltage_v=request.voltage_v,
        current_a=request.current_a,
        rated_voltage_v=battery.rated_voltage_v or 400.0,
        rated_capacity_ah=battery.rated_capacity_ah or 100.0,
        internal_resistance_mohm=request.internal_resistance_mohm,
        soc_pct=request.soc_pct,
        temperature_c=request.temperature_c,
        cycle_count=battery.cycle_count or 0,
        age_years=battery.age_years or 0.0,
        chemistry=battery.chemistry or "Li-ion NMC",
        measured_capacity_ah=request.measured_capacity_ah,
        charge_rate_c=request.charge_rate_c,
        discharge_rate_c=request.discharge_rate_c,
    )
    result = run_full_analysis(inp)

    # Persist results
    soh_rec = SOHPrediction(
        battery_id=battery.id,
        diagnostic_test_id=diag.id,
        soh_pct=result.soh.soh_pct,
        health_status=result.soh.health_status,
        confidence_pct=result.soh.confidence_pct,
        method=result.soh.method,
        features_used=result.soh.features_used,
        prediction_notes=result.soh.notes,
    )
    db.add(soh_rec)

    rul_rec = RULPrediction(
        battery_id=battery.id,
        diagnostic_test_id=diag.id,
        rul_years=result.rul.rul_years,
        rul_cycles=result.rul.rul_cycles,
        confidence_pct=result.rul.confidence_pct,
        degradation_projections={
            "6": result.rul.degradation.months_6,
            "12": result.rul.degradation.months_12,
            "24": result.rul.degradation.months_24,
            "36": result.rul.degradation.months_36,
            "annual_rate": result.rul.degradation.annual_rate_pct,
        },
    )
    db.add(rul_rec)

    risk_rec = RiskAssessment(
        battery_id=battery.id,
        diagnostic_test_id=diag.id,
        risk_score=result.risk.risk_score,
        risk_level=result.risk.risk_level,
        risk_factors=[
            {"factor": f.factor, "severity": f.severity, "description": f.description, "value": f.value}
            for f in result.risk.risk_factors
        ],
        recommended_action=result.risk.recommended_action,
        disclaimer=result.risk.disclaimer,
    )
    db.add(risk_rec)

    sl_rec = SecondLifeAssessment(
        battery_id=battery.id,
        diagnostic_test_id=diag.id,
        second_life_score=result.second_life.second_life_score,
        classification=result.second_life.classification,
        recommended_application=result.second_life.recommended_application,
        reasoning=result.second_life.reasoning,
    )
    db.add(sl_rec)

    # Mark diagnostic complete
    diag.status = "complete"
    diag.completed_at = datetime.utcnow()

    log = AuditLog(
        user_id=current_user.id,
        action="analysis.run",
        resource_type="battery",
        resource_id=battery.battery_id,
    )
    db.add(log)
    db.commit()

    return AnalysisResponse(
        battery_id=battery.battery_id,
        diagnostic_test_id=diag.id,
        soh=result.soh.__dict__,
        rul={
            "rul_years": result.rul.rul_years,
            "rul_cycles": result.rul.rul_cycles,
            "confidence_pct": result.rul.confidence_pct,
            "degradation": result.rul.degradation.__dict__,
            "notes": result.rul.notes,
        },
        risk={
            "risk_score": result.risk.risk_score,
            "risk_level": result.risk.risk_level,
            "risk_factors": [
                {"factor": f.factor, "severity": f.severity,
                 "description": f.description, "value": f.value}
                for f in result.risk.risk_factors
            ],
            "recommended_action": result.risk.recommended_action,
            "disclaimer": result.risk.disclaimer,
        },
        second_life={
            "second_life_score": result.second_life.second_life_score,
            "classification": result.second_life.classification,
            "recommended_application": result.second_life.recommended_application,
            "reasoning": result.second_life.reasoning,
        },
        recommended_action=result.recommended_action,
        explanation_points=result.explanation_points,
        analyzed_at=datetime.utcnow(),
    )


@router.get("/{battery_id}/latest")
def get_latest_analysis(
    battery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = db.query(Battery).filter(Battery.battery_id == battery_id).first()
    if not battery:
        battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    soh = db.query(SOHPrediction).filter(SOHPrediction.battery_id == battery.id).order_by(SOHPrediction.created_at.desc()).first()
    rul = db.query(RULPrediction).filter(RULPrediction.battery_id == battery.id).order_by(RULPrediction.created_at.desc()).first()
    risk = db.query(RiskAssessment).filter(RiskAssessment.battery_id == battery.id).order_by(RiskAssessment.created_at.desc()).first()
    sl = db.query(SecondLifeAssessment).filter(SecondLifeAssessment.battery_id == battery.id).order_by(SecondLifeAssessment.created_at.desc()).first()
    reading = db.query(BatteryReading).filter(BatteryReading.battery_id == battery.id).order_by(BatteryReading.timestamp.desc()).first()

    return {
        "battery_id": battery.battery_id,
        "soh": {"soh_pct": soh.soh_pct, "health_status": soh.health_status, "confidence_pct": soh.confidence_pct, "method": soh.method, "notes": soh.prediction_notes} if soh else None,
        "rul": {"rul_years": rul.rul_years, "rul_cycles": rul.rul_cycles, "degradation_projections": rul.degradation_projections} if rul else None,
        "risk": {"risk_score": risk.risk_score, "risk_level": risk.risk_level, "risk_factors": risk.risk_factors, "recommended_action": risk.recommended_action} if risk else None,
        "second_life": {"second_life_score": sl.second_life_score, "classification": sl.classification, "recommended_application": sl.recommended_application, "reasoning": sl.reasoning} if sl else None,
        "latest_reading": {
            "voltage_v": reading.voltage_v,
            "current_a": reading.current_a,
            "temperature_c": reading.temperature_c,
            "soc_pct": reading.soc_pct,
            "internal_resistance_mohm": reading.internal_resistance_mohm,
            "timestamp": reading.timestamp,
        } if reading else None,
    }

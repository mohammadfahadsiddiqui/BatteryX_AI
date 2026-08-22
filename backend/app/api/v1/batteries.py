"""BatteryX AI – Battery CRUD API routes"""
import csv
import io
import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Battery, BatteryReading, SOHPrediction, RULPrediction, RiskAssessment, SecondLifeAssessment, DiagnosticTest, AuditLog
from app.models.schemas import BatteryCreate, BatteryUpdate, BatteryResponse, BatteryReadingCreate
from app.api.deps import get_current_user
from app.db.models import User

router = APIRouter(prefix="/batteries", tags=["Batteries"])


def _build_battery_response(battery: Battery, db: Session) -> dict:
    """Attach latest analysis results to a battery."""
    latest_soh = db.query(SOHPrediction).filter(
        SOHPrediction.battery_id == battery.id
    ).order_by(SOHPrediction.created_at.desc()).first()

    latest_rul = db.query(RULPrediction).filter(
        RULPrediction.battery_id == battery.id
    ).order_by(RULPrediction.created_at.desc()).first()

    latest_risk = db.query(RiskAssessment).filter(
        RiskAssessment.battery_id == battery.id
    ).order_by(RiskAssessment.created_at.desc()).first()

    latest_sl = db.query(SecondLifeAssessment).filter(
        SecondLifeAssessment.battery_id == battery.id
    ).order_by(SecondLifeAssessment.created_at.desc()).first()

    latest_reading = db.query(BatteryReading).filter(
        BatteryReading.battery_id == battery.id
    ).order_by(BatteryReading.timestamp.desc()).first()

    return {
        "id": battery.id,
        "battery_id": battery.battery_id,
        "manufacturer": battery.manufacturer,
        "model": battery.model,
        "chemistry": battery.chemistry,
        "rated_capacity_ah": battery.rated_capacity_ah,
        "rated_voltage_v": battery.rated_voltage_v,
        "age_years": battery.age_years,
        "cycle_count": battery.cycle_count,
        "is_demo": battery.is_demo,
        "status": battery.status,
        "notes": battery.notes,
        "created_at": battery.created_at,
        "latest_soh": latest_soh.soh_pct if latest_soh else None,
        "latest_rul": latest_rul.rul_years if latest_rul else None,
        "latest_risk": latest_risk.risk_level if latest_risk else None,
        "latest_second_life": latest_sl.classification if latest_sl else None,
        "latest_voltage": latest_reading.voltage_v if latest_reading else None,
        "latest_temperature": latest_reading.temperature_c if latest_reading else None,
    }


@router.get("", response_model=List[dict])
def list_batteries(
    search: Optional[str] = None,
    chemistry: Optional[str] = None,
    risk: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Battery)
    if search:
        query = query.filter(
            Battery.battery_id.ilike(f"%{search}%")
            | Battery.manufacturer.ilike(f"%{search}%")
            | Battery.model.ilike(f"%{search}%")
        )
    if chemistry:
        query = query.filter(Battery.chemistry == chemistry)
    if status:
        query = query.filter(Battery.status == status)
    batteries = query.offset(skip).limit(limit).all()

    result = [_build_battery_response(b, db) for b in batteries]

    # Filter by risk after enrichment
    if risk:
        result = [r for r in result if r.get("latest_risk") == risk]

    return result


@router.post("", status_code=201)
def create_battery(
    data: BatteryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Battery).filter(Battery.battery_id == data.battery_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Battery ID '{data.battery_id}' already exists")

    battery = Battery(**data.model_dump(), organization_id=current_user.organization_id)
    db.add(battery)
    log = AuditLog(user_id=current_user.id, action="battery.created",
                   resource_type="battery", resource_id=data.battery_id)
    db.add(log)
    db.commit()
    db.refresh(battery)
    return _build_battery_response(battery, db)


@router.get("/{battery_id}")
def get_battery(
    battery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = db.query(Battery).filter(Battery.battery_id == battery_id).first()
    if not battery:
        battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")
    return _build_battery_response(battery, db)


@router.put("/{battery_id}")
def update_battery(
    battery_id: str,
    data: BatteryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = db.query(Battery).filter(Battery.battery_id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(battery, key, val)
    battery.updated_at = datetime.utcnow()
    db.commit()
    return _build_battery_response(battery, db)


@router.post("/{battery_id}/telemetry")
def upload_telemetry(
    battery_id: str,
    reading: BatteryReadingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = db.query(Battery).filter(Battery.battery_id == battery_id).first()
    if not battery:
        battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    r = BatteryReading(battery_id=battery.id, **reading.model_dump())
    db.add(r)
    db.commit()
    return {"message": "Telemetry recorded", "reading_id": r.id}


@router.post("/{battery_id}/upload-csv")
async def upload_csv(
    battery_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = db.query(Battery).filter(Battery.battery_id == battery_id).first()
    if not battery:
        battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    content = await file.read()
    try:
        text = content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        records_added = 0
        for row in reader:
            r = BatteryReading(
                battery_id=battery.id,
                voltage_v=float(row.get("voltage_v", 0) or 0),
                current_a=float(row.get("current_a", 0) or 0),
                temperature_c=float(row.get("temperature_c", 0) or 0),
                soc_pct=float(row.get("soc_pct", 0) or 0),
                internal_resistance_mohm=float(row.get("internal_resistance_mohm", 0) or 0),
                source="csv",
            )
            db.add(r)
            records_added += 1
        db.commit()
        return {"message": f"Imported {records_added} readings from CSV"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {str(e)}")


@router.get("/{battery_id}/readings")
def get_readings(
    battery_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = db.query(Battery).filter(Battery.battery_id == battery_id).first()
    if not battery:
        battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    readings = db.query(BatteryReading).filter(
        BatteryReading.battery_id == battery.id
    ).order_by(BatteryReading.timestamp.desc()).limit(limit).all()

    return [
        {
            "id": r.id,
            "timestamp": r.timestamp,
            "voltage_v": r.voltage_v,
            "current_a": r.current_a,
            "temperature_c": r.temperature_c,
            "soc_pct": r.soc_pct,
            "internal_resistance_mohm": r.internal_resistance_mohm,
            "source": r.source,
        }
        for r in readings
    ]

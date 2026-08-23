"""BatteryX AI – Fleet Vehicle Management API"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import FleetVehicle, Battery, User, AuditLog
from app.api.deps import get_current_user

router = APIRouter(prefix="/fleet", tags=["Fleet"])


class VehicleCreate(BaseModel):
    vehicle_id: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    vin: Optional[str] = None
    battery_id: Optional[str] = None    # battery_id string
    notes: Optional[str] = None

class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    vin: Optional[str] = None
    battery_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


def _vehicle_dict(v: FleetVehicle, db: Session) -> dict:
    battery = db.query(Battery).filter(Battery.id == v.battery_id).first() if v.battery_id else None
    return {
        "id": v.id,
        "vehicle_id": v.vehicle_id,
        "make": v.make,
        "model": v.model,
        "year": v.year,
        "vin": v.vin,
        "battery_id_str": battery.battery_id if battery else None,
        "battery_soh": None,   # enriched later if needed
        "organization_id": v.organization_id,
        "status": v.status,
        "notes": v.notes,
        "created_at": v.created_at,
    }


@router.get("/vehicles", response_model=List[dict])
def list_vehicles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicles = db.query(FleetVehicle).offset(skip).limit(limit).all()
    return [_vehicle_dict(v, db) for v in vehicles]


@router.post("/vehicles", status_code=201)
def create_vehicle(
    req: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(FleetVehicle).filter(FleetVehicle.vehicle_id == req.vehicle_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Vehicle '{req.vehicle_id}' already exists")

    battery = None
    if req.battery_id:
        battery = (
            db.query(Battery).filter(Battery.battery_id == req.battery_id).first()
            or db.query(Battery).filter(Battery.id == req.battery_id).first()
        )

    vehicle = FleetVehicle(
        vehicle_id=req.vehicle_id,
        make=req.make,
        model=req.model,
        year=req.year,
        vin=req.vin,
        battery_id=battery.id if battery else None,
        organization_id=current_user.organization_id,
        notes=req.notes,
    )
    db.add(vehicle)
    db.add(AuditLog(
        user_id=current_user.id,
        action="fleet.vehicle_created",
        resource_type="fleet_vehicle",
        resource_id=req.vehicle_id,
    ))
    db.commit()
    db.refresh(vehicle)
    return _vehicle_dict(vehicle, db)


@router.put("/vehicles/{vehicle_id}")
def update_vehicle(
    vehicle_id: str,
    req: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = (
        db.query(FleetVehicle).filter(
            (FleetVehicle.vehicle_id == vehicle_id) | (FleetVehicle.id == vehicle_id)
        ).first()
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = req.model_dump(exclude_none=True)

    # Resolve battery_id string to UUID
    if "battery_id" in update_data:
        batt_str = update_data.pop("battery_id")
        battery = (
            db.query(Battery).filter(Battery.battery_id == batt_str).first()
            or db.query(Battery).filter(Battery.id == batt_str).first()
        )
        if battery:
            vehicle.battery_id = battery.id

    for k, v in update_data.items():
        setattr(vehicle, k, v)

    db.commit()
    return _vehicle_dict(vehicle, db)


@router.get("/stats")
def get_fleet_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fleet-level KPIs."""
    from app.db.models import SOHPrediction, RiskAssessment
    vehicles = db.query(FleetVehicle).all()
    total = len(vehicles)
    batteries_assigned = sum(1 for v in vehicles if v.battery_id)

    # Average SOH across fleet batteries
    soh_values = []
    high_risk = 0
    for v in vehicles:
        if v.battery_id:
            soh = db.query(SOHPrediction).filter(
                SOHPrediction.battery_id == v.battery_id
            ).order_by(SOHPrediction.created_at.desc()).first()
            if soh:
                soh_values.append(soh.soh_pct)
            risk = db.query(RiskAssessment).filter(
                RiskAssessment.battery_id == v.battery_id
            ).order_by(RiskAssessment.created_at.desc()).first()
            if risk and risk.risk_level in ("HIGH", "CRITICAL"):
                high_risk += 1

    return {
        "total_vehicles": total,
        "batteries_assigned": batteries_assigned,
        "average_soh": round(sum(soh_values) / len(soh_values), 1) if soh_values else None,
        "high_risk_batteries": high_risk,
    }

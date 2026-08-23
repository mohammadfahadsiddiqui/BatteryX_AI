"""BatteryX AI – Battery Lifecycle Events API"""
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import BatteryLifecycleEvent, Battery, User, AuditLog
from app.api.deps import get_current_user

router = APIRouter(prefix="/lifecycle", tags=["Lifecycle"])


class LifecycleEventCreate(BaseModel):
    event_type: str   # manufactured, installed, monitoring_started, diagnostic_completed,
                      # degradation_detected, second_life_candidate, retired, recycled
    title: str
    description: Optional[str] = None
    soh_at_event: Optional[float] = None
    rul_at_event: Optional[float] = None
    risk_at_event: Optional[str] = None
    details: Optional[dict] = None


def _event_dict(e: BatteryLifecycleEvent) -> dict:
    return {
        "id": e.id,
        "battery_id": e.battery_id,
        "event_type": e.event_type,
        "title": e.title,
        "description": e.description,
        "soh_at_event": e.soh_at_event,
        "rul_at_event": e.rul_at_event,
        "risk_at_event": e.risk_at_event,
        "performed_by": e.performed_by,
        "details": e.details,
        "event_date": e.event_date,
    }


@router.get("/{battery_id}")
def get_lifecycle_events(
    battery_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = (
        db.query(Battery).filter(Battery.battery_id == battery_id).first()
        or db.query(Battery).filter(Battery.id == battery_id).first()
    )
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    events = (
        db.query(BatteryLifecycleEvent)
        .filter(BatteryLifecycleEvent.battery_id == battery.id)
        .order_by(BatteryLifecycleEvent.event_date.desc())
        .limit(limit)
        .all()
    )
    return {
        "battery_id": battery.battery_id,
        "battery_manufacturer": battery.manufacturer,
        "battery_model": battery.model,
        "events": [_event_dict(e) for e in events],
    }


@router.post("/{battery_id}/event", status_code=201)
def record_lifecycle_event(
    battery_id: str,
    req: LifecycleEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = (
        db.query(Battery).filter(Battery.battery_id == battery_id).first()
        or db.query(Battery).filter(Battery.id == battery_id).first()
    )
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    event = BatteryLifecycleEvent(
        battery_id=battery.id,
        event_type=req.event_type,
        title=req.title,
        description=req.description,
        soh_at_event=req.soh_at_event,
        rul_at_event=req.rul_at_event,
        risk_at_event=req.risk_at_event,
        performed_by=current_user.id,
        details=req.details,
    )
    db.add(event)

    log = AuditLog(
        user_id=current_user.id,
        action="lifecycle.event_recorded",
        resource_type="battery",
        resource_id=battery.battery_id,
        details={"event_type": req.event_type, "title": req.title},
    )
    db.add(log)
    db.commit()
    db.refresh(event)
    return _event_dict(event)

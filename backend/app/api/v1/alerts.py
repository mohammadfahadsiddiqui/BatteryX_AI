"""BatteryX AI – Battery Alerts API"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import BatteryAlert, Battery, User, AuditLog
from app.api.deps import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def _alert_dict(a: BatteryAlert, battery_id_str: Optional[str] = None) -> dict:
    return {
        "id": a.id,
        "alert_id": a.alert_id,
        "battery_id": a.battery_id,
        "battery_id_str": battery_id_str,
        "device_id": a.device_id,
        "alert_type": a.alert_type,
        "severity": a.severity,
        "message": a.message,
        "triggered_value": a.triggered_value,
        "threshold_value": a.threshold_value,
        "unit": a.unit,
        "source": a.source,
        "status": a.status,
        "acknowledged_by": a.acknowledged_by,
        "acknowledged_at": a.acknowledged_at,
        "resolved_at": a.resolved_at,
        "resolution_notes": a.resolution_notes,
        "is_demo": a.is_demo,
        "created_at": a.created_at,
    }


@router.get("", response_model=List[dict])
def list_alerts(
    battery_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    alert_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(BatteryAlert)
    if battery_id:
        battery = (
            db.query(Battery).filter(Battery.battery_id == battery_id).first()
            or db.query(Battery).filter(Battery.id == battery_id).first()
        )
        if battery:
            q = q.filter(BatteryAlert.battery_id == battery.id)
    if severity:
        q = q.filter(BatteryAlert.severity == severity)
    if status:
        q = q.filter(BatteryAlert.status == status)
    if alert_type:
        q = q.filter(BatteryAlert.alert_type == alert_type)

    alerts = q.order_by(BatteryAlert.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for a in alerts:
        battery = db.query(Battery).filter(Battery.id == a.battery_id).first()
        result.append(_alert_dict(a, battery.battery_id if battery else None))
    return result


@router.get("/count")
def get_alert_count(
    status: str = "ACTIVE",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get count of active alerts — used for sidebar badge."""
    count = db.query(BatteryAlert).filter(BatteryAlert.status == status).count()
    critical = db.query(BatteryAlert).filter(
        BatteryAlert.status == status,
        BatteryAlert.severity == "CRITICAL"
    ).count()
    return {"total": count, "critical": critical}


@router.get("/{alert_id}")
def get_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = (
        db.query(BatteryAlert).filter(
            (BatteryAlert.alert_id == alert_id) | (BatteryAlert.id == alert_id)
        ).first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    battery = db.query(Battery).filter(Battery.id == alert.battery_id).first()
    return _alert_dict(alert, battery.battery_id if battery else None)


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = (
        db.query(BatteryAlert).filter(
            (BatteryAlert.alert_id == alert_id) | (BatteryAlert.id == alert_id)
        ).first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    return {"message": f"Alert {alert.alert_id} acknowledged"}


class ResolveRequest(BaseModel):
    resolution_notes: Optional[str] = None

@router.post("/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    req: ResolveRequest = ResolveRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = (
        db.query(BatteryAlert).filter(
            (BatteryAlert.alert_id == alert_id) | (BatteryAlert.id == alert_id)
        ).first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.utcnow()
    alert.resolution_notes = req.resolution_notes

    log = AuditLog(
        user_id=current_user.id,
        action="alert.resolved",
        resource_type="battery_alert",
        resource_id=alert.alert_id,
    )
    db.add(log)
    db.commit()
    return {"message": f"Alert {alert.alert_id} resolved"}

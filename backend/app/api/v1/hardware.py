"""BatteryX AI – Hardware Device Management API"""
import secrets
import hashlib
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import HardwareDevice, DeviceEvent, Battery, AuditLog, User
from app.api.deps import get_current_user

router = APIRouter(prefix="/hardware/devices", tags=["Hardware"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class DeviceRegisterRequest(BaseModel):
    device_id: str
    name: str
    device_type: str = "ESP32"      # ESP32, Raspberry Pi, Industrial Gateway, BMS Gateway, CAN Gateway
    connection_type: str = "WiFi"
    firmware_version: Optional[str] = None
    telemetry_rate_hz: float = 1.0
    notes: Optional[str] = None

class DeviceAuthRequest(BaseModel):
    device_id: str
    auth_token: str

class DeviceUpdateRequest(BaseModel):
    name: Optional[str] = None
    firmware_version: Optional[str] = None
    telemetry_rate_hz: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class DeviceAssignRequest(BaseModel):
    battery_id: str    # battery_id string (e.g. BX-2026-00124) or UUID


def _device_dict(d: HardwareDevice) -> dict:
    return {
        "id": d.id,
        "device_id": d.device_id,
        "name": d.name,
        "device_type": d.device_type,
        "status": d.status,
        "firmware_version": d.firmware_version,
        "connection_type": d.connection_type,
        "signal_strength_dbm": d.signal_strength_dbm,
        "telemetry_rate_hz": d.telemetry_rate_hz,
        "battery_id": d.battery_id,
        "organization_id": d.organization_id,
        "is_active": d.is_active,
        "last_seen": d.last_seen,
        "last_telemetry_at": d.last_telemetry_at,
        "ip_address": d.ip_address,
        "mac_address": d.mac_address,
        "notes": d.notes,
        "created_at": d.created_at,
    }


# ── Register Device ───────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register_device(
    req: DeviceRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new hardware device (ESP32, gateway, etc.)."""
    existing = db.query(HardwareDevice).filter(HardwareDevice.device_id == req.device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Device '{req.device_id}' already registered")

    # Generate a secure auth token for the device
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    device = HardwareDevice(
        device_id=req.device_id,
        name=req.name,
        device_type=req.device_type,
        connection_type=req.connection_type,
        firmware_version=req.firmware_version,
        telemetry_rate_hz=req.telemetry_rate_hz,
        notes=req.notes,
        organization_id=current_user.organization_id,
        auth_token=raw_token,           # stored temporarily for response only
        device_token_hash=token_hash,
        status="OFFLINE",
        is_active=True,
    )
    db.add(device)

    event = DeviceEvent(
        device_id=device.id,
        event_type="registered",
        severity="INFO",
        message=f"Device registered by {current_user.email}",
    )
    db.add(event)

    log = AuditLog(
        user_id=current_user.id,
        action="hardware.registered",
        resource_type="hardware_device",
        resource_id=req.device_id,
    )
    db.add(log)
    db.commit()
    db.refresh(device)

    result = _device_dict(device)
    result["auth_token"] = raw_token   # return once at registration
    return result


# ── Authenticate Device ───────────────────────────────────────────────────────

@router.post("/authenticate")
def authenticate_device(
    req: DeviceAuthRequest,
    db: Session = Depends(get_db),
):
    """Device authenticates itself and gets a session token (called by firmware)."""
    device = db.query(HardwareDevice).filter(
        HardwareDevice.device_id == req.device_id,
        HardwareDevice.is_active == True,
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found or inactive")

    # Compare provided token against stored hash
    provided_hash = hashlib.sha256(req.auth_token.encode()).hexdigest()
    if provided_hash != device.device_token_hash:
        raise HTTPException(status_code=401, detail="Invalid device credentials")

    # Mark device online
    device.status = "CONNECTED"
    device.last_seen = datetime.utcnow()

    event = DeviceEvent(
        device_id=device.id,
        event_type="authenticated",
        severity="INFO",
        message="Device authenticated successfully",
    )
    db.add(event)
    db.commit()

    return {
        "device_id": device.device_id,
        "status": "authenticated",
        "battery_id": device.battery_id,
        "telemetry_rate_hz": device.telemetry_rate_hz,
    }


# ── List Devices ──────────────────────────────────────────────────────────────

@router.get("", response_model=List[dict])
def list_devices(
    device_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(HardwareDevice)
    if device_type:
        q = q.filter(HardwareDevice.device_type == device_type)
    if status:
        q = q.filter(HardwareDevice.status == status)
    devices = q.offset(skip).limit(limit).all()
    return [_device_dict(d) for d in devices]


# ── Get Device ────────────────────────────────────────────────────────────────

@router.get("/{device_id}")
def get_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(HardwareDevice).filter(
        (HardwareDevice.device_id == device_id) | (HardwareDevice.id == device_id)
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return _device_dict(device)


# ── Update Device ─────────────────────────────────────────────────────────────

@router.put("/{device_id}")
def update_device(
    device_id: str,
    data: DeviceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(HardwareDevice).filter(
        (HardwareDevice.device_id == device_id) | (HardwareDevice.id == device_id)
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    for k, v in data.model_dump(exclude_none=True).items():
        setattr(device, k, v)
    device.updated_at = datetime.utcnow()
    db.commit()
    return _device_dict(device)


# ── Assign Device to Battery ──────────────────────────────────────────────────

@router.post("/{device_id}/assign")
def assign_device(
    device_id: str,
    req: DeviceAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(HardwareDevice).filter(
        (HardwareDevice.device_id == device_id) | (HardwareDevice.id == device_id)
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    battery = (
        db.query(Battery).filter(Battery.battery_id == req.battery_id).first()
        or db.query(Battery).filter(Battery.id == req.battery_id).first()
    )
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    device.battery_id = battery.id
    event = DeviceEvent(
        device_id=device.id,
        event_type="assigned",
        severity="INFO",
        message=f"Assigned to battery {battery.battery_id}",
    )
    db.add(event)

    log = AuditLog(
        user_id=current_user.id,
        action="hardware.assigned",
        resource_type="hardware_device",
        resource_id=device.device_id,
        details={"battery_id": battery.battery_id},
    )
    db.add(log)
    db.commit()
    return {"message": f"Device {device.device_id} assigned to battery {battery.battery_id}"}


# ── Deactivate Device ─────────────────────────────────────────────────────────

@router.post("/{device_id}/deactivate")
def deactivate_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(HardwareDevice).filter(
        (HardwareDevice.device_id == device_id) | (HardwareDevice.id == device_id)
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.is_active = False
    device.status = "MAINTENANCE"

    event = DeviceEvent(
        device_id=device.id,
        event_type="deactivated",
        severity="WARNING",
        message=f"Deactivated by {current_user.email}",
    )
    db.add(event)
    db.commit()
    return {"message": f"Device {device.device_id} deactivated"}


# ── Device Status ─────────────────────────────────────────────────────────────

@router.get("/{device_id}/status")
def get_device_status(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(HardwareDevice).filter(
        (HardwareDevice.device_id == device_id) | (HardwareDevice.id == device_id)
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Consider offline if last seen > 60 seconds ago
    is_online = False
    seconds_since = None
    if device.last_seen:
        seconds_since = (datetime.utcnow() - device.last_seen).total_seconds()
        is_online = seconds_since < 60

    return {
        "device_id": device.device_id,
        "status": device.status,
        "is_online": is_online,
        "last_seen": device.last_seen,
        "seconds_since_last_seen": seconds_since,
        "firmware_version": device.firmware_version,
        "signal_strength_dbm": device.signal_strength_dbm,
        "telemetry_rate_hz": device.telemetry_rate_hz,
        "last_telemetry_at": device.last_telemetry_at,
    }


# ── Device Events ─────────────────────────────────────────────────────────────

@router.get("/{device_id}/events")
def get_device_events(
    device_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(HardwareDevice).filter(
        (HardwareDevice.device_id == device_id) | (HardwareDevice.id == device_id)
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    events = (
        db.query(DeviceEvent)
        .filter(DeviceEvent.device_id == device.id)
        .order_by(DeviceEvent.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "severity": e.severity,
            "message": e.message,
            "details": e.details,
            "timestamp": e.timestamp,
        }
        for e in events
    ]

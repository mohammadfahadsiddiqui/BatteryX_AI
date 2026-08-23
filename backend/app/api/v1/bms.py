"""BatteryX AI – BMS Device Management API"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import BMSDevice, Battery, HardwareDevice, User, AuditLog
from app.api.deps import get_current_user

router = APIRouter(prefix="/bms", tags=["BMS"])


class BMSDeviceCreate(BaseModel):
    bms_id: str
    name: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    firmware_version: Optional[str] = None
    protocol: Optional[str] = None          # CAN, Modbus, UART, proprietary
    adapter_class: Optional[str] = None     # Python adapter class name
    battery_id: Optional[str] = None
    hardware_device_id: Optional[str] = None
    configuration: Optional[dict] = None    # CAN IDs, byte maps, etc.

class BMSDeviceUpdate(BaseModel):
    name: Optional[str] = None
    firmware_version: Optional[str] = None
    status: Optional[str] = None
    configuration: Optional[dict] = None


def _bms_dict(b: BMSDevice, db: Session) -> dict:
    battery = db.query(Battery).filter(Battery.id == b.battery_id).first() if b.battery_id else None
    return {
        "id": b.id,
        "bms_id": b.bms_id,
        "name": b.name,
        "manufacturer": b.manufacturer,
        "model": b.model,
        "firmware_version": b.firmware_version,
        "protocol": b.protocol,
        "adapter_class": b.adapter_class,
        "battery_id_str": battery.battery_id if battery else None,
        "hardware_device_id": b.hardware_device_id,
        "status": b.status,
        "last_seen": b.last_seen,
        "is_active": b.is_active,
        "created_at": b.created_at,
    }


@router.get("/devices", response_model=List[dict])
def list_bms_devices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    devices = db.query(BMSDevice).offset(skip).limit(limit).all()
    return [_bms_dict(d, db) for d in devices]


@router.post("/devices", status_code=201)
def register_bms_device(
    req: BMSDeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(BMSDevice).filter(BMSDevice.bms_id == req.bms_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"BMS device '{req.bms_id}' already registered")

    battery = None
    if req.battery_id:
        battery = (
            db.query(Battery).filter(Battery.battery_id == req.battery_id).first()
            or db.query(Battery).filter(Battery.id == req.battery_id).first()
        )

    hw_device = None
    if req.hardware_device_id:
        hw_device = (
            db.query(HardwareDevice).filter(
                (HardwareDevice.device_id == req.hardware_device_id) |
                (HardwareDevice.id == req.hardware_device_id)
            ).first()
        )

    device = BMSDevice(
        bms_id=req.bms_id,
        name=req.name,
        manufacturer=req.manufacturer,
        model=req.model,
        firmware_version=req.firmware_version,
        protocol=req.protocol,
        adapter_class=req.adapter_class,
        battery_id=battery.id if battery else None,
        hardware_device_id=hw_device.id if hw_device else None,
        configuration=req.configuration,
        status="OFFLINE",
        is_active=True,
    )
    db.add(device)
    db.add(AuditLog(
        user_id=current_user.id,
        action="bms.device_registered",
        resource_type="bms_device",
        resource_id=req.bms_id,
    ))
    db.commit()
    db.refresh(device)
    return _bms_dict(device, db)


@router.get("/devices/{bms_id}")
def get_bms_device(
    bms_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = (
        db.query(BMSDevice).filter(
            (BMSDevice.bms_id == bms_id) | (BMSDevice.id == bms_id)
        ).first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="BMS device not found")
    return _bms_dict(device, db)


@router.put("/devices/{bms_id}")
def update_bms_device(
    bms_id: str,
    req: BMSDeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = (
        db.query(BMSDevice).filter(
            (BMSDevice.bms_id == bms_id) | (BMSDevice.id == bms_id)
        ).first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="BMS device not found")

    for k, v in req.model_dump(exclude_none=True).items():
        setattr(device, k, v)
    db.commit()
    return _bms_dict(device, db)

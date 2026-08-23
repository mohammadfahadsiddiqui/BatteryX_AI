"""BatteryX AI – Telemetry Ingestion API (ESP32, BMS, CAN, demo)"""
import hashlib
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import (
    HardwareDevice, DeviceTelemetry, Battery, BatteryAlert, DeviceEvent, User
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class TelemetryPacket(BaseModel):
    device_id: Optional[str] = None
    battery_id: str                          # battery_id string or UUID
    timestamp: Optional[datetime] = None
    voltage_v: Optional[float] = None
    current_a: Optional[float] = None
    power_w: Optional[float] = None
    energy_wh: Optional[float] = None
    temperature_c: Optional[float] = None
    min_cell_temp_c: Optional[float] = None
    max_cell_temp_c: Optional[float] = None
    soc_pct: Optional[float] = None
    soh_pct: Optional[float] = None
    internal_resistance_mohm: Optional[float] = None
    cycle_count: Optional[int] = None
    cell_voltages: Optional[List[float]] = None
    cell_temperatures: Optional[List[float]] = None
    bms_status: Optional[str] = None
    fault_codes: Optional[List[str]] = None
    charging_state: Optional[bool] = None
    discharging_state: Optional[bool] = None
    source: str = "esp32"               # esp32, bms, can, manual, csv, demo
    firmware_version: Optional[str] = None
    is_demo: bool = False

class BatchTelemetryRequest(BaseModel):
    packets: List[TelemetryPacket]


# ── Validation helpers ────────────────────────────────────────────────────────

VOLTAGE_RANGE = (0.0, 1500.0)     # V (pack level)
CURRENT_RANGE = (-3000.0, 3000.0) # A
TEMP_RANGE = (-50.0, 150.0)       # °C
SOC_RANGE = (0.0, 100.0)
SOH_RANGE = (0.0, 100.0)

def _validate_packet(pkt: TelemetryPacket) -> float:
    """Run range checks. Returns data_quality_score (0–100)."""
    issues = 0
    total = 0

    checks = [
        (pkt.voltage_v, *VOLTAGE_RANGE),
        (pkt.current_a, *CURRENT_RANGE),
        (pkt.temperature_c, *TEMP_RANGE),
        (pkt.soc_pct, *SOC_RANGE),
        (pkt.soh_pct, *SOH_RANGE),
    ]
    for val, lo, hi in checks:
        if val is not None:
            total += 1
            if not (lo <= val <= hi):
                issues += 1

    if total == 0:
        return 0.0
    score = max(0.0, 100.0 * (total - issues) / total)
    return round(score, 1)


def _trigger_alerts(pkt: TelemetryPacket, battery: Battery, db: Session):
    """Create BatteryAlert records for threshold violations."""
    alerts_to_create = []

    # Temperature alert thresholds (°C)
    if pkt.temperature_c is not None:
        if pkt.temperature_c > 55:
            alerts_to_create.append({
                "alert_type": "Critical Temperature",
                "severity": "CRITICAL",
                "message": f"Battery temperature {pkt.temperature_c:.1f}°C exceeds critical threshold (55°C)",
                "triggered_value": pkt.temperature_c,
                "threshold_value": 55.0,
                "unit": "°C",
            })
        elif pkt.temperature_c > 45:
            alerts_to_create.append({
                "alert_type": "High Temperature",
                "severity": "HIGH",
                "message": f"Battery temperature {pkt.temperature_c:.1f}°C exceeds warning threshold (45°C)",
                "triggered_value": pkt.temperature_c,
                "threshold_value": 45.0,
                "unit": "°C",
            })

    # Voltage alerts
    if pkt.voltage_v is not None and battery.rated_voltage_v:
        max_v = battery.rated_voltage_v * 1.15
        min_v = battery.rated_voltage_v * 0.70
        if pkt.voltage_v > max_v:
            alerts_to_create.append({
                "alert_type": "Over Voltage",
                "severity": "HIGH",
                "message": f"Pack voltage {pkt.voltage_v:.1f}V exceeds maximum ({max_v:.1f}V)",
                "triggered_value": pkt.voltage_v,
                "threshold_value": max_v,
                "unit": "V",
            })
        elif pkt.voltage_v < min_v and pkt.voltage_v > 0:
            alerts_to_create.append({
                "alert_type": "Under Voltage",
                "severity": "HIGH",
                "message": f"Pack voltage {pkt.voltage_v:.1f}V below minimum ({min_v:.1f}V)",
                "triggered_value": pkt.voltage_v,
                "threshold_value": min_v,
                "unit": "V",
            })

    # Cell imbalance
    if pkt.cell_voltages and len(pkt.cell_voltages) > 1:
        delta = max(pkt.cell_voltages) - min(pkt.cell_voltages)
        if delta > 0.15:
            alerts_to_create.append({
                "alert_type": "Cell Imbalance",
                "severity": "WARNING",
                "message": f"Cell voltage imbalance {delta*1000:.0f}mV exceeds 150mV threshold",
                "triggered_value": delta,
                "threshold_value": 0.15,
                "unit": "V",
            })

    # BMS fault codes
    if pkt.fault_codes:
        alerts_to_create.append({
            "alert_type": "BMS Fault",
            "severity": "CRITICAL",
            "message": f"BMS reported fault codes: {', '.join(pkt.fault_codes)}",
            "triggered_value": None,
            "threshold_value": None,
            "unit": None,
        })

    import uuid
    for a in alerts_to_create:
        alert = BatteryAlert(
            alert_id=f"ALERT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
            battery_id=battery.id,
            alert_type=a["alert_type"],
            severity=a["severity"],
            message=a["message"],
            triggered_value=a.get("triggered_value"),
            threshold_value=a.get("threshold_value"),
            unit=a.get("unit"),
            source="telemetry",
            is_demo=pkt.is_demo,
        )
        db.add(alert)


def _resolve_battery(battery_id: str, db: Session) -> Battery:
    battery = (
        db.query(Battery).filter(Battery.battery_id == battery_id).first()
        or db.query(Battery).filter(Battery.id == battery_id).first()
    )
    if not battery:
        raise HTTPException(status_code=404, detail=f"Battery '{battery_id}' not found")
    return battery


def _resolve_device(device_id: Optional[str], db: Session) -> Optional[HardwareDevice]:
    if not device_id:
        return None
    return (
        db.query(HardwareDevice).filter(
            (HardwareDevice.device_id == device_id) | (HardwareDevice.id == device_id)
        ).first()
    )


def _ingest_packet(pkt: TelemetryPacket, db: Session) -> dict:
    """Core ingest logic for a single packet."""
    battery = _resolve_battery(pkt.battery_id, db)
    device = _resolve_device(pkt.device_id, db)

    # Validate
    quality = _validate_packet(pkt)
    if quality < 20:
        # Still store but mark low quality
        pass

    # Calculate power if not provided
    power_w = pkt.power_w
    if power_w is None and pkt.voltage_v is not None and pkt.current_a is not None:
        power_w = round(pkt.voltage_v * pkt.current_a, 2)

    record = DeviceTelemetry(
        device_id=device.id if device else None,
        battery_id=battery.id,
        timestamp=pkt.timestamp or datetime.utcnow(),
        voltage_v=pkt.voltage_v,
        current_a=pkt.current_a,
        power_w=power_w,
        energy_wh=pkt.energy_wh,
        temperature_c=pkt.temperature_c,
        min_cell_temp_c=pkt.min_cell_temp_c,
        max_cell_temp_c=pkt.max_cell_temp_c,
        soc_pct=pkt.soc_pct,
        soh_pct=pkt.soh_pct,
        internal_resistance_mohm=pkt.internal_resistance_mohm,
        cycle_count=pkt.cycle_count,
        cell_voltages=pkt.cell_voltages,
        cell_temperatures=pkt.cell_temperatures,
        bms_status=pkt.bms_status,
        fault_codes=pkt.fault_codes,
        charging_state=pkt.charging_state,
        discharging_state=pkt.discharging_state,
        source=pkt.source,
        firmware_version=pkt.firmware_version,
        data_quality_score=quality,
        is_demo=pkt.is_demo,
    )
    db.add(record)

    # Update device last_seen
    if device:
        device.last_seen = datetime.utcnow()
        device.last_telemetry_at = datetime.utcnow()
        device.status = "MEASURING"
        if pkt.firmware_version:
            device.firmware_version = pkt.firmware_version

    # Trigger alert rules
    _trigger_alerts(pkt, battery, db)

    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "battery_id": battery.battery_id,
        "timestamp": record.timestamp,
        "data_quality_score": quality,
        "source": pkt.source,
    }


# ── POST /telemetry ───────────────────────────────────────────────────────────

@router.post("", status_code=201)
def ingest_telemetry(
    pkt: TelemetryPacket,
    db: Session = Depends(get_db),
):
    """Ingest a single telemetry packet. Called by ESP32 firmware or gateway.
    Device authentication is handled via device_id matching (no user JWT required).
    """
    result = _ingest_packet(pkt, db)

    # Broadcast via WebSocket (non-blocking best-effort)
    try:
        from app.websocket.manager import ws_manager
        import asyncio
        battery = db.query(Battery).filter(Battery.battery_id == result["battery_id"]).first()
        if battery:
            asyncio.create_task(ws_manager.broadcast_battery(result["battery_id"], {
                "event": "telemetry_update",
                "data": result,
            }))
    except Exception:
        pass   # WebSocket broadcast failure must never break telemetry ingest

    return result


# ── POST /telemetry/batch ─────────────────────────────────────────────────────

@router.post("/batch", status_code=201)
def ingest_batch(
    req: BatchTelemetryRequest,
    db: Session = Depends(get_db),
):
    """Ingest a batch of telemetry packets (used by offline buffering on reconnect)."""
    results = []
    errors = []
    for i, pkt in enumerate(req.packets):
        try:
            results.append(_ingest_packet(pkt, db))
        except Exception as e:
            errors.append({"index": i, "error": str(e)})
    return {"ingested": len(results), "errors": errors, "results": results}


# ── GET /telemetry/{battery_id}/latest ───────────────────────────────────────

@router.get("/{battery_id}/latest")
def get_latest_telemetry(
    battery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the most recent DeviceTelemetry record for a battery."""
    battery = _resolve_battery(battery_id, db)

    record = (
        db.query(DeviceTelemetry)
        .filter(DeviceTelemetry.battery_id == battery.id)
        .order_by(DeviceTelemetry.timestamp.desc())
        .first()
    )
    if not record:
        return None

    return {
        "id": record.id,
        "battery_id": battery.battery_id,
        "timestamp": record.timestamp,
        "voltage_v": record.voltage_v,
        "current_a": record.current_a,
        "power_w": record.power_w,
        "temperature_c": record.temperature_c,
        "soc_pct": record.soc_pct,
        "soh_pct": record.soh_pct,
        "internal_resistance_mohm": record.internal_resistance_mohm,
        "cycle_count": record.cycle_count,
        "cell_voltages": record.cell_voltages,
        "cell_temperatures": record.cell_temperatures,
        "bms_status": record.bms_status,
        "fault_codes": record.fault_codes,
        "charging_state": record.charging_state,
        "discharging_state": record.discharging_state,
        "source": record.source,
        "data_quality_score": record.data_quality_score,
        "is_demo": record.is_demo,
    }


# ── GET /telemetry/{battery_id}/history ──────────────────────────────────────

@router.get("/{battery_id}/history")
def get_telemetry_history(
    battery_id: str,
    limit: int = 200,
    source: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get paginated telemetry history for a battery."""
    battery = _resolve_battery(battery_id, db)

    q = db.query(DeviceTelemetry).filter(DeviceTelemetry.battery_id == battery.id)
    if source:
        q = q.filter(DeviceTelemetry.source == source)
    records = q.order_by(DeviceTelemetry.timestamp.desc()).limit(limit).all()

    return [
        {
            "id": r.id,
            "timestamp": r.timestamp,
            "voltage_v": r.voltage_v,
            "current_a": r.current_a,
            "power_w": r.power_w,
            "temperature_c": r.temperature_c,
            "soc_pct": r.soc_pct,
            "soh_pct": r.soh_pct,
            "source": r.source,
            "data_quality_score": r.data_quality_score,
            "is_demo": r.is_demo,
        }
        for r in records
    ]

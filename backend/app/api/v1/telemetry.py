"""BatteryX AI – Telemetry ingestion API."""
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Battery, BatteryAlert, BatteryReading, DeviceTelemetry, HardwareDevice, User
from app.db.session import get_db

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


class TelemetryPacket(BaseModel):
    device_id: Optional[str] = None
    battery_id: str
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
    source: str = "esp32"
    firmware_version: Optional[str] = None
    is_demo: bool = False


class BatchTelemetryRequest(BaseModel):
    packets: List[TelemetryPacket]


VOLTAGE_RANGE = (0.0, 1500.0)
CURRENT_RANGE = (-3000.0, 3000.0)
TEMP_RANGE = (-50.0, 150.0)
SOC_RANGE = (0.0, 100.0)
SOH_RANGE = (0.0, 100.0)


def _validate_packet(pkt: TelemetryPacket) -> float:
    checks = [
        (pkt.voltage_v, *VOLTAGE_RANGE),
        (pkt.current_a, *CURRENT_RANGE),
        (pkt.temperature_c, *TEMP_RANGE),
        (pkt.soc_pct, *SOC_RANGE),
        (pkt.soh_pct, *SOH_RANGE),
    ]
    present = [(v, lo, hi) for v, lo, hi in checks if v is not None]
    if not present:
        return 0.0
    valid = sum(1 for value, lo, hi in present if lo <= value <= hi)
    return round(100.0 * valid / len(present), 1)


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
        db.query(HardwareDevice).filter(HardwareDevice.device_id == device_id).first()
        or db.query(HardwareDevice).filter(HardwareDevice.id == device_id).first()
    )


def _trigger_alerts(pkt: TelemetryPacket, battery: Battery, device: Optional[HardwareDevice], db: Session) -> list[BatteryAlert]:
    alerts: list[BatteryAlert] = []

    if pkt.temperature_c is not None:
        if pkt.temperature_c > 55:
            alerts.append(BatteryAlert(
                alert_id=f"ALERT-{uuid4().hex[:12].upper()}",
                battery_id=battery.id,
                device_id=device.id if device else None,
                alert_type="Critical Temperature",
                severity="CRITICAL",
                message=f"Battery temperature {pkt.temperature_c:.1f}°C exceeds prototype critical threshold of 55°C",
                triggered_value=pkt.temperature_c,
                threshold_value=55.0,
                unit="°C",
                source="telemetry",
                is_demo=pkt.is_demo,
            ))
        elif pkt.temperature_c > 45:
            alerts.append(BatteryAlert(
                alert_id=f"ALERT-{uuid4().hex[:12].upper()}",
                battery_id=battery.id,
                device_id=device.id if device else None,
                alert_type="High Temperature",
                severity="HIGH",
                message=f"Battery temperature {pkt.temperature_c:.1f}°C exceeds prototype warning threshold of 45°C",
                triggered_value=pkt.temperature_c,
                threshold_value=45.0,
                unit="°C",
                source="telemetry",
                is_demo=pkt.is_demo,
            ))

    if pkt.cell_voltages and len(pkt.cell_voltages) > 1:
        delta = max(pkt.cell_voltages) - min(pkt.cell_voltages)
        if delta > 0.15:
            alerts.append(BatteryAlert(
                alert_id=f"ALERT-{uuid4().hex[:12].upper()}",
                battery_id=battery.id,
                device_id=device.id if device else None,
                alert_type="Cell Imbalance",
                severity="WARNING",
                message=f"Cell voltage delta {delta * 1000:.0f} mV exceeds prototype threshold of 150 mV",
                triggered_value=delta,
                threshold_value=0.15,
                unit="V",
                source="telemetry",
                is_demo=pkt.is_demo,
            ))

    if pkt.fault_codes:
        alerts.append(BatteryAlert(
            alert_id=f"ALERT-{uuid4().hex[:12].upper()}",
            battery_id=battery.id,
            device_id=device.id if device else None,
            alert_type="BMS Fault",
            severity="CRITICAL",
            message=f"BMS reported fault codes: {', '.join(pkt.fault_codes)}",
            source="bms",
            is_demo=pkt.is_demo,
        ))

    for alert in alerts:
        db.add(alert)
    return alerts


def _ingest_packet(pkt: TelemetryPacket, db: Session) -> tuple[dict, list[BatteryAlert]]:
    battery = _resolve_battery(pkt.battery_id, db)
    device = _resolve_device(pkt.device_id, db)

    if pkt.device_id and not device:
        raise HTTPException(status_code=404, detail=f"Hardware device '{pkt.device_id}' not found")

    quality = _validate_packet(pkt)
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

    if device:
        now = datetime.utcnow()
        device.last_seen = now
        device.last_telemetry_at = now
        device.status = "MEASURING"
        if pkt.firmware_version:
            device.firmware_version = pkt.firmware_version

    alerts = _trigger_alerts(pkt, battery, device, db)
    db.commit()
    db.refresh(record)

    telemetry = {
        "id": record.id,
        "battery_id": battery.battery_id,
        "timestamp": record.timestamp,
        "voltage_v": record.voltage_v,
        "current_a": record.current_a,
        "power_w": record.power_w,
        "energy_wh": record.energy_wh,
        "temperature_c": record.temperature_c,
        "min_cell_temp_c": record.min_cell_temp_c,
        "max_cell_temp_c": record.max_cell_temp_c,
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
        "firmware_version": record.firmware_version,
        "data_quality_score": record.data_quality_score,
        "is_demo": record.is_demo,
    }
    return telemetry, alerts


@router.post("", status_code=201)
def ingest_telemetry(pkt: TelemetryPacket, db: Session = Depends(get_db)):
    telemetry, alerts = _ingest_packet(pkt, db)
    try:
        from app.websocket.manager import ws_manager
        import asyncio
        asyncio.create_task(ws_manager.broadcast_battery(telemetry["battery_id"], {
            "event": "telemetry_update",
            "data": telemetry,
        }))
        for alert in alerts:
            event = {
                "event": "critical_alert" if alert.severity == "CRITICAL" else "temperature_warning" if "Temperature" in (alert.alert_type or "") else "cell_imbalance_warning" if alert.alert_type == "Cell Imbalance" else "bms_fault",
                "data": {
                    "id": alert.id,
                    "alert_id": alert.alert_id,
                    "battery_id": telemetry["battery_id"],
                    "device_id": telemetry.get("device_id"),
                    "alert_type": alert.alert_type,
                    "severity": alert.severity,
                    "message": alert.message,
                    "triggered_value": alert.triggered_value,
                    "threshold_value": alert.threshold_value,
                    "unit": alert.unit,
                    "source": alert.source,
                    "status": alert.status,
                    "is_demo": alert.is_demo,
                    "created_at": alert.created_at,
                },
            }
            asyncio.create_task(ws_manager.broadcast_battery(telemetry["battery_id"], event))
    except Exception:
        pass
    return telemetry


@router.post("/batch", status_code=201)
def ingest_batch(req: BatchTelemetryRequest, db: Session = Depends(get_db)):
    results = []
    errors = []
    for index, pkt in enumerate(req.packets):
        try:
            telemetry, _ = _ingest_packet(pkt, db)
            results.append(telemetry)
        except Exception as exc:
            errors.append({"index": index, "error": str(exc)})
    return {"ingested": len(results), "errors": errors, "results": results}


def _manual_reading_to_telemetry(battery: Battery, reading: BatteryReading) -> dict:
    power_w = None
    if reading.voltage_v is not None and reading.current_a is not None:
        power_w = round(reading.voltage_v * reading.current_a, 2)
    return {
        "id": reading.id,
        "battery_id": battery.battery_id,
        "timestamp": reading.timestamp,
        "voltage_v": reading.voltage_v,
        "current_a": reading.current_a,
        "power_w": power_w,
        "energy_wh": None,
        "temperature_c": reading.temperature_c,
        "min_cell_temp_c": None,
        "max_cell_temp_c": None,
        "soc_pct": reading.soc_pct,
        "soh_pct": None,
        "internal_resistance_mohm": reading.internal_resistance_mohm,
        "cycle_count": battery.cycle_count,
        "cell_voltages": None,
        "cell_temperatures": None,
        "bms_status": "MANUAL_READING",
        "fault_codes": [],
        "charging_state": None,
        "discharging_state": None,
        "source": reading.source or "manual",
        "firmware_version": None,
        "data_quality_score": 100.0,
        "is_demo": False,
    }


@router.get("/{battery_id}/latest")
def get_latest_telemetry(
    battery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = _resolve_battery(battery_id, db)
    record = (
        db.query(DeviceTelemetry)
        .filter(DeviceTelemetry.battery_id == battery.id)
        .order_by(DeviceTelemetry.timestamp.desc())
        .first()
    )
    if record:
        return {
            "id": record.id,
            "battery_id": battery.battery_id,
            "timestamp": record.timestamp,
            "voltage_v": record.voltage_v,
            "current_a": record.current_a,
            "power_w": record.power_w,
            "energy_wh": record.energy_wh,
            "temperature_c": record.temperature_c,
            "min_cell_temp_c": record.min_cell_temp_c,
            "max_cell_temp_c": record.max_cell_temp_c,
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
            "firmware_version": record.firmware_version,
            "data_quality_score": record.data_quality_score,
            "is_demo": record.is_demo,
        }

    # The application also supports manual battery analysis. If no ESP32/BMS
    # packet has arrived yet, expose the latest manual reading through the
    # same Live Monitor contract so the dashboard is never needlessly blank.
    manual = (
        db.query(BatteryReading)
        .filter(BatteryReading.battery_id == battery.id)
        .order_by(BatteryReading.timestamp.desc())
        .first()
    )
    if manual:
        return _manual_reading_to_telemetry(battery, manual)

    return None


@router.get("/{battery_id}/history")
def get_telemetry_history(
    battery_id: str,
    limit: int = 200,
    source: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = _resolve_battery(battery_id, db)
    q = db.query(DeviceTelemetry).filter(DeviceTelemetry.battery_id == battery.id)
    if source:
        q = q.filter(DeviceTelemetry.source == source)
    records = q.order_by(DeviceTelemetry.timestamp.desc()).limit(max(1, min(limit, 1000))).all()
    return [
        {
            "id": r.id,
            "battery_id": battery.battery_id,
            "timestamp": r.timestamp,
            "voltage_v": r.voltage_v,
            "current_a": r.current_a,
            "power_w": r.power_w,
            "energy_wh": r.energy_wh,
            "temperature_c": r.temperature_c,
            "min_cell_temp_c": r.min_cell_temp_c,
            "max_cell_temp_c": r.max_cell_temp_c,
            "soc_pct": r.soc_pct,
            "soh_pct": r.soh_pct,
            "internal_resistance_mohm": r.internal_resistance_mohm,
            "cycle_count": r.cycle_count,
            "cell_voltages": r.cell_voltages,
            "cell_temperatures": r.cell_temperatures,
            "bms_status": r.bms_status,
            "fault_codes": r.fault_codes,
            "charging_state": r.charging_state,
            "discharging_state": r.discharging_state,
            "source": r.source,
            "firmware_version": r.firmware_version,
            "data_quality_score": r.data_quality_score,
            "is_demo": r.is_demo,
        }
        for r in records
    ]

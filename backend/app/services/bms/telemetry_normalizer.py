"""BatteryX AI – Telemetry Normalizer
Converts NormalizedBMSData from any BMS adapter into a BatteryX DeviceTelemetry-compatible dict.
"""
from typing import Optional
from .adapter_base import NormalizedBMSData


def normalize_bms_to_telemetry(
    data: NormalizedBMSData,
    battery_id: str,
    device_id: Optional[str] = None,
    source: str = "bms",
) -> dict:
    """
    Map a NormalizedBMSData object to the DeviceTelemetry schema expected by the
    POST /api/v1/telemetry endpoint.

    Args:
        data: normalised BMS data from any adapter
        battery_id: target BatteryX battery_id string
        device_id: optional hardware device ID
        source: data source label ('bms', 'can', etc.)

    Returns:
        dict matching TelemetryPacket schema
    """
    return {
        "device_id": device_id,
        "battery_id": battery_id,
        "timestamp": data.timestamp,
        "voltage_v": data.pack_voltage_v,
        "current_a": data.pack_current_a,
        "power_w": data.pack_power_w,
        "temperature_c": data.pack_temperature_c,
        "min_cell_temp_c": data.min_cell_temp_c,
        "max_cell_temp_c": data.max_cell_temp_c,
        "soc_pct": data.soc_pct,
        "soh_pct": data.soh_pct,
        "internal_resistance_mohm": data.internal_resistance_mohm,
        "cycle_count": data.cycle_count,
        "cell_voltages": data.cell_voltages,
        "cell_temperatures": data.cell_temperatures,
        "bms_status": data.bms_status,
        "fault_codes": data.fault_codes,
        "charging_state": data.charging_state,
        "discharging_state": data.discharging_state,
        "source": source,
        "is_demo": False,
    }

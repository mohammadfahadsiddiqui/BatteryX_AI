"""BatteryX AI – BMS Fault Code Decoder
Converts raw BMS fault codes into human-readable descriptions and severity levels.
"""
from typing import Dict, List, Optional


# Standard / generic fault code library
# BMS manufacturers may use different codes — extend this dict or provide a
# manufacturer-specific overlay in the BMS device configuration.
GENERIC_FAULT_LIBRARY: Dict[str, dict] = {
    # Voltage faults
    "CELL_OV":          {"severity": "CRITICAL", "description": "Cell over-voltage protection triggered"},
    "CELL_UV":          {"severity": "CRITICAL", "description": "Cell under-voltage protection triggered"},
    "PACK_OV":          {"severity": "HIGH",     "description": "Pack over-voltage detected"},
    "PACK_UV":          {"severity": "HIGH",     "description": "Pack under-voltage detected"},

    # Current faults
    "OC_CHARGE":        {"severity": "CRITICAL", "description": "Over-current during charging"},
    "OC_DISCHARGE":     {"severity": "CRITICAL", "description": "Over-current during discharge"},
    "SHORT_CIRCUIT":    {"severity": "CRITICAL", "description": "Short circuit detected"},

    # Temperature faults
    "OT_CHARGE":        {"severity": "HIGH",     "description": "Over-temperature during charging"},
    "OT_DISCHARGE":     {"severity": "HIGH",     "description": "Over-temperature during discharge"},
    "UT_CHARGE":        {"severity": "HIGH",     "description": "Under-temperature during charging"},
    "UT_DISCHARGE":     {"severity": "WARNING",  "description": "Under-temperature during discharge"},
    "OT_ENVIRONMENT":   {"severity": "WARNING",  "description": "Ambient temperature too high"},

    # Cell balance faults
    "IMBALANCE":        {"severity": "WARNING",  "description": "Cell voltage imbalance exceeds threshold"},

    # Sensor faults
    "SENSOR_FAULT_V":   {"severity": "HIGH",     "description": "Voltage sensor fault or disconnection"},
    "SENSOR_FAULT_T":   {"severity": "HIGH",     "description": "Temperature sensor fault or disconnection"},
    "SENSOR_FAULT_I":   {"severity": "HIGH",     "description": "Current sensor fault or disconnection"},

    # Communication faults
    "COMM_LOSS":        {"severity": "HIGH",     "description": "BMS communication lost"},
    "CAN_TIMEOUT":      {"severity": "HIGH",     "description": "CAN bus communication timeout"},
    "CAN_ERROR":        {"severity": "WARNING",  "description": "CAN bus error frame detected"},

    # BMS internal faults
    "BMS_INTERNAL_FAULT": {"severity": "CRITICAL", "description": "BMS internal hardware fault"},
    "EEPROM_FAULT":     {"severity": "WARNING",  "description": "BMS EEPROM read/write error"},
    "CONTACTOR_FAULT":  {"severity": "CRITICAL", "description": "Contactor failed to operate correctly"},
    "PRE_CHARGE_FAULT": {"severity": "HIGH",     "description": "Pre-charge sequence failed"},
}


def decode_fault(
    fault_code: str,
    custom_library: Optional[Dict[str, dict]] = None,
) -> dict:
    """
    Decode a single fault code into a human-readable record.

    Args:
        fault_code: raw fault code string from BMS
        custom_library: optional manufacturer-specific override library

    Returns:
        dict with: code, severity, description, known (bool)
    """
    library = {**GENERIC_FAULT_LIBRARY, **(custom_library or {})}
    info = library.get(fault_code.upper())

    if info:
        return {
            "code": fault_code,
            "severity": info["severity"],
            "description": info["description"],
            "known": True,
        }
    else:
        return {
            "code": fault_code,
            "severity": "WARNING",
            "description": f"Unknown BMS fault code: {fault_code}",
            "known": False,
        }


def decode_fault_list(
    fault_codes: List[str],
    custom_library: Optional[Dict[str, dict]] = None,
) -> List[dict]:
    """Decode a list of fault codes."""
    return [decode_fault(code, custom_library) for code in fault_codes]


def get_highest_severity(fault_codes: List[str]) -> str:
    """Return the highest severity level from a list of fault codes."""
    decoded = decode_fault_list(fault_codes)
    order = {"CRITICAL": 4, "HIGH": 3, "WARNING": 2, "INFO": 1}
    if not decoded:
        return "INFO"
    return max(decoded, key=lambda d: order.get(d["severity"], 0))["severity"]

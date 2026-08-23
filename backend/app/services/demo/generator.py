"""BatteryX AI – Demo Telemetry Generator
Produces synthetic but realistic-looking battery telemetry for 11 demo scenarios.
IMPORTANT: This data is ALWAYS labelled source='demo' and is_demo=True.
It must NEVER be presented as real battery measurements.
"""
import math
import random
from datetime import datetime
from typing import Optional


SCENARIOS = {
    "healthy":            "Healthy Battery",
    "degraded":           "Degraded Battery",
    "high_temperature":   "High Temperature",
    "cell_imbalance":     "Cell Imbalance",
    "over_current":       "Over Current",
    "under_voltage":      "Under Voltage",
    "charging":           "Charging",
    "discharging":        "Discharging",
    "bms_fault":          "BMS Fault",
    "sensor_failure":     "Sensor Failure",
    "communication_loss": "Communication Loss",
}


def generate_demo_telemetry(
    battery_id: str,
    scenario: str = "healthy",
    rated_voltage: float = 400.0,
    rated_capacity: float = 100.0,
    cycle_count: int = 200,
    tick: int = 0,
) -> dict:
    """
    Generate one synthetic telemetry packet for the given scenario.

    Args:
        battery_id: target battery identifier
        scenario: one of the SCENARIOS keys
        rated_voltage: pack rated voltage (V)
        rated_capacity: rated capacity (Ah)
        cycle_count: simulated cycle count
        tick: time step index (drives waveform variation)

    Returns:
        dict matching the TelemetryPacket schema, always with source='demo' and is_demo=True
    """
    t = tick

    if scenario == "healthy":
        voltage = rated_voltage * (0.95 + 0.03 * math.sin(t * 0.1))
        current = -5.0 + 2.0 * math.sin(t * 0.07)   # light discharge
        temperature = 28.0 + 2.0 * math.sin(t * 0.05)
        soc = max(20.0, 85.0 - t * 0.1 % 65)
        resistance = 8.5
        cell_v = [3.70 + random.uniform(-0.005, 0.005) for _ in range(12)]
        fault_codes = []

    elif scenario == "degraded":
        voltage = rated_voltage * (0.80 + 0.02 * math.sin(t * 0.1))
        current = -8.0
        temperature = 35.0 + 1.5 * math.sin(t * 0.05)
        soc = max(15.0, 65.0 - t * 0.05 % 50)
        resistance = 25.0    # elevated internal resistance
        cell_v = [3.45 + random.uniform(-0.02, 0.02) for _ in range(12)]
        fault_codes = []

    elif scenario == "high_temperature":
        voltage = rated_voltage * 0.92
        current = -12.0
        temperature = 52.0 + 3.0 * math.sin(t * 0.08)    # >45°C triggers warning
        soc = 70.0
        resistance = 12.0
        cell_v = [3.68 + random.uniform(-0.01, 0.01) for _ in range(12)]
        fault_codes = []

    elif scenario == "cell_imbalance":
        voltage = rated_voltage * 0.93
        current = -6.0
        temperature = 30.0
        soc = 75.0
        resistance = 11.0
        # Deliberately unbalanced cells
        cell_v = [3.72] * 10 + [3.45, 3.90]    # >150mV delta triggers alert

    elif scenario == "over_current":
        voltage = rated_voltage * 0.91
        current = -180.0     # high discharge current
        temperature = 40.0
        soc = 60.0
        resistance = 10.0
        cell_v = [3.65 + random.uniform(-0.005, 0.005) for _ in range(12)]
        fault_codes = ["OC_DISCHARGE"]

    elif scenario == "under_voltage":
        voltage = rated_voltage * 0.60   # below 70% rated — triggers alert
        current = -3.0
        temperature = 25.0
        soc = 5.0
        resistance = 35.0
        cell_v = [3.10 + random.uniform(-0.02, 0.02) for _ in range(12)]
        fault_codes = ["CELL_UV"]

    elif scenario == "charging":
        # Simulate CC-CV charging waveform
        soc = min(100.0, 20.0 + t * 0.5)
        voltage = rated_voltage * (0.80 + 0.18 * soc / 100.0)
        current = 25.0 if soc < 80 else max(0.5, 25.0 * (100 - soc) / 20)   # taper in CV
        temperature = 30.0 + soc * 0.05
        resistance = 9.0
        cell_v = [3.40 + 0.55 * soc / 100 + random.uniform(-0.005, 0.005) for _ in range(12)]
        fault_codes = []

    elif scenario == "discharging":
        soc = max(5.0, 95.0 - t * 0.3)
        voltage = rated_voltage * (0.75 + 0.22 * soc / 100)
        current = -20.0
        temperature = 32.0 + (95 - soc) * 0.05
        resistance = 10.0 + (95 - soc) * 0.05
        cell_v = [3.15 + 0.58 * soc / 100 + random.uniform(-0.005, 0.005) for _ in range(12)]
        fault_codes = []

    elif scenario == "bms_fault":
        voltage = rated_voltage * 0.88
        current = 0.0
        temperature = 35.0
        soc = 50.0
        resistance = 15.0
        cell_v = [3.60 + random.uniform(-0.01, 0.01) for _ in range(12)]
        fault_codes = ["BMS_INTERNAL_FAULT", "CONTACTOR_FAULT"]

    elif scenario == "sensor_failure":
        voltage = None   # voltage sensor failed
        current = -5.0
        temperature = None   # temp sensor failed
        soc = None
        resistance = None
        cell_v = None
        fault_codes = ["SENSOR_FAULT_V", "SENSOR_FAULT_T"]

    elif scenario == "communication_loss":
        # Return a packet with stale/None values to simulate comms loss
        return {
            "device_id": f"DEMO-ESP32-{battery_id}",
            "battery_id": battery_id,
            "timestamp": datetime.utcnow().isoformat(),
            "voltage_v": None,
            "current_a": None,
            "power_w": None,
            "temperature_c": None,
            "soc_pct": None,
            "bms_status": "COMMUNICATION_LOST",
            "fault_codes": ["COMM_LOSS"],
            "source": "demo",
            "is_demo": True,
            "scenario": scenario,
            "data_quality_score": 0.0,
        }
    else:
        raise ValueError(f"Unknown scenario: {scenario}. Valid: {list(SCENARIOS.keys())}")

    # Calculate derived values
    power_w = None
    if voltage is not None and current is not None:
        power_w = round(voltage * current, 1)

    return {
        "device_id": f"DEMO-ESP32-{battery_id}",
        "battery_id": battery_id,
        "timestamp": datetime.utcnow().isoformat(),
        "voltage_v": round(voltage, 2) if voltage is not None else None,
        "current_a": round(current, 2) if current is not None else None,
        "power_w": power_w,
        "temperature_c": round(temperature, 1) if "temperature" in dir() and temperature is not None else None,
        "min_cell_temp_c": round(temperature - 2.0, 1) if "temperature" in dir() and temperature is not None else None,
        "max_cell_temp_c": round(temperature + 2.0, 1) if "temperature" in dir() and temperature is not None else None,
        "soc_pct": round(soc, 1) if soc is not None else None,
        "internal_resistance_mohm": round(resistance, 1) if "resistance" in dir() and resistance is not None else None,
        "cell_voltages": [round(v, 4) for v in cell_v] if "cell_v" in dir() and cell_v else None,
        "bms_status": "DISCHARGING" if "current" in dir() and current is not None and current < 0 else (
                      "CHARGING" if "current" in dir() and current is not None and current > 0 else "IDLE"),
        "fault_codes": fault_codes if "fault_codes" in dir() else [],
        "charging_state": current is not None and current > 0 if "current" in dir() else None,
        "discharging_state": current is not None and current < 0 if "current" in dir() else None,
        "source": "demo",
        "is_demo": True,
        "scenario": scenario,
    }


def get_scenario_list() -> list:
    return [{"key": k, "label": v} for k, v in SCENARIOS.items()]

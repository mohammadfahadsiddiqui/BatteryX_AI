"""BatteryX AI – BMS Adapter Abstract Base Class
All BMS integrations must implement this interface.
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field


@dataclass
class NormalizedBMSData:
    """Normalised BMS data structure — the output of every BMS adapter."""
    # Pack-level
    pack_voltage_v: Optional[float] = None
    pack_current_a: Optional[float] = None
    pack_power_w: Optional[float] = None
    soc_pct: Optional[float] = None
    soh_pct: Optional[float] = None
    remaining_capacity_ah: Optional[float] = None
    full_charge_capacity_ah: Optional[float] = None
    cycle_count: Optional[int] = None
    internal_resistance_mohm: Optional[float] = None

    # Thermal
    pack_temperature_c: Optional[float] = None
    min_cell_temp_c: Optional[float] = None
    max_cell_temp_c: Optional[float] = None
    ambient_temperature_c: Optional[float] = None

    # Cell-level (None if BMS does not provide cell data)
    cell_voltages: Optional[List[float]] = None      # [3.71, 3.72, ...]
    cell_temperatures: Optional[List[float]] = None

    # BMS state
    bms_status: Optional[str] = None                 # IDLE, CHARGING, DISCHARGING, FAULT, etc.
    charging_state: Optional[bool] = None
    discharging_state: Optional[bool] = None
    balancing_active: Optional[bool] = None

    # Faults and protection
    fault_codes: Optional[List[str]] = None
    protection_flags: Optional[Dict[str, bool]] = None

    # Contactors
    positive_contactor: Optional[str] = None         # OPEN, CLOSED, FAULT
    negative_contactor: Optional[str] = None
    pre_charge_contactor: Optional[str] = None

    # Metadata
    bms_id: Optional[str] = None
    protocol: Optional[str] = None
    timestamp: Optional[str] = None
    data_quality_score: float = 100.0
    raw_data: Optional[Dict[str, Any]] = field(default=None, repr=False)


class BMSAdapter(ABC):
    """
    Abstract base class for all BMS hardware adapters.

    Each BMS manufacturer/protocol requires a concrete adapter that:
    1. Connects to the physical BMS (via CAN, Modbus, UART, proprietary)
    2. Reads raw data
    3. Returns NormalizedBMSData

    SAFETY NOTE: This adapter only READS data from the BMS.
    All physical protection (over-voltage, over-current, thermal cutoff) remains
    the sole responsibility of the physical BMS hardware.
    BatteryX does NOT send commands that bypass BMS safety functions.
    """

    def __init__(self, bms_id: str, configuration: dict):
        self.bms_id = bms_id
        self.configuration = configuration
        self._connected = False

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to the BMS. Returns True on success."""
        ...

    @abstractmethod
    def disconnect(self) -> None:
        """Cleanly disconnect from the BMS."""
        ...

    @abstractmethod
    def read_status(self) -> NormalizedBMSData:
        """Read and normalise all available BMS data."""
        ...

    def is_connected(self) -> bool:
        return self._connected

    def get_protocol(self) -> str:
        return self.configuration.get("protocol", "unknown")

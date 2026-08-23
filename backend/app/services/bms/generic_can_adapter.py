"""BatteryX AI – Generic CAN BMS Adapter
Supports configurable CAN message maps (no DBC file required).
Each signal is defined as: {can_id: {signal_name: {start_byte, length_bytes, scale, offset, unit}}}

Example configuration:
{
  "interface": "can0",
  "bitrate": 500000,
  "message_map": {
    "0x100": {
      "pack_voltage": {"start_byte": 0, "length_bytes": 2, "scale": 0.1, "offset": 0, "unit": "V", "signed": false},
      "pack_current": {"start_byte": 2, "length_bytes": 2, "scale": 0.1, "offset": -3276.8, "unit": "A", "signed": true}
    },
    "0x101": {
      "soc": {"start_byte": 0, "length_bytes": 1, "scale": 1.0, "offset": 0, "unit": "%", "signed": false}
    }
  }
}
"""
import struct
from typing import Optional, List, Dict, Any
from datetime import datetime

from .adapter_base import BMSAdapter, NormalizedBMSData


# CAN frame signal name → NormalizedBMSData field mapping
SIGNAL_MAP = {
    "pack_voltage":              "pack_voltage_v",
    "pack_current":              "pack_current_a",
    "soc":                       "soc_pct",
    "soh":                       "soh_pct",
    "temperature":               "pack_temperature_c",
    "min_cell_temp":             "min_cell_temp_c",
    "max_cell_temp":             "max_cell_temp_c",
    "remaining_capacity":        "remaining_capacity_ah",
    "full_charge_capacity":      "full_charge_capacity_ah",
    "cycle_count":               "cycle_count",
    "internal_resistance":       "internal_resistance_mohm",
}


class GenericCANAdapter(BMSAdapter):
    """
    Generic CAN bus BMS adapter with fully configurable message map.
    Supports any BMS that exposes data over standard CAN frames.

    Use this as the default adapter when no manufacturer-specific adapter exists.
    Configure it by providing a message_map in the configuration dict.

    NOTE: This adapter is designed for SOFTWARE MONITORING ONLY.
    It does not send commands to the BMS. It does not bypass any BMS protection.
    """

    def __init__(self, bms_id: str, configuration: dict):
        super().__init__(bms_id, configuration)
        self._message_map: Dict[int, Dict[str, dict]] = {}
        self._latest_frames: Dict[int, bytes] = {}
        self._parse_message_map(configuration.get("message_map", {}))

    def _parse_message_map(self, raw_map: dict):
        """Convert string CAN IDs to integers in the message map."""
        for can_id_str, signals in raw_map.items():
            can_id = int(can_id_str, 16) if isinstance(can_id_str, str) else int(can_id_str)
            self._message_map[can_id] = signals

    def connect(self) -> bool:
        """
        In a real implementation, this would open the CAN socket:
          socket.socket(socket.AF_CAN, socket.SOCK_RAW, socket.CAN_RAW)
        For the prototype, we simulate a successful connection.
        """
        interface = self.configuration.get("interface", "can0")
        self._connected = True
        return True

    def disconnect(self) -> None:
        self._connected = False

    def ingest_frame(self, can_id: int, data: bytes):
        """
        Feed a raw CAN frame into the adapter.
        In production, this is called by the CAN receiver loop.
        """
        self._latest_frames[can_id] = data

    def _decode_signal(self, data: bytes, signal_config: dict) -> Optional[float]:
        """Decode a single signal from a CAN data bytes array."""
        try:
            start = signal_config.get("start_byte", 0)
            length = signal_config.get("length_bytes", 2)
            scale = signal_config.get("scale", 1.0)
            offset = signal_config.get("offset", 0.0)
            signed = signal_config.get("signed", False)

            raw_bytes = data[start: start + length]
            if len(raw_bytes) < length:
                return None

            fmt = {1: ">b" if signed else ">B",
                   2: ">h" if signed else ">H",
                   4: ">i" if signed else ">I"}.get(length, ">H")
            raw_value = struct.unpack(fmt, raw_bytes)[0]
            return round(raw_value * scale + offset, 4)
        except Exception:
            return None

    def read_status(self) -> NormalizedBMSData:
        """
        Decode all known signals from the latest received CAN frames
        and return a NormalizedBMSData object.
        """
        fields: Dict[str, Any] = {}

        for can_id, signals in self._message_map.items():
            if can_id not in self._latest_frames:
                continue
            frame_data = self._latest_frames[can_id]
            for signal_name, signal_cfg in signals.items():
                value = self._decode_signal(frame_data, signal_cfg)
                if value is not None:
                    # Map signal name to NormalizedBMSData field
                    norm_field = SIGNAL_MAP.get(signal_name, signal_name)
                    fields[norm_field] = value

        # Calculate pack power if we have voltage and current
        if "pack_voltage_v" in fields and "pack_current_a" in fields:
            fields["pack_power_w"] = round(
                fields["pack_voltage_v"] * fields["pack_current_a"], 2
            )

        # Determine charging/discharging state from current sign
        if "pack_current_a" in fields:
            current = fields["pack_current_a"]
            fields["charging_state"] = current > 0
            fields["discharging_state"] = current < 0

        # Data quality score: ratio of populated fields
        expected = len(SIGNAL_MAP)
        populated = sum(1 for k in SIGNAL_MAP.values() if k in fields)
        quality = round(100.0 * populated / expected, 1) if expected > 0 else 0.0

        return NormalizedBMSData(
            bms_id=self.bms_id,
            protocol="CAN",
            timestamp=datetime.utcnow().isoformat(),
            data_quality_score=quality,
            raw_data={"frames_received": len(self._latest_frames)},
            **{k: v for k, v in fields.items() if hasattr(NormalizedBMSData, k)},
        )

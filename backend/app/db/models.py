"""BatteryX AI – SQLAlchemy database models (all tables)"""
import uuid
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Date,
    Text, ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


def gen_uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Users & Organizations
# ---------------------------------------------------------------------------

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    type = Column(String(100))  # e.g. EV Manufacturer, Recycler
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")
    batteries = relationship("Battery", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="technician")  # admin, org_admin, technician, analyst, viewer
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")


# ---------------------------------------------------------------------------
# Battery
# ---------------------------------------------------------------------------

class Battery(Base):
    __tablename__ = "batteries"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String(100), unique=True, nullable=False, index=True)  # e.g. BX-2026-00124
    manufacturer = Column(String(255))
    model = Column(String(255))
    chemistry = Column(String(100))  # Li-ion NMC, LFP, NCA, etc.
    rated_capacity_ah = Column(Float)   # Ah
    rated_voltage_v = Column(Float)     # V
    manufacturing_date = Column(Date, nullable=True)
    installation_date = Column(Date, nullable=True)
    age_years = Column(Float, nullable=True)
    cycle_count = Column(Integer, default=0)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    is_demo = Column(Boolean, default=False)
    status = Column(String(50), default="active")  # active, retired, recycled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="batteries")
    readings = relationship("BatteryReading", back_populates="battery", cascade="all, delete-orphan")
    cycles = relationship("BatteryCycle", back_populates="battery", cascade="all, delete-orphan")
    diagnostic_tests = relationship("DiagnosticTest", back_populates="battery", cascade="all, delete-orphan")
    soh_predictions = relationship("SOHPrediction", back_populates="battery", cascade="all, delete-orphan")
    rul_predictions = relationship("RULPrediction", back_populates="battery", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="battery", cascade="all, delete-orphan")
    second_life_assessments = relationship("SecondLifeAssessment", back_populates="battery", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="battery", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="battery", cascade="all, delete-orphan")


class BatteryReading(Base):
    """Time-series telemetry readings"""
    __tablename__ = "battery_readings"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    voltage_v = Column(Float)
    current_a = Column(Float)
    temperature_c = Column(Float)
    soc_pct = Column(Float)  # State of Charge %
    internal_resistance_mohm = Column(Float)
    capacity_ah = Column(Float, nullable=True)  # measured capacity if available
    source = Column(String(50), default="manual")  # manual, csv, json, esp32, bms

    battery = relationship("Battery", back_populates="readings")


class BatteryCycle(Base):
    __tablename__ = "battery_cycles"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    cycle_number = Column(Integer)
    charge_capacity_ah = Column(Float)
    discharge_capacity_ah = Column(Float)
    efficiency_pct = Column(Float)
    max_temperature_c = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery", back_populates="cycles")


# ---------------------------------------------------------------------------
# Diagnostics & Analysis
# ---------------------------------------------------------------------------

class DiagnosticTest(Base):
    __tablename__ = "diagnostic_tests"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    run_by_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="pending")  # pending, running, complete, failed
    input_data = Column(JSON, nullable=True)  # raw input params
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    battery = relationship("Battery", back_populates="diagnostic_tests")


class SOHPrediction(Base):
    __tablename__ = "soh_predictions"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    diagnostic_test_id = Column(String, ForeignKey("diagnostic_tests.id"), nullable=True)
    soh_pct = Column(Float, nullable=False)       # e.g. 87.3
    health_status = Column(String(50))              # Excellent, Good, Fair, Poor, Critical
    confidence_pct = Column(Float, nullable=True)  # model confidence
    method = Column(String(100), default="physics_based")
    features_used = Column(JSON, nullable=True)
    prediction_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery", back_populates="soh_predictions")


class RULPrediction(Base):
    __tablename__ = "rul_predictions"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    diagnostic_test_id = Column(String, ForeignKey("diagnostic_tests.id"), nullable=True)
    rul_years = Column(Float)            # estimated years remaining
    rul_cycles = Column(Integer)         # estimated cycles remaining
    confidence_pct = Column(Float, nullable=True)
    soh_at_eol_pct = Column(Float, default=70.0)  # end-of-life SOH threshold
    degradation_projections = Column(JSON, nullable=True)  # {months: soh}
    created_at = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery", back_populates="rul_predictions")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    diagnostic_test_id = Column(String, ForeignKey("diagnostic_tests.id"), nullable=True)
    risk_score = Column(Float)          # 0-100
    risk_level = Column(String(20))     # LOW, MODERATE, HIGH
    risk_factors = Column(JSON, nullable=True)   # list of {factor, severity, description}
    recommended_action = Column(Text, nullable=True)
    disclaimer = Column(Text, default="Prototype risk assessment. Not a certified battery safety evaluation.")
    created_at = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery", back_populates="risk_assessments")


class SecondLifeAssessment(Base):
    __tablename__ = "second_life_assessments"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    diagnostic_test_id = Column(String, ForeignKey("diagnostic_tests.id"), nullable=True)
    second_life_score = Column(Float)     # 0-100
    classification = Column(String(100)) # Continue EV Use, Second-Life Storage, Refurbishment, Recycling
    recommended_application = Column(String(255))
    reasoning = Column(JSON, nullable=True)  # list of reasoning points
    created_at = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery", back_populates="second_life_assessments")


# ---------------------------------------------------------------------------
# Certificates & Reports
# ---------------------------------------------------------------------------

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, default=gen_uuid)
    certificate_id = Column(String(50), unique=True, nullable=False, index=True)  # BX-AI-XXXXXX
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    diagnostic_test_id = Column(String, ForeignKey("diagnostic_tests.id"), nullable=True)
    soh_pct = Column(Float)
    rul_years = Column(Float)
    risk_level = Column(String(20))
    second_life_classification = Column(String(100))
    recommended_application = Column(String(255))
    cycle_count = Column(Integer)
    assessment_summary = Column(Text)
    issued_at = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)
    is_valid = Column(Boolean, default=True)
    pdf_path = Column(String(500), nullable=True)

    battery = relationship("Battery", back_populates="certificates")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    report_type = Column(String(100))  # health, diagnostic, degradation, safety, second_life, complete
    title = Column(String(255))
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery", back_populates="reports")


# ---------------------------------------------------------------------------
# Audit Logs
# ---------------------------------------------------------------------------

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String(100))  # e.g. battery.created, analysis.run, certificate.generated
    resource_type = Column(String(100))
    resource_id = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


# ---------------------------------------------------------------------------
# Hardware Devices (ESP32, Raspberry Pi, Industrial Gateways)
# ---------------------------------------------------------------------------

class HardwareDevice(Base):
    __tablename__ = "hardware_devices"

    id = Column(String, primary_key=True, default=gen_uuid)
    device_id = Column(String(100), unique=True, nullable=False, index=True)  # BX-HW-001
    name = Column(String(255), nullable=False)
    device_type = Column(String(100), default="ESP32")  # ESP32, Raspberry Pi, Industrial Gateway, BMS Gateway, CAN Gateway
    status = Column(String(50), default="OFFLINE")  # BOOTING, INITIALIZING, CONNECTING, CONNECTED, MEASURING, TRANSMITTING, OFFLINE, ERROR, MAINTENANCE
    firmware_version = Column(String(50), nullable=True)
    connection_type = Column(String(50), default="WiFi")  # WiFi, Ethernet, MQTT, LTE
    signal_strength_dbm = Column(Float, nullable=True)
    telemetry_rate_hz = Column(Float, default=1.0)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    auth_token = Column(String(255), nullable=True)  # device auth token
    device_token_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime, nullable=True)
    last_telemetry_at = Column(DateTime, nullable=True)
    ip_address = Column(String(50), nullable=True)
    mac_address = Column(String(50), nullable=True)
    configuration = Column(JSON, nullable=True)  # device-specific config
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    battery = relationship("Battery", foreign_keys=[battery_id])
    events = relationship("DeviceEvent", back_populates="device", cascade="all, delete-orphan")
    telemetry = relationship("DeviceTelemetry", back_populates="device", cascade="all, delete-orphan")


class DeviceTelemetry(Base):
    """Telemetry records ingested from hardware devices, BMS, or CAN."""
    __tablename__ = "device_telemetry"

    id = Column(String, primary_key=True, default=gen_uuid)
    device_id = Column(String, ForeignKey("hardware_devices.id"), nullable=True)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Electrical
    voltage_v = Column(Float, nullable=True)
    current_a = Column(Float, nullable=True)
    power_w = Column(Float, nullable=True)
    energy_wh = Column(Float, nullable=True)

    # Thermal
    temperature_c = Column(Float, nullable=True)
    min_cell_temp_c = Column(Float, nullable=True)
    max_cell_temp_c = Column(Float, nullable=True)

    # State
    soc_pct = Column(Float, nullable=True)
    soh_pct = Column(Float, nullable=True)
    internal_resistance_mohm = Column(Float, nullable=True)
    cycle_count = Column(Integer, nullable=True)

    # Cell-level (stored as JSON arrays when available)
    cell_voltages = Column(JSON, nullable=True)   # [3.71, 3.72, ...]
    cell_temperatures = Column(JSON, nullable=True)

    # BMS/CAN extra
    bms_status = Column(String(100), nullable=True)
    fault_codes = Column(JSON, nullable=True)
    charging_state = Column(Boolean, nullable=True)
    discharging_state = Column(Boolean, nullable=True)

    # Metadata
    source = Column(String(50), default="manual")  # esp32, bms, can, manual, csv, demo
    firmware_version = Column(String(50), nullable=True)
    data_quality_score = Column(Float, nullable=True)  # 0-100
    is_demo = Column(Boolean, default=False)

    device = relationship("HardwareDevice", back_populates="telemetry")
    battery = relationship("Battery")


class DeviceEvent(Base):
    """Device lifecycle and diagnostic events."""
    __tablename__ = "device_events"

    id = Column(String, primary_key=True, default=gen_uuid)
    device_id = Column(String, ForeignKey("hardware_devices.id"), nullable=False)
    event_type = Column(String(100))  # connected, disconnected, error, firmware_update, config_change
    severity = Column(String(20), default="INFO")  # INFO, WARNING, ERROR, CRITICAL
    message = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    device = relationship("HardwareDevice", back_populates="events")


# ---------------------------------------------------------------------------
# Diagnostic Sessions
# ---------------------------------------------------------------------------

class DiagnosticSession(Base):
    __tablename__ = "diagnostic_sessions"

    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String(100), unique=True, nullable=False, index=True)  # DIAG-2026-001
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    device_id = Column(String, ForeignKey("hardware_devices.id"), nullable=True)
    run_by_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    diagnostic_type = Column(String(100), default="Full Battery Diagnostic")  # Quick Health Check, Full Battery Diagnostic, Live Diagnostic, etc.
    data_source = Column(String(50), default="manual")  # manual, esp32, bms, can, csv, demo
    status = Column(String(50), default="CREATED")  # CREATED, READY, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED
    data_quality_score = Column(Float, nullable=True)
    measurements_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Results (populated when completed)
    result_soh_pct = Column(Float, nullable=True)
    result_rul_years = Column(Float, nullable=True)
    result_risk_level = Column(String(20), nullable=True)
    result_second_life_score = Column(Float, nullable=True)
    result_second_life_class = Column(String(100), nullable=True)
    result_recommended_action = Column(Text, nullable=True)
    result_anomalies = Column(JSON, nullable=True)
    result_explanation = Column(JSON, nullable=True)
    ai_model_version = Column(String(50), default="physics_based_prototype")
    diagnostic_test_id = Column(String, ForeignKey("diagnostic_tests.id"), nullable=True)

    battery = relationship("Battery")
    device = relationship("HardwareDevice")


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

class BatteryAlert(Base):
    __tablename__ = "battery_alerts"

    id = Column(String, primary_key=True, default=gen_uuid)
    alert_id = Column(String(100), unique=True, nullable=False, index=True)  # ALERT-2026-001
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    device_id = Column(String, ForeignKey("hardware_devices.id"), nullable=True)
    diagnostic_session_id = Column(String, ForeignKey("diagnostic_sessions.id"), nullable=True)
    alert_type = Column(String(100))  # High Temperature, Over Voltage, Cell Imbalance, BMS Fault, Hardware Offline, etc.
    severity = Column(String(20))  # INFO, WARNING, HIGH, CRITICAL
    message = Column(Text, nullable=False)
    triggered_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    unit = Column(String(20), nullable=True)  # °C, V, A, %
    source = Column(String(50), default="telemetry")  # telemetry, bms, can, ai, hardware, data_quality
    status = Column(String(30), default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, RESOLVED, AUTO_RESOLVED
    acknowledged_by = Column(String, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_by = Column(String, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery")
    device = relationship("HardwareDevice")


# ---------------------------------------------------------------------------
# Battery Lifecycle
# ---------------------------------------------------------------------------

class BatteryLifecycleEvent(Base):
    __tablename__ = "battery_lifecycle_events"

    id = Column(String, primary_key=True, default=gen_uuid)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False)
    event_type = Column(String(100))  # manufactured, installed, monitoring_started, diagnostic_run, degradation_detected, second_life_candidate, retired, recycled
    title = Column(String(255))
    description = Column(Text, nullable=True)
    soh_at_event = Column(Float, nullable=True)
    rul_at_event = Column(Float, nullable=True)
    risk_at_event = Column(String(20), nullable=True)
    performed_by = Column(String, ForeignKey("users.id"), nullable=True)
    details = Column(JSON, nullable=True)
    event_date = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery")


# ---------------------------------------------------------------------------
# Fleet / Vehicles
# ---------------------------------------------------------------------------

class FleetVehicle(Base):
    __tablename__ = "fleet_vehicles"

    id = Column(String, primary_key=True, default=gen_uuid)
    vehicle_id = Column(String(100), unique=True, nullable=False, index=True)
    make = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    vin = Column(String(100), nullable=True)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    status = Column(String(50), default="active")  # active, retired, service
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery")


# ---------------------------------------------------------------------------
# BMS Devices
# ---------------------------------------------------------------------------

class BMSDevice(Base):
    __tablename__ = "bms_devices"

    id = Column(String, primary_key=True, default=gen_uuid)
    bms_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255))
    manufacturer = Column(String(255), nullable=True)
    model = Column(String(255), nullable=True)
    firmware_version = Column(String(50), nullable=True)
    protocol = Column(String(100), nullable=True)  # CAN, Modbus, UART, proprietary
    adapter_class = Column(String(100), nullable=True)  # python class name of the adapter
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=True)
    hardware_device_id = Column(String, ForeignKey("hardware_devices.id"), nullable=True)
    status = Column(String(50), default="OFFLINE")
    last_seen = Column(DateTime, nullable=True)
    configuration = Column(JSON, nullable=True)  # adapter-specific config (CAN IDs, byte maps, etc.)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    battery = relationship("Battery")


# ---------------------------------------------------------------------------
# CAN Configuration
# ---------------------------------------------------------------------------

class CANConfiguration(Base):
    __tablename__ = "can_configurations"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    bms_device_id = Column(String, ForeignKey("bms_devices.id"), nullable=True)
    interface = Column(String(50), default="can0")  # can0, vcan0, etc.
    bitrate = Column(Integer, default=500000)  # 500kbps default
    message_map = Column(JSON, nullable=True)  # {can_id: {signal_name: {start_bit, length, scale, offset, unit}}}
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Certificate Verifications
# ---------------------------------------------------------------------------

class CertificateVerification(Base):
    __tablename__ = "certificate_verifications"

    id = Column(String, primary_key=True, default=gen_uuid)
    certificate_id = Column(String, ForeignKey("certificates.id"), nullable=False)
    verified_at = Column(DateTime, default=datetime.utcnow)
    verifier_ip = Column(String(50), nullable=True)
    verifier_agent = Column(String(255), nullable=True)

    certificate = relationship("Certificate")

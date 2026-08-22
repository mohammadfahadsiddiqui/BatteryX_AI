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


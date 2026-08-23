"""BatteryX AI – Pydantic request/response schemas"""
from __future__ import annotations
from datetime import datetime, date
from typing import Optional, List, Any
import re
from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _validate_email(value: str) -> str:
    value = value.strip().lower()
    if not _EMAIL_RE.fullmatch(value):
        raise ValueError("Invalid email address")
    return value


class LoginRequest(BaseModel):
    # Use plain str validation instead of Pydantic EmailStr so the Vercel
    # serverless runtime does not require the optional email-validator package
    # merely to import the application.
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: Optional[str]
    role: str


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str
    organization_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


# ---------------------------------------------------------------------------
# Battery
# ---------------------------------------------------------------------------

class BatteryCreate(BaseModel):
    battery_id: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    chemistry: Optional[str] = "Li-ion NMC"
    rated_capacity_ah: Optional[float] = None
    rated_voltage_v: Optional[float] = None
    manufacturing_date: Optional[date] = None
    installation_date: Optional[date] = None
    age_years: Optional[float] = None
    cycle_count: Optional[int] = 0
    notes: Optional[str] = None


class BatteryUpdate(BaseModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    chemistry: Optional[str] = None
    rated_capacity_ah: Optional[float] = None
    rated_voltage_v: Optional[float] = None
    cycle_count: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class BatteryReadingCreate(BaseModel):
    voltage_v: Optional[float] = None
    current_a: Optional[float] = None
    temperature_c: Optional[float] = None
    soc_pct: Optional[float] = None
    internal_resistance_mohm: Optional[float] = None
    capacity_ah: Optional[float] = None
    source: str = "manual"


class BatteryResponse(BaseModel):
    id: str
    battery_id: str
    manufacturer: Optional[str]
    model: Optional[str]
    chemistry: Optional[str]
    rated_capacity_ah: Optional[float]
    rated_voltage_v: Optional[float]
    age_years: Optional[float]
    cycle_count: int
    is_demo: bool
    status: str
    notes: Optional[str]
    created_at: datetime
    latest_soh: Optional[float] = None
    latest_rul: Optional[float] = None
    latest_risk: Optional[str] = None
    latest_second_life: Optional[str] = None
    latest_voltage: Optional[float] = None
    latest_temperature: Optional[float] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

class AnalysisRequest(BaseModel):
    voltage_v: float
    current_a: float
    temperature_c: float
    soc_pct: float
    internal_resistance_mohm: float
    measured_capacity_ah: Optional[float] = None
    charge_rate_c: Optional[float] = None
    discharge_rate_c: Optional[float] = None


class RiskFactorSchema(BaseModel):
    factor: str
    severity: str
    description: str
    value: Optional[float] = None


class SOHSchema(BaseModel):
    soh_pct: float
    health_status: str
    confidence_pct: float
    method: str
    notes: str


class DegradationSchema(BaseModel):
    months_6: float
    months_12: float
    months_24: float
    months_36: float
    annual_rate_pct: float
    eol_soh_threshold_pct: float


class RULSchema(BaseModel):
    rul_years: float
    rul_cycles: int
    confidence_pct: float
    degradation: DegradationSchema
    notes: str


class RiskSchema(BaseModel):
    risk_score: float
    risk_level: str
    risk_factors: List[RiskFactorSchema]
    recommended_action: str
    disclaimer: str


class SecondLifeSchema(BaseModel):
    second_life_score: float
    classification: str
    recommended_application: str
    reasoning: List[str]


class AnalysisResponse(BaseModel):
    battery_id: str
    diagnostic_test_id: str
    soh: SOHSchema
    rul: RULSchema
    risk: RiskSchema
    second_life: SecondLifeSchema
    recommended_action: str
    explanation_points: List[str]
    analyzed_at: datetime


# ---------------------------------------------------------------------------
# Certificate
# ---------------------------------------------------------------------------

class CertificateResponse(BaseModel):
    id: str
    certificate_id: str
    battery_id: str
    soh_pct: float
    rul_years: float
    risk_level: str
    second_life_classification: str
    recommended_application: str
    cycle_count: int
    assessment_summary: str
    issued_at: datetime
    is_valid: bool

    class Config:
        from_attributes = True


class VerifyResponse(BaseModel):
    is_valid: bool
    certificate_id: str
    battery_id: str
    soh_pct: float
    rul_years: float
    risk_level: str
    second_life_classification: str
    issued_at: datetime
    verified_at: datetime
    issuer: str = "BatteryX AI Platform"


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class DashboardStats(BaseModel):
    total_batteries: int
    average_soh: float
    high_risk_count: int
    second_life_eligible: int
    health_distribution: dict
    risk_distribution: dict
    second_life_distribution: dict
    recent_diagnostics: List[dict]


# ---------------------------------------------------------------------------
# User / Admin
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

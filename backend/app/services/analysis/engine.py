"""
BatteryX AI – Battery Analysis Engine

IMPORTANT: This is a PROTOTYPE physics-based scoring engine.
Results are ESTIMATES based on deterministic formulas derived from
general battery engineering principles. They are NOT scientifically
validated measurements and should NOT be treated as certified safety
assessments. Architecture is designed to be replaced with real
trained ML models (XGBoost, PyTorch) without changing the API surface.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# Input data structures
# ---------------------------------------------------------------------------

@dataclass
class BatteryInput:
    """All input parameters for battery analysis."""
    # Electrical
    voltage_v: float
    current_a: float
    rated_voltage_v: float
    rated_capacity_ah: float
    internal_resistance_mohm: float
    soc_pct: float

    # Thermal
    temperature_c: float

    # Usage history
    cycle_count: int
    age_years: float

    # Chemistry & metadata
    chemistry: str = "Li-ion NMC"  # Li-ion NMC, LFP, NCA, NMC 811, NMC 622

    # Optional measured capacity
    measured_capacity_ah: Optional[float] = None

    # Optional extra
    charge_rate_c: Optional[float] = None
    discharge_rate_c: Optional[float] = None
    max_temperature_c: Optional[float] = None


# ---------------------------------------------------------------------------
# Output data structures
# ---------------------------------------------------------------------------

@dataclass
class SOHResult:
    soh_pct: float
    health_status: str
    confidence_pct: float
    method: str = "physics_based_prototype"
    features_used: dict = field(default_factory=dict)
    notes: str = "PROTOTYPE ESTIMATE — Not scientifically validated."


@dataclass
class DegradationProjection:
    months_6: float
    months_12: float
    months_24: float
    months_36: float
    annual_rate_pct: float
    eol_soh_threshold_pct: float = 70.0


@dataclass
class RULResult:
    rul_years: float
    rul_cycles: int
    confidence_pct: float
    degradation: DegradationProjection
    notes: str = "PROTOTYPE ESTIMATE — Not scientifically validated."


@dataclass
class RiskFactor:
    factor: str
    severity: str  # LOW, MODERATE, HIGH
    description: str
    value: Optional[float] = None


@dataclass
class RiskResult:
    risk_score: float  # 0-100
    risk_level: str    # LOW, MODERATE, HIGH
    risk_factors: list[RiskFactor]
    recommended_action: str
    disclaimer: str = (
        "⚠ PROTOTYPE — This is a rule-based risk assessment for demonstration purposes. "
        "It is NOT a certified battery safety evaluation and must not be used as such."
    )


@dataclass
class SecondLifeResult:
    second_life_score: float   # 0-100
    classification: str        # Continue EV Use, Second-Life Storage, Refurbishment, Recycling
    recommended_application: str
    reasoning: list[str]


@dataclass
class FullAnalysisResult:
    soh: SOHResult
    rul: RULResult
    risk: RiskResult
    second_life: SecondLifeResult
    recommended_action: str
    explanation_points: list[str]


# ---------------------------------------------------------------------------
# Chemistry-specific parameters
# ---------------------------------------------------------------------------

# Typical maximum cycle counts before reaching 70% SOH (EOL threshold)
CHEMISTRY_MAX_CYCLES = {
    "Li-ion NMC": 2000,
    "LFP": 4000,
    "Li-ion NCA": 1500,
    "NMC 811": 1800,
    "NMC 622": 2200,
    "default": 2000,
}

# Base degradation per year at average use conditions (%)
CHEMISTRY_ANNUAL_DEGRADATION = {
    "Li-ion NMC": 2.5,
    "LFP": 1.8,
    "Li-ion NCA": 3.2,
    "NMC 811": 2.8,
    "NMC 622": 2.3,
    "default": 2.5,
}

# Normal internal resistance at BOL (mΩ) — varies widely in practice
CHEMISTRY_BASELINE_RESISTANCE = {
    "Li-ion NMC": 10.0,
    "LFP": 8.0,
    "Li-ion NCA": 12.0,
    "NMC 811": 11.0,
    "NMC 622": 10.5,
    "default": 10.0,
}

# Temperature stress thresholds (°C)
TEMP_OPTIMAL_MAX = 35.0
TEMP_WARNING = 40.0
TEMP_CRITICAL = 50.0


# ---------------------------------------------------------------------------
# Core SOH estimation
# ---------------------------------------------------------------------------

def _estimate_soh(inp: BatteryInput) -> SOHResult:
    """
    Estimate State of Health using a multi-factor weighted formula.

    The four primary contributors are:
      1. Capacity fade  – requires measured capacity; otherwise estimated from cycle degradation
      2. Internal resistance rise – relative to chemistry baseline
      3. Cycle degradation  – fraction of max cycle life consumed
      4. Calendar aging   – based on age and chemistry annual fade

    Each component is combined with empirical weights derived from battery
    literature. The result is labeled as a PROTOTYPE ESTIMATE.
    """
    chemistry = inp.chemistry
    max_cycles = CHEMISTRY_MAX_CYCLES.get(chemistry, CHEMISTRY_MAX_CYCLES["default"])
    annual_fade = CHEMISTRY_ANNUAL_DEGRADATION.get(chemistry, CHEMISTRY_ANNUAL_DEGRADATION["default"])
    baseline_r = CHEMISTRY_BASELINE_RESISTANCE.get(chemistry, CHEMISTRY_BASELINE_RESISTANCE["default"])

    # --- Component 1: Capacity-based SOH (if measured capacity available) ---
    if inp.measured_capacity_ah and inp.rated_capacity_ah > 0:
        capacity_soh = (inp.measured_capacity_ah / inp.rated_capacity_ah) * 100.0
        capacity_weight = 0.45
    else:
        # Estimate from cycle count and age
        cycle_fraction = min(inp.cycle_count / max_cycles, 1.0)
        capacity_soh = 100.0 - (30.0 * cycle_fraction)  # linear fade from 100→70 over full lifetime
        capacity_weight = 0.35

    # --- Component 2: Internal resistance SOH ---
    # A doubling of baseline resistance ≈ 70% SOH for most chemistries
    r_ratio = inp.internal_resistance_mohm / max(baseline_r, 1.0)
    # Map r_ratio 1.0→100%, 2.0→70%, 3.0→50%
    r_soh = 100.0 - (30.0 * (r_ratio - 1.0))
    r_soh = max(min(r_soh, 100.0), 40.0)
    r_weight = 0.30

    # --- Component 3: Cycle degradation ---
    cycle_fraction = min(inp.cycle_count / max_cycles, 1.0)
    cycle_soh = 100.0 - (30.0 * cycle_fraction)
    cycle_weight = 0.15

    # --- Component 4: Calendar aging ---
    calendar_fade = annual_fade * inp.age_years
    calendar_soh = max(100.0 - calendar_fade, 50.0)
    calendar_weight = 0.10

    total_weight = capacity_weight + r_weight + cycle_weight + calendar_weight

    raw_soh = (
        capacity_soh * capacity_weight
        + r_soh * r_weight
        + cycle_soh * cycle_weight
        + calendar_soh * calendar_weight
    ) / total_weight

    # --- Temperature stress penalty ---
    if inp.temperature_c > TEMP_WARNING:
        raw_soh -= 2.0
    elif inp.temperature_c > TEMP_OPTIMAL_MAX:
        raw_soh -= 0.5

    soh = round(max(min(raw_soh, 99.9), 10.0), 1)

    # Confidence: higher when measured capacity is available
    confidence = 92.0 if inp.measured_capacity_ah else 78.0

    return SOHResult(
        soh_pct=soh,
        health_status=_health_status_label(soh),
        confidence_pct=confidence,
        features_used={
            "capacity_component": round(capacity_soh, 1),
            "resistance_component": round(r_soh, 1),
            "cycle_component": round(cycle_soh, 1),
            "calendar_component": round(calendar_soh, 1),
            "temperature_c": inp.temperature_c,
        },
    )


def _health_status_label(soh: float) -> str:
    if soh >= 90:
        return "Excellent"
    elif soh >= 80:
        return "Good"
    elif soh >= 70:
        return "Fair"
    elif soh >= 60:
        return "Poor"
    else:
        return "Critical"


# ---------------------------------------------------------------------------
# RUL estimation
# ---------------------------------------------------------------------------

def _estimate_rul(inp: BatteryInput, soh: float) -> RULResult:
    """Estimate Remaining Useful Life based on SOH and degradation rate."""
    chemistry = inp.chemistry
    max_cycles = CHEMISTRY_MAX_CYCLES.get(chemistry, CHEMISTRY_MAX_CYCLES["default"])
    annual_fade = CHEMISTRY_ANNUAL_DEGRADATION.get(chemistry, CHEMISTRY_ANNUAL_DEGRADATION["default"])

    eol_soh = 70.0
    soh_remaining = max(soh - eol_soh, 0.0)

    # Years remaining at current degradation rate
    if annual_fade > 0:
        rul_years = round(soh_remaining / annual_fade, 1)
    else:
        rul_years = 0.0

    # Adjust for temperature stress
    if inp.temperature_c > TEMP_WARNING:
        rul_years *= 0.8  # 20% penalty for thermal stress
    elif inp.temperature_c > TEMP_OPTIMAL_MAX:
        rul_years *= 0.92

    rul_years = max(round(rul_years, 1), 0.0)

    # Cycle-based RUL
    remaining_cycles = max(max_cycles - inp.cycle_count, 0)
    rul_cycles = int(remaining_cycles)

    # Degradation projections (linear extrapolation)
    projections = DegradationProjection(
        months_6=max(round(soh - annual_fade * 0.5, 1), eol_soh - 5),
        months_12=max(round(soh - annual_fade * 1.0, 1), eol_soh - 5),
        months_24=max(round(soh - annual_fade * 2.0, 1), eol_soh - 5),
        months_36=max(round(soh - annual_fade * 3.0, 1), eol_soh - 5),
        annual_rate_pct=round(annual_fade, 2),
    )

    return RULResult(
        rul_years=rul_years,
        rul_cycles=rul_cycles,
        confidence_pct=80.0,
        degradation=projections,
    )


# ---------------------------------------------------------------------------
# Safety Risk assessment
# ---------------------------------------------------------------------------

def _assess_risk(inp: BatteryInput, soh: float) -> RiskResult:
    """Rule-based safety risk assessment. Prototype only."""
    factors: list[RiskFactor] = []
    score = 0.0

    chemistry = inp.chemistry
    baseline_r = CHEMISTRY_BASELINE_RESISTANCE.get(chemistry, CHEMISTRY_BASELINE_RESISTANCE["default"])
    max_cycles = CHEMISTRY_MAX_CYCLES.get(chemistry, CHEMISTRY_MAX_CYCLES["default"])

    # --- Temperature ---
    if inp.temperature_c > TEMP_CRITICAL:
        factors.append(RiskFactor("Critical Temperature", "HIGH", f"Temperature {inp.temperature_c}°C exceeds critical threshold ({TEMP_CRITICAL}°C)", inp.temperature_c))
        score += 35
    elif inp.temperature_c > TEMP_WARNING:
        factors.append(RiskFactor("High Temperature", "HIGH", f"Temperature {inp.temperature_c}°C exceeds safe operating threshold ({TEMP_WARNING}°C)", inp.temperature_c))
        score += 22
    elif inp.temperature_c > TEMP_OPTIMAL_MAX:
        factors.append(RiskFactor("Elevated Temperature", "MODERATE", f"Temperature {inp.temperature_c}°C above optimal range ({TEMP_OPTIMAL_MAX}°C)", inp.temperature_c))
        score += 8

    # --- Internal resistance ---
    r_ratio = inp.internal_resistance_mohm / max(baseline_r, 1.0)
    if r_ratio > 4.0:
        factors.append(RiskFactor("Critical Internal Resistance", "HIGH", f"Resistance {inp.internal_resistance_mohm:.1f}mΩ is {r_ratio:.1f}× baseline — severe degradation", inp.internal_resistance_mohm))
        score += 30
    elif r_ratio > 2.5:
        factors.append(RiskFactor("High Internal Resistance", "HIGH", f"Resistance {inp.internal_resistance_mohm:.1f}mΩ is {r_ratio:.1f}× baseline", inp.internal_resistance_mohm))
        score += 18
    elif r_ratio > 1.8:
        factors.append(RiskFactor("Elevated Internal Resistance", "MODERATE", f"Resistance {inp.internal_resistance_mohm:.1f}mΩ is {r_ratio:.1f}× baseline", inp.internal_resistance_mohm))
        score += 8

    # --- SOH degradation ---
    if soh < 60:
        factors.append(RiskFactor("Advanced Capacity Degradation", "HIGH", f"SOH {soh}% is well below safe operating threshold", soh))
        score += 25
    elif soh < 70:
        factors.append(RiskFactor("Significant Capacity Degradation", "MODERATE", f"SOH {soh}% is approaching end-of-life threshold (70%)", soh))
        score += 12
    elif soh < 80:
        factors.append(RiskFactor("Moderate Capacity Degradation", "LOW", f"SOH {soh}% within acceptable range but declining", soh))
        score += 4

    # --- Cycle count ---
    cycle_fraction = inp.cycle_count / max(max_cycles, 1)
    if cycle_fraction > 0.9:
        factors.append(RiskFactor("Near End-of-Cycle-Life", "HIGH", f"Cycle count {inp.cycle_count} at {cycle_fraction*100:.0f}% of rated lifetime", inp.cycle_count))
        score += 15
    elif cycle_fraction > 0.7:
        factors.append(RiskFactor("High Cycle Count", "MODERATE", f"Cycle count {inp.cycle_count} at {cycle_fraction*100:.0f}% of rated lifetime", inp.cycle_count))
        score += 7

    # --- Voltage anomaly ---
    voltage_ratio = inp.voltage_v / max(inp.rated_voltage_v, 1.0)
    if voltage_ratio < 0.75 or voltage_ratio > 1.05:
        factors.append(RiskFactor("Voltage Anomaly", "MODERATE", f"Measured voltage {inp.voltage_v}V deviates from rated {inp.rated_voltage_v}V", inp.voltage_v))
        score += 10

    # If no risk factors found, add a nominal "all clear"
    if not factors:
        factors.append(RiskFactor("Normal Operation", "LOW", "All measured parameters within normal operating ranges.", None))

    score = min(round(score, 1), 100.0)

    if score >= 60:
        risk_level = "HIGH"
        action = "⛔ Immediate inspection required. Remove from active service and conduct thorough diagnostics."
    elif score >= 30:
        risk_level = "MODERATE"
        action = "⚠ Schedule inspection within 30-90 days. Increase monitoring frequency. Review operating conditions."
    else:
        risk_level = "LOW"
        action = "✅ Continue normal operation. Maintain routine monitoring schedule."

    return RiskResult(
        risk_score=score,
        risk_level=risk_level,
        risk_factors=factors,
        recommended_action=action,
    )


# ---------------------------------------------------------------------------
# Second-life assessment
# ---------------------------------------------------------------------------

def _assess_second_life(inp: BatteryInput, soh: float, risk: RiskResult) -> SecondLifeResult:
    """Determine second-life suitability based on SOH, risk, and cycle count."""
    chemistry = inp.chemistry
    max_cycles = CHEMISTRY_MAX_CYCLES.get(chemistry, CHEMISTRY_MAX_CYCLES["default"])
    cycle_fraction = inp.cycle_count / max(max_cycles, 1)

    # Score starts at 100 and is penalized
    score = 100.0
    reasoning: list[str] = []

    # SOH penalty
    if soh >= 90:
        reasoning.append(f"Excellent State of Health ({soh}%) — suitable for continued EV use")
    elif soh >= 80:
        score -= 10
        reasoning.append(f"Good State of Health ({soh}%) — suitable for continued EV or high-demand storage use")
    elif soh >= 70:
        score -= 25
        reasoning.append(f"Fair State of Health ({soh}%) — suitable for stationary energy storage applications")
    elif soh >= 60:
        score -= 45
        reasoning.append(f"Poor State of Health ({soh}%) — refurbishment may restore viability")
    else:
        score -= 65
        reasoning.append(f"Critical State of Health ({soh}%) — below minimum threshold for second-life use")

    # Risk penalty
    if risk.risk_level == "HIGH":
        score -= 20
        reasoning.append("Elevated safety risk limits second-life deployment options")
    elif risk.risk_level == "MODERATE":
        score -= 8
        reasoning.append("Moderate safety risk — manageable with proper monitoring in second-life application")
    else:
        reasoning.append("Low safety risk supports broad second-life application options")

    # Cycle count penalty
    if cycle_fraction > 0.85:
        score -= 15
        reasoning.append(f"High cycle utilization ({cycle_fraction*100:.0f}% of rated life) significantly limits reuse potential")
    elif cycle_fraction > 0.60:
        score -= 6
        reasoning.append(f"Moderate cycle utilization ({cycle_fraction*100:.0f}% of rated life)")
    else:
        reasoning.append(f"Cycle count ({inp.cycle_count}) within acceptable range for second-life applications")

    # Chemistry bonus (LFP has longer second-life suitability)
    if chemistry == "LFP":
        score += 5
        reasoning.append("LFP chemistry has inherently longer cycle life and thermal stability, improving second-life viability")

    # Temperature history
    if inp.temperature_c > TEMP_WARNING:
        score -= 8
        reasoning.append(f"Elevated operating temperature ({inp.temperature_c}°C) may indicate thermal stress history")

    score = max(min(round(score, 1), 100.0), 0.0)

    # Classification
    if score >= 85:
        classification = "Continue EV Use"
        app = "Continue EV Use"
    elif score >= 65:
        classification = "Second-Life Energy Storage"
        app = "Stationary Energy Storage"
    elif score >= 45:
        classification = "Refurbishment"
        app = "Stationary Energy Storage (after refurbishment)"
    else:
        classification = "Recycling"
        app = "Material Recovery & Recycling"

    return SecondLifeResult(
        second_life_score=score,
        classification=classification,
        recommended_application=app,
        reasoning=reasoning,
    )


# ---------------------------------------------------------------------------
# Master analysis function
# ---------------------------------------------------------------------------

def run_full_analysis(inp: BatteryInput) -> FullAnalysisResult:
    """Run the complete battery analysis pipeline and return all results."""
    soh_result = _estimate_soh(inp)
    rul_result = _estimate_rul(inp, soh_result.soh_pct)
    risk_result = _assess_risk(inp, soh_result.soh_pct)
    sl_result = _assess_second_life(inp, soh_result.soh_pct, risk_result)

    # Top-level recommended action
    if risk_result.risk_level == "HIGH":
        top_action = "⛔ Immediate action required — remove from service and inspect"
    elif sl_result.classification == "Continue EV Use":
        top_action = "✅ Battery is healthy — continue EV use with routine monitoring"
    elif sl_result.classification == "Second-Life Energy Storage":
        top_action = "🔋 Consider second-life deployment in stationary energy storage"
    elif sl_result.classification == "Refurbishment":
        top_action = "🔧 Refurbishment recommended before further deployment"
    else:
        top_action = "♻ Prepare for responsible recycling and material recovery"

    # Explanation points (AI-style, but clearly derived from measurable features)
    explanation = []
    f = soh_result.features_used

    explanation.append(
        f"Capacity degradation factor: {f.get('capacity_component', 'N/A')}% "
        f"({'measured' if inp.measured_capacity_ah else 'cycle-estimated'} capacity)"
    )
    explanation.append(
        f"Internal resistance factor: {f.get('resistance_component', 'N/A')}% "
        f"(measured {inp.internal_resistance_mohm}mΩ vs. {CHEMISTRY_BASELINE_RESISTANCE.get(inp.chemistry, 10)}mΩ baseline)"
    )
    explanation.append(
        f"Cycle utilization: {inp.cycle_count} cycles consumed of rated life "
        f"({round(inp.cycle_count / max(CHEMISTRY_MAX_CYCLES.get(inp.chemistry, 2000), 1) * 100, 1)}% of rated lifetime)"
    )
    explanation.append(
        f"Calendar aging: {inp.age_years} years × {CHEMISTRY_ANNUAL_DEGRADATION.get(inp.chemistry, 2.5)}%/year fade rate"
    )
    if inp.temperature_c > TEMP_OPTIMAL_MAX:
        explanation.append(
            f"Operating temperature {inp.temperature_c}°C contributes additional stress — above {TEMP_OPTIMAL_MAX}°C optimal ceiling"
        )
    else:
        explanation.append(
            f"Temperature {inp.temperature_c}°C is within optimal operating range"
        )

    return FullAnalysisResult(
        soh=soh_result,
        rul=rul_result,
        risk=risk_result,
        second_life=sl_result,
        recommended_action=top_action,
        explanation_points=explanation,
    )

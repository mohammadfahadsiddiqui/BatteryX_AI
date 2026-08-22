"""BatteryX AI – Database seed: demo batteries, users, and analysis results.

All data is clearly marked as DEMO DATA and must not be interpreted
as real-world validated battery measurements.
"""
import random
from datetime import datetime, date, timedelta
from app.db.session import SessionLocal, engine
from app.db.models import Base, Organization, User, Battery, BatteryReading, BatteryCycle, DiagnosticTest, SOHPrediction, RULPrediction, RiskAssessment, SecondLifeAssessment, Certificate
from app.core.security import get_password_hash


# ---------------------------------------------------------------------------
# Demo battery configurations
# ---------------------------------------------------------------------------

DEMO_BATTERIES = [
    {
        "battery_id": "BX-2026-00124",
        "manufacturer": "CATL",
        "model": "NMC-100Ah-Pro",
        "chemistry": "Li-ion NMC",
        "rated_capacity_ah": 100.0,
        "rated_voltage_v": 400.0,
        "age_years": 2.1,
        "cycle_count": 1284,
        "soh": 87.0,
        "rul_years": 4.2,
        "risk_level": "LOW",
        "risk_score": 18.5,
        "second_life_score": 91.0,
        "second_life_class": "Continue EV Use",
        "recommended_app": "Stationary Energy Storage",
        "cert_id": "BX-AI-839271",
        "mfg_date": date(2024, 1, 15),
        "install_date": date(2024, 3, 1),
        "voltage": 396.8,
        "current": -42.3,
        "temperature": 28.4,
        "soc": 74.2,
        "resistance": 18.5,
    },
    {
        "battery_id": "BX-2026-00098",
        "manufacturer": "BYD",
        "model": "Blade-120Ah",
        "chemistry": "LFP",
        "rated_capacity_ah": 120.0,
        "rated_voltage_v": 360.0,
        "age_years": 0.8,
        "cycle_count": 312,
        "soh": 94.0,
        "rul_years": 7.8,
        "risk_level": "LOW",
        "risk_score": 8.2,
        "second_life_score": 97.0,
        "second_life_class": "Continue EV Use",
        "recommended_app": "Continue EV Use",
        "cert_id": "BX-AI-124853",
        "mfg_date": date(2025, 6, 10),
        "install_date": date(2025, 8, 20),
        "voltage": 358.2,
        "current": 25.1,
        "temperature": 27.1,
        "soc": 88.5,
        "resistance": 12.1,
    },
    {
        "battery_id": "BX-2026-00201",
        "manufacturer": "Panasonic",
        "model": "NCA-75Ah",
        "chemistry": "Li-ion NCA",
        "rated_capacity_ah": 75.0,
        "rated_voltage_v": 350.0,
        "age_years": 4.3,
        "cycle_count": 2198,
        "soh": 72.0,
        "rul_years": 2.1,
        "risk_level": "MODERATE",
        "risk_score": 52.0,
        "second_life_score": 62.0,
        "second_life_class": "Refurbishment",
        "recommended_app": "Stationary Energy Storage (after refurb)",
        "cert_id": "BX-AI-445621",
        "mfg_date": date(2021, 11, 5),
        "install_date": date(2022, 1, 20),
        "voltage": 342.1,
        "current": -15.8,
        "temperature": 34.7,
        "soc": 58.3,
        "resistance": 28.4,
    },
    {
        "battery_id": "BX-2026-00312",
        "manufacturer": "Samsung SDI",
        "model": "SDI-LFP-80Ah",
        "chemistry": "LFP",
        "rated_capacity_ah": 80.0,
        "rated_voltage_v": 380.0,
        "age_years": 6.2,
        "cycle_count": 3841,
        "soh": 61.0,
        "rul_years": 0.8,
        "risk_level": "HIGH",
        "risk_score": 78.5,
        "second_life_score": 28.0,
        "second_life_class": "Recycling",
        "recommended_app": "Responsible Recycling",
        "cert_id": "BX-AI-667432",
        "mfg_date": date(2019, 8, 22),
        "install_date": date(2019, 11, 15),
        "voltage": 358.9,
        "current": -8.2,
        "temperature": 41.3,
        "soc": 42.1,
        "resistance": 45.2,
    },
    {
        "battery_id": "BX-2026-00445",
        "manufacturer": "LG Energy Solution",
        "model": "LGES-NMC-90Ah",
        "chemistry": "Li-ion NMC",
        "rated_capacity_ah": 90.0,
        "rated_voltage_v": 400.0,
        "age_years": 3.1,
        "cycle_count": 1650,
        "soh": 81.0,
        "rul_years": 3.2,
        "risk_level": "LOW",
        "risk_score": 24.1,
        "second_life_score": 82.0,
        "second_life_class": "Second-Life Energy Storage",
        "recommended_app": "Stationary Energy Storage",
        "cert_id": "BX-AI-778901",
        "mfg_date": date(2022, 10, 18),
        "install_date": date(2023, 1, 8),
        "voltage": 394.5,
        "current": 31.7,
        "temperature": 30.2,
        "soc": 69.8,
        "resistance": 21.3,
    },
    {
        "battery_id": "BX-2026-00556",
        "manufacturer": "SK Innovation",
        "model": "NMC811-105Ah",
        "chemistry": "NMC 811",
        "rated_capacity_ah": 105.0,
        "rated_voltage_v": 400.0,
        "age_years": 1.5,
        "cycle_count": 689,
        "soh": 89.0,
        "rul_years": 5.8,
        "risk_level": "LOW",
        "risk_score": 14.8,
        "second_life_score": 93.0,
        "second_life_class": "Continue EV Use",
        "recommended_app": "Continue EV Use",
        "cert_id": "BX-AI-334521",
        "mfg_date": date(2025, 1, 12),
        "install_date": date(2025, 3, 28),
        "voltage": 399.1,
        "current": -65.2,
        "temperature": 29.8,
        "soc": 81.4,
        "resistance": 15.2,
    },
    {
        "battery_id": "BX-2026-00667",
        "manufacturer": "CALB",
        "model": "LFP-100Ah-V2",
        "chemistry": "LFP",
        "rated_capacity_ah": 100.0,
        "rated_voltage_v": 360.0,
        "age_years": 4.8,
        "cycle_count": 2687,
        "soh": 68.0,
        "rul_years": 1.5,
        "risk_level": "MODERATE",
        "risk_score": 47.3,
        "second_life_score": 55.0,
        "second_life_class": "Second-Life Energy Storage",
        "recommended_app": "Grid Storage (limited cycles)",
        "cert_id": "BX-AI-512867",
        "mfg_date": date(2021, 3, 22),
        "install_date": date(2021, 6, 10),
        "voltage": 348.8,
        "current": -12.1,
        "temperature": 36.5,
        "soc": 52.7,
        "resistance": 33.8,
    },
    {
        "battery_id": "BX-2026-00778",
        "manufacturer": "AESC",
        "model": "AESC-NCA-60Ah",
        "chemistry": "Li-ion NCA",
        "rated_capacity_ah": 60.0,
        "rated_voltage_v": 340.0,
        "age_years": 7.1,
        "cycle_count": 4102,
        "soh": 55.0,
        "rul_years": 0.4,
        "risk_level": "HIGH",
        "risk_score": 87.2,
        "second_life_score": 18.0,
        "second_life_class": "Recycling",
        "recommended_app": "Material Recovery",
        "cert_id": "BX-AI-901345",
        "mfg_date": date(2018, 5, 10),
        "install_date": date(2018, 8, 1),
        "voltage": 315.4,
        "current": -4.2,
        "temperature": 45.8,
        "soc": 35.2,
        "resistance": 58.9,
    },
    {
        "battery_id": "BX-2026-00889",
        "manufacturer": "CATL",
        "model": "NMC622-95Ah",
        "chemistry": "NMC 622",
        "rated_capacity_ah": 95.0,
        "rated_voltage_v": 380.0,
        "age_years": 1.2,
        "cycle_count": 421,
        "soh": 91.0,
        "rul_years": 6.5,
        "risk_level": "LOW",
        "risk_score": 11.2,
        "second_life_score": 95.0,
        "second_life_class": "Continue EV Use",
        "recommended_app": "Continue EV Use",
        "cert_id": "BX-AI-234789",
        "mfg_date": date(2025, 4, 5),
        "install_date": date(2025, 6, 18),
        "voltage": 378.9,
        "current": 42.8,
        "temperature": 26.3,
        "soc": 90.1,
        "resistance": 13.7,
    },
    {
        "battery_id": "BX-2026-00990",
        "manufacturer": "Envision AESC",
        "model": "LFP-150Ah-Prime",
        "chemistry": "LFP",
        "rated_capacity_ah": 150.0,
        "rated_voltage_v": 400.0,
        "age_years": 3.5,
        "cycle_count": 1876,
        "soh": 76.0,
        "rul_years": 2.8,
        "risk_level": "MODERATE",
        "risk_score": 38.6,
        "second_life_score": 72.0,
        "second_life_class": "Second-Life Energy Storage",
        "recommended_app": "Residential Storage",
        "cert_id": "BX-AI-456123",
        "mfg_date": date(2022, 7, 14),
        "install_date": date(2022, 9, 30),
        "voltage": 385.2,
        "current": -22.5,
        "temperature": 32.1,
        "soc": 63.4,
        "resistance": 26.1,
    },
]


def _get_health_status(soh: float) -> str:
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


def _get_degradation_projections(soh: float, rul_years: float) -> dict:
    """Generate simple linear degradation projections."""
    eol_soh = 70.0
    annual_degradation = (soh - eol_soh) / max(rul_years, 0.1)
    projections = {}
    for months in [6, 12, 24, 36]:
        projected = round(soh - (annual_degradation * months / 12), 1)
        projections[str(months)] = max(projected, eol_soh - 5)
    return projections


def _get_risk_factors(b: dict) -> list:
    factors = []
    if b["temperature"] > 40:
        factors.append({"factor": "High Temperature", "severity": "HIGH", "description": f"Cell temperature {b['temperature']}°C exceeds safe operating range"})
    elif b["temperature"] > 35:
        factors.append({"factor": "Elevated Temperature", "severity": "MODERATE", "description": f"Cell temperature {b['temperature']}°C approaching upper limit"})

    if b["resistance"] > 40:
        factors.append({"factor": "High Internal Resistance", "severity": "HIGH", "description": f"Internal resistance {b['resistance']} mΩ indicates significant degradation"})
    elif b["resistance"] > 25:
        factors.append({"factor": "Elevated Internal Resistance", "severity": "MODERATE", "description": f"Internal resistance {b['resistance']} mΩ above baseline"})

    if b["soh"] < 65:
        factors.append({"factor": "Advanced Capacity Degradation", "severity": "HIGH", "description": f"SOH {b['soh']}% well below optimal range"})

    if b["cycle_count"] > 3000:
        factors.append({"factor": "High Cycle Count", "severity": "MODERATE", "description": f"Cycle count {b['cycle_count']} indicates end-of-life approach"})

    return factors if factors else [{"factor": "Normal Operation", "severity": "LOW", "description": "All measured parameters within normal operating range"}]


def _get_second_life_reasoning(b: dict) -> list:
    reasons = []
    if b["soh"] >= 80:
        reasons.append(f"State of Health ({b['soh']}%) is above 80% threshold for continued EV use")
    elif b["soh"] >= 70:
        reasons.append(f"State of Health ({b['soh']}%) suitable for stationary energy storage applications")
    elif b["soh"] >= 60:
        reasons.append(f"State of Health ({b['soh']}%) may be recoverable with refurbishment")
    else:
        reasons.append(f"State of Health ({b['soh']}%) below 60% — material recovery is most appropriate")

    if b["cycle_count"] > 3000:
        reasons.append(f"High cycle count ({b['cycle_count']}) limits viable second-life applications")
    
    if b["risk_level"] == "LOW":
        reasons.append("Low safety risk supports broader application options")
    elif b["risk_level"] == "HIGH":
        reasons.append("Elevated safety risk restricts second-life deployment options")
    
    reasons.append(f"Internal resistance ({b['resistance']} mΩ) {'within' if b['resistance'] < 30 else 'above'} acceptable range for reuse")
    return reasons


def seed_database():
    """Create all tables and seed demo data."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(User).count() > 0:
            print("[OK] Database already seeded, skipping.")
            return

        # ---- Organization ----
        org = Organization(
            id="org-demo-001",
            name="BatteryX Demo Organization",
            type="EV Service Center",
        )
        db.add(org)

        # ---- Users ----
        admin = User(
            id="user-admin-001",
            email="admin@batteryx.ai",
            hashed_password=get_password_hash("BatteryX2026!"),
            full_name="Admin User",
            role="admin",
            organization_id="org-demo-001",
        )
        tech = User(
            id="user-tech-001",
            email="technician@batteryx.ai",
            hashed_password=get_password_hash("Tech2026!"),
            full_name="Demo Technician",
            role="technician",
            organization_id="org-demo-001",
        )
        db.add_all([admin, tech])
        db.flush()

        # ---- Batteries + Analysis ----
        for b_data in DEMO_BATTERIES:
            battery = Battery(
                battery_id=b_data["battery_id"],
                manufacturer=b_data["manufacturer"],
                model=b_data["model"],
                chemistry=b_data["chemistry"],
                rated_capacity_ah=b_data["rated_capacity_ah"],
                rated_voltage_v=b_data["rated_voltage_v"],
                manufacturing_date=b_data["mfg_date"],
                installation_date=b_data["install_date"],
                age_years=b_data["age_years"],
                cycle_count=b_data["cycle_count"],
                organization_id="org-demo-001",
                is_demo=True,
                status="active",
                notes="DEMO DATA – Not a real-world validated battery measurement.",
            )
            db.add(battery)
            db.flush()

            # Reading
            reading = BatteryReading(
                battery_id=battery.id,
                voltage_v=b_data["voltage"],
                current_a=b_data["current"],
                temperature_c=b_data["temperature"],
                soc_pct=b_data["soc"],
                internal_resistance_mohm=b_data["resistance"],
                source="demo",
            )
            db.add(reading)

            # Diagnostic
            diag = DiagnosticTest(
                battery_id=battery.id,
                run_by_user_id="user-admin-001",
                status="complete",
                completed_at=datetime.utcnow(),
                notes="DEMO DATA analysis run",
            )
            db.add(diag)
            db.flush()

            # SOH
            soh = SOHPrediction(
                battery_id=battery.id,
                diagnostic_test_id=diag.id,
                soh_pct=b_data["soh"],
                health_status=_get_health_status(b_data["soh"]),
                confidence_pct=92.0,
                method="physics_based_prototype",
                prediction_notes="DEMO DATA – Physics-based prototype estimate, not scientifically validated.",
            )
            db.add(soh)

            # RUL
            rul = RULPrediction(
                battery_id=battery.id,
                diagnostic_test_id=diag.id,
                rul_years=b_data["rul_years"],
                rul_cycles=int(b_data["rul_years"] * 400),
                confidence_pct=85.0,
                soh_at_eol_pct=70.0,
                degradation_projections=_get_degradation_projections(b_data["soh"], b_data["rul_years"]),
            )
            db.add(rul)

            # Risk
            risk = RiskAssessment(
                battery_id=battery.id,
                diagnostic_test_id=diag.id,
                risk_score=b_data["risk_score"],
                risk_level=b_data["risk_level"],
                risk_factors=_get_risk_factors(b_data),
                recommended_action={
                    "LOW": "Continue normal operation with routine monitoring.",
                    "MODERATE": "Schedule inspection within 3 months. Monitor temperature and resistance.",
                    "HIGH": "Immediate inspection required. Remove from service if risk increases.",
                }[b_data["risk_level"]],
            )
            db.add(risk)

            # Second life
            sl = SecondLifeAssessment(
                battery_id=battery.id,
                diagnostic_test_id=diag.id,
                second_life_score=b_data["second_life_score"],
                classification=b_data["second_life_class"],
                recommended_application=b_data["recommended_app"],
                reasoning=_get_second_life_reasoning(b_data),
            )
            db.add(sl)

            # Certificate
            cert = Certificate(
                certificate_id=b_data["cert_id"],
                battery_id=battery.id,
                diagnostic_test_id=diag.id,
                soh_pct=b_data["soh"],
                rul_years=b_data["rul_years"],
                risk_level=b_data["risk_level"],
                second_life_classification=b_data["second_life_class"],
                recommended_application=b_data["recommended_app"],
                cycle_count=b_data["cycle_count"],
                assessment_summary=f"DEMO DATA — Battery {b_data['battery_id']} assessed using BatteryX AI prototype engine. SOH: {b_data['soh']}%. This certificate is generated from simulated data for demonstration purposes only.",
                is_valid=True,
            )
            db.add(cert)

        db.commit()
        print("[OK] Database seeded with 10 demo batteries and demo users.")
        print("   Admin: admin@batteryx.ai / BatteryX2026!")
        print("   Tech:  technician@batteryx.ai / Tech2026!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

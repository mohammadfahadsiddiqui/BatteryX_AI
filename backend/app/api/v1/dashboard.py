"""BatteryX AI – Dashboard statistics API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.db.models import Battery, SOHPrediction, RiskAssessment, SecondLifeAssessment, DiagnosticTest, User
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_batteries = db.query(Battery).count()

    # Latest SOH per battery
    soh_records = db.query(SOHPrediction).all()
    # Group by battery_id keeping latest
    latest_soh_map = {}
    for s in soh_records:
        if s.battery_id not in latest_soh_map or s.created_at > latest_soh_map[s.battery_id].created_at:
            latest_soh_map[s.battery_id] = s

    soh_values = [s.soh_pct for s in latest_soh_map.values()]
    avg_soh = round(sum(soh_values) / len(soh_values), 1) if soh_values else 0.0

    # Health distribution
    health_dist = {"Excellent": 0, "Good": 0, "Fair": 0, "Poor": 0, "Critical": 0}
    for s in latest_soh_map.values():
        health_dist[s.health_status] = health_dist.get(s.health_status, 0) + 1

    # Risk distribution
    risk_records = db.query(RiskAssessment).all()
    latest_risk_map = {}
    for r in risk_records:
        if r.battery_id not in latest_risk_map or r.created_at > latest_risk_map[r.battery_id].created_at:
            latest_risk_map[r.battery_id] = r

    risk_dist = {"LOW": 0, "MODERATE": 0, "HIGH": 0}
    high_risk = 0
    for r in latest_risk_map.values():
        risk_dist[r.risk_level] = risk_dist.get(r.risk_level, 0) + 1
        if r.risk_level == "HIGH":
            high_risk += 1

    # Second-life distribution
    sl_records = db.query(SecondLifeAssessment).all()
    latest_sl_map = {}
    for sl in sl_records:
        if sl.battery_id not in latest_sl_map or sl.created_at > latest_sl_map[sl.battery_id].created_at:
            latest_sl_map[sl.battery_id] = sl

    sl_dist = {}
    second_life_eligible = 0
    for sl in latest_sl_map.values():
        sl_dist[sl.classification] = sl_dist.get(sl.classification, 0) + 1
        if sl.classification in ("Continue EV Use", "Second-Life Energy Storage"):
            second_life_eligible += 1

    # Recent diagnostics (last 10)
    batteries = db.query(Battery).limit(10).all()
    recent = []
    for b in batteries:
        s = latest_soh_map.get(b.id)
        r = latest_risk_map.get(b.id)
        sl = latest_sl_map.get(b.id)
        recent.append({
            "battery_id": b.battery_id,
            "soh": s.soh_pct if s else None,
            "rul": None,
            "risk": r.risk_level if r else None,
            "second_life": sl.classification if sl else None,
            "last_analysis": s.created_at.isoformat() if s else None,
            "is_demo": b.is_demo,
        })

    return {
        "total_batteries": total_batteries,
        "average_soh": avg_soh,
        "high_risk_count": high_risk,
        "second_life_eligible": second_life_eligible,
        "health_distribution": health_dist,
        "risk_distribution": risk_dist,
        "second_life_distribution": sl_dist,
        "recent_diagnostics": recent,
    }

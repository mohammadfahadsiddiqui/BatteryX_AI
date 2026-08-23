"""BatteryX AI – Certificate API routes"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Battery, Certificate, SOHPrediction, RULPrediction, RiskAssessment, SecondLifeAssessment, AuditLog, User
from app.models.schemas import CertificateResponse, VerifyResponse
from app.api.deps import get_current_user
from app.services.certificate.generator import generate_certificate_id, generate_certificate_pdf, generate_qr_code

router = APIRouter(prefix="/certificates", tags=["Certificates"])


def _cert_dict(c: Certificate, db: Session) -> dict:
    battery = db.query(Battery).filter(Battery.id == c.battery_id).first()
    return {
        "id": c.id,
        "certificate_id": c.certificate_id,
        "battery_id": c.battery_id,
        "battery_id_str": battery.battery_id if battery else "Unknown",
        "battery_manufacturer": battery.manufacturer if battery else None,
        "battery_model": battery.model if battery else None,
        "soh_pct": c.soh_pct,
        "rul_years": c.rul_years,
        "risk_level": c.risk_level,
        "second_life_classification": c.second_life_classification,
        "recommended_application": c.recommended_application,
        "cycle_count": c.cycle_count,
        "assessment_summary": c.assessment_summary,
        "issued_at": c.issued_at,
        "valid_until": c.valid_until,
        "is_valid": c.is_valid,
        "pdf_path": c.pdf_path,
    }


@router.get("", response_model=List[dict])
def list_certificates(
    search: Optional[str] = None,
    risk: Optional[str] = None,
    second_life: Optional[str] = None,
    is_valid: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all certificates across batteries."""
    q = db.query(Certificate)
    if is_valid is not None:
        q = q.filter(Certificate.is_valid == is_valid)
    if risk:
        q = q.filter(Certificate.risk_level == risk)
    if second_life:
        q = q.filter(Certificate.second_life_classification == second_life)

    certs = q.order_by(Certificate.issued_at.desc()).offset(skip).limit(limit).all()
    results = [_cert_dict(c, db) for c in certs]
    if search:
        s = search.lower()
        results = [
            r for r in results
            if s in r["certificate_id"].lower()
            or s in (r["battery_id_str"] or "").lower()
            or s in (r["battery_manufacturer"] or "").lower()
        ]
    return results


@router.post("/{battery_id}", response_model=CertificateResponse, status_code=201)
def generate_certificate(
    battery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battery = db.query(Battery).filter(Battery.battery_id == battery_id).first()
    if not battery:
        battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    soh = db.query(SOHPrediction).filter(SOHPrediction.battery_id == battery.id).order_by(SOHPrediction.created_at.desc()).first()
    rul = db.query(RULPrediction).filter(RULPrediction.battery_id == battery.id).order_by(RULPrediction.created_at.desc()).first()
    risk = db.query(RiskAssessment).filter(RiskAssessment.battery_id == battery.id).order_by(RiskAssessment.created_at.desc()).first()
    sl = db.query(SecondLifeAssessment).filter(SecondLifeAssessment.battery_id == battery.id).order_by(SecondLifeAssessment.created_at.desc()).first()

    if not soh or not rul or not risk or not sl:
        raise HTTPException(status_code=400, detail="Run a battery analysis first before generating a certificate")

    cert_id = generate_certificate_id()
    # Ensure uniqueness
    while db.query(Certificate).filter(Certificate.certificate_id == cert_id).first():
        cert_id = generate_certificate_id()

    cert = Certificate(
        certificate_id=cert_id,
        battery_id=battery.id,
        soh_pct=soh.soh_pct,
        rul_years=rul.rul_years,
        risk_level=risk.risk_level,
        second_life_classification=sl.classification,
        recommended_application=sl.recommended_application,
        cycle_count=battery.cycle_count or 0,
        assessment_summary=(
            f"Battery {battery.battery_id} assessed using the BatteryX AI prototype analysis engine. "
            f"State of Health: {soh.soh_pct}% ({soh.health_status}). "
            f"Remaining Useful Life estimate: {rul.rul_years} years. "
            f"Safety Risk: {risk.risk_level}. "
            f"Second-Life Classification: {sl.classification}. "
            f"DEMO DATA — Prototype estimate only. Not scientifically validated."
        ),
    )
    db.add(cert)
    log = AuditLog(user_id=current_user.id, action="certificate.generated",
                   resource_type="certificate", resource_id=cert_id)
    db.add(log)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/{certificate_id}", response_model=CertificateResponse)
def get_certificate(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@router.post("/{certificate_id}/revoke")
def revoke_certificate(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    cert.is_valid = False
    log = AuditLog(
        user_id=current_user.id,
        action="certificate.revoked",
        resource_type="certificate",
        resource_id=certificate_id,
    )
    db.add(log)
    db.commit()
    return {"message": f"Certificate {certificate_id} revoked"}


@router.get("/{certificate_id}/pdf")
def download_certificate_pdf(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    battery = db.query(Battery).filter(Battery.id == cert.battery_id).first()

    pdf_bytes = generate_certificate_pdf(
        certificate_id=cert.certificate_id,
        battery_id=battery.battery_id,
        manufacturer=battery.manufacturer or "Unknown",
        model=battery.model or "Unknown",
        chemistry=battery.chemistry or "Unknown",
        soh_pct=cert.soh_pct,
        rul_years=cert.rul_years,
        risk_level=cert.risk_level,
        cycle_count=cert.cycle_count,
        second_life_classification=cert.second_life_classification,
        recommended_application=cert.recommended_application,
        assessment_summary=cert.assessment_summary,
        issued_at=cert.issued_at,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="BatteryX-Certificate-{certificate_id}.pdf"'},
    )


@router.get("/{certificate_id}/qr")
def get_qr_code(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    qr_bytes = generate_qr_code(certificate_id)
    return Response(content=qr_bytes, media_type="image/png")


@router.get("/verify/{certificate_id}", response_model=VerifyResponse)
def verify_certificate(certificate_id: str, db: Session = Depends(get_db)):
    """Public endpoint — no auth required — for QR code scanning."""
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid")

    battery = db.query(Battery).filter(Battery.id == cert.battery_id).first()

    return VerifyResponse(
        is_valid=cert.is_valid,
        certificate_id=cert.certificate_id,
        battery_id=battery.battery_id if battery else "Unknown",
        soh_pct=cert.soh_pct,
        rul_years=cert.rul_years,
        risk_level=cert.risk_level,
        second_life_classification=cert.second_life_classification,
        issued_at=cert.issued_at,
        verified_at=datetime.utcnow(),
    )

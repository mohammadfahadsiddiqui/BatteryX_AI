"""BatteryX AI – Certificate PDF generator and QR code creation"""
import io
import os
import random
import string
from datetime import datetime
from typing import Optional

import qrcode
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

from app.core.config import settings


def generate_certificate_id() -> str:
    """Generate a unique certificate ID like BX-AI-839271."""
    return "BX-AI-" + "".join(random.choices(string.digits, k=6))


def generate_qr_code(certificate_id: str) -> bytes:
    """Generate a QR code image (PNG bytes) pointing to the verify URL."""
    verify_url = f"{settings.BASE_URL}/verify/{certificate_id}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=6,
        border=2,
    )
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0D1526", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_certificate_pdf(
    certificate_id: str,
    battery_id: str,
    manufacturer: str,
    model: str,
    chemistry: str,
    soh_pct: float,
    rul_years: float,
    risk_level: str,
    cycle_count: int,
    second_life_classification: str,
    recommended_application: str,
    assessment_summary: str,
    issued_at: datetime,
    output_path: Optional[str] = None,
) -> bytes:
    """Generate a professional PDF certificate and return it as bytes."""
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    # Color palette
    DARK_BG = HexColor("#050A14")
    ACCENT = HexColor("#3B82F6")
    EMERALD = HexColor("#10B981")
    AMBER = HexColor("#F59E0B")
    RED = HexColor("#EF4444")
    LIGHT = HexColor("#F1F5F9")
    SLATE = HexColor("#94A3B8")
    SURFACE = HexColor("#0D1526")

    RISK_COLORS = {"LOW": EMERALD, "MODERATE": AMBER, "HIGH": RED}
    risk_color = RISK_COLORS.get(risk_level, SLATE)

    styles = getSampleStyleSheet()

    story = []

    # ---- Header ----
    header_data = [[
        Paragraph(
            '<font size="22" color="#3B82F6"><b>BatteryX AI</b></font><br/>'
            '<font size="9" color="#94A3B8">Battery Intelligence Platform</font>',
            styles["Normal"],
        ),
        Paragraph(
            '<font size="11" color="#94A3B8">Battery Health Certificate</font><br/>'
            f'<font size="9" color="#64748B">Certificate ID: </font>'
            f'<font size="9" color="#3B82F6"><b>{certificate_id}</b></font>',
            ParagraphStyle("right", parent=styles["Normal"], alignment=2),
        ),
    ]]
    header_table = Table(header_data, colWidths=[85 * mm, 85 * mm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), DARK_BG),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [DARK_BG]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4 * mm))

    # ---- Demo data banner ----
    story.append(Paragraph(
        '⚠ DEMO DATA — This certificate was generated from simulated data for demonstration purposes only. '
        'Values do not represent real-world validated battery measurements.',
        ParagraphStyle("disclaimer", parent=styles["Normal"], fontSize=7,
                       textColor=AMBER, backColor=HexColor("#1C1810"), borderPad=3, leading=10),
    ))
    story.append(Spacer(1, 4 * mm))

    # ---- Battery ID section ----
    story.append(Paragraph(
        f'<font size="14" color="#F1F5F9"><b>Battery:</b></font> '
        f'<font size="14" color="#3B82F6"><b>{battery_id}</b></font>',
        styles["Normal"],
    ))
    story.append(Spacer(1, 2 * mm))

    # ---- Key metrics row ----
    soh_color = EMERALD if soh_pct >= 80 else (AMBER if soh_pct >= 70 else RED)

    metrics_data = [
        [
            Paragraph(f'<font size="22" color="{soh_color.hexval()}"><b>{soh_pct}%</b></font><br/>'
                      '<font size="9" color="#94A3B8">State of Health</font>', styles["Normal"]),
            Paragraph(f'<font size="22" color="#F1F5F9"><b>{rul_years}y</b></font><br/>'
                      '<font size="9" color="#94A3B8">Remaining Useful Life</font>', styles["Normal"]),
            Paragraph(f'<font size="18" color="{risk_color.hexval()}"><b>{risk_level}</b></font><br/>'
                      '<font size="9" color="#94A3B8">Safety Risk</font>', styles["Normal"]),
            Paragraph(f'<font size="11" color="#10B981"><b>{second_life_classification}</b></font><br/>'
                      '<font size="9" color="#94A3B8">Second-Life Path</font>', styles["Normal"]),
        ]
    ]
    metrics_table = Table(metrics_data, colWidths=[43 * mm, 43 * mm, 43 * mm, 43 * mm])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
        ("BOX", (0, 0), (-1, -1), 1, HexColor("#1E2D4A")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, HexColor("#1E2D4A")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 4 * mm))

    # ---- Battery details table ----
    story.append(Paragraph('<font size="10" color="#94A3B8"><b>BATTERY DETAILS</b></font>', styles["Normal"]))
    story.append(Spacer(1, 2 * mm))

    details_data = [
        ["Manufacturer", manufacturer, "Cycle Count", f"{cycle_count:,}"],
        ["Model", model, "Recommended Application", recommended_application],
        ["Chemistry", chemistry, "Assessment Date", issued_at.strftime("%d %b %Y")],
        ["Certificate ID", certificate_id, "Issuer", "BatteryX AI Platform"],
    ]

    details_table = Table(details_data, colWidths=[35 * mm, 55 * mm, 45 * mm, 37 * mm])
    details_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), HexColor("#0A1628")),
        ("BACKGROUND", (2, 0), (2, -1), HexColor("#0A1628")),
        ("BACKGROUND", (1, 0), (1, -1), SURFACE),
        ("BACKGROUND", (3, 0), (3, -1), SURFACE),
        ("TEXTCOLOR", (0, 0), (0, -1), SLATE),
        ("TEXTCOLOR", (2, 0), (2, -1), SLATE),
        ("TEXTCOLOR", (1, 0), (1, -1), LIGHT),
        ("TEXTCOLOR", (3, 0), (3, -1), LIGHT),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, HexColor("#1E2D4A")),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#1E2D4A")),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 4 * mm))

    # ---- Assessment summary ----
    story.append(Paragraph('<font size="10" color="#94A3B8"><b>ASSESSMENT SUMMARY</b></font>', styles["Normal"]))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        f'<font size="9" color="#CBD5E1">{assessment_summary}</font>',
        ParagraphStyle("summary", parent=styles["Normal"], leading=14, backColor=SURFACE,
                       borderPad=6, leftIndent=4, rightIndent=4),
    ))
    story.append(Spacer(1, 4 * mm))

    # ---- Footer ----
    story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#1E2D4A")))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        f'<font size="7" color="#475569">This certificate was issued by BatteryX AI • '
        f'Verify at {settings.BASE_URL}/verify/{certificate_id} • '
        f'PROTOTYPE — For demonstration only. Not a certified safety assessment.</font>',
        ParagraphStyle("footer", parent=styles["Normal"], alignment=1),
    ))

    doc.build(story)
    pdf_bytes = buf.getvalue()

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)

    return pdf_bytes

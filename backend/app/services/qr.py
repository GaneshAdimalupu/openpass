# backend/app/services/qr.py

import qrcode
import base64
from io import BytesIO
from app.config import settings


def generate_qr_base64(qr_token: str) -> str:
    """
    Generates a QR code image from a token string.
    Returns base64-encoded PNG string (for embedding in emails).
    The QR encodes the ticket view URL so scanning opens the ticket page.
    """
    ticket_url = f"{settings.FRONTEND_URL}/ticket/{qr_token}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(ticket_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return base64.b64encode(buffer.read()).decode("utf-8")


def generate_qr_bytes(qr_token: str) -> bytes:
    """Returns raw PNG bytes of the QR code (for email attachments)."""
    ticket_url = f"{settings.FRONTEND_URL}/ticket/{qr_token}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(ticket_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return buffer.read()

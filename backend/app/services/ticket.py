import base64
from io import BytesIO

import qrcode
from PIL import Image, ImageDraw, ImageFont

from app.config import settings

# ── Colors ────────────────────────────────────────────────────────────────────
INDIGO = "#4F46E5"
DARK = "#111827"
GRAY = "#6B7280"
LIGHT = "#F3F4F6"
WHITE = "#FFFFFF"
ACCENT = "#E5E7EB"

W, H = 800, 400


def _load_fonts() -> tuple:
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    try:
        bold = ImageFont.truetype(paths[0], 28)
        bold_md = ImageFont.truetype(paths[0], 18)
        regular = ImageFont.truetype(paths[1], 14)
        small = ImageFont.truetype(paths[1], 12)
        return bold, bold_md, regular, small
    except OSError:
        default = ImageFont.load_default()
        return default, default, default, default


def _make_qr(token: str) -> Image.Image:
    ticket_url = f"{settings.FRONTEND_URL}/ticket/{token}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=5,
        border=2,
    )
    qr.add_data(ticket_url)
    qr.make(fit=True)
    return qr.make_image(fill_color=DARK, back_color=WHITE).convert("RGB").resize((160, 160))


def generate_ticket_png(
    attendee_name: str,
    attendee_email: str,
    event_title: str,
    event_date: str,
    event_venue: str,
    ticket_name: str,
    qr_token: str,
    ticket_number: str,
) -> bytes:
    """Generates a designed ticket as PNG bytes. Ready to attach to email."""
    font_large, font_medium, font_small, font_tiny = _load_fonts()

    img = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(img)

    # Left accent bar
    draw.rectangle([0, 0, 8, H], fill=INDIGO)

    # Header band
    draw.rectangle([0, 0, W, 80], fill=INDIGO)
    draw.text((28, 22), f"🎟  {settings.APP_NAME.upper()}", font=font_large, fill=WHITE)

    # Event title
    draw.text((28, 100), event_title, font=font_large, fill=DARK)

    # Divider
    draw.rectangle([28, 140, W - 220, 142], fill=ACCENT)

    # Event details
    draw.text((28, 155), f"📅  {event_date}", font=font_small, fill=GRAY)
    draw.text((28, 180), f"📍  {event_venue}", font=font_small, fill=GRAY)
    draw.text((28, 205), f"🎫  {ticket_name}", font=font_small, fill=GRAY)

    # Attendee box
    draw.rectangle([28, 235, 540, 295], fill=LIGHT, outline=ACCENT)
    draw.text((40, 243), "ATTENDEE", font=font_tiny, fill=GRAY)
    draw.text((40, 260), attendee_name, font=font_medium, fill=DARK)

    # Ticket number
    draw.text((28, 310), f"#{ticket_number}", font=font_tiny, fill=GRAY)

    # Perforated divider
    for y in range(80, H, 12):
        draw.rectangle([570, y, 572, y + 6], fill=ACCENT)

    # QR Code
    qr_img = _make_qr(qr_token)
    draw.rectangle([600, 110, 780, 380], fill=LIGHT, outline=ACCENT)
    img.paste(qr_img, (610, 120))
    draw.text((618, 292), "Scan at entrance", font=font_tiny, fill=GRAY)

    # Bottom strip
    draw.rectangle([0, H - 36, W, H], fill=INDIGO)
    draw.text(
        (28, H - 24),
        f"Powered by {settings.APP_NAME} · Open Source Event Platform",
        font=font_tiny,
        fill=WHITE,
    )

    buffer = BytesIO()
    img.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return buffer.read()


def generate_ticket_base64(
    attendee_name: str,
    attendee_email: str,
    event_title: str,
    event_date: str,
    event_venue: str,
    ticket_name: str,
    qr_token: str,
    ticket_number: str,
) -> str:
    """Returns base64-encoded ticket PNG for embedding in HTML."""
    png_bytes = generate_ticket_png(
        attendee_name=attendee_name,
        attendee_email=attendee_email,
        event_title=event_title,
        event_date=event_date,
        event_venue=event_venue,
        ticket_name=ticket_name,
        qr_token=qr_token,
        ticket_number=ticket_number,
    )
    return base64.b64encode(png_bytes).decode("utf-8")

# backend/app/services/email.py

import base64
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

from app.config import settings
from app.services.qr import generate_qr_base64

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
)


async def send_ticket_email(
    to_email: str,
    attendee_name: str,
    event_title: str,
    event_date: str,
    event_venue: str,
    qr_token: str,
    ticket_name: str = "General",
):
    """Send confirmation email with QR code embedded."""

    qr_base64 = generate_qr_base64(qr_token)
    ticket_url = f"{settings.FRONTEND_URL}/ticket/{qr_token}"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">

      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

        <h1 style="color: #4F46E5; margin-bottom: 4px;">🎟️ {settings.APP_NAME}</h1>
        <p style="color: #6B7280; margin-top: 0;">Your ticket is confirmed!</p>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />

        <h2 style="color: #111827;">Hi {attendee_name}! 👋</h2>
        <p style="color: #374151;">You're registered for <strong>{event_title}</strong>.</p>

        <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0; color: #374151;">📅 <strong>Date:</strong> {event_date}</p>
          <p style="margin: 4px 0; color: #374151;">📍 <strong>Venue:</strong> {event_venue}</p>
          <p style="margin: 4px 0; color: #374151;">🎫 <strong>Ticket:</strong> {ticket_name}</p>
        </div>

        <p style="color: #374151;">Show this QR code at the entrance:</p>

        <div style="text-align: center; margin: 24px 0;">
          <img src="data:image/png;base64,{qr_base64}"
               alt="Your QR Code"
               style="width: 200px; height: 200px; border: 4px solid #4F46E5; border-radius: 8px;" />
        </div>

        <div style="text-align: center; margin: 16px 0;">
          <a href="{ticket_url}"
             style="background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px;
                    text-decoration: none; font-weight: bold;">
            View My Ticket
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          Powered by {settings.APP_NAME} · Open Source Event Platform
        </p>

      </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject=f"🎟️ Your ticket for {event_title}",
        recipients=[to_email],
        body=html_body,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)

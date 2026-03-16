# backend/app/schemas/registration.py

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr


class RegistrationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    ticket_id: str | None = None
    extra_fields: dict[str, Any] | None = None


class RegistrationResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None
    qr_code: str
    is_checked_in: bool
    ticket_sent: bool
    registered_at: datetime
    event_id: str
    ticket_id: str | None

    class Config:
        from_attributes = True

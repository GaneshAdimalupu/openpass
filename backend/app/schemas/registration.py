# backend/app/schemas/registration.py

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Any, Dict


class RegistrationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    ticket_id: Optional[str] = None
    extra_fields: Optional[Dict[str, Any]] = None


class RegistrationResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    qr_code: str
    is_checked_in: bool
    ticket_sent: bool
    registered_at: datetime
    event_id: str
    ticket_id: Optional[str]

    class Config:
        from_attributes = True

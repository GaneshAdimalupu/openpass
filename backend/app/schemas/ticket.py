# backend/app/schemas/ticket.py

from pydantic import BaseModel
from typing import Optional


class TicketCreate(BaseModel):
    event_id: str
    name: str
    description: Optional[str] = None
    price: float = 0.0
    total_quantity: Optional[int] = None  # None = unlimited


class TicketUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    total_quantity: Optional[int] = None
    is_active: Optional[bool] = None


class TicketResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    price: float
    total_quantity: Optional[int]
    registered_count: int
    is_active: bool
    remaining: Optional[int]
    is_available: bool

    class Config:
        from_attributes = True

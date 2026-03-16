# backend/app/schemas/ticket.py


from pydantic import BaseModel


class TicketCreate(BaseModel):
    event_id: str
    name: str
    description: str | None = None
    price: float = 0.0
    total_quantity: int | None = None  # None = unlimited


class TicketUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    total_quantity: int | None = None
    is_active: bool | None = None


class TicketResponse(BaseModel):
    id: str
    name: str
    description: str | None
    price: float
    total_quantity: int | None
    registered_count: int
    is_active: bool
    remaining: int | None
    is_available: bool

    class Config:
        from_attributes = True

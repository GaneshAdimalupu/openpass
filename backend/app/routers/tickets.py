# backend/app/routers/tickets.py


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketResponse, TicketUpdate
from app.services.auth import get_current_user

router = APIRouter()


# ── POST /api/tickets ─────────────────────────────────────────────────────────


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify event belongs to current user
    event = (
        db.query(Event)
        .filter(Event.id == payload.event_id, Event.organizer_id == current_user.id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    ticket = Ticket(
        event_id=payload.event_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        total_quantity=payload.total_quantity,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


# ── PATCH /api/tickets/{ticket_id} ───────────────────────────────────────────


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = (
        db.query(Ticket)
        .join(Event)
        .filter(Ticket.id == ticket_id, Event.organizer_id == current_user.id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)
    return ticket


# ── DELETE /api/tickets/{ticket_id} ──────────────────────────────────────────


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = (
        db.query(Ticket)
        .join(Event)
        .filter(Ticket.id == ticket_id, Event.organizer_id == current_user.id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.is_active = False
    db.commit()

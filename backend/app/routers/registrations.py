# backend/app/routers/registrations.py

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event
from app.models.registration import Registration
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.registration import RegistrationCreate, RegistrationResponse
from app.services.auth import get_current_user
from app.services.email import send_ticket_email

router = APIRouter()


# ── POST /api/registrations/{slug}  (public — attendee registers) ─────────────


@router.post("/{slug}", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_for_event(
    slug: str,
    payload: RegistrationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Get event
    event = db.query(Event).filter(Event.slug == slug, Event.is_published, Event.is_active).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or not yet open")

    # Check if already registered
    existing = (
        db.query(Registration)
        .filter(Registration.event_id == event.id, Registration.email == payload.email)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered for this event",
        )

    # Validate ticket if provided
    ticket = None
    if payload.ticket_id:
        ticket = (
            db.query(Ticket)
            .filter(
                Ticket.id == payload.ticket_id,
                Ticket.event_id == event.id,
                Ticket.is_active,
            )
            .first()
        )
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        if not ticket.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Sorry, this ticket is sold out"
            )

    # Generate unique QR token
    qr_token = str(uuid.uuid4()).replace("-", "")

    # Create registration
    registration = Registration(
        event_id=event.id,
        ticket_id=ticket.id if ticket else None,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        extra_fields=payload.extra_fields,
        qr_code=qr_token,
    )
    db.add(registration)

    # Increment ticket count
    if ticket:
        ticket.registered_count += 1

    db.commit()
    db.refresh(registration)

    # Send ticket email in background (non-blocking)
    venue = event.venue or "TBA"
    event_date = event.start_date.strftime("%B %d, %Y at %I:%M %p")
    ticket_name = ticket.name if ticket else "General"

    background_tasks.add_task(
        send_ticket_email,
        to_email=payload.email,
        attendee_name=payload.name,
        event_title=event.title,
        event_date=event_date,
        event_venue=venue,
        qr_token=qr_token,
        ticket_name=ticket_name,
    )

    # Mark email as sent (optimistically — background task will handle it)
    registration.ticket_sent = True
    db.commit()

    return registration


# ── GET /api/registrations/ticket/{qr_token}  (public — view ticket) ─────────


@router.get("/ticket/{qr_token}", response_model=RegistrationResponse)
def get_ticket(qr_token: str, db: Session = Depends(get_db)):
    reg = db.query(Registration).filter(Registration.qr_code == qr_token).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return reg


# ── GET /api/registrations/{slug}/list  (organizer: all registrations) ────────


@router.get("/{slug}/list", response_model=list[RegistrationResponse])
def list_registrations(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = (
        db.query(Event).filter(Event.slug == slug, Event.organizer_id == current_user.id).first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return (
        db.query(Registration)
        .filter(Registration.event_id == event.id)
        .order_by(Registration.registered_at.desc())
        .all()
    )

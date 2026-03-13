# backend/app/routers/events.py

import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.event import Event
from app.models.ticket import Ticket
from app.schemas.event import EventCreate, EventUpdate, EventResponse, EventListResponse
from app.schemas.ticket import TicketResponse
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter()


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[\s]+', '-', text)
    text = re.sub(r'[^\w-]', '', text)
    return text


# ── GET /api/events  (organizer: my events) ───────────────────────────────────

@router.get("/", response_model=List[EventListResponse])
def list_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Event).filter(
        Event.organizer_id == current_user.id,
        Event.is_active == True
    ).order_by(Event.start_date.desc()).all()


# ── POST /api/events ──────────────────────────────────────────────────────────

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slug = slugify(payload.slug or payload.title)

    # Ensure slug is unique
    existing = db.query(Event).filter(Event.slug == slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slug '{slug}' already taken. Try a different one."
        )

    event = Event(
        title=payload.title,
        description=payload.description,
        venue=payload.venue,
        start_date=payload.start_date,
        end_date=payload.end_date,
        banner_url=payload.banner_url,
        slug=slug,
        organizer_id=current_user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


# ── GET /api/events/{slug}  (public) ─────────────────────────────────────────

@router.get("/{slug}", response_model=EventResponse)
def get_event_by_slug(slug: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.slug == slug, Event.is_active == True).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# ── GET /api/events/{slug}/tickets  (public) ─────────────────────────────────

@router.get("/{slug}/tickets", response_model=List[TicketResponse])
def get_event_tickets(slug: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.slug == slug, Event.is_active == True).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return db.query(Ticket).filter(
        Ticket.event_id == event.id,
        Ticket.is_active == True
    ).all()


# ── PATCH /api/events/{slug} ──────────────────────────────────────────────────

@router.patch("/{slug}", response_model=EventResponse)
def update_event(
    slug: str,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(
        Event.slug == slug,
        Event.organizer_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event


# ── DELETE /api/events/{slug} ─────────────────────────────────────────────────

@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(
        Event.slug == slug,
        Event.organizer_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.is_active = False  # soft delete
    db.commit()

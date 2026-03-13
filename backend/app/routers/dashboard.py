# backend/app/routers/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.event import Event
from app.models.ticket import Ticket
from app.models.registration import Registration
from app.models.checkin import CheckIn
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter()


# ── GET /api/dashboard/{slug}  (organizer: full event stats) ─────────────────

@router.get("/{slug}")
def event_dashboard(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(
        Event.slug == slug,
        Event.organizer_id == current_user.id,
        Event.is_active == True
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Total registrations
    total_registered = db.query(func.count(Registration.id)).filter(
        Registration.event_id == event.id
    ).scalar()

    # Total checked in
    total_checked_in = db.query(func.count(Registration.id)).filter(
        Registration.event_id == event.id,
        Registration.is_checked_in == True
    ).scalar()

    # Tickets breakdown
    tickets = db.query(Ticket).filter(
        Ticket.event_id == event.id,
        Ticket.is_active == True
    ).all()

    tickets_breakdown = [
        {
            "ticket_name": t.name,
            "price": t.price,
            "total_quantity": t.total_quantity,
            "registered_count": t.registered_count,
            "remaining": t.remaining,
        }
        for t in tickets
    ]

    # Recent registrations (last 10)
    recent = db.query(Registration).filter(
        Registration.event_id == event.id
    ).order_by(Registration.registered_at.desc()).limit(10).all()

    recent_registrations = [
        {
            "name": r.name,
            "email": r.email,
            "ticket": r.ticket.name if r.ticket else "General",
            "is_checked_in": r.is_checked_in,
            "registered_at": r.registered_at,
        }
        for r in recent
    ]

    return {
        "event": {
            "id": event.id,
            "title": event.title,
            "slug": event.slug,
            "venue": event.venue,
            "start_date": event.start_date,
            "is_published": event.is_published,
        },
        "stats": {
            "total_registered": total_registered,
            "total_checked_in": total_checked_in,
            "not_checked_in": total_registered - total_checked_in,
            "check_in_rate": round(
                (total_checked_in / total_registered * 100) if total_registered > 0 else 0, 1
            ),
        },
        "tickets_breakdown": tickets_breakdown,
        "recent_registrations": recent_registrations,
    }


# ── GET /api/dashboard/  (organizer: all my events summary) ──────────────────

@router.get("/")
def all_events_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = db.query(Event).filter(
        Event.organizer_id == current_user.id,
        Event.is_active == True
    ).order_by(Event.start_date.desc()).all()

    summary = []
    for event in events:
        total = db.query(func.count(Registration.id)).filter(
            Registration.event_id == event.id
        ).scalar()

        checked_in = db.query(func.count(Registration.id)).filter(
            Registration.event_id == event.id,
            Registration.is_checked_in == True
        ).scalar()

        summary.append({
            "id": event.id,
            "title": event.title,
            "slug": event.slug,
            "start_date": event.start_date,
            "is_published": event.is_published,
            "total_registered": total,
            "total_checked_in": checked_in,
        })

    return summary

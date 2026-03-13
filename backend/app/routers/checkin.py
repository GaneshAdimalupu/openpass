# backend/app/routers/checkin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.registration import Registration
from app.models.checkin import CheckIn
from app.models.event import Event
from app.services.auth import get_current_user
from app.models.user import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ScanRequest(BaseModel):
    qr_token: str


class ScanResponse(BaseModel):
    success: bool
    message: str
    attendee_name: Optional[str] = None
    attendee_email: Optional[str] = None
    ticket_name: Optional[str] = None
    event_title: Optional[str] = None
    already_checked_in: bool = False
    checked_in_at: Optional[datetime] = None


# ── POST /api/checkin/scan  (organizer scans QR) ──────────────────────────────

@router.post("/scan", response_model=ScanResponse)
def scan_qr(
    payload: ScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find registration by QR token
    reg = db.query(Registration).filter(
        Registration.qr_code == payload.qr_token
    ).first()

    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid QR code — ticket not found"
        )

    # Make sure this event belongs to the scanning organizer
    event = db.query(Event).filter(
        Event.id == reg.event_id,
        Event.organizer_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This ticket does not belong to your event"
        )

    ticket_name = reg.ticket.name if reg.ticket else "General"

    # Already checked in?
    if reg.is_checked_in:
        last_checkin = db.query(CheckIn).filter(
            CheckIn.registration_id == reg.id
        ).order_by(CheckIn.checked_in_at.desc()).first()

        return ScanResponse(
            success=False,
            message="⚠️ Already checked in!",
            attendee_name=reg.name,
            attendee_email=reg.email,
            ticket_name=ticket_name,
            event_title=event.title,
            already_checked_in=True,
            checked_in_at=last_checkin.checked_in_at if last_checkin else None,
        )

    # Mark as checked in
    reg.is_checked_in = True

    checkin_log = CheckIn(
        registration_id=reg.id,
        checked_in_by=current_user.email,
    )
    db.add(checkin_log)
    db.commit()
    db.refresh(checkin_log)

    return ScanResponse(
        success=True,
        message="✅ Check-in successful!",
        attendee_name=reg.name,
        attendee_email=reg.email,
        ticket_name=ticket_name,
        event_title=event.title,
        already_checked_in=False,
        checked_in_at=checkin_log.checked_in_at,
    )


# ── GET /api/checkin/{slug}/logs  (organizer: full check-in log) ──────────────

@router.get("/{slug}/logs")
def checkin_logs(
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

    logs = (
        db.query(CheckIn)
        .join(Registration)
        .filter(Registration.event_id == event.id)
        .order_by(CheckIn.checked_in_at.desc())
        .all()
    )

    return [
        {
            "id": log.id,
            "attendee_name": log.registration.name,
            "attendee_email": log.registration.email,
            "checked_in_at": log.checked_in_at,
            "checked_in_by": log.checked_in_by,
        }
        for log in logs
    ]

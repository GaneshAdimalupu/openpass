import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import relationship

from app.database import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    extra_fields = Column(JSON, nullable=True)   # stores custom form answers
    qr_code = Column(String(100), unique=True, nullable=False)  # unique token for QR
    is_checked_in = Column(Boolean, default=False)
    ticket_sent = Column(Boolean, default=False) # email sent?
    registered_at = Column(DateTime, default=datetime.utcnow)

    # Foreign Keys
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    ticket_id = Column(String, ForeignKey("tickets.id"), nullable=True)

    # Relationships
    event = relationship("Event", back_populates="registrations")
    ticket = relationship("Ticket", back_populates="registrations")
    checkins = relationship("CheckIn", back_populates="registration", cascade="all, delete-orphan")

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)  # e.g. "General", "VIP", "Student"
    description = Column(String(300), nullable=True)
    price = Column(Float, default=0.0)  # 0.0 = free
    total_quantity = Column(Integer, nullable=True)  # None = unlimited
    registered_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Foreign Keys
    event_id = Column(String, ForeignKey("events.id"), nullable=False)

    # Relationships
    event = relationship("Event", back_populates="tickets")
    registrations = relationship("Registration", back_populates="ticket")

    @property
    def is_available(self):
        if self.total_quantity is None:
            return True
        return self.registered_count < self.total_quantity

    @property
    def remaining(self):
        if self.total_quantity is None:
            return None
        return self.total_quantity - self.registered_count

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database import Base


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    checked_in_at = Column(DateTime, default=datetime.utcnow)
    checked_in_by = Column(String(100), nullable=True)  # name/email of scanner (organizer)

    # Foreign Keys
    registration_id = Column(String, ForeignKey("registrations.id"), nullable=False)

    # Relationships
    registration = relationship("Registration", back_populates="checkins")

# backend/app/schemas/event.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    banner_url: Optional[str] = None
    slug: str


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    banner_url: Optional[str] = None
    is_published: Optional[bool] = None


class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    venue: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    banner_url: Optional[str]
    slug: str
    is_published: bool
    organizer_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    id: str
    title: str
    venue: Optional[str]
    start_date: datetime
    slug: str
    is_published: bool
    banner_url: Optional[str]

    class Config:
        from_attributes = True

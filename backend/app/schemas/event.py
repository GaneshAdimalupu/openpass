# backend/app/schemas/event.py

from datetime import datetime

from pydantic import BaseModel


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    venue: str | None = None
    start_date: datetime
    end_date: datetime | None = None
    banner_url: str | None = None
    slug: str


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    venue: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    banner_url: str | None = None
    is_published: bool | None = None


class EventResponse(BaseModel):
    id: str
    title: str
    description: str | None
    venue: str | None
    start_date: datetime
    end_date: datetime | None
    banner_url: str | None
    slug: str
    is_published: bool
    organizer_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    id: str
    title: str
    venue: str | None
    start_date: datetime
    slug: str
    is_published: bool
    banner_url: str | None

    class Config:
        from_attributes = True

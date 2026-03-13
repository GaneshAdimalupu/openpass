# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.models import User, Event, Ticket, Registration, CheckIn  # noqa

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Open-source event pass & check-in platform",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from app.routers import auth, events, tickets, registrations, checkin, dashboard

app.include_router(auth.router,          prefix="/api/auth",          tags=["Auth"])
app.include_router(events.router,        prefix="/api/events",        tags=["Events"])
app.include_router(tickets.router,       prefix="/api/tickets",       tags=["Tickets"])
app.include_router(registrations.router, prefix="/api/registrations", tags=["Registrations"])
app.include_router(checkin.router,       prefix="/api/checkin",       tags=["Check-in"])
app.include_router(dashboard.router,     prefix="/api/dashboard",     tags=["Dashboard"])


@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME} API 🎟️", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}

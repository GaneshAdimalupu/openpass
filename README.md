# OpenPass 🎟️

> Open-source event registration & QR check-in platform. Born in Kerala.

[![CI](https://github.com/YOUR_USERNAME/openpass/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/openpass/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

---

## What is OpenPass?

OpenPass lets you create events, collect registrations, send QR ticket emails, and check in attendees by scanning their QR codes — all self-hosted and free.

Inspired by [MakeMyPass](https://makemypass.com), built open-source.

---

## Features (v1)

- ✅ Organizer signup & login (JWT)
- ✅ Create & publish events
- ✅ Multiple ticket types (free/paid)
- ✅ Attendee registration form
- ✅ Auto QR code generation
- ✅ Email confirmation with QR ticket
- ✅ QR scanner check-in
- ✅ Organizer dashboard with stats

---

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | Python 3.11 + FastAPI   |
| Database  | PostgreSQL 17           |
| Frontend  | React 18 + Tailwind CSS |
| Auth      | JWT (python-jose)       |
| Email     | fastapi-mail (SMTP)     |
| QR        | qrcode + Pillow         |
| Dev       | Docker + Docker Compose |

---

## Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose

### Run in 3 commands
```bash
git clone https://github.com/YOUR_USERNAME/openpass.git
cd openpass
cp backend/.env.example backend/.env   # fill in your values
docker compose up --build
```

| Service      | URL                          |
|--------------|------------------------------|
| Frontend     | http://localhost:5173        |
| Backend API  | http://localhost:8000        |
| API Docs     | http://localhost:8000/docs   |

---

## Local Development (without Docker)

```bash
# Backend
cd backend
conda create -n openpass python=3.11 && conda activate openpass
pip install -r requirements.txt
cp .env.example .env        # fill in values
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable                    | Description                    |
|-----------------------------|--------------------------------|
| `DATABASE_URL`              | PostgreSQL connection string   |
| `SECRET_KEY`                | JWT signing secret             |
| `MAIL_USERNAME`             | SMTP email address             |
| `MAIL_PASSWORD`             | SMTP password / app password   |
| `MAIL_FROM`                 | From address for emails        |

---

## Contributing

We love contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

```bash
pip install pre-commit
pre-commit install   # auto-linting on every commit
```

---

## Roadmap

- [ ] v1 — Core (current)
- [ ] v2 — Payments (Razorpay)
- [ ] v3 — WhatsApp integration
- [ ] v4 — Team registrations
- [ ] v5 — Multi-day events & randomizer

---

## License

MIT © OpenPass Contributors

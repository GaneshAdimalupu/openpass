# Contributing to OpenPass 🎟️

Thanks for your interest in contributing! OpenPass is a Kerala-born open-source project and we welcome contributions of all kinds.

---

## Quick Start for Contributors

### 1. Fork & Clone
```bash
git clone https://github.com/GaneshAdimalupu/openpass.git
cd openpass
```

### 2. Run with Docker (recommended)
```bash
cp backend/.env.example backend/.env
docker compose up --build
```

That's it! All three services start together:
- Frontend → http://localhost:5173
- Backend API → http://localhost:8000
- API Docs → http://localhost:8000/docs

### 3. Run without Docker
```bash
# Terminal 1 — Backend
cd backend
conda create -n openpass python=3.11
conda activate openpass
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

---

## Development Workflow

### Branching
```
main          → stable, production-ready
develop       → integration branch
feature/xyz   → your feature branch
fix/xyz       → bug fix branch
```

Always branch off `develop`, never directly off `main`.

```bash
git checkout develop
git checkout -b feature/your-feature-name
```

### Pre-commit Hooks
We use pre-commit to keep code clean automatically:

```bash
pip install pre-commit
pre-commit install
```

Now every commit automatically runs linting, formatting, and secret scanning.

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add QR scanner page
fix: registration email not sending
docs: update setup instructions
chore: upgrade dependencies
```

---

## Project Structure

```
openpass/
├── backend/      FastAPI + PostgreSQL
├── frontend/     React + Tailwind CSS
└── docker-compose.yml
```

See the full structure in [README.md](./README.md).

---

## What to Work On

Check the [Issues](https://github.com/GaneshAdimalupu/openpass/issues) tab for:
- 🐛 `bug` — something broken
- ✨ `enhancement` — new features
- 📖 `documentation` — docs improvements
- 🌱 `good first issue` — great for newcomers

---

## Code Style

**Backend (Python)**
- Formatter: `ruff format`
- Linter: `ruff check`
- Run: `cd backend && ruff check . && ruff format .`

**Frontend (JavaScript/React)**
- Formatter: Prettier
- Linter: ESLint
- Run: `cd frontend && npm run lint`

---

## Submitting a PR

1. Push your branch to your fork
2. Open a PR against `develop` (not `main`)
3. Fill in the PR template
4. Wait for CI to pass ✅
5. Request a review

---

## Need Help?

Open a [Discussion](https://github.com/GaneshAdimalupu/openpass/discussions) or ping us in Issues. We're friendly! 🙌

# Star Wars EU Book Tracker

Full-stack app for tracking Star Wars Expanded Universe books (Canon & Legends) with advanced filtering, character relationship visualization, and a Wookieepedia scraper.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend**: Python 3.14 + FastAPI + SQLAlchemy 2.0 (async) + Alembic
- **Database**: PostgreSQL 16
- **Scraper**: BeautifulSoup + requests
- **Orchestration**: Docker Compose

## Quick Start

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Health check: http://localhost:8000/health

## Run Scraper

```bash
docker compose run scraper
docker compose run scraper python -m src.main --dry-run --limit 10
```

## Development

Backend and frontend both support hot-reload via volume mounts.

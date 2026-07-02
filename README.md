# planning-nounou

Track the hours a nanny works for two families over the year.

- **Backend**: Django + Django REST Framework, PostgreSQL. `uv` for package management.
- **Frontend**: React (Vite + TypeScript). `bun` for package management.
- **Local dev**: Docker Compose (Django + Postgres).
- **Production**: Vercel — Django as a Python function, React as a static SPA, Postgres on Neon.

> Status: **skeleton**. Domain models (Family, Nanny, Employment, WorkEntry) are intentionally
> deferred; only a `/api/health/` endpoint exists so far.

```
planning-nounou/
├── backend/        # Django project (config/) + tracking app; uv-managed
├── frontend/       # Vite React SPA; bun-managed
└── docker-compose.yml
```

## Local development

### Backend + database (Docker)

```bash
docker compose up --build
```

- API: http://localhost:8000/api/health/ → `{"status":"ok"}`
- Django admin: http://localhost:8000/admin/
- Postgres is exposed on `localhost:5432` (`nounou` / `nounou`).

The `web` container runs `migrate`, `collectstatic`, then `runserver` on start.

Create an admin user:

```bash
docker compose exec web python manage.py createsuperuser
```

### Backend without Docker

Requires a running Postgres (e.g. `docker compose up db`). Then:

```bash
cd backend
cp .env.example .env        # adjust if needed
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

### Tests, lint, and dev stack via tox

`tox` (with `tox-uv`, so environments are built from `uv.lock`) drives the backend:

```bash
cd backend
uv run tox              # tests (pytest) + lint (ruff) + types (ty) — all blocking
uv run tox -e py313     # tests only (pytest)
uv run tox -e lint      # ruff only
uv run tox -e type      # ty type-check only
uv run tox -e dev       # start the local dev stack
```

Tests run on **pytest** (via `pytest-django`). Type-checking uses **ty** with the Django/DRF
stub packages, and is part of the default `tox` run, so type errors fail the build.

`tox -e dev` starts the Postgres container (`docker compose up -d --wait db`), applies
migrations, and runs Django's dev server with hot reload on http://localhost:8000. It needs
Docker running. Tests default to the Dockerized Postgres via `DATABASE_URL`; override the env
var to point elsewhere.

### Frontend

```bash
cd frontend
bun install
bun run dev                 # http://localhost:5173, proxies /api -> :8000
```

Checks:

```bash
bun run typecheck           # tsc -b (no emit)
bun run lint                # biome check --write (lint + format + import sorting, applies fixes)
bun run format              # biome format --write .
bun run build
```

Linting, formatting, and import sorting are handled by **Biome** (`biome.json`).

## Dependency policy

All dependencies are pinned to **exact versions** (backend `pyproject.toml`, frontend
`package.json` — `bunfig.toml` enforces exact installs). Add deps with:

```bash
cd backend  && uv add --bounds exact <pkg>          # runtime
cd backend  && uv add --dev --bounds exact <pkg>    # dev
cd frontend && bun add <pkg>                         # exact via bunfig.toml
```

## Deployment (Vercel + Neon)

Deployed as **two Vercel projects** from this one repo. Django-on-Vercel is auto-detected
(Vercel finds `manage.py`, reads `WSGI_APPLICATION`, and runs `collectstatic` itself).

### 1. Backend project

- **Root Directory**: `backend`
- Dependencies install from `pyproject.toml` + `uv.lock`; Python version from `.python-version` (3.13).
- Add the **Neon** Postgres integration (Vercel Marketplace) → it sets `DATABASE_URL`.
  Use Neon's **pooled** connection string.
- Set env vars: `SECRET_KEY`, `DEBUG=0`, `DJANGO_ALLOWED_HOSTS`.
- Static files (incl. admin) are collected automatically and served from the Vercel CDN.

### 2. Frontend project

- **Root Directory**: `frontend` (Vite preset auto-detected; bun via `bun.lock`).
- Edit `frontend/vercel.json`: replace `REPLACE-WITH-BACKEND-PROJECT.vercel.app` with the
  backend project's domain. This proxies `/api/*` to the backend so the browser stays
  same-origin (no CORS needed).

### Migrations

Migrations never run in the serverless runtime. Run them from your machine against Neon:

```bash
cd backend
vercel pull                 # writes env (incl. DATABASE_URL) to .env.local
# point settings at it, or:
DATABASE_URL="<neon-pooled-url>" uv run python manage.py migrate
```

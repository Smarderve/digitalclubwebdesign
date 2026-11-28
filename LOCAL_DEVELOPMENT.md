# LOCAL DEVELOPMENT — KIUT Digital Club integration

How to run the integrated application on one machine without touching production
data. This file is the entry point required by the master plan Phase 4; the
detailed, dated runbook (including the Phase 4 verification evidence) is
`local-dev/README.md`.

Nothing here contains a secret value. Every credential is named only.

---

## 1. What runs

| Component | Path | Port |
| --- | --- | --- |
| React (Vite) | `new-website-design/` | `127.0.0.1:5178` |
| Flask backend | `current-website/DIgital-Club/` | `127.0.0.1:5051` |
| SQLite development database | `current-website/DIgital-Club/instance/dev_local.db` | — |

The browser only ever talks to `127.0.0.1:5178`. Vite proxies `/api`,
`/healthz` and `/static/uploads` to Flask (dev only, `changeOrigin: false`), so
the session cookie, CSRF token and Origin check behave exactly as they will on a
single production origin. There is no CORS configuration.

## 2. Prerequisites

- Python 3.13 (`.python-version`). The committed `uv.lock` is authoritative.
- Node 20 is pinned in `.nvmrc`; Node 26 is what was actually used for
  verification and works. Do not change the pin to match the machine.
- `uv` for the Python environment. It lives outside the backend repository at
  `local-dev/.tools` so it can recreate `.venv` without locking itself.

## 3. First-time setup

```bash
# 1. Python environment (frozen lockfile, no version changes)
cd current-website/DIgital-Club
uv sync --frozen

# 2. Local configuration — copy the template and fill it in locally
cp ../../local-dev/backend.env.example .env    # then edit .env; never commit it

# 3. Schema-only local database (60 tables, 0 rows, Alembic stamped at head)
cd ../..
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/init_local_db.py

# 4. Frontend dependencies
cd new-website-design && npm install && cd ..
```

`.env` is gitignored and must stay that way. `instance/` is gitignored too.

## 4. Environment variables (names only)

| Name | Purpose | Local value |
| --- | --- | --- |
| `SECRET_KEY` | Flask session signing | a locally generated 64-hex string |
| `DATABASE_URL` | SQLAlchemy URL | `sqlite:///…/instance/dev_local.db` |
| `FLASK_ENV` | Enables development defaults | `development` |
| `SESSION_COOKIE_SECURE`, `REMEMBER_COOKIE_SECURE` | HTTPS-only cookies | `0` locally (loopback HTTP) |
| `SESSION_COOKIE_SAMESITE`, `SESSION_COOKIE_HTTPONLY` | Cookie policy | `Lax`, `True` |
| `APP_TIMEZONE`, `APP_UTC_OFFSET_HOURS` | Application-local clock | unset / `3` (EAT) |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile | Cloudflare's public **test** keys |
| `VITE_TURNSTILE_SITE_KEY` | Site key compiled into the SPA | the same test site key |
| `RATELIMIT_ENABLED` | API rate limiting | `1` |
| `QUIZ_REMINDER_RUN_ON_REQUEST` | Quiz reminder scheduler | `0` in tests |

`create_app()` refuses to start outside development when `SECRET_KEY` is empty;
the old `dev-secret-key-change-in-production` fallback is unused.

## 5. Running

Two terminals, from the parent repository root:

```bash
bash local-dev/start-backend.sh     # Flask  → http://127.0.0.1:5051
bash local-dev/start-frontend.sh    # Vite   → http://127.0.0.1:5178
```

Then open `http://127.0.0.1:5178`.

`main.py` is deliberately **not** used: it creates a hardcoded
`admin@digitalclub.kiut.ac.tz` super-admin at import time. The start scripts run
the app factory instead:

```bash
cd current-website/DIgital-Club
.venv/Scripts/python.exe -m flask --app app run --host 127.0.0.1 --port 5051
```

Health checks:

```bash
curl http://127.0.0.1:5051/healthz              # backend
curl http://127.0.0.1:5178/healthz              # through the proxy
curl http://127.0.0.1:5051/api/v1/health        # JSON envelope + X-Request-ID
```

## 6. Database rules

- The local database is **schema-only**. Never seed it with demo users, events,
  payments or points; empty states are the correct rendering.
- `flask db upgrade` **cannot** initialise an empty database here: the first
  Alembic revision is an `ALTER TABLE user` and no revision creates the original
  tables. Use `local-dev/init_local_db.py`, which builds the schema from the
  models and stamps Alembic at head.
- Do not author a new migration until a baseline revision exists (audit R16).
- Reset: stop the backend, delete `instance/dev_local.db`, re-run the bootstrap.
- Never point `DATABASE_URL` at production. The bootstrap refuses anything that
  is not a `sqlite:///` URL inside the backend repository.

## 7. Tests

All suites use their own temporary SQLite file under `local-dev/.test-artifacts/`
and never open `instance/dev_local.db`. Run them from the parent repository root:

```bash
PY=current-website/DIgital-Club/.venv/Scripts/python.exe

$PY local-dev/test_phase5_api.py        # 33  API foundation, CSRF, rate limits
$PY local-dev/test_phase6_auth.py       # 42  auth, sessions, registration, reset
$PY local-dev/test_phase7_public.py     # 41  public endpoints
$PY local-dev/test_phase8_member.py     # 49  member reads + AU8
$PY local-dev/test_phase8_writes.py     # 41  member writes (MD4–MD49)
```

206 tests in total. When piping output through `tail`, use `set -o pipefail` or
you will hide a non-zero exit status.

## 8. Frontend checks

```bash
cd new-website-design
npm run typecheck
npm run build
```

## 9. Common problems

| Symptom | Cause | Fix |
| --- | --- | --- |
| `NoSuchTableError: user` on `flask db upgrade` | no baseline migration exists (R16) | use `local-dev/init_local_db.py` |
| `SECRET_KEY` error at startup | `.env` missing or empty outside development | set `FLASK_ENV=development` or provide a key |
| `/api/...` returns the Vite HTML shell | proxy not active, or Flask not running | start Flask on 5051, restart `npm run dev` |
| `403 CSRF_TOKEN_INVALID` on a write | token missing, expired session, or foreign `Origin` | `GET /api/v1/auth/csrf`, resend with `X-CSRF-Token` |
| `413` on upload | size cap (avatar 2 MB, competition default 10 MB) | shrink the file or raise the competition limit |
| A seeded quiz looks finished | quiz windows compare against `app_now_naive()`, not UTC | use application-local times in fixtures |
| `429 RATE_LIMITED` | per-user buckets | wait for `Retry-After`; limits are per process (R19) |
| Digital ID generation errors (`cairo`) | `cairosvg` needs the native cairo library | install cairo, or expect the ID to stay `pending` |

## 10. Boundaries

Local development must not: connect to production, create accounts it does not
need, seed demo content, expose any upload folder publicly, or modify Git
remotes, branches or history. The backend is a nested repository recorded as a
gitlink; commit inside it and then update the parent pointer.

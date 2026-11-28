# Local development environment — KIUT Digital Club integration

Untracked working notes and tooling for Phase 4. Nothing in this folder is part
of either application, and nothing here is committed.

- Parent repository: `Digital Club/` (React redesign lives in `new-website-design/`)
- Nested backend repository: `current-website/DIgital-Club/` (own Git repo, branch `master`)
- Integration architecture: `INTEGRATION_AUDIT.md` §12
- Local environment record: `INTEGRATION_AUDIT.md` §13

## What is already prepared

| Item | Location | Notes |
| --- | --- | --- |
| Python 3.13.18 environment | `current-website/DIgital-Club/.venv` | Built by `uv` from the committed `uv.lock` (`--frozen`); no dependency version changed |
| uv tool | `local-dev/.tools` | Kept outside the backend repo so it can recreate `.venv` |
| Backend env file | `current-website/DIgital-Club/.env` | Gitignored; local-only values, generated `SECRET_KEY`, Turnstile test keys |
| Env template | `local-dev/backend.env.example` | Safe to read/copy; contains no real credentials |
| Local database | `current-website/DIgital-Club/instance/dev_local.db` | Schema only: 60 tables, 0 rows, Alembic stamped at head |
| Vite proxy | `new-website-design/vite.config.ts` | `/api` and `/healthz` → `http://127.0.0.1:5051` in dev only |

## Start the stack

Two terminals, from the parent repository:

```bash
bash local-dev/start-backend.sh     # Flask  → http://127.0.0.1:5051
bash local-dev/start-frontend.sh    # Vite   → http://127.0.0.1:5178
```

Open `http://127.0.0.1:5178`. The browser only talks to that one origin; the Vite
proxy forwards `/api/*` and `/healthz` to Flask, which is what makes Flask-Login
cookies, the future CSRF token and Origin checks behave as they will in
production.

Verify the proxy:

```bash
curl http://127.0.0.1:5178/healthz      # {"status":"ok"} from Flask
```

## Why the backend is not started with `python main.py`

`main.py` calls `init_db()` at import time, which creates a hardcoded
`admin@digitalclub.kiut.ac.tz` / `admin123` super-admin. Phase 4 must not create
default administrator accounts, so the scripts start the app factory directly:

```bash
cd current-website/DIgital-Club
.venv/Scripts/python.exe -m flask --app app run --host 127.0.0.1 --port 5051
```

## Database

`flask db upgrade` **cannot build an empty database** in this repository: the
first Alembic revision (`b033ca5044ab`) is an `ALTER TABLE user` with no baseline
`CREATE TABLE` migration, so a fresh upgrade fails with `NoSuchTableError: user`.

Build/re-build the local schema with the guarded bootstrap instead:

```bash
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/init_local_db.py
```

It only accepts a `sqlite:///` URL, refuses paths outside the backend repository,
never drops data, creates no rows and stamps Alembic at head so future revisions
apply normally. To start over, stop the backend and delete
`current-website/DIgital-Club/instance/dev_local.db`, then re-run it.

Inspect:

```bash
cd current-website/DIgital-Club
.venv/Scripts/python.exe -m flask --app app db current
```

Normal migration commands after new revisions are added by later phases:

```bash
.venv/Scripts/python.exe -m flask --app app db migrate -m "message"
.venv/Scripts/python.exe -m flask --app app db upgrade
```

## Local security posture

- `SECRET_KEY` is a locally generated 64-hex value in the gitignored `.env`; the
  application's `dev-secret-key-change-in-production` fallback is not used, and
  `create_app()` now **refuses to start** when `SECRET_KEY` is empty unless
  `FLASK_ENV=development` is set.
- `REMEMBER_COOKIE_SECURE=0` and `SESSION_COOKIE_SECURE=0` only because local
  development is plain HTTP on loopback. Production defaults both to on.
- `SESSION_COOKIE_SAMESITE=Lax`, `SESSION_COOKIE_HTTPONLY=True` (Flask default).
- Turnstile runs on Cloudflare's public test keys (widget always passes,
  matching secret validates dummy tokens only). Production uses real keys.
- No database rows, no accounts, no production data, no production connection.
- CSRF protection is **enabled application-wide** (Phase 5, D5): every one of the
  135 server-rendered POST forms carries `{{ csrf_token() }}`, `csrf.js` covers
  forms rendered after load plus `fetch`/XHR writes, and an Origin/Referer gate
  runs as a second check. Tokens are session-bound (`WTF_CSRF_TIME_LIMIT=None`).
- API rate limiting is on (`RATELIMIT_ENABLED=1`), process-local:
  see `INTEGRATION_AUDIT.md` R19 before running more than one worker.

## Phase 5 test suite

Isolated suite: temporary SQLite file under `local-dev/.test-artifacts/`, its own
seeded test users, and never the `instance/dev_local.db` database.

```bash
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase5_api.py
```

33 tests: health/ready/diagnostics, envelope + error shapes, no-leak 500s, auth
and role gates, CSRF issuance/accept/reject, origin rejection, existing form
compatibility, logout POST-only, rate limiting, fail-closed secret resolution,
and public-route compatibility. Do not add write tests that target the real
database: a live form POST will insert rows.

## Phase 6 test suite and browser verification

Isolated like the Phase 5 suite: temporary SQLite file, seeded test accounts, the
preserved `instance/dev_local.db` untouched.

```bash
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase6_auth.py
```

42 tests: login success/failure/legacy-unapproved/inactive, CSRF, Turnstile
failure and unconfigured refusal, logout and session fixation, registration
(immediate activation, immediate sign-in and `/member/` access, manual-setting
row ignored, duplicate, validation), approval-status compatibility, password
reset, the `/me` projection, the Jinja login/registration regression, the HTML
register → login → `/member/` flow, and admin deactivation via
`/admin/members/<id>/toggle-active` blocking login until restored.

To exercise the flows in a browser, the local database needs accounts — it stays
empty on purpose. Build a disposable one instead of seeding it:

```bash
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/seed_phase6_browser.py
# then start the backend against it:
DATABASE_URL="sqlite:///…/local-dev/.test-artifacts/browser_phase6.sqlite" \
  bash local-dev/start-backend.sh
```

The script prints three accounts and their shared password. When finished, stop
that backend, delete `local-dev/.test-artifacts/browser_phase6.sqlite`, and start
the normal one again so the stack is back on `instance/dev_local.db`.

### Turnstile site key for the SPA

The React login, registration and reset forms render Turnstile with
`VITE_TURNSTILE_SITE_KEY`. Locally the key is omitted and the client falls back to
Cloudflare's published always-pass **test** key (`1x00000000000000000000AA`),
which matches the test secret in `backend.env.example`. A production build must
set the real site key; with no key the forms explain that human verification is
not configured instead of silently skipping it.

## Phase 7 public-endpoint suite

Isolated like the earlier suites: temporary SQLite file under
`local-dev/.test-artifacts/`, seeded public records, never `instance/dev_local.db`.

```bash
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase7_public.py
```

41 tests: all PU1–PU23 routes, published-only filtering, pagination, the HTML
sanitiser, member slug resolution, `no-store` on ID verification, RSVP and
newsletter validation/deduplication, CSRF/Origin enforcement, and 404/422 shapes.
The suite also covers populated response shapes; the live schema-only database
shows empty states instead.

## Phase 8 member-endpoint suite

Same isolation: a temporary SQLite file under `local-dev/.test-artifacts/`,
seeded member records, never `instance/dev_local.db`.

```bash
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase8_member.py
```

49 tests covering the member read surface (MD1–MD50): anonymous access is 401 on
every route, a foreign notification is 404, dashboard/profile/digital-ID/
membership/rewards/ledger/projects/events/RSVP/sessions/rankings/notifications/
quizzes/competitions/elections/teams/search shapes and rules, no-store headers,
answer withholding on quizzes, eligibility reasons, closed leaderboard and
results, plus `POST /me/password`. It also asserts that `/me` now carries the
points/rank/tier/membership aggregates.

## Phase 8 member-write suite

Separate database (`local-dev/.test-artifacts/test_phase8_writes.sqlite`) so the
read suite's seeded state is never disturbed, and a separate uploads folder
(`uploads_phase8_writes/`) so no real file is replaced.

```bash
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase8_writes.py
```

41 tests covering avatar upload and replacement, project create/read/update/
delete/publish and cross-member 404s, the instructor-only session report and its
approved lock, quiz start/answer/violation/submit/result/leaderboard (server-side
scoring, forged `is_correct` ignored, auto-submit at three violations, review
withheld until release), competition enrolment (individual and team) and
submission, election apply/withdraw/vote (self-vote and duplicate-vote
rejection), team join requests/decisions/removals with leader-only rules, and
the new capability strings on `/me`.

The fixture seeds times with `app_now_naive()` — the application compares quiz
windows against application-local time, so a UTC fixture makes every seeded quiz
look finished.

Remaining Phase 8 work is the React member-page rewiring; the API surface itself
is complete apart from MD5 (needs a migration) and MD51 (no message model). See
`INTEGRATION_PROGRESS.md` §15.

## Both repositories

The backend is a nested Git repository recorded as a gitlink. It is not a
submodule (there is no `.gitmodules`) and must not be converted into one.

```bash
git -C . status --porcelain                       # parent
git -C current-website/DIgital-Club status --porcelain   # backend
```

Rules: no `git add -A`, no reset/clean, no remote or structure changes, stage
only files you intentionally changed and only in the repository that owns them.
Local-only artefacts (`.venv`, `.env`, `instance/`, `local-dev/`) are ignored or
untracked and must stay that way.

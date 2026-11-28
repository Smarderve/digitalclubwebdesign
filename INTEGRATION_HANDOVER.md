# INTEGRATION HANDOVER — KIUT Digital Club

Written 2026-11-27 as the Phase 13 deliverable. It records what is integrated,
what is not, how to run the project, and what a separately authorised cutover
would have to do. **Nothing here authorises a deployment.** No deployment,
push, migration or environment change was performed.

---

## 1. Readiness verdict

**Not ready to cut over.** The Flask JSON API is integrated and tested for the
public, member and first admin-read surfaces, and the original Jinja frontend
still serves. But the plan's definition of done requires every demo/mock record
to be gone from normal runtime, and 24 admin pages plus the quizmaster screen
still render sample records (now visibly labelled). The social UI also still
runs on a browser-local prototype even though its API exists.

| Area | Status |
| --- | --- |
| Public website | **Integrated** — pages read `/api/v1/public/*` |
| Member portal | **Integrated** — pages read/write `/api/v1/member/*`; social-profile pages are the exception |
| Admin portal | **API reads only** — dashboard, directory, approvals; every admin page is still demo data |
| Quizmaster | **Not integrated** — no JSON API; page is demo data |
| Social graph | **API done** (Phase 10); SPA still on `localStorage` |
| Real-time | **Not applicable** — the original backend has no Socket.IO server |
| KIUTBOT | **External widget**, unchanged from the original site |
| Original Jinja frontend | **Serving** (smoke-tested) |

The remaining work is listed in §9. It is SPA wiring plus admin write endpoints,
not redesign.

---

## 2. What runs

| Component | Path | Local address |
| --- | --- | --- |
| React (Vite) | `new-website-design/` | `http://127.0.0.1:5178` |
| Flask backend | `current-website/DIgital-Club/` | `http://127.0.0.1:5051` |
| Development SQLite | `current-website/DIgital-Club/instance/dev_local.db` | schema only, 0 rows |

The browser talks only to the Vite origin; `/api`, `/healthz` and
`/static/uploads` are proxied to Flask in development, so cookies, CSRF and the
Origin check behave as on a single production origin. There is no CORS config.

## 3. Running it

```bash
# Python environment (frozen lockfile)
cd current-website/DIgital-Club
uv sync --frozen

# Local configuration (never commit .env)
cp ../../local-dev/backend.env.example .env    # fill in locally

# Schema-only database, Alembic stamped
cd ../..
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/init_local_db.py

# Backend
cd current-website/DIgital-Club
.venv/Scripts/python.exe -m flask --app app:create_app run --port 5051

# Frontend (second terminal)
cd new-website-design
npm install
npm run dev          # proxies /api to 127.0.0.1:5051
```

`LOCAL_DEVELOPMENT.md` is the entry point; `local-dev/README.md` has the dated
runbook and troubleshooting notes.

## 4. Environment variables (names and purpose only)

| Name | Purpose |
| --- | --- |
| `SECRET_KEY` | Flask session signing; required outside development |
| `DATABASE_URL` | SQLAlchemy URL (`sqlite:///…/instance/dev_local.db` locally) |
| `FLASK_ENV` | `development` enables local cookie/Turnstile defaults |
| `SESSION_COOKIE_SECURE`, `REMEMBER_COOKIE_SECURE` | HTTPS-only cookies (`0` on loopback) |
| `SESSION_COOKIE_SAMESITE`, `SESSION_COOKIE_HTTPONLY` | Cookie policy (`Lax`, `True`) |
| `APP_TIMEZONE`, `APP_UTC_OFFSET_HOURS` | Application-local clock used by windows and schedules |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile for sign-in/registration/reset |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile site key compiled into the SPA |
| `RATELIMIT_ENABLED` | Enables API rate limiting |
| `QUIZ_REMINDER_RUN_ON_REQUEST` | Runs the quiz reminder scheduler on a request (off in tests) |
| `VITE_KIUTBOT_AGENT_KEY`, `VITE_KIUTBOT_SOCKET_URL` | Optional overrides for the external KIUTBOT widget |

No secret value appears in this repository, the docs or the SPA bundle.

## 5. Data, media, backup and restore

- Database: one SQLite file at `DATABASE_URL`. Back it up by stopping the app
  and copying the file (or `sqlite3 file ".backup copy"`).
- Media: `app/static/uploads/` (avatars, digital IDs, documents). Copy the
  directory together with the database; a restore of one without the other
  leaves broken references.
- Restore: stop the app, replace the database file and the uploads directory,
  start again. Never restore a database without its matching uploads snapshot.
- The development database is schema-only and must not be promoted to
  production.

## 6. Migrations and rollback

| Revision | Change | Rollback |
| --- | --- | --- |
| `d20261127120000` | Member privacy columns (`profile_visibility`, `discoverable`, `privacy_sections`) + backfill of approved members to public/discoverable | `flask db downgrade c20260703100000`; additive, no existing column touched |
| `e20261127130000` | Social graph tables (`member_follow`, `member_follow_request`, `member_block`) | `flask db downgrade d20261127120000`; drops exactly those three tables |

Both were verified on synthetic databases (upgrade and downgrade). **Caveat
(R16):** there is no Alembic baseline, so `flask db upgrade` cannot bootstrap an
empty database; the schema was originally created by `db.create_all()`. A
production cutover must either add a baseline revision or keep using the
existing schema with these two revisions applied.

## 7. Verification actually run (2026-11-27)

| Check | Command | Result |
| --- | --- | --- |
| Python compile | `python -m compileall app` | clean |
| Phase 5 API foundation | `local-dev/test_phase5_api.py` | 33 pass |
| Phase 6 auth/session | `local-dev/test_phase6_auth.py` | 42 pass |
| Phase 7 public API | `local-dev/test_phase7_public.py` | 43 pass |
| Phase 8 member reads | `local-dev/test_phase8_member.py` | 49 pass |
| Phase 8 member writes | `local-dev/test_phase8_writes.py` | 46 pass |
| Phase 9 admin reads | `local-dev/test_phase9_admin.py` | 14 pass |
| Phase 10 social graph | `local-dev/test_phase10_social.py` | 18 pass |
| Frontend types | `npm run typecheck` | exit 0 |
| Frontend production build | `npm run build` | exit 0; JS 1,273,550 B, CSS 104,232 B |
| Original Jinja pages | `local-dev/.test-artifacts/smoke_jinja.py` | `/about` 200, `/events` 200, `/news` 200, `/api/v1/health` 200; `/` and `/login` 302 redirects |

**Total: 245 backend tests pass.** Not run: browser interaction, responsive
review, real-account sign-in (no genuine account exists in the dev database),
responsive screenshot review, and any production-like load test. These are
Phase 12 items and must be done before a cutover decision.

## 8. Feature and page matrix

| Feature / page group | Data source now | Disposition |
| --- | --- | --- |
| Public home, news, blogs, events, projects, gallery, leaders, topics, elections, member directory, contact, newsletter | `/api/v1/public/*` | Integrated |
| Public Learn page | `data/site.ts` learning paths | Intentionally static (editorial) |
| Public About | `ABOUT`, `ACHIEVEMENTS`, `PARTNERS` | Static and **unverified** — approval or removal needed |
| Member dashboard, activities, events, projects, competitions, elections, teams, rewards, rankings, quizzes, notifications, digital ID, edit profile | `/api/v1/member/*` | Integrated |
| Member change password | `POST /me/password` | Integrated (fixed in Phase 11; was a fake success) |
| Member social profile, privacy settings, global-search member results | `features/social` localStorage store | **Prototype** — API exists, SPA not wired |
| Admin dashboard, members, member detail | `/api/v1/admin/*` reads + AD5 role/access writes | **Integrated** (password-confirmed access changes) |
| Admin approvals | `/api/v1/admin/approvals` | API ready; page not wired yet |
| Admin news, blogs, events, gallery, projects, teams, sessions, RSVPs, rewards, quizzes, elections, competitions, finance, payments, messages, newsletter, technologies, settings, member IDs | `data/demo.ts` | **Demo, labelled "Preview data"** |
| Quizmaster dashboard and builder | `data/demo.ts` | **Demo, labelled**; no JSON API exists |
| Global search content results | `features/search/catalog.ts` | Static catalog; `/public/search` exists but is not used |
| KIUTBOT | external `fightforme.hudumabot.com` Socket.IO widget | Integrated as an external service; needs a network check |
| Uploads: member avatar, documents | `/api/v1/member/*` | Backend integrated |
| Uploads: admin content media | Jinja forms only | Not in the SPA |
| Real-time updates | none | Polling only; the original backend has no Socket.IO |

## 9. Remaining work before a cutover decision

1. **Admin write API** (Phase 9 continuation): member actions/approvals, content
   CRUD, finance reads/writes, messaging/newsletter, uploads. Then wire the 24
   admin pages and delete their demo imports.
2. **Quizmaster JSON API** and page wiring.
3. **Social SPA cutover**: replace `features/social/store.ts` and
   `directory.ts` with the Phase 10 endpoints; delete `kiut-social-v1`.
4. **Social completion**: reports/moderation, audit entries, notification
   fan-out, and block filtering in MD50/public directories.
5. **Phase 11 elimination pass**: remove `data/demo.ts` and
   `features/search/catalog.ts`, and resolve the unverified About arrays.
6. **Phase 12 browser verification**: real account sign-in, responsive review,
   uploads, admin authorisation, and error/empty states with the servers
   running. None of this was run.
7. **Infrastructure decisions**: R16 (Alembic baseline), R19 (in-process rate
   limits under multiple workers), authenticated media serving, quiz handlers
   that commit inside GET requests, and MD51 messaging.

## 10. Proposed cutover plan (not executed)

Preconditions: items 1–6 above complete, all suites green, a genuine account
verified in a browser, a database backup taken, and an approved maintenance
window.

1. Freeze writes to the current site; take a database and uploads backup.
2. Apply `d20261127120000` then `e20261127130000` (or the baseline plan chosen
   for R16); verify counts and a member profile.
3. Deploy the Flask API + SPA build behind the same origin, keeping the Jinja
   routes available.
4. Smoke-test sign-in, one member journey, one admin journey, uploads and
   KIUTBOT on a staging origin.
5. Switch traffic only after sign-off; keep the previous release and the
   database backup available for rollback.
6. Rollback: restore the database copy and uploads snapshot, redeploy the
   previous release; the two new revisions are additive and reversible.

## 11. Known limitations and technical debt

- R16: no Alembic baseline; an empty database cannot be built from migrations.
- R19: rate limits are per process; a multi-worker deployment needs a shared
  store.
- Admin and quizmaster SPA surfaces remain demo data, clearly labelled.
- Social graph has no reports, moderation, audit or notification fan-out; blocks
  do not yet hide a member from MD50 or the public directory.
- MD51 messaging has no message model; only notification batches exist.
- Uploads under `/static/uploads` are directly reachable, not authenticated.
- Some quiz GET handlers still finalise attempts inside the request.
- Event helpers mix UTC defaults with local event dates (recorded in the audit).
- No frontend automated tests; verification is typecheck + build + manual.

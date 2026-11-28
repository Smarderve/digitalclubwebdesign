# KIUT Digital Club — Project Architecture

Audit date: 2026-11-28

This report describes the local workspace as found. The local files are the source of truth; no reset, cleanup, push, deployment, or database migration was performed.

## Repository structure

The workspace is a parent Git repository at `C:\Users\Smarderve\Desktop\Projects\Digital Club` on `main`, currently six commits ahead of `origin/main` with extensive local changes. `current-website/DIgital-Club` is a nested Git repository on `master`, also ahead of its remote and with its own uncommitted integration work.

Generated and machine-local directories are omitted below.

```text
Digital Club/
├── API_DOCUMENTATION.md
├── INTEGRATION_AUDIT.md
├── INTEGRATION_DECISIONS.md
├── INTEGRATION_HANDOVER.md
├── INTEGRATION_PROGRESS.md
├── KIUT_DIGITAL_CLUB_INTEGRATION_MASTER_PLAN.md
├── LOCAL_DEVELOPMENT.md
├── current-website/DIgital-Club/       # nested Flask Git repository
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api/                         # versioned JSON API
│   │   ├── routes/                      # original Flask/Jinja routes
│   │   ├── services/
│   │   ├── models.py
│   │   ├── templates/
│   │   └── static/uploads/
│   ├── migrations/
│   ├── tests/
│   ├── scripts/
│   ├── main.py
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── Dockerfile
│   └── docker-compose.yml
├── local-dev/                           # local DB, server, and phase tests
└── new-website-design/                  # React/Vite SPA
    ├── public/brand/
    ├── public/images/                   # supplied club/campus photography
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── components/{app,auth,site,ui}/
    │   ├── context/
    │   ├── data/
    │   ├── features/{kiutbot,search,settings,social}/
    │   ├── lib/                         # API clients and data hooks
    │   ├── pages/{public,auth,member,admin,quizmaster}/
    │   ├── icons/
    │   └── index.css
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── docs/
```

## Technology stack

The SPA uses React 18, TypeScript, Vite, Tailwind CSS, React Router 6, React Hook Form, Radix UI primitives, Iconify/Lucide icons, `socket.io-client`, and Inter. The backend uses Python, Flask, Flask-Login, Flask-SQLAlchemy, Flask-Migrate/Alembic, SQLAlchemy, SQLite for the local schema-only database, and PostgreSQL-compatible configuration for deployment. Gunicorn, Docker, Railway startup scripts, Celery/RQ helpers, and external Turnstile/KIUTBOT integrations are present.

## Frontend architecture

- `src/main.tsx` mounts `App`.
- `src/App.tsx` mounts `BrowserRouter`, authentication, toast, tooltip, and KIUTBOT providers, then selects public, auth, member, admin, or quizmaster layouts.
- Public routes include home, about, projects, topics, learning, leaders, members, elections, news, events, blogs, gallery, contact, and ID verification, with detail routes where applicable.
- Auth routes cover login, registration, password recovery, and reset.
- Member routes cover dashboards, learning, activities, projects, events, competitions, elections, teams, rewards, rankings, digital ID, profile, settings, notifications, and related forms.
- Admin routes cover dashboard, people, content, programmes, finance, messaging, rewards, settings, and other operational views. Many still consume `src/data/demo.ts`.
- Shared site components include header/footer, page mastheads, hero systems, cards, primitives, theme controls, and `art.tsx`.
- Appearance preferences are client-side and persisted in `localStorage`; authentication/session state is intended to use Flask cookies through `src/lib/api.ts`.
- `src/lib/publicApi.ts`, `memberApi.ts`, and `usePublicData.ts`/`useMemberData.ts` provide the newer API-backed data paths.
- `src/data/site.ts` remains intentionally editorial for taxonomies and some copy. `src/data/demo.ts`, the social store, and search catalog remain known prototype sources.

## Backend architecture

- `app/__init__.py` creates the Flask application, configures extensions, registers original Jinja blueprints, registers `/api/v1`, and exposes `/healthz`.
- Original route blueprints remain under `app/routes/` for auth, main/public pages, member, admin, election, quizmaster, and ID verification workflows.
- `app/api/` contains health, auth/accounts, current-user, public, member, admin, social, response/error, validation, sanitisation, and rate-limit modules.
- `app/models.py` contains users, members, events/RSVPs, projects, news/blog/gallery/technology/topic content, competitions, teams, sessions, quizzes, rewards, elections, notifications, finance, uploads, and social graph models.
- `app/services/` contains member, competition, quiz, and account service logic.
- `migrations/` contains additive revisions, including member privacy and social-graph revisions; the handover records that no Alembic baseline exists for a brand-new empty database.
- Authentication uses Flask-Login sessions, CSRF protection, server validation, role checks, and Turnstile configuration. Uploads are under `app/static/uploads/` and are not yet an authenticated media surface.

## Integration architecture

Development runs Flask on `127.0.0.1:5051` and Vite on `127.0.0.1:5178`. Vite proxies `/api`, `/healthz`, and `/static/uploads` to Flask, preserving same-origin cookie/CSRF behavior; no CORS layer is required for this local topology. The SPA calls `/api/v1/*`, uses cookie credentials, obtains CSRF through `/api/v1/auth/csrf`, and renders the server's response/error envelope. KIUTBOT is a separate external Socket.IO widget and is not part of the Flask backend.

## Feature implementation matrix

| Area | Local status | Evidence / caveat |
| --- | --- | --- |
| Public content reads | Integrated | Public pages use `/api/v1/public/*`; Learn is editorial/static. |
| Auth/session | Integrated in source | Browser sign-in was not rerun; no genuine account exists in the schema-only DB. |
| Member read/write portal | Integrated in source | Uses `/api/v1/member/*`; social-profile surfaces remain local-store backed. |
| Admin dashboard/directory | Partially integrated | Read surfaces and access actions exist; most admin pages remain demo data. |
| Admin content/finance/messaging CRUD | Demo/deferred | 24 admin pages still import `src/data/demo.ts`; no complete JSON write surface. |
| Quizmaster | Demo/deferred | No JSON API; page still uses demo quiz records. |
| Social graph | Backend integrated, SPA prototype | API and tables exist; SPA still uses `kiut-social-v1` localStorage. |
| Search | Partially integrated | Static search catalog and local social store remain in use. |
| KIUTBOT | External integration | Socket.IO client targets `fightforme.hudumabot.com`; not exercised here. |
| Original Jinja app | Serving | Handover reports smoke-tested routes; local current source was not reset. |
| Illustration redesign | Not yet implemented | Current `art.tsx` is outline SVG placeholder art; image generation needs reauthentication. |

## Important technical debt

The handover correctly marks the platform not ready for cutover. Remaining issues include demo data in admin/quizmaster surfaces, the local social store, lack of an Alembic baseline, per-process rate limits, directly reachable uploads, some quiz GET handlers that commit, mixed UTC/local event handling, and no frontend automated test suite. These are preserved findings, not silently “fixed” by the visual work.


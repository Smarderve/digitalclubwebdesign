# INTEGRATION AUDIT — KIUT Digital Club

> Companion documents: `INTEGRATION_PROGRESS.md` (phase status and baseline).
> `INTEGRATION_MASTER_PLAN.md` is the controlling plan; it is not stored in this
> repository yet (see Open items).
>
> **Current contents: Phase 0 and Phase 1.** Phase 1 (Flask backend and
> data-source audit) is complete; Phase 2 onward has not been executed.
> Sections marked *pending* are placeholders, not findings.

---

## 1. Scope of this document

Phase 0 is a **read-only orientation pass**: locate both project roots, confirm
entry points, package managers and run scripts, record the pre-existing
working-tree state, enumerate ignored/local-only files and databases, and list
baseline risks. No application code, configuration, database, Git setting or
dependency was changed while producing it.

Commands used are all read-only: `git status`, `git ls-files`, `git remote -v`,
`git rev-parse`, `ls`, `find`, `cat`/file reads, and version probes
(`node --version`, `python --version`, `uv --version`). Nothing was installed,
started, migrated or seeded.

---

## 2. Repository map

### 2.1 Parent testing repository

| Item | Value |
| --- | --- |
| Local root (Git Bash form) | `C:/Users/Smarderve/Desktop/Projects/Digital Club` |
| Branch | `main` |
| Remote `origin` | `https://github.com/Smarderve/digitalclubwebdesign.git` (fetch + push) |
| Tracked paths | 233 |
| Tracked top-level entries | 221 under `new-website-design/`, 1 `current-website` (gitlink), 11 PNG screenshots at the root |
| Project instruction files | None (no `AGENTS.md`, `CLAUDE.md`, root `README.md`) |
| Integration documents before this phase | None |

```
Digital Club/                      ← parent repo root (branch main)
├─ current-website/
│  └─ DIgital-Club/                ← separate Git repo (gitlink), branch master
├─ new-website-design/             ← React redesign (tracked by parent)
├─ Pictures/                       ← untracked, not part of either project
└─ *.png                           ← 11 tracked screenshots at repo root
```

### 2.2 The Flask project sits in its own Git repository

`current-website/DIgital-Club` is recorded in the parent index as a **gitlink**
(mode `160000`, commit `f047929`) and there is **no `.gitmodules` file**. That
means:

- the parent repository tracks only the pinned commit id, not the files;
- the Flask source is versioned separately (`master`,
  `https://github.com/KIUT-DIGITAL-CLUB/DIgital-Club.git`, worktree clean at the
  time of inspection);
- any change inside `current-website/DIgital-Club` will show as a gitlink
  modification in the parent, not as file diffs.

This is a documented constraint, not something to change. It affects every later
phase that edits the backend: those edits belong to the nested repository and
must be reviewed/committed there, separately from the React changes in the
parent.

### 2.3 Pre-existing working-tree state (must be preserved)

Parent repository at the start of Phase 0:

| State | Count | Detail |
| --- | --- | --- |
| Modified (unstaged) | 100 | 71 `new-website-design/src/pages/*`, 18 `src/components/*`, 5 `src/features/*`, 2 `src/data/*`, 1 `src/context/*`, `src/App.tsx`, plus `dev-server.log` and `tsconfig.tsbuildinfo` |
| Deleted (unstaged) | 1 | `new-website-design/build.log` |
| Untracked | 4 | `Pictures/`, `new-website-design/audit/`, `new-website-design/public/images/club/`, `new-website-design/src/components/app/AppearancePanel.tsx` |
| Ignored | 4 | `.cloud-attachments/`, `.freebuff/`, `new-website-design/dist/`, `new-website-design/node_modules/` |

Nested Flask repository: clean (`git status --porcelain` returned nothing).

None of the above was modified, staged, reverted or deleted in Phase 0.

---

## 3. Flask application — runtime map

### 3.1 Root and entry points

| Item | Value |
| --- | --- |
| Project root | `current-website/DIgital-Club` |
| Primary entry point | `main.py` → `app.create_app()` (module-level `app`, then `app.run`) |
| Application factory | `app/__init__.py` → `create_app()` |
| Alternative entry points | `flask run` with `FLASK_APP=main.py`; Gunicorn via `gunicorn_conf.py` and `scripts/railway_start.sh`; container via `Dockerfile` + `docker-compose.yml` |
| Default dev port | `5051` (`PORT` env var, default in `main.py`); direct run binds `0.0.0.0` with `debug=True` |
| Request-free health probe | `GET /healthz` (added in `create_app`, returns JSON) |
| Python requirement | `pyproject.toml` → `requires-python = ">=3.13"`; `.python-version` → `3.13` |
| Dependency manager | `uv` (`uv.lock` present); README also documents the `pip install -e .` path |
| Installed toolchain on this machine | Python 3.15.2 (no `.venv`), `uv` **not on PATH** |

### 3.2 Package layout

```
current-website/DIgital-Club/
├─ main.py                     app instance, startup DB bootstrap
├─ config.py                   legacy local file (gitignored, unused) — see risks
├─ config_example.1env         tracked template of environment variable names
├─ pyproject.toml / uv.lock    dependencies
├─ Dockerfile, docker-compose.yml, gunicorn_conf.py
├─ app/
│  ├─ __init__.py              factory, extensions, blueprint registration,
│  │                           before_request hooks, startup compatibility DDL
│  ├─ models.py                SQLAlchemy model layer
│  ├─ routes/                  main.py, auth.py, admin.py, member.py,
│  │                           quizmaster.py, verification.py,
│  │                           election_admin.py, election_member.py, __init__.py
│  ├─ templates/               Jinja templates (public, auth/, member/, admin/,
│  │                           quizmaster/)
│  ├─ static/                  css/, js/, uploads/, logos
│  ├─ utils.py                 NotificationService (email + SMS)
│  ├─ sms.py                   Beem SMS gateway client
│  ├─ id_generator.py          digital ID image generation (Pillow/qrcode)
│  ├─ pdf_generator.py         ID / membership PDFs (reportlab)
│  ├─ election_utils.py        election phases, tallying, winner installation
│  ├─ quiz_*.py                quiz queue, generation tasks, reminders, cleanup
│  ├─ celery_app.py / celery_tasks.py
│  ├─ member_requirements.py   allowed courses/years
│  ├─ secret_crypto.py         encryption for settings secrets
│  └─ time_utils.py            app-timezone conversion
├─ migrations/                 Alembic (18 version files) + env.py
├─ scripts/                    migration/repair/worker scripts, railway_start.sh
└─ tests/test_rsvp.py          single standalone script (see 3.6)
```

### 3.3 Blueprints and URL prefixes

Registration is in `app/__init__.py`:

| Blueprint | Prefix | Area |
| --- | --- | --- |
| `main_bp` | *(none)* | Public site (`/`, `/home`, `/about`, `/leaders`, `/elections`, `/alumni`, `/members`, `/students`, `/learn`, `/news`, `/events`, `/projects`, `/gallery`, `/topics`, `/contact`, `/blogs`, `/newsletter/subscribe`, `/events/<id>/rsvp`) |
| `auth_bp` | `/auth` | Registration, login, logout, approval-pending, forgot/reset password |
| `admin_bp` | `/admin` | Admin portal, content, members, finance, competitions, sessions, teams, quizzes, elections |
| `member_bp` | `/member` | Member portal: dashboard, profile, projects, digital ID, rewards, membership, teams, events, sessions, quizzes, competitions, elections, notifications |
| `quizmaster_bp` | `/quizmaster` | Quiz creation, AI generation, builder |
| `verification_bp` | *(none)* | `/verify-id/<member_id_number>` public ID verification |

Also registered directly on the app: `/healthz`, plus `404` handling that
redirects non-`/api/` paths to the homepage.

### 3.4 Database configuration (no secret values)

- Configured in `create_app`: `SQLALCHEMY_DATABASE_URI = DATABASE_URL` env var,
  falling back to `sqlite:///digital_club_01.db`.
- `.env` is loaded by `python-dotenv` when present. **No `.env` file exists
  anywhere in the repository**, and no `instance/` directory or `*.db` file
  exists, so there is currently **no local Flask database** on this machine.
- `docker-compose.yml` defines PostgreSQL 16 (`db`), Redis 7 (`redis`), the web
  service (port `127.0.0.1:5051`), an RQ worker, and Celery worker/beat
  services. The compose defaults are local container credentials, not
  production secrets.
- Uploads are written under `app/static/uploads/{profiles,gallery,digital_ids,
  competitions,elections/passports,quiz_resources}/` and are created at startup
  if missing.
- `MAX_CONTENT_LENGTH` is 16 MB.

**Safe local development database (for Phase 4, not created now):** a local
`sqlite:///…` file or the compose PostgreSQL service, selected through a local
`.env` that is never committed. Because the database is absent, no production
data can be reached by accident from this machine today.

### 3.5 Startup behaviour to be aware of

`app/__init__.py` runs schema "compatibility" DDL (raw `ALTER TABLE` /
`create(checkfirst=True)`) for several tables inside `create_app()`, and
`main.py` calls `init_db()` at import time, which creates a super-admin user if
that email is missing. Both run on **any** app start, including a future local
run. They are recorded here as a startup constraint; changing them is out of
scope for Phase 0 and needs approval.

### 3.6 Tests and setup requirements

- `tests/test_rsvp.py` is a **standalone script** (prints emoji status lines,
  writes an RSVP row to whatever database is configured), not a pytest suite.
  There are no fixtures, factories or CI configuration.
- Setup per `README.md`: create virtual environment, install from `pyproject`
  (`uv sync` or `pip install -e .`), copy `config_example.1env` → `.env`, set
  `SECRET_KEY` and `DATABASE_URL`, then `python main.py` (port 5051).

### 3.7 Tracked static content and uploads

`app/static/uploads/` is tracked in the nested repository and contains profile
photos, digital ID card images (`digital_ids/DC-YYYY-NNNN_{front,back}.png`),
event/blog images, an election passport image and quiz resource files. These are
real-person artefacts and are treated as sensitive for all later phases.

---

## 4. React application — runtime map

| Item | Value |
| --- | --- |
| Project root | `new-website-design` |
| HTML entry | `index.html` → `src/main.tsx` → `src/App.tsx` |
| Build tool | Vite 5, `@vitejs/plugin-react`, TypeScript 5.7, Tailwind 3.4 |
| Package manager | npm (`package-lock.json`; no yarn/pnpm lockfile) |
| Node pin | `.nvmrc` → `20`; installed on this machine: Node `v26.13.1`, npm `11.20.0` |
| Scripts | `dev` (`vite`), `build` (`tsc -b && vite build`), `preview` (`vite preview`), `typecheck` (`tsc -b --noEmit`) |
| Dev server | `127.0.0.1:5178` (configured in `vite.config.ts`) |
| Preview server | `127.0.0.1:4178` |
| Backend proxy | **None configured** — Vite has no `server.proxy` entry, so the React app has no current HTTP link to Flask |
| Router | `react-router-dom` 6 |
| Realtime client | `socket.io-client` 4.8.4, used by the KIUTBOT chat feature |
| Source layout | `src/{App.tsx,main.tsx,index.css,components,context,data,features,icons,lib,pages}` |

Existing project documentation (must not be duplicated or overwritten):

| File | Content |
| --- | --- |
| `new-website-design/docs/05-media-assets.md` | Provenance of stock photography, widths, reuse map, "not KIUT photos" disclosure |
| `new-website-design/docs/06-kiutbot.md` | Restored KIUTBOT chat integration: third-party hosted Socket.IO endpoint, protocol, restored file map |

No README, API documentation, or `.env` file exists for the React project.

**KIUTBOT orientation note:** the chatbot backend is a hosted third-party
service (`fightforme.hudumabot.com`, Socket.IO, websocket-only transport per
`docs/06-kiutbot.md`), not part of the Flask app. Whether it counts as part of
the integration surface is a Phase 3 decision.

---

## 5. Local-only and ignored artefacts

| Path | Status | Meaning |
| --- | --- | --- |
| `new-website-design/node_modules/` | ignored | installed dependencies |
| `new-website-design/dist/` | ignored | previous build output |
| `.cloud-attachments/`, `.freebuff/` | ignored | tooling artefacts |
| `current-website/DIgital-Club/.gitignore` ignores | ignored there | `instance/`, `.env`, `config.py`, `.venv`, `__pycache__`, `*.db` |
| `new-website-design/dev-server.log`, `check.log`, `install.log` | tracked or modified | pre-existing local logs, not part of the app |
| `Pictures/` | untracked | unrelated local folder |
| `new-website-design/audit/` | untracked | screenshot/audit artefacts |

Environment files: **none present** in either project (only
`config_example.1env`, a placeholder template).

---

## 6. Baseline risks observed during orientation

These are recorded, not remediated. Each is verified in Phase 1 unless noted.

1. **Nested repository split.** Backend changes live in a different Git
   repository than the frontend; the parent only stores a commit pointer and
   `.gitmodules` is absent. Review, diff and commit flows must handle both.
2. **Large pre-existing diff.** 100 modified files and 4 untracked paths in the
   parent, plus one deleted file. Selective staging is mandatory; `git add -A`
   is prohibited by the plan.
3. **No local Flask database or environment.** Integration work cannot be
   exercised until Phase 4 establishes an isolated local database. No production
   data is reachable from this machine in the current state.
4. **Startup side effects.** `create_app()` performs compatibility DDL and
   `main.py` creates a default super-admin when missing; any local run mutates
   the target database. First-run behaviour must be understood before Phase 5.
5. **Tracked personal media.** Real profile photos, digital ID images and an
   election passport are committed in the backend repo and served from
   `/static/uploads/…`. Public React pages and APIs must never expose them; to be
   confirmed field-by-field in Phase 1 and designed away in Phase 3.
6. **Legacy credential file.** `config.py` exists on disk (gitignored, no
   imports found yet) and `config_example.1env` is tracked with placeholder
   credentials. Values were not copied into any document. Removal requires
   explicit approval and is not a Phase 0 action.
7. **Toolchain drift.** Python 3.15.2 installed while the project pins 3.13, and
   `uv` is missing; Node 26 installed while `.nvmrc` pins 20. Native-wheel
   dependencies (`psycopg2-binary`, `cairosvg`, `Pillow`, `reportlab`) may behave
   differently; Phase 4 decides the supported local runtime.
8. **Tests are a manual script.** There is no automated suite or CI to prove
   regressions, so later phases need their own test strategy.
9. **No API layer exists yet.** The app is entirely server-rendered Jinja with
   Flask-Login sessions; the small set of JSON responses is ad-hoc. Confirmed as
   the integration target, detailed in Phase 1.
10. **Master plan not in the repository.** `INTEGRATION_MASTER_PLAN.md` exists
    only as the controlling document supplied to the agent; copying it in
    requires approval.

---

## 7. Uncertainty recorded rather than assumed

- Whether the gitlink is intentional or the by-product of adding a nested clone
  is unknown; no history rewrite or submodule conversion is proposed.
- Whether the 100 modified React files are intentional in-progress work or
  environment churn is unknown; they are treated as the user's work.
- Whether a production database copy will be supplied for local testing is
  unknown; Phase 4 must not assume one exists.
- The recorded source of the 200+/50+/100+ homepage statistics in
  `app/templates/index.html` is not yet traced to a model. That trace belongs to
  Phase 1.

---

## 8. Phase 0 acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| Both project roots and actual paths identified | Passed | §2.1, §3.1, §4 |
| Existing working-tree state documented | Passed | §2.3 |
| Flask and React entry points identified | Passed | §3.1, §4 |
| No application files, database records or Git configuration changed | Passed | Only this file and `INTEGRATION_PROGRESS.md` were created; nested repo clean; no `git config`/remote/branch command run |
| No dependencies installed | Passed | none installed; only version probes |
| Existing documentation identified and not duplicated | Passed | `README.md`, `docs/05-media-assets.md`, `docs/06-kiutbot.md` | 

---

## 9. Phase 1 — Backend and data-source audit

**Authorized scope:** complete Flask backend and data-source audit only.

**Read-only confirmation.** This section was produced without importing the
application, without `create_app()`, without any database connection, without
installing anything, and without changing any file other than this document and
`INTEGRATION_PROGRESS.md`. Method: static reading of `app/`, `main.py`,
`config_example.1env`, `pyproject.toml`, `README.md`; read-only `grep`/`wc`
counts of route decorators, models, template variables and environment-variable
names. No `.env` was read, no `config.py` values were read, no row of personal
data was opened.

**Size of the surface measured:** 59 model classes, 255 route decorators
(151 `admin.py`, 45 `member.py`, 24 `main.py`, 17 `election_admin.py`,
6 `auth.py`, 6 `election_member.py`, 5 `quizmaster.py`, 1 `verification.py`),
18 Alembic migrations, 0 JSON API blueprints.

### 9.1 Data model (59 tables, grouped by domain)

| Domain | Models | Key relationships / rules |
| --- | --- | --- |
| Identity | `User`, `Member`, `Leader`, `DailyActiveUser` | `User` 1–1 `Member` (cascade delete); `Leader` points at `User` and reads identity through `Member`; `DailyActiveUser` unique per `(user_id, date)`; `User.is_active` property drives Flask-Login blocking; `is_super_admin` is a non-demotable flag |
| Elections | `LeadershipPositionTemplate`, `Election`, `ElectionPosition`, `ElectionCandidate`, `ElectionVote` | Election status machine `draft → nominations → screening → voting → counting → finalized → archived/cancelled`; unique `(position, member)` candidacy and unique `(position, voter)` vote — one vote per position per member; winning candidates are installed into `Leader` |
| Public content | `News`, `Event`, `Project`, `Gallery`, `Technology`, `Topic`, `Newsletter`, `Blog` | `Project` mixes admin projects (`is_admin_project`, `member_id` NULL) and member projects (`is_public`); `Blog` has slug + publish flag + view counter; `Event` has `target_audience` (`everyone`/`members`/`paid_members`), capacity, check-in points |
| Attendance | `RSVP` | Optional link to `Member`; statuses `pending/approved/rejected`; 6-digit `acceptance_code`; check-in fields and approver/checker FKs; unique per event by email/phone enforced in code, not in the schema |
| Rewards & membership | `RewardTransaction`, `Trophy`, `MemberTrophy`, `MembershipPayment`, `SystemSettings` | Points are the sum of transaction rows; trophies are earned by points thresholds; membership validity = any payment covering today; `SystemSettings` stores key/value config including encrypted secrets |
| Finance | `FinancialPeriod`, `FinancialCategory`, `FinancialTransaction` | Periods are `open`/`closed` with audit fields; transactions are revenue/expense, optionally linked to a payment |
| Competitions | `Competition`, `CompetitionSponsor`, `CompetitionSponsorLink`, `CompetitionJudge`, `CompetitionCriteria`, `CompetitionSubmission`, `CompetitionScore`, `CompetitionReward`, `CompetitionWinner`, `CompetitionGuard`, `CompetitionEnrollment`, `CompetitionTeamEnrollment(+Member)`, `CompetitionTeamSubmission`, `CompetitionTeamScore`, `TeamCompetitionPoint` | Levels 1–3 gate eligible years; optional paid-membership rule; individual **and** team tracks each with submissions, criteria-weighted scores, rank/winner flags, disqualification and admin notices |
| Sessions | `SessionWeek`, `SessionSchedule`, `SessionReport` | Week `draft/published/archived`; schedule rows carry instructor, mode, meeting link, teaching/question minutes; one report per `(session, instructor)` with `pending/approved/rejected` and awarded points |
| Teams | `Team`, `TeamMember` | Member-owned teams with leader flag, join requests (`pending/approved/rejected`), suspension and admin notice; team points accumulate in `TeamCompetitionPoint` |
| Quizzes | `Quiz`, `QuizResource`, `QuizQuestion`, `QuizOption`, `QuizAttempt`, `QuizAttemptAnswer`, `QuizViolation`, `QuizLeaderboard`, `QuizReminderPreference`, `QuizReminderNotification` | Status machine `draft → queued → generating → ready → pending_approval → approved → published → archived`; one attempt per `(quiz, member)`; options carry `is_correct`; violations (tab switch, blur, paste, inactivity) reduce a confidence factor; leaderboard unique per quiz and per rank |
| Notifications | `NotificationBatch`, `MemberNotification` | Admin batch send to a filtered audience; per-member copy with read flag and SMS status |

Notable modelling facts for integration:

- There is **no API token, device, refresh-token or session table**; identity is exclusively the Flask session cookie.
- There is **no separate profile/handle table**: `Member` is the only public identity, and `Member.status` (`student`/`alumni`) is what splits `/students` from `/alumni`.
- There is **no audit-log table** beyond per-row `created_at`/`updated_at`, `recorded_by`, `approved_by`, `reviewed_by` foreign keys.
- Several columns store comma-separated or newline-separated text (`Project.technologies`, `Project.team_members`, `Member.areas_of_interest`, `Blog.tags`, `ElectionPosition.roles`, `Competition.eligibility_years`) and are parsed in Python, not modelled as relations.

### 9.2 Route inventory and guards

Every URL below is server-rendered Jinja. Guard legend: **P** public,
**L** `@login_required`, **A** `@admin_required` (role `admin`), **Q**
`@quizmaster_required` (role `quizmaster` or `admin`).

**Public (`main_bp`, no prefix) — 24 routes, all P**

`/`, `/home`, `/about`, `/leaders`, `/elections`, `/elections/<id>`, `/alumni`,
`/members`, `/learn`, `/learn/notes/<id>/preview`, `/learn/notes/<id>/download`,
`/learn/cover/<field>.svg`, `/students`, `/news`, `/news/<id>`, `/events`,
`/projects`, `/gallery`, `/topics`, `/contact` (GET+POST), `/newsletter/subscribe`
(POST), `/blogs`, `/blogs/<slug>`, `/events/<id>/rsvp` (GET+POST).

Public pages load real database rows; four of them are static templates:
`/about` and `/contact` render with no query at all, `/topics` reads `Topic`,
`/gallery` reads `Gallery`. `/contact` POSTs flash a thank-you and persist
nothing. `/learn/notes/...` streams `QuizResource` files from disk and 404s
unless the parent quiz is `published` (admins may preview unpublished ones).

**Auth (`auth_bp`, `/auth`) — 6 routes**

`/register` (P, POST), `/login` (P, POST), `/logout` (L), `/approval-pending` (P),
`/forgot-password` (P, POST), `/reset-password/<token>` (P, GET+POST).

**Member (`member_bp`, `/member`) — 45 decorators (44 with `@login_required`)**

Dashboard, profile, edit-profile, change-password, projects (list/add/edit/delete),
digital-id, download-id (`/<side>`), regenerate-id, rewards, membership, teams
(GET+POST) and team request decisions, competitions (weekly, monthly, detail,
submit, leaderboard, score, enroll, team-enroll, team-submit), rankings and
points-transactions, notifications (list/detail), events and event RSVP,
sessions (timetable, instructors, report), quizzes (list, detail, start,
reminder, take, answer, violation, submit, result, leaderboard), member search
(JSON), elections (list, detail, apply, withdraw, vote, results).

Access to the whole panel is `@login_required` only — there is no separate
"member" role check, because `role` is `student` or `quizmaster` for panel users
and `admin` for staff. A `member_bp.before_request` hook additionally forces
profile completion (valid course + phone) before any member page except
`profile`, `edit_profile`, `change_password`.

**Admin (`admin_bp`, `/admin`) — 151 routes in `admin.py` + 17 in `election_admin.py`, all L+A**

Users and approvals; news, events, projects, gallery, leaders, blogs CRUD;
newsletter (list, CSV export, toggle); notifications (recipients preview, send,
batch detail); RSVP review (single + bulk approve/reject/reset); technologies;
members (list, CSV export, detail, promote, promote/revoke quizmaster, demote,
toggle-active, delete-account); member IDs (view, PDF export); rewards (scan,
lookup JSON, search JSON, add points, history, trophies CRUD); payments (list,
add, edit, delete, CSV export); settings; event check-in (screen, check in, undo);
financial (periods, close/reopen, transactions, categories, reports, CSV export);
competitions (CRUD, criteria, judges, rewards, sponsors, submissions, scoring,
notices, finalize, enrollments, disqualify, leaderboard); sessions (weeks,
publish/archive, sessions, reports approve/reject); teams (detail, assign,
remove, leader, decisions, suspend, delete); quizzes (list, settings, detail,
approve, publish, unpublish, delete, analytics); elections (templates,
elections, positions, applications, candidate review, results, finalize).

**Quizmaster (`quizmaster_bp`, `/quizmaster`) — 5 routes, all L+Q**

Dashboard, quiz create, AI generate, builder, delete.

**Verification (`verification_bp`, no prefix) — 1 route, P**

`/verify-id/<member_id_number>` renders a page stating whether an ID exists and,
if so, the member's identity.

### 9.3 Business rules the integration must not re-implement incorrectly

| Rule | Where enforced |
| --- | --- |
| New registrations are `is_approved = False` unless `SystemSettings.registration_approval_mode == 'auto'`; unapproved students cannot log in to the panel | `auth.register`, `auth.login`, `admin.users` |
| Course and year must be one of the fixed lists in `member_requirements.py` (11 courses, 6 years) | registration, login gate, profile completion hook |
| Every login/registration/RSVP POST requires a successful Cloudflare Turnstile verification; if the keys are unset the action is **refused** rather than allowed | `auth.py`, `main.py` (`_verify_turnstile`) |
| Deactivated accounts are logged out on the next request | `app.before_request enforce_active_accounts` |
| Membership status derives from `MembershipPayment` date ranges: `valid`, `expired`, `none`; paid-only events/competitions/elections check it | `Member` helpers, `member.py`, `election_utils.py` |
| Points are an append-only sum of `RewardTransaction`; trophies are threshold-based and unique per member | `Member.get_total_points`, `admin` rewards routes |
| Competition eligibility = level-based years (custom override) + optional paid membership + one submission per member/team | `Competition.get_allowed_years`, `member.py` |
| One quiz attempt per `(quiz, member)`, timed by `expires_at`, auto-submitted on expiry or violation limit; leaderboard ranks award points | `member.py` quiz routes, `quiz_constants.py` |
| Elections enforce application windows, paid-membership option, one vote per position, tally then finalize → `Leader` rows written | `Election` helpers, `election_utils.py` |
| Team join requests need leader/admin approval; suspended teams cannot enrol | `member.py`, `admin.py` |
| Session reports need admin approval before points are awarded | `admin.py` sessions routes |

### 9.4 Authentication, session and account lifecycle

- Flask-Login session cookie, signed with `SECRET_KEY`; `login_user(..., remember=True)` plus `session.permanent = True`, both defaulting to 30 days (`SESSION_LIFETIME_DAYS`, `REMEMBER_LIFETIME_DAYS`).
- Cookie attributes: `SESSION_COOKIE_SAMESITE` defaults to `Lax`; `REMEMBER_COOKIE_SECURE` defaults to `1`; `REMEMBER_COOKIE_HTTPONLY = True`. `SESSION_COOKIE_SECURE` is never set. No `SESSION_COOKIE_DOMAIN`, so the cookie is host-only.
- `SECRET_KEY` falls back to the literal string `dev-secret-key-change-in-production` when the variable is unset — the same value used to sign sessions and to salt password-reset tokens.
- Password reset uses `itsdangerous.URLSafeTimedSerializer` with salt `password-reset-salt` and a 24-hour max age, delivered by e-mail **and SMS**, and always answers with the same message whether or not the account exists.
- Super-admin bootstrap: `main.py` creates `admin@digitalclub.kiut.ac.tz` with the hardcoded password `admin123` on import whenever that account is missing.
- Roles are the string values `admin`, `quizmaster`, `student`; there is no permission table, no per-resource ownership layer beyond explicit `member_id` comparisons in routes.
- Digital ID images are generated at login when missing (`generate_digital_id`), so login has a filesystem side effect.

### 9.5 Existing JSON surface (complete)

Ten endpoints return JSON, all ad-hoc and unversioned, all under HTML
blueprints:

| Endpoint | Guard | Purpose |
| --- | --- | --- |
| `POST /newsletter/subscribe` | P | subscribe, `{success, message}` |
| `GET /member/members/search` | L | member autocomplete incl. **e-mail addresses** |
| `GET /admin/messages/recipients-preview` | L+A | audience count |
| `POST /admin/rsvps/bulk-approve` / `-reject` / `-disapprove` | L+A | bulk status change |
| `POST /admin/rewards/member-lookup` | L+A | member by ID number |
| `POST /admin/members/search` | L+A | member search |
| `POST /admin/rsvps/checkin/<id>` and `/undo` | L+A | attendance toggle |

Everything else is `render_template`, `redirect`, a CSV/PDF download, or a file
stream. There is **no** JSON representation of news, events, projects, blogs,
gallery, leaders, members, elections, competitions, quizzes, sessions, teams,
notifications or finance — the integration target does not exist yet.

### 9.6 Content sources: database vs hardcoded

| Surface | Source |
| --- | --- |
| Home feed (news, events, projects) | DB: latest 3 news, next 3 public events, latest 3 projects |
| Homepage hero counters `200+ / 50+ / 100+` | **Hardcoded in `app/templates/index.html` (lines ~1421–1433)**; not derived from any model |
| About, Contact | Static templates, no query |
| Leaders | DB: `Leader` + up to 3 non-draft elections |
| Members / Students / Alumni | DB: approved `Member` rows filtered by `status`, plus course/year distinct lists and counts |
| News, Blogs, Events, Projects, Gallery, Topics, Learn | DB, with the filters described in 9.2 |
| Elections (public) | DB: non-draft/non-cancelled elections, approved candidates when the phase allows |
| Member panel, Admin panel, Quizmaster panel, Verification | DB |

Two data-source defects to carry into design (recorded, not fixed):

1. The homepage's "featured projects" query is `Project.query.order_by(created_at.desc()).limit(3)` — it does **not** filter `is_public`, so a member's private project can appear on the public homepage.
2. Many public views wrap their queries in `try/except` and silently render empty lists, so a database outage looks like "no content" rather than an error.

### 9.7 External services and background work

| Concern | Implementation | Configuration names only |
| --- | --- | --- |
| E-mail | `NotificationService` over SMTP, background thread | `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `FROM_EMAIL` |
| SMS | Beem Africa HTTP API (`app/sms.py`) | `BEEM_API_KEY`, `BEEM_SECRET_KEY` |
| Human verification | Cloudflare Turnstile siteverify | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Quiz generation | DeepSeek or Gemini, key stored encrypted in `SystemSettings` | settings `quiz_ai_provider`, `deepseek_api_key`, `gemini_api_key`; `SETTINGS_ENCRYPTION_KEY` |
| Queue | RQ in `quiz_queue.py`, Celery app/tasks present, Redis optional | `REDIS_URL` |
| Scheduled quiz reminders | per-request hook `process_quiz_reminders`, interval-gated | `QUIZ_REMINDER_RUN_ON_REQUEST`, `QUIZ_REMINDER_INTERVAL_SECONDS` |
| Timezone | app-local naive times from UTC | `APP_TIMEZONE` (default `Africa/Nairobi`), `APP_UTC_OFFSET_HOURS` |
| Deploy | Gunicorn (`gunicorn_conf.py`), Docker/compose, Railway script | `PORT`, `GUNICORN_WORKERS`, `SERVER_NAME`, `PREFERRED_URL_SCHEME` |

No secret values were read. The tracked `config_example.1env` contains only
placeholder credentials, and the on-disk `config.py` was not opened.

### 9.8 Security observations (recorded, not remediated)

1. **No CSRF protection at all.** `flask-wtf` is a declared dependency but
   `CSRFProtect` is never initialised, no form is a `FlaskForm`, and no template
   contains `csrf_token`. Every state-changing POST (login, register, profile
   edit, RSVP, admin CRUD, election vote, competition submit, quiz submit) is
   therefore reachable cross-site by any page that can post to the origin, with
   only `SameSite=Lax` cookies as an accidental partial mitigation.
2. **No JSON API security layer exists.** No token/API-key concept, no CORS
   configuration, no rate limiting, no per-endpoint JSON authorization, and no
   JSON error schema (`/api/*` 404 returns `{"error": "Not found"}` although no
   API blueprint exists).
3. **Predictable session signing fallback** (`dev-secret-key-change-in-production`)
   and a **hardcoded super-admin** (`admin123`) created at startup.
4. **Personal data exposure paths:** `/member/members/search` returns member
   e-mail addresses to any logged-in user; `/verify-id/<id>` confirms an ID and
   renders identity to anyone; `/static/uploads/...` serves profile photos,
   digital ID images and election passports directly with no authorization.
5. **Public homepage leaks non-public projects** (9.6, item 1).
6. **Debug mode on direct run:** `main.py` starts with `debug=True` and binds
   `0.0.0.0`.
7. **No upload authorization model** beyond filename sanitisation
   (`secure_filename`, extension and size checks on election passports); other
   upload routes rely on the admin guard alone.
8. **No audit trail for destructive admin actions** (account deletion, team
   deletion, transaction deletion) beyond database foreign keys.

These matter for Phase 3 because "preserve existing protections" cannot mean
"preserve CSRF" — the protection has to be designed, and the React client must
carry whatever mechanism is chosen.

### 9.9 Backend capability vs. integration need

The redesign needs a JSON surface over the domains the backend already owns.
Nothing below requires a second database, a second auth system or a rewrite;
the gap is transport, not data.

**Already fully supported by existing data and business logic** (needs read/write
endpoints that call the same models/services):

| Capability | Existing implementation |
| --- | --- |
| Public news, blogs (slug + views), events + categories, projects + filters, gallery, topics | `main.py` queries |
| Leaders and public election pages | `main.py`, `election_utils.election_phase` |
| Member directory counts, students, alumni, course/year filters | `main.py` |
| Learn library (published quizzes with resources) + authenticated file access | `main.py`, `QuizResource` |
| Newsletter subscription | `main.py` JSON route |
| Event RSVP with Turnstile, duplicate detection, member linking | `main.py` |
| Registration, login, logout, approval-pending, forgot/reset password | `auth.py` |
| Member profile, projects, digital ID, rewards, membership, notifications, events, sessions, quizzes, competitions, teams, elections | `member.py` |
| All admin CRUD, exports, scoring, finance, settings, moderation | `admin.py`, `election_admin.py` |
| Quiz authoring and AI generation | `quizmaster.py`, `quiz_tasks.py` |
| ID verification | `verification.py` |

**Requires new backend work** (no current equivalent):

| Gap | Why it is missing |
| --- | --- |
| A versioned JSON API namespace and response/error contract | No API blueprint exists |
| Session/CSRF strategy for a separate SPA origin | No CSRF layer, no CORS policy, `SameSite=Lax` only |
| Homepage statistics derived from data | Counters are hardcoded |
| Public-safe member/project serializers | Templates render ORM objects; no field allow-lists, and e-mail/phone/ID paths would leak if serialized naively |
| Media access control for uploads | Files are served by Flask static with no authorization |
| Disk-upload endpoints for the SPA (profile image, project image, passport, competition submission, quiz resource) | Uploads exist only as HTML form handling |
| Real-time delivery (if later phases want it) | Nothing exists; no websocket/SSE channel, no event bus |
| Machine-readable permission model | Guards are decorators plus inline role checks; no capability list to expose to a client |
| Pagination/filtering contract for every list | Only news and blogs paginate; others return whole sets |
| Idempotency/conflict handling for writes | None; repeated POSTs duplicate rows where no unique constraint exists |
| Automated test coverage for the above | The only test file is a manual RSVP script |

### 9.10 Phase 1 acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| Models and relationships mapped | Passed | §9.1 (59 models) |
| Routes, guards and permissions mapped | Passed | §9.2 (255 routes), §9.3, §9.4 |
| Business logic documented | Passed | §9.3, §9.5 |
| Authentication and account lifecycle documented | Passed | §9.4 |
| Existing endpoints and JSON surface enumerated | Passed | §9.5 (10 JSON routes) |
| Original content sources identified, real vs static separated | Passed | §9.6 (hero counters hardcoded) |
| Features supportable today vs requiring new endpoints identified | Passed | §9.9 |
| Completely read-only; no app start, no DDL, no DB connection, no super-admin creation | Passed | Static reading and `grep` only; no Python executed in the backend |
| No secrets or personal records read | Passed | Env **names** only; `config.py` and `.env` untouched; no database exists to query |
| Existing docs not duplicated | Passed | This section extends the audit instead of creating new files |

---

## 10. Pending sections

- ~~**Phase 2:** React route, feature and demo-data audit with the
  page-by-page data-source matrix.~~ — **Complete**, see §11.
- ~~**Phase 3:** API contract, session/CSRF/CORS design, permission matrix.~~ — **Complete**, see §12.
- ~~**Phase 4:** local environment (Flask + Vite proxy, development database, Turnstile keys).~~ — **Complete**, see §13.
- Phases 5–10: see the master plan and the dependency order in §12.17.
---

## 11. Phase 2 — React frontend, feature and demo-data audit

**Authorized scope:** complete React frontend, feature and demo-data audit only.

**Read-only confirmation.** This section was produced by static reading of
`new-website-design/src` (140 files, ~31,900 lines of TypeScript/TSX/CSS/JSON),
`package.json`, `vite.config.ts`, `public/`, `docs/` and `audit/`. Nothing was
installed, built or started; neither application was run; no browser, database
or network request was used; no application file was changed. The only files
written are this document and `INTEGRATION_PROGRESS.md`.

**Measured surface.**

| Measure | Value |
| --- | --- |
| Route elements declared in `src/App.tsx` | 111 (+ wildcard 404) |
| Public / auth / member / admin / quizmaster routes | 23 / 6 / 38 / 41 / 3 |
| Page modules under `src/pages` | 75 files (17 public, 8 auth, 24 member, 25 admin, 1 quizmaster) |
| UI primitives under `src/components/ui` | 25 |
| Data/feature modules | `data/demo.ts` 618 lines, `data/site.ts` 621, social store 1,110 + directory 375, search catalog 455, preferences 459, KIUTBOT 12 files |
| HTTP calls to the Flask backend | **0** — no `fetch`, `axios`, API base URL or `/api/` reference anywhere |
| Persistence | `localStorage` (5 keys) + `sessionStorage` (1 key) only |

### 11.1 Application architecture

- `App.tsx` mounts `BrowserRouter → AuthProvider → ToastProvider → TooltipProvider → KiutbotProvider`, then four layout branches:
  - `PublicLayout` — `SiteHeader` + `SiteFooter`, scroll-reveal observer, public day/night theme.
  - `AuthLayout` — split-screen auth frame.
  - `AppShell` — role-based dashboard shell (member, admin, quizmaster) with collapsible rail, global search, notification bell, appearance panel.
- Route protection is a single client component, `RequireRole`, which reads `user` from `AuthContext` and compares `user.role`. There is no server call, no redirect handshake and no token validation.
- There is **no data-access layer**: pages import records directly from `src/data/demo.ts` / `src/data/site.ts`, or read the `localStorage`-backed social store. No loading, error, retry, optimistic or cache state exists anywhere; every screen renders synchronously from an in-memory constant.
- The only genuine network integration is the KIUTBOT chat widget (Socket.IO to `fightforme.hudumabot.com`), which mirrors the widget already served by the Flask site.

### 11.2 Complete React feature inventory

Status legend: **Static** = renders fixed content; **Client** = interactive and works, but only in the browser; **Simulated** = accepts input and reports success without producing, storing or sending anything; **Local-persisted** = writes to `localStorage`.

| # | Feature | Screens | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Public marketing pages (home, about, topics, learn, leaders, events, news, blogs, gallery, contact, elections) | `/`, `/about`, `/topics`, `/learn`, `/leaders`, `/events`, `/news`, `/blogs`, `/gallery`, `/contact`, `/elections` | Static | All copy from `data/site.ts` |
| 2 | Homepage hero + scroll reveals + learning-path tabs | `/` | Client | Tab state only; no data |
| 3 | Event category filter, upcoming/past split | `/events` | Client | Filters the single static event |
| 4 | Blog list filter/search, article reader | `/blogs`, `/blogs/:slug` | Client | Filters 5 static articles |
| 5 | Gallery category filter | `/gallery` | Client | Always shows empty state — no items exist |
| 6 | Student / alumni directories with search, course and year filters | `/students`, `/alumni` | Client, empty | Filters operate on a deliberately empty list; `EmptyState` shown |
| 7 | Contact form | `/contact` | Simulated | Validates, waits 700 ms, toast "Message validated"; explicitly states nothing was sent or stored |
| 8 | Event RSVP form | `/events/:id/rsvp` | Simulated | Disabled because the event ended; "Preview form behaviour" enables validation only |
| 9 | Member digital-ID verification | `/verify-id`, `/verify-id/:memberId` | Static | Only `DC-2026-0014` "verifies", returning the fabricated member record |
| 10 | Public member profiles + follow/block/report | `/members/:username`, `/member/members/:username` | Local-persisted | Operates on 12 seeded demo people; privacy rules enforced in the browser only |
| 11 | Global search (pages, activities, members, settings) | `AppShell` | Client/Local-persisted | Catalog of destinations + `searchMembers` over seeded profiles |
| 12 | Login (form + demo-account buttons) | `/auth/login` | Simulated | Any password accepted; role inferred from the e-mail string or chosen button |
| 13 | Registration + approval-pending screen | `/auth/register`, `/auth/approval-pending` | Simulated | Values go to `sessionStorage`; pending state is in-memory and lost on reload |
| 14 | Forgot / reset password | `/auth/forgot-password`, `/auth/reset-password[/:token]` | Simulated | Timers + success panels; no token is issued or checked |
| 15 | Member dashboard | `/member` | Static demo | Identity, points, rank, quiz, event, sessions, rewards, team all from `demoMember` |
| 16 | Learning Hub (warmups, sessions, timetable, instructors) | `/member/learning`, `/member/quizzes/*`, `/member/sessions/*` | Static demo + one simulated submit | Quiz answers are collected client-side, then the result screen hardcodes **88 %** |
| 17 | Warmup result and leaderboard | `/member/quizzes/:id/result`, `/leaderboard` | Static demo | Hardcoded score/rows |
| 18 | Member events + RSVP list | `/member/events` | Static demo, one simulated RSVP | Local `useState` only |
| 19 | Member projects list + project form + edit | `/member/projects*` | Static demo, simulated save | 700 ms delay + toast; list is component state |
| 20 | Digital ID card, membership, rewards, points transactions | `/member/digital-id`, `/member/membership`, `/member/rewards`, `/member/rankings/points-transactions` | Static demo | All read `demoMember` |
| 21 | Rankings, teams, team requests | `/member/rankings`, `/member/teams` | Static demo, client accept/decline | Requests list is `useState(demoTeam.requests)` |
| 22 | Competitions hub, brief, leaderboard | `/member/competitions*` | Static demo | 4 fabricated competitions |
| 23 | Elections: positions, apply, vote, results | `/member/elections/*` | Static demo, simulated actions | Applications closed; ballot submission shows a success dialog and navigates to an empty results page |
| 24 | Notifications feed and detail | `/member/notifications*` | Static demo + client read state | 5 fabricated notifications; social notifications come from the local store |
| 25 | Member profile, edit profile, privacy, social graph, settings, password change | `/member/profile`, `/edit-profile`, `/profile-social`, `/settings`, `/change-password` | Local-persisted (profile/privacy/social) + simulated (password) | Profile fields keyed by the signed-in e-mail's directory entry |
| 26 | Appearance: 8 themes, 13 accents, text scale, motion, contrast | `AppearancePanel`, `/member/settings`, `/admin/settings` | Local-persisted | `kiut-preferences-v1`; applied as CSS custom properties |
| 27 | Admin dashboard (stat cards, pending queues, audit feed, charts) | `/admin` | Static demo | All figures derived from `demo.ts` arrays |
| 28 | Admin users: approve / reject, approval-mode select, registration link | `/admin/users` | Simulated | Mutates component state + toast; "no production account was changed" |
| 29 | Admin members, member detail, member IDs, scan ID | `/admin/members*`, `/admin/member-ids`, `/admin/scan-id` | Static demo, simulated actions | Scan screen fakes camera/ID lookup |
| 30 | Admin payments and finance (periods, categories, reports, charts) | `/admin/payments`, `/admin/financial*` | Static demo, simulated writes | Transactions/categories are `useState` copies of demo data |
| 31 | Admin rewards, trophies, leaderboards | `/admin/rewards*` | Static demo, simulated award | |
| 32 | Admin content CRUD (news, blogs, leaders, gallery, projects, technologies) | `/admin/news`, `/blogs`, `/leaders`, `/gallery`, `/projects`, `/technologies` | Static demo, simulated writes | Publish/archive/delete change local state only |
| 33 | Admin events, RSVP review, check-in | `/admin/events*`, `/admin/rsvps` | Static demo, simulated actions | Check-in toggles local rows |
| 34 | Admin sessions and session reports | `/admin/sessions*` | Static demo, simulated approve | |
| 35 | Admin elections, positions, election detail | `/admin/elections*` | Static demo, simulated state changes | |
| 36 | Admin competitions, submissions, judging, judges, leaderboard | `/admin/competitions*` | Static demo | Scores/ranks are constants |
| 37 | Admin quizzes, quiz detail, analytics, settings | `/admin/quizzes*` | Static demo + charts | Analytics computed from demo arrays |
| 38 | Admin teams and team detail | `/admin/teams*` | Static demo, simulated approve/suspend | |
| 39 | Admin messages, message batches, newsletter | `/admin/messages*`, `/admin/newsletter` | Static demo, simulated send/queue | Copy states no message was sent |
| 40 | Admin reports (social reports) and audit log | `/admin/reports` | Local-persisted store | Seeds empty; review action persists locally |
| 41 | Admin settings and admin profile | `/admin/settings`, `/admin/profile` | Static demo, simulated save | Reads `demoSettings` / `demoAdminProfile` |
| 42 | Quizmaster dashboard, create quiz, question builder | `/quizmaster*` | Static demo, simulated publish | Question list seeded from `demoQuizQuestions` |
| 43 | KIUTBOT chat widget | Global | **Real network** | Socket.IO to the existing bot service; session/profile in `localStorage` |
| 44 | Toast, tooltip, dialog, tabs, pagination, sorting, CSV export, copy-to-clipboard | Everywhere | Client | Real UI behaviour, no persistence beyond CSV download |

### 11.3 Demo / mock / static-data inventory

#### 11.3.1 `src/data/demo.ts` — fabricated operational records

Every export below is invented sample data. `DEMO_LABEL` is `"Club records."` and `DemoBadge`/`DemoNotice` now render **nothing**, so most screens no longer tell the visitor that the data is fictional.

| Export | Content | Used by |
| --- | --- | --- |
| `demoMember` | Amina Juma, `amina.juma@student.kiut.ac.tz`, `DC-2026-0014`, points 480, rank 4, team Byte Builders, membership, digital ID, 85 % profile completion | 14 member pages, 3 admin pages, VerifyId, social directory |
| `demoUsers` (12) | 12 fabricated people with `@student.kiut.ac.tz` addresses, courses, years, points; 3 unapproved, 1 quizmaster, 1 admin (Daniel Mushi, `admin@digitalclub.kiut.ac.tz`) | Admin users/members/IDs, social directory, search, messages |
| `demoNotifications` (5) | Competition result, room change, membership, team approval, quiz published | Member notifications, dashboard bell |
| `demoRewardHistory` (6), `demoTrophies` (4), `demoAdminTrophies` (5) | Points history and achievement definitions | Rewards, profile, rankings, activity feed |
| `demoMemberProjects` (2) | "Library Seat Finder", "Timetable Reminder Bot" | Member projects, admin projects, social profiles |
| `demoMemberEvents` (3), `demoAdminEvents` (3) | Events reused from the published AI Bootcamp plus two invented member events | Member events, admin events, dashboard |
| `demoSessions` (week + 4 sessions), `demoSessionsReports` (3) | Invented Week 06 timetable, instructors, attendance reports | Learning Hub, dashboard, admin sessions |
| `demoCompetitions` (4), `demoLeaderboard` (5), `demoCompetitionSubmissions` (4), `demoEnrollments` (4), `demoAdminJudges` (3) | Fabricated competitions, scores, ranks, judging panel | Competitions (member + admin), rankings |
| `demoElection`, `demoAdminElections`, `demoPositions` | Invented 2026/27 election, 4 positions, 7 candidates, manifestos, certificate of candidacy, second referendum | Member elections, public election detail, admin elections |
| `demoTeams` (5), `demoTeam` (members, requests, competitions) | Invented teams, ratings, join requests | Teams, rankings, dashboard |
| `demoRankings` (6) | Club leaderboard | Rankings, social learning summary |
| `demoQuizzes` (3), `demoQuizQuestions` (4), `demoQuizAnalytics` | Invented warmups; 4 real React questions; analytics with average scores | Learning Hub, quizmaster, admin quizzes |
| `demoPayments` (5), `demoFinancial` (period, categories, 5 transactions, 3 reports) | Invented membership payments and club accounts (TZS 420,000 revenue etc.) | Payments, finance, member membership |
| `demoRsvps` (6), `demoNewsletter`/`demoAdminNewsletters` (6), `demoMessages` (3) | Invented attendees, subscribers, campaigns | RSVP review, newsletter, messages |
| `demoTechnologies` (10), `demoGalleryItems` (4), `demoAdminBlogs` (6), `demoAdminNews` (2), `demoSponsors` (2) | Invented taxonomies, gallery entries, blog/news rows, sponsors | Content admin pages |
| `demoAdminStats` | 128 members, 34 active today, 3 pending, 2 events, 96 subscribers, 4 unread | Admin dashboard, admin events |
| `demoAuditLog` (4), `demoAdminProfile`, `demoSettings` | Invented audit trail, admin identity, club settings (fee TZS 20,000) | Admin dashboard, settings, reports |
| Derived aliases | `demoAdminUsers`, `demoAdminMembers`, `demoMemberIds` | Remainder of admin pages |

`demoAdminBlogs`, `demoAdminNews`, `demoNewsletter` and several titles/excerpts duplicate entries that also exist in `site.ts` and in the published site, so the same article appears as both "published content" and "admin row".

#### 11.3.2 `src/data/site.ts` — published-site content, not backend content

| Block | Source claimed | Reality to verify |
| --- | --- | --- |
| `SITE`, `HERO`, `ABOUT`, `BENEFITS`, `MEMBERSHIP_BENEFITS`, `LEADERSHIP_STRUCTURE`, `COURSES`, `YEARS`, `RSVP_REQUIREMENTS` | Club's public copy | Static; no backend model for most of it |
| `CLUB_FACTS` | Homepage counters `200+ / 50+ / 100+` | Explicitly flagged `needsConfirmation`; no real counts exist in the backend |
| `PROJECTS` (2) | Projects page | Metrics `1.2k downloads`, `4.8★`, `5 team members` are published claims, not database values; second project description is truncated |
| `EVENTS` (1) | AI Bootcamp (2026-03-30) | Matches the Flask `Event` row; `registered: 0` is invented |
| `COMPETITION_ARCHIVE` (3), `NEWS` (1), `ARTICLES` (5) | Published pages | Some article bodies are abridged or `null`; view counts come from the old site |
| `LEADERS` (12) | Leadership page | Real published names; no bios for most; `LEADERSHIP_STRUCTURE` copy |
| `TESTIMONIALS` (3), `PARTNERS` (6), `ACHIEVEMENTS` (3) | Original site copy | Unverified claims (Microsoft/Google/GitHub partnerships, "1st Place Tanzania Hackathon 2024", "three startups"); **no backend model** |
| `SKILL_CATEGORIES`, `TECHNOLOGIES`, `LEARNING_PATHS`, `TOPICS`, `POPULAR_TOPICS` | Original site copy | Counts such as "12+ languages", "15+ tools" are marketing figures, not records |

#### 11.3.3 Other fabricated or hardcoded state

| Item | Location | Kind |
| --- | --- | --- |
| 12 demo identities, including a super-admin e-mail and a member ID | `AuthContext` `demoAccounts`, `directory.ts` | Fake accounts; publicly reachable profiles |
| Demo sign-in buttons ("Member Demo", "Admin Demo") | `/auth/login` | Bypass any credential check |
| Unread counts `2`, `4`, `1` and Users badge `3` | `App.tsx` (`AppShell` props, `adminNav`) | Invented activity indicators |
| Activity matrix / streaks | `ActivityMatrix`, `social/directory.ts` | Derived from demo rewards and submissions |
| Social state (follows, requests, blocks, reports, notifications, audit) | `social/store.ts` (`kiut-social-v1`) | Fabricated interaction history, editable in the browser |
| Preferences (themes/accents) | `preferences.ts` (`kiut-preferences-v1`) | Legitimately client-side, but not tied to the account |
| Quiz result `score = 88` | `Warmups.tsx` | Hardcoded outcome |
| Member "ID valid through September 2028", "Member since October 2025" | `VerifyId.tsx` | Hardcoded strings |
| "Club records." label and hidden demo notices | `demo.ts`, `DemoBadge.tsx` | Disclosure removed from the UI |
| Screenshot artefacts | `new-website-design/audit/*.png`, root `*.png` | Unrelated to runtime, untracked |
| New club photography | `public/images/club/` (16 JPGs) | Untracked asset set used by public pages |

### 11.4 Public-page content audit

| Route | Content shown | Source | Genuine equivalent in Flask? |
| --- | --- | --- | --- |
| `/` | Hero, club intro, `200+/50+/100+`, 4 benefits, 6 learning paths, 2 projects, 3 competition archive rows, AI Bootcamp card, 2 testimonials, 3 articles | `site.ts` | **Partly.** `Project`, `Event`, `News`, `Blog`, `Leader`, `Technology`, `Topic` tables exist; counters, benefits, testimonials, learning paths and the competition archive have no table. Homepage project query in Flask omits `is_public` (Phase 1 §9.6) |
| `/about` | Mission, vision, values, 4 work areas, 5 FAQs, 3 achievements, 6 partners, leadership cards | `site.ts` | **No** for achievements, partners, FAQs, values; leadership yes (`Leader`/`Member`) |
| `/projects` | 2 projects with invented metrics | `site.ts` | **Partly.** `Project` model exists; the second record is truncated and metrics are not columns |
| `/topics` | 6 learning paths, 6 topics, 6 skill categories with counts, 12 technologies | `site.ts` | **Partly.** `Topic`/`Technology` tables exist; learning paths and counts do not |
| `/learn` | Learning paths, popular topics, session info | `site.ts` | **Partly.** Sessions exist (`Session`/week models); learning paths do not |
| `/leaders` | 12 named leaders with positions/programmes, leadership structure | `site.ts` | **Yes** — `Leader` installed from elections, `Member` identity |
| `/members` | Leadership cards, "Members (site figure) 200+", "Student/alumni split — Not supplied", course table with dashes | `site.ts` + placeholders | **Partly.** Real member counts could be computed; the page currently shows a fake figure and em dashes |
| `/students`, `/alumni` | Filters over an empty directory + `EmptyState` | none | Correct behaviour; needs a real public-directory endpoint |
| `/members/:username` | Fabricated profile for each of 12 seeded people: name, course, year, joined date, points, follower counts, follow/block/report; Amina Juma's profile additionally carries bio, tagline, skills, interests, GitHub/LinkedIn, projects, trophies and a reward timeline | social store seeded from `demoUsers` | **No.** No published-profile, profile-visibility, follow, block, report or activity models exist. This is the largest public surface of invented personal data. *(Re-checked in §12.1: only one of the twelve profiles is fully populated.)* |
| `/events` | 1 past event, 3 archive competition claims, RSVP explainer | `site.ts` | **Partly.** `Event` yes; `COMPETITION_ARCHIVE` no |
| `/events/:id/rsvp` | AI Bootcamp detail, disabled RSVP form, "truncated description" note | `site.ts` | **Yes** for the event; RSVP submission is disabled |
| `/news`, `/news/:id` | 1 archived hackathon notice | `site.ts` | **Yes** (`News`) |
| `/blogs`, `/blogs/:slug` | 5 articles, 1 with abridged body, view counts | `site.ts` | **Yes** (`Blog` with slug/body/views) |
| `/gallery` | Category filter + empty state, "no media published yet" | none | **Yes** (`Gallery` table) — page is simply unwired |
| `/contact` | Address, phone, e-mail, hours, meeting times, map links, validated-only form | `SITE` | Address/contact are also in `SystemSettings`; Flask `/contact` persists nothing |
| `/elections` | Process copy; aside says "No public election is currently published" | `site.ts` | **Yes** (`Election` models) |
| `/elections/:id` | **Invented 2026/27 election with status "voting", 4 positions, 7 named candidates and manifestos** | `demoElection` | Contradicts the page's own "no public election" aside; real elections exist in Flask |
| `/verify-id`, `/verify-id/:memberId` | Success only for `DC-2026-0014` → Amina Juma, "Active member", 2028 validity | `demoMember` | **Yes** (`Member` ID); Flask has an HTML `/verify-id/<id>` route |
| `/auth/*` | Login, register, approval, reset | `AuthContext` | **Yes** — Flask has real Flask-Login, approval, tokens and Turnstile |

**Public-content conclusions**

1. Public copy is largely legitimate published material, but it is **hardcoded** and will drift from the database.
2. Three public surfaces publish **fabricated people and records**: `/members/:username` (12 people), `/elections/1` (7 candidates, live status) and `/verify-id/DC-2026-0014` (identity verification of a non-existent member).
3. The homepage still asserts unverified club statistics while the same figure appears elsewhere as "site figure".
4. No public page reads the backend, so every visitor sees the same fixed snapshot regardless of what the club has published.

### 11.5 Member feature audit

| Area | Behaviour today | Data | Gap to make it real |
| --- | --- | --- | --- |
| Dashboard | Greets **Amina Juma** regardless of who signed in; points 480, rank #4, active quiz, next event, Week 06 sessions, rewards, team | `demoMember`, `demoQuizzes`, `demoMemberEvents`, `demoSessions`, `demoRewardHistory`, `demoTeam` | Aggregates endpoint keyed to the session user |
| Learning Hub / warmups | Lists 3 quizzes; take flow collects answers; result hardcodes 88 %; leaderboard static | `demoQuizzes`, `demoQuizQuestions`, `demoLeaderboard` | Attempt lifecycle, scoring, limits, leaderboard |
| Sessions | Timetable, instructors, report screen | `demoSessions`, `demoSessionsReports` | Session week, attendance, report submit/approve |
| Events | 3 events with RSVP status; "RSVP" mutates local state | `demoMemberEvents` | Member event list + RSVP endpoints |
| Projects | 2 projects; add/edit form validates and toasts, then discards | `demoMemberProjects` | Project CRUD with approval/visibility |
| Digital ID / membership / rewards / points | Static cards and history | `demoMember`, `demoRewardHistory`, `demoTrophies` | Membership validity, points ledger, ID issue |
| Rankings / teams | Leaderboard, team detail, join requests accept/decline in component state | `demoRankings`, `demoTeams`, `demoTeam` | Team membership, requests, approval, points |
| Competitions | 4 competitions, criteria, rewards, submissions, leaderboard | `demoCompetitions`, `demoLeaderboard` | Enrollment, submission, judging, results |
| Elections | Ballot with 4 positions; submission → success dialog → empty results | `demoElection` | Apply, eligibility, one-vote-per-position, results |
| Notifications | 5 fabricated items, local read state; social notifications from the store | `demoNotifications`, social store | Notification feed, unread count, mark-read |
| Profile / edit / privacy / social | Editable bio, skills, links; section visibility; follow/block/report | social store (12 seeded profiles) | Profile CRUD, visibility flags, social graph, moderation |
| Settings | Theme, accent, text scale, motion, contrast (local); account, notifications, security sections mostly copy; password change simulated | `preferences`, `AuthContext` | Preferences sync (optional), password change endpoint |
| Appearance / navigation | Fully working locally (8 themes, 13 accents, rail collapse) | `preferences`, `AppShell` | None required; keep client-side |

**Identity defect:** 14 modules under `src/pages/member/` read `demoMember` directly (22 source files overall, including three admin pages and `VerifyId`), so a signed-in visitor whose account is not Amina sees another person's points, ID and history. Only `Profile`, `EditProfile`, `ProfilePrivacy`, `ProfileSocial` and `Settings` resolve the viewer through the social store, and that resolution depends on the typed e-mail matching a demo directory entry.

### 11.6 Admin and quizmaster feature audit

| Group | Pages | Behaviour | Data |
| --- | --- | --- | --- |
| Overview | `/admin` | Stat cards, pending approvals, pending RSVPs, upcoming events, audit feed, chart placeholders | `demoAdminStats`, `demoUsers`, `demoRsvps`, `demoAdminEvents`, `demoAuditLog` |
| People | users, members, member detail, member IDs, scan ID, reports | Approve/reject, suspend, scan, review social report | `demoUsers`, `demoMemberIds`, `demoPayments`, social store |
| Programmes | events, rsvps, sessions, competitions, elections, quizzes, teams | Create/edit dialogs, approve, publish, check-in, judge, score | `demo*` arrays (component state) |
| Content | news, blogs, leaders, gallery, projects, technologies | Publish, archive, delete, reorder | `demo*` + `site.ts` `PROJECTS`/`LEADERS` |
| Operations | payments, finance, rewards, messages, newsletter | Record payment, add transaction/category, award trophy, queue campaign | `demoFinancial`, `demoPayments`, `demoNewsletter`, `demoMessages` |
| System | settings, profile | Save general/membership/channel settings | `demoSettings`, `demoAdminProfile` |
| Quizmaster | dashboard, create quiz, builder | Create quiz, add questions, publish | `demoQuizzes`, `demoQuizQuestions` |

All destructive or state-changing actions follow the same pattern: `ConfirmDialog` → `setRows(...)` → toast. Several explicitly disclose that nothing changed ("no production account was changed and no email was sent", "No newsletter was sent"), while others (publish, award, record payment, approve team) present an unqualified success.

### 11.7 React → Flask mapping matrix

| React feature | Flask route(s) today | Model(s) | Verdict |
| --- | --- | --- | --- |
| Public home content | `main.home` | `Project`, `Event`, `News`, `Blog`, `Leader`, `Technology`, `Topic` | Read endpoints needed; static copy stays editorial |
| Projects list/detail | `main.projects` (`/projects`) | `Project` | Add JSON, filter `is_public`; drop invented metrics |
| News / blog | `main.news`, `main.blog`, `main.blog_post` | `News`, `Blog` | JSON list/detail by slug |
| Events list/RSVP page | `main.events`, `main.event_rsvp` | `Event`, `EventRsvp` | JSON list/detail + RSVP submit (Turnstile) |
| Gallery | `main.gallery` | `Gallery` | JSON list |
| Leaders | `main.leaders` | `Leader`, `Member` | JSON list |
| Topics / technologies | `main.topics` (if present) | `Topic`, `Technology` | JSON list |
| Public member profiles | none (no public profile route) | `Member`, `User` | **New capability**: published-profile endpoint, visibility rules |
| Follow / block / report / social notifications | none | none | **New schema + endpoints** |
| Digital ID verification | `verification.verify_id` (HTML) | `Member` | JSON verify endpoint, rate limiting |
| Login / logout | `auth.login`, `auth.logout` (form + Turnstile) | `User` | JSON/session endpoints, CSRF, Turnstile |
| Register / approval | `auth.register`, admin approval routes | `User`, `Member` | JSON register + approval; keep admin review |
| Forgot / reset password | `auth.forgot_password`, reset routes | `User` reset tokens | JSON request/confirm with real tokens |
| Current user / session probe | none | `User`, `Member` | **New**: `/api/me` |
| Member dashboard | member dashboard HTML routes | `Member`, points, events, quizzes | Aggregate JSON endpoint |
| Warmups | member quiz routes, `quizmaster` routes | `Quiz`, `QuizQuestion`, `QuizAttempt`, `QuizAnswer` | Attempt start/answer/submit/score/leaderboard JSON |
| Sessions / reports | member + admin session routes | `SessionWeek`, `Session`, `SessionReport` | List + report submit/approve JSON |
| Competitions | member + admin competition routes | `Competition`, `CompetitionCriteria`, `CompetitionSubmission`, `CompetitionEnrollment`, `CompetitionJudge`, `CompetitionReward` | Brief, enroll, submit, judge, leaderboard JSON |
| Elections | `election_member`, `election_admin`, `main.elections` | `Election`, `ElectionPosition`, `ElectionCandidate`, `ElectionVote` | Apply/vote/results JSON with phase guards |
| Teams | member + admin team routes | `Team`, `TeamMember`, `TeamRequest` | Create/join/approve/suspend JSON |
| Projects (member) | `member.projects`, project form routes | `Project` | CRUD JSON with `is_public` |
| Membership / payments | member membership, `admin.payments` | `MembershipPayment`, `Member` | Status JSON; admin record payment |
| Points / rewards / trophies | member rewards, `admin.rewards` | point ledger, `Trophy`, `MemberTrophy` | History + award endpoints |
| Notifications | member notifications routes | `Notification` (if present) | Feed + unread count JSON |
| Admin users/members | `admin.users`, `admin.members` | `User`, `Member` | List/detail/approve/deactivate JSON |
| Admin content CRUD | `admin.news/blogs/gallery/leaders/projects/technologies` | content models | Full CRUD JSON + uploads |
| Admin finance | `admin.finance*` | finance period/category/transaction models | CRUD, period close, report JSON |
| Admin messages / newsletter | `admin.messages`, newsletter routes | message batch, subscriber models | List, send (Beem/SMTP), consent state |
| Admin settings | `admin.settings` | `SystemSettings` | Read/write JSON (secrets never returned) |
| Quizmaster builder | `quizmaster` routes | quiz models | Create/edit/publish JSON |
| Global search | none | mixed | New search endpoint (members scoped by visibility) |
| Themes / appearance | none | none | Keep `localStorage`; optional server sync later |
| KIUTBOT | external widget in `base.html` | none | Keep as-is; do not proxy secrets |

### 11.8 Authentication and session integration findings

| # | Finding | Evidence | Impact |
| --- | --- | --- | --- |
| A1 | Login accepts **any** e-mail and **any** non-empty password | `AuthContext.login` ignores the password and always returns `{ok:true}` after validation | No authentication exists |
| A2 | Role is chosen by the caller or guessed from the e-mail substring (`admin`, `quiz`) | `login(email, password, role)`; `Login.tsx` resolved role | Privilege escalation by typing `admin@…` |
| A3 | Two one-click demo buttons sign in as member/admin | `Login.tsx` demo section | Trivial admin access |
| A4 | Session is `localStorage['kiut-demo-session']`, a plain JSON object | `AuthContext` | Editable role/identity; no expiry, no signature |
| A5 | Route guards are client-side `RequireRole` | `App.tsx` | Dashboard shells are reachable by editing storage; **all data is client-side anyway** |
| A6 | Registration writes to `sessionStorage['kiut-demo-registration']`; approval state is in-memory | `AuthContext.register`, `ApprovalPending` | Reload loses the registration; no account is created |
| A7 | Password reset never issues or validates a token | `ForgotPassword`, `ResetPassword` timers | Cannot be migrated; must be replaced |
| A8 | No Turnstile, CSRF token, cookie, `credentials`, CORS or session probe | no `fetch` in the app | Complete auth layer must be built, not adapted |
| A9 | Signed-in identity is not used for member data | 14 member-page modules import `demoMember` (22 files overall) | Dashboard shows another member's records |
| A10 | Social viewer resolution maps e-mail → seeded directory; unknown e-mails yield no profile | `viewerFromUser`, `findMemberByEmail` | Arbitrary typed accounts cannot use profile/social features |
| A11 | Social state, read flags and preferences persist only in `localStorage` | `kiut-social-v1`, `kiut-preferences-v1` | Not authoritative, not shared across devices, not server-auditable |
| A12 | Notification and nav badge counts are constants | `App.tsx` `unread={2,4,1}`, `badge: 3` | Fake activity signals to real users |
| A13 | Demo data is labelled inconsistently; `DemoNotice` renders null | `DemoBadge.tsx` | Users may believe fabricated records are real |
| A14 | KIUTBOT chat identity is an anonymous random session in `localStorage` | `features/kiutbot/session.ts` | Unrelated to club accounts; acceptable if kept separate |

### 11.9 Missing backend capabilities

Ordered by dependency, not by UI area.

1. **JSON API foundation** — versioned prefix, consistent JSON error contract, CORS/same-origin policy, CSRF strategy, request validation, pagination/sorting conventions, rate limiting. Phase 1 confirmed none exists.
2. **Session authentication API** — `login`, `logout`, `session/me`, `register`, `approval status`, `password forget/confirm`, Turnstile verification, remember-me. No token or CORS layer exists today.
3. **Current-user context** — identity, role (`member`/`quizmaster`/`admin`), member record, membership validity, digital ID, profile completion, unread counts.
4. **Public read endpoints** — projects (public only), news, blog by slug, events, gallery, leaders, topics, technologies, public election summary, site settings/contact, **real** club counts (members, projects, events).
5. **Member profile & privacy** — published-profile lookup, section visibility, profile update, avatar/banner upload.
6. **Social graph** — follow, follow requests, blocks, reports, follower/following lists, social notifications, member search scoped by visibility. **No model exists in the backend.**
7. **Member aggregates** — dashboard summary (points, rank, next event, active quiz, current week, team).
8. **Quiz attempts** — start, answer, submit, score, attempt limits, leaderboard, quizmaster authoring/publish.
9. **Competitions** — brief, eligibility, enrollment, submission, judging criteria/scores, leaderboard, rewards.
10. **Elections** — apply, eligibility, ballot, one-vote-per-position enforcement, results, admin phase control.
11. **Teams** — create, join request, approve/reject, membership, suspend, team leaderboard.
12. **Sessions** — timetable by week, instructor list, attendance, session-report submit/approve.
13. **Events & RSVP** — member event list with RSVP state, RSVP submit (public, Turnstile), approval, check-in.
14. **Projects (member)** — create/edit/submit, visibility, admin approval, public projection.
15. **Membership & payments** — status, history, admin record payment, receipts.
16. **Points, rewards, trophies** — ledger read, manual award, trophy definitions and issuance.
17. **Notifications** — feed, unread count, mark read; server-generated.
18. **Admin CRUD** — users, members, member IDs, news, blogs, gallery, leaders, projects, technologies, events, RSVPs, sessions, competitions, quizzes, teams, payments, finance periods/categories/transactions, messages, newsletter, settings.
19. **Finance** — periods, categories, transactions, closing, reports.
20. **Messaging & newsletter** — campaign creation, audience resolution, delivery via Beem/SMTP, consent/unsubscribe state.
21. **File uploads & protected serving** — profile photos, ID documents, gallery media, election passports; authenticated `/uploads` route (Phase 1 §9.8: uploads are currently public).
22. **Digital ID verification** — public JSON verify with rate limiting and minimal fields.
23. **Global search** — destinations are client-side; member/content search needs a scoped endpoint.
24. **Audit log** — no admin audit-log endpoint was identified in Phase 1; the React admin expects one.
25. **Settings** — read/write `SystemSettings` without ever returning secrets; feature flags used by the UI.

### 11.10 Recommended implementation priorities and dependencies

| Priority | Work | Depends on | Why |
| --- | --- | --- | --- |
| P0 | Phase 3 contract: endpoints, payloads, error codes, permission matrix, CSRF/session decision | Phase 1 + this audit | Every later phase consumes it |
| P0 | Phase 4 local environment (Flask + Vite proxy, Turnstile test keys or bypass flag, seeded **development-only** DB) | P0 contract | Nothing can be verified without it |
| P1 | Phase 5 API foundation (blueprint, JSON errors, CSRF, rate limit, auth decorators) | Phase 4 | Blocks all endpoints |
| P1 | Phase 6 auth: real login/logout/session/register/approval/reset; delete demo accounts and demo buttons | Phase 5 | Removes A1–A8; every screen depends on identity |
| P1 | `/api/me` + member aggregates; replace `demoMember` references with session user | Phase 6 | Fixes A9; highest user-visible correctness bug |
| P2 | Phase 7 public reads: projects, news, blog, events, gallery, leaders, topics, real counters | Phase 5 | Replaces `site.ts` data, removes fake stats; low risk, high visibility |
| P2 | Public profile + digital-ID verification endpoints; retire `/members/*` demo profiles | Phase 6, 7 | Removes the largest public fabricated-data surface |
| P3 | Phase 8 member reads: dashboard, learning, sessions, events, projects, rewards, rankings, teams, competitions, elections, notifications | Phase 6, 7 | Read-only first, so UI can be wired without write risk |
| P3 | Member writes: RSVP, project submit, team request, session report, quiz attempt, election apply/vote, profile/privacy | Phase 8 | Requires CSRF + authorization per action |
| P4 | Phase 9 admin reads, then writes, then finance/messaging/newsletter | Phase 8 | Admin writes are the riskiest surface |
| P5 | Phase 10 media uploads and authenticated serving, social graph, real-time notifications, search, audit log | Phase 9 | New schema and infrastructure |
| P6 | Cleanup: delete `data/demo.ts`, remove demo aliases, restore visible "demo" labelling only where genuine, fix badge counts, replace `DemoBadge` stubs | each phase as it lands | Prevents mock data returning |

**Sequencing rules for later phases**

- No endpoint may fall back to `demo.ts`; a missing record must render an empty state, never a fabricated one.
- Identity must come from the server session, never from `localStorage`, an e-mail substring or a route argument.
- Public pages must not expose member e-mail addresses, phone numbers, payment data or unpublished profiles.
- The React visual design, route structure and component library are preserved; only the data layer changes.
- Write the real counts before publishing any figure that is currently `200+ / 50+ / 100+`.

### 11.11 Phase 2 acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| Entire React application inspected (pages, components, contexts, hooks, features, data) | Passed | §11.1–11.6; 140 files, 111 routes, 75 page modules |
| Every demo account, mock API, sample record, placeholder statistic and simulated activity identified | Passed | §11.3 — 40+ `demo.ts` exports, demo accounts, badge counts, hardcoded score |
| Public pages audited, not only dashboards | Passed | §11.4 — all 23 public routes |
| Each displayed item traced to its source and compared with a backend equivalent | Passed | §11.4, §11.7 |
| Forms, buttons, filters, charts and interactions classified functional/simulated/static | Passed | §11.2 (44 features), §11.5, §11.6 |
| Every React feature mapped to a Flask route, model, endpoint or missing capability | Passed | §11.7, §11.9 |
| Authentication assumptions, storage dependence and demo credentials identified | Passed | §11.8 (A1–A14) |
| Missing backend capabilities listed | Passed | §11.9 (25 items) |
| Priorities and dependencies recommended | Passed | §11.10 |
| Read-only; no app started, no dependency installed, no database touched, no application code changed | Passed | Static reads and `grep` only |
| Pre-existing modified and untracked files preserved | Passed | Baseline re-verified after writing (100 modified, 1 deleted, same untracked set plus the two docs) |
| No secrets or personal records exposed | Passed | Only fabricated demo identities named; no `.env`, `config.py`, database or upload inspected |
| Prior Phase 0/Phase 1 findings preserved | Passed | §1–§9 unchanged; §10 updated |
---

## 12. Phase 3 — API contract and integration architecture proposal

**Authorized scope:** architecture and documentation only. Design a JSON
contract over the existing Flask application, the session/CSRF strategy, the
public/member/admin separation, the demo-data replacement path, and the
dependency order.

**Read-only confirmation.** This section was produced by static reading plus a
targeted re-check of Phase 2's highest-impact claims. No endpoint was created,
no Flask or React file was modified, no dependency was installed, no database
was connected or created, neither application was started, and no Git
configuration, index or commit was touched. The only writes are this document
and `INTEGRATION_PROGRESS.md`.

### 12.1 Verification of the Phase 2 claims this phase depends on

Before designing against the Phase 2 findings, three of its largest claims were
re-read in the source. Two hold exactly as written; one was too broad and has
been corrected in §11.4.

| Claim (Phase 2) | Re-checked in | Verdict |
| --- | --- | --- |
| `/members/:username` publishes fabricated personal profiles to signed-out visitors | `App.tsx:357-358` (route inside `PublicLayout`), `pages/public/MemberProfile.tsx`, `features/social/directory.ts`, `features/social/store.ts:342-377` (`accessProfile`) | **Confirmed.** The route is public. `seedProfiles()` builds one profile per row of `demoUsers` (12 people). `accessProfile` grants `fullAccess` when `visibility === 'public'`, so a guest sees the sections that profile enables. |
| 14 member page modules use `demoMember` (Amina Juma) instead of the signed-in user | `code_search "demoMember"` across `src` | **Confirmed, and understated.** 22 distinct source files reference `demoMember`; 14 modules under `pages/member/` plus `pages/admin/Members.tsx`, `pages/admin/Projects.tsx`, `pages/admin/MemberIds.tsx` and `pages/public/VerifyId.tsx` use it as the identity or as the only member record. `AuthContext` also seeds the fallback session from it. |
| A public page publishes an invented election | `pages/public/Elections.tsx`, `data/demo.ts:359+` | **Confirmed with a distinction that matters for the contract.** `/elections` renders an explicit "No public elections published" empty state plus editorial process copy; the fabricated record is published by the **detail route** `/elections/:id` for `id === "1"`, which renders `demoElection` with status `voting`, 4 positions and 7 named candidates and manifestos. Both behaviours must be replaced: the detail route must 404 unless a real election is published. |

**Correction applied to §11.4.** The `/members/:username` row previously read as
though every seeded profile carried a full biography. In fact only Amina Juma's
profile is populated (`bio`, `tagline`, `skills`, `interests`, GitHub, LinkedIn,
projects, trophies, reward history). The other eleven profiles carry
`displayName`, `course`, `year`, `joined`, `points`, a "Joined KIUT Digital Club"
activity entry, and seeded follower/following counts. That is still fabricated
personal data published without consent, so the finding and its severity stand;
the description is now exact.

**Consequences for this contract.** (a) There is no public-profile model in the
backend, so a public profile surface cannot simply be "wired up" — it needs an
explicit product decision (D1/D2 in §12.18). (b) The identity defect is larger
than one dashboard: every member read endpoint in §12.9 is specified to derive
identity from the session, never from a route or body parameter. (c) Public
content endpoints must be able to return an empty set so that pages render their
existing empty states rather than any fabricated record.

### 12.2 Architecture principles (binding for later phases)

1. **One application, one database, one auth system.** The Flask app, its
   SQLAlchemy models and its Flask-Login session remain authoritative. The React
   app becomes a client of that application. No second database, no parallel
   identity store, no JWT/session duplication, no ORM replacement.
2. **Transport is added, behaviour is not re-implemented.** New endpoints call
   the same models, helpers and services the Jinja routes already use
   (`Member.get_total_points`, `Competition.get_allowed_years`, election phase
   helpers, `election_utils`, quiz scoring, membership date derivation). Business
   rules stay in one place; the API is a projection layer.
3. **The server owns identity and authorization.** The React `RequireRole` guard
   becomes a navigation convenience only. Every endpoint enforces its own
   authorization; the client never sends "who I am" or "what role I have".
4. **Reads before writes, public before private, member before admin.** This
   order is reflected in §12.17 and keeps every phase shippable and verifiable.
5. **No demo fallback, ever.** An endpoint that has no record returns an empty
   collection or a 404. A page with no data renders its existing empty state. A
   missing capability renders "not available yet", never a fabricated success.
6. **Field allow-lists, not model dumps.** Every serializer is written by naming
   the fields it exposes. `to_dict()` over an ORM object is prohibited for
   anything that touches `User`, `Member`, `MembershipPayment`, `MemberId` or
   election candidates.
7. **The existing public site keeps working.** `main_bp`, `auth_bp`, `member_bp`,
   `admin_bp`, `quizmaster_bp` and their templates remain intact and reachable
   while the SPA is integrated. Nothing in this contract deletes a Jinja route.
8. **The React design system is preserved.** Only the data layer and the demo
   seeds change; routes, layouts, tokens, components and copy stay as they are
   except where a placeholder must become a real value or an empty state.

### 12.3 Topology and origin decision

| Option | Assessment |
| --- | --- |
| **A. Same origin, reverse proxy — chosen.** One host serves `/api/v1/*` to Flask and everything else to the built React app. | Cookies are first-party, `SameSite=Lax/Strict` works, no CORS preflight for normal use, no third-party-cookie dependency, CSRF model is simple. In development, Vite proxies `/api` to `127.0.0.1:5051` (implemented in Phase 4, §13.6). |
| B. API on `api.example.com`, SPA on `www.example.com`. | Requires `SameSite=None; Secure`, an explicit CORS allow-list with credentials, and a much larger CSRF/Origin surface. Only justified if a future mobile client or third-party integration needs it. |
| C. Static SPA on a CDN bucket with token auth. | Reintroduces a second auth mechanism and contradicts the master plan. Rejected. |

**Decision:** the SPA and the API are served from a single origin. The Flask app
gains a `/api/v1` blueprint that returns JSON; the existing HTML blueprints stay
on their current paths. In production a reverse proxy routes `/api/` and
`/static/` to the WSGI app and everything else to `index.html` (SPA fallback with
a real 404 for unknown `/api` paths). In development, `vite.config.ts` proxies
`/api`, `/healthz` and `/static/uploads` to the Flask dev server; no CORS is
configured because no cross-origin request exists. This proxy is now in place
(§13.6); it affects the dev server only and changes no build output.

This decision is what makes §12.4 possible without weakening anything.

### 12.4 Session and CSRF strategy

**Session.** Unchanged mechanism: Flask-Login's signed session cookie. The React
client must be configured with `credentials: 'include'` on every request and
must never read, store or forward the cookie itself.

| Setting | Current state | Required state |
| --- | --- | --- |
| `SECRET_KEY` | Silent fallback `dev-secret-key-change-in-production` | App **refuses to start** when unset outside an explicit `FLASK_ENV=development`; no fallback in production. Tracked as prerequisite for Phase 5. |
| `SESSION_COOKIE_HTTPONLY` | Flask default `True` | Keep `True`. |
| `SESSION_COOKIE_SECURE` | Never set | `True` in production (HTTPS only), `False` in local development. |
| `SESSION_COOKIE_SAMESITE` | `Lax` default | `Lax` stays. All state-changing requests are `POST/PATCH/DELETE` with a CSRF header, so `Lax` is sufficient and does not break the SPA. |
| `SESSION_COOKIE_NAME` | Flask default | Set explicitly (`kiut_session`) so old and new cookies are distinguishable during cutover. |
| `PERMANENT_SESSION_LIFETIME` / remember | 30 days both | Keep 30 days; "remember me" stays opt-in on the login form. |
| Session fixation | `login_user` regenerates nothing by hand | Flask signs a new session on login; add an explicit `session.clear()` before `login_user` if Phase 6 finds state carried over. |

**Why not JWT.** A token in `localStorage` is exactly the model Phase 2 found
insecure (A4). It cannot be revoked on deactivation, it duplicates the identity
store, and it would leave the existing HTML panels with two auth truths. The
cookie session is the mechanism the backend already enforces on every request
(`enforce_active_accounts`, `login_required`, `admin_required`), so it is the
one to expose.

**CSRF.** Phase 1 §9.8 established that `flask-wtf` is installed but
`CSRFProtect` is never initialised and no template carries a token. That means
CSRF cannot be "preserved"; it must be introduced, and introduced in a way that
does not break the HTML panels.

Proposed mechanism: **double-submit cookie with a server-side session binding**
(the pattern Flask-WTF already implements, used explicitly rather than
implicitly).

1. **Approved application-wide rollout (D5).** CSRF cannot be "preserved"; it
   must be introduced without breaking any existing form. Phase 5 therefore
   ships two coupled changes in one reviewed release: (a) `CSRFProtect(app)`
   with `WTF_CSRF_CHECK_DEFAULT = False`, `/api/v1` protected explicitly, and
   the token endpoint below; (b) every existing Jinja form gains
   `{{ csrf_token() }}` and only then is protection enabled for the HTML
   blueprints. Between the two, the HTML panels keep their current behaviour.
   No `@csrf.exempt` is granted to a state-changing route; the inventory of
   form POSTs (login, register, password reset, RSVP, profile, admin CRUD,
   election, competition, session, team) is the smoke list for the cutover.
2. `GET /api/v1/auth/csrf` returns `{"csrf_token": "..."}` for the current
   session (creating one if needed). It is safe, cacheable as `no-store`, and
   callable while signed out, because login and registration are themselves
   CSRF-protected.
3. Every non-safe request (`POST`, `PUT`, `PATCH`, `DELETE`) must send the token
   in `X-CSRF-Token`. Missing or invalid: `403 CSRF_TOKEN_INVALID`. Safe methods
   (`GET`, `HEAD`, `OPTIONS`) are exempt.
4. The React API client fetches the token once per session, keeps it in memory,
   attaches it to every mutation, and refreshes it once on a `403
   CSRF_TOKEN_INVALID` before failing the action. It is never written to
   `localStorage`.
5. Origin checking is enabled as a second, independent gate:
   `Origin`/`Referer` must match the app origin for state-changing requests.
   This closes the "token leaked into a page that can read it" gap and costs
   nothing on a same-origin deployment.
6. Turnstile stays mandatory where it already is (login, register, RSVP,
   password reset). The API forwards `turnstile_token` to the existing
   `_verify_turnstile` helper; when the secret is unconfigured the request is
   refused, exactly as today. Local development uses Cloudflare's published test
   keys, not a bypass flag in production code (D6).

**Cutover risk.** Enabling `CSRFProtect` globally would immediately break every
existing HTML form (they post without tokens), including admin workflows — which
is exactly why D5 requires the staged but application-wide rollout above rather
than a permanent API-only split. Phase 5 must ship the token endpoint, the client
interceptor and the template tokens as one change, and must demonstrate that
every previously working form POST still works afterwards. Until that lands,
`flask-wtf` remains installed but uninitialised: CSRF protection is **absent**,
and Phase 4 did not simulate or disable anything to hide that.

### 12.5 Authorization model

Roles remain the three existing strings: `student` (the panel "member"),
`quizmaster`, `admin`. No permission table is introduced.

| Layer | Anonymous | Member (`student`) | Quizmaster | Admin |
| --- | --- | --- | --- | --- |
| Public content reads | yes | yes | yes | yes |
| Public member directory / published profile | yes, allow-listed fields only | yes | yes | yes |
| ID verification | yes, minimal fields, rate-limited | yes | yes | yes |
| `/api/v1/me` | 401 | own record | own record | own record |
| Member panel endpoints | 401 | own records only | own records | own records |
| Quiz authoring endpoints | 401 | 403 | yes | yes |
| Admin endpoints | 401 | 403 | 403 | yes |
| Uploaded-file reads | per-file policy (§12.13) | per-file policy | per-file policy | all |

Decorators: `api_login_required` (401 `AUTH_REQUIRED`), `api_role_required(*roles)`
(403 `FORBIDDEN`), and per-resource ownership checks inside the handler that
compare the session `User.member` to the record's `member_id`. Ownership is
never inferred from a request parameter.

**Profile-completion gate.** `member_bp.before_request` forces a member with an
incomplete profile (missing course or phone) to `/member/edit-profile` before any
other member page. Reusing that hook for the API would turn every read into a
redirect/409 for a newly approved member. The contract therefore does **not**
reuse it: `/api/v1/me` reports `profile_completion.required` and
`profile_completion.missing_fields`, member **reads** work regardless, and only
the writes that depend on the missing data (election application, competition
enrolment, digital ID) return `409 PROFILE_INCOMPLETE` with a `missing` list.

### 12.6 Response, error and pagination conventions

**Success envelope.** Single resource:

```json
{ "data": { "...": "..." }, "meta": { "request_id": "..." } }
```

Collection:

```json
{ "data": [ ... ], "meta": { "page": 1, "per_page": 20, "total": 137, "pages": 7, "request_id": "..." } }
```

Errors always use the same shape, whatever the status:

```json
{ "error": { "code": "FORBIDDEN", "message": "You do not have access to this election.",
             "fields": { "position_id": "Position is not part of this election." },
             "request_id": "..." } }
```

Rules: `code` is a stable `UPPER_SNAKE` string the client may branch on;
`message` is safe for humans and never contains a stack trace, SQL, file path or
account existence hint; `fields` appears only for validation errors; `request_id`
is echoed into server logs. Dates are ISO-8601 UTC with `Z`; the UI converts to
`Africa/Nairobi`. IDs are integers, except elections which also expose a slug.
Money is an integer in TZS plus a string `formatted` field. `null` means "known
to be absent"; absent keys mean "not exposed to you".

**Pagination.** `?page=1&per_page=20`, `per_page` capped at 100 (admin lists may
request 100, public lists 50). Every list endpoint in §12.9 is paginated,
including those whose Jinja page renders everything: this is a contract
requirement, not an optional extra, because several tables are unbounded.
Sorting is `?sort=-created_at` with a per-endpoint allow-list of sortable
columns; unknown values are ignored rather than erroring.

**Filtering.** Documented per endpoint, applied with bound parameters. Free-text
`?q=` is trimmed, length-capped at 100 chars and matched with `ilike` on named
columns only. No raw SQL, no column name taken from the query string.

**Status codes.** 200 read, 201 create, 202 accepted (email/queue), 204 delete or
logout, 400 malformed, 401 unauthenticated, 403 authenticated but not allowed,
404 absent or not visible, 409 state conflict, 422 validation (Flask-WTF style),
428 precondition (not used initially), 429 rate limited, 500 unhandled.
**404 is used instead of 403 for resources the caller may not know exist**
(unpublished elections, other members' drafts, private profiles).

**Idempotency.** Writes that can be double-submitted (RSVP, vote, enrolment,
submission, payment recording) rely on the database's existing unique
constraints and return `409 ALREADY_EXISTS` rather than creating a duplicate.
Where no constraint exists, Phase 8/9 adds one rather than adding an
idempotency-key store; that is the smaller change and it fixes the underlying
data problem.

### 12.7 Public, member and admin data separation

Three explicit tiers, enforced by path prefix, guard and serializer:

| Tier | Prefix | Guard | Serializer |
| --- | --- | --- | --- |
| Public | `/api/v1/public/*` | none, rate-limited | `*_public` allow-list |
| Member | `/api/v1/member/*` | session + owner | self view (may include own e-mail/phone) |
| Staff | `/api/v1/admin/*`, `/api/v1/quizmaster/*` | session + role | admin view (may include e-mail; never password hash, never reset tokens) |
| Auth | `/api/v1/auth/*`, `/api/v1/me` | mixed | minimal identity |

Field policy, by data class:

| Data | Public | Member (own) | Member (other) | Admin |
| --- | --- | --- | --- | --- |
| Full name | published profile only, opt-in | yes | published profile only | yes |
| E-mail | **never** | yes | **never** | yes |
| Phone | **never** | yes | **never** | yes |
| Member number (`DC-…`) | verification result only | yes | no | yes |
| Course / year / status | published profile + directory | yes | published profile | yes |
| Points, rank | published profile only if the member enabled it | yes | no | yes |
| Membership validity | boolean only, if enabled | yes | no | yes |
| Payment amounts, receipts | **never** | own history | **never** | yes |
| Digital ID image | **never** directly | via authenticated route | **never** | yes |
| Private projects | **never** | yes | no | yes |
| Election ballot / votes | never (aggregate results only) | own vote state | never | yes |
| Admin notes, reports, audit | never | never | never | yes |

Two existing leaks are closed by construction, not by copying current
behaviour: `/api/v1/member/search` returns display name, course, year and public
slug only (the Jinja search returns e-mails today), and uploaded member images
are no longer reachable by guessing `/static/uploads/<path>` (§12.13).

### 12.8 Content that stays editorial

Not everything on the public site is a database record, and the contract does
not pretend otherwise. `site.ts` splits into three categories with different
fates:

| Category | Examples | Fate |
| --- | --- | --- |
| Real records that must come from the API | news, blogs, events, projects, gallery, leaders, topics, technologies, elections, member counts | Replaced by `/api/v1/public/*`; the `site.ts` copy is deleted per page as it is wired. |
| Editorial copy with no model | mission, vision, values, FAQs, benefits, learning paths, leadership structure, RSVP rules, contact copy | Stays in the React source as editorial content. It is allowed to be static because it is not a claim about a record. |
| Unverified claims | `200+/50+/100+`,partner logos, "1st Place Tanzania Hackathon 2024", project metrics `1.2k downloads`/`4.8★`, "three startups" | Not wired and not repeated as data. Either replaced by a real count (§12.9 `public/stats`) or removed. This is decision D4. |

`CLUB_FACTS` is the clearest example: because it is already flagged
`needsConfirmation`, the integration must not promote it to an API. `/stats`
returns counts computed from `Member`, `Project`, `Event`; the UI shows those or
shows nothing.
### 12.9 Endpoint contract

Namespace `/api/v1`. Every endpoint below also accepts the common error set
(`401 AUTH_REQUIRED`, `403 CSRF_TOKEN_INVALID`, `429 RATE_LIMITED`,
`500 INTERNAL_ERROR`) unless stated; only endpoint-specific codes are listed.
"Existing logic" names the handler whose queries and rules the endpoint must
reuse rather than re-implement.

#### 12.9.1 Authentication and session

| # | Method & path | Auth | Request | Response | Errors | Existing logic |
| --- | --- | --- | --- | --- | --- | --- |
| AU1 | `GET /auth/csrf` | none | – | `200 {data:{csrf_token}}`, `Cache-Control: no-store` | – | new |
| AU2 | `POST /auth/login` | none | `{email, password, remember?, turnstile_token}` | `200 {data:{user, csrf_token}}` + session cookie | `401 INVALID_CREDENTIALS`, `403 ACCOUNT_INACTIVE`, `422 VALIDATION_ERROR`, `400 TURNSTILE_FAILED` | `auth.login` (active-account check, Turnstile, `login_user(remember=…)`, digital-ID generation) |
| AU3 | `POST /auth/logout` | session | – | `204` | – | `auth.logout` |
| AU4 | `POST /auth/register` | none | `{full_name, email, password, course, year, phone, turnstile_token}` | `201 {data:{user:{id, email, status:'approved', can_sign_in:true}}}` — account active immediately | `409 EMAIL_IN_USE`, `422 VALIDATION_ERROR` (course/year from the fixed lists), `400 TURNSTILE_FAILED` | `auth.register` |
| AU5 | `GET /auth/approval-status` | session or none+`email` | – | `200 {data:{status:'approved'|'rejected'}}` (kept for old clients) | `404 NOT_FOUND` | `auth.register` (no approval queue) |
| AU6 | `POST /auth/password/forgot` | none | `{email, turnstile_token}` | `202 {data:{accepted:true}}` — same body whether or not the account exists | `400 TURNSTILE_FAILED` | `auth.forgot_password` (SMTP/SMS send, serializer token) |
| AU7 | `POST /auth/password/reset` | none | `{token, password}` | `204` | `400 TOKEN_INVALID`, `400 TOKEN_EXPIRED`, `422 VALIDATION_ERROR` | `auth.reset_password`, `verify_password_reset_token` |
| AU8 | `POST /me/password` | session | `{current_password, new_password}` | `204`, other sessions invalidated | `400 CURRENT_PASSWORD_INVALID`, `422 VALIDATION_ERROR` | `member.change_password` |

**Change request — approval gate removed.** Registration no longer waits for an
administrator: `create_student_account()` sets `is_approved=True` and the
account is usable immediately. `login_block()` now refuses only
`ACCOUNT_INACTIVE`; the legacy `is_approved` column is retained (no migration)
but is not consulted when signing in, so pre-existing accounts are not locked
out. `account_status()` reports `approved` or `inactive` only. Administrators
keep `/admin/users` (recent registrations and account status),
`/admin/members` (account information, deactivate/restore via
`toggle_member_active`). No approval endpoints remain.

Lifecycle: **register → account active (`approved`) → sign in immediately →
member dashboard (session persists on refresh) → administrator may deactivate →
deactivated account is refused with `403 ACCOUNT_INACTIVE` → administrator may
restore.**

#### 12.9.2 Current user context

| # | Method & path | Auth | Response | Notes |
| --- | --- | --- | --- | --- |
| ME1 | `GET /me` | session | `{data:{user:{id,full_name,email,role,status}, member:{id,member_number,course,year,status,points,rank,tier}, membership:{state,valid_until}, digital_id:{status,issued_at}, profile_completion:{percent,required,missing_fields}, capabilities:[...]}, meta:{unread_notifications}}` | The single replacement for `kiut-demo-session`. `capabilities` is a derived string list (`member.panel`, `quizmaster.author`, `admin.panel`, `elections.vote`, `competitions.submit`, …) so the SPA can hide actions it cannot perform, while the server still enforces them. |

`role` uses the backend's strings; the client maps `student` + `admin.panel`
absence to the member experience. Quizmaster and admin both carry member
identity because every panel user has a `Member` row.

#### 12.9.3 Public content

All public endpoints are `GET`, unauthenticated, cached briefly
(`Cache-Control: public, max-age=60`) except `/stats` and `/verify-id`, which are
`no-store`.

| # | Path | Query | Response (fields are the allow-list) | Errors | Existing logic |
| --- | --- | --- | --- | --- | --- |
| PU1 | `/public/home` | – | `{stats, featured_projects[≤3 public], upcoming_events[≤3], latest_news[≤3], latest_blog[≤3]}` | – | `main.index`/`home`, corrected to filter `Project.is_public` |
| PU2 | `/public/stats` | – | `{members:{total,students,alumni}, projects:{total,published}, events:{total,upcoming}, competitions:{total}, sessions:{total}}` | – | new aggregate over `Member`, `Project`, `Event` |
| PU3 | `/public/news` | `page,per_page,q,from,to` | list of `{id,title,summary,image_url,published_at}` | – | `main.news` |
| PU4 | `/public/news/{id}` | – | `{id,title,body,summary,image_url,published_at,author:{display_name}}` | `404 NOT_FOUND` | `main.news_detail` |
| PU5 | `/public/blogs` | `page,per_page,q,tag` | list of `{id,slug,title,excerpt,cover_url,published_at,views}` | – | `main.blogs` |
| PU6 | `/public/blogs/{slug}` | – | `{id,slug,title,body_html_sanitised,author,cover_url,published_at,views}` | `404 NOT_FOUND` | `main.blog_post` (view counter increment stays server-side) |
| PU7 | `/public/events` | `page,per_page,scope=upcoming\|past,category` | list of `{id,title,slug,starts_at,ends_at,venue,category,cover_url,rsvp:{state,opens_at,closes_at}}` | – | `main.events` |
| PU8 | `/public/events/{id}` | – | single event + `{description,requirements[],capacity,registered_count}` | `404 NOT_FOUND` | `main.event_rsvp` |
| PU9 | `POST /public/events/{id}/rsvp` | none | `{full_name,email,phone,student_id?,turnstile_token}` → `201 {data:{rsvp:{status:'pending'}}}` | `400 TURNSTILE_FAILED`, `409 ALREADY_REGISTERED`, `409 RSVP_CLOSED`, `422 VALIDATION_ERROR` | `main.event_rsvp` POST |
| PU10 | `/public/projects` | `page,per_page,q,technology,year,course` | list of `{id,title,summary,cover_url,technologies[],owner_display_name,year}` — **public only** | – | `main.projects`, `Project.is_public` |
| PU11 | `/public/projects/{id}` | – | `{id,title,description,cover_url,technologies[],links[],owner_display_name,created_at}` | `404 NOT_FOUND` (also for private) | `main.projects` detail |
| PU12 | `/public/gallery` | `page,per_page,category` | list of `{id,title,image_url,thumb_url,category,captured_at}` | – | `main.gallery` |
| PU13 | `/public/leaders` | – | list of `{id,name,position,programme,year,photo_url,bio,term}` | – | `main.leaders` |
| PU14 | `/public/topics` | – | `{topics:[{id,name,slug,description}], technologies:[{id,name,category,icon}]}` | – | `main.topics` |
| PU15 | `/public/elections` | – | list of elections where status ∉ {draft, cancelled}: `{id,slug,title,term,status,applications:{open,close},voting:{open,close},positions_count}` | – | `main.public_elections`, `election_utils.election_phase` |
| PU16 | `/public/elections/{id_or_slug}` | – | `{…, description, eligibility, positions:[{id,title,seats,description,candidates:[{id,display_name,year,manifesto,photo_url}]}]}` — candidates only in the phases the existing helper allows | `404 NOT_FOUND` | `main.public_election_detail` |
| PU17 | `/public/members` | `page,per_page,q,course,year,status=student\|alumni` | list of `{public_slug,display_name,course,year,status,avatar_url}` — **no e-mail, phone, member number or points** | – | `main.members`, `main.students`, `main.alumni` |
| PU18 | `/public/members/{public_slug}` | – | published profile: `{public_slug,display_name,course,year,status,joined_year,bio,skills[],interests[],links{},avatar_url,projects[],achievements[],learning{}}` — sections omitted when not published | `404 NOT_FOUND` | **new**; no model today (D1) |
| PU19 | `/public/verify-id/{member_number}` | – | `{valid:true, member:{display_name,course,year,status,member_since,id_valid_until}}` or `{valid:false}` with `200` | `429 RATE_LIMITED` | `verification.verify_id`, narrowed |
| PU20 | `/public/contact` | – | `{address,phone,email,hours,social{},meeting_times}` from `SystemSettings` (allow-list) | – | `main.contact` |
| PU21 | `POST /public/newsletter/subscribe` | none | `{email, name?}` | `201 {data:{subscribed:true}}`; `409 ALREADY_SUBSCRIBED` | `main.newsletter_subscribe` |
| PU22 | `/public/search` | `q, types=news,blogs,events,projects,members, limit` | grouped results with `type`, `id`, `title`, `url` | `422 QUERY_TOO_SHORT` | new, over existing models; member results obey PU17 fields |
| PU23 | `/public/site` | – | `{club_name, tagline, social{}, feature_flags{}}` — no secrets, no fee table | – | `SystemSettings` |

PU19 must not become an identity oracle: it returns a display name, course and
year only, never e-mail, phone, member number echo beyond the queried value, photo
or payment state, and it is rate-limited per IP (20/min) with a uniform response
shape.

#### 12.9.4 Member panel — reads

All require a session. Identity always resolves from `current_user.member`; no
endpoint accepts a `member_id` for "self".

| # | Path | Response | Notes / existing logic |
| --- | --- | --- | --- |
| MD1 | `GET /member/dashboard` | `{greeting_name, membership, points, rank, tier, next_tier, profile_completion, active_quiz, next_event, current_week, recent_rewards[≤5], team, unread}` | Replaces 12 separate `demoMember` reads; uses `member.dashboard` queries |
| MD2 | `GET /member/profile` | full self profile incl. e-mail and phone | `member.profile` |
| MD3 | `PATCH /member/profile` | updated profile | `member.edit_profile`; validates course/year against fixed lists |
| MD4 | `POST /member/profile/avatar` | `{avatar_url}` | multipart, §12.13 |
| MD5 | `PUT /member/profile/privacy` | updated visibility map | only if D1/D2 approved; otherwise omitted |
| MD6 | `GET /member/digital-id` | `{member_number, display_name, course, year, status, issued_at, valid_until, verify_url, qr_payload}` | `member.digital_id` |
| MD7 | `POST /member/digital-id/regenerate` | `202 {data:{status:'queued'}}` | `member.regenerate_id`; server-side file generation |
| MD8 | `GET /member/digital-id/image` | `?side=front\|back` → `image/png`, `no-store` | replaces direct `/static/uploads` access |
| MD9 | `GET /member/membership` | `{state, valid_from, valid_until, fee, payments:[{id,amount,method,period,recorded_at,receipt_url}]}` | `member.membership`, `MembershipPayment` |
| MD10 | `GET /member/rewards` | `{points, rank, tier, next_trophy:{name,points_required}, trophies[]}` | `member.rewards` |
| MD11 | `GET /member/rewards/history` | paginated ledger `{id,points,reason,type,awarded_at}` | `RewardTransaction` |
| MD12 | `GET /member/projects` | list, own only, incl. unpublished | `member.projects` |
| MD13 | `POST /member/projects` | `201` project | `member.projects_add` |
| MD14 | `GET/PATCH/DELETE /member/projects/{id}` | own project | ownership check; `404` for others' ids |
| MD15 | `POST /member/projects/{id}/submit` | `202` for review | existing publish/approval rule |
| MD16 | `GET /member/events` | list with own RSVP state | `member.events` |
| MD17 | `POST /member/events/{id}/rsvp` | `201`/`200` | paid-only events check membership, §9.3 |
| MD18 | `DELETE /member/events/{id}/rsvp` | `204` | within the window only, `409 RSVP_CLOSED` |
| MD19 | `GET /member/sessions/timetable` | `?week=` weeks + sessions | `member.sessions_timetable` |
| MD20 | `GET /member/sessions/instructors` | instructors + upcoming sessions | `member.session_instructors` |
| MD21 | `POST /member/sessions/{id}/report` | `201` report `{status:'pending_approval'}` | `member.session_report` |
| MD22 | `GET /member/rankings` | paginated leaderboard `{rank,name,course,year,points,warmups,competitions,team}` | `member.rankings`; names may be abbreviated per D8 |
| MD23 | `GET /member/rankings/points-transactions` | own ledger view | `member.points_transactions` |
| MD24 | `GET /member/notifications` | `?unread=true` paginated | `member.notifications` |
| MD25 | `GET /member/notifications/{id}` | single, marks nothing | `member.notification_detail` |
| MD26 | `POST /member/notifications/{id}/read`, `POST /member/notifications/read-all` | `204` | new write, idempotent |
| MD27 | `GET /member/quizzes` | available warmups with attempt state | `member.quizzes` |
| MD28 | `GET /member/quizzes/{id}` | questions **without** correct answers | `member.quiz_detail` |
| MD29 | `POST /member/quizzes/{id}/attempts` | `201 {attempt_id, expires_at}` | `member.quiz_start`; one attempt per member/quiz |
| MD30 | `PATCH /member/attempts/{id}/answers` | `{answers:[{question_id,choice_id}]}` → saved count | `member.quiz_answer` |
| MD31 | `POST /member/attempts/{id}/violation` | `{kind}` → `{remaining}` or `409 ATTEMPT_SUBMITTED` | `member.quiz_violation` |
| MD32 | `POST /member/attempts/{id}/submit` | `{answers[]}` → scored result | `member.quiz_submit`; server scores, never the client |
| MD33 | `GET /member/attempts/{id}` | result incl. per-question review when allowed | `member.quiz_result` |
| MD34 | `GET /member/quizzes/{id}/leaderboard` | ranked attempts | `member.quiz_leaderboard` |
| MD35 | `GET /member/competitions` | `?level=weekly\|monthly` | `member.competitions`, eligibility flags per competition |
| MD36 | `GET /member/competitions/{id}` | brief, criteria, rewards, own submission, eligibility `{allowed,reasons[]}` | `member.competition_detail` |
| MD37 | `POST /member/competitions/{id}/enroll` | `201` enrolment | `member.competition_enroll`, years + membership rules |
| MD38 | `POST /member/competitions/{id}/submissions` | multipart submission | `member.competition_submit` |
| MD39 | `GET /member/competitions/{id}/leaderboard` | ranked submissions (judged only) | `member.competition_leaderboard` |
| MD40 | `GET /member/elections` | elections visible to this member + `{can_apply,can_vote,has_voted,my_candidacies[]}` | `election_member._visible_elections` |
| MD41 | `GET /member/elections/{id}` | positions, own candidacy, ballot when in voting phase | `member.election_detail` |
| MD42 | `POST /member/elections/{id}/apply/{position_id}` | `201` candidacy (manifesto, passport upload) | `member.election_apply`; window + eligibility |
| MD43 | `POST /member/elections/{id}/withdraw/{candidate_id}` | `204` | `member.election_withdraw` |
| MD44 | `POST /member/elections/{id}/vote` | `{votes:[{position_id,candidate_id}]}` → `201 {receipt}` | `member.election_vote`; one per position enforced by unique constraint |
| MD45 | `GET /member/elections/{id}/results` | results when phase allows | `member.election_results` |
| MD46 | `GET /member/teams`, `GET /member/teams/{id}` | team, members, requests, competitions | `member.teams` |
| MD47 | `POST /member/teams/{id}/requests` | `201` join request | `member.teams` POST |
| MD48 | `POST /member/teams/{id}/requests/{request_id}/decision` | leader only, `{decision:'approve'\|'reject'}` | `member.team_request_decision` |
| MD49 | `DELETE /member/teams/{id}/members/{member_id}` | `204` | leader or admin |
| MD50 | `GET /member/search` | `q` → `{member_id,display_name,course,year,avatar_url}` only | replaces `member.members_search`, removes e-mail |
| MD51 | `GET /member/messages` | inbox, paginated | admin messaging models |

#### 12.9.5 Member panel — writes summary

Listed separately because they are the risk surface: MD17/18 (RSVP), MD13–15
(projects), MD21 (session report), MD29–32 (quiz attempt), MD37/38 (competition),
MD42–44 (election), MD47–49 (team), MD3/MD4 (profile). Each requires a session,
the CSRF header, an ownership check and a state check. Each returns `409` with a
specific code when the window has closed rather than a generic failure. Quiz
scoring, election tallying, points accrual and eligibility are computed on the
server and never accepted from the request body.

#### 12.9.6 Admin

All `/admin/*` endpoints require `role == 'admin'` and the CSRF header. They are
grouped here by resource rather than enumerated one row per CRUD verb; each group
supports the verbs shown, with the same envelope, pagination and error contract
as §12.6. Every write must reuse the corresponding `admin.py` /
`election_admin.py` handler's validation.

| Group | Endpoints | Verbs | Notes |
| --- | --- | --- | --- |
| Overview | `/admin/overview` | GET | real counts, pending approvals, pending RSVPs, upcoming events, recent audit (empty until AD-AUDIT exists) |
| Users | `/admin/users`, `/admin/users/{id}` | GET | e-mail visible, hash never; filters by status/role |
| Approvals | `/admin/users/{id}/approve`, `/reject`, `/admin/users/approval-mode` | POST | same rules as `approve_user`/`reject_user`; sends the existing notification |
| Members | `/admin/members`, `/admin/members/{id}`, `/members/{id}/promote`, `/quizmaster`, `/quizmaster/revoke`, `/demote`, `/toggle-active`, `/delete` | GET/POST | destructive actions require `confirm: true` in the body and are audited when AD-AUDIT lands |
| Member IDs | `/admin/member-ids`, `/admin/member-ids/{member_id}`, `/export` | GET | PDF/CSV remain file streams |
| Rewards | `/admin/rewards/scan`, `/lookup`, `/search`, `/members/{id}/points`, `/members/{id}/history`, `/trophies` CRUD | GET/POST | append-only ledger; no point edits, only new transactions |
| Payments | `/admin/payments` CRUD, `/export` | GET/POST/PATCH/DELETE | membership state derives from dates, never stored as a flag |
| Finance | `/admin/finance/periods`, `/periods/{id}/close\|reopen`, `/categories`, `/transactions`, `/reports`, `/export` | full CRUD | closed periods reject writes (`409 PERIOD_CLOSED`) |
| Events | `/admin/events` CRUD, `/admin/events/{id}/check-in`, `/check-in/{rsvp_id}/undo` | full CRUD | check-in is idempotent |
| RSVPs | `/admin/rsvps`, `/bulk-approve`, `/bulk-reject`, `/bulk-reset` | GET/POST | bulk returns per-row results, not a blanket success |
| Sessions | `/admin/sessions/weeks` CRUD, `/weeks/{id}/publish\|archive`, `/sessions` CRUD, `/reports/{id}/approve\|reject` | full CRUD | report approval is what awards points |
| Competitions | `/admin/competitions` CRUD, criteria, judges, rewards, sponsors, submissions, scoring, notices, finalize, enrollments, disqualify, leaderboard | full CRUD | judging writes `CompetitionScore`; finalize is one-way |
| Teams | `/admin/teams` CRUD, `/assign`, `/remove`, `/leader`, `/decisions`, `/suspend` | GET/POST/DELETE | |
| Quizzes | `/admin/quizzes`, `/{id}`, `/approve`, `/publish`, `/unpublish`, `/delete`, `/analytics` | GET/POST | published quizzes are immutable except unpublish |
| Elections | `/admin/elections` CRUD, `/positions` CRUD, `/{id}/applications`, `/candidates/{id}/review`, `/{id}/results`, `/{id}/finalize` | full CRUD | phase transitions validated; finalize writes `Leader` rows in one transaction |
| Content | `/admin/news`, `/blogs`, `/gallery`, `/leaders`, `/projects`, `/technologies`, `/topics` | full CRUD | `multipart` for media; public serializers reused for preview |
| Notifications | `/admin/notifications`, `/recipients-preview`, `/{id}` | GET/POST | audience resolved server-side; sending is `202` and queued |
| Newsletter | `/admin/newsletter`, `/{id}/send`, `/export`, `/{id}/toggle` | GET/POST | consent/unsubscribe honoured; `202` queued |
| Contacts | `/admin/contact-messages` | GET/PATCH | only if contact persistence is approved (D9) |
| Settings | `/admin/settings` | GET/PATCH | secrets never returned; write is a diff of whitelisted keys |
| Audit | `/admin/audit` | GET | returns empty list + `meta.available:false` until the model exists |
| Search | `/admin/search` | GET | members, content, payments by reference |

#### 12.9.7 Quizmaster

`/quizmaster/quizzes` (list, create), `/{id}` (read/update), `/{id}/generate`
(POST, `202` queued), `/{id}/builder` (questions CRUD), `/{id}/publish`,
`/{id}/delete`. Guard: `role in {quizmaster, admin}`. AI generation reuses
`quiz_generate` and never returns the provider key.
### 12.10 Key payload shapes

`GET /api/v1/me` (signed-in member):

```json
{
  "data": {
    "user": { "id": 14, "full_name": "…", "email": "…", "role": "student", "status": "active" },
    "member": { "id": 21, "member_number": "DC-2026-0014", "course": "…", "year": "…",
                "status": "student", "points": 480, "rank": 4, "tier": "…" },
    "membership": { "state": "valid", "valid_until": "2026-09-30" },
    "digital_id": { "status": "active", "issued_at": "2025-10-04" },
    "profile_completion": { "percent": 85, "required": false, "missing_fields": ["linkedin"] },
    "capabilities": ["member.panel", "elections.vote", "competitions.submit"]
  },
  "meta": { "unread_notifications": 2, "request_id": "…" }
}
```

`GET /api/v1/member/dashboard` (abridged):

```json
{
  "data": {
    "greeting_name": "…",
    "membership": { "state": "valid", "valid_until": "2026-09-30" },
    "points": { "total": 480, "rank": 4, "tier": "…", "next_tier": { "name": "…", "at": 800 } },
    "profile_completion": { "percent": 85, "missing_fields": ["linkedin"] },
    "active_quiz": { "id": 3, "title": "…", "expires_at": "…" },
    "next_event": { "id": 9, "title": "…", "starts_at": "…", "rsvp": "approved" },
    "current_week": { "id": 6, "label": "Week 06", "published_at": "…" },
    "recent_rewards": [ { "id": 41, "points": 25, "reason": "…", "awarded_at": "…" } ],
    "team": { "id": 2, "name": "…", "role": "member" },
    "unread_notifications": 2
  },
  "meta": { "request_id": "…" }
}
```

Empty state, not a fallback:

```json
{ "data": { "active_quiz": null, "next_event": null, "team": null, "recent_rewards": [] },
  "meta": { "request_id": "…" } }
```

Validation error:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Check the highlighted fields.",
             "fields": { "course": "Choose one of the listed programmes.",
                         "year": "Choose one of the listed years." },
             "request_id": "…" } }
```

State conflict:

```json
{ "error": { "code": "VOTING_CLOSED", "message": "Voting for this election has closed.",
             "request_id": "…" } }
```

### 12.11 Replacing demo data: per-surface path

The replacement rule is uniform: **wire the page to its endpoint, delete that
page's demo import, and let the existing empty state handle "no records".** No
page keeps a fallback. The order below is the order in which the React imports
can be deleted safely.

| React surface | Demo source today | Replacement | Deletion step |
| --- | --- | --- | --- |
| `/`, `/news`, `/blogs`, `/events`, `/projects`, `/gallery`, `/leaders`, `/topics` | `site.ts` arrays (`PROJECTS`, `NEWS`, `ARTICLES`, `EVENTS`, `LEADERS`, `COMPETITION_ARCHIVE`) | PU1–PU14 | Delete each array as its page is wired; keep editorial copy |
| `/members`, `/students`, `/alumni` counts | `site.ts` "200+" and em dashes | PU2 + PU17 | Replace figures with returned counts; if zero, render the existing empty state |
| `/members/:username` | `directory.ts` seeded from 12 `demoUsers`, `store.ts` profiles | PU18 (D1 approved: public profiles, allow-listed fields only) | Wire to the public profile endpoint; delete the demo directory and store. Private contact, payment, sensitive membership and administrative fields are never serialised; **no demo profiles may remain reachable** |
| `/elections`, `/elections/:id` | `demoElection` | PU15/PU16 | Detail route 404s unless a real published election exists |
| `/verify-id(/:id)` | `demoMember` | PU19 | Unknown ID returns `valid:false`; no name is shown |
| `/auth/*` | `AuthContext` demo accounts, demo buttons, `kiut-demo-session` | AU1–AU8, ME1 | Delete `demoAccounts`, both demo buttons and the storage key |
| Every `/member/*` page reading `demoMember` | `demoMember` | MD1–MD51, identity from ME1 | 22 files; fixed in dependency order: dashboard → profile/digital ID/membership/rewards → events → projects → sessions → rankings/teams → competitions → elections → notifications → search |
| `/member/learning`, warmups | `demoQuizzes`, hardcoded `88` | MD27–MD34 | Remove the constant; show the real scored result |
| `/member/notifications`, nav badges | `demoNotifications`, `unread={2,4,1}` | MD24–MD26, ME1 `meta.unread_notifications` | Badge value comes from the response or is hidden |
| `/member/elections` | `demoElection` ballot | MD40–MD45 | Ballot only inside the voting window |
| Admin pages | `demoAdminStats`, `demoUsers`, `demoMemberIds`, `demoFinancial`, `demoSettings`, `demoAuditLog`, … | `/admin/*` groups | Admin reads first; writes after member writes; each page loses its `demo*` import in the same commit |
| Quizmaster pages | `demoQuizzes`, `demoQuizQuestions` | `/quizmaster/*` | |
| Social layer | `social/store.ts` (`kiut-social-v1`) | Social endpoints (D2 approved, Phase 10) | Until those endpoints exist the social UI stays hidden behind a capability and the local store is deleted, not left running locally |
| `App.tsx` badge constants | `2/4/1`, `badge: 3` | ME1, `/admin/overview` | |
| `DemoBadge`/`DemoNotice` stubs | `DemoBadge.tsx` | removed with the last demo import | While any demo data remains, the label must be **visible**, not null |

`data/demo.ts` is deleted only when `grep` finds no importer (P6). Until then it
is the last file standing, not a fallback source.

### 12.12 Evaluation of the 25 proposed capabilities

Requirement 3 asked for a judgement, not a checklist. Each Phase 2 gap is
classified **Necessary**, **Conditional** (needs a business decision first) or
**Defer** (real feature, not required for this integration), with the reason.

| # | Capability | Verdict | Justification |
| --- | --- | --- | --- |
| 1 | JSON API foundation | **Necessary** | Every other item depends on it; nothing else can be built safely without the error contract, CSRF and rate limiting. |
| 2 | Session authentication API | **Necessary** | The React login cannot be honest without it; A1–A8 are the worst findings in the audit. |
| 3 | Current-user context (`/me`) | **Necessary** | Fixes A9/MD1 and removes the last reason to read a role from storage. |
| 4 | Public read endpoints | **Necessary**, with a scope cut | Content reads are necessary. No endpoint may serve `200+` as a fact. D4 (approved) keeps the three published headline figures as static editorial copy labelled unverified, so PU2 is not required for them; any other count shown must be computed or removed. |
| 5 | Member profile & privacy | **Necessary** (D1 approved) | Editing one's own profile (MD3) and public profiles are both in scope. All profiles may be publicly accessible, but only explicitly approved public fields are exposed; private contact details, payment records, sensitive membership information and internal administrative data are never serialised. The public identifier (`public_slug` or member number) is chosen in Phase 7. |
| 6 | Social graph (follow/block/report/lists) | **Necessary** (D2 approved; Phase 10) | In the overall integration scope, including following, follow requests, blocking, reporting and social notifications. Still a new subsystem (roughly 6 tables, moderation duties, deletion obligations, notification fan-out) and deliberately **not** part of Phase 4; until Phase 10 the UI stays hidden rather than faked. |
| 7 | Member aggregates | **Necessary** | Replaces 12 demo reads per dashboard with one authorized aggregate. |
| 8 | Quiz attempts | **Necessary** | The warmup flow is a core member feature and the hardcoded `88` is a fabricated success state. |
| 9 | Competitions | **Necessary** | Existing models and rules; the React hub is otherwise unusable. |
| 10 | Elections | **Necessary** | Existing models; also required to remove the invented public election. |
| 11 | Teams | **Necessary** | Existing models and request/approval rules. |
| 12 | Sessions | **Necessary** | Existing timetable and report/approval flow; the React timetable is already built. |
| 13 | Events & RSVP | **Necessary** | Public RSVP exists with Turnstile and duplicate detection; the API exposes the same rules. |
| 14 | Member projects | **Necessary** | CRUD plus visibility; needed to stop the admin project views from reading a demo array. |
| 15 | Membership & payments | **Necessary** (read + admin record) | Membership validity drives eligibility across features; receipts stay private. |
| 16 | Points, rewards, trophies | **Necessary** (read + admin award) | The ledger is the source of rank; manual award is the only write that exists today. |
| 17 | Notifications | **Necessary**, reduced | Feed, unread count and mark-read are necessary; real-time push is not. Server-generated only; social notifications are in scope under D2 and arrive with the social phase, not in Phase 4. |
| 18 | Admin CRUD | **Necessary** | Every admin page already exists and currently mutates arrays. Doing member work without admin work leaves the club unable to publish the content the public pages will read. |
| 19 | Finance | **Necessary if the finance pages ship** | The models exist. If the club does not use them, the pages should be hidden rather than backed by an empty shell. Recommendation: keep, because payments and reports already feed membership decisions. |
| 20 | Messaging & newsletter | **Conditional** | Listing and audience preview are necessary; **sending** depends on a verified provider configuration and a consent/unsubscribe record. Until then send returns `503 CHANNEL_NOT_CONFIGURED` rather than a fake success. |
| 21 | Uploads & protected serving | **Necessary** | Without it, profile photos and election passports either leak through `/static/uploads` or cannot be uploaded at all. |
| 22 | Digital-ID verification | **Necessary**, hardened | Already public in the Flask app; must be narrowed to a minimal field set and rate-limited. |
| 23 | Global search | **Necessary**, reduced scope | Content + member search is genuinely useful and cheap over existing tables. It must not become the e-mail leak that `member.members_search` is today. |
| 24 | Audit log | **Defer** | No model exists, and inventing one in the read path would repeat the demo problem. `/admin/audit` returns `meta.available:false`; the page shows "not recorded yet". Add when destructive admin writes land. |
| 25 | Settings | **Necessary** (read) / **Necessary** (admin write) | Public contact/settings drive real pages; admin write must whitelist keys and never return secrets. |

Nothing in the 25 is "necessary because the UI has a page". Where the backend has
no concept, the recommendation is to hide or defer the feature, not to build a
parallel data model in this integration.

### 12.13 Upload security

Uploads exist today as HTML form handling with `secure_filename` plus extension
and size checks on election passports, served by Flask's static handler with no
authorization. The contract replaces that path rather than extending it.

| Concern | Rule |
| --- | --- |
| Transport | `multipart/form-data` on the specific endpoint; CSRF header still required. |
| Allow-list | Images: `jpg/jpeg/png/webp`; documents: `pdf` only where a document is legitimate (competition submission, election passport). Never trust `Content-Type`; verify magic bytes. |
| Size | 5 MB images, 10 MB documents, enforced before write; 413 `FILE_TOO_LARGE`. |
| Filename | Server-generated (`<uuid>.<ext>`); the client filename is stored only as metadata for display. |
| Storage | Outside the web root (`instance/uploads/<tier>/<uuid>.<ext>`), never under `/static`. |
| Serving | `GET /api/v1/files/{id}` resolves the record, checks the tier policy (public media / owner / admin), then sends the file with `Content-Disposition: inline` only for images, `X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-store` for personal images. |
| Ownership | The upload row records `owner_member_id` and `visibility`; the endpoint never takes a path from the client. |
| Images | Strip EXIF (GPS) on personal photos; never re-encode election passports beyond validation. |
| Malware | Phase 10 decision: ClamAV sidecar or provider scanning; until then documents are accepted only from approved members and served as attachments. |
| Deletion | Deleting a project/candidacy removes its file; account deletion removes all owned files (D12). |
| Existing files | The tracked and untracked `/static/uploads` content is not moved during the integration; new uploads use the new path, and the old path is closed to personal images when the SPA goes live (D7). |

### 12.14 Personal-data protection

- E-mail and phone appear in exactly three responses: `ME1`, `MD2` (own profile),
  and admin user/member detail. Never in lists, search, public payloads or logs.
- Member numbers are returned only to their owner, to admins, and as the result
  of an explicit verification query.
- Payment amounts and receipts are owner/admin only; no aggregate per-member
  figure is exposed publicly.
- Election ballots are secret: results are aggregate per position; `ElectionVote`
  rows are never serialized. Admin sees counts, not voter identity, unless the
  schema already stores it for audit (it does — `voter_id` — so the admin
  serializer returns counts only).
- Logging: a request log line records method, path, status, duration and
  `request_id`; it never records bodies, query strings containing e-mail, cookies
  or tokens. Error handlers log the exception class, not the form data.
- Export endpoints (CSV/PDF) stay admin-only, keep their existing guards, and are
  rate-limited.
- Deletion and retention are unresolved (D12); no endpoint invents a "deleted"
  state before that decision.

### 12.15 Validation, rate limiting and pagination defaults

**Validation.** Server-side only, with the same rules the backend already
enforces: fixed course/year lists from `member_requirements.py`, password
policy as currently implemented in `auth.register`, e-mail format, phone format,
date windows for elections/RSVP/competitions, and membership eligibility. Client
validation stays as UX and is never the check.

**Rate limits** (per IP unless signed in, then per user; exceeded →
`429 RATE_LIMITED` with `Retry-After`):

| Scope | Limit |
| --- | --- |
| `POST /auth/login`, `/auth/register` | 10/min/IP, 5/min per e-mail |
| `POST /auth/password/forgot` | 3/10 min per e-mail, 10/hour/IP |
| `POST /public/events/{id}/rsvp` | 10/hour/IP |
| `GET /public/verify-id/*` | 20/min/IP |
| `GET /public/search`, `/public/members` | 60/min/IP |
| Member reads | 300/min/user |
| Member writes | 60/min/user |
| Admin writes | 120/min/user |
| Uploads | 20/hour/user |
| Everything else | 600/min/IP |

Limits live in one configuration map so they can be tuned without touching
handlers. Phase 5 implements a Flask-Limiter-style limiter keyed by user when a
session exists, with an in-process store for development and Redis when
configured (`REDIS_URL` already exists).

**Pagination.** `page` defaults to 1; `per_page` defaults to 20, max 100
(50 public). Invalid values are clamped, not rejected. `meta.total` is a count
query; if a count is expensive, `meta.total` may be omitted but `meta.next` must
then be present — the client may not infer "no more pages" from a short page.

### 12.16 Two repositories: change management

The parent repository tracks `current-website/DIgital-Club` as a gitlink (mode
160000, commit `f047929`) with no `.gitmodules`, and the backend has its own
remote and `master` branch. That is a constraint to work within, not a defect to
fix.

| Rule | Reason |
| --- | --- |
| Backend changes are committed **inside** the nested repository; frontend changes in the parent. | The gitlink records a commit SHA; parent commits cannot contain backend file changes. |
| Never run `git add` for `current-website/DIgital-Club` from the parent. | Staging a gitlink with a different SHA silently "updates" the pointer, which is a cross-repo decision the user must make explicitly. |
| No `.gitmodules` is added, no `git submodule` command is run. | Changing the repository topology is out of scope and would break the user's existing setup. |
| After backend work, the Phase report states: nested branch, nested commit SHA (if any), and that the parent gitlink is now *behind* the nested HEAD unless the user chooses to update it. | The pointer mismatch is the normal, expected state; hiding it causes "why is my checkout stale" later. |
| Each phase touches one repository where possible. When both are unavoidable, they are reported separately with separate `git status` output. | Keeps rollback simple. |
| Pre-existing modifications (100 modified, 1 deleted, the untracked set) are never staged, reverted or "cleaned". | They are the user's work. |
| No `git reset`, `git clean`, `git checkout -- .`, force-push or history rewrite. No commits or pushes at all during architecture phases. | Authorization for Phase 3 excludes any Git action. |
| New files created by this integration (docs, contract artefacts) stay untracked until the user asks for a commit. | Matches the existing handling of `INTEGRATION_AUDIT.md` and `INTEGRATION_PROGRESS.md`. |

### 12.17 Dependency order

| Step | Work | Depends on | Exit criterion |
| --- | --- | --- | --- |
| **4** | Local environment: Flask dev server, Vite proxy, dev-only database, Turnstile test keys, `.env.example` names (no values) | this contract | Both apps start; `/api/v1/health` returns 200 on the loopback origin |
| **5** | API foundation: `/api/v1` blueprint, envelope, error handlers, CSRF blueprint policy, rate limiter, `api_login_required`/`api_role_required`, request-id logging, `/health`, `/auth/csrf` | 4 | A protected dummy endpoint returns 401/403/200 correctly; CSRF rejects a tokenless POST |
| **6** | Auth: AU1–AU8, ME1; delete demo accounts, demo buttons, `kiut-demo-session` | 5 | Real login/logout/register/reset round-trip; registration allows immediate sign-in; two accounts isolated; deactivation blocks sign-in until restored |
| **7** | Public reads PU1–PU23 (PU18 gated by D1) | 5, 6 for `/me`-dependent UI | Public pages show database content; empty database renders empty states; `200+` gone or computed |
| **8** | Member reads MD1–MD28, MD33–MD41, MD45–MD47, MD50–MD51 | 6, 7 | Dashboard shows the signed-in member for two different accounts |
| **9** | Member writes MD3–MD4, MD13–MD18, MD21, MD29–MD32, MD37–MD45, MD47–MD49 + admin reads | 8 | RSVP, project submit, quiz attempt, vote, team request work; closed windows return 409 |
| **10** | Admin writes, finance, messaging/newsletter, quizmaster authoring, uploads + protected serving | 9 | Admin CRUD verified on two roles; uploads unreachable without authorization |
| **11** | Cleanup: delete `data/demo.ts`, social store per D2, restore truthful labelling while anything remains, fix badges | 7–10 | `grep` finds no `demo` import; no fabricated record reachable |

Phase 11 also deletes the three fabricated public surfaces from §12.1 **as part of
Phase 7/8**, not at the end: those pages must stop publishing invented people as
soon as their replacement exists.

### 12.18 Unresolved decisions and risks

**Business/product decisions.** D1, D2, D4, D5 and D6 were approved by the user
on 2026-11-25 and are binding for every later phase; their rows below state the
approved decision rather than a default. D3 and D7–D16 remain open and must not
be guessed.

| # | Decision | Why it blocks work | Default if unanswered |
| --- | --- | --- | --- |
| D1 | **Approved (final, 2026-11-25).** Is there a public member profile, and what is its identifier? | Settled: profiles are public. | Public profiles are implemented. All profiles may be publicly accessible, but expose only explicitly approved public fields; private contact details, payment records, sensitive membership information and internal administrative data are never exposed (§12.7). The public identifier itself (member number vs `public_slug`) is chosen in Phase 7. |
| D2 | **Approved (final, 2026-11-25).** Is the social graph (follow / block / report / follower lists) part of the product? | Settled: yes, part of the overall integration scope, including following, follow requests, blocking, reporting and social notifications. | In scope, implemented in the social phase (Phase 10) — **not** in Phase 4. Until then the social UI stays hidden behind a capability and its local store is deleted. |
| D3 | Does editorial site copy move into a CMS, or stay in React source? | Determines whether `/public/site` grows into content CRUD. | Stays in React source as static editorial copy. |
| D4 | **Approved (final, 2026-11-25).** What replaces `200+/50+/100+`, partner logos, hackathon claim, project metrics? | Settled for the three headline figures only. | Retain the existing published `200+` / `50+` / `100+` figures and their current presentation. Document them as existing published figures whose underlying accuracy has not been independently verified; do not silently replace them with different figures. Partner logos, the hackathon claim and project metrics remain open. |
| D5 | **Approved (final, 2026-11-25).** When does CSRF protection extend to the existing HTML forms? | Global enablement breaks every Jinja form without tokens; the change must be atomic and staged. | Careful application-wide rollout covering both `/api/v1` and the existing Flask forms (§12.4). Token endpoint and API protection first, then `csrf_token()` in every existing form and HTML protection in the same reviewed release; existing functionality must keep working throughout, verified form by form. |
| D6 | **Approved (final, 2026-11-25).** Turnstile policy for local development and CI. | The flow refuses when keys are absent, so no local auth test can pass without a decision. | Cloudflare's public test keys in the local, gitignored `.env` only (`1x00000000000000000000AA` site key with the always-passing test secret); real credentials in production, supplied by the host's secret store. Never committed, never a bypass flag in application code. |
| D7 | Storage and serving of existing uploads (photos, ID images, election passports already on disk). | Determines migration and whether old URLs must keep working. | New uploads outside the web root; old `/static/uploads` closed to personal images at cutover. |
| D8 | How much of a member's name appears on public leaderboards? | Rankings page shows full names + course/year today. | Display name only, no course/year on public; full detail in the member panel. |
| D9 | Does the contact form persist messages? | Flask currently persists nothing; adding storage adds personal-data handling. | No persistence; the form stays a mailto/notification path. |
| D10 | Membership fee and whether payments are recorded only by admins. | Drives MD9 and eligibility messaging. | Admin-recorded payments only; fee comes from `SystemSettings`. |
| D11 | When are election results public? | `Election` phase rules allow several publication points. | Public only after `finalized`; nothing during `voting`. |
| D12 | Account deletion and retention (what happens to a deleted member's content, votes, payments). | Blocks admin delete hardening and file cleanup. | Preserve existing behaviour; no new deletion endpoint until decided. |
| D13 | Session lifetime and "remember me" default. | Affects the login UI and security posture. | Keep 30 days; remember-me opt-in. |
| D14 | Who may promote to quizmaster or admin? | The super-admin bootstrap is hardcoded today. | Only an existing admin; bootstrap credential rotation required before production. |
| D15 | Rate-limit thresholds for a campus network with shared IPs. | Per-IP limits can lock out a lab. | Per-user keying whenever a session exists; per-IP only for anonymous routes. |
| D16 | Academic-year boundaries and timezone display for "member since", "valid through". | Naive datetimes plus `Africa/Nairobi` can shift a displayed day. | Store UTC, display Nairobi; dates only (no times) for membership. |

**Technical risks:**

| # | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| R1 | Enabling CSRF breaks existing Jinja forms | Admin workflows stop | Scope CSRF to `/api/v1` first; add tokens to templates in one reviewed change; keep a smoke list of every form POST |
| R2 | `SECRET_KEY` fallback signs sessions and reset tokens with a known string | Session forgery, token forgery | Fail-closed startup outside development (Phase 5) |
| R3 | Hardcoded super-admin created at import | Known admin credential | Rotation + startup warning before any deployment; not silently "fixed" in a phase |
| R4 | `/static/uploads/*` serves personal images | Identity/passport disclosure | Serve through `/api/v1/files/{id}`; close the static path for personal media at cutover |
| R5 | `member.members_search` returns e-mails | Member enumeration | New endpoint with allow-list; old route narrowed in the same release |
| R6 | Unbounded lists and missing indexes | Slow API under real data | Mandatory pagination in the contract; index review per endpoint in Phases 7–9 |
| R7 | `member_bp.before_request` profile-completion redirect applies to API paths | Newly approved members get 302/409 on reads | Do not reuse the hook for `/api/v1`; expose `profile_completion` instead |
| R8 | Naive datetimes and UTC offset | Off-by-one-day dates in UI and eligibility windows | Serialise UTC ISO-8601; convert at the edge; test around midnight |
| R9 | Background threads for e-mail/SMS duplicate or die under Gunicorn | Missed notifications, duplicate sends | Queue-backed sending with `202`; do not send synchronously inside a request |
| R10 | No visible migration tooling for schema additions | Schema drift between environments | **Confirmed in Phase 4:** Flask-Migrate exists and the revisions form a single linear chain, but the chain has **no baseline `CREATE TABLE` revision** — the first revision is an `ALTER TABLE user`, so `flask db upgrade` fails on an empty database (`NoSuchTableError: user`). Any new column stays additive and goes through a new revision on top of the existing head; the local environment bootstraps its schema from the models and stamps the head (§13.5). The missing baseline is now tracked separately as R16. |
| R11 | Parent/nested repository mismatch | Lost or misplaced changes | §12.16 rules; report both repositories' status per phase |
| R12 | Deleting demo data before its endpoint exists | Blank screens, pressure to reintroduce mocks | Delete per surface only after the endpoint is verified (§12.11 order) |
| R13 | Sync Gunicorn workers plus per-request quiz reminder hook | Reminder duplication, slow requests | Move reminder processing behind the existing interval gate/queue; verify worker count |
| R14 | No automated test suite beyond a manual RSVP script | Regressions invisible | Add focused API tests per phase (auth, authorization, one write per domain), not a blanket suite |
| R15 | Two auth truths during migration (localStorage session still present in some components) | Confusing failures, privilege illusions | Phase 6 removes the storage session in the same change that wires `/me`; `RequireRole` reads only server state |
| R16 | Alembic history has no initial `CREATE TABLE` revision | A clean environment cannot be built from migrations alone; a future `flask db migrate` may try to re-create existing tables | Local bootstrap is a documented workaround, not a fix (§13.5). Before any new revision is generated, a baseline revision representing the current schema must be added (autogenerate against a stamped database produces an empty diff only if the stamp is honest). Never generate a migration against production. |
| R17 | `SESSION_COOKIE_SECURE` is not read from the environment | The session cookie cannot be forced HTTPS-only in production without code change | Phase 5 adds explicit session-cookie configuration (`SESSION_COOKIE_SECURE` from env, default on outside development) together with the fail-closed `SECRET_KEY` check |

### 12.19 Phase 3 acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| Designed around the existing Flask backend, models, rules and Flask-Login | Passed | §12.2, §12.4, §12.9 "Existing logic" column |
| No backend replacement or second auth system | Passed | §12.2, §12.4 (cookie session; JWT rejected with reasons) |
| Every proposed missing capability evaluated, not blindly adopted | Passed | §12.12 (Necessary / Conditional / Defer with justification) |
| Complete React→Flask contract with paths, methods, payloads, auth, authorization, errors | Passed | §12.9.1–12.9.7, §12.6, §12.10 |
| Session and CSRF strategy defined, including the missing CSRF layer | Passed | §12.4 (double-submit + session binding, Origin check, staged rollout) |
| Public / member / admin data separation defined | Passed | §12.7 (tiers, field matrix, 404-not-403 rule) |
| Demo-data replacement path explained for public, member and admin | Passed | §12.11, §12.8 |
| Upload security, personal-data protection, pagination, filtering, validation, rate limiting | Passed | §12.13, §12.14, §12.15, §12.6 |
| Two-repository change management specified without damaging either | Passed | §12.16 |
| Unresolved decisions and technical risks identified rather than assumed | Passed | §12.18 (D1–D16, R1–R15) |
| Architecture/documentation only: no endpoints, no app code, no dependencies, no database, no app start, no Git changes | Passed | Only `INTEGRATION_AUDIT.md` and `INTEGRATION_PROGRESS.md` written; baseline re-verified |
| Existing code and uncommitted work preserved | Passed | Parent worktree unchanged (100 modified, 1 deleted, same untracked set plus docs); nested repository clean |

---

**STOP — Phase 3 is finished.** No Phase 4 work has been started. Phase 4
(local environment) requires explicit approval, and D1/D2/D4/D5/D6 should be
answered first because Phase 4 configures Turnstile and the database around them.
---

## 13. Phase 4 — Local development environment and database preparation

**Authorized scope:** environment preparation only (approved 2026-11-25). No API
endpoint was implemented, no authentication was integrated, no React data source
was replaced, and no social-graph work was started. Decisions D1, D2, D4, D5 and
D6 were approved with this phase and are incorporated in §12.18, §12.12, §12.11,
§12.4 and §13.2.

**Environment:** Windows host, parent repository `Digital Club` on `main`, backend
repository `current-website/DIgital-Club` on `master` (nested, clean), no
production database or credentials touched.

### 13.1 Outcome

| Objective | Result |
| --- | --- |
| 1. Safe, reproducible local environment | Prepared — pinned Python 3.13.18 venv from `uv.lock`, existing Node toolchain verified, run scripts and runbook added |
| 2. Resolve Python/Node/package-manager incompatibilities | Resolved without changing a single declared dependency (§13.3) |
| 3. Same-origin React→Flask dev connection | Working — Vite proxies `/api`, `/healthz`, `/static/uploads` to Flask (§13.6) |
| 4. Isolated local development database | Created — SQLite, schema only, 60 tables, 0 rows (§13.5) |
| 5. Document database config, init, migrations, startup | Documented — including the missing-baseline finding that makes `db upgrade` unusable on an empty DB |
| 6. Safe local session, CSRF and Turnstile configuration | Configured — generated `SECRET_KEY`, local cookie settings, Turnstile test keys; CSRF remains absent by design (§13.7) |
| 7. Supports future public/member/admin/social testing | Yes — all roles, both repos and an empty schema are reachable; no demo or invented records were added |
| 8. Two-repository management documented | Yes — §12.16 rules restated with the local artefacts that must stay untracked (§13.8) |

### 13.2 Final approved decisions (binding)

| # | Decision | Consequence for later phases |
| --- | --- | --- |
| D1 | Public member profiles are implemented; all profiles may be public but only explicitly approved public fields are exposed. | Phase 7 builds PU18 with a serializer allow-list. Private contact details, payment records, sensitive membership data and internal administrative data are never serialised. §12.7's field matrix is the contract. The public identifier is chosen in Phase 7. |
| D2 | The social graph is in the integration scope: following, follow requests, blocking, reporting and social notifications. | Implemented in Phase 10, not Phase 4. Schema, moderation and deletion rules are decided then; until the endpoints exist the social UI stays hidden and the `localStorage` store is deleted, never left running as a parallel truth. |
| D4 | Retain the existing published `200+` / `50+` / `100+` figures and their presentation. | They are static editorial copy, documented as existing published figures whose accuracy has not been independently verified. No endpoint returns them as a fact, and they are not silently replaced. Partner logos, the hackathon claim and project metrics stay open. |
| D5 | Application-wide CSRF rollout covering `/api/v1` **and** existing Flask forms, without breaking anything. | Phase 5 ships the token endpoint + API protection and the `csrf_token()` change for every Jinja form in one reviewed release, then verifies each form POST. CSRF is still absent today; this phase neither simulated nor disabled it. |
| D6 | Turnstile uses Cloudflare test keys locally and real credentials in production; credentials are never committed. | The local `.env` (gitignored) carries `1x00000000000000000000AA` with the always-passing test secret. Production keys come from the host secret store. §13.7 lists the values and their limits. |

### 13.3 Environment configuration and compatibility findings

| Item | Before | Action | Result |
| --- | --- | --- | --- |
| Python | 3.15.2 active, 3.14 present, **3.13 absent**; `.python-version` pins `3.13`; `pyproject.toml` requires `>=3.13` | Installed `uv` into an untracked tool venv at `local-dev/.tools`; `uv sync --frozen` fetched CPython **3.13.18** and built `current-website/DIgital-Club/.venv` from the committed `uv.lock` | Backend runs the pinned interpreter with the lockfile's exact versions. No system Python was changed and no declared dependency was edited or upgraded. |
| uv | Not installed | Installed into `local-dev/.tools` (not into the backend repo) | First `uv sync` failed with `Access is denied` because uv was running from the `.venv` it needed to replace. Moving the tool out fixed the cause; the throwaway `.venv` created during the attempt was removed. |
| `uv.lock` | Unused (no uv) | `uv sync --frozen` only | Flask 3.1.2, Flask-Login 0.6.3, Flask-SQLAlchemy 3.1.1, Flask-Migrate 4.1.0, Flask-WTF 1.2.2, SQLAlchemy 2.0.44, Werkzeug 3.1.3, Pillow 11.3.0, psycopg2-binary 2.9.11, reportlab 4.4.5, qrcode 8.2, redis 7.2.1, rq 2.7.0 and the rest exactly as locked. |
| Node.js | v26.13.1 (`py`/`nvm` pin in `.nvmrc` is `20`) | Verified rather than changed: dependency install kept, `npm run typecheck` and `vite` dev server both exercised on v26 | Works on the installed major. No `package.json` or lockfile change, no `npm install` that could re-resolve versions. Residual risk: v26 is not the pinned major, so CI/other machines may differ (R18). |
| npm | 11.20.0 with `package-lock.json` | Untouched; existing `node_modules` reused | `typecheck` exits 0; Vite 5.4.21 starts in ~0.5 s. |
| Native/lazy imports | `cairosvg`, `celery`/`redis` imported lazily or only by workers | Import smoke test of the runtime-critical packages passed | `cairosvg` remains optional at runtime (imported inside `id_generator`); its external cairo dependency was **not** verified because no ID image was generated. |
| Flask CLI | `python main.py` documented | Start scripts use `flask --app app` (the `create_app` factory) instead | `main.py` seeds `admin@digitalclub.kiut.ac.tz / admin123` at import; the factory starts the same app without creating any account (§13.7). |

### 13.4 Files created or modified

| Path | Status | Purpose |
| --- | --- | --- |
| `current-website/DIgital-Club/.venv/` | Created (gitignored) | Python 3.13.18 environment from `uv.lock` |
| `current-website/DIgital-Club/.env` | Created (gitignored) | Local-only config: generated 64-hex `SECRET_KEY`, SQLite URL, cookie flags, Turnstile test keys, optional integrations empty |
| `current-website/DIgital-Club/instance/dev_local.db` | Created (gitignored) | Schema-only local database, 60 tables, 0 rows, Alembic stamped at head |
| `local-dev/backend.env.example` | Created (untracked) | Secret-free template documenting every supported variable |
| `local-dev/init_local_db.py` | Created (untracked) | Guarded local schema bootstrap (sqlite-only, path-confined, non-destructive) |
| `local-dev/start-backend.sh`, `local-dev/start-frontend.sh` | Created (untracked) | One-command startup on loopback |
| `local-dev/README.md` | Created (untracked) | Runbook: start, database, security posture, both-repository rules |
| `local-dev/.tools/` | Created (untracked) | uv tool venv, deliberately outside the backend repo |
| `local-dev/backend-dev.log`, `local-dev/frontend-dev.log` | Created (untracked) | Startup logs from the verification run |
| `new-website-design/vite.config.ts` | **Modified (tracked)** | Dev-only proxy for `/api`, `/healthz`, `/static/uploads`; no build output change |
| `INTEGRATION_AUDIT.md`, `INTEGRATION_PROGRESS.md` | Modified (untracked) | Decisions D1/D2/D4/D5/D6 incorporated; this section and the Phase 4 report added |

No application source file was changed. The backend repository's working tree
remains clean (`git status --porcelain` prints nothing): the venv, `.env`, the
database and the new upload directories are all ignored. The parent repository
changed only by `vite.config.ts` plus the new untracked `local-dev/`; the 100
pre-existing modifications, 1 deletion and 6 untracked paths are preserved.

### 13.5 Database preparation and verification

**Configuration.** `DATABASE_URL=sqlite:///dev_local.db` in the gitignored `.env`.
Flask-SQLAlchemy resolves the relative path to
`current-website/DIgital-Club/instance/dev_local.db`, inside the backend
repository and ignored by its `.gitignore`. No PostgreSQL URL, no Docker
database, no production connection string exists in the local configuration.

**Blocking finding — no Alembic baseline.** `flask db upgrade` cannot initialize
an empty database: the first revision `b033ca5044ab` has `down_revision = None`
and its only operation is `ALTER TABLE user ... password_hash`; nothing creates
`user`. The upgrade fails with `sqlalchemy.exc.NoSuchTableError: user`. All later
revisions only add tables that post-date the original schema, so the chain starts
mid-history. This was confirmed by running it once against the empty local file;
the partial file was then deleted and rebuilt. It is recorded as R10/R16 and must
not be "fixed" by inventing history.

**Chosen local initialization.** `local-dev/init_local_db.py`:

1. refuses to run unless `DATABASE_URL` is a `sqlite:///` URL;
2. refuses a resolved path outside the backend repository;
3. calls `db.create_all()` (idempotent, creates no rows);
4. stamps Alembic at head (`c20260703100000`) so later additive revisions apply
   normally;
5. prints the table count, stamp and row counts for `user` and `member`.

It never drops, truncates, seeds or migrates data. Exits non-zero on any guard
failure.

**Verified state.**

| Check | Result |
| --- | --- |
| Tables | 60 (59 mapped models + `alembic_version`) |
| Alembic | `current` = `heads` = `c20260703100000` |
| `user` rows | 0 |
| `member` rows | 0 |
| URL schemes present | Only `sqlite`; the backend config exposes no production DSN |
| Startup compatibility migrations in `create_app()` | Inspected before use: each checks table/column existence and no-ops on an empty or already-current schema; they never delete data. Confirmed harmless by the clean startup below |
| Upload directories | `create_app()` ensures `app/static/uploads/*`; the 32 tracked upload files were untouched, and the one new empty directory is untracked |

**Not done, deliberately:** no seed data, no demo members, no administrative
account, no production copy, no `flask db migrate` (which would have tried to
re-create the entire schema because of the missing baseline), no destructive SQL.

### 13.6 Local React–Flask connection

`new-website-design/vite.config.ts` (dev server only):

| Path | Target | Why |
| --- | --- | --- |
| `/api` | `http://127.0.0.1:5051` | The future `/api/v1` surface; keeps the browser on one origin so Flask-Login cookies, CSRF tokens and Origin checks behave as in production |
| `/healthz` | `http://127.0.0.1:5051` | Proves the proxy path end to end without inventing an API route |
| `/static/uploads` | `http://127.0.0.1:5051` | Existing legacy media, per §12.3; no personal-media policy is implied by this |

`changeOrigin: false` keeps the browser's `Host`/`Origin` (`127.0.0.1:5178`) so the
future same-origin CSRF/Origin gate sees the real app origin. No CORS
configuration exists or is needed. Ports: Vite `5178`, Flask `5051`, both bound to
`127.0.0.1` only.

**Verified:** `GET http://127.0.0.1:5178/` → 200 (Vite);
`GET http://127.0.0.1:5178/healthz` → 200 `{"status":"ok"}` with
`server: Werkzeug/3.1.3 Python/3.13.18` (Flask through the proxy);
`GET http://127.0.0.1:5178/api/v1/ping` → 404 `{"error":"Not found"}` **from
Flask**, confirming `/api` routing works while no endpoint exists yet.

### 13.7 Authentication, session, CSRF and Turnstile configuration

| Setting | Local value | Source | Production requirement |
| --- | --- | --- | --- |
| `SECRET_KEY` | Random 64-hex, generated locally | `.env` (gitignored) | Real secret from the host; the code's `dev-secret-key-change-in-production` fallback must never be relied on (R2) |
| `SESSION_COOKIE_HTTPONLY` | `True` | Flask default | Keep |
| `SESSION_COOKIE_SAMESITE` | `Lax` | `.env` | Keep |
| `SESSION_COOKIE_SECURE` | `False` (unset) | Flask default | **Must be `True`**; the application does not read this from env today (R17) |
| `REMEMBER_COOKIE_SECURE` | `0` | `.env` | `1` (application default) |
| `REMEMBER_COOKIE_HTTPONLY` | `True` | Code | Keep |
| `PERMANENT_SESSION_LIFETIME` / remember | 30 days / 30 days | `.env` | Unchanged (D13 still open) |
| `SERVER_NAME` | Unset | `.env` | Unset on hosted platforms |
| `PREFERRED_URL_SCHEME` | `http` | `.env` | `https` |
| Turnstile site key | `1x00000000000000000000AA` (always passes, visible) | `.env` | Real Cloudflare site key |
| Turnstile secret | `1x0000000000000000000000000000000AA` (always passes, dummy tokens only) | `.env` | Real Cloudflare secret from host secrets |
| CSRF | **Absent** — `CSRFProtect` never imported or initialised; no template token | Code (unchanged) | Phase 5 application-wide rollout (D5, §12.4) |
| Flask-Login | Unchanged cookie session, `login_view = auth.login`, `enforce_active_accounts` untouched | Code (unchanged) | Unchanged |
| Administrator bootstrap | Not executed | Start scripts use `create_app`, not `main.py` | Rotate before any deployment (R3) |

Local authentication was **not** weakened to make testing easier: there is no
bypass flag, no auth stub, no "dev auto-login", and Turnstile still refuses when
keys are missing. The test keys are Cloudflare's published dummy values, which
only validate dummy tokens; a production secret rejects them.

### 13.8 Security checks and remaining risks

Checks performed on the running environment:

| Check | Result |
| --- | --- |
| `SECRET_KEY` is not the code fallback | Confirmed (`secret_is_fallback: False`, length 64) |
| No accounts created at startup | Confirmed — `user=0`, `member=0` after boot, `main.py` never imported |
| No production database reachable | Confirmed — only `sqlite:///dev_local.db`; no DSN present |
| `.env`, `.venv`, `instance/` ignored by the backend repo | Confirmed with `git check-ignore -v` |
| Backend repository unchanged | Confirmed — `git status --porcelain` empty, branch `master` |
| Parent repository preserved | 100 pre-existing modifications + 1 deletion + 6 untracked paths, plus this phase's `vite.config.ts` change and `local-dev/` |
| No secret printed | `SECRET_KEY` and env values were only tested for equality/presence; values were never echoed |
| Existing Jinja pages still render on an empty schema | `/`, `/home`, `/auth/login`, `/auth/register`, `/events`, `/verify-id/<id>` all 200 |
| Turnstile widget receives the test site key | Confirmed in the login page HTML |

Remaining risks and gaps (all documented, none worked around by weakening
security):

- **R16 — missing Alembic baseline.** Local databases need the bootstrap script;
  a future `db migrate` against this schema would attempt to create existing
  tables. A baseline revision must be added before any new migration is authored.
- **R17 — `SESSION_COOKIE_SECURE` is not configurable.** Production HTTPS-only
  cookie enforcement currently requires a code change. Phase 5.
- **R2 — `SECRET_KEY` fallback stays in code.** Local `.env` avoids it; the
  fail-closed check is still a Phase 5 prerequisite.
- **R3 — hardcoded super-admin remains in `main.py`.** Avoided, not removed:
  running `python main.py` (or importing it) still creates it. Phase 5 replaces
  the bootstrap.
- **R18 — Node 26 vs `.nvmrc` 20.** Verified working here; CI may resolve
  differently. No lockfile change was made.
- **CSRF is still absent**, so no local test can exercise a CSRF-protected
  request. This is the current truth, not a local configuration choice.
- **Lazy/native dependencies unverified:** `cairosvg` (external cairo for logo
  conversion) and the Celery/RQ/Redis reminder path were not exercised; Redis is
  intentionally empty locally and quiz reminders are disabled
  (`QUIZ_REMINDER_RUN_ON_REQUEST=0`) to avoid background work during tests.
- **Turnstile end-to-end not executed:** a successful registration/login would
  create an account, which this phase forbids. Only key injection and the
  presence of the widget were verified.
- **Uploads remain publicly served by Flask** (`/static/uploads`) pending the
  §12.13 policy; the dev proxy does not change that.

### 13.9 Commands to start both applications locally

From the parent repository root:

```bash
# Terminal 1 — Flask backend (factory startup, no admin seeding)
bash local-dev/start-backend.sh
#   → http://127.0.0.1:5051  (GET /healthz → {"status":"ok"})

# Terminal 2 — React frontend (proxies /api, /healthz, /static/uploads)
bash local-dev/start-frontend.sh
#   → http://127.0.0.1:5178
```

Equivalent explicit commands:

```bash
cd current-website/DIgital-Club
.venv/Scripts/python.exe -m flask --app app run --host 127.0.0.1 --port 5051

cd new-website-design
npm run dev
```

Database and diagnostics:

```bash
# create/rebuild the local schema (non-destructive, schema only)
current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/init_local_db.py

# confirm the applied revision
cd current-website/DIgital-Club && .venv/Scripts/python.exe -m flask --app app db current

# frontend typecheck
cd new-website-design && npm run typecheck
```

To reset the local database: stop the backend, delete
`current-website/DIgital-Club/instance/dev_local.db`, re-run the bootstrap.

### 13.10 Test results

| Test | Command | Result |
| --- | --- | --- |
| Locked dependency sync | `uv sync --frozen` | Passed — CPython 3.13.18, no version drift |
| Runtime imports | `python -c "import flask, dotenv, sqlalchemy, flask_login, flask_migrate, PIL, qrcode, reportlab, psycopg2"` | Passed |
| Empty-DB migration attempt | `flask --app app db upgrade` | **Failed as expected** (`NoSuchTableError: user`) — documented as R10/R16, not worked around |
| Local schema bootstrap | `python local-dev/init_local_db.py` | Passed — 60 tables, stamped `c20260703100000`, 0 rows |
| Migration state | `flask --app app db current` / `db heads` | Both `c20260703100000 (head)` |
| Backend start | `flask --app app run` | Listening on `127.0.0.1:5051`; `GET /healthz` → 200 |
| Existing page render | `curl` on `/`, `/home`, `/auth/login`, `/auth/register`, `/events`, `/verify-id/<id>` | All 200, no traceback in the log |
| Route registry | `len(app.url_map)` | 257 rules (255 legacy decorators + `/healthz`/static) |
| Turnstile key injection | `GET /auth/login` HTML | `data-sitekey="1x00000000000000000000AA"` |
| Vite start | `npm run dev` | Vite 5.4.21 ready in 496 ms on `127.0.0.1:5178` |
| Same-origin proxy | `GET 5178/healthz`, `GET 5178/api/v1/ping` | 200 JSON via Werkzeug; 404 JSON from Flask (API intentionally absent) |
| Frontend typecheck | `npm run typecheck` | Exit 0 (before and after the proxy change) |
| No accounts created | `User.query.count()`, `Member.query.count()` | 0 / 0 |
| Repository safety | `git status --porcelain` (both repos) | Backend clean; parent only the intended change and untracked `local-dev/` |

Not tested, and explicitly reported as such: successful Turnstile
registration/login flows (would create accounts), CSRF-protected requests (no
CSRF layer yet), upload handling, PDF/ID generation, e-mail/SMS/Redis/Celery
paths, and any API endpoint (none exists).

### 13.11 Acceptance against the Phase 4 objectives

| Criterion | Result | Evidence |
| --- | --- | --- |
| Safe, reproducible environment for both apps | Passed | §13.3, §13.9; locked sync, scripts, runbook |
| Compatibility issues resolved without unnecessary dependency upgrades | Passed | Python 3.13.18 from `uv.lock --frozen`; Node 26 verified; no `pyproject.toml`/`package.json`/lockfile change |
| Same-origin React→Flask connection | Passed | §13.6; proxied `/healthz` served by Werkzeug |
| Isolated local database | Passed | §13.5; SQLite in `instance/`, schema only, 0 rows |
| Database configuration, initialization, migrations and startup documented | Passed | §13.5, §13.9, R10/R16 |
| Safe local session, CSRF and Turnstile configuration | Passed | §13.7; `SECRET_KEY` generated, cookie flags local-only, test keys, no bypass |
| Supports future public/member/admin/social testing | Passed | Empty schema with all 59 models; roles unchanged; no fabricated data to remove later |
| Two-repository management documented | Passed | §12.16, `local-dev/README.md` |
| No production database or personal records | Passed | SQLite-only guard; no DSN; `user`/`member` empty |
| No default or production administrator created | Passed | `main.py` not used; counts verified 0 |
| No secrets exposed or environment files committed | Passed | `.env` gitignored, values never printed; only test keys appear in the untracked template |
| No authentication, CSRF or Turnstile weakening | Passed | No bypass flag or stub; absent CSRF documented, not simulated |
| Existing work, remotes and repository structure preserved | Passed | Backend clean; parent baseline intact; no Git changes of any kind |
| Original Jinja frontend unaltered | Passed | No template or route edit; all pages render |
| No API, auth integration, React data replacement or social work started | Passed | Only `vite.config.ts` (dev proxy) and untracked local tooling changed |

---

**Phase 4 stopped here.** The Phase 5 scope listed above (Flask API foundation:
`/api/v1` blueprint, envelope/errors, pagination, CSRF token endpoint and
application-wide CSRF rollout, fail-closed `SECRET_KEY`, session-cookie
hardening, rate limiting) was subsequently authorized and is documented in §14.

---

## 14. Phase 5 — Flask API foundation and security infrastructure

Authorized 2026-11-25 ("I authorize Phase 5 only"). Reference material for the
transport contract is the API reference in `API_DOCUMENTATION.md`; this section
records what was built, why, and what remains open.

### 14.1 Outcome

`/api/v1` exists as a separate blueprint with a single response envelope, a
single error vocabulary, reusable validation, health/readiness/diagnostics, a
CSRF handshake, server-side login/role decorators, per-endpoint rate limiting and
fail-closed configuration — while every existing Jinja page and form still
works. CSRF protection is now **on for the whole application**, not just the API
(decision D5).

No business endpoint, React auth integration, member/admin integration or
demo-data removal was started.

### 14.2 Files created

| File | Purpose |
| --- | --- |
| `app/api/__init__.py` | Blueprint `api_v1` at `/api/v1`; imports the route modules |
| `app/api/responses.py` | `success`/`error` envelopes, request id, `no_store` |
| `app/api/errors.py` | `ApiError`, status→code map, `register_api_error_handlers`, `json_endpoint` |
| `app/api/validation.py` | `ValidationError`, `require_json`, string/int/bool readers, pagination |
| `app/api/ratelimit.py` | `rate_limit(name)` decorator, `reset_rate_limits()` |
| `app/api/auth.py` | `api_login_required`, `api_role_required`, `/auth/csrf`, `/auth/csrf/verify` |
| `app/api/health.py` | `/health`, `/ready`, admin-only `/diagnostics` |
| `app/api/me.py` | `GET /me` (own identity + profile-completion report) |
| `app/security_config.py` | `resolve_secret_key` (fail-closed), `env_bool`, `resolve_cookie_secure`, `resolve_allowed_origins`, `is_development` |
| `app/static/js/csrf.js` | Injects tokens into late-rendered forms; adds `X-CSRF-Token` to same-origin `fetch`/XHR writes |
| `app/templates/errors/csrf.html` | HTML page for a rejected form POST (HTTP 400) |
| `API_DOCUMENTATION.md` (parent root) | Transport, security and configuration reference |
| `local-dev/add_csrf_tokens.py` | One-off, idempotent template tokeniser (with `--check` mode) |
| `local-dev/test_phase5_api.py` | 33-test isolated suite |

### 14.3 Files modified

| File | Change |
| --- | --- |
| `app/__init__.py` | `ENVIRONMENT`, fail-closed `SECRET_KEY`, cookie flags, API rate-limit config, `CSRFProtect`, Origin/Referer gate, CSRF error handler, API response headers, API blueprint + error handlers, JSON 404 for `/api/`, inactive-account gate rewritten |
| `app/routes/auth.py` | Logout is `POST`-only (was a GET link) |
| `app/templates/base.html`, `baseAdmin.html` | `<meta name="csrf-token">`, `csrf.js`, POST logout forms, logout form CSS |
| `app/templates/admin/admin_base.html`, `member/member_base.html` | POST logout forms |
| 77 further templates (81 total) | One hidden `csrf_token` input inside every POST form — **135 forms** |
| `local-dev/README.md`, `local-dev/backend.env.example` | New variables, security posture, how to run the suite |

No frontend (`new-website-design/`) file was needed for this phase: the Vite
proxy from Phase 4 already makes the API same-origin.

### 14.4 Response, error and validation implementation

Matches §12.6 exactly: `{data, meta}` / `{error, meta}`, `X-Request-ID` echoed in
`meta.request_id`, `no-store` on every API response, `nosniff`. Errors map to the
fixed vocabulary in `DEFAULT_MESSAGES` and carry no internals.

The no-leak rule is enforced in two places, and tested for both:

1. `json_endpoint` catches any exception from a handler, logs it with the request
   id, and returns `500 INTERNAL_ERROR`.
2. A global `HTTPException` handler returns the envelope for `/api/` paths only
   (including unwrapped views and routing errors) and re-dispatches everything
   else to Flask, so HTML behaviour is unchanged.

### 14.5 CSRF rollout (D5) — what was actually enabled

The inventory before enabling protection: **135 `<form method="POST">` blocks
across 81 templates**, plus JavaScript writes in `main.js`, `admin/rsvps.html`,
`admin/scan_id.html`, `admin/event_checkin.html`, `admin/elections/*`,
`member/quizzes/take.html` (quiz submit), and the newsletter and login forms.

Implementation:

| Layer | Detail |
| --- | --- |
| Server | `CSRFProtect` initialised on the app; `WTF_CSRF_HEADERS=['X-CSRF-Token']`; `WTF_CSRF_TIME_LIMIT=None` (session-bound, no expiry) |
| Jinja | Hidden `csrf_token` input in all 135 POST forms, including login, register, forgot/reset password, logout, RSVP, contact, newsletter, profile, admin CRUD, elections, competitions, sessions and teams |
| Dynamic HTML | `csrf.js` injects the field into forms added after load (`MutationObserver`) |
| JS writes | `csrf.js` wraps `fetch` and `XMLHttpRequest` to add `X-CSRF-Token` for same-origin unsafe methods |
| API | `GET /api/v1/auth/csrf` issues; unsafe API requests without a valid token get `403 CSRF_TOKEN_INVALID` |
| Second gate | `Origin`/`Referer` must match the app host (or `APP_ALLOWED_ORIGINS`); otherwise `403 ORIGIN_NOT_ALLOWED` / `400` page |
| Failure UX | API: JSON envelope. HTML: `errors/csrf.html` at HTTP 400 |

**Deliberate deviation from §12.4(1).** The contract described a staged cutover
with `WTF_CSRF_CHECK_DEFAULT = False` and per-blueprint opt-in. Because the whole
form inventory was tokenised in the same change, the simpler and stronger setting
`WTF_CSRF_CHECK_DEFAULT = True` was used: every unsafe request is checked, API
and HTML alike, with no route left outside the net. There is no `@csrf.exempt` on
any state-changing route. The risk the staged plan guarded against — HTML forms
breaking — is covered instead by a compatibility test that posts a real form with
and without a token (`ExistingFormCompatibilityTests`), plus a live check against
the running server.

Logout was converted from a GET link to a POST form in four base templates,
because a state-changing GET cannot be CSRF-protected without breaking link
prefetching and is itself a vulnerability.

### 14.6 Authentication and authorization boundaries

Flask-Login is preserved unchanged: same `user_loader`, same `User` model, same
password hashes, same `login_user`/`logout_user`. No second identity system,
no JWT, no browser-stored token.

New, additive, server-side only: `api_login_required` (401 `AUTH_REQUIRED`) and
`api_role_required(*roles)` (401 anonymous / 403 `FORBIDDEN`). Role strings are
the existing `student`/`quizmaster`/`admin`.

**Finding fixed during this phase.** `User.is_active` returns
`is_active_account`, and Flask-Login derives `is_authenticated` from `is_active`.
A deactivated account is therefore *anonymous*, not "authenticated but
inactive", which made the old `enforce_active_accounts` branch dead code and
returned `401` for a deactivated session. The gate now detects a session that
still names a user who cannot authenticate (deactivated or deleted after sign-in),
clears it, and returns `403 ACCOUNT_INACTIVE` for `/api/` (HTML keeps its
flash-and-redirect behaviour).

`/api/v1/me` deliberately does **not** reuse the member panel's
profile-completion redirect: it reports `profile_completion` so the SPA can
prompt, while reads continue to work (§12.5).

### 14.7 Configuration, secrets and rate limiting

| Change | Effect |
| --- | --- |
| `resolve_secret_key()` | Empty `SECRET_KEY` outside `FLASK_ENV=development/dev/local` raises at startup; the public fallback is development-only and logged as a warning |
| `SESSION_COOKIE_SECURE` | Now read from env; defaults to on outside development (resolves **R17**) |
| `SESSION_COOKIE_HTTPONLY` | Explicitly `True` |
| `REMEMBER_COOKIE_SECURE` | Unchanged behaviour, now via `env_bool` |
| `RATELIMIT_ENABLED`, `API_RATE_LIMITS` | API limiter on by default; per-bucket windows |
| `APP_ALLOWED_ORIGINS` | Optional extra origins for the Origin gate; empty locally |

Turnstile is untouched: test keys locally, real keys in production, no bypass
flag, and `/diagnostics` reports only whether keys are configured. Rate limiting
keys on user id (else IP) and is process-local — recorded as **R19**.

### 14.8 Migration and database safety

- **No migration was generated.** R16 (no baseline `CREATE TABLE` revision) is
  still open and is a precondition for any new revision; nothing in this phase
  needs a schema change.
- No model, column or table was altered. `local-dev/init_local_db.py` and the
  existing head `c20260703100000` are unchanged; the 60-table local database was
  not reset, recreated or migrated.
- The test suite runs against a temporary SQLite file under
  `local-dev/.test-artifacts/`, with its own users. It does not open
  `instance/dev_local.db`: the file checksum was byte-identical before and after
  the suite.
- One live smoke test posted the newsletter form to the running server, which
  inserted a single row into `newsletter`. That row was located and deleted in the
  same run; every table is back to 0 rows. The file's byte hash differs from
  before only because SQLite allocated a page and then put it on the freelist —
  schema, row counts and data are unchanged. Recorded here rather than hidden;
  future live checks will not write.

### 14.9 Repository protection

Backend changes are inside the nested repository, uncommitted: 6 modified files
from the pre-existing Phase 5 work plus 77 template edits, 4 new paths
(`app/api/`, `app/security_config.py`, `app/static/js/csrf.js`,
`app/templates/errors/`). Nothing was staged, committed, pushed or deployed. The
parent repository gained `API_DOCUMENTATION.md` and `local-dev/` updates only; its
pre-existing uncommitted work is untouched.

### 14.10 Test results

`local-dev/test_phase5_api.py` — **33 tests, all passing** (isolated database):

| Group | Covered |
| --- | --- |
| API foundation | health envelope + `X-Request-ID` + `no-store`; `/ready`; envelope 404; envelope 405; `/healthz` unchanged |
| No-leak errors | wrapped and unwrapped exceptions both return `500 INTERNAL_ERROR` with no exception text, SQL, path or address |
| Auth | `/me` 401 anonymous; `/me` 200 own identity + `no-store`; diagnostics 401 / 403 (member) / 200 (admin) with no secret or URI; deactivated account `403 ACCOUNT_INACTIVE` |
| CSRF | token issued; verify rejects missing and invalid; accepts valid header token; rejects foreign `Origin` even with a valid token; accepts same-origin |
| Existing forms | `/contact`, `/auth/login`, `/auth/register`, `/auth/forgot-password` render a token; form POST without token → 400 HTML; with token → success; login form passes CSRF; logout GET → 405; public pages still render |
| Rate limiting | third request in a 2/min bucket → 429 with `Retry-After` |
| Secret validation | missing key raises outside development (both explicit and unset env); development fallback; explicit key used verbatim; cookie/origin defaults; **subprocess** production start exits non-zero |

Additional live verification against the running server (Werkzeug on
`127.0.0.1:5051`): `/healthz` 200, `/api/v1/health` 200 with the expected
headers, `/api/v1/me` 401, `/api/v1/auth/csrf` 200, login page renders one token
field, `/events` 200, verify 403/403/200 for missing/invalid/valid tokens, foreign
`Origin` 403 `ORIGIN_NOT_ALLOWED`, form POST 400 without a token and success with
one. All **144 templates** compile through Jinja.

Not tested, and why: successful login/registration through the browser form with
real Turnstile (would need an account — only the CSRF pass-through was tested),
uploads, PDF/digital-ID generation, e-mail/SMS/Redis/Celery paths, and any
multi-worker rate-limit behaviour (single process locally).

### 14.11 Remaining risks

- **R19 — rate limiting is per process.** In-memory counters; with N workers the
  effective limit is N× the configured value, and counters reset on restart. A
  shared Redis store is required before running more than one worker. Until then
  the limits are a cheap abuse brake, not a hard quota.
- **R20 — CSRF depends on the token being present in every form.** A form added
  later without `{{ csrf_token() }}` will fail with 400 rather than silently
  posting. This is the intended failure mode, but it means template reviews must
  check new forms; `local-dev/add_csrf_tokens.py --check` reports any that lose
  the token.
- **R17 resolved:** session cookie security is now configurable and secure by
  default outside development.
- **R16 still open:** no Alembic baseline. No revision may be authored until it
  is added.
- **`SESSION_COOKIE_NAME` is not yet `kiut_session`** (proposed in §12.4).
  Deliberately deferred to Phase 6, where the authentication cutover happens and
  renaming the cookie is meaningful rather than a gratuitous local change.
- **Turnstile remains only key-verified** through the API surface; no API
  endpoint yet consumes `turnstile_token`.
- **`main.py` unchanged:** it still seeds a hardcoded super admin if imported.
  The app continues to be started through the factory only.

### 14.12 Acceptance against the Phase 5 objectives

| Objective | Result | Evidence |
| --- | --- | --- |
| Versioned `/api/v1` structure | Passed | `app/api/`, blueprint `api_v1`; §5 of `API_DOCUMENTATION.md` |
| Reusable response/error utilities | Passed | `responses.py`, `errors.py`; §14.4 |
| Consistent validation and errors | Passed | `validation.py`, fixed code table, `422` field details |
| Health and diagnostics endpoints | Passed | `/health`, `/ready`, admin `/diagnostics` |
| API handlers separate from Jinja handlers | Passed | Separate blueprint package; no page route converted |
| Reuses existing config/extensions | Passed | Same `db`, `login_manager`, `SECRET_KEY`, `User` model, `current_user` |
| Inspect state-changing routes/forms before enabling CSRF | Passed | 135 forms / 81 templates inventoried; JS write paths enumerated |
| Secure session-bound CSRF | Passed | `CSRFProtect`, session-bound token, `X-CSRF-Token` |
| API supports the approved strategy | Passed | `/auth/csrf`, `/auth/csrf/verify`, `403 CSRF_TOKEN_INVALID` |
| Existing Jinja forms keep working | Passed | Component test + live 400/200 comparison |
| Login/register/logout/reset protected | Passed | Tokens in all four; logout POST-only |
| Origin validation | Passed | Origin/Referer gate, foreign origin 403 |
| Legitimate and rejected CSRF tested | Passed | `CsrfTests` + live checks |
| Flask-Login and hashes preserved | Passed | No auth rewrite; same model/loader |
| Server-side role enforcement | Passed | `api_role_required`; 401/403 tests |
| No second auth system / no JWT | Passed | Session cookie only; nothing in browser storage |
| API rate limiting | Passed | Decorator + 429 test; R19 documented |
| Unsafe defaults addressed | Passed | Fail-closed `SECRET_KEY`, secure cookie default, explicit `HttpOnly` |
| Fail safely without secrets | Passed | Unit + subprocess tests |
| Turnstile test/real key behaviour preserved | Passed | No change to the mechanism; diagnostics reports configuration only |
| No sensitive exception/DB detail in API | Passed | Wrapped and unwrapped 500 tests; diagnostics allow-list |
| No new migration before R16 | Passed | No revision created; §14.8 |
| Local database preserved | Passed | Checksum identical before/after suite; 0 rows in every table |
| No production connection, no real accounts | Passed | Temp SQLite only; test users exist only in it |
| Separate repositories respected | Passed | Backend edits nested, uncommitted; parent edits limited to docs and `local-dev/` |
| No stage/commit/push/deploy | Passed | Nothing staged; no remote operation |

---

**STOP — Phase 5 is finished.** No Phase 6 work has been started. React
authentication integration, public content, member, admin and social endpoints,
and demo-data removal remain unauthorized pending explicit approval.

# INTEGRATION PROGRESS — KIUT Digital Club

Controlling plan: `KIUT_DIGITAL_CLUB_INTEGRATION_MASTER_PLAN.md` (supplied with
the task; not yet copied into the repository).
Audit detail: `INTEGRATION_AUDIT.md`.

Execution model: **one phase per run, stop and wait for explicit approval.**

---

## 1. Phase status

| Phase | Name | Status | Approved by user | Completed |
| --- | --- | --- | --- | --- |
| 0 | Repository safety baseline and orientation | **Complete** | Yes ("execute phase 0 first") | 2026-11-24 |
| 1 | Complete Flask backend and data-source audit | **Complete** | Yes ("I authorize Phase 1 only") | 2026-11-25 |
| 2 | Complete React frontend, feature and demo-data audit | **Complete** | Yes ("I authorize Phase 2 only") | 2026-11-25 |
| 3 | Integration architecture and API contract proposal | **Complete** | Yes ("I authorize Phase 3 only") | 2026-11-25 |
| 4 | Safe local development and integration environment | **Complete** | Yes ("I authorize Phase 4 only") | 2026-11-25 |
| 5 | Flask API foundation and security infrastructure | **Complete** | Yes ("I authorize Phase 5 only") | 2026-11-25 |
| 6 | Authentication and account lifecycle integration | **Complete** | Yes ("execute next phase from master prompt of phases") | 2026-11-26 |
| 7 | Public website data integration | **Complete** | Yes ("I authorize Phase 7 only") | 2026-11-26 |
| 8 | Member portal integration | Not started | — | — |
| 9 | Admin portal integration | Not started | — | — |
| 10 | Remaining features and real-time integrations | Not started | — | — |

Out of scope until explicitly authorized: committing, pushing, deploying,
changing Git remotes/branches, database resets or migrations.

---

## 2. Approval history

| Date | Instruction | Action taken |
| --- | --- | --- |
| 2026-11-24 | "execute phase 1" | Started Phase 1 inspection; stopped at the user's request before any document was written. No files were created by that partial run and no application code was touched. |
| 2026-11-24 | "stop execute phase 0 first" | Phase 1 work abandoned. Phase 0 executed read-only; `INTEGRATION_AUDIT.md` and this file created. |
| 2026-11-25 | Phase 0 reviewed and accepted; "I authorize Phase 1 only — Complete Flask backend and data-source audit", with seven read-only precautions | Phase 1 executed as a purely static audit (no app start, no DB, no installs, no Git changes). Phase 1 section appended to `INTEGRATION_AUDIT.md`; this file updated. Stopped before Phase 2. |
| 2026-11-25 | Phase 1 reviewed and accepted; "I authorize Phase 2 only — React frontend, feature and demo-data audit", with ten read-only requirements | Phase 2 executed as a purely static audit of all 140 React source files and 111 routes. Phase 2 section (§11) appended to `INTEGRATION_AUDIT.md`; this file updated. Stopped before Phase 3. |
| 2026-11-25 | Phase 2 reviewed and accepted; spot-check of three Phase 2 claims requested, then "I authorize Phase 3 only — API Contract and Integration Architecture Proposal", with eleven requirements and six phase restrictions | Phase 2 claims re-verified against source and one description tightened. Phase 3 produced as §12 of `INTEGRATION_AUDIT.md` (architecture, CSRF/session strategy, 120+ endpoint contract, capability evaluation, dependency order, 16 decisions, 15 risks); this file updated. Stopped before Phase 4. |

| 2026-11-25 | Phase 3 reviewed and accepted; decisions D1, D2, D4, D5, D6 declared final; "I authorize Phase 4 only — Local Development Environment and Database Preparation" | Decisions D1/D2/D4/D5/D6 incorporated into §12.4, §12.11, §12.12 and §12.18. Phase 4 prepared the pinned Python 3.13.18 environment, a schema-only local SQLite database, the same-origin Vite proxy and local Turnstile/session configuration, then verified both servers and both repositories. Phase 4 appended as §13 and §9; stopped before Phase 5. |

| 2026-11-25 | Phase 4 reviewed and accepted; "I authorize Phase 5 only — Flask API Foundation and Security Infrastructure", with eight sections of requirements and a strict stop before Phase 6 | Phase 5 built the `/api/v1` foundation, application-wide CSRF rollout over all 135 existing POST forms, server-side role enforcement, rate limiting and fail-closed secret handling. Recorded as §14 of `INTEGRATION_AUDIT.md`, §10 of this file and the new `API_DOCUMENTATION.md`. 33 isolated tests pass. Stopped before Phase 6. |
| 2026-11-26 | "execute next phase from master prompt of phases" (after an unrelated KIUTBOT chat task) | Phase 6 executed from the approved phase table and the §12.9.1/§12.9.2 contract, because `KIUT_DIGITAL_CLUB_INTEGRATION_MASTER_PLAN.md` is still not in the repository. Built AU2–AU7, the new `ME1` projection, the React session cutover and the removal of the demo identity. Recorded as §11 of this file and §5/§13 of `API_DOCUMENTATION.md`. 39 new tests pass (33 Phase 5 tests still pass). Stopped before Phase 7. |

Note: the abandoned Phase 1 pass produced factual observations only in the
session transcript; none of them were written into the repository and none are
relied upon here. Phase 1 will be re-run from scratch when approved.

---

## 3. Baseline captured at Phase 0

### 3.1 Repositories

- Parent: `C:/Users/Smarderve/Desktop/Projects/Digital Club`, branch `main`,
  remote `origin` = `https://github.com/Smarderve/digitalclubwebdesign.git`.
- Backend: `current-website/DIgital-Club`, a **nested Git repository** recorded
  in the parent as a gitlink (no `.gitmodules`), branch `master`, remote
  `https://github.com/KIUT-DIGITAL-CLUB/DIgital-Club.git`, worktree **clean**.
- Frontend: `new-website-design`, tracked by the parent.

### 3.2 Working tree at baseline (preserved, untouched)

- 100 modified files (mostly `new-website-design/src/pages` and
  `src/components`), 1 deleted file (`new-website-design/build.log`), 4
  untracked paths (`Pictures/`, `new-website-design/audit/`,
  `new-website-design/public/images/club/`,
  `new-website-design/src/components/app/AppearancePanel.tsx`).
- Ignored: `.cloud-attachments/`, `.freebuff/`, `new-website-design/dist/`,
  `new-website-design/node_modules/`.

### 3.3 Runtimes

| Component | Configured | Installed here |
| --- | --- | --- |
| Python | `>=3.13`, `.python-version` 3.13, `uv.lock` | 3.15.2, no `.venv`, `uv` not on PATH |
| Node | `.nvmrc` 20, npm lockfile | v26.13.1, npm 11.20.0 |
| Flask dev server | port 5051 | not started |
| React dev server | `127.0.0.1:5178` | not started |

### 3.4 Data and secrets

- No `.env` file in either project; only `config_example.1env` and `.nvmrc`/
  `.npmrc`-class files exist.
- No local Flask database (`instance/` absent, no `*.db`), so no local data
  exists and no production database is reachable from this machine.
- `config.py` exists on disk inside the backend (gitignored). Its values were
  never printed or copied into documentation.
- Tracked `app/static/uploads/` contains real profile photos, digital ID images
  and an election passport — treated as sensitive from here on.

---

## 4. Phase 0 deliverables

- `INTEGRATION_AUDIT.md` — repository and runtime map, Git topology, entry
  points, blueprint prefixes, database configuration (no values), local-only
  artefacts, baseline risks, recorded uncertainty, acceptance criteria.
- `INTEGRATION_PROGRESS.md` — this file.

Existing documentation reviewed and left unchanged: `current-website/DIgital-
Club/README.md`, `new-website-design/docs/05-media-assets.md`,
`new-website-design/docs/06-kiutbot.md`.

---

## 5. Phase 0 report

- **Status:** Complete
- **Scope authorized:** Phase 0 only — read-only orientation and baseline
  documentation.
- **Work completed:** Located and mapped both project roots; documented the
  nested-repository topology (gitlink, no `.gitmodules`); recorded the exact
  pre-existing working-tree state; confirmed Flask and React entry points,
  package managers, run scripts, ports and URL prefixes; recorded database,
  upload and environment-file configuration without exposing values; identified
  existing documentation; listed baseline risks and open uncertainties.
- **Files created:** `INTEGRATION_AUDIT.md`, `INTEGRATION_PROGRESS.md` (both at
  the parent repository root).
- **Files modified:** None.
- **Files deleted:** None.
- **Database impact:** None. No database was created, connected, migrated,
  seeded, reset or queried.
- **Commands executed:** `git rev-parse --abbrev-ref HEAD`, `git remote -v`,
  `git status --porcelain`, `git status --porcelain --ignored`, `git ls-files`,
  `git ls-files -s current-website/DIgital-Club`, `find`, `ls`, `wc -l`,
  `node --version`, `npm --version`, `python --version`, `uv --version`, plus
  file reads of `main.py`, `app/__init__.py`, `pyproject.toml`, `package.json`,
  `vite.config.ts`, `.gitignore` files, `docker-compose.yml`, `README.md` and
  the two `new-website-design/docs` files.
- **Tests performed:** None applicable. Nothing was started or built, so there
  is no runtime verification in this phase.
- **Security considerations:** No secrets were read into or printed from
  documentation; the legacy `config.py`, tracked uploads with personal imagery,
  and startup-created super-admin behaviour are recorded as risks requiring
  attention in Phase 1. Nothing was remediated.
- **Demo-data findings:** Not audited in this phase. One orientation-level
  observation is recorded in the audit: the original Jinja homepage contains
  hardcoded hero statistics (`200+`, `50+`, `100+`) whose source is untraced.
- **Outstanding issues:** Local Flask runtime and database do not exist yet
  (Phase 4); Python/Node versions differ from the project pins; `uv` is absent;
  the master plan file is not stored in the repository.
- **Risks and decisions needed:** (a) confirm whether the nested repository is
  intentional and how backend changes should be committed; (b) provide or
  approve the source of a local database (schema-only local SQLite vs. a safe
  copy) for later phases; (c) approve removal of the legacy local `config.py` at
  some later point; (d) approve copying `INTEGRATION_MASTER_PLAN.md` into the
  repository if you want it versioned.
- **Acceptance criteria:** Passed — both roots identified, working-tree state
  documented, entry points identified, no application file, database record or
  Git configuration changed, no dependency installed.
- **Next phase:** Phase 1 — Complete Flask backend and data-source audit.

---

---

## 6. Phase 1 report

- **Status:** Complete
- **Scope authorized:** Phase 1 only — complete Flask backend and data-source
  audit, read-only, with the seven stated precautions.
- **Work completed:**
  - Mapped all 59 SQLAlchemy models by domain, with relationships, constraints
    and status fields.
  - Enumerated all 255 route decorators with their guards (public, login,
    admin, quizmaster) and grouped them by blueprint and URL prefix.
  - Documented the business rules that the integration must preserve
    (approval workflow, course/year validation, Turnstile requirement,
    membership validity, points and trophies, competition eligibility and
    scoring, quiz attempt limits, election phases and vote uniqueness, team
    approval, session-report approval).
  - Documented authentication and account lifecycle: session/remember-me
    settings, cookie attributes, password-reset tokens, role strings, the
    startup super-admin, and the digital-ID side effect at login.
  - Enumerated the complete existing JSON surface (10 ad-hoc endpoints) and
    confirmed no versioned API, token auth, CORS or JSON error contract exists.
  - Separated database-backed content from hardcoded content: the homepage
    hero counters `200+ / 50+ / 100+` are static template markup, and the
    homepage "featured projects" query does not filter `is_public`.
  - Catalogued external services and background work by environment-variable
    **name** only.
  - Recorded eight security observations, including the absence of any CSRF
    protection, the predictable `SECRET_KEY` fallback, and the hardcoded
    super-admin password.
  - Produced the capability matrix: what the backend already supports versus
    what needs new endpoints.
- **Files created:** None.
- **Files modified:** `INTEGRATION_AUDIT.md` (new §9 Phase 1, §10 pending list
  renumbered), `INTEGRATION_PROGRESS.md` (this file).
- **Files deleted:** None.
- **Database impact:** None. No connection string was used, no database was
  created or opened, no migration or startup DDL ran, no default super-admin
  was created, no row was read or written.
- **Commands executed:** read-only file reads plus `wc -l`, `ls`,
  `grep`/`sed` counts over route decorators, model classes, `jsonify` calls,
  template variables, environment-variable names and hero-stat markup.
  `python`/`flask` were never invoked and the application was never imported.
- **Tests performed:** None applicable — a static audit has no runtime to test.
  Nothing was started or built.
- **Security considerations:** No secret value was read, printed or copied; only
  variable *names* appear in the audit. `config.py`, any `.env`, uploads and
  personal records were not opened. The audit records — without fixing — that
  the backend has **no CSRF protection**, a predictable `SECRET_KEY` fallback,
  a hardcoded `admin123` super-admin, publicly served personal uploads, an
  e-mail-returning member search, and debug mode on direct run. These are
  constraints for Phase 3, not changes made now.
- **Demo-data findings:** No demo/seed data was inserted. The original site's
  fabricated-content risk is concentrated in the hardcoded hero counters
  (`200+ / 50+ / 100+`) and the static About/Contact copy; all other public
  pages read real rows. `/contact` accepts a message and persists nothing.
- **Outstanding issues:** No local runtime or database yet (Phase 4); no CSRF
  layer to preserve, so one must be designed; no automated tests; the backend
  lives in a nested repository whose commit flow is still undecided; `config.py`
  removal and the hardcoded super-admin remain open decisions.
- **Risks and decisions needed:** (a) choose the Phase 3 session strategy
  (same-origin cookie session vs. a CSRF-protected cookie flow) given there is
  no existing CSRF implementation; (b) decide whether the hardcoded super-admin
  bootstrap stays, is env-driven, or is disabled for local runs; (c) decide
  whether `/verify-id` and member search keep their current exposure; (d)
  confirm how personal uploads should be served once a JSON API exists.
- **Acceptance criteria:** Passed — models, routes, permissions, business
  logic, auth lifecycle, content sources and API gaps are documented; the phase
  was entirely read-only and no database or startup path was touched.
- **Next phase:** Phase 2 — Complete React frontend, feature and demo-data
  audit. Not started.

---

## 7. Phase 2 report

- **Status:** Complete
- **Scope authorized:** Phase 2 only — complete React frontend, feature and
  demo-data audit, read-only, with the ten stated requirements.
- **Work completed:**
  - Inventoried the whole React application: 140 source files (~31,900 lines),
    111 route elements across public (23), auth (6), member (38), admin (41)
    and quizmaster (3) areas, 75 page modules and 25 UI primitives.
  - Classified 44 distinct features as static, client-interactive, simulated or
    locally persisted, and documented what each one actually does.
  - Catalogued every fabricated record: 40+ exports in `data/demo.ts`
    (12 demo people, notifications, rewards, projects, events, sessions,
    competitions, election and candidates, teams, rankings, quizzes, payments,
    finance, RSVPs, subscribers, messages, technologies, gallery, blogs, news,
    sponsors, audit log, admin profile, settings) plus derived admin aliases.
  - Separated published-site copy in `data/site.ts` from database-backed
    content, flagging the `200+/50+/100+` counters, skill counts, project
    metrics and unverified testimonials/partners/achievements.
  - Audited every public page, not only dashboards, and traced each displayed
    item to `demo.ts`, `site.ts`, the social store or a hardcoded literal.
  - Identified three public surfaces that publish fabricated people or records:
    seeded member profiles at `/members/:username`, the invented live election
    at `/elections/1`, and the verification of non-existent member
    `DC-2026-0014`.
  - Produced the React-to-Flask mapping matrix and a 25-item list of missing
    backend capabilities.
  - Documented 14 authentication and session findings, including that any
    password is accepted, role is inferred from the e-mail string, demo
    buttons grant admin access, the session is editable `localStorage`, and
    route guards exist only in the browser.
- **Files created:** None (one scratch file used for the append was deleted).
- **Files modified:** `INTEGRATION_AUDIT.md` (new §11 Phase 2; §10 pending list
  updated), `INTEGRATION_PROGRESS.md` (this file).
- **Files deleted:** None.
- **Database impact:** None. No database was opened or created, no migration
  ran, no row was read or written.
- **Commands executed:** read-only file reads plus `find`, `wc`, `grep`/`sed`
  counts and import scans. `npm`, `vite`, `tsc` and the Flask app were never
  invoked; no dependency was installed; no browser was opened.
- **Tests performed:** None applicable — a static audit has no runtime to test.
  Nothing was built or started.
- **Security considerations:** No secret value was read or printed. Only the
  fabricated demo identities and published club contact details named in the
  source appear in the audit; no `.env`, `config.py`, uploads, database or real
  member record was opened. Findings are recorded, not fixed: client-side-only
  authorization, editable session storage, ignored passwords, absent CSRF and
  Turnstile, public fabricated profiles and personal data in browser storage.
- **Demo-data findings:** The frontend is entirely demo data. There is no HTTP
  call to Flask anywhere. Every dashboard, table, chart, badge count and form
  outcome either renders a constant or mutates component state / `localStorage`.
  `DemoNotice` now renders nothing, so most screens no longer disclose that the
  records are fictional.
- **Outstanding issues:** No API client, auth handshake, loading/error state or
  real server data anywhere; member pages show `demoMember` instead of the
  signed-in user; 12 fabricated people are publicly addressable; badge counts
  are constants; the quiz result is hardcoded at 88 %.
- **Risks and decisions needed:** (a) which public copy stays editorial and
  which becomes database-driven; (b) whether the `200+/50+/100+` counters are
  replaced with real counts or removed; (c) how the social graph (follow, block,
  report, visibility) is modelled server-side or dropped; (d) whether public
  member profiles remain a product feature; (e) how demo data is retired
  progressively without breaking screens mid-migration.
- **Acceptance criteria:** Passed — the full frontend, every public page, every
  demo/static source, every interaction and every authentication assumption are
  documented; the phase was read-only and preserved all existing files.
- **Next phase:** Phase 3 — Integration architecture and API contract proposal.
  Not started.

---

---

## 8. Phase 3 report

- **Status:** Complete
- **Scope authorized:** Phase 3 only — integration architecture and API contract
  proposal, documentation only, with eleven requirements and six phase
  restrictions.
- **Work completed:**
  - Re-checked three Phase 2 claims against the source before designing: the
    public demo profiles (`/members/:username` is inside `PublicLayout`; 12
    seeded profiles; guests get full access to public ones), the identity
    defect (22 files reference `demoMember`; 14 in `pages/member/`, plus three
    admin pages and `VerifyId`), and the invented election (`/elections` shows
    a correct empty state; the fabricated record is published by
    `/elections/:id` for id 1).
  - Corrected one overstatement in §11.4: only Amina Juma's profile carries a
    full biography, skills and projects; the other eleven carry identity,
    course, year, points and a "joined" entry. Severity unchanged, description
    now exact. Also corrected two "15 modules" counts to 14.
  - Wrote the architecture: same-origin topology with a Vite/edge proxy, one
    Flask app, one database, one auth system, transport added without
    re-implementing business rules.
  - Defined the session and CSRF strategy, including the missing CSRF layer:
    Flask-Login cookie retained, `SECRET_KEY` fail-closed, `Secure`/`HttpOnly`
    cookies in production, double-submit token bound to the session delivered
    by `GET /api/v1/auth/csrf`, `X-CSRF-Token` header on mutations, Origin
    check, staged rollout so existing Jinja forms are not broken.
  - Defined public/member/admin separation as path tiers plus serializers plus
    a field matrix, with "404 instead of 403" for resources the caller may not
    know exist.
  - Specified the complete contract: 8 auth endpoints, `/me`, 23 public
    endpoints, 51 member endpoints, the admin surface by resource group, and
    quizmaster authoring — with methods, payloads, guards, ownership rules,
    error codes and the existing handler each one must reuse.
  - Evaluated all 25 proposed missing capabilities individually (Necessary /
    Conditional / Defer) rather than adopting them: the social graph, audit log
    and real-time delivery are deferred with reasons; public profiles depend on
    decision D1; newsletter sending depends on provider/consent confirmation.
  - Documented the per-surface demo-data replacement path and the point at
    which each `demo*` import can be deleted.
  - Covered upload security (magic-byte allow-list, size caps, storage outside
    the web root, authorized serving, EXIF stripping), personal-data rules,
    pagination/filtering/validation conventions and per-scope rate limits.
  - Specified two-repository change management: backend commits inside the
    nested repository, no staging of the gitlink from the parent, no
    `.gitmodules`, no submodule commands, and explicit reporting of the
    pointer state.
  - Recorded 16 unresolved business decisions (D1–D16) and 15 technical risks
    (R1–R15) instead of assuming answers, plus the dependency order for
    Phases 4–11.
- **Files created:** None (three scratch part-files were concatenated into the
  audit and deleted).
- **Files modified:** `INTEGRATION_AUDIT.md` (new §12; §10 pending list updated;
  two precision corrections in §11.4/§11.5/§11.8), `INTEGRATION_PROGRESS.md`
  (this file).
- **Files deleted:** None (only the three scratch `.tmp.md` files created by
  this phase).
- **Database impact:** None. No database was created, connected, migrated,
  seeded or queried.
- **Commands executed:** read-only file reads and `grep`/`wc` counts, plus
  `cat`/`rm` on this phase's own scratch files.
- **Tests performed:** None applicable — no code was written and nothing was
  started or built.
- **Security considerations:** No secret value was read or printed; the contract
  references environment-variable names only. The design closes, by
  construction, the leaks Phase 1 and 2 recorded: member search e-mail
  disclosure, public `/static/uploads` serving of personal imagery, `200+/50+/
  100+` claims, and CSRF-less state changes. No application file was changed,
  so nothing was remediated in this phase.
- **Demo-data findings:** The replacement path is specified per surface
  (§12.11), including the three fabricated public surfaces. The rule carried
  forward: an endpoint returns an empty result or 404, never a demo fallback.
- **Outstanding issues:** Phase 4 environment does not exist yet; D1, D2, D4,
  D5 and D6 should be answered before Phase 4 configures Turnstile and the
  database; migration tooling for additive columns is unconfirmed and must not
  be assumed in Phase 4.
- **Risks and decisions needed:** 16 decisions and 15 risks are listed in
  §12.18 with defaults. The highest-impact ones are the CSRF rollout to the
  existing HTML forms (R1/D5), the unset-`SECRET_KEY` fallback (R2), the static
  uploads path (R4/R7), the profile-completion hook that must not apply to API
  reads (R7), and the nested-repository change flow (R11/§12.16).
- **Acceptance criteria:** Passed — see §12.19. The phase was documentation
  only: no endpoint created, no application code changed, no dependency
  installed, no database touched, neither app started, no Git configuration or
  commit touched, and the pre-existing worktree was preserved.
- **Next phase:** Phase 4 — Safe local development and integration environment.
  Not started.

---

**STOP — Phase 3 is finished. No work from Phase 4 has been started. Awaiting
explicit approval to begin Phase 4.**
---

## 9. Phase 4 report

**Phase:** 4 — Local development environment and database preparation.
**Status:** Complete. **Date:** 2026-11-25.

### 9.1 Environment configuration and compatibility findings

- Python was the blocking issue: `.python-version` pins `3.13` and
  `pyproject.toml` requires `>=3.13`, but the host only had 3.14 and 3.15, and
  `uv` was absent. `uv` was installed into an untracked tool venv at
  `local-dev/.tools`; `uv sync --frozen` downloaded CPython **3.13.18** and built
  `current-website/DIgital-Club/.venv` from the committed `uv.lock`. No declared
  dependency and no lockfile entry was changed or upgraded.
- The first sync failed (`Access is denied` removing `.venv/Scripts`) because uv
  was running from the venv it had to replace. Moving the tool outside the
  backend repository fixed the cause; the throwaway venv was removed.
- Node.js is v26.13.1 while `.nvmrc` pins 20, and npm is 11.20.0. The existing
  install, `npm run typecheck` and the Vite 5.4.21 dev server were exercised on
  v26 and work. Nothing was reinstalled, so versions cannot have drifted; the
  mismatch is recorded as a residual risk (R18) rather than "fixed" by editing
  the project's Node pin.
- Runtime imports (Flask, SQLAlchemy, Flask-Login, Flask-Migrate, Pillow, qrcode,
  reportlab, psycopg2) load successfully. `cairosvg` is imported lazily and its
  external cairo dependency was not exercised.

### 9.2 Files created or modified

Created (all local/untracked or gitignored):

- `current-website/DIgital-Club/.venv/` — Python 3.13.18, gitignored.
- `current-website/DIgital-Club/.env` — gitignored local config (generated
  `SECRET_KEY`, SQLite URL, cookie flags, Turnstile test keys).
- `current-website/DIgital-Club/instance/dev_local.db` — gitignored schema-only
  database.
- `local-dev/backend.env.example` — secret-free template.
- `local-dev/init_local_db.py` — guarded local schema bootstrap.
- `local-dev/start-backend.sh`, `local-dev/start-frontend.sh` — loopback startup.
- `local-dev/README.md` — runbook.
- `local-dev/.tools/` — uv tool venv (outside the backend repo).
- `local-dev/backend-dev.log`, `local-dev/frontend-dev.log` — verification logs.

Modified:

- `new-website-design/vite.config.ts` — dev-only proxy for `/api`, `/healthz`,
  `/static/uploads`; no build-output change.
- `INTEGRATION_AUDIT.md` — decisions D1/D2/D4/D5/D6 incorporated in §12.4,
  §12.11, §12.12, §12.18; R10 updated; R16/R17/R18 added; new §13; §10 and §12.3
  marked up to date.
- `INTEGRATION_PROGRESS.md` — this file (table, approval history, this report).

No application source file was edited and no template was touched.

### 9.3 Database preparation and verification

- `flask db upgrade` was inspected first and then attempted once against an empty
  file: it **cannot** initialize this repository's database. The first revision
  (`b033ca5044ab`, `down_revision = None`) is an `ALTER TABLE user` and no
  revision creates the original tables, so it fails with
  `NoSuchTableError: user`. The partial file was deleted; the finding is recorded
  as R10/R16 and was not disguised.
- `local-dev/init_local_db.py` builds the schema from the models and stamps
  Alembic at head. It only accepts `sqlite:///` URLs, refuses paths outside the
  backend repository, is idempotent and creates no rows.
- Verified: 60 tables (59 models + `alembic_version`), `db current` = `db heads` =
  `c20260703100000`, `user` = 0 rows, `member` = 0 rows. No seed, demo, financial
  or administrative records exist.
- `create_app()`'s startup "compatibility migrations" were read before use: they
  check table/column existence and no-op on an empty or current schema, so the
  clean startup was safe. No migration or startup routine with a destructive
  side effect was executed.

### 9.4 Local React–Flask connection

`vite.config.ts` proxies `/api`, `/healthz` and `/static/uploads` to
`http://127.0.0.1:5051` with `changeOrigin: false`, so the browser stays on
`http://127.0.0.1:5178` and Host/Origin match the app origin the future CSRF and
Origin checks will validate. No CORS is configured. Verified: `5178/` → 200 (Vite),
`5178/healthz` → 200 `{"status":"ok"}` served by Werkzeug, and
`5178/api/v1/ping` → 404 JSON from Flask, proving the proxy without inventing an
endpoint.

### 9.5 Authentication, CSRF and Turnstile configuration

- `SECRET_KEY` is a locally generated 64-hex value in the gitignored `.env`; the
  code fallback is confirmed unused.
- Cookies: `HTTPONLY=True`, `SAMESITE=Lax`, `REMEMBER_COOKIE_SECURE=0` **only**
  because local development is HTTP on loopback; production keeps `1`.
- Turnstile runs on Cloudflare's published test keys
  (`1x00000000000000000000AA` + always-passing test secret) in `.env` only. The
  login page serves the test site key; no bypass flag or auth stub exists.
- CSRF remains genuinely absent (`CSRFProtect` never initialised). It was not
  simulated, disabled or hidden; the approved application-wide rollout (D5) is
  Phase 5 work and §12.4 now states it as binding.
- `main.py` is deliberately not used for startup because it creates the hardcoded
  `admin@digitalclub.kiut.ac.tz / admin123` account. The app factory starts the
  same application with zero accounts.

### 9.6 Security checks and remaining risks

Checked: no accounts created (`user=0`, `member=0` after boot); no production DSN
present; `.env`/`.venv`/`instance/` confirmed ignored; backend repository clean on
`master`; parent baseline preserved plus only the intended `vite.config.ts`
change and untracked `local-dev/`; secret values never printed; all existing
Jinja pages return 200 on the empty schema.

Open risks: R16 missing Alembic baseline (local bootstrap only; add a baseline
before authoring new revisions), R17 `SESSION_COOKIE_SECURE` not env-configurable,
R2 `SECRET_KEY` fallback still in code, R3 hardcoded super-admin still in
`main.py`, R18 Node 26 vs `.nvmrc` 20. Unverified by choice: Turnstile
registration/login (would create accounts), CSRF-protected requests (no layer
yet), uploads, PDF/ID generation, e-mail/SMS/Redis/Celery paths, and any API
endpoint.

### 9.7 Commands to start both applications locally

```bash
# Terminal 1
bash local-dev/start-backend.sh      # Flask → http://127.0.0.1:5051

# Terminal 2
bash local-dev/start-frontend.sh     # Vite  → http://127.0.0.1:5178
```

Database: `current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/init_local_db.py`.
Reset: stop the backend, delete `instance/dev_local.db`, re-run the bootstrap.
Full runbook: `local-dev/README.md`.

### 9.8 Test results and outstanding issues

Passed: `uv sync --frozen`; runtime imports; schema bootstrap (60 tables, stamped,
0 rows); `db current` = `db heads`; backend listener + `/healthz` 200; 257
registered routes; six existing pages 200 with no traceback; Turnstile test key
present in login HTML; Vite ready in 496 ms; proxied `/healthz` 200 and
`/api/v1/ping` 404 from Flask; `npm run typecheck` exit 0 before and after the
proxy change; both repositories verified.

Outstanding: all of §9.6's open risks, plus the fact that no authenticated flow,
CSRF request, upload, PDF/ID or API endpoint could be tested because those
capabilities do not exist yet — which is exactly the boundary of this phase.

### 9.9 Acceptance

All eight Phase 4 objectives and all critical restrictions are met; the detailed
criterion-by-criterion table is §13.11 of `INTEGRATION_AUDIT.md`. No API,
authentication integration, React data replacement or social-graph work was
started. No Git configuration, staging, commit, push or remote change was made.

**Next phase:** Phase 5 — Flask API foundation, not started.

---

---

## 10. Phase 5 report — Flask API foundation and security infrastructure

### 10.1 What was built

- **API foundation:** `app/api/` blueprint at `/api/v1`, separate from every
  Jinja blueprint, with one response envelope, one error vocabulary, reusable
  validation, request ids and `no-store` on all API responses.
- **Endpoints:** `GET /health`, `GET /ready`, `GET /diagnostics` (admin),
  `GET /auth/csrf`, `POST /auth/csrf/verify`, `GET /me`. Nothing else — no
  business endpoints exist yet.
- **CSRF, application-wide (D5):** `CSRFProtect` enabled and a session-bound
  token added to all **135** POST forms across **81** templates; `csrf.js`
  handles late-rendered forms and `fetch`/XHR writes; logout converted to POST;
  an Origin/Referer gate runs as a second check; API rejections are
  `403 CSRF_TOKEN_INVALID`.
- **Auth boundaries:** `api_login_required` and `api_role_required`, both
  server-side, over the existing Flask-Login session. No JWT, no second identity
  store, no browser-stored token.
- **Security infrastructure:** fail-closed `SECRET_KEY` outside development,
  `SESSION_COOKIE_SECURE` now configurable (secure by default), per-endpoint
  rate limiting with `429`/`Retry-After`, and error responses that never expose
  exception text or database details.
- **Fixed a latent bug:** a deactivated account looked *anonymous* to
  Flask-Login (because `is_active` drives `is_authenticated`), so the old
  inactive-account gate never fired. It now clears the session and returns
  `403 ACCOUNT_INACTIVE` for the API.

### 10.2 Files

Created: `app/api/{__init__,responses,errors,validation,ratelimit,auth,health,me}.py`,
`app/security_config.py`, `app/static/js/csrf.js`,
`app/templates/errors/csrf.html`, `API_DOCUMENTATION.md`,
`local-dev/{add_csrf_tokens.py,test_phase5_api.py}`.

Modified: `app/__init__.py`, `app/routes/auth.py`, 81 templates (4 base layouts
plus one hidden input in each POST form), `local-dev/README.md`,
`local-dev/backend.env.example`, and the two integration documents.

No `new-website-design/` file was required: the Phase 4 proxy already makes the
API same-origin.

### 10.3 Verification

| Check | Result |
| --- | --- |
| `local-dev/test_phase5_api.py` (isolated temp DB) | **33 tests, all pass** |
| Local database untouched by the suite | sha256 identical before/after; 0 rows in `user`, `member`, `newsletter` |
| All templates compile | 144 templates through Jinja |
| Backend boots | Flask on `127.0.0.1:5051`, `/healthz` 200 |
| `/api/v1/health` | 200 with `X-Request-ID`, `nosniff`, `no-store` |
| `/api/v1/me` anonymous | 401 `AUTH_REQUIRED` |
| `/api/v1/auth/csrf` | 200, `no-store`, session-bound token |
| `POST /auth/csrf/verify` | 403 missing, 403 invalid, 200 valid |
| Foreign `Origin` with a valid token | 403 `ORIGIN_NOT_ALLOWED` |
| Existing form POST | 400 without token, success with token |
| Login page | renders a token field; `/events` 200 |
| Production start without `SECRET_KEY` | subprocess exits non-zero |

Not verified, and reported as such: browser login/registration end to end (needs
an account), uploads, PDF/ID generation, e-mail/SMS/Redis/Celery paths, and
multi-worker rate-limit behaviour.

One live smoke test inserted a newsletter row; it was deleted in the same run and
every table is back to 0 rows. The file hash differs only by SQLite page
allocation — schema and data are unchanged (documented in §14.8 of the audit).

### 10.4 Open items carried forward

- **R16** — Alembic still has no baseline `CREATE TABLE` revision. No migration
  may be authored until it exists. Nothing in Phase 5 needed one.
- **R19** — API rate limiting is in-memory and per worker; Redis is required
  before running more than one worker.
- **R20** — a new form that omits `{{ csrf_token() }}` will now fail with 400
  (intended, but it makes template review mandatory).
- `SESSION_COOKIE_NAME` is still the Flask default; renaming it to `kiut_session`
  belongs with the Phase 6 auth cutover.
- Turnstile is still only key-injected; no API endpoint consumes
  `turnstile_token` yet.

### 10.5 Repository state

Backend (nested, uncommitted): 6 pre-existing modified files plus 77 tokenised
templates, and 4 new paths (`app/api/`, `app/security_config.py`,
`app/static/js/csrf.js`, `app/templates/errors/`). Parent: `API_DOCUMENTATION.md`
and `local-dev/` updates; its pre-existing uncommitted frontend work is
untouched. Nothing was staged, committed, pushed or deployed.

**Next phase:** Phase 6 — authentication and account lifecycle integration, not
started at the time of this section.

---

## 11. Phase 6 — Authentication and account lifecycle integration

Executed 2026-11-26 on the instruction "execute next phase from master prompt of
phases".

### 11.1 Scope basis (and one gap)

`KIUT_DIGITAL_CLUB_INTEGRATION_MASTER_PLAN.md` has never been present in the
repository — this file has recorded that since Phase 0. The phase was therefore
delivered from the two approved sources that define it:

- the phase table above ("Authentication and account lifecycle integration"),
- `INTEGRATION_AUDIT.md` §11.10 P1 (`Phase 6 auth: real login/logout/session/
  register/approval/reset; delete demo accounts and demo buttons`) and the
  endpoint contract §12.9.1 (AU2–AU7) and §12.9.2 (ME1).

Scope delivered: **AU2–AU7 + ME1 + the React cutover + removal of the demo
identity**. `POST /me/password` (AU8) was **not** implemented: the phase table
lists login/logout/session/register/approval/reset, and AU8's "invalidate other
sessions" needs a session-epoch column that no approved decision covers. It is
recorded as an open item rather than guessed at.

### 11.2 Backend

New files:

- `app/services/accounts.py` — the shared account rules: e-mail lookup,
  `login_block()` (inactive before approval, approval only for students),
  `account_status()`, approval-mode reading, and `create_student_account()`.
- `app/api/accounts.py` — `POST /auth/login`, `POST /auth/logout`,
  `POST /auth/register`, `GET /auth/approval-status`,
  `POST /auth/password/forgot`, `POST /auth/password/reset`.

Changed:

- `app/api/me.py` — ME1 shape (`user`, `member`, `profile_completion`,
  `capabilities`, `meta.unread_notifications`) plus a shared `build_me_payload()`
  reused by login.
- `app/api/__init__.py` — registers the new module.
- `app/__init__.py` — six new rate-limit buckets; `SESSION_COOKIE_NAME` is now
  `kiut_session` (the Phase 5 open item that "belongs with the Phase 6 auth
  cutover"). One-time effect: anyone signed in before this change is signed out
  once.
- `app/routes/auth.py` — account creation now calls
  `create_student_account()` instead of duplicating the `User`/`Member` writes,
  and the HTML login clears the session before `login_user` (session fixation,
  audit R15). Flash messages, validation order and redirects are unchanged.

Security decisions:

- Identity is the existing Flask-Login cookie session. No JWT, no second store,
  nothing written to `localStorage` or `sessionStorage`.
- `session.clear()` before `login_user`; the login response returns the token for
  the new session, so the anonymous token cannot be reused.
- Logout keeps Flask-Login's `_remember = "clear"` mark while emptying the rest of
  the session, so the remember-me cookie is actually deleted.
- Turnstile stays mandatory. Unconfigured keys **refuse** the request instead of
  allowing it (unchanged HTML behaviour), and the check calls the existing
  `app.routes.auth._verify_turnstile` rather than re-implementing siteverify.
- Password-reset links point at `<request origin>/auth/reset-password/<token>`.
  Behind the Vite proxy that origin is the SPA, and in production Flask and the
  SPA share one origin, so the same token works on both surfaces.
- `GET /auth/approval-status` returns a status only (never a name, phone or member
  number), and the anonymous lookup is rate-limited to 15/min.

### 11.3 Frontend

New files:

- `src/lib/api.ts` — the single `/api/v1` client: in-memory CSRF token, same-origin
  credentials, envelope parsing, typed `ApiError`, one retry on
  `CSRF_TOKEN_INVALID`.
- `src/components/auth/Turnstile.tsx` — explicit-render widget with a reset signal
  (a token is single-use, so a failed submit obtains a fresh one).

Changed:

- `src/context/AuthContext.tsx` — rewritten around `GET /me`. `status:
  'loading' | 'ready'`, `login/register/logout/refresh`, server-derived
  `capabilities`; the demo accounts, the e-mail-substring role guess and the
  `kiut-demo-session` storage key are gone (the key is deleted on load).
- `src/App.tsx` — `RequireRole` waits for the session instead of redirecting
  during the first `/me` request.
- `src/pages/auth/{Login,Register,ForgotPassword,ResetPassword,ApprovalPending}.tsx`
  — wired to the API, with per-code messages, field errors from `422 details`,
  Turnstile gating, and a real "check approval status" action.

### 11.4 Verification

Backend, isolated temp database (`local-dev/test_phase6_auth.py`): **39 tests
pass**. Covers login success/failure/approval/inactive/admin-without-member,
CSRF rejection, Turnstile failure and unconfigured refusal, validation details,
login rate limiting, logout (204 + session gone), session fixation, registration
(pending, auto-approval, duplicate, bad course/year, short password, no session),
approval-status (self, anonymous, rejected, unknown, missing e-mail), forgot
(uniform body, one mail), reset (works, invalid token, short password), the ME1
projection and its no-contact-details rule, plus the Jinja login/registration
regression after account creation moved into the service. The Phase 5 suite still
passes (**33 tests**).

Browser, against a seeded disposable database (`local-dev/seed_phase6_browser.py`):
sign-in → `/member` with the real name in the header; refresh keeps the session;
`/me` 200; sign-out → `/me` 401 and the header returns to signed out; `/member`
while signed out redirects to the login page; wrong password shows the mapped
message and re-enables the button via a fresh Turnstile token; pending account →
approval page with the e-mail and status; "check status" reports pending; admin
sign-in lands on `/admin` with `admin.panel`; registration → approval page with
the new address pending; password reset from a real token → "Password updated",
and the new password gets past credentials and stops at the approval gate.

`npm run typecheck` and `npm run build` pass. The preserved
`instance/dev_local.db` was checked before and after and still has **0 rows** in
`user` and `member`; the browser database and its uploads were deleted and the
normal backend was restarted on the default database.

### 11.5 Open items carried forward

- **AU8 `POST /me/password`** — not built (see §11.1). The SPA's change-password
  page is still demo data.
- **ME1 aggregates** — `points`, `rank`, `tier`, `membership` and
  `digital_id.status` were left out; they belong to the member-read work that
  depends on this phase.
- **R16, R19** unchanged: no Alembic baseline, rate limits are per process.
- Turnstile site key for the SPA is build-time (`VITE_TURNSTILE_SITE_KEY`); local
  development falls back to Cloudflare's public always-pass **test** key. A
  production build must set a real key, and an empty key blocks sign-in.
- The member/admin screens still read `demoMember` etc. (Phase 8), and member
  pages still show prototype numbers such as the hard-coded notification badges.

### 11.6 Repository state

Backend (nested, uncommitted): 3 new files (`app/services/`, `app/api/accounts.py`)
plus edits to `app/__init__.py`, `app/api/__init__.py`, `app/api/me.py` and
`app/routes/auth.py`. Parent: `API_DOCUMENTATION.md`, `INTEGRATION_PROGRESS.md`,
`local-dev/` (new suite, seed script, README), and the React auth files above.
Nothing was staged, committed, pushed or deployed.

---

## 12. Phase 7 — Public website data integration

Executed 2026-11-26 on the instruction "I authorize Phase 7 only — public website
data integration … then stop and report".

### 12.1 Scope and contract

The phase table row 7 plus `INTEGRATION_AUDIT.md` §12.9.3 (PU1–PU23).
`KIUT_DIGITAL_CLUB_INTEGRATION_MASTER_PLAN.md` is still not in the repository;
the audit contract remains the source of truth.

Delivered: all 23 public read endpoints, two public writes (event RSVP and
newsletter), a shared HTML sanitiser, and the React public pages rewired from
prototype demo arrays to those endpoints while keeping their layout and
responsive design.

### 12.2 Backend

- New `app/api/public.py` (23 routes) registered from `app/api/__init__.py`;
  `create_app()` reports 23 `/api/v1/public` rules.
- New `app/api/sanitize.py`: allow-list parser (`sanitize_html`) plus
  `plain_text`; blog bodies are stored HTML and are sanitised on read, so the SPA
  renders `body_html_sanitised` only.
- No schema change, no migration, no new column: `public_slug` is derived from
  the member's name and id, `id_valid_until` from the latest membership payment.
- Only published rows: news, blogs, `Project.is_public`, and events whose
  `target_audience` is `everyone`. Drafts never appear, including via PU22.
- Cache headers per route (30 s–300 s); `verify-id` is `no-store`.
- New rate-limit buckets: `public_read` 180/min, `public_stats` 60/min,
  `public_search` 60/min, `public_rsvp` 10/hour, `public_newsletter` 5/hour,
  `verify_id` 20/min.
- PU9/PU21 still pass through CSRF, Origin checks, validation and Turnstile,
  and deduplicate by e-mail.

### 12.3 Frontend

- New `src/lib/publicApi.ts` (typed PU client) and `src/lib/usePublicData.ts`
  (loading/error/data hook). `api.ts` now exports `apiRequest` and an `envelope`
  option so the public client shares transport, error handling and the retry.
- Rewritten to real data with explicit loading, empty and error states, and no
  demo fallback: Home, News, Blogs, Events, EventRsvp, Projects, Gallery,
  Leaders, Topics, Members, MemberProfile, Elections, VerifyId, Contact, About.
- Removed the prototype record arrays and testimonial people from public pages.
  Editorial copy stays in `src/data/site.ts` (about text, benefits, learning
  paths, partners, achievements, contact constants) because it has no endpoint.
- `Competition` has no public endpoint, so the fabricated competition archive is
  no longer rendered; the page explains that competition records are member-only.

### 12.4 Verification

| Check | Result |
| --- | --- |
| `local-dev/test_phase7_public.py` | **41 passed** (isolated temp SQLite) |
| `local-dev/test_phase5_api.py` | **33 passed** |
| `local-dev/test_phase6_auth.py` | **39 passed** |
| `npm run typecheck` | passed |
| `npm run build` | passed (282 modules) |
| Live stack | Flask 5051 + Vite 5178 running; every `/api/v1/public/*` route returns 200 through the Vite proxy on the schema-only local database |
| Browser spot-check | Home renders real zero stats and empty states; `/projects` and `/members` render empty states; `/verify-id/DC-2026-0014` reports no matching record (no demo identity) |

With a schema-only database (`instance/dev_local.db`, 0 rows) the pages correctly
show empty states rather than prototype records. Populated-content rendering was
not exercised against the real database; the 41-test suite covers the populated
shapes with seeded rows.

### 12.5 Open items carried forward

- **R16** — still no Alembic baseline revision; Phase 7 needed no migration.
- **R19** — rate limits remain in-memory and per worker.
- `Competition` has no public endpoint; the archive stays member-only until one
  exists.
- `SystemSettings` keys consumed by PU20/PU23 fall back to published-site
  defaults when unset; an admin editor for them is Phase 9 work.
- AU8 `POST /me/password` and the ME1 aggregates remain outstanding (Phase 8).

### 12.6 Repository state

Backend (nested, uncommitted): new `app/api/public.py`, `app/api/sanitize.py`,
edits to `app/api/__init__.py` and `app/__init__.py`. Parent: new
`new-website-design/src/lib/publicApi.ts`, `usePublicData.ts`, edits to `api.ts`
and 15 public pages, plus `API_DOCUMENTATION.md`, `INTEGRATION_PROGRESS.md`,
`local-dev/test_phase7_public.py` and `local-dev/README.md`. Nothing was staged,
committed, pushed or deployed, and `instance/dev_local.db` was not seeded or
altered.

---

## 13. Change request — mandatory administrator approval removed

Requested after Phase 7: newly registered students must be able to sign in and
use the member panel immediately, with no administrator approval step anywhere in
the real authentication path. This supersedes the Phase 6 notes above that
describe a pending/approval gate; the approval endpoints, page and SPA state are
gone.

### 13.1 New registration and sign-in lifecycle

1. A student submits the registration form (HTML `/auth/register` or JSON
   `POST /api/v1/auth/register`). Turnstile, CSRF, validation, the fixed
   course/year lists and password hashing are unchanged.
2. `app.services.accounts.create_student_account()` creates the `User` with
   `is_approved=True` and `is_active_account=True` plus the `Member` row and
   commits. The account is usable immediately; welcome e-mail/SMS are sent as
   before (best-effort).
3. The student signs in. `login_block()` refuses only a deactivated account, so
   login succeeds and Flask-Login establishes the session; `/api/v1/me` reports
   `status: "approved"` and the member capabilities. The HTML login redirects to
   `/member/`, the SPA login redirects to the member dashboard. The session
   survives a refresh.
4. An administrator manages the account from `/admin` and `/admin/members`: view
   account information, deactivate (`POST /admin/members/<id>/toggle-active`,
   admin password required) and restore. Deactivation is the only way access is
   removed; a deactivated account gets `403 ACCOUNT_INACTIVE` on login and is
   refused by the session gate.

No schema change: the legacy `User.is_approved` column stays, is set to `True`
for new accounts, and is deliberately **not** used as a login gate, so accounts
created under the old flow are not locked out. Automated tests seed one such
legacy `is_approved=False` account and assert it can sign in. No account or
member row was deleted, and `instance/dev_local.db` remains schema-only.

### 13.2 Backend changes

- `app/services/accounts.py`: removed `auto_approval_enabled()` and the
  `SystemSettings` read; `create_student_account()` returns the `User` directly
  (was `(user, auto_approved)`); `login_block()` returns only
  `ACCOUNT_INACTIVE`; `account_status()` returns `approved`/`inactive` only.
- `app/api/accounts.py`: register response is
  `{user:{id,email,status:'approved',can_sign_in:true}}`; the login
  `ACCOUNT_NOT_APPROVED` branch is removed;
  `_send_approval_notifications` renamed `_send_welcome_notifications` and always
  runs; `/auth/approval-status` is retained for compatibility and returns
  `approved` or `rejected` only.
- `app/routes/auth.py`: HTML login approval gate removed; HTML registration
  flashes "Your account is ready" and redirects to login; the
  `/auth/approval-pending` route and `templates/auth/approval_pending.html` are
  deleted.
- `app/routes/admin.py`: `/admin/users` is now a recent-registrations/account
  status view; `/admin` counts deactivated accounts and lists recent
  registrations; `/users/approval-mode`, `/approve-user/<id>` and
  `/reject-user/<id>` are removed. Deactivate/restore remains
  `toggle_member_active`; suspension, restore and account deletion are unchanged.
- Templates `admin/users.html` and `admin/dashboard.html` rewritten for the new
  wording and controls.

Security is unchanged: password hashing, validation, CSRF, Flask-Login sessions,
rate limiting, Turnstile, Origin checks and server-side role authorization all
still apply. Registration never grants an admin role.

### 13.3 Frontend changes

- `src/pages/auth/Register.tsx`: success message says the account is ready, then
  navigates to `/auth/login` with `state.registeredEmail`; no approval screen.
- `src/pages/auth/Login.tsx`: prefills the registered address and shows a
  success alert; the pending-status branch is removed. Sign-in goes straight to
  the member dashboard.
- `src/pages/auth/ApprovalPending.tsx` and its route deleted;
  `AuthContext.pendingApproval`/`clearPending` and `api.approvalStatus` removed.
- `src/lib/api.ts` register type is `{status:'approved', can_sign_in:boolean}`.
- Admin pages (`Dashboard`, `Members`, `Messages`) now describe deactivated
  accounts and automatic registration instead of pending approvals.

### 13.4 Verification (isolated temporary SQLite databases)

| Suite | Result |
| --- | --- |
| `local-dev/test_phase6_auth.py` | **42 tests pass** |
| `local-dev/test_phase5_api.py` | **33 tests pass** |
| `local-dev/test_phase7_public.py` | **41 tests pass** |
| Frontend `npm run typecheck` / `npm run build` | pass / pass |
| Backend `python -m compileall app` | pass |

Phase 6 coverage added or updated for this change: registration produces an
active, approved account (`can_sign_in:true`); the new account logs in and loads
`/api/v1/me` and the HTML `/member/` panel immediately; the session persists on a
second request; a legacy unapproved account can sign in; a stale
`registration_approval_mode='manual'` row has no effect; welcome notification is
sent; HTML register → login → `/member/` works end to end; admin login →
`/admin/members` → deactivate → JSON login returns `403 ACCOUNT_INACTIVE` →
restore → login succeeds; invalid credentials, CSRF, Turnstile and admin login
remain covered.

The live stack was not used to create a real account because
`instance/dev_local.db` is intentionally schema-only; the end-to-end flows run
through the real Flask app and the real Jinja routes against a disposable
database. Phase 8 has not been started.

---

**STOP — the approval-removal change request is complete. Phase 8 (member portal
integration) has not been started; awaiting explicit approval to begin it.**

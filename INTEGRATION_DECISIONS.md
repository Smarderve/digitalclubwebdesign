# INTEGRATION DECISIONS — KIUT Digital Club

Decision log for the React + Flask integration. The controlling instruction is
`KIUT_DIGITAL_CLUB_INTEGRATION_MASTER_PLAN.md`; the full contract and the
register of unresolved business decisions (D1–D16) and technical risks (R1–R19)
live in `INTEGRATION_AUDIT.md` §12.6–§12.18. This file records **why** the
architecture and the implemented behaviour are what they are, so a later phase
does not have to guess.

Format: each decision states the choice, the reason, and what it rules out.

---

## 1. Topology and transport

**1.1 One Flask application, one database, one identity store.**
React is served by Vite in development (port 5178) and talks to Flask
(port 5051) through a dev proxy for `/api`, `/healthz` and `/static/uploads`.

- *Why:* the plan forbids a second backend, database or auth system. A proxy keeps
  the browser on a single origin, so the session cookie, the CSRF origin check and
  `fetch(credentials:'same-origin')` all behave exactly as they will in
  production, with no CORS configuration to maintain.
- *Rules out:* CORS middleware, JWT, a token in `localStorage`, an SPA-owned
  session of any kind.

**1.2 JSON API under `/api/v1`, beside the Jinja blueprints.**
`app/api/` is a separate blueprint; no existing route, template or static asset
was replaced. The Jinja site stays fully functional until a cutover is approved.

- *Why:* plan §2.1 and §4 require the original frontend to remain intact and the
  integration to be additive.
- *Consequence:* two frontends read the same models; shared business rules must
  live in helpers both can import (see 3.2), never be copied.

**1.3 All API responses use one envelope and one error vocabulary.**
`{"data": …}` or `{"error": {"code", "message", "details"}}`, plus
`meta.request_id` and an `X-Request-ID` header.

- *Why:* a client never has to guess whether a body is data or an error, and a
  request id makes a user report traceable in logs without exposing internals.

## 2. Authentication, CSRF and authorization

**2.1 The existing Flask-Login cookie session is the only identity.**
`GET /api/v1/me` is the single source of truth for the signed-in user, role and
capabilities. The React auth context has a `loading` state so route guards do not
redirect while that request is in flight.

- *Why:* plan §2.3 forbids replacing the session model without approval, and the
  prototype's `localStorage` session was editable by any user.
- *Rules out:* role values in React as an authorization input, any password or
  token in browser storage.

**2.2 `session.clear()` before `login_user`, and a fresh CSRF token returned by
the login response.**
- *Why:* closes session fixation (audit R15) while keeping the same cookie
  mechanism; the anonymous token cannot be reused after elevation.

**2.3 CSRF: double-submit token bound to the session, `X-CSRF-Token` on every
write, plus an Origin/Referer gate.**
`GET /auth/csrf` issues the token; the client keeps it in memory and retries once
on `403 CSRF_TOKEN_INVALID`.

- *Why:* the original application had no CSRF protection at all. Enabling it for
  the API alone would have left 135 HTML POST forms unprotected, so the same
  layer was rolled out to every existing form in Phase 5 (approved as D5).
- *Rules out:* `@csrf.exempt` on a state-changing route; adding a new form
  without a token.

**2.4 Authorization is always server-side.** `api_login_required` and
`api_role_required` wrap every protected view; the `capabilities` array on `/me`
is presentation only and grants nothing.

- *Why:* plan §2.3 — React guards are supplementary UI, never a boundary.

**2.5 Deactivation is the only access gate.** Registration creates an active
account immediately; `is_approved` remains on the model for legacy rows but is
not a login gate.

- *Why:* your change request after Phase 7 (§13 of `INTEGRATION_PROGRESS.md`)
  removed administrator approval from the real path. Accounts created under the
  old flow could otherwise be locked out, so a seeded legacy
  `is_approved = False` account is asserted to still sign in.
- *Note:* this is an authorized deviation from the plan's Phase 6 text (see
  `INTEGRATION_PROGRESS.md` §16.4).

## 3. API design

**3.1 Path tiers: `/public/*`, `/member/*`, `/me`, `/admin/*`.**
Resources the caller may not see answer `404`, not `403`, except where "exists
but forbidden" is itself meaningful (for example another member's team removal).

- *Why:* plan §2.3 and audit §12.7 — never confirm the existence of private
  records to an unauthorized caller.

**3.2 Member identity always resolves from `current_user.member`.** No endpoint
accepts a `member_id` for "self".

- *Why:* this is the cheapest way to make cross-member access impossible rather
  than merely checked. A foreign id in a URL resolves to `404` because the query
  is scoped to the caller.

**3.3 Business logic is imported, not re-implemented.** The member write routes
call the same helpers as the Jinja views: `_calculate_quiz_attempt_scores`,
`_finalize_quiz_results_if_due`, `_award_quiz_points_and_leaderboard`,
`_member_can_submit`, `_member_can_team_enroll`, `_member_is_judge`,
`member_meets_election_eligibility`, `tally_election_results`, and the shared
points/rank/tier service in `app/services/members.py`.

- *Why:* plan §4 forbids duplicate business logic and drift between surfaces.
  The visible consequence is that an API quiz attempt and a Jinja quiz attempt
  score identically, and `/me` cannot disagree with the member dashboard.
- *Cost:* `app/api/member.py` imports from `app/routes/member.py`. That direction
  is deliberate; `app/routes` never imports `app/api`, so there is no cycle.

**3.4 Server-computed values are never accepted from the request.** Quiz scores,
`is_correct`, election tallies, eligibility, points and ranking come from stored
records. A body that claims `is_correct: true` is ignored (asserted in the test
suite).

**3.5 Specific `409` codes instead of generic failure.** Each closed window has
its own code (`QUIZ_CLOSED`, `SUBMISSION_CLOSED`, `APPLICATION_CLOSED`,
`VOTING_CLOSED`, `RSVP_CLOSED`, `LEADERBOARD_CLOSED`, …) so the UI can explain
what happened rather than saying "error".

**3.6 Uploads: extension allow-list, size cap, generated filename, dedicated
folder.** Avatars go to `uploads/profiles` (≤ 2 MB), competition entries to
`uploads/competitions` (competition limit, default 10 MB), election passports
through the existing `save_election_passport`.

- *Why:* the existing forms only checked extensions; the API keeps that
  behaviour and adds a size cap without inventing a new storage convention.
- *Open:* `/static/uploads` is still directly reachable (audit R4/R7); MD8 is the
  authorized route, not yet the only route.

## 4. Endpoint-level decisions that deviate from, or interpret, the contract

| Contract row | Decision | Reason |
| --- | --- | --- |
| MD7 `digital-id/regenerate` | `200` with the new state, not `202 queued` | Generation is synchronous; `202` would describe work that never happens |
| MD15 project submit | Publishes (`is_public = true`), `202`, `review_required: false` | The original member project form has no moderation queue. Claiming one would be an invented workflow |
| MD5 profile privacy | **Implemented**, profile surface only | Three additive `Member` columns (`profile_visibility`, `discoverable`, `privacy_sections`) with a private default; migration `d20261127120000` backfills existing approved members to public + discoverable, because they were all listed before it. `PUT /member/profile/privacy` replaces the settings; enforcement covers `GET /member/profile`, MD50 and PU17/PU18. Leaderboards and PU19 ID verification are deliberately unaffected — they expose a name and membership status, not profile content |
| MD21 session report | Authorizes on the assigned instructor account, not on a `Member` row | Instructors can be administrators with no member profile; requiring one would break the real workflow |
| MD29 quiz start | Checks the quiz window before the duplicate-attempt rule | "This quiz is closed" is the honest answer for an expired quiz, whether or not an attempt exists |
| MD31 violation | Validates `kind` before the attempt state | Invalid input is a validation error regardless of attempt state |
| MD37 team enrolment | `mode: 'team'` supported alongside `individual` | The Jinja competition page already offered it; removing it would be a feature loss |
| MD42 apply | `action: 'draft' \| 'submit'`, submit requires a passport | Mirrors the existing two-step apply form exactly |
| MD49 remove member | Permission is checked before the membership lookup | A non-leader must learn nothing about who is in the team |
| MD51 messages | Not implemented | There is no message model; admin messaging writes notification batches, already served by MD24–MD26 |
| Social follow target | A `member.id` whose account is approved and active; anything else answers `404` | Deactivated and unapproved accounts must not be discoverable by probing, and staff accounts have no member row to follow |
| Social follow visibility | Public profile → immediate follow; private profile → pending request decided by its owner | Reuses the MD5 privacy model instead of inventing a second visibility rule; a follow never grants silent access to a private profile |
| Social blocks | Remove follows and pending requests in both directions; MD50 and the public directory are not filtered yet | Filtering every surface is a wider change and needs its own tests; recorded as outstanding rather than half-applied |

## 5. Data and content decisions

**5.1 Public endpoints expose an allow-list of fields.** `_member_summary` is the
only cross-member shape: `member_id`, `display_name`, `course`, `year`,
`avatar_url`. E-mail, phone, member number, payments and points never leave
member-scoped endpoints.

MD5 adds member-controlled visibility on top of that allow-list. A profile is
reachable at its public slug only when `profile_visibility` is `public`; a
private profile answers `404`, exactly like a missing one. Directory listings
(MD50 and PU17) additionally require `discoverable`, so a public profile can be
link-reachable without appearing in search. Six sections of the public profile
— `bio`, `skills`, `interests`, `links`, `projects`, `achievements` — can be
hidden individually; a hidden section keeps its shape but carries no data. The
scope is the profile surface only: leaderboards and PU19 ID verification are
unchanged.

- *Why:* approved D1 (profiles are public, but only approved fields) and D8
  (display names on leaderboards, no course/year on public surfaces).

**5.2 Published rows only.** News, blogs, `Project.is_public` and
`events.target_audience == 'everyone'` gate the public surface; drafts are
invisible everywhere, including through search.

**5.3 Blog HTML is sanitized on read** (`app/api/sanitize.py`, allow-list
parser). The SPA renders `body_html_sanitised` only.

**5.4 No demo fallback, ever.** An empty database renders empty states; a backend
error renders an error state. This is the rule that Phase 11 will verify.

**5.5 Editorial copy stays in `src/data/site.ts`** only while it is genuine.
`TESTIMONIALS`, `PARTNERS` and `ACHIEVEMENTS` are still rendered and were never
explicitly approved — an open item recorded in `INTEGRATION_PROGRESS.md` §16.6.

## 6. Repository and environment decisions

**6.1 Two repositories, one worktree each.** The backend is a nested Git
repository recorded as a gitlink with no `.gitmodules`. Backend changes are
committed inside `current-website/DIgital-Club`, then the parent gitlink is
updated. No submodule commands, no remote or branch changes.

**6.2 The local database is schema-only and disposable.** `instance/dev_local.db`
is built from the models by `local-dev/init_local_db.py`, contains 0 rows, and is
never seeded with demo records. Tests always use their own temporary SQLite file.

**6.3 `flask db upgrade` cannot initialise this repository.** The first Alembic
revision is an `ALTER TABLE user`; no revision creates the original tables
(audit R16). The bootstrap builds the schema and stamps head instead. No new
migration may be authored until a baseline revision exists.

**6.4 Secrets are configured by name only.** `SECRET_KEY`, `DATABASE_URL`,
`TURNSTILE_*`, `APP_TIMEZONE`, `APP_UTC_OFFSET_HOURS`, `SESSION_COOKIE_*`,
`VITE_TURNSTILE_SITE_KEY` — values live in gitignored files, never in
documentation, logs or the frontend bundle.

**6.5 Local times are application-local naive datetimes.** Anything that compares
a quiz, event or session window must use `app_now_naive()`. A UTC comparison is
wrong by the configured offset (this produced three test failures before it was
fixed in the Phase 8 fixture).

## 7. Decisions still needed from the user

1. **Approval removal** — amend the plan's Phase 6 text, or accept
   `INTEGRATION_PROGRESS.md` §13 as the standing amendment (§16.4).
2. **Unverified editorial content** — approve `TESTIMONIALS`, `PARTNERS`,
   `ACHIEVEMENTS` as genuine editorial, or remove them in Phase 11 (§16.6).
3. **Public competitions** — add a public competition endpoint in Phase 9/10, or
   keep the archive member-only (§16.6).
4. ~~**MD5 privacy**~~ — **resolved**: migration `d20261127120000` was approved
   and applied (three additive columns, approved members backfilled to public);
   the endpoint and its enforcement scope are recorded in §4 and §5.1.
5. **MD51 messages** — approve a message model, or keep notifications as the only
   inbox (§16.7).
6. **D3, D7, D9–D16** in `INTEGRATION_AUDIT.md` §12.18 remain open; defaults are
   listed there and none of them was guessed in code.

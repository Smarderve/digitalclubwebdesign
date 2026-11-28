# KIUT DIGITAL CLUB — REACT + FLASK INTEGRATION MASTER PLAN

> **Execution model: one phase per run. Stop after every phase. Approval is required before the next phase.**
>
> This document is the controlling instruction for the coding agent working in the existing local testing repository. Read it completely before making changes.

---

## 1. Project context

The local parent testing repository already contains these two project directories:

- `current-website/` — the original KIUT Digital Club website and its Python/Flask backend.
- `new-website-design/` — the React redesign that is being prepared to replace the original server-rendered frontend.

The parent testing repository is:

`https://github.com/Smarderve/digitalclubwebdesign`

The original KIUT Digital Club repository is:

`https://github.com/KIUT-DIGITAL-CLUB/DIgital-Club`

The objective is to use the React application as the new frontend while retaining and integrating the existing Python/Flask backend, its database, models, business logic, accounts, permissions, and existing features.

This is an integration project, not a backend rewrite and not permission to redesign the React application from scratch.

### Primary outcome

Deliver one locally working application in which:

1. React provides the user interface.
2. The existing Flask application remains the backend and source of truth.
3. Existing user accounts and authentication continue to work.
4. Public, member, and admin pages display genuine data/content from the original project and its database.
5. Forms and interactive features perform real backend operations.
6. Authorization and security are enforced by Flask, not merely hidden in React.
7. The original Flask/Jinja frontend remains intact until the React frontend has been verified and a separate cutover decision is approved.

---

## 2. Non-negotiable rules

These rules apply during every phase.

### 2.1 Protect the existing projects

- Do not delete, rename, move, overwrite, or restructure `current-website/` or `new-website-design/`.
- Do not delete the original Jinja templates, static assets, routes, blueprints, models, migrations, configuration, or documentation.
- Do not replace the Flask backend with Node, Express, Firebase, Supabase, or another backend.
- Do not create a second disconnected database or a parallel authentication system.
- Do not change Git remotes, branch configuration, repository history, or Git settings.
- Do not run `git reset`, `git clean`, force-push, broad cleanup commands, or commands that discard user changes.
- Do not commit, push, publish, deploy, or change hosting settings unless the user explicitly authorizes that exact action.
- Do not run broad staging commands such as `git add -A` unless explicitly approved.
- Never assume an unfamiliar path. Inspect the actual project tree and use the paths that exist.

### 2.2 Protect the database and real records

- Treat the existing Flask database and its models as the source of truth.
- Never reset, drop, truncate, recreate, or seed the production database.
- Never run destructive migrations.
- Do not create fake users, fake activity, fake analytics, fake payments, fake news, fake events, or other sample records in a real database.
- Use a separate local development database or a safe copy for integration testing.
- Before any schema migration, explain the proposed change, affected tables, risks, rollback plan, and whether existing records are preserved. Wait for explicit approval.
- Never expose passwords, secret keys, API tokens, private environment variables, or personal member information in reports, logs, screenshots, or frontend bundles.
- Do not print or copy `.env` secrets into documentation.

### 2.3 Preserve authentication and security

- Inspect and preserve the existing Flask-Login/session authentication approach unless a documented technical blocker requires a proposed change.
- Do not introduce JWT or replace the existing session model without explicit approval.
- Preserve CSRF protection, password hashing, login/logout behavior, account approval/deactivation rules, role checks, permission checks, rate limits, CAPTCHA/Turnstile protections, and session security.
- Enforce all access control on the Flask backend. React route guards are supplementary UI behavior, not security boundaries.
- Never allow a member to access another member's private profile, records, financial information, or actions unless the original permission model explicitly allows it.
- Do not weaken security to make a frontend feature easier to implement.

### 2.4 Preserve the React design

- The React redesign is the intended frontend.
- Preserve its current visual direction, page layouts, navigation, typography, spacing, color system, components, responsive behavior, animations, and interaction design.
- Do not replace the design with generic dashboards, repeated card grids, or a new template.
- Make only the smallest UI changes needed to display genuine backend data and meaningful loading, empty, error, and permission states.
- Do not remove existing pages or features merely because the backend integration is not yet implemented. Record gaps and propose a solution.

### 2.5 No invented content or fake functionality

- Do not invent people, leadership positions, biographies, projects, achievements, statistics, dates, event details, news articles, contact details, financial totals, membership counts, or organizational claims.
- Do not use placeholder records as if they were real.
- Do not show a success message unless the backend operation actually succeeded.
- Do not simulate persistence with `localStorage`, `sessionStorage`, hardcoded arrays, timers, or client-side-only state.
- Static presentation text may remain only when it is genuine editorial content, supported by the original project, or explicitly approved by the user.
- If genuine content is unavailable, show a clear, intentional empty state or report the missing source. Do not fill the gap with fabricated content.

---

## 3. Mandatory data-integrity requirement: remove demo data throughout the entire site

The requirement is not limited to dashboards.

Audit and eventually eliminate all demo, mock, sample, placeholder, fabricated, or disconnected hardcoded data from every React page and feature.

This includes, but is not limited to:

### Public-facing pages
- Homepage and hero statistics.
- About and organization information.
- Leadership and team profiles.
- News, blog posts, announcements, and articles.
- Events and event details.
- Projects and project outcomes.
- Gallery images, captions, and categories.
- Competitions, training, workshops, and programs.
- Contact information, locations, and social links.
- Public member or achievement highlights.
- Any other public page, section, widget, feed, or search result.

### Member-facing pages
- Dashboard metrics and recent activity.
- Member profile and membership status.
- Digital ID and membership details.
- Points, ranks, rewards, trophies, and achievements.
- Competitions, quizzes, warmups, and results.
- Training sessions and attendance.
- Teams and team activity.
- Events and registrations.
- Notifications and announcements.
- Financial information, dues, payments, and receipts.
- Search, filters, lists, charts, and summaries.

### Admin-facing pages
- Dashboard metrics and analytics.
- Member lists and member details.
- Pending approvals and account status.
- News, events, projects, gallery, and content management.
- Finance, payments, rewards, reports, and operations.
- Teams, competitions, training, elections, and voting.
- Notifications, audit information, and other administrative tools.

### Shared application behavior
- Demo login accounts and demo account selectors.
- Hardcoded arrays and objects used as production-looking records.
- Mock API responses and fake service functions.
- Placeholder charts and counters.
- Fake search results, filters, pagination, and notifications.
- Fake form submissions and simulated success states.
- Local storage used as a substitute for backend persistence.
- Seed/demo data that is accidentally loaded in normal application startup.

For every data element, identify its source and classify it as one of:

1. **Real database data** — retrieved from the existing backend/database.
2. **Real original content or asset** — present in the original repository and suitable for reuse.
3. **Approved editorial/static content** — genuine content explicitly accepted by the user.
4. **Demo/mock/placeholder** — must be removed or replaced.
5. **Unavailable/uncertain** — must not be fabricated; document the gap and propose a safe solution.

Create a page-by-page data inventory. Do not declare demo data removed simply because a demo data file was deleted. Search for all references, duplicated arrays, inline constants, mock services, and fallback sample records.

The final result must not silently fall back to demo data when the backend is offline or returns an error. Display an honest loading, empty, or error state instead.

---

## 4. Existing architecture and integration principles

The original project is a Flask application using server-side routes/templates, SQLAlchemy models, Flask-Login sessions, and a relational database. Its existing features and business rules must be inspected locally before implementation.

The original backend has multiple functional areas and a substantial model layer. Do not assume that every React page maps one-to-one to a database table. Trace the actual route, model, relationship, permission, and service logic.

### Backend integration approach

- Reuse existing Flask routes, services, models, and business logic wherever possible.
- Where React needs data that is not exposed through a suitable endpoint, add the smallest necessary API endpoint to the existing Flask application.
- Prefer a clearly organized API namespace such as `/api/v1/` if it fits the existing architecture.
- Do not create duplicate business logic in API handlers. Reuse existing service or route logic where practical.
- Use explicit serializers/response schemas. Do not return entire SQLAlchemy objects or sensitive fields.
- Use pagination and filtering for large collections.
- Validate and authorize every write operation on the server.
- Handle file uploads using the existing storage conventions and validate file type/size.
- Respect existing database relationships, status values, and lifecycle rules.

### Frontend integration approach

Create or adapt a reusable React API layer. It should handle, as appropriate:

- API base URL and environment configuration.
- Cookie/session credentials.
- CSRF token acquisition and submission.
- JSON request and response handling.
- Multipart/form-data uploads.
- Consistent error parsing.
- Unauthorized/session-expired handling.
- Loading and empty states.
- Typed response contracts where TypeScript is used.

Do not scatter raw `fetch()` calls throughout page components if a shared API layer is more appropriate.

### Authentication approach

- Preserve the existing Flask-Login session/cookie flow.
- Verify login, logout, current-user retrieval, registration, approval-pending behavior, and protected routes against the original backend.
- Configure CORS, credentials, cookie attributes, and CSRF correctly if the local frontend and backend run on separate origins.
- Do not store passwords or authentication secrets in browser storage.
- Do not rely on a React role value or local storage to authorize privileged operations.

### KIUTBOT

Inspect the existing KIUTBOT/Socket.IO integration and its dependencies before changing anything. Preserve it unless a specific incompatibility is demonstrated. Document the connection, authentication, events, and required configuration.

---

## 5. Required documentation and progress tracking

Create and maintain these documents in a safe documentation location in the parent testing repository. Before creating a file, check whether an equivalent document already exists; update it rather than creating confusing duplicates.

- `INTEGRATION_MASTER_PLAN.md` — this plan, if copied into the repository.
- `INTEGRATION_AUDIT.md` — architecture, page inventory, data inventory, routes, models, risks, and gaps.
- `INTEGRATION_PROGRESS.md` — phase status, completed tasks, blockers, and approval history.
- `API_DOCUMENTATION.md` — API endpoints, methods, request/response shapes, auth/CSRF requirements, and permissions.
- `LOCAL_DEVELOPMENT.md` — safe local setup and run instructions, without secrets.
- `INTEGRATION_DECISIONS.md` — significant technical decisions and their rationale.

Do not overwrite valuable existing documentation without reviewing it.

---

# 6. Phase execution protocol — mandatory

## How the agent must interpret a run

At the beginning of every run:

1. Read this complete master plan.
2. Read `INTEGRATION_PROGRESS.md` if it exists.
3. Identify the current phase and its approval status.
4. Read relevant audit/decision documentation.
5. Check the current working tree and preserve all pre-existing user changes.
6. Confirm which phase the user has authorized in the current instruction.

**Only execute the phase explicitly authorized by the user.**

If the user says “Start Phase 1”, execute Phase 1 only. If the user says “Proceed to Phase 2”, execute Phase 2 only, and so on.

If the user merely says “continue”, inspect the progress document and ask for clarification if the next phase is not unambiguously authorized.

Do not interpret the existence of this plan as permission to execute all phases.

## Mandatory stop condition

At the end of each phase:

1. Stop implementation work immediately.
2. Do not begin the next phase.
3. Do not perform extra cleanup or unrelated improvements.
4. Update the progress document.
5. Produce the phase report using the report format below.
6. List every file created, edited, or deleted. Deletions should normally be zero unless specifically approved.
7. List commands/tests run and their actual results.
8. List unresolved issues, risks, assumptions, and decisions needed.
9. State whether the phase acceptance criteria passed, partially passed, or failed.
10. Wait for the user's explicit approval before starting the next phase.

Do not automatically continue after writing the report, even if the next phase appears straightforward.

## Phase report format

Every phase must finish with:

### Phase [number] — [name] report

- **Status:** Complete / Partially complete / Blocked
- **Scope authorized:** What this phase was allowed to do
- **Work completed:** Specific findings or implementation
- **Files created:** Exact paths
- **Files modified:** Exact paths and purpose
- **Files deleted:** Exact paths and explicit reason; normally none
- **Database impact:** None / exact approved change
- **Commands executed:** Relevant commands
- **Tests performed:** Test names/commands and real outcomes
- **Security considerations:** Findings and checks
- **Demo-data findings:** What was found, removed, or still remains
- **Outstanding issues:** Specific unresolved items
- **Risks and decisions needed:** What the user must decide
- **Acceptance criteria:** Passed / Partially passed / Failed, with evidence
- **Next phase:** Name only; do not start it

End with:

**STOP — Phase [number] is finished. No work from the next phase has been started. Awaiting user approval.**

If a phase cannot be completed safely, stop and report the blocker instead of improvising.

---

# 7. Phases

## PHASE 0 — Repository safety baseline and project orientation

**Purpose:** Establish a safe understanding of the working repository before deeper auditing.

### Tasks
- Inspect the parent repository structure and identify the actual locations of `current-website/` and `new-website-design/`.
- Confirm the actual Flask application entry point, package structure, frontend entry point, package manager, and run scripts.
- Inspect Git status and identify pre-existing user changes. Do not modify or discard them.
- Identify ignored files, environment files, local databases, uploads, and generated assets.
- Determine which files are tracked and which are local-only where relevant.
- Identify existing documentation and avoid duplicating it.
- Identify the safe local development database configuration without printing secrets.
- Record any uncertainty about repository nesting or paths rather than assuming.

### Restrictions
- Read-only inspection only.
- Do not install dependencies.
- Do not edit application code or configuration.
- Do not alter databases, Git settings, remotes, or branches.

### Deliverables
- Repository and runtime map in `INTEGRATION_AUDIT.md`.
- Initial baseline and risks in `INTEGRATION_PROGRESS.md`.

### Acceptance criteria
- Both project roots and their actual paths are identified.
- The existing working-tree state is documented.
- Flask and React entry points are identified.
- No application files, database records, or Git configuration have been changed.

**STOP after Phase 0.**

---

## PHASE 1 — Complete Flask backend and data-source audit

**Purpose:** Understand the original backend before designing the integration.

### Tasks
Inspect the original Flask project in depth:

- Application factory/entry point and configuration.
- Blueprints, route registration, URL prefixes, and route behavior.
- SQLAlchemy models, columns, relationships, constraints, and important status fields.
- Migrations and database initialization behavior.
- Authentication, registration, approval, password reset, logout, and session behavior.
- Role and permission checks.
- CSRF, CAPTCHA/Turnstile, rate limiting, upload validation, and security controls.
- Existing API/AJAX endpoints and response shapes.
- Services, utility modules, scheduled tasks, Socket.IO events, and background behavior.
- Static assets and Jinja templates that contain real organizational content.
- News, blog, events, projects, gallery, leadership, members, competitions, training, finance, rewards, elections, notifications, teams, and other actual features.
- Local versus production database configuration and file-storage behavior.
- Existing tests and known setup requirements.

For every functional area, identify:
- Existing route(s).
- Relevant model(s).
- Existing service/business logic.
- Existing permission rules.
- Existing API capability, if any.
- Whether the information is real database content, original static content, or unavailable.

### Restrictions
- Read-only audit.
- Do not add endpoints or change models.
- Do not initialize, migrate, reset, or seed a database.
- Do not expose secret values.

### Deliverables
- Detailed Flask architecture and data-source inventory in `INTEGRATION_AUDIT.md`.
- Backend risks and gaps.

### Acceptance criteria
- Major backend modules and functional domains are mapped.
- Authentication/security behavior is documented.
- Existing API endpoints are distinguished from missing API capabilities.
- Important data sources are traceable to actual models/routes/assets.

**STOP after Phase 1.**

---

## PHASE 2 — Complete React frontend, feature, and demo-data audit

**Purpose:** Map the whole React redesign and identify every place that needs genuine backend data.

### Tasks
Inspect the entire `new-website-design/` application:

- Routes and route guards.
- Public pages and shared layout components.
- Member pages and dashboard widgets.
- Admin pages and dashboard widgets.
- Forms, tables, charts, lists, filters, search, modals, and upload components.
- Context providers, hooks, services, API utilities, and state management.
- Authentication and registration flows.
- Demo account selector and hardcoded demo credentials.
- All data files, inline arrays/objects, mock services, placeholder constants, fake charts, and local/session storage usage.
- KIUTBOT/Socket.IO client.
- Responsive layouts and error/loading/empty states.
- Existing tests and build scripts.

Create a **page-by-page data-source matrix**. For every page/component, record:
- Route and access level (public/member/admin).
- Visible data fields and actions.
- Current source (API, hardcoded, demo, static original content, browser storage).
- Intended Flask model/route/service.
- Whether an API endpoint already exists.
- Proposed integration requirement.
- Whether the data is sensitive or permission-restricted.

Search the full React project for patterns such as demo, mock, sample, placeholder, fake, dummy, hardcoded, localStorage, sessionStorage, and simulated service responses. Inspect context and references; do not rely only on keyword search.

### Restrictions
- Read-only audit.
- Do not remove demo files yet.
- Do not change the UI or install packages.
- Do not assume a file is unused without tracing its references.

### Deliverables
- React page/feature inventory.
- Full demo/static data inventory.
- Backend-to-frontend mapping matrix.
- List of integration gaps and proposed solutions.

### Acceptance criteria
- Every React route and significant feature is accounted for.
- Public, member, and admin areas are all included.
- Demo data is inventoried across the entire site, not only dashboards.
- No application code has been changed.

**STOP after Phase 2.**

---

## PHASE 3 — Integration architecture and API contract proposal

**Purpose:** Agree on how React will communicate with Flask before implementing the connection.

### Tasks
Using the approved audits:

- Map each React feature to existing Flask functionality.
- Identify which existing routes can be reused and which API endpoints are genuinely missing.
- Propose a minimal API structure, versioning, serializers, pagination, filtering, validation, and error format.
- Define session and CSRF flow for React.
- Define CORS/cookie behavior for the local development topology.
- Define role/permission behavior for each protected operation.
- Define file upload and media URL handling.
- Define Socket.IO/KIUTBOT integration behavior.
- Identify data that cannot be supplied from the current backend and propose options without fabricating it.
- Define how public content is sourced and cached, if needed.
- Define API tests and integration acceptance tests.

### Restrictions
- Planning/documentation only.
- Do not implement endpoints.
- Do not change authentication, database schema, or deployment settings.
- Do not add dependencies.

### Deliverables
- Approved API design in `API_DOCUMENTATION.md`.
- Architecture and data-flow decisions in `INTEGRATION_DECISIONS.md`.
- Revised implementation sequence if the audit reveals dependencies.

### Acceptance criteria
- Every planned React data requirement has a documented source or an explicit gap.
- Proposed endpoints do not duplicate existing business logic.
- Auth, CSRF, permissions, and error handling are specified.
- User approval is obtained before implementation.

**STOP after Phase 3.**

---

## PHASE 4 — Safe local development and integration environment

**Purpose:** Prepare a reproducible local environment without touching production.

### Tasks
- Document how to run the existing Flask backend locally.
- Document how to run the React frontend locally.
- Establish safe local environment variables using example names/placeholders only.
- Configure the local React API base URL.
- Configure local CORS, cookie credentials, and CSRF only as required by the approved architecture.
- Use a separate local development database or a safe database copy.
- Confirm local uploads/media paths.
- Document startup order and ports.
- Add or update setup instructions.

### Restrictions
- Do not edit production environment settings.
- Do not copy production secrets into local files or documentation.
- Do not reset or overwrite any existing database.
- Do not alter hosting or deployment configuration.
- Do not install or upgrade packages without documenting why and obtaining approval if the change is material.

### Deliverables
- `LOCAL_DEVELOPMENT.md`.
- Safe local configuration examples.
- Verified local startup procedure.

### Acceptance criteria
- Flask and React can be started locally using documented steps.
- Local development is isolated from production data.
- Secrets are not exposed.
- Existing original frontend still starts as before, where its dependencies/environment permit.

**STOP after Phase 4.**

---

## PHASE 5 — Flask API foundation

**Purpose:** Implement the minimal shared API foundation in the existing Flask backend.

### Tasks
Only after the API design is approved:

- Add the agreed API blueprint/namespace using the existing Flask architecture.
- Add shared response/error conventions.
- Add safe serializers/schemas.
- Add session-aware current-user endpoint if required.
- Add CSRF integration appropriate to the existing protections.
- Add API authentication and permission decorators/helpers that reuse the original authorization model.
- Add pagination and validation helpers where justified.
- Add tests for the shared foundation.
- Document every endpoint.

### Restrictions
- No database schema changes unless separately approved.
- No changes to existing login/password logic unless specifically approved.
- No broad refactoring of original routes.
- No removal of Jinja routes or templates.
- No test data in production.
- No exposing private model fields.

### Acceptance criteria
- API foundation works locally.
- Session and CSRF behavior is verified.
- Unauthorized and forbidden requests are correctly rejected.
- Existing Flask routes continue to work.
- Tests pass or failures are explicitly reported.

**STOP after Phase 5.**

---

## PHASE 6 — Authentication and account lifecycle integration

**Purpose:** Make React use the real existing Flask accounts and sessions.

### Tasks
Integrate and test:
- Login.
- Logout.
- Current authenticated user/session.
- Registration.
- Approval-pending flow.
- Account activation/deactivation behavior.
- Password reset flow, where supported.
- Role-aware navigation and route handling.
- Session expiry and unauthorized response handling.
- CSRF-protected state-changing requests.

Remove the React-only fake authentication implementation only after real authentication is working and verified. Trace every import/reference before removing or replacing demo auth code.

The existing backend remains authoritative for identity, roles, and permissions.

### Restrictions
- Never create or expose demo credentials as a substitute for real accounts.
- Never bypass account approval or verification.
- Never store passwords in browser storage.
- Do not weaken CAPTCHA, CSRF, rate limits, or password protections.
- Do not change existing account records.

### Acceptance criteria
- A genuine existing account can log in through React.
- Logout invalidates the real backend session.
- Refreshing the page restores the valid session appropriately.
- Member/admin access is determined by the backend.
- Invalid credentials, pending approval, disabled accounts, and expired sessions are handled honestly.
- Original Flask authentication remains functional.

**STOP after Phase 6.**

---

## PHASE 7 — Public website data integration

**Purpose:** Replace demo and fabricated content across all public-facing React pages.

### Tasks
For every public page identified in the audit:
- Connect content to existing Flask models, routes, or original repository assets.
- Add only the missing API endpoints approved in Phase 3.
- Integrate homepage statistics using genuine backend values.
- Integrate leadership and member highlights using approved public fields only.
- Integrate news/blog, events, projects, gallery, competitions, training, and other public content.
- Use original media/assets where reuse is appropriate.
- Connect public contact information and social links to verified original values.
- Implement real pagination, filters, search, and detail pages where supported.
- Add loading, empty, error, and unavailable states.
- Ensure private member information is not exposed publicly.

### Restrictions
- No invented editorial content or statistics.
- No fake fallback arrays.
- Do not alter the visual design unnecessarily.
- Do not expose private contact, financial, or account information.
- Do not delete original assets or templates.

### Acceptance criteria
- Every public route has a documented genuine source or explicit unavailable state.
- Demo/mock content is removed from public pages.
- Public APIs expose only approved fields.
- Public pages remain responsive and visually consistent.
- Backend errors do not cause fake content to appear.

**STOP after Phase 7.**

---

## PHASE 8 — Member portal integration

**Purpose:** Connect member pages to the authenticated member's real records.

### Tasks
Integrate only the features supported by the original backend or explicitly approved additions:
- Member dashboard and metrics.
- Profile and membership information.
- Digital ID.
- Points, rank, rewards, trophies, and achievements.
- Events and registrations.
- Competitions and results.
- Quizzes/warmups where supported.
- Training and attendance.
- Teams.
- Notifications.
- Recent activity.
- Financial information, payments, dues, and receipts.
- Member search or lookup only where permissions allow.

For every operation:
- Verify the current user on the server.
- Enforce ownership and role permissions.
- Validate input on the server.
- Persist changes through the existing backend.
- Display the result returned by the backend.
- Handle loading, empty, validation, permission, and server-error states.

### Restrictions
- Do not expose one member's private data to another member.
- Do not fabricate points, rankings, payment status, activity, or achievements.
- Do not simulate successful registrations or submissions.
- Do not introduce payment processing or financial changes without explicit approval.

### Acceptance criteria
- Member pages show the authenticated member's actual records.
- Member actions persist through Flask.
- Cross-member access tests are rejected where not permitted.
- No member dashboard demo records remain.

**STOP after Phase 8.**

---

## PHASE 9 — Admin portal integration

**Purpose:** Connect admin pages to real administrative data and operations.

### Tasks
Integrate, as supported by the original backend:
- Admin dashboard metrics.
- Member management and search.
- Pending approvals.
- News, events, projects, gallery, and content management.
- Finance and payment records.
- Reports and analytics.
- Teams, competitions, training, elections, and voting.
- Rewards, trophies, and notifications.
- Uploads and operational tools.

For every write action:
- Verify admin permission on the backend.
- Validate all inputs.
- Reuse existing business rules.
- Record audit information if the original system supports it.
- Return clear success/failure results.
- Protect destructive actions with appropriate confirmation and server-side safeguards.

### Restrictions
- Never grant admin privileges from the frontend.
- Do not bypass approval workflows.
- Do not modify real financial/payment records as test data.
- Do not perform bulk destructive actions.
- Do not invent analytics or counts.

### Acceptance criteria
- Admin data is genuine and permission-protected.
- Admin operations persist through Flask.
- Non-admin users cannot invoke admin endpoints.
- Existing business rules remain enforced.
- No admin demo records or fake metrics remain.

**STOP after Phase 9.**

---

## PHASE 10 — Remaining features and real-time integrations

**Purpose:** Complete the features not fully covered by public, member, and admin phases.

### Tasks
Audit and integrate the remaining supported functionality, including:
- KIUTBOT and Socket.IO.
- Elections and voting.
- Competitions and quiz flows.
- Rewards and trophy workflows.
- Search and global filters.
- Notifications and live updates.
- Uploads/media.
- Contact/newsletter forms.
- Any other feature found in the original backend or React audit.

For each feature, verify the original source of truth, permissions, persistence, and failure behavior.

### Restrictions
- Do not invent a new business process to make a screen appear functional.
- Do not introduce a new external service without approval.
- Do not remove a feature just because it is difficult to integrate; document blockers.

### Acceptance criteria
- Every remaining React feature is classified as integrated, intentionally static, unavailable, or deferred with a reason.
- No feature falsely reports success.
- Real-time behavior is verified where applicable.

**STOP after Phase 10.**

---

## PHASE 11 — Full-site demo-data elimination and content verification

**Purpose:** Perform a dedicated, independent verification that the entire React application no longer presents demo data as real content.

### Tasks
Repeat a full repository search and manual page-by-page inspection.

Inspect:
- All public routes.
- All member routes.
- All admin routes.
- Shared components and widgets.
- Contexts, hooks, API services, and constants.
- Inline data arrays and chart configurations.
- Fallback/error states.
- Browser storage.
- Test fixtures and seed scripts.
- Demo login/account flows.
- Mock service workers and mocked API responses.

For every remaining static value, classify its provenance. Remove only demo/mock content that has a verified replacement or is intentionally replaced by a proper empty/unavailable state.

Do not remove test fixtures needed for automated tests, but ensure they cannot be loaded as live application data.

### Required verification table
Create a table with:
- Page/feature.
- Data element.
- Previous source.
- Final source.
- Evidence/test.
- Remaining gap, if any.

### Restrictions
- Do not delete a source file until all references are traced and replacement behavior is tested.
- Do not hide backend errors by restoring demo data.
- Do not invent content to achieve a visually populated page.

### Acceptance criteria
- No demo/mock data appears in normal application operation.
- Remaining static content has a documented legitimate source.
- Test fixtures are isolated from production runtime.
- All gaps are explicitly documented.

**STOP after Phase 11.**

---

## PHASE 12 — Functional, security, responsive, and regression testing

**Purpose:** Verify the integrated application as a whole.

### Tasks
Test:
- Flask backend tests.
- React type checking, linting, and production build.
- API contract tests.
- Login/logout/session persistence.
- CSRF and CORS behavior.
- Public page loading and API failures.
- Member ownership and permissions.
- Admin authorization and operations.
- Forms, uploads, search, pagination, and filters.
- Empty states and error states.
- KIUTBOT/Socket.IO if applicable.
- Responsive layouts across mobile, tablet, and desktop.
- Navigation, animations, and visual regressions.
- Original Flask/Jinja frontend regression.
- Database migration safety, if any approved migration exists.

Use a safe local test database and controlled test accounts. Do not use real financial transactions or destructive production operations.

Report actual test results. Never claim a test passed if it was not run.

### Acceptance criteria
- Critical user journeys pass.
- No known critical security issue remains unresolved.
- Build/type/lint/test results are recorded.
- Responsive behavior is reviewed across key pages.
- Original frontend still works.
- Known limitations are documented.

**STOP after Phase 12.**

---

## PHASE 13 — Final audit, handover, and cutover proposal

**Purpose:** Prepare the integrated project for user review and a separately authorized deployment/cutover decision.

### Tasks
- Review all phase reports and acceptance criteria.
- Verify `INTEGRATION_PROGRESS.md` is accurate.
- Complete API documentation.
- Complete local setup and troubleshooting documentation.
- Document environment variables by name and purpose, never by secret value.
- Document database and media backup/restore considerations.
- Document any approved migrations and rollback steps.
- Document remaining limitations and technical debt.
- Provide a final page/feature integration matrix.
- Provide a final demo-data audit summary.
- Provide a proposed deployment/cutover plan, but do not execute it.

### Restrictions
- Do not deploy.
- Do not change production environment variables.
- Do not switch the production domain or traffic.
- Do not remove the original Jinja frontend.
- Do not push or merge changes unless separately authorized.

### Acceptance criteria
- User can run the integrated project using the handover documentation.
- All known integration gaps are visible.
- The user has enough evidence to decide whether to approve a separate deployment/cutover phase.

**STOP after Phase 13.**

---

## 8. Definition of done

The integration is not complete merely because the React site builds or the homepage loads.

It is complete only when:

- React is connected to the existing Flask backend.
- Existing accounts and authentication work.
- Public pages use genuine original/backend content.
- Member pages use the signed-in member's real records.
- Admin pages use genuine backend data and enforce server-side permissions.
- Forms and actions persist through Flask.
- All demo/mock/sample data is removed from normal runtime across the entire site.
- No fabricated content or fake success states remain.
- Existing security controls are preserved.
- KIUTBOT and other retained features work or have documented blockers.
- The original Jinja frontend remains available until a separate cutover is approved.
- Tests, documentation, risks, and remaining gaps are reported accurately.

---

## 9. Instructions for the first execution

The first authorized task is **Phase 0 only**.

Do not begin Phase 1 automatically. Do not edit application code. Do not install packages. Do not modify the database. Do not change Git configuration. Do not delete or move anything.

Complete the Phase 0 repository safety baseline, update the progress document, deliver the mandatory Phase 0 report, and stop for user review.

**The user—not the agent—decides when the next phase begins.**

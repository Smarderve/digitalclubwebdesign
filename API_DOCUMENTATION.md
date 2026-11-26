# API DOCUMENTATION — KIUT Digital Club (`/api/v1`)

Status: **Phases 5–6.** This document describes the transport, envelope, security
and configuration conventions that every later endpoint inherits, plus the
session-authentication and account-lifecycle endpoints added in Phase 6. There
are no content, member or admin business endpoints yet — those arrive in Phases
7–10 and are specified in `INTEGRATION_AUDIT.md` §12.9.

Companion documents: `INTEGRATION_AUDIT.md` (design + risks), `INTEGRATION_PROGRESS.md`
(phase status), `local-dev/README.md` (runbook).

---

## 1. Base URL and versioning

| Item | Value |
| --- | --- |
| Base path | `/api/v1` (Flask blueprint `api_v1`, package `app/api/`) |
| Local origin | `http://127.0.0.1:5051` (Flask) behind `http://127.0.0.1:5178` (Vite proxy) |
| Transport | HTTPS in production; same-origin in both environments |
| Versioning | Path segment (`/api/v1`). A breaking change ships as `/api/v2`, never as a silent change to `v1` |
| Content type | `application/json` for requests; `application/json` for every response, including errors |

The API is **same-origin** with the SPA. There is no CORS layer and no
`Access-Control-Allow-*` header: the React app is served from the same origin as
Flask, and the Vite dev server proxies `/api`, `/healthz` and `/static/uploads`
to Flask so the browser never makes a cross-origin request.

API handlers live in `app/api/` and are registered on a separate blueprint. They
are never mixed into the existing Jinja page blueprints, and no page route was
converted into an API route.

## 2. Response envelope

Every response — success or failure, any status code — uses one of two shapes.

Success:

```json
{
  "data": { "status": "ok" },
  "meta": { "request_id": "25138d105b1c4c8c" }
}
```

Error:

```json
{
  "error": {
    "code": "CSRF_TOKEN_INVALID",
    "message": "A valid CSRF token is required for this request.",
    "details": { "field": "why it was rejected" }
  },
  "meta": { "request_id": "3f8fc3bbc41e4e0f" }
}
```

Conventions:

- `data` is always present on success and never on error; `error` never appears
  on success. A client can branch on `status` alone.
- `meta.request_id` is generated per request (16 hex chars) and echoed in the
  `X-Request-ID` response header. Quote it in bug reports: server logs record the
  same id.
- `error.details` is optional, and only ever describes the request. It never
  contains exception text, SQL, file paths, configuration values or row data.
- Collections will add `page`, `per_page`, `total`, `pages` to `meta` (see §9).

Helpers (`app/api/responses.py`): `success(data, status, meta, headers)`,
`error(code, message, status, details, headers)`, `no_store(response)`,
`get_request_id()`.

## 3. Standard headers

| Header | Applies to | Meaning |
| --- | --- | --- |
| `X-Request-ID` | every `/api/` response | Correlates the response with server logs |
| `Cache-Control: no-store` | every `/api/` response by default | API payloads are session-scoped and must not be cached |
| `X-Content-Type-Options: nosniff` | every `/api/` response | No content sniffing |
| `Retry-After` | `429` responses | Seconds until the rate-limit window frees a slot |

`GET /api/v1/auth/csrf` is explicitly `no-store` as well, because a cached token
would break the session binding.

## 4. Error codes

| Status | `code` | When |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Malformed JSON body, or an Origin/Referer value that cannot be parsed |
| 400 | `TURNSTILE_FAILED` | Human verification missing, failed, or not configured |
| 400 | `TOKEN_INVALID` | Password reset link is not valid |
| 400 | `TOKEN_EXPIRED` | Password reset link has expired (24 h) |
| 401 | `AUTH_REQUIRED` | No authenticated session |
| 401 | `INVALID_CREDENTIALS` | Email and password do not match an account |
| 403 | `FORBIDDEN` | Authenticated, wrong role |
| 403 | `ACCOUNT_INACTIVE` | The account was deactivated by an administrator |
| 403 | `CSRF_TOKEN_INVALID` | Missing or invalid CSRF token on an unsafe method |
| 403 | `ORIGIN_NOT_ALLOWED` | `Origin`/`Referer` does not match this app |
| 404 | `NOT_FOUND` | Unknown path or resource |
| 405 | `METHOD_NOT_ALLOWED` | Route exists, method does not |
| 409 | `CONFLICT` | State conflict (reserved for later phases) |
| 409 | `EMAIL_IN_USE` | Registration for an email that already has an account |
| 413 | `PAYLOAD_TOO_LARGE` | Body above `MAX_CONTENT_LENGTH` (16 MB) |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Endpoint requires JSON and the body was not |
| 422 | `VALIDATION_ERROR` | Field validation failed; see `details` |
| 429 | `RATE_LIMITED` | Rate limit exceeded; see `Retry-After` |
| 500 | `INTERNAL_ERROR` | Unhandled server error — fixed message, logged with the request id |
| 503 | `SERVICE_UNAVAILABLE` | Readiness check failed |

The mapping lives in `DEFAULT_MESSAGES` (`app/api/errors.py`). Messages are
written for end users and never describe internals.

## 5. Endpoints

### `GET /api/v1/health`

Liveness. No database access, so a slow database cannot fail the probe.
Rate limit bucket `health` (60/min).

```json
{ "data": { "service": "digital-club-api", "status": "ok", "api_version": "v1" },
  "meta": { "request_id": "…" } }
```

### `GET /api/v1/ready`

Readiness. Executes `SELECT 1` and returns `503 SERVICE_UNAVAILABLE` on failure.
Rate limit bucket `ready` (30/min).

```json
{ "data": { "status": "ready", "database": true }, "meta": { "request_id": "…" } }
```

### `GET /api/v1/diagnostics`

Admin only (`api_role_required('admin')`). Returns labels and booleans only.

```json
{ "data": {
    "environment": "development",
    "authentication": "flask-login-session",
    "csrf": { "enabled": true, "header": "X-CSRF-Token" },
    "rate_limiting": { "enabled": true, "backend": "process-local" },
    "turnstile": { "configured": true },
    "secret_key_configured": true,
    "database": { "connected": true, "dialect": "sqlite" },
    "viewer_role": "admin" },
  "meta": { "request_id": "…" } }
```

Never returned here: the secret value, the database URI or path, table/row
counts, user records, environment dumps.

### `GET /api/v1/auth/csrf`

Issues the session-bound CSRF token. Callable while signed out (login and
registration are themselves CSRF-protected, so the client must obtain a token
first). Creates the session if none exists.

```json
{ "data": { "csrf_token": "ImJmOTA0ZTZhYzZlZDI3NTgw…" }, "meta": { "request_id": "…" } }
```

Response is `Cache-Control: no-store`. Rate limit bucket `csrf` (60/min).

### `POST /api/v1/auth/csrf/verify`

Proves the CSRF handshake end to end; changes no state. Requires the token in
`X-CSRF-Token`.

```json
{ "data": { "valid": true, "method": "POST" }, "meta": { "request_id": "…" } }
```

`403 CSRF_TOKEN_INVALID` when the token is missing/invalid;
`403 ORIGIN_NOT_ALLOWED` when `Origin` is foreign. Rate limit bucket
`csrf_verify` (30/min).

### `GET /api/v1/me`

The signed-in user's own identity. This is the **only** source of identity for the
SPA: there is no session copy in browser storage.

```json
{ "data": {
    "user": { "id": 12, "full_name": "Amina Juma", "email": "member@example.test",
              "role": "student", "status": "approved", "is_super_admin": false },
    "member": { "id": 7, "member_number": "DC-2026-0007", "course": "Bachelor of Computer Science",
                "year": "Year 2", "status": "student" },
    "profile_completion": { "required": false, "missing_fields": [], "percent": 100 },
    "capabilities": ["member.panel"] },
  "meta": { "request_id": "…", "unread_notifications": 3 } }
```

- `status` is `approved`, `pending` or `inactive`.
- `capabilities` is derived for presentation only (`member.panel`,
  `quizmaster.author`, `admin.panel`). The server still enforces every action;
  the list never grants access.
- `401 AUTH_REQUIRED` when anonymous; `403 ACCOUNT_INACTIVE` for a deactivated
  account. Always `no-store`.
- Fields never included: password hash, e-mail/phone of anyone else, payment
  records, administrative attributes, the member's own phone number (the profile
  endpoint owns that).
- `profile_completion` is **reported, not enforced** — unlike the HTML member
  pages, an API read is never redirected for an incomplete profile.
- `member` is `null` for an admin account without a member row.

### `POST /api/v1/auth/login`

Creates the session. Requires the CSRF token from `GET /auth/csrf`.

Request: `{ "email", "password", "remember"?, "turnstile_token" }`

```json
{ "data": { "user": { "id": 12, "full_name": "Amina Juma", "email": "member@example.test",
                       "role": "student", "status": "approved", "is_super_admin": false },
            "csrf_token": "ImJmOTA0ZTZh…" },
  "meta": { "request_id": "…" } }
```

| Status | Code | Cause |
| --- | --- | --- |
| 401 | `INVALID_CREDENTIALS` | No such account, or wrong password (same message for both) |
| 403 | `ACCOUNT_INACTIVE` | Deactivated account |
| 400 | `TURNSTILE_FAILED` | Verification failed, or keys are not configured (refused, never allowed) |
| 422 | `VALIDATION_ERROR` | Missing e-mail or password |

On success the session is **replaced** (`session.clear()` before `login_user`), so
the anonymous session and its CSRF token cannot be reused: the response returns
the token for the authenticated session. A missing digital ID is generated after
sign-in exactly as the HTML login does.

### `POST /api/v1/auth/logout`

Session required. `204` with an empty body. The remember-me cookie is cleared and
the session is emptied on the server.

### `POST /api/v1/auth/register`

Request: `{ "full_name", "email", "password", "course", "year", "phone", "turnstile_token" }`

```json
{ "data": { "user": { "id": 21, "email": "neema@example.test", "status": "approved",
                        "can_sign_in": true } },
  "meta": { "request_id": "…" } }
```

`201` on success. Registration activates the account immediately: `status` is
always `approved` and `can_sign_in` always `true`, so the student can sign in
right away with no administrator action. Registration itself never signs the
visitor in. `SystemSettings.registration_approval_mode` and the legacy
`User.is_approved` flag no longer affect eligibility; only
`User.is_active_account` (administrator deactivation) does.

- `409 EMAIL_IN_USE` when the address already has an account.
- `422 VALIDATION_ERROR` with `details` naming the field for: missing values, an
  invalid e-mail, a password under 8 characters, a course or year outside
  `app/member_requirements.py`'s fixed lists (the same lists the HTML form uses).
- `400 TURNSTILE_FAILED` as above.

Account creation is `app.services.accounts.create_student_account`, shared with
the Jinja registration route, so both surfaces apply identical rules.

### `GET /api/v1/auth/approval-status?email=`

`{ "data": { "status": "approved" } }` where status is `approved` or `rejected`
(a deactivated account). Registration no longer creates a pending state, so the
response is kept only for compatibility with older clients. Signed in, it reports
the caller's own status
and ignores `email`. Signed out, `email` is required (`422` if absent) and an
unknown address is `404 NOT_FOUND`. The response contains no name, phone number
or member number. Bucket `auth_approval` (15/min).

### `POST /api/v1/auth/password/forgot`

Request: `{ "email", "turnstile_token" }` → `202 { "data": { "accepted": true } }`.

The body is identical whether or not the account exists, so the endpoint is not
an account oracle. When the account does exist, the existing mail/SMS service
sends a link to `<origin>/auth/reset-password/<token>` (the origin is the one the
request arrived on, which is the SPA in both environments).

### `POST /api/v1/auth/password/reset`

Request: `{ "token", "password" }` → `204` with an empty body.

| Status | Code | Cause |
| --- | --- | --- |
| 400 | `TOKEN_INVALID` | Malformed token, or it no longer matches the account |
| 400 | `TOKEN_EXPIRED` | Older than 24 hours |
| 422 | `VALIDATION_ERROR` | Password under 8 characters |

Tokens are the existing `itsdangerous` serializer tokens (`salt`
`password-reset-salt`), so the HTML reset page and the SPA accept the same link.

## 6. Authentication and authorization

Authentication is the **existing Flask-Login session cookie**. No second
identity store, no JWT, no token written to `localStorage`/`sessionStorage`.

| Setting | Value |
| --- | --- |
| Cookie | Flask signed session cookie (`session`), `HttpOnly`, `SameSite=Lax` |
| `Secure` | On outside development; `SESSION_COOKIE_SECURE=0` locally for loopback HTTP |
| Lifetime | 30 days (`SESSION_LIFETIME_DAYS`) |
| Remember-me | Opt-in on the login form, 30 days (`REMEMBER_LIFETIME_DAYS`) |
| Client requirement | `fetch(url, { credentials: 'include' })`; the cookie is never read by JavaScript |

Decorators (`app/api/auth.py`):

| Decorator | Anonymous | Wrong role | Allowed |
| --- | --- | --- | --- |
| `api_login_required` | `401 AUTH_REQUIRED` | — | proceeds |
| `api_role_required('admin')` | `401 AUTH_REQUIRED` | `403 FORBIDDEN` | proceeds |

Roles are the three strings the database already stores: `student` (panel
"member"), `quizmaster`, `admin`. Super admins are `admin`.

Rules for future handlers:

- Authorisation is decided **on the server**. A React route guard is
  presentation only and is never trusted.
- Resource ownership is checked inside the handler against the session user
  (`current_user.member.id`), never against a client-supplied `member_id`.
- A deactivated account is rejected with `403 ACCOUNT_INACTIVE`; the session is
  cleared first, so the browser lands signed out.
- Personalised responses are `no-store`.

## 7. CSRF

Mechanism: Flask-WTF `CSRFProtect`, initialised application-wide (`app/__init__.py`).

| Setting | Value | Reason |
| --- | --- | --- |
| `WTF_CSRF_ENABLED` | `True` | Protection on |
| `WTF_CSRF_CHECK_DEFAULT` | `True` | Every unsafe method is checked, API and HTML alike (all 135 forms were tokenised in the same change) |
| `WTF_CSRF_HEADERS` | `['X-CSRF-Token']` | The header the React client sends |
| `WTF_CSRF_TIME_LIMIT` | `None` | Token lives exactly as long as the session; no clock-dependent expiry |
| `WTF_CSRF_SSL_STRICT` | default (`True`) | Referer required for HTTPS requests; dev is HTTP |

Token delivery:

1. `POST`/`PUT`/`PATCH`/`DELETE` must carry the token in `X-CSRF-Token`
   (API/fetch) or the `csrf_token` form field (HTML forms).
2. Safe methods (`GET`, `HEAD`, `OPTIONS`) are not checked.
3. A rejected request never reaches the view: `403 CSRF_TOKEN_INVALID` for
   `/api/`, HTTP `400` with the `errors/csrf.html` page for a form.

Second, independent gate: `Origin` (falling back to `Referer`) must match the
request host, or be listed in `APP_ALLOWED_ORIGINS`. A request with no
`Origin`/`Referer` (curl, tests, server-to-server) is not blocked by this gate,
but it still needs the token, so there is no bypass. Failure is
`403 ORIGIN_NOT_ALLOWED` for `/api/` and a `400` page otherwise.

Client contract for the SPA:

1. `GET /api/v1/auth/csrf` once per session; keep the token in memory.
2. Attach it as `X-CSRF-Token` to every mutation.
3. On `403 CSRF_TOKEN_INVALID`, refetch once and retry the action once.
4. Never persist the token in web storage.

Existing Jinja pages: 135 POST forms across 81 templates carry
`<input type="hidden" name="csrf_token" value="{{ csrf_token() }}">`;
`app/static/js/csrf.js` injects the field into forms rendered after load (it uses
a `MutationObserver`) and adds `X-CSRF-Token` to same-origin `fetch`/XHR writes.
The token is exposed to JavaScript only through `<meta name="csrf-token">` in the
two base layouts. Logout is `POST`-only.

## 8. Rate limiting

Implemented in `app/api/ratelimit.py` as a per-process sliding window.

| Bucket | Default | Applied to |
| --- | --- | --- |
| `default` | 120/min | anything without its own bucket |
| `health` | 60/min | `GET /health` |
| `ready` | 30/min | `GET /ready` |
| `diagnostics` | 10/min | `GET /diagnostics` |
| `csrf` | 60/min | `GET /auth/csrf` |
| `csrf_verify` | 30/min | `POST /auth/csrf/verify` |
| `me` | 60/min | `GET /me` |
| `auth_login` | 10/min | `POST /auth/login` |
| `auth_logout` | 30/min | `POST /auth/logout` |
| `auth_register` | 5/hour | `POST /auth/register` |
| `auth_approval` | 15/min | `GET /auth/approval-status` |
| `auth_forgot` | 5/hour | `POST /auth/password/forgot` |
| `auth_reset` | 10/hour | `POST /auth/password/reset` |
| `public_read` | 180/min | public `GET` reads (`/public/*`, except the buckets below) |
| `public_stats` | 60/min | `GET /public/stats`, `GET /public/site` |
| `public_search` | 60/min | `GET /public/search` |
| `public_rsvp` | 10/hour | `POST /public/events/<id>/rsvp` |
| `public_newsletter` | 5/hour | `POST /public/newsletter` |
| `verify_id` | 20/min | `GET /public/verify-id/<member_id>` |

- Key: the authenticated user id when signed in, otherwise `remote_addr`. This
  keeps one campus NAT from locking out every signed-in student.
- Limits are read from `config['API_RATE_LIMITS']` at request time, so a test or
  deployment can tune them without code changes.
- `RATELIMIT_ENABLED=0` disables the check (local debugging only; never in
  production).
- Exceeding a bucket returns `429 RATE_LIMITED` with `error.details.retry_after`
  and a `Retry-After` header.
- **Limitation (R19):** counters are in memory, so the effective limit is *per
  worker*. A shared store (Redis) is required before running multiple Gunicorn
  workers or instances. State is also lost on restart.

## 9. Validation conventions

Helpers in `app/api/validation.py`, each raising `ValidationError`
(`422 VALIDATION_ERROR`) with a field → message map:

| Helper | Purpose |
| --- | --- |
| `require_json()` | `415` if not JSON, `400` if unparsable, `422` if not an object |
| `get_string(payload, field, required, max_length, strip)` | Trimmed, length-limited string |
| `get_int(payload, field, required, minimum, maximum)` | Integer with bounds; booleans are rejected |
| `get_bool(payload, field, default)` | Accepts `true/false`, `"1"/"0"`, `1/0` |
| `get_pagination(max_per_page=100, default_per_page=20)` | `page`, `per_page`, `offset`; hard cap 100 |

Collection responses will use:

```json
{ "data": [ ... ],
  "meta": { "page": 1, "per_page": 20, "total": 137, "pages": 7, "request_id": "…" } }
```

## 10. Configuration reference

| Variable | Default | Effect |
| --- | --- | --- |
| `FLASK_ENV` | — | `development`/`dev`/`local` enables the dev-only fallback secret and insecure local cookies |
| `SECRET_KEY` | — | **Required outside development.** Empty outside development → `create_app()` raises at startup |
| `SESSION_COOKIE_SECURE` | on outside dev, off in dev | `Secure` flag on the session cookie |
| `SESSION_COOKIE_SAMESITE` | `Lax` | Session cookie SameSite |
| `SESSION_LIFETIME_DAYS` / `REMEMBER_LIFETIME_DAYS` | `30` / `30` | Session and remember-me duration |
| `RATELIMIT_ENABLED` | `1` | Toggle the API rate limiter |
| `APP_ALLOWED_ORIGINS` | empty | Extra origins (comma separated) allowed to POST here |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | empty | Turnstile keys; absent means registration/login/RSVP/reset refuse the challenge |
| `PREFERRED_URL_SCHEME` | `https` | Scheme for generated URLs; `http` locally |
| `SERVER_NAME` | unset | Leave unset behind proxies/healthchecks |

Fail-closed behaviour is implemented in `app/security_config.py` and unit-tested
(`resolve_secret_key`, `resolve_cookie_secure`, `resolve_allowed_origins`).

## 11. Adding an endpoint (conventions)

```python
# app/api/<area>.py
from app.api import api_bp
from app.api.auth import api_role_required
from app.api.errors import json_endpoint
from app.api.ratelimit import rate_limit
from app.api.responses import no_store, success

@api_bp.route('/things', methods=['GET'])
@json_endpoint          # outermost: turns unexpected exceptions into a safe 500
@rate_limit('things')   # then the limit
@api_role_required('admin')   # then authentication/authorisation
def list_things():
    return no_store(success({'items': []}))
```

Register the module in `app/api/__init__.py` (import for its side effect). Do not
add a new error format, a new auth mechanism or an `@csrf.exempt` on a
state-changing route. Business logic belongs in the handler; shared queries can
move to a service module when a second caller appears.

## 12. Not implemented yet (later phases)

`POST /me/password` (AU8 — changing a password while signed in, which the
contract pairs with invalidating other sessions); member aggregates on `/me`
(points, rank, tier, membership state) beyond identity and profile completion;
member, admin and upload endpoints (Phases 8–9); social graph
(Phase 10); pagination responses on real collections; OpenAPI/schema generation.

## 13. SPA integration notes (Phase 6)

The React client speaks to this API through `new-website-design/src/lib/api.ts`:

- `GET /auth/csrf` once per session, token kept **in memory** and attached as
  `X-CSRF-Token`; one automatic retry on `403 CSRF_TOKEN_INVALID`, never a
  storage write.
- All requests are `credentials: 'same-origin'`, so the `HttpOnly` session cookie
  is sent by the browser and is unreadable from JavaScript.
- Identity comes from `GET /me` only. `AuthProvider` reads it on load, keeps a
  `loading` state so route guards do not redirect while the answer is in flight,
  and re-reads it after sign-in. The prototype's `kiut-demo-session`
  `localStorage` key is deleted on load and never read.
- Turnstile is rendered by `src/components/auth/Turnstile.tsx` with the public
  site key `VITE_TURNSTILE_SITE_KEY` (build-time; local development falls back to
  Cloudflare's published always-pass **test** key). A token is single-use, so a
  failed submit resets the widget before the next attempt.
- Sign-out clears the CSRF token and user state even if the request fails, so a
  member is never trapped in a stale screen.

## 14. Public website endpoints (Phase 7)

`app/api/public.py`, mounted under `/api/v1/public`. **Unauthenticated**, no CSRF
token for reads, and every response is safe to cache (`Cache-Control: public,
max-age=…`); the member-verification response is the exception and is `no-store`.
Responses use the standard envelope, with pagination in `meta.pagination`.

| # | Method and path | Returns | Cache |
| --- | --- | --- | --- |
| PU1 | `GET /public/home` | `stats`, `featured_projects`, `upcoming_events`, `latest_news`, `latest_blog` | 60 s |
| PU2 | `GET /public/stats` | member/student/alumni, project, event, competition and session totals | 120 s |
| PU3 | `GET /public/news?page=&per_page=` | published news, newest first, paginated | 60 s |
| PU4 | `GET /public/news/<id>` | one published news item with `body` (paragraphs) | 60 s |
| PU5 | `GET /public/blogs?page=&per_page=&tag=` | published blog summaries | 60 s |
| PU6 | `GET /public/blogs/<slug>` | one published blog with `body_html_sanitised` | 60 s |
| PU7 | `GET /public/events?page=&per_page=&scope=` | `upcoming` (default), `past` or `all` public events | 60 s |
| PU8 | `GET /public/events/<id>` | one public event plus `registered_count` and `capacity` | 30 s |
| PU9 | `POST /public/events/<id>/rsvp` | RSVP for a public event (`full_name`, `email`, `phone?`, `student_id?`, `turnstile_token`) | — |
| PU10 | `GET /public/projects?page=&per_page=&course=&tech=` | public projects, featured first | 60 s |
| PU11 | `GET /public/projects/<id>` | one public project with team and links | 60 s |
| PU12 | `GET /public/gallery?page=&per_page=&type=` | gallery items, newest first | 120 s |
| PU13 | `GET /public/leaders` | current elected leadership by position | 120 s |
| PU14 | `GET /public/topics` | technology topics with project/blog counts | 300 s |
| PU15 | `GET /public/elections` | election cycles with candidates and results | 120 s |
| PU16 | `GET /public/members?page=&per_page=&course=&year=&status=&q=` | public member directory (display fields only) | 60 s |
| PU17 | `GET /public/members/<public_slug>` | one public member profile | 60 s |
| PU18 | `GET /public/members/<public_slug>/projects` | that member's public projects | 60 s |
| PU19 | `GET /public/verify-id/<member_id_number>` | whether the ID exists and its display name, course, year, status and `id_valid_until` — `no-store` | — |
| PU20 | `GET /public/contact` | contact details and office hours | 300 s |
| PU21 | `POST /public/newsletter` | subscribe an e-mail (`email`, `turnstile_token?`) | — |
| PU22 | `GET /public/search?q=&types=` | grouped search over news, blogs, projects and events | 30 s |
| PU23 | `GET /public/site` | site name, tagline, navigation-relevant flags and social links | 300 s |

Notes:

- Only published/public rows are returned: `News.is_published` (or a published
date), `Blog.is_published`, public events (`target_audience = 'everyone'`) and
  `Project.is_public`. Drafts never leak, including through PU22.
- Blog HTML is sanitised server-side by `app/api/sanitize.py` with an allow-list
  parser (`sanitize_html`); the SPA may render `body_html_sanitised` with
  `dangerouslySetInnerHTML` and nothing else from that field.
- `public_slug` is derived (`slugify(full_name)-<member.id>`) because the schema
  has no slug column; the resolver re-computes it and rejects a mismatch.
- `id_valid_until` is derived from the member's latest membership payment end
  date; there is no stored column.
- PU19 is enumerated by ID, so it is `no-store` and limited to 20/min.
- PU9 and PU21 are the only public writes. They still require the CSRF token and
  the Origin check, deduplicate by e-mail, and validate Turnstile when a secret is
  configured.
- The SPA consumes these through `new-website-design/src/lib/publicApi.ts` and
  `src/lib/usePublicData.ts`. Pages show loading, empty and error states; there is
  no demo-data fallback.

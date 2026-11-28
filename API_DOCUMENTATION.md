# API DOCUMENTATION — KIUT Digital Club (`/api/v1`)

Status: **Phases 5–10 (social graph started).** This document describes the transport,
envelope, security and configuration conventions that every later endpoint
inherits, plus the session-authentication and account-lifecycle endpoints
(Phase 6), the public website endpoints (Phase 7), the member panel (Phase 8)
the first admin read slice (Phase 9) and the member social graph (Phase 10).
Admin writes, uploads, social reports/moderation and notification fan-out are
not implemented yet — see §12.

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

The member API surface (reads and writes) is complete — see §15. Still
outstanding:

- **MD51 `GET /member/messages`** — there is no message model; admin messaging
  writes notification batches, which MD24–MD26 already serve.
- **Admin writes and upload endpoints** (rest of Phase 9), **social
  reports/moderation, audit entries and notification fan-out** (rest of Phase
  10), **OpenAPI/schema generation**.

AU8 `POST /me/password` and the `/me` member aggregates are implemented — see
§15.

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

## 15. Member panel endpoints (Phase 8)

`app/api/member.py`, mounted under `/api/v1/member`, plus `POST /me/password`.
Every route requires a session and an active account (`401 AUTH_REQUIRED`,
`403 ACCOUNT_INACTIVE`, `403 CSRF_TOKEN_INVALID` on writes). Identity always
comes from the session's own `Member` row; **no endpoint accepts another
member's id as "self"**. Responses are `Cache-Control: no-store`, because every
one of them is personalised.

| # | Method and path | Returns |
| --- | --- | --- |
| — | `POST /me/password` | `204`; body `{current_password, new_password}` |
| MD1 | `GET /member/dashboard` | greeting, membership, points/rank/tier/next tier, profile completion, active quiz, next event, current week, 5 recent rewards, team, unread count |
| MD2 | `GET /member/profile` | the full self record (e-mail, phone, links, areas, projects), plus `privacy` |
| MD3 | `PATCH /member/profile` | updated self record; `full_name`, `phone`, `course`, `year` required |
| MD6 | `GET /member/digital-id` | number, status, issued/valid dates, verify URL, QR payload, image URLs |
| MD7 | `POST /member/digital-id/regenerate` | `200` with the new ID state |
| MD8 | `GET /member/digital-id/image?side=front\|back` | `image/png`, `no-store` |
| MD9 | `GET /member/membership` | state, period, days remaining/expired, every payment |
| MD10 | `GET /member/rewards` | points, rank, tier, next trophy, trophy ladder with earned flags |
| MD11 | `GET /member/rewards/history` | own points ledger, paginated |
| MD12 | `GET /member/projects` | own projects, including unpublished |
| MD16 | `GET /member/events?scope=upcoming\|past\|all` | member-visible events with the caller's RSVP state |
| MD17 | `POST /member/events/<id>/rsvp` | `201` RSVP; optional dietary/emergency/notes fields |
| MD18 | `DELETE /member/events/<id>/rsvp` | `204` before the event starts and before check-in |
| MD19 | `GET /member/sessions/timetable?week=` | published week and sessions grouped by day |
| MD20 | `GET /member/sessions/instructors` | instructors of the latest published week with their sessions |
| MD22 | `GET /member/rankings` | club leaderboard (paginated), own entry, team standings |
| MD23 | `GET /member/rankings/points-transactions` | own ledger with running total |
| MD24 | `GET /member/notifications?unread=` | own notifications, paginated, `meta.unread` |
| MD25 | `GET /member/notifications/<id>` | one own notification; **does not** mark it read |
| MD26 | `POST /member/notifications/<id>/read`, `POST /member/notifications/read-all` | `204`, idempotent |
| MD27 | `GET /member/quizzes` | published warmups with the caller's attempt state |
| MD28 | `GET /member/quizzes/<id>` | quiz and questions **without** correct answers |
| MD35 | `GET /member/competitions?level=weekly\|monthly` | active and past competitions with eligibility `reasons` |
| MD36 | `GET /member/competitions/<id>` | brief, visible criteria, rewards, sponsors, own enrolment/submission, eligibility |
| MD39 | `GET /member/competitions/<id>/leaderboard` | ranked results once finalized (`409 LEADERBOARD_CLOSED` before) |
| MD40 | `GET /member/elections` | visible elections in active/upcoming/past buckets with `can_apply`/`can_vote` |
| MD41 | `GET /member/elections/<id>` | positions, own candidacy, ballot while voting is open |
| MD45 | `GET /member/elections/<id>/results` | results when finalized or live results are enabled (`409 RESULTS_NOT_PUBLISHED`) |
| MD46 | `GET /member/teams`, `GET /member/teams/<id>` | own team, pending requests, leader queue, open teams; team detail |
| MD50 | `GET /member/search?q=` | member directory fields only (`member_id`, `display_name`, `course`, `year`, `avatar_url`); lists only members who are `public` **and** `discoverable` (MD5) |

### 15.1 Writes

All of these need a session, a member profile where stated and the
`X-CSRF-Token` header. Body validation failures are `422` with a `details` map.

| # | Method and path | Returns |
| --- | --- | --- |
| MD5 | `PUT /member/profile/privacy` | replaces the visibility settings: `{profile_visibility:'public'\|'private', discoverable:bool, sections:{bio\|skills\|interests\|links\|projects\|achievements: bool}}`; any subset may be sent; returns the stored `{profile_visibility, discoverable, sections}`; `422` for an unknown value or section |
| MD4 | `POST /member/profile/avatar` | `201 {avatar_url}`; multipart `avatar` (PNG/JPG/JPEG/GIF, ≤ 2 MB); replaces the old file and refreshes the digital ID best-effort |
| MD13 | `POST /member/projects` | `201` project; `title` required, optional `description`, `github_link`, `demo_link`, `technologies`, `is_public` |
| MD14 | `GET/PATCH/DELETE /member/projects/<id>` | own project only; `404` for anyone else's id; `DELETE` → `204` |
| MD15 | `POST /member/projects/<id>/submit` | `202 {status:'published', review_required:false}`; the original app has no moderation queue, so this applies the existing publish rule |
| MD21 | `POST /member/sessions/<id>/report` | `201` (or `200` when updating a pending report) with `status:'pending'`; assigned instructor only (`403 NOT_INSTRUCTOR`), `409 REPORT_APPROVED` |
| MD29 | `POST /member/quizzes/<id>/attempts` | `201 {attempt_id, expires_at}`; `409 QUIZ_CLOSED`, `409 ALREADY_ATTEMPTED`, `403 QUIZ_OWNER` |
| MD30 | `PATCH /member/attempts/<id>/answers` | `{answers:[{question_id, choice_id}]}` → `{saved}`; options are validated against the question and scored server-side; `409 ATTEMPT_SUBMITTED`, `409 ATTEMPT_EXPIRED` |
| MD31 | `POST /member/attempts/<id>/violation` | `{kind:'tab_switch\|blur\|paste\|inactivity'}` → `{violations, remaining, auto_submitted}`; auto-submits at 3; `409 ATTEMPT_SUBMITTED` |
| MD32 | `POST /member/attempts/<id>/submit` | `201` scored attempt (`score`, `correct_count`, `total_count`, `confidence_adjusted_score`); optional final `answers`; `409 ATTEMPT_SUBMITTED` |
| MD33 | `GET /member/attempts/<id>` | attempt state; per-question `review` only once results are released |
| MD34 | `GET /member/quizzes/<id>/leaderboard` | ranked attempts after release (`409 LEADERBOARD_CLOSED` before) |
| MD37 | `POST /member/competitions/<id>/enroll` | `201` enrolment; body `{agree_terms:true, mode:'individual'\|'team'}`; `409 ENROLLMENT_CLOSED`, `ALREADY_ENROLLED`, `MEMBERSHIP_REQUIRED`, `YEAR_NOT_ELIGIBLE`, `JUDGE_CANNOT_ENROLL`, `TEAM_NOT_ELIGIBLE` |
| MD38 | `POST /member/competitions/<id>/submissions` | `201` submission; JSON `{submission_url}` or multipart `submission_file` for video/report competitions; `409 NOT_ENROLLED`, `ALREADY_SUBMITTED`, `SUBMISSION_CLOSED`, `DISQUALIFIED`, `TEAM_ENTRY` |
| MD42 | `POST /member/elections/<id>/apply/<position_id>` | `201` candidacy (or `200` when editing a draft); multipart or JSON `manifesto` (≥ 50 chars) + `passport_image`; `409 INELIGIBLE`, `APPLICATION_CLOSED`, `ALREADY_APPLIED`, `CANDIDACY_LOCKED` |
| MD43 | `POST /member/elections/<id>/withdraw/<candidate_id>` | `204`, idempotent; `404` for a candidacy that is not the caller's |
| MD44 | `POST /member/elections/<id>/vote` | `201 {voted_positions, receipt}`; `{votes:[{position_id,candidate_id}]}` validated as a whole; `409 VOTING_CLOSED`, `ALREADY_VOTED`, `SELF_VOTE`, `INELIGIBLE` |
| MD47 | `POST /member/teams/<id>/requests` | `201` join request (`200` when re-submitting after a rejection); `409 TEAM_CLOSED`, `TEAM_SUSPENDED`, `ALREADY_IN_TEAM`, `ALREADY_REQUESTED` |
| MD48 | `POST /member/teams/<id>/requests/<request_id>/decision` | `{decision:'approve'\|'reject'}`; leader only (`403 NOT_TEAM_LEADER`); `409 REQUEST_DECIDED`, `ALREADY_IN_ANOTHER_TEAM` |
| MD49 | `DELETE /member/teams/<id>/members/<member_id>` | `204`; leader or admin (`403 NOT_TEAM_LEADER`); `409 LEADER_CANNOT_BE_REMOVED` |

Conventions that apply to every write:

- Identity is the session; no body field can name another member.
- State windows (quiz time, competition window, application/voting phase) are
  re-checked on the server from the stored record, never from the request.
- Points, quiz scores, election tallies and eligibility are computed server-side
  through the same helpers the Jinja views use (`_calculate_quiz_attempt_scores`,
  `_finalize_quiz_results_if_due`, `_member_can_submit`,
  `_member_can_team_enroll`, `tally_election_results`), so the two surfaces
  cannot diverge.
- Uploads are extension-checked, size-capped and written under the configured
  upload folder with a generated name; competition files live in
  `uploads/competitions`, avatars in `uploads/profiles`.
- Every response is `no-store`.

### 15.2 Error codes specific to the member surface

`PROFILE_REQUIRED` (404 — the account has no member row), `ALREADY_REGISTERED`,
`RSVP_CLOSED`, `EVENT_FULL`, `MEMBERSHIP_REQUIRED`, `LEADERBOARD_CLOSED`,
`RESULTS_NOT_PUBLISHED`, `ID_GENERATION_FAILED`, `CURRENT_PASSWORD_INVALID`,
`REPORT_APPROVED`, `NOT_INSTRUCTOR`, `QUIZ_OWNER`, `QUIZ_CLOSED`,
`ALREADY_ATTEMPTED`, `ATTEMPT_SUBMITTED`, `ATTEMPT_EXPIRED`, `NOT_ENROLLED`,
`ALREADY_ENROLLED`, `ALREADY_SUBMITTED`, `SUBMISSION_CLOSED`, `DISQUALIFIED`,
`TEAM_ENTRY`, `JUDGE_CANNOT_ENROLL`, `JUDGE_CANNOT_SUBMIT`, `YEAR_NOT_ELIGIBLE`,
`ENROLLMENT_CLOSED`, `TEAM_NOT_ELIGIBLE`, `INELIGIBLE`, `APPLICATION_CLOSED`,
`ALREADY_APPLIED`, `CANDIDACY_LOCKED`, `VOTING_CLOSED`, `ALREADY_VOTED`,
`SELF_VOTE`, `NOT_TEAM_LEADER`, `TEAM_CLOSED`, `TEAM_SUSPENDED`,
`ALREADY_IN_TEAM`, `ALREADY_REQUESTED`, `REQUEST_DECIDED`,
`ALREADY_IN_ANOTHER_TEAM`, `LEADER_CANNOT_BE_REMOVED`.

Rules and caveats:

- Payments, e-mail, phone, member number and points stay on member endpoints;
  no public endpoint returns them, and MD50 is the only cross-member read.
- MD5 privacy gates the profile surface only. `GET /public/members/<slug>`
  answers `404` for a private profile and masks hidden sections (`null` / `[]` /
  `{}`); `GET /public/members` and MD50 require `public` + `discoverable`.
  Leaderboards and `GET /public/verify-id/<number>` are unchanged by design.
- Eligibility and phases come from the existing helpers
  (`_competition_eligibility` mirrors `_member_can_submit`; `election_phase`,
  `member_meets_election_eligibility`), never from client input.
- Rate limits: `member_read` 240/min, `member_write` 60/min, `member_search`
  60/min, per user once signed in.
- `MD7` regenerates synchronously and answers `200`; the contract's `202 queued`
  would describe work that does not happen.
- `MD8` streams the file from the upload folder; direct `/static/uploads` access
  is unchanged and remains an open item (audit R4/R7).
- `POST /me/password` cannot invalidate other sessions: that needs a
  session-epoch column and a migration (audit R16). Open sessions stay open.
- The digital ID is not generated on a read request; `status: "pending"` means
  no image exists yet and the SPA offers `MD7`.
- Server scoring, tallying and points accrual are shared with the existing HTML
  handlers by importing their helpers, so an API attempt and a Jinja attempt
  produce identical scores.
- `PUT /member/profile/privacy` (MD5) stores `profile_visibility`,
  `discoverable` and `privacy_sections`; unknown section names are rejected and
  the defaults stay `private` / not discoverable.

## 16. Admin portal (Phase 9)

`app/api/admin.py`, mounted under `/api/v1/admin`. This is the first slice of
Phase 9 and it is read-only: every route requires an `admin` session
(`401 AUTH_REQUIRED`, `403 FORBIDDEN`, `403 ACCOUNT_INACTIVE`) and answers
`Cache-Control: no-store`. Rates are a separate `admin_read` bucket, 180/min.

| # | Method and path | Returns |
| --- | --- | --- |
| AD1 | `GET /admin/dashboard` | member counts (total, approved, pending approval, deactivated), upcoming events, active newsletter subscribers, today's active users, the open period's revenue/expenses/balance (or `null`), 5 recent news items, 5 recent student sign-ups |
| AD2 | `GET /admin/members` | account directory, newest first; filters `q` (e-mail, name, member number), `approval`, `role`, `account`, `status`, `course`, `year`; `meta.pagination` |
| AD3 | `GET /admin/members/<user_id>` | one account, plus `membership`, `points` (total/rank), `privacy` and `counts` when a member row exists |
| AD4 | `GET /admin/approvals` | accounts with `is_approved = false` that are still active, oldest first; `meta.pagination` |
| AD5 | `PATCH /admin/members/<user_id>` | role or access change; body `{role}` (`student`/`quizmaster`) and/or `{is_active, password}`; returns the updated account |

Rules and caveats:

- Every number is a `COUNT`/`SUM` over the real tables. With no open
  `FinancialPeriod`, `finance` is `null` rather than a zeroed substitute; with
  no `DailyActiveUser` row today, that count is `0`.
- An account without a `Member` row (staff, super admins) is listed, and AD3
  returns `membership`, `points`, `privacy` and `counts` as `null`.
- Filters are enum-checked; an unknown value is `422 VALIDATION_ERROR` with the
  field in `details`. `q` is a substring match like the HTML pages.
- Finance reuses `FinancialPeriod.get_total_revenue()` / `get_total_expenses()`,
  the same helpers the HTML dashboard calls; amounts are two-decimal floats.
- AD5 mirrors the Jinja rules: the acting account and super administrators are
  protected (`409 CANNOT_MODIFY_SELF` / `SUPER_ADMIN_PROTECTED`), an `admin`
  role cannot be changed here (`409 ADMIN_ROLE_IMMUTABLE`), and an access
  change requires the acting administrator's own password (`422` when missing,
  `403 PASSWORD_INVALID` when wrong) exactly like `toggle-active` in the HTML
  admin. Writes use the `admin_write` bucket (60/min).
- Content CRUD, finance, messaging, uploads and account deletion are **not**
  implemented yet; the SPA must not present them as working.

## 17. Member social graph (Phase 10, first slice)

`app/api/social.py`, mounted under `/api/v1/member`. Every route is personal to
the signed-in member: lists are that member's own lists, and no payload accepts
a viewer identity. Reads answer `Cache-Control: no-store`; writes need the CSRF
header and use the `social_write` bucket (30/min, per user). The target is a
`member.id`, the same id MD50 returns.

| # | Method and path | Returns |
| --- | --- | --- |
| SO1 | `GET /member/follows/followers` | own followers: member summary + `followed_at` |
| SO2 | `GET /member/follows/following` | own following: member summary + `followed_at` |
| SO3 | `POST /member/follows/<member_id>` | `201` following, or `202` `{state: "requested", request_id}` for a private profile |
| SO4 | `DELETE /member/follows/<member_id>` | `204`; unfollows, or cancels a pending outgoing request; `409 NOT_FOLLOWING` |
| SO5 | `GET /member/follows/requests` | pending incoming requests (`id`, `member`, `created_at`) |
| SO6 | `POST /member/follows/requests/<id>/accept` | `200`; creates the follow; recipient only |
| SO7 | `POST /member/follows/requests/<id>/decline` | `204` |
| SO8 | `GET /member/blocks` | own blocked members |
| SO9 | `POST /member/blocks/<member_id>` | `201`; also removes follows and cancels pending requests in both directions |
| SO10 | `DELETE /member/blocks/<member_id>` | `204` |

Error codes: `SELF_ACTION` (422), `BLOCKED`, `ALREADY_FOLLOWING`,
`ALREADY_REQUESTED`, `NOT_FOLLOWING`, `NO_REQUEST`, `ALREADY_BLOCKED` (409),
`NOT_FOUND` (404, includes unapproved and deactivated targets so their existence
is not disclosed) and `PROFILE_REQUIRED` (404, staff accounts without a member
row).

Rules and caveats:

- A public profile is followed immediately; a private profile only receives a
  pending request that its owner decides. A follow attempt never silently
  grants access to a private profile.
- A pending request from the target is accepted implicitly when the caller
  follows back, so the two of them never end up with two half-relationships.
- Blocking is symmetric in effect: neither side can follow, request or keep an
  existing follow. Unblocking does not restore the removed follows.
- There is no notification fan-out yet (no `MemberNotification` is written), no
  report/moderation record, and no audit entry; those need a moderation policy
  and an admin surface and are recorded as outstanding.
- Blocks do not yet filter MD50 results or the public member directory. Hiding
  a member across every surface is a wider change than this slice.
- The migration `e20261127130000` adds three empty tables only; nothing existing
  is modified.

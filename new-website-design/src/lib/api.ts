/**
 * The one place the browser talks to `/api/v1`.
 *
 * Everything here is same-origin: the session cookie is the Flask-Login cookie
 * the Jinja site already uses, and the CSRF token is the session-bound token
 * from `GET /auth/csrf`. No token is ever written to localStorage, so a stolen
 * script cannot lift an identity out of browser storage.
 *
 * Responses use the envelope described in app/api/responses.py:
 *   success: { data, meta }
 *   failure: { error: { code, message, details }, meta }
 */

export type FieldErrors = Record<string, string>

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details: FieldErrors

  constructor(message: string, code: string, status: number, details: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Retry once with a fresh token when the session-bound token expired. */
  retryOnCsrfFailure?: boolean
  /** Return the whole envelope (`{data, meta}`) instead of just `data`. */
  envelope?: boolean
}

let csrfToken: string | null = null

async function readToken(force = false) {
  if (csrfToken && !force) return csrfToken
  const response = await fetch('/api/v1/auth/csrf', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new ApiError('Could not start a secure session.', 'CSRF_UNAVAILABLE', response.status)
  }
  const body = await response.json()
  csrfToken = body.data.csrf_token as string
  return csrfToken
}

/** Forget the cached token (after sign-in the server issues a new one). */
export function setCsrfToken(token: string | null) {
  csrfToken = token
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, retryOnCsrfFailure = true } = options
  const needsToken = method !== 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (needsToken) headers['X-CSRF-Token'] = await readToken()

  const response = await fetch(`/api/v1${path}`, {
    method,
    credentials: 'same-origin',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return undefined as T

  let payload: { data?: T; error?: { code: string; message: string; details?: FieldErrors } } | null = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const code = payload?.error?.code ?? 'INTERNAL_ERROR'
    if (code === 'CSRF_TOKEN_INVALID' && needsToken && retryOnCsrfFailure) {
      await readToken(true)
      return apiRequest<T>(path, { ...options, retryOnCsrfFailure: false })
    }
    throw new ApiError(
      payload?.error?.message ?? 'The request failed. Please try again.',
      code,
      response.status,
      payload?.error?.details ?? {},
    )
  }

  if (options.envelope) return payload as T
  return (payload?.data ?? null) as T
}

export type MeResponse = {
  user: {
    id: number
    full_name: string
    email: string
    role: 'student' | 'quizmaster' | 'admin'
    status: 'approved' | 'pending' | 'inactive'
    is_super_admin: boolean
  }
  member: null | {
    id: number
    member_number: string | null
    course: string | null
    year: string | null
    status: string | null
  }
  profile_completion: { required: boolean; missing_fields: string[]; percent: number }
  capabilities: string[]
}

export type LoginResponse = {
  user: MeResponse['user']
  csrf_token: string
}

export const api = {
  me: () => apiRequest<MeResponse>('/me'),

  login: (input: { email: string; password: string; remember: boolean; turnstileToken: string }) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: {
        email: input.email,
        password: input.password,
        remember: input.remember,
        turnstile_token: input.turnstileToken,
      },
    }),

  logout: () => apiRequest<void>('/auth/logout', { method: 'POST', body: {} }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<void>('/me/password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    }),

  register: (input: {
    fullName: string
    email: string
    password: string
    phone: string
    course: string
    year: string
    turnstileToken: string
  }) =>
    apiRequest<{ user: { id: number; email: string; status: 'approved'; can_sign_in: boolean } }>(
      '/auth/register',
      {
        method: 'POST',
        body: {
          full_name: input.fullName,
          email: input.email,
          password: input.password,
          phone: input.phone,
          course: input.course,
          year: input.year,
          turnstile_token: input.turnstileToken,
        },
      },
    ),

  forgotPassword: (email: string, turnstileToken: string) =>
    apiRequest<{ accepted: boolean }>('/auth/password/forgot', {
      method: 'POST',
      body: { email, turnstile_token: turnstileToken },
    }),

  resetPassword: (token: string, password: string) =>
    apiRequest<void>('/auth/password/reset', {
      method: 'POST',
      body: { token, password },
    }),
}

/**
 * Cloudflare Turnstile site key (public by design). Local development falls back
 * to Cloudflare's published always-pass test key, which pairs with the test
 * secret already in local-dev/backend.env.example. Production must set
 * VITE_TURNSTILE_SITE_KEY at build time; an empty key blocks sign-in rather than
 * skipping verification.
 */
const configuredTurnstileKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '') as string
export const TURNSTILE_SITE_KEY =
  configuredTurnstileKey || (import.meta.env.DEV ? '1x00000000000000000000AA' : '')

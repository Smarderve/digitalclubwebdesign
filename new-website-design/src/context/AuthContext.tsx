import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError, setCsrfToken } from '../lib/api'
import type { MeResponse } from '../lib/api'

/**
 * Identity comes from the server session, never from browser storage.
 *
 * `GET /api/v1/me` is the only source of the signed-in user; it is read once on
 * load, again after sign-in, and whenever a caller asks for a refresh. There is
 * no demo account, no role inferred from an e-mail address and no `localStorage`
 * copy of the session: a reload while signed out simply finds no session.
 *
 * Route guards in this file are presentation only. Every API endpoint enforces
 * the same rules with its own decorators.
 */

export type Role = 'member' | 'admin' | 'quizmaster'

export type AuthUser = {
  name: string
  email: string
  role: Role
  memberId: string
  course: string
  year: string
  /** Server-derived permissions, used only to avoid showing doomed actions. */
  capabilities: string[]
}

export type AuthResult =
  | { ok: true; user?: AuthUser | null }
  | { ok: false; code: string; message: string; fieldErrors?: Record<string, string> }

type AuthContextValue = {
  user: AuthUser | null
  /** `loading` until the first `/me` answer, so guards never flash a redirect. */
  status: 'loading' | 'ready'
  login: (
    email: string,
    password: string,
    remember: boolean,
    turnstileToken: string,
  ) => Promise<AuthResult>
  register: (values: {
    fullName: string
    email: string
    password: string
    phone: string
    course: string
    year: string
    turnstileToken: string
  }) => Promise<AuthResult>
  logout: () => Promise<void>
  refresh: () => Promise<MeResponse | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toRole(role: MeResponse['user']['role']): Role {
  if (role === 'admin') return 'admin'
  if (role === 'quizmaster') return 'quizmaster'
  return 'member'
}

function toAuthUser(me: MeResponse): AuthUser {
  return {
    name: me.user.full_name,
    email: me.user.email,
    role: toRole(me.user.role),
    memberId: me.member?.member_number ?? String(me.user.id),
    course: me.member?.course ?? '',
    year: me.member?.year ?? '',
    capabilities: me.capabilities ?? [],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    /* One-time cleanup of the prototype's stored identity. It is never read
       again; removing it means no localStorage copy of a session survives. */
    try {
      localStorage.removeItem('kiut-demo-session')
    } catch {
      /* storage can be blocked */
    }
    return () => {
      mounted.current = false
    }
  }, [])

  const loadMe = useCallback(async () => {
    try {
      const me = await api.me()
      if (!mounted.current) return null
      setUser(toAuthUser(me))
      return me
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        if (mounted.current) setUser(null)
        return null
      }
      /* A network or server failure leaves the visitor signed out for this page
         load; it must not be reported as "wrong password" or a role decision. */
      if (mounted.current) setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadMe()
      if (!cancelled) setStatus('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [loadMe])

  const login = useCallback(
    async (email: string, password: string, remember: boolean, turnstileToken: string) => {
      try {
        const result = await api.login({
          email: email.trim(),
          password,
          remember,
          turnstileToken,
        })
        setCsrfToken(result.csrf_token)
        const me = await loadMe()
        return { ok: true as const, user: me ? toAuthUser(me) : null }
      } catch (error) {
        if (error instanceof ApiError) {
          return {
            ok: false as const,
            code: error.code,
            message: error.message,
            fieldErrors: error.details,
          }
        }
        return {
          ok: false as const,
          code: 'NETWORK_ERROR',
          message: 'Could not reach the server. Check your connection and try again.',
        }
      }
    },
    [loadMe],
  )

  const register = useCallback(
    async (values: {
      fullName: string
      email: string
      password: string
      phone: string
      course: string
      year: string
      turnstileToken: string
    }) => {
      try {
        await api.register(values)
        return { ok: true as const }
      } catch (error) {
        if (error instanceof ApiError) {
          return {
            ok: false as const,
            code: error.code,
            message: error.message,
            fieldErrors: error.details,
          }
        }
        return {
          ok: false as const,
          code: 'NETWORK_ERROR',
          message: 'Could not reach the server. Check your connection and try again.',
        }
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* The local session is cleared either way so nobody gets stuck signed in. */
    }
    setCsrfToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      login,
      register,
      logout,
      refresh: loadMe,
    }),
    [user, status, login, register, logout, loadMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function homeForRole(role: Role) {
  if (role === 'admin') return '/admin'
  if (role === 'quizmaster') return '/quizmaster'
  return '/member'
}

export function can(user: AuthUser | null, capability: string) {
  return Boolean(user?.capabilities.includes(capability))
}

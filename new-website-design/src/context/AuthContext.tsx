import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { demoMember } from '../data/demo'

export type Role = 'member' | 'admin' | 'quizmaster'

export type AuthUser = {
  name: string
  email: string
  role: Role
  memberId: string
  course: string
  year: string
}

type AuthContextValue = {
  user: AuthUser | null
  pendingApproval: boolean
  login: (email: string, password: string, role?: Role) => { ok: boolean; error?: string }
  register: (values: { fullName: string; email: string; phone: string; course: string; year: string }) => void
  logout: () => void
  clearPending: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'kiut-demo-session'

const demoAccounts: Record<Role, AuthUser> = {
  member: {
    name: demoMember.name,
    email: demoMember.email,
    role: 'member',
    memberId: demoMember.memberId,
    course: demoMember.course,
    year: demoMember.year,
  },
  quizmaster: {
    name: 'Samuel Mwita',
    email: 'samuel.m@student.kiut.ac.tz',
    role: 'quizmaster',
    memberId: 'DC-2026-0006',
    course: 'Bachelor of Computer Science',
    year: 'Year 3',
  },
  admin: {
    name: 'Daniel Mushi',
    email: 'admin@digitalclub.kiut.ac.tz',
    role: 'admin',
    memberId: 'DC-2026-0001',
    course: 'Bachelor of Computer Science',
    year: 'Year 4',
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? (JSON.parse(saved) as AuthUser) : null
    } catch {
      return null
    }
  })
  const [pendingApproval, setPendingApproval] = useState(false)

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage can be blocked; the prototype still works in memory */
    }
  }, [user])

  const login = useCallback((email: string, password: string, role?: Role) => {
    if (!email.trim()) return { ok: false, error: 'Enter your email address.' }
    if (!password) return { ok: false, error: 'Enter your password.' }
    const resolvedRole: Role = role ?? (email.includes('admin') ? 'admin' : email.includes('quiz') ? 'quizmaster' : 'member')
    const account = demoAccounts[resolvedRole]
    setUser({ ...account, email: email.trim() })
    return { ok: true }
  }, [])

  const register = useCallback((values: { fullName: string; email: string; phone: string; course: string; year: string }) => {
    setPendingApproval(true)
    setUser(null)
    try {
      sessionStorage.setItem('kiut-demo-registration', JSON.stringify(values))
    } catch {
      /* ignore */
    }
  }, [])

  const logout = useCallback(() => setUser(null), [])
  const clearPending = useCallback(() => setPendingApproval(false), [])

  const value = useMemo(
    () => ({ user, pendingApproval, login, register, logout, clearPending }),
    [user, pendingApproval, login, register, logout, clearPending],
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

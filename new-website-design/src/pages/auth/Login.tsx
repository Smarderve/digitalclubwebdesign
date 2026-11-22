import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth, homeForRole } from '../../context/AuthContext'
import type { Role } from '../../context/AuthContext'
import { Alert, Button, Field, Input } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { AuthHeading, AuthLogo } from './AuthHeading'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function submit(role?: Role) {
    setError('')
    if (!role && !email.trim()) {
      setError('Enter your email address.')
      return
    }
    if (!role && !password) {
      setError('Enter your password.')
      return
    }
    setLoading(true)
    window.setTimeout(() => {
      const result = login(role ? `${role}@demo.local` : email, role ? 'demo' : password, role)
      setLoading(false)
      if (!result.ok) {
        setError(result.error ?? 'Sign in failed.')
        return
      }
      const resolved: Role = role ?? (email.includes('admin') ? 'admin' : 'member')
      push({ tone: 'success', title: 'Signed in to the prototype', description: 'You are viewing demonstration data.' })
      navigate(homeForRole(resolved))
    }, 450)
  }

  return (
    <>
      <AuthLogo />

      <div className="mt-7">
        <AuthHeading
          label="Member sign in"
          title="Welcome back"
          description="Sign in with your KIUT student email to open your member dashboard."
        />
      </div>

      {error ? (
        <Alert tone="danger" className="mt-5" title="Could not sign in">
          {error}
        </Alert>
      ) : null}

      <form
        className="mt-7 space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Field label="Email address" htmlFor="login-email" required>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your.email@kiut.ac.tz"
            autoComplete="email"
            aria-invalid={Boolean(error)}
          />
        </Field>

        <Field label="Password" htmlFor="login-password" required>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="pr-10"
              aria-invalid={Boolean(error)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </Field>

        <div className="flex items-baseline justify-between gap-3 pt-0.5">
          <span className="text-[0.6875rem] leading-4 text-ink-400">Approved accounts only</span>
          <Link
            to="/auth/forgot-password"
            className="text-[0.75rem] font-medium text-brand-800 underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-center text-[0.8125rem] text-ink-500">
        New to the club?{' '}
        <Link to="/auth/register" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[0.6875rem] text-ink-400">
        <span className="uppercase tracking-[0.1em]">Prototype</span>
        <button
          type="button"
          onClick={() => submit('member')}
          disabled={loading}
          className="font-medium text-ink-600 underline-offset-4 transition-colors hover:text-brand-800 hover:underline disabled:opacity-50"
        >
          Continue as member
        </button>
        <button
          type="button"
          onClick={() => submit('admin')}
          disabled={loading}
          className="font-medium text-ink-600 underline-offset-4 transition-colors hover:text-brand-800 hover:underline disabled:opacity-50"
        >
          Continue as admin
        </button>
        <button
          type="button"
          onClick={() => submit('quizmaster')}
          disabled={loading}
          className="font-medium text-ink-600 underline-offset-4 transition-colors hover:text-brand-800 hover:underline disabled:opacity-50"
        >
          Continue as quizmaster
        </button>
      </div>
    </>
  )
}

export default Login

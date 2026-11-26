import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { homeForRole, useAuth } from '../../context/AuthContext'
import { Alert, Button, Field, Input } from '../../components/ui'
import { Turnstile } from '../../components/auth/Turnstile'
import { AuthHeading, AuthLogo } from './AuthHeading'

/** Map server error codes to the sentence a student should read. */
function messageFor(code: string, fallback: string) {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'That email and password do not match an account. Check them and try again.'
    case 'ACCOUNT_INACTIVE':
      return 'This account has been deactivated. Contact a club administrator.'
    case 'TURNSTILE_FAILED':
      return 'Human verification did not complete. Try again.'
    case 'RATE_LIMITED':
      return 'Too many sign-in attempts. Wait a minute and try again.'
    case 'NETWORK_ERROR':
      return 'Could not reach the server. Check your connection and try again.'
    default:
      return fallback
  }
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  /* Registration sends the new address here so the student can sign in at once. */
  const registeredEmail = (location.state as { registeredEmail?: string } | null)?.registeredEmail ?? ''
  const [email, setEmail] = useState(registeredEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setError('')
    if (!email.trim()) {
      setError('Enter your email address.')
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }
    if (!turnstileToken) {
      setError('Complete the human verification below, then try again.')
      return
    }

    setLoading(true)
    const result = await login(email, password, remember, turnstileToken)
    setLoading(false)

    if (!result.ok) {
      if (result.code === 'VALIDATION_ERROR') {
        setError(
          result.fieldErrors?.email ??
            result.fieldErrors?.password ??
            'Check the details you entered and try again.',
        )
      } else {
        setError(messageFor(result.code, result.message))
      }
      /* A Turnstile token is single-use, so a failed attempt needs a new one. */
      setTurnstileToken('')
      setAttempt((value) => value + 1)
      return
    }

    navigate(homeForRole(result.user?.role ?? 'member'))
  }

  return (
    <>
      <AuthLogo />

      <div className="mt-7">
        <AuthHeading
          label="Member sign in"
          title="Welcome back"
          description="Sign in with the email address you registered with the club."
        />
      </div>

      {registeredEmail && !error ? (
        <Alert tone="success" className="mt-5" title="Your account is ready">
          Registration succeeded. Sign in with the password you just created.
        </Alert>
      ) : null}

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
          void submit()
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
          <label className="flex items-center gap-2 text-[0.75rem] leading-5 text-ink-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-3.5 w-3.5 accent-brand-700"
            />
            Keep me signed in
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-[0.75rem] font-medium text-brand-800 underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Turnstile onToken={setTurnstileToken} resetSignal={attempt} />

        <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!turnstileToken}>
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-[0.8125rem] text-ink-500">
        New to the club?{' '}
        <Link to="/auth/register" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  )
}

export default Login

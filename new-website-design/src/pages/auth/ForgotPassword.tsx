import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Alert, Field, Input } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Turnstile } from '../../components/auth/Turnstile'
import { api, ApiError } from '../../lib/api'
import { AuthHeading, AuthLogo } from './AuthHeading'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (!turnstileToken) {
      setError('Complete the human verification below, then try again.')
      return
    }

    setLoading(true)
    try {
      await api.forgotPassword(email.trim(), turnstileToken)
      setSent(true)
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(
          caught.code === 'TURNSTILE_FAILED'
            ? 'Human verification did not complete. Try again.'
            : caught.code === 'RATE_LIMITED'
              ? 'Too many requests. Wait a few minutes and try again.'
              : caught.message,
        )
      } else {
        setError('Could not reach the server. Check your connection and try again.')
      }
      /* The token is single-use, so a retry needs a fresh challenge. */
      setTurnstileToken('')
      setAttempt((value) => value + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AuthLogo />

      <div className="mt-7">
        {sent ? (
          <>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-brand-700">
              <MailCheck className="h-5 w-5" aria-hidden />
            </span>
            <AuthHeading
              align="left"
              label="Account recovery"
              title="Check your email"
              description={
                <>
                  If an account exists for <strong className="font-medium text-ink-800">{email}</strong>, we have sent a
                  password reset link to that address. The link expires after 24 hours.
                </>
              }
            />
            <div className="mt-6 grid gap-2">
              <Button variant="outline" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          </>
        ) : (
          <>
            <AuthHeading
              label="Account recovery"
              title="Forgot your password?"
              description="Enter the email address you registered with. The club will send a password reset link if the account exists."
            />

            {error ? (
              <Alert tone="danger" className="mt-5" title="Could not send the link">
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
              <Field label="Email address" htmlFor="forgot-email" required error={error}>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (error) setError('')
                  }}
                  placeholder="your.email@kiut.ac.tz"
                  autoComplete="email"
                  aria-invalid={Boolean(error)}
                />
              </Field>

              <Turnstile onToken={setTurnstileToken} resetSignal={attempt} />

              <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!turnstileToken}>
                Send reset link
              </Button>
            </form>
            <p className="mt-4 text-center text-[0.75rem] leading-5 text-ink-400">
              Reset links expire. If yours has expired, request a new one.
            </p>
          </>
        )}
      </div>

      <Link
        to="/auth/login"
        className="mt-7 inline-flex items-center gap-1.5 border-t border-line pt-5 text-[0.75rem] text-ink-500 transition-colors hover:text-brand-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to sign in
      </Link>
    </>
  )
}

export default ForgotPassword

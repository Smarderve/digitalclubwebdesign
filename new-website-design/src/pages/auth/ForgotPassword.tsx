import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Alert, Field, Input } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { AuthHeading, AuthLogo } from './AuthHeading'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

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
                  If an account exists for <strong className="font-medium text-ink-800">{email}</strong>, the live site
                  sends a password reset link. This prototype does not send email.
                </>
              }
            />
            <Alert tone="info" className="mt-5" title="Prototype only">
              No reset token was generated and no email was sent. The reset screen can still be reviewed from the link
              below.
            </Alert>
            <div className="mt-6 grid gap-2">
              <Link
                to="/auth/reset-password/demo-token"
                className="inline-flex h-11 items-center justify-center rounded-sm bg-brand-400 px-4 text-[0.875rem] font-medium text-ink-950 transition-colors hover:bg-brand-300"
              >
                Open reset screen
              </Link>
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

            <form
              className="mt-7 space-y-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setError('Enter a valid email address.')
                  return
                }
                setError('')
                setLoading(true)
                window.setTimeout(() => {
                  setLoading(false)
                  setSent(true)
                }, 600)
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
              <Button type="submit" size="lg" className="w-full" loading={loading}>
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

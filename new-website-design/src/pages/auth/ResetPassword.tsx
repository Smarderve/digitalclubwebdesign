import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Alert, Field, Input } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { api, ApiError } from '../../lib/api'
import { AuthHeading, AuthLogo } from './AuthHeading'

export function ResetPassword() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <>
        <AuthLogo />
        <div className="mt-7">
          <AuthHeading
            align="left"
            label="Account recovery"
            title="Reset link is invalid"
            description="This password reset link is missing a token. Request a new link to continue."
          />
          <div className="mt-6">
            <ButtonLink to="/auth/forgot-password" className="w-full">
              Request a new link
            </ButtonLink>
          </div>
        </div>
      </>
    )
  }

  if (done) {
    return (
      <>
        <AuthLogo />
        <div className="mt-7">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-brand-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <AuthHeading
            align="left"
            label="Account recovery"
            title="Password updated"
            description="Your password has been updated. Sign in with your new password."
          />
          <div className="mt-6">
            <ButtonLink to="/auth/login" className="w-full">
              Return to sign in
            </ButtonLink>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AuthLogo />

      <div className="mt-7">
        <AuthHeading
          label="Account recovery"
          title="Set a new password"
          description="Choose a password you have not used before. Reset tokens are single-use and expire."
        />
      </div>

      {error ? (
        <Alert tone="danger" className="mt-5" title="Could not update the password">
          {error}
        </Alert>
      ) : null}

      <form
        className="mt-7 space-y-4"
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          setError('')
          setFieldError('')
          if (password.length < 8) {
            setFieldError('Use at least 8 characters.')
            return
          }
          if (password !== confirm) {
            setFieldError('Passwords do not match.')
            return
          }
          setLoading(true)
          try {
            await api.resetPassword(token, password)
            setDone(true)
          } catch (caught) {
            if (caught instanceof ApiError) {
              if (caught.code === 'TOKEN_EXPIRED' || caught.code === 'TOKEN_INVALID') {
                setError(`${caught.message} Request a new link below.`)
              } else if (caught.code === 'VALIDATION_ERROR') {
                setFieldError(caught.details.password ?? caught.message)
              } else {
                setError(caught.message)
              }
            } else {
              setError('Could not reach the server. Check your connection and try again.')
            }
          } finally {
            setLoading(false)
          }
        }}
      >
        <Field label="New password" htmlFor="reset-password" required error={fieldError} hint="At least 8 characters.">
          <div className="relative">
            <Input
              id="reset-password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="pr-10"
              aria-invalid={Boolean(fieldError)}
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </Field>
        <Field label="Confirm new password" htmlFor="reset-confirm" required>
          <Input
            id="reset-confirm"
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            aria-invalid={Boolean(fieldError)}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>

      <Link
        to="/auth/login"
        className="mt-4 inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 transition-colors hover:text-brand-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to sign in
      </Link>
    </>
  )
}

export default ResetPassword

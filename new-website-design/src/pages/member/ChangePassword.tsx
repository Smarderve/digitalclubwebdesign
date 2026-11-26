import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Card, CardBody, CardHeader, Field, Input } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { useToast } from '../../context/ToastContext'

type PasswordValues = { current: string; next: string; confirm: string }

export function ChangePassword() {
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)
  const { push } = useToast()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>()
  const next = watch('next', '')

  return (
    <>
      <PageHeader
        title="Change password"
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Profile', to: '/member/profile' }, { label: 'Password' }]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,560px)_1fr] lg:items-start">
        <Card>
          <CardHeader title="Password" description="You stay signed in on this device after changing your password." />
          <form
            noValidate
            onSubmit={handleSubmit(async () => {
              await new Promise((resolve) => setTimeout(resolve, 700))
              setDone(true)
              reset()
              push({
                tone: 'success',
                title: 'Password validated',
              })
            })}
          >
            <CardBody className="space-y-4">
              {done ? (
                <Alert tone="success" title="Password updated">
                  Your new password passed validation. In production, the backend would hash and store it and invalidate
                  other sessions.
                </Alert>
              ) : null}

              <Field label="Current password" htmlFor="current-password" required error={errors.current?.message}>
                <Input
                  id="current-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.current)}
                  {...register('current', { required: 'Enter your current password.' })}
                />
              </Field>

              <Field
                label="New password"
                htmlFor="new-password"
                required
                hint="At least 8 characters. Use a mix of letters, numbers and symbols."
                error={errors.next?.message}
              >
                <div className="relative">
                  <Input
                    id="new-password"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="pr-10"
                    aria-invalid={Boolean(errors.next)}
                    {...register('next', {
                      required: 'Enter a new password.',
                      minLength: { value: 8, message: 'Use at least 8 characters.' },
                      validate: (value) => value !== watch('current') || 'Choose a password different from your current one.',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                    aria-label={show ? 'Hide passwords' : 'Show passwords'}
                  >
                    {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm new password" htmlFor="confirm-password" required error={errors.confirm?.message}>
                <Input
                  id="confirm-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirm)}
                  {...register('confirm', {
                    required: 'Confirm your new password.',
                    validate: (value) => value === next || 'Passwords do not match.',
                  })}
                />
              </Field>
            </CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
              <Link to="/member/profile" className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 hover:text-brand-800">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back to profile
              </Link>
              <Button type="submit" loading={isSubmitting} iconLeft={<KeyRound className="h-4 w-4" />}>
                Update password
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Password guidance" />
          <CardBody>
            <ul className="space-y-2.5 text-[0.8125rem] leading-6 text-ink-600">
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-600" aria-hidden />
                Use at least eight characters. Longer passphrases are easier to remember and harder to guess.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-600" aria-hidden />
                Do not reuse the password from your university account or email.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-600" aria-hidden />
                If you have forgotten your current password, sign out and use the reset flow instead.
              </li>
            </ul>
            <div className="mt-4 border-t border-line pt-4">
              <Link to="/auth/forgot-password" className="text-[0.75rem] font-semibold text-brand-800 hover:underline">
                I don't know my current password
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}

export default ChangePassword

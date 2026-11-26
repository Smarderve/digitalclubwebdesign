import { useForm } from 'react-hook-form'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { COURSES, YEARS } from '../../data/site'
import { useAuth } from '../../context/AuthContext'
import { Alert, Field, Input, Progress, Select } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Turnstile } from '../../components/auth/Turnstile'
import { AuthHeading, AuthLogo } from './AuthHeading'

type RegisterValues = {
  fullName: string
  email: string
  phone: string
  course: string
  year: string
  password: string
  confirmPassword: string
  confirm: boolean
}

function passwordScore(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="pt-6">
      <div className="flex items-center gap-3 border-t border-line pt-5">
        <span className="font-mono text-[0.625rem] tracking-[0.1em] text-ink-300">{index}</span>
        <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-500">{title}</h2>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function Register() {
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>()

  const password = watch('password', '')
  const score = passwordScore(password)
  const strength = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score]

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <AuthLogo align="left" />
        <Link
          to="/auth/login"
          className="text-[0.75rem] font-medium text-ink-500 underline-offset-4 transition-colors hover:text-brand-800 hover:underline"
        >
          Sign in
        </Link>
      </div>

      <div className="mt-7">
        <AuthHeading
          align="left"
          label="Join the club"
          title="Create your member account"
          description="Membership is free for KIUT students. Register with your student email, then attend an orientation session to get started."
        />
      </div>

      <Alert tone="success" className="mt-5" title="Sign in immediately">
        Your account is activated as soon as you register — there is no approval step. You can sign in right away.
      </Alert>

      <form
        className="mt-7"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          setSubmitError('')
          const result = await registerAccount({
            fullName: values.fullName,
            email: values.email,
            password: values.password,
            phone: values.phone,
            course: values.course,
            year: values.year,
            turnstileToken,
          })

          if (!result.ok) {
            if (result.code === 'EMAIL_IN_USE') {
              setError('email', { type: 'server', message: result.message })
            } else if (result.fieldErrors && Object.keys(result.fieldErrors).length) {
              const fields: Record<string, keyof RegisterValues> = {
                full_name: 'fullName',
                email: 'email',
                password: 'password',
                phone: 'phone',
                course: 'course',
                year: 'year',
              }
              for (const [field, message] of Object.entries(result.fieldErrors)) {
                const key = fields[field]
                if (key) setError(key, { type: 'server', message })
              }
            } else {
              setSubmitError(result.message)
            }
            setTurnstileToken('')
            setAttempt((value) => value + 1)
            return
          }

          navigate('/auth/login', { state: { registeredEmail: values.email.trim() } })
        })}
      >
        <div className="space-y-6">
          <Section index="01" title="Personal details">
            <Field label="Full name" htmlFor="register-name" required error={errors.fullName?.message}>
              <Input
                id="register-name"
                placeholder="Enter your full name"
                autoComplete="name"
                aria-invalid={Boolean(errors.fullName)}
                {...register('fullName', { required: 'Enter your full name.' })}
              />
            </Field>
            <Field label="Email address" htmlFor="register-email" required error={errors.email?.message}>
              <Input
                id="register-email"
                type="email"
                placeholder="your.email@kiut.ac.tz"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email', {
                  required: 'Enter your email address.',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
                })}
              />
            </Field>
            <Field label="Phone number" htmlFor="register-phone" required error={errors.phone?.message}>
              <Input
                id="register-phone"
                type="tel"
                placeholder="+255 XXX XXX XXX"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
                {...register('phone', { required: 'Enter a phone number.' })}
              />
            </Field>
          </Section>

          <Section index="02" title="Study details">
            <Field label="Course" htmlFor="register-course" required error={errors.course?.message}>
              <Select
                id="register-course"
                aria-invalid={Boolean(errors.course)}
                {...register('course', { required: 'Select your course.' })}
              >
                <option value="">Select course</option>
                {COURSES.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Year of study" htmlFor="register-year" required error={errors.year?.message}>
              <Select
                id="register-year"
                aria-invalid={Boolean(errors.year)}
                {...register('year', { required: 'Select your year of study.' })}
              >
                <option value="">Select year</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </Field>
          </Section>

          <Section index="03" title="Security">
            <Field label="Password" htmlFor="register-password" required error={errors.password?.message}>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className="pr-10"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password', {
                    required: 'Create a password.',
                    minLength: { value: 8, message: 'Use at least 8 characters.' },
                  })}
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
              {password ? (
                <div className="mt-2">
                  <Progress value={score} max={4} tone={score >= 3 ? 'brand' : score >= 2 ? 'amber' : 'neutral'} />
                  <p className="mt-1 text-[0.6875rem] text-ink-400">
                    Strength: <span className="font-medium text-ink-600">{strength}</span>. Use a mix of letters, numbers
                    and symbols.
                  </p>
                </div>
              ) : null}
            </Field>

            <Field label="Confirm password" htmlFor="register-confirm" required error={errors.confirmPassword?.message}>
              <Input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register('confirmPassword', {
                  required: 'Confirm your password.',
                  validate: (value) => value === password || 'Passwords do not match.',
                })}
              />
            </Field>
          </Section>
        </div>

        <div className="mt-6 rounded-md border border-line bg-canvas/70 p-3.5">
          <p className="text-[0.75rem] font-medium text-ink-800">Verification</p>
          <p className="mt-1 text-[0.6875rem] leading-5 text-ink-500">
            Your account is active immediately after registration. Complete the human verification to continue.
          </p>
          <label className="mt-3 flex items-start gap-2 text-[0.75rem] leading-5 text-ink-600">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
              {...register('confirm', { required: 'Confirm that your details are accurate.' })}
            />
            <span>I confirm that the details above are accurate and that I am a KIUT student or staff member.</span>
          </label>
          {errors.confirm ? <p className="mt-1 text-[0.6875rem] text-danger">{errors.confirm.message}</p> : null}
        </div>

        <Turnstile className="mt-5" onToken={setTurnstileToken} resetSignal={attempt} />

        {submitError ? (
          <Alert tone="danger" className="mt-4" title="Could not create the account">
            {submitError}
          </Alert>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="mt-3 w-full"
          loading={isSubmitting}
          disabled={!turnstileToken}
        >
          Create account
        </Button>

        <p className="mt-4 text-center text-[0.8125rem] text-ink-500">
          Already registered?{' '}
          <Link to="/auth/login" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </>
  )
}

export default Register

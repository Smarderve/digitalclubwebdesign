import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin, ShieldAlert, Users } from 'lucide-react'
import { Alert, Badge } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { Field, Input } from '../../components/ui/field'
import { Turnstile } from '../../components/auth/Turnstile'
import { PageNotFoundInline } from '../../components/site/primitives'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi } from '../../lib/publicApi'
import { ApiError } from '../../lib/api'
import { formatDate } from '../../lib/utils'

type RsvpValues = {
  fullName: string
  email: string
  phone: string
  studentId: string
}

export function EventRsvp() {
  const { id = '' } = useParams()
  const { data: event, loading, error } = usePublicData(() => publicApi.eventDetail(id), [id])
  const [turnstileToken, setTurnstileToken] = useState('')
  const [resetSignal, setResetSignal] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RsvpValues>({
    defaultValues: { fullName: '', email: '', phone: '', studentId: '' },
  })

  if (loading) {
    return (
      <div className="container-editorial py-12 text-center text-[0.8125rem] text-ink-400" role="status">
        Loading event…
      </div>
    )
  }

  if (error || !event) {
    return (
      <PageNotFoundInline
        title="Event not found"
        description="This event record does not exist or is no longer published. Browse the events page for current listings."
      />
    )
  }

  const ended = event.rsvp.state !== 'open'
  const time = event.starts_at
    ? new Date(event.starts_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('')
    if (!turnstileToken) {
      setSubmitError('Complete the human verification before submitting.')
      return
    }
    try {
      await publicApi.rsvp(id, {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        studentId: values.studentId,
        turnstileToken,
      })
      setSubmitted(true)
      reset()
      setTurnstileToken('')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ALREADY_REGISTERED') {
          setSubmitError('This email is already registered for this event.')
        } else if (err.code === 'RSVP_CLOSED') {
          setSubmitError('Registration for this event has closed.')
        } else if (err.code === 'TURNSTILE_FAILED') {
          setSubmitError('Human verification failed. Please complete it again.')
        } else if (Object.keys(err.details).length) {
          setSubmitError(Object.values(err.details).join(' '))
        } else {
          setSubmitError(err.message)
        }
      } else {
        setSubmitError('The RSVP could not be submitted. Please try again.')
      }
      setTurnstileToken('')
      setResetSignal((value) => value + 1)
    }
  })

  return (
    <div className="bg-canvas/50">
      <div className="container-editorial py-8 lg:py-12">
        <Link to="/events" className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-brand-800">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to events
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="relative bg-mint p-6">
                <div aria-hidden className="absolute inset-0 opacity-40 hairline-grid" />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-brand-200 bg-surface/70 px-2 py-0.5 text-[0.625rem] font-medium text-brand-800">
                      {event.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h1 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-tight text-ink-950">{event.title}</h1>
                  <p className="mt-2 text-[0.8125rem] text-ink-600">KIUT Digital Club · Public event</p>
                </div>
              </div>
              <div className="grid gap-px bg-line sm:grid-cols-2">
                {[
                  {
                    icon: CalendarDays,
                    label: 'Date',
                    value: event.starts_at
                      ? formatDate(event.starts_at, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                      : 'To be announced',
                  },
                  { icon: Clock, label: 'Time', value: time || 'To be announced' },
                  { icon: MapPin, label: 'Location', value: event.venue ?? 'To be announced' },
                  { icon: Users, label: 'Capacity', value: event.capacity ? `${event.capacity} seats` : 'Open' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="bg-surface p-4">
                      <p className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">
                        <Icon className="h-3 w-3" aria-hidden />
                        {item.label}
                      </p>
                      <p className="mt-1 text-[0.8125rem] font-medium text-ink-900">{item.value}</p>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-line p-5">
                <p className="text-[0.8125rem] leading-6 text-ink-600">{event.description}</p>
                {event.requirements.length ? (
                  <ul className="mt-4 space-y-1 text-[0.8125rem] text-ink-600">
                    {event.requirements.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-4 text-[0.6875rem] text-ink-400">
                  {event.registered_count} {event.registered_count === 1 ? 'registration' : 'registrations'} recorded.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-h2 text-ink-950">RSVP registration</h2>
              <Badge tone={ended ? 'neutral' : 'green'} dot>
                {ended ? 'Registration closed' : 'Open'}
              </Badge>
            </div>

            {submitted ? (
              <Alert tone="success" title="RSVP submitted" className="mb-4">
                Your RSVP is pending organiser review. You will receive an email confirmation once it is approved.
              </Alert>
            ) : ended ? (
              <Alert tone="warning" title="This event has ended" className="mb-4">
                Registration is closed and no new RSVP can be accepted.
              </Alert>
            ) : (
              <Alert tone="info" title="RSVP review" className="mb-4">
                Your RSVP will be reviewed by the event organiser. You will receive an email confirmation upon approval.
              </Alert>
            )}

            <div className="rounded-lg border border-line bg-surface">
              <div className="border-b border-line px-5 py-3.5">
                <p className="text-[0.8125rem] font-semibold text-ink-900">Registration form</p>
                <p className="text-[0.6875rem] text-ink-400">
                  {ended ? 'The form is closed.' : 'All fields marked required must be completed.'}
                </p>
              </div>

              <form className="p-5" noValidate onSubmit={onSubmit}>
                <fieldset disabled={ended || submitted || isSubmitting} className="space-y-4 disabled:opacity-60">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" htmlFor="rsvp-name" required error={errors.fullName?.message}>
                      <Input
                        id="rsvp-name"
                        placeholder="Enter your full name"
                        autoComplete="name"
                        aria-invalid={Boolean(errors.fullName)}
                        {...register('fullName', { required: 'Enter your full name.' })}
                      />
                    </Field>
                    <Field label="Email address" htmlFor="rsvp-email" required error={errors.email?.message}>
                      <Input
                        id="rsvp-email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        aria-invalid={Boolean(errors.email)}
                        {...register('email', {
                          required: 'Enter your email address.',
                          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
                        })}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Phone number" htmlFor="rsvp-phone" required error={errors.phone?.message}>
                      <Input
                        id="rsvp-phone"
                        type="tel"
                        placeholder="+255 XXX XXX XXX"
                        autoComplete="tel"
                        aria-invalid={Boolean(errors.phone)}
                        {...register('phone', { required: 'Enter a phone number for event updates.' })}
                      />
                    </Field>
                    <Field label="Member ID" htmlFor="rsvp-student" optional hint="If you are a club member, the organiser can link your RSVP.">
                      <Input id="rsvp-student" placeholder="DC-2026-0000" {...register('studentId')} />
                    </Field>
                  </div>

                  <div className="rounded-md border border-line bg-canvas/60 p-4">
                    <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-800">
                      <ShieldAlert className="h-4 w-4 text-ink-500" aria-hidden />
                      Human verification
                    </p>
                    <p className="mt-1 text-[0.6875rem] leading-5 text-ink-500">
                      Complete the check before submitting. The token is single-use.
                    </p>
                    <Turnstile className="mt-3" onToken={setTurnstileToken} resetSignal={resetSignal} />
                  </div>

                  {submitError ? (
                    <Alert tone="warning" title="RSVP not submitted">
                      {submitError}
                    </Alert>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <ButtonLink to="/events" variant="ghost" size="sm">
                      Back to events
                    </ButtonLink>
                    <Button type="submit" loading={isSubmitting} disabled={ended || submitted || !turnstileToken}>
                      Submit RSVP
                    </Button>
                  </div>
                </fieldset>
              </form>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[0.6875rem] leading-5 text-ink-400">
              <CheckCircle2 className="mt-px h-3 w-3 shrink-0" aria-hidden />
              Registration is only confirmed after organiser approval. Fields not shown here are collected by the organiser
              when needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventRsvp

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin, ShieldAlert, Users } from 'lucide-react'
import { EVENTS, RSVP_REQUIREMENTS } from '../../data/site'
import { Alert, Badge } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { Checkbox, Field, Input, Select, Textarea } from '../../components/ui/field'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'
import { PageNotFoundInline } from '../../components/site/primitives'

type RsvpValues = {
  fullName: string
  email: string
  phone: string
  attendeeType: string
  studyField: string
  studyYear: string
  nonStudentRole: string
  emergencyContact: string
  emergencyPhone: string
  dietary: string
  notes: string
  consent: boolean
}

export function EventRsvp() {
  const { id } = useParams()
  const event = EVENTS.find((item) => String(item.id) === id)
  const [preview, setPreview] = useState(false)
  const { push } = useToast()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RsvpValues>({
    defaultValues: {
      attendeeType: '',
      studyField: '',
      studyYear: '',
      nonStudentRole: '',
      consent: false,
    },
  })

  if (!event) {
    return (
      <PageNotFoundInline
        title="Event not found"
        description="This event record does not exist or is no longer published. Browse the events page for current listings."
      />
    )
  }

  const attendeeType = watch('attendeeType')
  const ended = new Date(event.date).getTime() < Date.now()

  return (
    <div className="bg-canvas/50">
      <div className="container-editorial py-8 lg:py-12">
        <Link to="/events" className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-brand-800">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to events
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          {/* Event summary */}
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              <div className="relative bg-mint p-6">
                <div aria-hidden className="absolute inset-0 opacity-40 hairline-grid" />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    {event.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-brand-200 bg-white/70 px-2 py-0.5 text-[0.625rem] font-medium text-brand-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h1 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-tight text-ink-950">{event.title}</h1>
                  <p className="mt-2 text-[0.8125rem] text-ink-600">KIUT Digital Club · Public event</p>
                </div>
              </div>
              <div className="grid gap-px bg-line sm:grid-cols-2">
                {[
                  { icon: CalendarDays, label: 'Date', value: formatDate(event.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) },
                  { icon: Clock, label: 'Time', value: event.time },
                  { icon: MapPin, label: 'Location', value: event.location },
                  { icon: Users, label: 'Capacity', value: `${event.capacity} seats` },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="bg-white p-4">
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
                <div className="mt-4 space-y-1 text-[0.8125rem] text-ink-600">
                  {event.longDescription.slice(1).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <p className="mt-4 text-[0.6875rem] text-ink-400">
                  The published event description was truncated after the second learning outcome.
                </p>
              </div>
            </div>
          </div>

          {/* RSVP */}
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-h2 text-ink-950">RSVP registration</h2>
              <Badge tone={ended ? 'neutral' : 'green'} dot>
                {ended ? 'Registration closed' : 'Open'}
              </Badge>
            </div>

            {ended ? (
              <Alert tone="warning" title="This event has ended" className="mb-4">
                The event took place on {formatDate(event.date, { day: 'numeric', month: 'long', year: 'numeric' })}. RSVP is
                closed and no new registration can be accepted. The form is preserved below for review.
              </Alert>
            ) : (
              <Alert tone="info" title="RSVP review" className="mb-4">
                Your RSVP will be reviewed by the event organiser. You will receive an email confirmation upon approval.
              </Alert>
            )}

            <div className="rounded-lg border border-line bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
                <div>
                  <p className="text-[0.8125rem] font-semibold text-ink-900">Registration form</p>
                  <p className="text-[0.6875rem] text-ink-400">
                    {preview ? 'Preview mode — validation is live, nothing is submitted.' : 'Disabled because the event has ended.'}
                  </p>
                </div>
                <Button type="button" variant={preview ? 'secondary' : 'outline'} size="sm" onClick={() => setPreview((value) => !value)}>
                  {preview ? 'Exit preview' : 'Preview form behaviour'}
                </Button>
              </div>

              <form
                className="p-5"
                noValidate
                onSubmit={handleSubmit(async () => {
                  await new Promise((resolve) => setTimeout(resolve, 700))
                  push({
                    tone: 'success',
                    title: 'Form validated',
                    description: 'Prototype only — no RSVP was stored and no confirmation email was sent.',
                  })
                  reset()
                  setPreview(false)
                })}
              >
                <fieldset disabled={!preview} className="space-y-4 disabled:opacity-60">
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
                    <Field label="Attendance type" htmlFor="rsvp-type" required error={errors.attendeeType?.message}>
                      <Select
                        id="rsvp-type"
                        aria-invalid={Boolean(errors.attendeeType)}
                        {...register('attendeeType', { required: 'Select your attendance type.' })}
                      >
                        <option value="">Select attendance type</option>
                        {RSVP_REQUIREMENTS.attendeeTypes.map((type) => (
                          <option key={type} value={type.toLowerCase()}>
                            {type}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  {attendeeType === 'student' ? (
                    <div className="grid gap-4 rounded-md border border-line bg-ink-50/40 p-4 sm:grid-cols-2">
                      <Field label="Field of study" htmlFor="rsvp-field" required error={errors.studyField?.message}>
                        <Select
                          id="rsvp-field"
                          aria-invalid={Boolean(errors.studyField)}
                          {...register('studyField', { required: 'Select your field of study.' })}
                        >
                          <option value="">Select field of study</option>
                          {RSVP_REQUIREMENTS.studyFields.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Year of study" htmlFor="rsvp-year" required error={errors.studyYear?.message}>
                        <Select
                          id="rsvp-year"
                          aria-invalid={Boolean(errors.studyYear)}
                          {...register('studyYear', { required: 'Select your year of study.' })}
                        >
                          <option value="">Select year</option>
                          {RSVP_REQUIREMENTS.studyYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  ) : null}

                  {attendeeType === 'non-student' ? (
                    <Field label="Role" htmlFor="rsvp-role" required error={errors.nonStudentRole?.message}>
                      <Select
                        id="rsvp-role"
                        aria-invalid={Boolean(errors.nonStudentRole)}
                        {...register('nonStudentRole', { required: 'Select staff or guest.' })}
                      >
                        <option value="">Select role</option>
                        {RSVP_REQUIREMENTS.nonStudentRoles.map((role) => (
                          <option key={role} value={role.toLowerCase()}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Emergency contact name" htmlFor="rsvp-emergency" optional>
                      <Input id="rsvp-emergency" placeholder="Contact person" {...register('emergencyContact')} />
                    </Field>
                    <Field label="Emergency contact phone" htmlFor="rsvp-emergency-phone" optional>
                      <Input id="rsvp-emergency-phone" type="tel" placeholder="Emergency number" {...register('emergencyPhone')} />
                    </Field>
                  </div>

                  <Field label="Dietary requirements" htmlFor="rsvp-dietary" optional>
                    <Input id="rsvp-dietary" placeholder="e.g. vegetarian, no nuts" {...register('dietary')} />
                  </Field>
                  <Field label="Additional notes" htmlFor="rsvp-notes" optional hint="Anything the organiser should know about access or attendance.">
                    <Textarea id="rsvp-notes" placeholder="Add any notes for the event organiser" {...register('notes')} />
                  </Field>

                  <div className="rounded-md border border-line bg-canvas/60 p-4">
                    <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-800">
                      <ShieldAlert className="h-4 w-4 text-ink-500" aria-hidden />
                      Human verification
                    </p>
                    <p className="mt-1 text-[0.6875rem] leading-5 text-ink-500">
                      The live site uses Cloudflare Turnstile. This prototype does not call a verification service.
                    </p>
                    <Checkbox
                      className="mt-3"
                      label="I am attending as a real participant (prototype checkbox)."
                      {...register('consent', { required: true })}
                    />
                    {errors.consent && preview ? <p className="mt-1 text-[0.6875rem] text-danger">Confirm to preview submission.</p> : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <ButtonLink to="/events" variant="ghost" size="sm">
                      Back to events
                    </ButtonLink>
                    <Button type="submit" loading={isSubmitting} disabled={!preview}>
                      Submit RSVP
                    </Button>
                  </div>
                </fieldset>
              </form>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[0.6875rem] leading-5 text-ink-400">
              <CheckCircle2 className="mt-px h-3 w-3 shrink-0" aria-hidden />
              Registration is only confirmed after organiser approval. The prototype never claims a real submission succeeded.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventRsvp

import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { Clock, Mail, MapPin, MessageSquare, Phone, Send, Users } from 'lucide-react'
import { SITE } from '../../data/site'
import { SectionHead } from '../../components/site/primitives'
import { PageHero, clubMedia } from '../../components/site/hero'
import { Alert, Badge } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { Field, Input, Select, Textarea } from '../../components/ui/field'
import { useToast } from '../../context/ToastContext'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi } from '../../lib/publicApi'

type ContactValues = { name: string; email: string; subject: string; message: string }

const contactHero = clubMedia('/images/club/devfest-students', 'KIUT Digital Club students at DevFest')

const subjects = [
  { value: 'general', label: 'General enquiry' },
  { value: 'membership', label: 'Membership & joining' },
  { value: 'project-idea', label: 'Project idea or collaboration' },
  { value: 'mentee', label: 'Mentorship — join as mentee' },
  { value: 'mentor', label: 'Mentorship — become a mentor' },
  { value: 'partnership', label: 'Partnership or sponsorship' },
  { value: 'blog', label: 'Blog or article pitch' },
  { value: 'media', label: 'Gallery or media' },
  { value: 'tools', label: 'Development tools access' },
  { value: 'leadership', label: 'Leadership & elections' },
]

export function Contact() {
  const [params] = useSearchParams()
  const initialTopic = params.get('topic') ?? 'general'
  const { push } = useToast()
  const { data, loading } = usePublicData(() => Promise.all([publicApi.contact(), publicApi.site()]), [])
  const contact = data?.[0]
  const site = data?.[1]
  const email = contact?.email || SITE.email
  const phone = contact?.phone || SITE.phone
  const address = contact?.address?.length ? contact.address : SITE.address
  const hours = contact?.hours || 'Monday–Friday, 9:00 AM – 5:00 PM'
  const meetingTimes = contact?.meeting_times || 'Weekly Tech Sessions · Every Wednesday, 4:00 PM'
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ContactValues>({
    defaultValues: { subject: subjects.some((item) => item.value === initialTopic) ? initialTopic : 'general' },
  })

  const mapsQuery = encodeURIComponent('Kampala International University in Tanzania, Gongo la Mboto, Dar es Salaam')

  return (
    <>
      <PageHero
        layout="overlay"
        eyebrow="Contact"
        title="Contact us"
        description="Get in touch with Digital Club — KIUT. We're here to answer your questions, collaborate on projects, and help you grow in technology."
        media={contactHero}
        actions={
          <a
            href={`mailto:${email}`}
            className="inline-flex h-10 items-center gap-2 rounded-sm bg-brand-500 px-4 text-[0.875rem] font-medium text-ink-950 transition-colors hover:bg-brand-400"
          >
            Email the club
          </a>
        }
        aside={
          <div className="rounded-lg border border-line bg-canvas p-4 lg:max-w-[360px]">
            <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-900">
              <Clock className="h-4 w-4 text-brand-700" aria-hidden />
              {SITE.responseTime}
            </p>
            <p className="mt-2 text-[0.75rem] leading-5 text-ink-500">
              For urgent event issues, call the club phone during meeting hours.
            </p>
            {loading ? <p className="mt-2 text-[0.625rem] text-ink-400">Loading club contact details…</p> : null}
          </div>
        }
      />

      <section className="section border-b border-line">
        <div className="container-editorial grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <SectionHead
              eyebrow="Get in touch"
              title="Send us a message"
              description="Reach out for inquiries, collaborations, or to learn more about our programmes."
            />

            {isSubmitSuccessful ? (
              <Alert tone="success" title="Message validated" className="mt-6">
                Your message passed validation. This preview does not send email and stores nothing; in production the club
                would respond from {email} within 24–48 hours on weekdays.
              </Alert>
            ) : null}

            <form
              className="mt-6 space-y-4"
              noValidate
              onSubmit={handleSubmit(async () => {
                await new Promise((resolve) => setTimeout(resolve, 700))
                push({ tone: 'success', title: 'Message validated' })
                reset({ subject: 'general' })
              })}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="contact-name" required error={errors.name?.message}>
                  <Input
                    id="contact-name"
                    placeholder="Your full name"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    {...register('name', { required: 'Enter your name.' })}
                  />
                </Field>
                <Field label="Email address" htmlFor="contact-email" required error={errors.email?.message}>
                  <Input
                    id="contact-email"
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
              <Field label="Subject" htmlFor="contact-subject" required error={errors.subject?.message}>
                <Select id="contact-subject" {...register('subject', { required: 'Select a subject.' })}>
                  {subjects.map((subject) => (
                    <option key={subject.value} value={subject.value}>
                      {subject.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Message"
                htmlFor="contact-message"
                required
                hint="Tell us what you need. For project or partnership enquiries, include a short outline and timeline."
                error={errors.message?.message}
              >
                <Textarea
                  id="contact-message"
                  rows={6}
                  placeholder="Write your message…"
                  aria-invalid={Boolean(errors.message)}
                  {...register('message', {
                    required: 'Write a message.',
                    minLength: { value: 20, message: 'Please provide at least 20 characters so the club can respond usefully.' },
                  })}
                />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <Button type="submit" loading={isSubmitting} iconRight={<Send className="h-3.5 w-3.5" />}>
                  Send message
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-line bg-surface">
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-[0.9375rem] font-semibold text-ink-950">Contact information</h2>
              </div>
              <div className="divide-y divide-line">
                <div className="flex gap-3 p-5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">Location</p>
                    {address.map((line) => (
                      <p key={line} className="mt-0.5 text-[0.8125rem] leading-6 text-ink-700">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 p-5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">Email</p>
                    <a href={`mailto:${email}`} className="mt-0.5 block text-[0.8125rem] font-medium text-brand-800 hover:underline">
                      {email}
                    </a>
                    <p className="mt-1 text-[0.6875rem] text-ink-400">{SITE.responseTime}</p>
                  </div>
                </div>
                <div className="flex gap-3 p-5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">Phone</p>
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="mt-0.5 block text-[0.8125rem] font-medium text-ink-900 hover:text-brand-800">
                      {phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line p-5">
                <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  Office hours
                </p>
                <p className="mt-3 text-[0.75rem] leading-5 text-ink-700">{hours}</p>
              </div>
              <div className="rounded-lg border border-line p-5">
                <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  Club meetings
                </p>
                <p className="mt-3 whitespace-pre-line text-[0.75rem] leading-5 text-ink-700">{meetingTimes}</p>
              </div>
            </div>

            <div className="rounded-lg border border-line p-5">
              <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden /> Quick support
              </p>
              <dl className="mt-3 space-y-2 text-[0.75rem]">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Technical queries</dt>
                  <dd className="font-medium text-ink-900">24–48 hour response</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Project support</dt>
                  <dd className="font-medium text-ink-900">Schedule a meeting</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Club name</dt>
                  <dd className="font-medium text-ink-900">{site?.club_name ?? 'KIUT Digital Club'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">Find our campus</p>
            <h2 className="mt-2 text-h1 text-ink-950">KIUT campus location</h2>
            <p className="mt-2 max-w-[48ch] text-[0.8125rem] leading-6 text-ink-600">
              The club is based at Kampala International University in Tanzania, Gongo la Mboto, Dar es Salaam. Club
              sessions use the KIUT Tech Lab unless an event specifies otherwise.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
                variant="outline"
                size="sm"
                iconRight={<MapPin className="h-3.5 w-3.5" />}
              >
                Open in Google Maps
              </ButtonLink>
              <ButtonLink
                href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
                variant="ghost"
                size="sm"
              >
                Get directions
              </ButtonLink>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-line bg-surface">
            <div aria-hidden className="h-[240px] surface-grid bg-brand-50/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-surface text-brand-700">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <p className="mt-3 text-[0.875rem] font-semibold text-ink-950">Kampala International University in Tanzania</p>
              <p className="mt-1 max-w-[34ch] text-[0.75rem] leading-5 text-ink-500">
                Kampala Road No. 2, Off Nyerere Road, Gongo la Mboto, Dar es Salaam
              </p>
              <p className="mt-3 text-[0.625rem] text-ink-400">Interactive map link opens Google Maps — no map key is stored.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-editorial flex flex-col items-start justify-between gap-5 rounded-lg border border-line bg-surface p-6 sm:flex-row sm:items-center">
          <div>
            <Badge tone="green">Ready to join or collaborate?</Badge>
            <h2 className="mt-3 text-h2 text-ink-950">Whether you're a student, an organisation or a mentor, we'd love to hear from you.</h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ButtonLink to="/auth/register">Join as member</ButtonLink>
            <ButtonLink href={`mailto:${email}?subject=Partnership%20inquiry`} variant="outline">
              Partnership inquiry
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}

export default Contact

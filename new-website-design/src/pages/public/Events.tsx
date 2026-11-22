import { useState } from 'react'
import { CalendarX2, ClipboardCheck, MailCheck, MapPin, ShieldCheck } from 'lucide-react'
import { COMPETITION_ARCHIVE, EVENTS } from '../../data/site'
import { JoinBand, SectionHead } from '../../components/site/primitives'
import { PageHero, media } from '../../components/site/hero'
import { ButtonLink } from '../../components/ui/button'
import { Badge, EmptyState } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { EventRow } from '../../components/site/cards'
import { cn, formatDate } from '../../lib/utils'

const categories = ['All', 'Workshop', 'Hackathon', 'Tech talk', 'Social event']

const eventsHero = media(
  '/images/events/workshop-audience',
  'An audience listening to a workshop presentation',
  'Stock photograph · Pexels. Not a recorded KIUT Digital Club event.',
)

export function Events() {
  const [category, setCategory] = useState('All')
  const now = Date.now()
  const upcoming = EVENTS.filter((event) => new Date(event.date).getTime() >= now)
  const past = EVENTS.filter((event) => new Date(event.date).getTime() < now)
  const filteredPast = category === 'All' ? past : past.filter((event) => event.category === category)
  const filteredUpcoming = category === 'All' ? upcoming : upcoming.filter((event) => event.category === category)

  return (
    <>
      <PageHero
        eyebrow="Events & activities"
        title="Public events"
        description="Workshops, bootcamps and meetups open to the KIUT community. Registration is reviewed by the event organiser before attendance is confirmed."
        media={eventsHero}
        actions={
          <ButtonLink to="/events#calendar" variant="outline" size="md">
            See the calendar
          </ButtonLink>
        }
        aside={
          <div className="rounded-lg border border-line bg-canvas p-5 lg:max-w-[320px]">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Member events</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              Some events are published only to members or paid members inside the member dashboard.
            </p>
            <div className="mt-3">
              <a href="/member/events" className="text-[0.75rem] font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4">
                Member event list
              </a>
            </div>
          </div>
        }
      />

      <section className="section border-b border-line" id="calendar">
        <div className="container-editorial">
          <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
            <div>
              <p className="eyebrow">Calendar</p>
              <h2 className="mt-2 text-display-md text-ink-950">What's on</h2>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter events by category">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition-colors',
                    category === item
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-500">Upcoming</h3>
                <span className="text-[0.6875rem] text-ink-400">{filteredUpcoming.length} published</span>
              </div>
              <div className="divide-y divide-line border-y border-line">
                {filteredUpcoming.length ? (
                  filteredUpcoming.map((event) => (
                    <EventRow
                      key={event.slug}
                      title={event.title}
                      date={event.date}
                      time={event.time}
                      location={event.location}
                      description={event.description}
                      tags={event.tags}
                      to={`/events/${event.id}/rsvp`}
                      status={{ label: 'Open', tone: 'green' }}
                      actionLabel="Register"
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<CalendarX2 className="h-4 w-4" aria-hidden />}
                    title="No upcoming events published"
                    description="The club has not published a future event for this category. Past events remain available below, and members can see member-only events after signing in."
                    action={
                      <Button variant="outline" size="sm" onClick={() => setCategory('All')}>
                        Show all categories
                      </Button>
                    }
                    className="my-4 border-0 bg-transparent py-10"
                  />
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-500">Past events</h3>
                <span className="text-[0.6875rem] text-ink-400">Archive</span>
              </div>
              <div className="rounded-lg border border-line bg-canvas/60 p-5">
                {filteredPast.length ? (
                  filteredPast.map((event) => (
                    <article key={event.slug}>
                      <div className="flex items-center justify-between gap-3">
                        <Badge tone="neutral">Ended</Badge>
                        <span className="text-[0.6875rem] text-ink-400">{formatDate(event.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <h4 className="mt-3 text-h3 text-ink-950">{event.title}</h4>
                      <p className="mt-1 text-[0.75rem] text-ink-500">
                        {event.time} · {event.location}
                      </p>
                      <p className="mt-3 text-[0.8125rem] leading-6 text-ink-600">{event.description}</p>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {event.tags.map((tag) => (
                          <li key={tag} className="rounded-[4px] border border-line bg-white px-2 py-0.5 text-[0.6875rem] text-ink-600">
                            {tag}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                        <span className="text-[0.6875rem] text-ink-400">{event.registered} / {event.capacity} seats recorded</span>
                        <span className="text-[0.6875rem] text-ink-400">Registration closed</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="py-8 text-center text-[0.8125rem] text-ink-500">No past events in this category.</p>
                )}
              </div>
              <p className="mt-2 text-[0.625rem] leading-4 text-ink-400">
                The most recent published event ended before this redesign. It is shown as archive, not as open registration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Competitions & challenges"
            title="Hackathons and coding challenges"
            description="Competition entries as published on the current website. Dates are historical or recurring and are labelled accordingly."
          />
          <div className="mt-8 divide-y divide-line border-y border-line">
            {COMPETITION_ARCHIVE.map((item) => (
              <article key={item.title} className="grid gap-3 py-5 sm:grid-cols-[1fr_180px] sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[0.9375rem] font-semibold text-ink-950">{item.title}</h3>
                    <Badge tone={item.status === 'As published' ? 'outline' : 'neutral'}>{item.status}</Badge>
                  </div>
                  <p className="mt-1 max-w-[64ch] text-[0.8125rem] leading-6 text-ink-500">{item.description}</p>
                </div>
                <p className="text-[0.75rem] text-ink-400 sm:text-right">{item.timing}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[0.6875rem] text-ink-400">
            Current competitions, submissions and leaderboards are member-only. No 2026 competition dates are shown because
            they were not published in the supplied content.
          </p>
        </div>
      </section>

      <section className="section border-b border-line">
        <div className="container-editorial">
          <SectionHead eyebrow="How RSVP works" title="Three steps, reviewed by a person" />
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { icon: ClipboardCheck, title: 'Submit the form', text: 'Provide your details, attendance type, field of study and any access needs.' },
              { icon: ShieldCheck, title: 'Organiser review', text: 'Your RSVP is reviewed by the event organiser. Capacity and eligibility are checked.' },
              { icon: MailCheck, title: 'Confirmation', text: 'You receive an email confirmation once your RSVP is approved.' },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="border-t border-line pt-5">
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-brand-700" aria-hidden />
                    <span className="font-mono text-[0.625rem] text-ink-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-950">{item.title}</h3>
                  <p className="mt-1 text-[0.8125rem] leading-6 text-ink-500">{item.text}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-6 flex items-start gap-2 rounded-md border border-line bg-canvas px-4 py-3">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
            <p className="text-[0.75rem] leading-5 text-ink-500">
              Club sessions take place at the KIUT Tech Lab unless an event specifies another venue. The AI Bootcamp was
              held in Computer Lab 1.
            </p>
          </div>
        </div>
      </section>

      <JoinBand
        eyebrow="Never miss an event"
        title="Events are announced to members first."
        description="Join the club to see member events, RSVP inside the dashboard and receive organiser updates. Public events remain open to everyone."
        primary={{ label: 'Join the club', to: '/auth/register' }}
        secondary={{ label: 'Contact the club', to: '/contact' }}
      />
    </>
  )
}

export default Events

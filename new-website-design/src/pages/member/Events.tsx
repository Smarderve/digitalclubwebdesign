import { useState } from 'react'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import { ApiError } from '../../lib/api'
import { memberApi, type MemberEvent } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  EmptyState,
  StatusBadge,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

function rsvpLabel(event: MemberEvent) {
  return event.rsvp?.status ?? 'not registered'
}

export function MemberEvents({ embedded = false }: { embedded?: boolean } = {}) {
  const { data, loading, error, reload } = useMemberData(() => memberApi.events('all'), [])
  const [target, setTarget] = useState<MemberEvent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { push } = useToast()

  const events = data ?? []
  const now = Date.now()
  const upcoming = events
    .filter((event) => new Date(event.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  const past = events
    .filter((event) => new Date(event.starts_at).getTime() < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())

  const header = embedded ? (
    <div className="mb-4 flex justify-end">
      <ButtonLink to="/events" variant="outline" size="sm">
        Public events page
      </ButtonLink>
    </div>
  ) : (
    <PageHeader
      title="Events"
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Events' }]}
      actions={
        <ButtonLink to="/events" variant="outline" size="sm">
          Public events page
        </ButtonLink>
      }
    />
  )

  async function requestRsvp() {
    if (!target) return
    setSubmitting(true)
    try {
      const result = await memberApi.rsvp(target.id)
      push({
        tone: 'success',
        title: result.rsvp.status === 'approved' ? 'RSVP confirmed' : 'RSVP recorded',
        description:
          result.rsvp.status === 'approved'
            ? 'Your place is confirmed. Bring your digital ID to check in.'
            : 'Your request is waiting for organiser approval.',
      })
      setTarget(null)
      reload()
    } catch (catchError) {
      push({
        tone: 'error',
        title: 'RSVP not recorded',
        description:
          catchError instanceof ApiError
            ? catchError.message
            : 'The request could not be sent. Check your connection and try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !data) {
    return (
      <>
        {header}
        <LoadingBlock rows={4} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        {header}
        <ErrorBlock message={error ?? 'Your events could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  return (
    <>
      {header}

      <Tabs defaultValue="upcoming">
        <TabsList ariaLabel="Event filters">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="mt-4 grid gap-3">
            {upcoming.length ? (
              upcoming.map((event) => {
                const startsAt = new Date(event.starts_at)
                const registered = event.rsvp !== null
                return (
                  <article key={event.id} className="rounded-lg border border-line bg-surface">
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                      <div className="flex w-[64px] shrink-0 flex-col items-center justify-center rounded-md border border-line bg-canvas py-2">
                        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-400">
                          {startsAt.toLocaleString('en-GB', { month: 'short' })}
                        </span>
                        <span className="text-[1.25rem] font-semibold leading-tight tabular text-ink-900">
                          {startsAt.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[0.9375rem] font-semibold text-ink-950">{event.title}</h2>
                          <StatusBadge status={rsvpLabel(event)} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-ink-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                            {formatDate(event.starts_at, {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                            {event.venue ?? 'Venue to be announced'}
                          </span>
                          {event.category ? <Badge tone="outline">{event.category}</Badge> : null}
                          <span className="text-ink-400 tabular">
                            {event.registered_count}
                            {event.capacity !== null ? ` / ${event.capacity}` : ''} registered
                          </span>
                        </div>
                        {event.description ? (
                          <p className="mt-2 line-clamp-2 text-[0.75rem] leading-5 text-ink-500">{event.description}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={registered || submitting}
                          onClick={() => setTarget(event)}
                        >
                          {registered ? 'RSVP recorded' : 'Request RSVP'}
                        </Button>
                      </div>
                    </div>
                    {event.rsvp && event.rsvp.status !== 'approved' ? (
                      <p className="border-t border-line bg-warning-soft/60 px-4 py-2.5 text-[0.75rem] text-warning">
                        {event.rsvp.status === 'rejected'
                          ? 'This RSVP was declined by the organiser. Contact the club if you think this is a mistake.'
                          : 'Your RSVP is awaiting organiser approval. You will receive a notification when it is reviewed.'}
                      </p>
                    ) : null}
                    {event.rsvp?.status === 'approved' ? (
                      <p className="border-t border-line bg-brand-50/60 px-4 py-2.5 text-[0.75rem] text-brand-800">
                        Your place is confirmed. Check-in awards {event.check_in_points} points.
                      </p>
                    ) : null}
                  </article>
                )
              })
            ) : (
              <EmptyState
                icon={<CalendarDays className="h-4 w-4" aria-hidden />}
                title="No upcoming events"
                description="Browse the public events page for workshops, bootcamps and competitions that are open for registration."
                action={
                  <ButtonLink to="/events" variant="outline" size="sm">
                    Browse public events
                  </ButtonLink>
                }
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <Card className="mt-4">
            {past.length ? (
              <TableWrap>
                <THead>
                  <TR>
                    <TH>Event</TH>
                    <TH>Date</TH>
                    <TH>Location</TH>
                    <TH>Attendance</TH>
                    <TH>RSVP</TH>
                    <TH>Points</TH>
                  </TR>
                </THead>
                <TBody>
                  {past.map((event) => (
                    <TR key={event.id}>
                      <TD className="font-medium text-ink-900">{event.title}</TD>
                      <TD className="whitespace-nowrap text-ink-500">{formatDate(event.starts_at)}</TD>
                      <TD className="text-ink-500">{event.venue ?? '—'}</TD>
                      <TD>
                        <Badge tone={event.rsvp?.checked_in ? 'green' : 'neutral'}>
                          {event.rsvp?.checked_in ? 'Checked in' : 'Not checked in'}
                        </Badge>
                      </TD>
                      <TD>
                        <StatusBadge status={rsvpLabel(event)} />
                      </TD>
                      <TD className="tabular text-ink-500">
                        {event.rsvp?.checked_in ? event.check_in_points : 0}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            ) : (
              <div className="p-4">
                <EmptyState
                  compact
                  title="No past events"
                  description="Events you registered for will appear here with their check-in status."
                />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-line bg-canvas/50 p-4">
        <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
        <p className="text-[0.75rem] leading-5 text-ink-500">
          RSVPs are recorded against your membership. Capacity limits apply, and check-in points are awarded once attendance is
          confirmed.
        </p>
      </div>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && !submitting && setTarget(null)}
        title="Request an RSVP?"
        description={
          target
            ? `Record your RSVP for “${target.title}”? ${target.capacity !== null ? `${Math.max(target.capacity - target.registered_count, 0)} places remain.` : ''}`
            : ''
        }
        confirmLabel={submitting ? 'Sending…' : 'Request RSVP'}
        destructive={false}
        onConfirm={requestRsvp}
      />
    </>
  )
}

import { useState } from 'react'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import { demoMemberEvents } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Button, ButtonLink, Card, EmptyState, StatusBadge, TableWrap, TBody, TD, TH, THead, TR, Tabs, TabsContent, TabsList, TabsTrigger, ConfirmDialog } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type RsvpStatus = 'approved' | 'pending' | 'none'
type MemberEvent = Omit<(typeof demoMemberEvents)[number], 'rsvp'> & { rsvp: RsvpStatus }

export function MemberEvents({ embedded = false }: { embedded?: boolean } = {}) {
  const [rsvps, setRsvps] = useState<MemberEvent[]>(demoMemberEvents)
  const [target, setTarget] = useState<number | null>(null)
  const { push } = useToast()
  const upcoming = rsvps.filter((event) => new Date(event.date).getTime() >= Date.now())
  const past = rsvps.filter((event) => new Date(event.date).getTime() < Date.now())
  const targetEvent = rsvps.find((event) => event.id === target)

  function recordRsvp() {
    if (!targetEvent) return
    setRsvps((current) =>
      current.map((event) => (event.id === targetEvent.id ? { ...event, rsvp: 'pending' as const } : event)),
    )
    push({
      tone: 'success',
      title: 'RSVP request recorded',
    })
  }

  return (
    <>
      {embedded ? (
        <div className="mb-4 flex justify-end">
          <ButtonLink to="/events" variant="outline" size="sm">Public events page</ButtonLink>
        </div>
      ) : (
        <PageHeader
          title="Events"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Events' }]}
          actions={<ButtonLink to="/events" variant="outline" size="sm">Public events page</ButtonLink>}
        />
      )}

      <Tabs defaultValue="upcoming">
        <TabsList ariaLabel="Event filters">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="mt-4 grid gap-3">
            {upcoming.length ? (
              upcoming.map((event) => (
                <article key={event.id} className="rounded-lg border border-line bg-surface">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                    <div className="flex w-[64px] shrink-0 flex-col items-center justify-center rounded-md border border-line bg-canvas py-2">
                      <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-400">
                        {new Date(event.date).toLocaleString('en-GB', { month: 'short' })}
                      </span>
                      <span className="text-[1.25rem] font-semibold leading-tight tabular text-ink-900">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[0.9375rem] font-semibold text-ink-950">{event.title}</h2>
                        <StatusBadge status={event.rsvp === 'none' ? 'not registered' : event.rsvp} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-ink-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                          {formatDate(event.date, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                          {event.location}
                        </span>
                        <Badge tone="outline">{event.type}</Badge>
                        <span className="text-ink-400">{event.audience === 'Public event' ? 'Public event' : 'Members only'}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setTarget(event.id)}>
                        {event.rsvp === 'pending' ? 'RSVP requested' : 'Request RSVP'}
                      </Button>
                    </div>
                  </div>
                  {event.rsvp === 'pending' ? (
                    <p className="border-t border-line bg-warning-soft/60 px-4 py-2.5 text-[0.75rem] text-warning">
                      Your RSVP is awaiting organiser approval. You will receive a notification when it is reviewed.
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState
                icon={<CalendarDays className="h-4 w-4" aria-hidden />}
                title="No upcoming events registered"
                description="Browse the public events page for workshops, bootcamps and competitions that are open for registration."
                action={<ButtonLink to="/events" variant="outline" size="sm">Browse public events</ButtonLink>}
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
                      <TD className="whitespace-nowrap text-ink-500">{formatDate(event.date)}</TD>
                      <TD className="text-ink-500">{event.location}</TD>
                      <TD>
                        <Badge tone={event.checkedIn ? 'green' : 'neutral'}>{event.checkedIn ? 'Checked in' : 'Not checked in'}</Badge>
                      </TD>
                      <TD><StatusBadge status={event.rsvp} /></TD>
                      <TD className="tabular text-ink-500">{event.checkedIn ? 40 : 0}</TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            ) : (
              <div className="p-4">
                <EmptyState compact title="No past events" description="Events you attended will appear here with their check-in status." />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-line bg-canvas/50 p-4">
        <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
        <p className="text-[0.75rem] leading-5 text-ink-500">
          RSVPs are reviewed by organisers. Capacity limits apply, and check-in points are awarded once attendance is confirmed.
        </p>
      </div>

      <ConfirmDialog
        open={target !== null && targetEvent?.rsvp === 'none'}
        onOpenChange={(open) => !open && setTarget(null)}
        title="Request an RSVP?"
        description="This records a request for organiser approval. It does not confirm your place."
        confirmLabel="Request RSVP"
        destructive={false}
        onConfirm={recordRsvp}
      />
      <ConfirmDialog
        open={target !== null && targetEvent?.rsvp === 'pending'}
        onOpenChange={(open) => !open && setTarget(null)}
        title="RSVP already requested"
        description="This request is still waiting for organiser approval. You can withdraw it by contacting the club."
        confirmLabel="Close"
        destructive={false}
        onConfirm={() => setTarget(null)}
      />
      {targetEvent && targetEvent.rsvp === 'approved' ? (
        <p className="sr-only">Approved RSVP for {targetEvent.title}</p>
      ) : null}
    </>
  )
}

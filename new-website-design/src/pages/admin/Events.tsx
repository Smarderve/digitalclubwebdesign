import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Check, Plus, QrCode, Search, Users } from 'lucide-react'
import { demoAdminEvents, demoRsvps, demoUsers, demoAdminStats } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, Dialog, DialogContent, EmptyState, Field, Input, Select, StatusBadge, TableWrap, TBody, TD, TH, THead, TR, Textarea } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate, cn } from '../../lib/utils'

type EventRow = (typeof demoAdminEvents)[number]

export function AdminEvents() {
  const [rows, setRows] = useState<EventRow[]>(demoAdminEvents)
  const [filter, setFilter] = useState<'all' | 'Upcoming' | 'Past'>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '2026-12-10T16:00', location: 'KIUT Tech Lab', category: 'Workshop', audience: 'Members', capacity: '60', description: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { push } = useToast()

  const matches = useCallback((row: EventRow, query: string) => `${row.title} ${row.location} ${row.category} ${row.audience}`.toLowerCase().includes(query), [])
  const base = rows.filter((row) => filter === 'all' || row.status === filter)
  const list = useAdminList(base, matches)

  return (
    <>
      <PageHeader
        title="Events"
        description="Workshops, hackathons and talks. Publishing an event makes it visible on the public events page and opens RSVPs."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Events' }]}
        actions={
          <>
            <ButtonLink to="/admin/rsvps" variant="outline" size="sm">RSVPs</ButtonLink>
            <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>New event</Button>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Upcoming events" value={rows.filter((row) => row.status === 'Upcoming').length} hint="On the calendar" tone="brand" />
        <SmallStat label="RSVPs recorded" value={rows.reduce((total, row) => total + row.rsvps, 0)} hint="Across all events" />
        <SmallStat label="Capacity remaining" value={rows.filter((row) => row.status === 'Upcoming').reduce((total, row) => total + Math.max(0, row.capacity - row.rsvps), 0)} hint="Upcoming events" />
        <SmallStat label="Past events" value={rows.filter((row) => row.status === 'Past').length} hint="Archive records" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search events by title or venue…" count={`${list.total} events`}>
          <FilterChips
            label="Event period"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'Upcoming', label: 'Upcoming' },
              { value: 'Past', label: 'Past' },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} events` }}
          emptyTitle="No events match this filter"
          emptyDescription="Try another period or clear the search field."
          columns={[
            {
              id: 'title',
              header: 'Event',
              sortValue: (row) => row.title,
              cell: (row) => (
                <div>
                  <p className="font-medium text-ink-900">{row.title}</p>
                  <p className="text-[0.6875rem] text-ink-400">{row.location} · {row.category}</p>
                </div>
              ),
            },
            {
              id: 'date',
              header: 'Date',
              sortValue: (row) => row.date,
              cell: (row) => <span className="whitespace-nowrap text-ink-600">{formatDate(row.date, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>,
            },
            { id: 'audience', header: 'Audience', cell: (row) => <Badge tone="outline">{row.audience}</Badge> },
            { id: 'rsvps', header: 'RSVPs', align: 'right', sortValue: (row) => row.rsvps, cell: (row) => <span className="tabular">{row.rsvps} / {row.capacity}</span> },
            { id: 'status', header: 'Status', cell: (row) => <Badge tone={row.status === 'Upcoming' ? 'green' : 'neutral'} dot>{row.status}</Badge> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.title}`}>
                  <DropdownItem to={`/admin/events/${row.id}/checkin`} icon={<QrCode className="h-3.5 w-3.5" />}>Open check-in</DropdownItem>
                  <DropdownItem to="/admin/rsvps" icon={<Users className="h-3.5 w-3.5" />}>Review RSVPs</DropdownItem>
                  <DropdownItem
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    onSelect={() => push({ tone: 'info', title: 'Event editing is a prototype action', description: 'Use New event to create a demonstration event; existing published events are read-only here.' })}
                  >
                    Edit event
                  </DropdownItem>
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Create an event"
          description="New events start as draft until an administrator publishes them."
          size="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  const next: Record<string, string> = {}
                  if (form.title.trim().length < 6) next.title = 'Enter a clear event title.'
                  if (!form.location.trim()) next.location = 'Enter the venue.'
                  if (!form.description.trim()) next.description = 'Describe the event for attendees.'
                  setErrors(next)
                  if (Object.keys(next).length) return
                  setRows((current) => [
                    ...current,
                    {
                      id: Math.max(0, ...current.map((row) => row.id)) + 1,
                      title: form.title,
                      date: form.date,
                      location: form.location,
                      category: form.category,
                      audience: form.audience,
                      rsvps: 0,
                      capacity: Number(form.capacity) || 60,
                      status: 'Upcoming',
                    },
                  ])
                  push({ tone: 'success', title: 'Event created in the prototype', description: 'No public event was published and no notification was sent.' })
                  setOpen(false)
                }}
              >
                Create event
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Event title" htmlFor="event-title" required error={errors.title}>
              <Input id="event-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="React Fundamentals — Week 07" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date and time" htmlFor="event-date" required>
                <Input id="event-date" type="datetime-local" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </Field>
              <Field label="Venue" htmlFor="event-location" required error={errors.location}>
                <Input id="event-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category" htmlFor="event-category">
                <Select id="event-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  <option>Workshop</option>
                  <option>Hackathon</option>
                  <option>Tech talk</option>
                  <option>Social event</option>
                </Select>
              </Field>
              <Field label="Audience" htmlFor="event-audience">
                <Select id="event-audience" value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}>
                  <option>Members</option>
                  <option>Public event</option>
                  <option>Paid members</option>
                </Select>
              </Field>
              <Field label="Capacity" htmlFor="event-capacity">
                <Input id="event-capacity" type="number" min={1} value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} />
              </Field>
            </div>
            <Field label="Description" htmlFor="event-description" required error={errors.description} hint="Shown on the public event page.">
              <Textarea id="event-description" rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What will attendees do and learn?" />
            </Field>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AdminEventCheckin() {
  const { eventId } = useParams()
  const event = demoAdminEvents.find((row) => String(row.id) === eventId)
  const [query, setQuery] = useState('')
  const [checkedIn, setCheckedIn] = useState<Record<number, boolean>>({ 1: true, 6: true })
  const { push } = useToast()

  const attendees = demoRsvps
    .filter((row) => row.status === 'approved')
    .map((row, index) => ({ id: index + 1, name: row.name, email: row.email, type: row.type, member: demoUsers.find((user) => user.name === row.name) ?? null }))
    .filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(query.trim().toLowerCase()))

  const attended = Object.values(checkedIn).filter(Boolean).length

  if (!event) {
    return (
      <>
        <PageHeader title="Event not found" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Events', to: '/admin/events' }]} />
        <Card><div className="p-4"><EmptyState title="This event is unavailable" description="The event may have been removed." action={<ButtonLink to="/admin/events" size="sm">Back to events</ButtonLink>} /></div></Card>
      </>
    )
  }

  return (
    <>
      <Link to="/admin/events" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Events
      </Link>
      <PageHeader
        title={`Check-in — ${event.title}`}
        description={`${formatDate(event.date, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${event.location}`}
        badge={<Badge tone="outline">{event.audience}</Badge>}
        actions={<Button variant="outline" size="sm" onClick={() => setCheckedIn(Object.fromEntries(attendees.map((row) => [row.id, true])))}>Check in all</Button>}
      />

      <StatStrip>
        <SmallStat label="Approved RSVPs" value={attendees.length} hint="Eligible to attend" tone="brand" />
        <SmallStat label="Checked in" value={attended} hint="Recorded at the door" />
        <SmallStat label="Not yet arrived" value={Math.max(0, attendees.length - attended)} hint="Still expected" tone="amber" />
        <SmallStat label="Capacity" value={event.capacity} hint="Venue limit" />
      </StatStrip>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="border-b border-line px-4 py-3">
            <div className="relative max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search attendee name or email…" className="h-9 pl-8" aria-label="Search attendees" />
            </div>
          </div>
          <TableWrap>
            <THead>
              <TR>
                <TH>Attendee</TH>
                <TH>Type</TH>
                <TH>Member ID</TH>
                <TH className="text-right">Check-in</TH>
              </TR>
            </THead>
            <TBody>
              {attendees.length ? (
                attendees.map((row) => (
                  <TR key={row.id}>
                    <TD>
                      <p className="font-medium text-ink-900">{row.name}</p>
                      <p className="text-[0.6875rem] text-ink-400">{row.email}</p>
                    </TD>
                    <TD><Badge tone="outline">{row.type}</Badge></TD>
                    <TD className="font-mono text-[0.75rem] text-ink-500">{row.member?.memberId ?? '—'}</TD>
                    <TD className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckedIn((current) => ({ ...current, [row.id]: !current[row.id] }))
                          push({ tone: currentChecked(row.id) ? 'info' : 'success', title: currentChecked(row.id) ? 'Check-in removed in the prototype' : 'Checked in in the prototype', description: `${row.name} — no attendance record was saved.` })
                        }}
                        className={cn(
                          'inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-[0.75rem] font-medium',
                          checkedIn[row.id] ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-600 hover:bg-ink-50',
                        )}
                      >
                        {checkedIn[row.id] ? <Check className="h-3 w-3" aria-hidden /> : null}
                        {checkedIn[row.id] ? 'Checked in' : 'Check in'}
                      </button>
                    </TD>
                  </TR>
                ))
              ) : (
                <TR>
                  <TD colSpan={4} className="p-0"><EmptyState compact title="No attendees match" description="Only approved RSVPs appear on this list." /></TD>
                </TR>
              )}
            </TBody>
          </TableWrap>
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-ink-400">Check-in also works by scanning the member ID at the door.</p>
            <ButtonLink to="/admin/scan-id" variant="outline" size="xs" iconLeft={<QrCode className="h-3 w-3" />}>Scan ID</ButtonLink>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Door instructions" description="For volunteers running the check-in desk" />
            <ul className="space-y-2 px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
              <li>1. Ask the attendee for their digital member ID or full name.</li>
              <li>2. Confirm the RSVP is approved before admitting them.</li>
              <li>3. Check in the attendee once; duplicate scans are ignored.</li>
              <li>4. Send walk-ins to an administrator to record a manual RSVP.</li>
            </ul>
          </Card>
          <Alert tone="warning" title="Demonstration check-in">
            Check-in toggles only affect this browser session. Attendance and award points are recorded in the live application.
          </Alert>
          <Card>
            <CardHeader title="Event summary" />
            <dl className="divide-y divide-line px-4">
              {[
                { label: 'Event', value: event.title },
                { label: 'Category', value: event.category },
                { label: 'Venue', value: event.location },
                { label: 'RSVPs', value: `${event.rsvps} of ${event.capacity}` },
                { label: 'Status', value: event.status },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-[0.75rem] text-ink-500">{item.label}</dt>
                  <dd className="max-w-[60%] text-right text-[0.75rem] font-medium text-ink-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>

      <DemoNotice />

      {demoAdminStats.unreadMessages ? (
        <p className="mt-3 text-[0.6875rem] text-ink-400">{demoAdminStats.unreadMessages} unread member messages are waiting in the admin inbox.</p>
      ) : null}
    </>
  )

  function currentChecked(id: number) {
    return Boolean(checkedIn[id])
  }
}

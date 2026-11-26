import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock, FileText, Plus, Users } from 'lucide-react'
import { demoSessions, demoSessionsReports } from '../../data/demo'
import { PageHeader, SectionTitle } from '../../components/app/primitives'
import { Alert, Badge, Button, Card, CardHeader, ConfirmDialog, Dialog, DialogContent, Field, Input, Select, StatusBadge, TableWrap, TBody, TD, TH, THead, TR, Textarea } from '../../components/ui'
import { AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type SessionRow = (typeof demoSessions.sessions)[number]

export function AdminSessions() {
  const [sessions, setSessions] = useState<SessionRow[]>(demoSessions.sessions)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '2026-12-01', start: '16:00', end: '17:30', venue: 'Computer Lab 2', instructor: 'Samuel Mwita', type: 'Core session', attendance: 'Required' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { push } = useToast()

  return (
    <>
      <PageHeader
        title="Sessions"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Sessions' }]}
        actions={
          <>
            <Link to="/admin/sessions/reports" className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-ink-200 bg-surface px-3 text-[0.75rem] font-medium text-ink-800 hover:bg-ink-50">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Session reports
            </Link>
            <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>New session</Button>
          </>
        }
      />

      <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-brand-800">Current week</p>
            <p className="mt-1 text-[1.0625rem] font-semibold text-ink-950">{demoSessions.week.label} — {demoSessions.week.theme}</p>
            <p className="mt-0.5 text-[0.75rem] text-ink-600">
              {formatDate(demoSessions.week.start)} to {formatDate(demoSessions.week.end)} · {sessions.length} sessions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={demoSessions.week.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => push({ tone: 'info', title: 'Week publishing is available from the record page', description: 'In the live application publishing a week notifies members and opens attendance.' })}
            >
              Publish week
            </Button>
          </div>
        </div>
      </div>

      <StatStrip>
        <SmallStat label="Sessions this week" value={sessions.length} hint="Scheduled" tone="brand" />
        <SmallStat label="Required sessions" value={sessions.filter((row) => row.attendance === 'Required').length} hint="Attendance expected" />
        <SmallStat label="Lab sessions" value={sessions.filter((row) => row.type === 'Lab').length} hint="Practical work" />
        <SmallStat label="Reports submitted" value={demoSessionsReports.length} hint="Awaiting review" tone="amber" />
      </StatStrip>

      <Card className="mt-4">
        <CardHeader title="Session timetable" description="Times are East Africa Time (EAT)." />
        <TableWrap>
          <THead>
            <TR>
              <TH>Session</TH>
              <TH>Date</TH>
              <TH>Time</TH>
              <TH>Venue</TH>
              <TH>Instructor</TH>
              <TH>Type</TH>
              <TH>Attendance</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {sessions.map((row) => (
              <TR key={row.id}>
                <TD className="font-medium text-ink-900">{row.title}</TD>
                <TD className="whitespace-nowrap text-ink-600">{formatDate(row.date, { weekday: 'short', day: 'numeric', month: 'short' })}</TD>
                <TD className="whitespace-nowrap tabular text-ink-600">{row.start}–{row.end}</TD>
                <TD className="text-ink-500">{row.venue}</TD>
                <TD className="text-ink-500">{row.instructor}</TD>
                <TD><Badge tone="outline">{row.type}</Badge></TD>
                <TD><Badge tone={row.attendance === 'Required' ? 'green' : 'neutral'}>{row.attendance}</Badge></TD>
                <TD className="text-right">
                  <RowActions label={`Actions for ${row.title}`}>
                    <DropdownItem icon={<Users className="h-3.5 w-3.5" />} onSelect={() => push({ tone: 'info', title: 'Attendance is available from the record page', description: 'Attendance is recorded by instructors in the live member area.' })}>
                      View attendance
                    </DropdownItem>
                    <DropdownItem icon={<CalendarDays className="h-3.5 w-3.5" />} onSelect={() => push({ tone: 'info', title: 'Session editing is available from the record page' })}>
                      Edit session
                    </DropdownItem>
                  </RowActions>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
        <div className="border-t border-line px-4 py-3">
          <p className="text-[0.6875rem] text-ink-400">Sessions appear on the member timetable once their week is published.</p>
        </div>
      </Card>

      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Create a session"
          description="Add a session to the current week. It is visible to members immediately."
          size="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  const next: Record<string, string> = {}
                  if (form.title.trim().length < 5) next.title = 'Enter a session title.'
                  if (!form.venue.trim()) next.venue = 'Enter the venue or choose Online.'
                  setErrors(next)
                  if (Object.keys(next).length) return
                  setSessions((current) => [...current, { id: Math.max(0, ...current.map((row) => row.id)) + 1, ...form }])
                  push({ tone: 'success', title: 'Session added', description: 'No member notification was sent.' })
                  setOpen(false)
                }}
              >
                Create session
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Session title" htmlFor="session-title" required error={errors.title}>
              <Input id="session-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Routing and navigation" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date" htmlFor="session-date">
                <Input id="session-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </Field>
              <Field label="Starts" htmlFor="session-start">
                <Input id="session-start" type="time" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} />
              </Field>
              <Field label="Ends" htmlFor="session-end">
                <Input id="session-end" type="time" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} />
              </Field>
            </div>
            <Field label="Venue" htmlFor="session-venue" required error={errors.venue}>
              <Input id="session-venue" value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} placeholder="Computer Lab 2 or Online" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Instructor" htmlFor="session-instructor">
                <Select id="session-instructor" value={form.instructor} onChange={(event) => setForm({ ...form, instructor: event.target.value })}>
                  <option>Samuel Mwita</option>
                  <option>Amina Juma</option>
                  <option>Joseph Mtei</option>
                  <option>Halima Nyoni</option>
                </Select>
              </Field>
              <Field label="Type" htmlFor="session-type">
                <Select id="session-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  <option>Core session</option>
                  <option>Lab</option>
                  <option>Clinic</option>
                  <option>Tech talk</option>
                </Select>
              </Field>
              <Field label="Attendance" htmlFor="session-attendance">
                <Select id="session-attendance" value={form.attendance} onChange={(event) => setForm({ ...form, attendance: event.target.value })}>
                  <option>Required</option>
                  <option>Optional</option>
                </Select>
              </Field>
            </div>
            <Field label="Preparation notes" htmlFor="session-notes" optional hint="Shown to members before the session.">
              <Textarea id="session-notes" rows={3} placeholder="Bring a laptop with Node.js installed." />
            </Field>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AdminSessionReports() {
  const [reports, setReports] = useState(demoSessionsReports)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [reviewing, setReviewing] = useState<(typeof demoSessionsReports)[number] | null>(null)
  const { push } = useToast()

  const matches = useCallback((row: (typeof demoSessionsReports)[number], query: string) => `${row.session} ${row.instructor} ${row.status}`.toLowerCase().includes(query), [])
  const base = reports.filter((row) => filter === 'all' || row.status === filter)
  const list = useAdminList(base, matches)

  return (
    <>
      <PageHeader
        title="Session reports"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Sessions', to: '/admin/sessions' }, { label: 'Reports' }]}
        actions={<Link to="/admin/sessions" className="inline-flex h-8 items-center rounded-sm border border-ink-200 bg-surface px-3 text-[0.75rem] font-medium text-ink-800 hover:bg-ink-50">Timetable</Link>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Reports submitted', value: reports.length, hint: 'This week' },
          { label: 'Awaiting review', value: reports.filter((row) => row.status === 'pending').length, hint: 'Needs an administrator' },
          { label: 'Attendees recorded', value: reports.reduce((total, row) => total + row.attendees, 0), hint: 'Across reports' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            <p className="mt-1.5 text-[1.25rem] font-semibold tabular tracking-tight text-ink-950">{item.value}</p>
            <p className="text-[0.6875rem] text-ink-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search reports by session or instructor…" count={`${list.total} reports`}>
          <FilterChips
            label="Report status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
            ]}
          />
        </AdminToolbar>
        <TableWrap>
          <THead>
            <TR>
              <TH>Session</TH>
              <TH>Instructor</TH>
              <TH>Submitted</TH>
              <TH>Attendees</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {list.filtered.map((row) => (
              <TR key={row.id}>
                <TD className="font-medium text-ink-900">{row.session}</TD>
                <TD className="text-ink-600">{row.instructor}</TD>
                <TD className="whitespace-nowrap text-ink-500">{formatDate(row.submitted)}</TD>
                <TD className="tabular">{row.attendees}</TD>
                <TD><StatusBadge status={row.status} /></TD>
                <TD className="text-right">
                  <RowActions label={`Actions for ${row.session}`}>
                    <DropdownItem icon={<FileText className="h-3.5 w-3.5" />} onSelect={() => setReviewing(row)}>Review report</DropdownItem>
                    {row.status === 'pending' ? (
                      <DropdownItem
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        onSelect={() => {
                          setReports((current) => current.map((entry) => (entry.id === row.id ? { ...entry, status: 'approved' } : entry)))
                          push({ tone: 'success', title: 'Report approved' })
                        }}
                      >
                        Approve report
                      </DropdownItem>
                    ) : null}
                  </RowActions>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      </Card>

      <div className="mt-4">
        <Alert tone="info" title="Why reports matter">
          Approved reports confirm that a session took place and feed attendance points. Reports with missing attendance should be returned to the instructor rather than approved.
        </Alert>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[0.6875rem] text-ink-400">
        <Clock className="h-3 w-3" aria-hidden />
        Instructors can submit a report up to seven days after the session.
      </p>
      <DemoNotice />

      <ConfirmDialog
        open={reviewing !== null}
        onOpenChange={(open) => !open && setReviewing(null)}
        title="Report preview"
        description={`${reviewing?.session ?? 'Session'} — ${reviewing?.attendees ?? 0} attendees recorded by ${reviewing?.instructor ?? 'the instructor'}. Report content is not stored.`}
        confirmLabel="Close"
        destructive={false}
        onConfirm={() => undefined}
      />
    </>
  )
}

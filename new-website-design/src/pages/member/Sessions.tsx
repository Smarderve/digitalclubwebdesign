import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardCheck, Clock, MapPin, Users } from 'lucide-react'
import { demoMember, demoSessions, demoSessionsReports } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, EmptyState, Field, Input, StatusBadge, TableWrap, TBody, TD, TH, THead, TR, Textarea } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

export function SessionsTimetable({ embedded = false }: { embedded?: boolean } = {}) {
  const week = demoSessions
  const pendingReports = demoSessionsReports.filter((report) => report.status === 'pending')

  return (
    <>
      {embedded ? (
        <div className="mb-4 flex justify-end">
          <ButtonLink to="/member/sessions/instructors" variant="outline" size="sm">Instructors</ButtonLink>
        </div>
      ) : (
        <PageHeader
          title="Sessions timetable"
          description="The current teaching week, session venues and instructors. Session reports are submitted by the instructor who ran the session."
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Sessions' }]}
          actions={
            <>
              <ButtonLink to="/member/sessions/instructors" variant="outline" size="sm">Instructors</ButtonLink>
              <ButtonLink to="/member/quizzes" size="sm">Warmups</ButtonLink>
            </>
          }
        />
      )}

      <div className="rounded-lg border border-line bg-white">
        <div className="flex flex-col gap-4 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[0.9375rem] font-semibold text-ink-950">{week.week.label} — {week.week.theme}</h2>
              <StatusBadge status={week.week.status} />
            </div>
            <p className="mt-1 text-[0.75rem] text-ink-500">
              {formatDate(week.week.start)} – {formatDate(week.week.end)}
            </p>
          </div>
          <p className="text-[0.75rem] text-ink-500">
            {week.sessions.length} sessions · {week.sessions.filter((session) => session.attendance === 'Required').length} required
          </p>
        </div>
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
              <TH className="text-right">Report</TH>
            </TR>
          </THead>
          <TBody>
            {week.sessions.map((session) => (
              <TR key={session.id}>
                <TD className="font-medium text-ink-900">{session.title}</TD>
                <TD className="whitespace-nowrap text-ink-500">{formatDate(session.date)}</TD>
                <TD className="whitespace-nowrap tabular text-ink-500">{session.start}–{session.end}</TD>
                <TD className="text-ink-500">{session.venue}</TD>
                <TD className="text-ink-500">{session.instructor}</TD>
                <TD><Badge tone="outline">{session.type}</Badge></TD>
                <TD>
                  <Badge tone={session.attendance === 'Required' ? 'green' : 'neutral'}>{session.attendance}</Badge>
                </TD>
                <TD className="text-right">
                  <Link to={`/member/sessions/${session.id}/report`} className="text-[0.75rem] font-medium text-brand-800 hover:underline">
                    Submit report
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Session reports" description="Reports from your sessions in the current week" action={<Badge tone="amber">{pendingReports.length} pending</Badge>} />
          <div className="divide-y divide-line">
            {demoSessionsReports.map((report) => (
              <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium text-ink-900">{report.session}</p>
                  <p className="text-[0.6875rem] text-ink-400">
                    {report.instructor} · submitted {formatDate(report.submitted)} · {report.attendees} attendees
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </div>
            ))}
          </div>
          <div className="border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-ink-400">Reports are reviewed by an administrator. Attendance is counted separately.</p>
          </div>
        </Card>

        <div className="rounded-lg border border-line bg-white">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[0.9375rem] font-semibold text-ink-950">Week at a glance</h2>
          </div>
          <dl className="divide-y divide-line">
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-[0.75rem] text-ink-500">Core sessions</dt>
              <dd className="text-[0.75rem] font-medium tabular text-ink-900">{week.sessions.filter((s) => s.type === 'Core session').length}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-[0.75rem] text-ink-500">Lab sessions</dt>
              <dd className="text-[0.75rem] font-medium tabular text-ink-900">{week.sessions.filter((s) => s.type === 'Lab').length}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-[0.75rem] text-ink-500">Clinics</dt>
              <dd className="text-[0.75rem] font-medium tabular text-ink-900">{week.sessions.filter((s) => s.type === 'Clinic').length}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-[0.75rem] text-ink-500">Venues</dt>
              <dd className="text-right text-[0.75rem] font-medium text-ink-900">{Array.from(new Set(week.sessions.map((s) => s.venue))).join(', ')}</dd>
            </div>
          </dl>
          <div className="px-4 pb-4">
            <Alert tone="info" title="Attendance">
              Attendance is recorded at the session and used only to confirm participation and points. Contact the instructor if a session is
              missing from your record.
            </Alert>
          </div>
        </div>
      </div>
    </>
  )
}

export function SessionInstructors() {
  const instructors = Array.from(new Set(demoSessions.sessions.map((session) => session.instructor)))

  return (
    <>
      <PageHeader
        title="Session instructors"
        description="Members who currently lead sessions. Each instructor can submit a report after their session."
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Sessions', to: '/member/sessions/timetable' }, { label: 'Instructors' }]}
        actions={<ButtonLink to="/member/sessions/timetable" variant="outline" size="sm" iconLeft={<ArrowLeft className="h-3.5 w-3.5" />}>Back to timetable</ButtonLink>}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {instructors.map((instructor) => {
          const sessions = demoSessions.sessions.filter((session) => session.instructor === instructor)
          return (
            <article key={instructor} className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[0.875rem] font-semibold text-ink-950">{instructor}</h2>
                  <p className="mt-0.5 text-[0.75rem] text-ink-500">Session instructor</p>
                </div>
                <Badge tone="green">Active</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-ink-400">Sessions this week</dt>
                  <dd className="mt-1 text-[0.8125rem] font-medium text-ink-900">{sessions.length}</dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-ink-400">Next session</dt>
                  <dd className="mt-1 text-[0.8125rem] font-medium text-ink-900">
                    {formatDate(sessions[0]?.date ?? '')} · {sessions[0]?.start}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {sessions.map((session) => (
                  <Badge key={session.id} tone="outline">{session.title}</Badge>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-4 rounded-lg border border-line bg-canvas/50 p-4">
        <p className="text-[0.75rem] leading-6 text-ink-500">
          Instructors are assigned by the club's technical leads. If your name is missing or a session is assigned incorrectly, contact the
          technical lead through the <Link to="/contact" className="font-medium text-brand-800 hover:underline">contact page</Link>.
        </p>
      </div>
    </>
  )
}

export function SessionReport() {
  const { id } = useParams()
  const session = demoSessions.sessions.find((entry) => String(entry.id) === id)
  const navigate = useNavigate()
  const { push } = useToast()
  const [attendees, setAttendees] = useState('')
  const [summary, setSummary] = useState('')
  const [followUps, setFollowUps] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!session) {
    return (
      <>
        <PageHeader title="Session not found" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Sessions', to: '/member/sessions/timetable' }]} />
        <Card>
          <div className="p-4">
            <EmptyState title="This session is not in the current week" description="Only sessions in the published week can receive a report. Open the timetable to choose a session." action={<ButtonLink to="/member/sessions/timetable" size="sm">Back to timetable</ButtonLink>} />
          </div>
        </Card>
      </>
    )
  }

  if (submitted) {
    return (
      <>
        <PageHeader
          title="Report submitted"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Sessions', to: '/member/sessions/timetable' }, { label: session.title }]}
        />
        <Card>
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-[1rem] font-semibold text-ink-950">Report submitted in the prototype</h2>
            <p className="mt-1 max-w-[46ch] text-[0.8125rem] leading-6 text-ink-500">
              This is a frontend demonstration. No report was stored and no administrator was notified. In the live application the report moves
              to <span className="font-medium text-ink-800">pending review</span>.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/member/sessions/timetable')}>Back to timetable</Button>
              <Button
                size="sm"
                onClick={() => {
                  setSubmitted(false)
                  setAttendees('')
                  setSummary('')
                  setFollowUps('')
                }}
              >
                Edit this report
              </Button>
            </div>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Session report"
        description={`${session.title} — ${formatDate(session.date)}, ${session.start}–${session.end} at ${session.venue}`}
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Sessions', to: '/member/sessions/timetable' }, { label: 'Report' }]}
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="What happened" description="Reports help the club keep an accurate record of teaching and attendance." />
          <form
            className="space-y-4 p-4"
            onSubmit={(event) => {
              event.preventDefault()
              const next: Record<string, string> = {}
              const count = Number(attendees)
              if (!attendees.trim()) next.attendees = 'Enter the number of attendees.'
              else if (!Number.isInteger(count) || count < 0) next.attendees = 'Enter a whole number of attendees.'
              if (summary.trim().length < 20) next.summary = 'Write at least 20 characters so the report is useful.'
              setErrors(next)
              if (Object.keys(next).length) return
              setSubmitted(true)
              push({ tone: 'success', title: 'Demonstration report captured', description: 'Nothing was sent to the server.' })
            }}
          >
            <Field label="Attendees" htmlFor="attendees" required hint="Count everyone present, including the instructor." error={errors.attendees}>
              <Input id="attendees" type="number" min={0} value={attendees} onChange={(event) => setAttendees(event.target.value)} placeholder="e.g. 18" />
            </Field>
            <Field label="Summary" htmlFor="summary" required hint="What was taught, what was completed and what was not." error={errors.summary}>
              <Textarea id="summary" rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Describe the session…" />
            </Field>
            <Field label="Follow-ups" htmlFor="follow-ups" hint="Optional. Topics to revisit, members who need support, materials to publish.">
              <Textarea id="follow-ups" rows={3} value={followUps} onChange={(event) => setFollowUps(event.target.value)} placeholder="Optional notes…" />
            </Field>
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button type="submit" size="sm" iconLeft={<ClipboardCheck className="h-3.5 w-3.5" />}>Submit report</Button>
              <ButtonLink to="/member/sessions/timetable" variant="ghost" size="sm">Cancel</ButtonLink>
              <span className="text-[0.6875rem] text-ink-400 sm:ml-auto">Prototype only — nothing is stored.</span>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-white">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.9375rem] font-semibold text-ink-950">Session details</h2>
            </div>
            <dl className="divide-y divide-line px-4">
              {[
                { icon: <CalendarDays className="h-3.5 w-3.5" aria-hidden />, label: 'Date', value: formatDate(session.date) },
                { icon: <Clock className="h-3.5 w-3.5" aria-hidden />, label: 'Time', value: `${session.start}–${session.end}` },
                { icon: <MapPin className="h-3.5 w-3.5" aria-hidden />, label: 'Venue', value: session.venue },
                { icon: <Users className="h-3.5 w-3.5" aria-hidden />, label: 'Instructor', value: session.instructor },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 py-3">
                  <dt className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500">
                    {item.icon}
                    {item.label}
                  </dt>
                  <dd className="text-right text-[0.75rem] font-medium text-ink-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Alert tone="warning" title="Report before the week closes">
            Reports can only be submitted for the published week. Once the week is archived, ask an administrator to reopen it.
          </Alert>

          <div className="rounded-lg border border-line bg-canvas/50 p-4">
            <p className="text-[0.75rem] leading-6 text-ink-500">
              Members: attend the session and check in with the instructor. {demoMember.name} is signed in as a demonstration member.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

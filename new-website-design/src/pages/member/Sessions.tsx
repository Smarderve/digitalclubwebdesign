import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardCheck, Clock, MapPin, Users } from 'lucide-react'
import { ApiError, api } from '../../lib/api'
import { memberApi, type SessionItem, type Timetable } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  StatusBadge,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Textarea,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

/** `start_time` / `end_time` arrive as "HH:MM:SS"; `new Date` cannot parse them. */
function clock(value: string | null) {
  return value ? value.slice(0, 5) : '—'
}

function sessionTime(session: SessionItem) {
  if (!session.start_time) return '—'
  return `${clock(session.start_time)}–${clock(session.end_time)}`
}

function sessionVenue(session: SessionItem) {
  return session.location ?? session.meeting_link ?? '—'
}

function allSessions(timetable: Timetable) {
  return timetable.days.flatMap((day) => day.sessions)
}

export function SessionsTimetable({ embedded = false }: { embedded?: boolean } = {}) {
  const { data, loading, error, reload } = useMemberData(
    () => Promise.all([memberApi.timetable(), api.me()]).then(([timetable, me]) => ({ timetable, me })),
    [],
  )

  const header = embedded ? (
    <div className="mb-4 flex justify-end">
      <ButtonLink to="/member/sessions/instructors" variant="outline" size="sm">
        Instructors
      </ButtonLink>
    </div>
  ) : (
    <PageHeader
      title="Sessions timetable"
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Sessions' }]}
      actions={
        <>
          <ButtonLink to="/member/sessions/instructors" variant="outline" size="sm">
            Instructors
          </ButtonLink>
          <ButtonLink to="/member/quizzes" size="sm">
            Warmups
          </ButtonLink>
        </>
      }
    />
  )

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
        <ErrorBlock message={error ?? 'The timetable could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const { timetable, me } = data
  const sessions = allSessions(timetable)
  const mySessions = sessions.filter((session) => session.instructor.id === me.user.id)

  return (
    <>
      {header}

      <div className="rounded-lg border border-line bg-surface">
        <div className="flex flex-col gap-4 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[0.9375rem] font-semibold text-ink-950">
                {timetable.week ? timetable.week.title : 'Current week'}
              </h2>
              {timetable.week ? <StatusBadge status="published" /> : null}
            </div>
            <p className="mt-1 text-[0.75rem] text-ink-500">
              {timetable.week?.week_start || timetable.week?.week_end ? (
                <>
                  {timetable.week?.week_start ? formatDate(timetable.week.week_start) : '—'} –{' '}
                  {timetable.week?.week_end ? formatDate(timetable.week.week_end) : '—'}
                </>
              ) : (
                'No published week yet.'
              )}
            </p>
          </div>
          <p className="text-[0.75rem] text-ink-500">
            {sessions.length} sessions · {mySessions.length} assigned to you
          </p>
        </div>

        {sessions.length ? (
          <TableWrap>
            <THead>
              <TR>
                <TH>Session</TH>
                <TH>Date</TH>
                <TH>Time</TH>
                <TH>Venue</TH>
                <TH>Instructor</TH>
                <TH>Category</TH>
                <TH>Status</TH>
                <TH className="text-right">Report</TH>
              </TR>
            </THead>
            <TBody>
              {sessions.map((session) => (
                <TR key={session.id}>
                  <TD className="font-medium text-ink-900">{session.topic}</TD>
                  <TD className="whitespace-nowrap text-ink-500">{formatDate(session.date)}</TD>
                  <TD className="whitespace-nowrap tabular text-ink-500">{sessionTime(session)}</TD>
                  <TD className="text-ink-500">{sessionVenue(session)}</TD>
                  <TD className="text-ink-500">{session.instructor.display_name}</TD>
                  <TD>{session.category ? <Badge tone="outline">{session.category}</Badge> : '—'}</TD>
                  <TD>
                    <StatusBadge status={session.status} />
                  </TD>
                  <TD className="text-right">
                    {session.instructor.id === me.user.id ? (
                      <Link
                        to={`/member/sessions/${session.id}/report`}
                        className="text-[0.75rem] font-medium text-brand-800 hover:underline"
                      >
                        Submit report
                      </Link>
                    ) : (
                      <span className="text-[0.75rem] text-ink-400">—</span>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        ) : (
          <div className="p-4">
            <EmptyState
              compact
              icon={<CalendarDays className="h-4 w-4" aria-hidden />}
              title="No sessions published"
              description="Sessions for the current week appear here once an administrator publishes the timetable."
            />
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Sessions you lead"
            description="Sessions assigned to you in the current week"
            action={<Badge tone="amber">{mySessions.length}</Badge>}
          />
          {mySessions.length ? (
            <div className="divide-y divide-line">
              {mySessions.map((session) => (
                <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] font-medium text-ink-900">{session.topic}</p>
                    <p className="text-[0.6875rem] text-ink-400">
                      {formatDate(session.date)} · {sessionTime(session)} · {sessionVenue(session)}
                    </p>
                  </div>
                  <Link
                    to={`/member/sessions/${session.id}/report`}
                    className="text-[0.75rem] font-medium text-brand-800 hover:underline"
                  >
                    Submit report
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                compact
                title="No sessions assigned to you"
                description="When an administrator assigns you as the instructor of a session, it appears here."
              />
            </div>
          )}
          <div className="border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-ink-400">
              Reports are reviewed by an administrator. Attendance is counted separately.
            </p>
          </div>
        </Card>

        <div className="rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[0.9375rem] font-semibold text-ink-950">Week at a glance</h2>
          </div>
          {sessions.length ? (
            <dl className="divide-y divide-line">
              {Object.entries(
                sessions.reduce<Record<string, number>>((counts, session) => {
                  const key = session.category ?? 'Uncategorised'
                  counts[key] = (counts[key] ?? 0) + 1
                  return counts
                }, {}),
              ).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between px-4 py-3">
                  <dt className="text-[0.75rem] text-ink-500">{category}</dt>
                  <dd className="text-[0.75rem] font-medium tabular text-ink-900">{count}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-[0.75rem] text-ink-500">Venues</dt>
                <dd className="text-right text-[0.75rem] font-medium text-ink-900">
                  {Array.from(new Set(sessions.map(sessionVenue).filter((venue) => venue !== '—'))).join(', ') || '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="px-4 py-6">
              <p className="text-[0.75rem] text-ink-500">Nothing scheduled for the current week.</p>
            </div>
          )}
          <div className="px-4 pb-4">
            <Alert tone="info" title="Attendance">
              Attendance is recorded at the session and used only to confirm participation and points. Contact the instructor if a
              session is missing from your record.
            </Alert>
          </div>
        </div>
      </div>
    </>
  )
}

export function SessionInstructors() {
  const { data, loading, error, reload } = useMemberData(() => memberApi.instructors(), [])

  return (
    <>
      <PageHeader
        title="Session instructors"
        breadcrumbs={[
          { label: 'Member', to: '/member' },
          { label: 'Sessions', to: '/member/sessions/timetable' },
          { label: 'Instructors' },
        ]}
        actions={
          <ButtonLink
            to="/member/sessions/timetable"
            variant="outline"
            size="sm"
            iconLeft={<ArrowLeft className="h-3.5 w-3.5" />}
          >
            Back to timetable
          </ButtonLink>
        }
      />

      {loading && !data ? <LoadingBlock rows={3} /> : null}
      {error || !data ? <ErrorBlock message={error ?? 'Instructors could not be loaded.'} onRetry={reload} /> : null}

      {data ? (
        data.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.map((instructor) => (
              <article key={`${instructor.id ?? 'unassigned'}-${instructor.display_name}`} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[0.875rem] font-semibold text-ink-950">{instructor.display_name}</h2>
                    <p className="mt-0.5 text-[0.75rem] text-ink-500">Session instructor</p>
                  </div>
                  <Badge tone={instructor.id === null ? 'outline' : 'green'}>
                    {instructor.id === null ? 'Unassigned' : 'Active'}
                  </Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-ink-400">Sessions this week</dt>
                    <dd className="mt-1 text-[0.8125rem] font-medium text-ink-900">{instructor.sessions.length}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-ink-400">Next session</dt>
                    <dd className="mt-1 text-[0.8125rem] font-medium text-ink-900">
                      {instructor.sessions[0]
                        ? `${formatDate(instructor.sessions[0].date)} · ${clock(instructor.sessions[0].start_time)}`
                        : '—'}
                    </dd>
                  </div>
                </dl>
                {instructor.sessions.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {instructor.sessions.map((session) => (
                      <Badge key={session.id} tone="outline">
                        {session.topic}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-4">
              <EmptyState
                icon={<Users className="h-4 w-4" aria-hidden />}
                title="No instructors published"
                description="Instructors appear here once sessions for the current week have been published."
              />
            </div>
          </Card>
        )
      ) : null}

      <div className="mt-4 rounded-lg border border-line bg-canvas/50 p-4">
        <p className="text-[0.75rem] leading-6 text-ink-500">
          Instructors are assigned by the club's technical leads. If your name is missing or a session is assigned incorrectly, contact
          the technical lead through the{' '}
          <Link to="/contact" className="font-medium text-brand-800 hover:underline">
            contact page
          </Link>
          .
        </p>
      </div>
    </>
  )
}

export function SessionReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()
  const { data, loading, error, reload } = useMemberData(() => memberApi.timetable(), [])
  const [attendees, setAttendees] = useState('')
  const [summary, setSummary] = useState('')
  const [winner, setWinner] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ status: string; participant_count: number; submitted_at: string | null } | null>(
    null,
  )

  const breadcrumbs = [
    { label: 'Member', to: '/member' },
    { label: 'Sessions', to: '/member/sessions/timetable' },
    { label: 'Report' },
  ]

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Session report" breadcrumbs={breadcrumbs} />
        <LoadingBlock rows={3} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Session report" breadcrumbs={breadcrumbs} />
        <ErrorBlock message={error ?? 'The session could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const session = allSessions(data).find((entry) => String(entry.id) === id)

  if (!session) {
    return (
      <>
        <PageHeader
          title="Session not found"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Sessions', to: '/member/sessions/timetable' }]}
        />
        <Card>
          <div className="p-4">
            <EmptyState
              title="This session is not in the current week"
              description="Only sessions in the published week can receive a report. Open the timetable to choose a session."
              action={
                <ButtonLink to="/member/sessions/timetable" size="sm">
                  Back to timetable
                </ButtonLink>
              }
            />
          </div>
        </Card>
      </>
    )
  }

  if (result) {
    return (
      <>
        <PageHeader
          title="Report submitted"
          breadcrumbs={[
            { label: 'Member', to: '/member' },
            { label: 'Sessions', to: '/member/sessions/timetable' },
            { label: session.topic },
          ]}
        />
        <Card>
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-[1rem] font-semibold text-ink-950">Report submitted</h2>
            <p className="mt-1 max-w-[46ch] text-[0.8125rem] leading-6 text-ink-500">
              {session.topic} · {result.participant_count} attendees recorded
              {result.submitted_at ? ` · submitted ${formatDate(result.submitted_at)}` : ''}. The report is now{' '}
              <span className="font-medium text-ink-800">{result.status}</span>.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/member/sessions/timetable')}>
                Back to timetable
              </Button>
              <Button size="sm" onClick={() => setResult(null)}>
                Submit another report
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
        description={`${session.topic} — ${formatDate(session.date)}, ${sessionTime(session)} at ${sessionVenue(session)}`}
        breadcrumbs={breadcrumbs}
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title="What happened"
            description="Reports help the club keep an accurate record of teaching and attendance."
          />
          <form
            className="space-y-4 p-4"
            onSubmit={async (event) => {
              event.preventDefault()
              const next: Record<string, string> = {}
              const count = Number(attendees)
              if (!attendees.trim()) next.attendees = 'Enter the number of attendees.'
              else if (!Number.isInteger(count) || count < 0) next.attendees = 'Enter a whole number of attendees.'
              if (summary.trim().length < 20) next.summary = 'Write at least 20 characters so the report is useful.'
              setErrors(next)
              if (Object.keys(next).length) return
              setSubmitting(true)
              try {
                const submitted = await memberApi.reportSession(session.id, {
                  participant_count: count,
                  notes: summary.trim(),
                  winner_username: winner.trim() || null,
                })
                setResult({
                  status: submitted.status,
                  participant_count: submitted.participant_count,
                  submitted_at: submitted.submitted_at,
                })
                push({ tone: 'success', title: 'Session report submitted' })
              } catch (catchError) {
                push({
                  tone: 'error',
                  title: 'Report not submitted',
                  description:
                    catchError instanceof ApiError
                      ? catchError.message
                      : 'The report could not be saved. Check your connection and try again.',
                })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            <Field
              label="Attendees"
              htmlFor="attendees"
              required
              hint="Count everyone present, including the instructor."
              error={errors.attendees}
            >
              <Input
                id="attendees"
                type="number"
                min={0}
                value={attendees}
                onChange={(event) => setAttendees(event.target.value)}
                placeholder="e.g. 18"
              />
            </Field>
            <Field
              label="Summary"
              htmlFor="summary"
              required
              hint="What was taught, what was completed and what was not."
              error={errors.summary}
            >
              <Textarea
                id="summary"
                rows={5}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Describe the session…"
              />
            </Field>
            <Field
              label="Winner"
              htmlFor="winner"
              hint="Optional. Club username of a member who stood out in this session."
            >
              <Input
                id="winner"
                value={winner}
                onChange={(event) => setWinner(event.target.value)}
                placeholder="Optional username"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button type="submit" size="sm" disabled={submitting} iconLeft={<ClipboardCheck className="h-3.5 w-3.5" />}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </Button>
              <ButtonLink to="/member/sessions/timetable" variant="ghost" size="sm">
                Cancel
              </ButtonLink>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.9375rem] font-semibold text-ink-950">Session details</h2>
            </div>
            <dl className="divide-y divide-line px-4">
              {[
                { icon: <CalendarDays className="h-3.5 w-3.5" aria-hidden />, label: 'Date', value: formatDate(session.date) },
                { icon: <Clock className="h-3.5 w-3.5" aria-hidden />, label: 'Time', value: sessionTime(session) },
                { icon: <MapPin className="h-3.5 w-3.5" aria-hidden />, label: 'Venue', value: sessionVenue(session) },
                {
                  icon: <Users className="h-3.5 w-3.5" aria-hidden />,
                  label: 'Instructor',
                  value: session.instructor.display_name,
                },
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
        </div>
      </div>
    </>
  )
}

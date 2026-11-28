import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Medal,
  Send,
  Trophy,
  Users,
} from 'lucide-react'
import { ApiError } from '../../lib/api'
import { memberApi, type CompetitionEntry } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Dialog,
  DialogContent,
  EmptyState,
  Field,
  Input,
  Select,
  StatusBadge,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

const levelLabel = (level: number) =>
  level === 1 ? 'Level 1 · Foundation' : level === 2 ? 'Level 2 · Intermediate' : 'Level 3 · Advanced'

function statusText(status: string) {
  if (status === 'published') return 'Open for entries'
  if (status === 'judging') return 'Judging'
  if (status === 'finalized') return 'Finalized'
  return status
}

function isOpen(entry: CompetitionEntry) {
  return entry.status === 'published' && new Date(entry.ends_at).getTime() > Date.now()
}

export function CompetitionList({ frequency, embedded = false }: { frequency: 'weekly' | 'monthly'; embedded?: boolean }) {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const { data, loading, error, reload } = useMemberData(() => memberApi.competitions(frequency), [frequency])

  const header = embedded ? null : (
    <PageHeader
      title={frequency === 'weekly' ? 'Weekly competitions' : 'Monthly competitions'}
      description={
        frequency === 'weekly'
          ? 'Short, focused challenges that run each week. Entries are judged against published criteria.'
          : 'Larger builds that run across a month. Teams and individuals can enter.'
      }
      breadcrumbs={[
        { label: 'Member', to: '/member' },
        { label: 'Competitions', to: '/member/competitions/weekly' },
        { label: frequency === 'weekly' ? 'Weekly' : 'Monthly' },
      ]}
      actions={
        <ButtonLink to={`/member/competitions/${frequency === 'weekly' ? 'monthly' : 'weekly'}`} variant="outline" size="sm">
          {frequency === 'weekly' ? 'Monthly competitions' : 'Weekly competitions'}
        </ButtonLink>
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
        <ErrorBlock message={error ?? 'Competitions could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const records = [...data.active, ...data.past]
  const visible = records.filter((competition) => {
    if (status !== 'all' && competition.status !== status) return false
    if (search.trim() && !`${competition.title} ${competition.category ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))
      return false
    return true
  })

  return (
    <>
      {header}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-[300px]">
          <label htmlFor="competition-search" className="sr-only">
            Search competitions
          </label>
          <Input
            id="competition-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or category…"
            className="pl-3"
          />
        </div>
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="w-full sm:w-[180px]"
          aria-label="Filter by status"
        >
          <option value="all">All active statuses</option>
          <option value="published">Open for entries</option>
          <option value="judging">Judging</option>
          <option value="finalized">Finalized</option>
        </Select>
      </div>

      {visible.length ? (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="divide-y divide-line">
            {visible.map((competition) => (
              <Link
                key={competition.id}
                to={`/member/competitions/${competition.id}`}
                className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-ink-50/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                    <Trophy className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[0.875rem] font-semibold text-ink-950">{competition.title}</h2>
                      <StatusBadge status={competition.status} />
                      {competition.enrolled ? <Badge tone="green">Entered</Badge> : null}
                    </div>
                    <p className="mt-0.5 text-[0.6875rem] text-ink-500">
                      {levelLabel(competition.level)}
                      {competition.category ? ` · ${competition.category}` : ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.625rem] text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden />
                        {formatDate(competition.starts_at)} – {formatDate(competition.ends_at)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" aria-hidden />
                        {competition.submission_type}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800">
                  {isOpen(competition) ? 'Open' : statusText(competition.status)}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Trophy className="h-4 w-4" aria-hidden />}
          title={records.length ? 'No competitions match these filters' : `No published ${frequency} competitions`}
          description={
            records.length
              ? 'Try another status or clear the search to see every published challenge.'
              : 'Competitions appear here once an administrator publishes them.'
          }
          action={
            records.length && (status !== 'all' || search) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus('all')
                  setSearch('')
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {[
          {
            title: 'How judging works',
            text: 'Each competition publishes its criteria and weighting. Judges score submissions against those criteria.',
          },
          {
            title: 'Points and rewards',
            text: 'Winning entries can award club points, prizes and a place on the competition leaderboard.',
          },
          {
            title: 'Eligibility',
            text: 'Some levels are limited by year of study or require an active paid membership.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-line bg-canvas/50 p-4">
            <p className="text-[0.8125rem] font-semibold text-ink-900">{item.title}</p>
            <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">{item.text}</p>
          </div>
        ))}
      </div>
    </>
  )
}

export function CompetitionDetail() {
  const { id } = useParams()
  const competitionId = Number(id)
  const { push } = useToast()
  const { data: competition, loading, error, reload } = useMemberData(
    () => memberApi.competition(competitionId),
    [competitionId],
  )
  const [enrolOpen, setEnrolOpen] = useState(false)
  const [mode, setMode] = useState<'individual' | 'team'>('individual')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submission, setSubmission] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading && !competition) {
    return (
      <>
        <PageHeader title="Competition" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Competitions', to: '/member/competitions' }]} />
        <LoadingBlock rows={4} />
      </>
    )
  }

  if (error || !competition) {
    return (
      <>
        <PageHeader title="Competition" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Competitions', to: '/member/competitions' }]} />
        {error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : (
          <Card>
            <div className="p-4">
              <EmptyState
                title="Competition not found"
                description="This competition does not exist or is not published."
                action={
                  <ButtonLink to="/member/competitions" size="sm">
                    All competitions
                  </ButtonLink>
                }
              />
            </div>
          </Card>
        )}
      </>
    )
  }

  const enrolled = competition.enrollment !== null
  const canSubmit = enrolled && competition.submission_type === 'link' && competition.status === 'published'
  const open = competition.status === 'published' && new Date(competition.ends_at).getTime() > Date.now()

  async function enrol() {
    if (!competition) return
    setBusy(true)
    try {
      await memberApi.enroll(competition.id, mode)
      push({ tone: 'success', title: 'Entry confirmed', description: 'You can submit your work until the deadline.' })
      setEnrolOpen(false)
      reload()
    } catch (catchError) {
      push({
        tone: 'error',
        title: 'Enrolment failed',
        description: catchError instanceof ApiError ? catchError.message : 'Try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function submitEntry() {
    if (!competition) return
    if (!/^https?:\/\/.+/.test(submission.trim())) {
      setFormError('Enter a valid http(s) link to your submission.')
      return
    }
    setBusy(true)
    try {
      await memberApi.submitCompetition(competition.id, submission.trim())
      push({ tone: 'success', title: 'Submission recorded' })
      setSubmission('')
      setFormError('')
      setSubmitOpen(false)
      reload()
    } catch (catchError) {
      push({
        tone: 'error',
        title: 'Submission not recorded',
        description: catchError instanceof ApiError ? catchError.message : 'Try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Link
        to={`/member/competitions/${competition.frequency}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-brand-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All {competition.frequency} competitions
      </Link>

      <PageHeader
        title={competition.title}
        description={`${levelLabel(competition.level)}${competition.category ? ` · ${competition.category}` : ''}`}
        actions={
          <>
            {competition.leaderboard_available ? (
              <ButtonLink
                to={`/member/competitions/${competition.id}/leaderboard`}
                variant="outline"
                size="sm"
                iconLeft={<Medal className="h-3.5 w-3.5" />}
              >
                Leaderboard
              </ButtonLink>
            ) : null}
            <Button
              size="sm"
              onClick={() => setEnrolOpen(true)}
              disabled={!open || enrolled || !competition.eligibility.allowed}
              iconLeft={<Send className="h-3.5 w-3.5" />}
            >
              {enrolled ? 'Entered' : open ? 'Enter competition' : 'Closed'}
            </Button>
          </>
        }
        badge={<StatusBadge status={competition.status} />}
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr] xl:items-start">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Brief" />
            <CardBody>
              <p className="text-[0.875rem] leading-7 text-ink-600">
                {competition.description ?? 'The organiser has not added a brief for this competition.'}
              </p>
              <dl className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                {[
                  { label: 'Opens', value: formatDate(competition.starts_at) },
                  { label: 'Closes', value: formatDate(competition.ends_at) },
                  { label: 'Submission type', value: competition.submission_type },
                ].map((item) => (
                  <div key={item.label} className="bg-surface px-4 py-3">
                    <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">{item.label}</dt>
                    <dd className="mt-0.5 text-[0.8125rem] font-medium text-ink-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">Eligibility</p>
                <p className="mt-1 text-[0.8125rem] text-ink-600">
                  {competition.eligibility.allowed
                    ? 'You meet the eligibility rules for this competition.'
                    : competition.eligibility.reasons.join(' ') || 'You are not eligible for this competition.'}
                </p>
                {competition.allowed_years.length ? (
                  <p className="mt-1 text-[0.75rem] text-ink-500">Open to: {competition.allowed_years.join(', ')}</p>
                ) : null}
                {competition.requires_paid_membership ? (
                  <p className="mt-1 text-[0.75rem] text-ink-500">An active paid membership is required.</p>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Judging criteria" description="Published to members before submissions are scored." />
            {competition.criteria.length ? (
              <TableWrap>
                <THead>
                  <TR>
                    <TH>Criterion</TH>
                    <TH>Max points</TH>
                    <TH>Weight</TH>
                  </TR>
                </THead>
                <TBody>
                  {competition.criteria.map((criterion) => (
                    <TR key={criterion.id}>
                      <TD className="font-medium text-ink-900">{criterion.name}</TD>
                      <TD className="tabular">{criterion.max_points}</TD>
                      <TD className="tabular">{criterion.weight_percent}%</TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            ) : (
              <CardBody>
                <p className="text-[0.8125rem] text-ink-500">No criteria have been published for this competition.</p>
              </CardBody>
            )}
          </Card>

          <Card>
            <CardHeader title="Rewards" description="Awards recorded when results are finalized." />
            <CardBody>
              {competition.rewards.length ? (
                <div className="divide-y divide-line">
                  {competition.rewards.map((reward) => (
                    <div key={reward.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warning-soft text-warning">
                          <Trophy className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <p className="text-[0.8125rem] font-medium text-ink-900">
                          {reward.rank_from === reward.rank_to ? `Rank ${reward.rank_from}` : `Ranks ${reward.rank_from}–${reward.rank_to}`}
                        </p>
                      </div>
                      <p className="text-[0.75rem] text-ink-500">
                        {[reward.title, reward.description, reward.percent !== null ? `${reward.percent}%` : null].filter(Boolean).join(' · ') ||
                          'Club recognition'}
                      </p>
                      <span className="text-[0.75rem] font-semibold tabular text-brand-700">
                        {reward.points !== null ? `+${reward.points} pts` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[0.8125rem] text-ink-500">No rewards have been published for this competition.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your entry" />
            <CardBody className="space-y-3">
              {competition.submission ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-700" aria-hidden />
                    <p className="text-[0.8125rem] font-medium text-ink-900">Submission recorded</p>
                  </div>
                  <dl className="space-y-2 text-[0.75rem]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Status</dt>
                      <dd className="font-medium text-ink-900">{competition.submission.status}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Score</dt>
                      <dd className="font-medium tabular text-ink-900">{competition.submission.final_score ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Rank</dt>
                      <dd className="font-medium tabular text-ink-900">
                        {competition.submission.rank !== null ? `#${competition.submission.rank}` : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Points</dt>
                      <dd className="font-medium tabular text-brand-700">+{competition.submission.points_awarded}</dd>
                    </div>
                  </dl>
                  {competition.submission.value ? (
                    <a
                      href={competition.submission.value}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline"
                    >
                      Open submission
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : null}
                  {canSubmit ? (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setSubmitOpen(true)}>
                      Update submission
                    </Button>
                  ) : null}
                </>
              ) : canSubmit ? (
                <>
                  <p className="text-[0.8125rem] leading-6 text-ink-600">
                    Submit your {competition.submission_type} before the deadline. You can update your entry until judging begins.
                  </p>
                  <Button className="w-full" onClick={() => setSubmitOpen(true)} iconLeft={<Send className="h-3.5 w-3.5" />}>
                    Open submission form
                  </Button>
                </>
              ) : enrolled ? (
                <p className="text-[0.8125rem] leading-6 text-ink-600">
                  You are entered. Submissions open while the competition is published.
                </p>
              ) : (
                <>
                  <p className="text-[0.8125rem] leading-6 text-ink-600">
                    {open && competition.eligibility.allowed
                      ? 'Enter this competition to submit your work.'
                      : `This competition is ${statusText(competition.status).toLowerCase()}. New entries are not accepted.`}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!open || !competition.eligibility.allowed}
                    onClick={() => setEnrolOpen(true)}
                  >
                    {open ? 'Enter competition' : 'Entries closed'}
                  </Button>
                </>
              )}
            </CardBody>
          </Card>

          {competition.team ? (
            <Card>
              <CardHeader title="Team entry" />
              <CardBody>
                <p className="text-[0.8125rem] font-medium text-ink-900">{competition.team.name}</p>
                <p className="mt-0.5 text-[0.75rem] text-ink-500">
                  {competition.team.is_leader ? 'You lead this team.' : 'You are a member of this team.'}
                  {competition.team.enrolled ? ' The team is entered.' : ''}
                </p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardBody>
              <p className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-900">
                <Info className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                Submission rules
              </p>
              <ul className="mt-2 space-y-1.5 text-[0.75rem] leading-5 text-ink-500">
                <li>Only your own work. Credit any libraries or collaborators.</li>
                <li>Keep the repository or demo accessible to judges.</li>
                <li>Late entries are not accepted after the closing time.</li>
                <li>Judges' scores are final once results are published.</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      <Dialog open={enrolOpen} onOpenChange={setEnrolOpen}>
        <DialogContent
          title="Enter competition"
          description={`${competition.title} · closes ${formatDate(competition.ends_at)}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setEnrolOpen(false)}>
                Cancel
              </Button>
              <Button onClick={enrol} disabled={busy}>
                {busy ? 'Entering…' : 'Confirm entry'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Entry mode" htmlFor="entry-mode" hint="Team entries are submitted by the team leader.">
              <Select id="entry-mode" value={mode} onChange={(event) => setMode(event.target.value as 'individual' | 'team')}>
                <option value="individual">Individual</option>
                <option value="team" disabled={!competition.team}>
                  {competition.team ? `Team · ${competition.team.name}` : 'Team (you are not in a team)'}
                </option>
              </Select>
            </Field>
            <Alert tone="info" title="Eligibility">
              {competition.eligibility.allowed
                ? 'You meet the eligibility rules for this competition.'
                : competition.eligibility.reasons.join(' ') || 'You are not eligible for this competition.'}
            </Alert>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent
          title="Submit competition entry"
          description={`${competition.title} · closes ${formatDate(competition.ends_at)}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setSubmitOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitEntry} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit entry'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field
              label="Submission link"
              htmlFor="submission-link"
              required
              error={formError}
              hint="A public repository, demo or hosted file that judges can access."
            >
              <Input
                id="submission-link"
                type="url"
                value={submission}
                onChange={(event) => {
                  setSubmission(event.target.value)
                  if (formError) setFormError('')
                }}
                placeholder="https://github.com/username/project"
              />
            </Field>
            <Alert tone="info" title="Eligibility">
              {competition.eligibility.allowed
                ? 'Your entry will be visible to judges after you submit.'
                : competition.eligibility.reasons.join(' ') || 'You are not eligible for this competition.'}
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function CompetitionLeaderboard() {
  const { id } = useParams()
  const competitionId = Number(id)
  const { data, loading, error, reload } = useMemberData(
    () =>
      Promise.all([memberApi.competition(competitionId), memberApi.competitionLeaderboard(competitionId)]).then(
        ([competition, leaderboard]) => ({ competition, leaderboard }),
      ),
    [competitionId],
  )

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Leaderboard" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Competitions', to: '/member/competitions' }]} />
        <LoadingBlock rows={5} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Leaderboard" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Competitions', to: '/member/competitions' }]} />
        <ErrorBlock message={error ?? 'This leaderboard could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const { competition, leaderboard } = data

  return (
    <>
      <Link
        to={`/member/competitions/${competition.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-brand-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to competition
      </Link>
      <PageHeader
        title="Leaderboard"
        description={`${competition.title} · ${competition.status === 'finalized' ? 'Final results' : 'Live standings after judging'}`}
        badge={<StatusBadge status={competition.status} />}
        actions={
          <ButtonLink to={`/member/competitions/${competition.id}`} variant="outline" size="sm">
            View brief
          </ButtonLink>
        }
      />

      <Card>
        <CardHeader title="Individuals" />
        {leaderboard.individuals.length ? (
          <TableWrap>
            <THead>
              <TR>
                <TH className="w-[64px]">Rank</TH>
                <TH>Member</TH>
                <TH>Course</TH>
                <TH>Score</TH>
                <TH>Submitted</TH>
              </TR>
            </THead>
            <TBody>
              {leaderboard.individuals.map((entry) => (
                <TR key={`${entry.rank}-${entry.display_name}`} className={entry.is_winner ? 'bg-brand-50/50' : undefined}>
                  <TD>
                    <span
                      className={
                        entry.rank <= 3
                          ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-warning-soft text-[0.75rem] font-semibold tabular text-warning'
                          : 'inline-flex h-7 w-7 items-center justify-center text-[0.75rem] font-medium tabular text-ink-500'
                      }
                    >
                      {entry.rank}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-900">{entry.display_name}</span>
                      {entry.is_winner ? <Badge tone="green">Winner</Badge> : null}
                    </div>
                  </TD>
                  <TD className="text-ink-500">{[entry.course, entry.year].filter(Boolean).join(' · ') || '—'}</TD>
                  <TD className="font-semibold tabular text-ink-900">{entry.final_score ?? '—'}</TD>
                  <TD className="tabular text-ink-500">{entry.submitted_at ? formatDate(entry.submitted_at) : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        ) : (
          <div className="p-4">
            <EmptyState compact title="No individual results" description="Results appear once judging is complete." />
          </div>
        )}

        {leaderboard.teams.length ? (
          <>
            <CardHeader title="Teams" />
            <TableWrap>
              <THead>
                <TR>
                  <TH className="w-[64px]">Rank</TH>
                  <TH>Team</TH>
                  <TH>Members</TH>
                  <TH>Score</TH>
                </TR>
              </THead>
              <TBody>
                {leaderboard.teams.map((team) => (
                  <TR key={`${team.rank}-${team.display_name}`}>
                    <TD className="font-semibold tabular text-ink-700">#{team.rank}</TD>
                    <TD className="font-medium text-ink-900">{team.display_name}</TD>
                    <TD className="tabular">{team.members_count}</TD>
                    <TD className="font-semibold tabular text-ink-900">{team.final_score ?? '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
          </>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
          <p className="text-[0.6875rem] text-ink-400">Scores are weighted against the published criteria.</p>
          <p className="flex items-center gap-1 text-[0.6875rem] text-ink-400">
            <Clock className="h-3 w-3" aria-hidden />
            Updated after judging
          </p>
        </div>
      </Card>

      <div className="mt-4 flex justify-end">
        <ButtonLink
          to="/member/competitions/weekly"
          variant="ghost"
          size="sm"
          iconRight={<ExternalLink className="h-3.5 w-3.5" />}
        >
          All competitions
        </ButtonLink>
      </div>
    </>
  )
}

export default CompetitionList

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
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
import { demoCompetitions, demoLeaderboard, demoMember, DEMO_LABEL } from '../../data/demo'
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
  Textarea,
} from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'
import { PageNotFoundInline } from '../../components/site/primitives'

const levelLabel = (level: number) => (level === 1 ? 'Level 1 · Foundation' : level === 2 ? 'Level 2 · Intermediate' : 'Level 3 · Advanced')

export function CompetitionList({ frequency, embedded = false }: { frequency: 'weekly' | 'monthly'; embedded?: boolean }) {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const visible = demoCompetitions.filter((competition) => {
    if (competition.frequency !== frequency) return false
    if (competition.status === 'draft') return false
    if (status !== 'all' && competition.status !== status) return false
    if (search.trim() && !`${competition.title} ${competition.category}`.toLowerCase().includes(search.trim().toLowerCase())) return false
    return true
  })

  const other = frequency === 'weekly' ? 'monthly' : 'weekly'

  return (
    <>
      {embedded ? null : (
        <PageHeader
          title={frequency === 'weekly' ? 'Weekly competitions' : 'Monthly competitions'}
          description={
            frequency === 'weekly'
              ? 'Short, focused challenges that run each week. Entries are judged against published criteria.'
              : 'Larger builds that run across a month. Teams and individuals can enter.'
          }
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Competitions', to: '/member/competitions/weekly' }, { label: frequency === 'weekly' ? 'Weekly' : 'Monthly' }]}
          actions={
            <ButtonLink to={`/member/competitions/${other}`} variant="outline" size="sm">
              {other === 'weekly' ? 'Weekly competitions' : 'Monthly competitions'}
            </ButtonLink>
          }
        />
      )}

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
        <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full sm:w-[180px]" aria-label="Filter by status">
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
                    </div>
                    <p className="mt-0.5 text-[0.6875rem] text-ink-500">
                      {levelLabel(competition.level)} · {competition.category}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.625rem] text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden />
                        {formatDate(competition.startsAt)} – {formatDate(competition.endsAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" aria-hidden />
                        {competition.enrolled} enrolled
                      </span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800">
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Trophy className="h-4 w-4" aria-hidden />}
          title={frequency === 'monthly' ? 'No published monthly competition' : 'No competitions match these filters'}
          description={
            frequency === 'monthly'
              ? 'The next monthly build has not been published yet. Draft competitions are not visible to members.'
              : 'Try another status or clear the search to see every published challenge.'
          }
          action={
            status !== 'all' || search ? (
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
          { title: 'How judging works', text: 'Each competition publishes its criteria and weighting. Judges score submissions against those criteria.' },
          { title: 'Points and rewards', text: 'Winning entries can award club points, prizes and a place on the competition leaderboard.' },
          { title: 'Eligibility', text: 'Some levels are limited by year of study or require an active paid membership.' },
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
  const competition = demoCompetitions.find((item) => String(item.id) === id)
  const [open, setOpen] = useState(false)
  const [submission, setSubmission] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const { push } = useToast()

  if (!competition) {
    return <PageNotFoundInline title="Competition not found" description="This competition does not exist or is not published." />
  }

  const canSubmit = competition.status === 'published' && new Date(competition.endsAt).getTime() > Date.now()
  const myEntry = demoLeaderboard.find((entry) => entry.name === demoMember.name)

  return (
    <>
      <Link to={`/member/competitions/${competition.frequency}`} className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-brand-800">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All {competition.frequency} competitions
      </Link>

      <PageHeader
        title={competition.title}
        description={`${levelLabel(competition.level)} · ${competition.category}`}
        actions={
          <>
            <ButtonLink to={`/member/competitions/${competition.id}/leaderboard`} variant="outline" size="sm" iconLeft={<Medal className="h-3.5 w-3.5" />}>
              Leaderboard
            </ButtonLink>
            <Button size="sm" onClick={() => setOpen(true)} disabled={!canSubmit} iconLeft={<Send className="h-3.5 w-3.5" />}>
              {canSubmit ? 'Submit entry' : 'Closed'}
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
              <p className="text-[0.875rem] leading-7 text-ink-600">{competition.description}</p>
              <dl className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                {[
                  { label: 'Opens', value: formatDate(competition.startsAt) },
                  { label: 'Closes', value: formatDate(competition.endsAt) },
                  { label: 'Submission type', value: competition.submissionType },
                ].map((item) => (
                  <div key={item.label} className="bg-surface px-4 py-3">
                    <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">{item.label}</dt>
                    <dd className="mt-0.5 text-[0.8125rem] font-medium text-ink-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">Eligibility</p>
                <p className="mt-1 text-[0.8125rem] text-ink-600">{competition.eligibility}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Judging criteria" description="Published to members before submissions are scored." />
            <TableWrap>
              <THead>
                <TR>
                  <TH>Criterion</TH>
                  <TH>Max points</TH>
                  <TH>Weight</TH>
                  <TH>Visible</TH>
                </TR>
              </THead>
              <TBody>
                {competition.criteria.map((criterion) => (
                  <TR key={criterion.name}>
                    <TD className="font-medium text-ink-900">{criterion.name}</TD>
                    <TD className="tabular">{criterion.max}</TD>
                    <TD className="tabular">{criterion.weight}%</TD>
                    <TD>
                      <Badge tone={criterion.visible ? 'green' : 'outline'}>{criterion.visible ? 'Published' : 'Hidden'}</Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
          </Card>

          <Card>
            <CardHeader title="Rewards" description="Awards recorded when results are finalized." />
            <CardBody>
              <div className="divide-y divide-line">
                {competition.rewards.map((reward) => (
                  <div key={reward.rank} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warning-soft text-warning">
                        <Trophy className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <p className="text-[0.8125rem] font-medium text-ink-900">{reward.rank}</p>
                    </div>
                    <p className="text-[0.75rem] text-ink-500">{reward.prize}</p>
                    <span className="text-[0.75rem] font-semibold tabular text-brand-700">+{reward.points} pts</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {myEntry ? (
            <Alert tone="success" title={`Your result: rank #${myEntry.rank}`}>
              You scored {myEntry.score} points and earned {myEntry.points} club points. Your submission is {myEntry.status}.
            </Alert>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your entry" />
            <CardBody className="space-y-3">
              {myEntry ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-700" aria-hidden />
                    <p className="text-[0.8125rem] font-medium text-ink-900">Submission recorded</p>
                  </div>
                  <dl className="space-y-2 text-[0.75rem]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Status</dt>
                      <dd className="font-medium text-ink-900">{myEntry.status}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Score</dt>
                      <dd className="font-medium tabular text-ink-900">{myEntry.score}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Rank</dt>
                      <dd className="font-medium tabular text-ink-900">#{myEntry.rank}</dd>
                    </div>
                  </dl>
                  <ButtonLink to={`/member/competitions/${competition.id}/leaderboard`} variant="outline" size="sm" className="w-full">
                    View leaderboard
                  </ButtonLink>
                </>
              ) : canSubmit ? (
                <>
                  <p className="text-[0.8125rem] leading-6 text-ink-600">
                    Submit your {competition.submissionType.toLowerCase()} before the deadline. You can update your entry
                    until judging begins.
                  </p>
                  <Button className="w-full" onClick={() => setOpen(true)} iconLeft={<Send className="h-3.5 w-3.5" />}>
                    Open submission form
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-[0.8125rem] leading-6 text-ink-600">
                    This competition is {competition.status}. New entries are not accepted.
                  </p>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Submissions closed
                  </Button>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <dl className="space-y-2.5 text-[0.75rem]">
                {[
                  { label: 'Frequency', value: competition.frequency === 'weekly' ? 'Weekly' : 'Monthly' },
                  { label: 'Level', value: String(competition.level) },
                  { label: 'Enrolled', value: `${competition.enrolled} members` },
                  { label: 'Eligibility', value: competition.eligibility },
                  { label: 'Submission', value: competition.submissionType },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between gap-4">
                    <dt className="text-ink-500">{item.label}</dt>
                    <dd className="text-right font-medium text-ink-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Submit competition entry"
          description={`${competition.title} · closes ${formatDate(competition.endsAt)}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!/^https?:\/\/.+/.test(submission)) {
                    setError('Enter a valid http(s) link to your submission.')
                    return
                  }
                  setError('')
                  setOpen(false)
                  push({
                    tone: 'success',
                    title: 'Submission validated',
                  })
                  setSubmission('')
                  setNotes('')
                }}
              >
                Submit entry
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Submission link" htmlFor="submission-link" required error={error} hint="A public repository, demo or hosted file that judges can access.">
              <Input
                id="submission-link"
                type="url"
                value={submission}
                onChange={(event) => {
                  setSubmission(event.target.value)
                  if (error) setError('')
                }}
                placeholder="https://github.com/username/project"
              />
            </Field>
            <Field label="Notes for the judges" htmlFor="submission-notes" optional hint="Explain your approach, trade-offs and anything that needs context.">
              <Textarea id="submission-notes" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <Alert tone="info" title="Eligibility">
              You are submitting as {demoMember.name} ({demoMember.year}). Check that the level's eligibility rules include you
              before submitting.
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function CompetitionLeaderboard() {
  const { id } = useParams()
  const competition = demoCompetitions.find((item) => String(item.id) === id)
  if (!competition) {
    return <PageNotFoundInline title="Leaderboard not found" description="This competition does not exist or is not published." />
  }

  return (
    <>
      <Link to={`/member/competitions/${competition.id}`} className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-brand-800">
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
        <TableWrap>
          <THead>
            <TR>
              <TH className="w-[64px]">Rank</TH>
              <TH>Member</TH>
              <TH>Score</TH>
              <TH>Points awarded</TH>
              <TH>Time</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {demoLeaderboard.map((entry) => (
              <TR key={entry.rank} className={entry.name === demoMember.name ? 'bg-brand-50/50' : undefined}>
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
                    <span className="font-medium text-ink-900">{entry.name}</span>
                    {entry.name === demoMember.name ? <Badge tone="green">You</Badge> : null}
                    <Badge tone="outline">Level {entry.level}</Badge>
                  </div>
                </TD>
                <TD className="font-semibold tabular text-ink-900">{entry.score}</TD>
                <TD className="tabular text-brand-700">+{entry.points}</TD>
                <TD className="tabular text-ink-500">{entry.time}</TD>
                <TD>
                  <Badge tone={entry.status === 'reviewed' ? 'green' : 'amber'}>{entry.status}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
          <p className="text-[0.6875rem] text-ink-400">Scores are weighted against the published criteria.</p>
          <p className="flex items-center gap-1 text-[0.6875rem] text-ink-400">
            <Clock className="h-3 w-3" aria-hidden />
            Updated after judging
          </p>
        </div>
      </Card>

      <div className="mt-4 flex justify-end">
        <ButtonLink to="/member/competitions/weekly" variant="ghost" size="sm" iconRight={<ExternalLink className="h-3.5 w-3.5" />}>
          All competitions
        </ButtonLink>
      </div>
    </>
  )
}

export default CompetitionList

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Lock, ShieldCheck, Vote as VoteIcon } from 'lucide-react'
import { ApiError } from '../../lib/api'
import { memberApi, type ElectionDetail, type ElectionSummary } from '../../lib/memberApi'
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
  ConfirmDialog,
  EmptyState,
  Field,
  StatusBadge,
  Textarea,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { cn, formatDate } from '../../lib/utils'

function errorText(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function ElectionTimeline({ election }: { election: ElectionSummary }) {
  const steps = [
    {
      label: 'Applications',
      value: election.applications.open
        ? `${formatDate(election.applications.open)} – ${election.applications.close ? formatDate(election.applications.close) : '—'}`
        : 'Dates to be announced',
      done: election.phase !== 'applications' && election.phase !== 'draft',
    },
    {
      label: 'Voting opens',
      value: election.voting.open
        ? formatDate(election.voting.open, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Not scheduled',
      done: election.phase === 'voting' || election.phase === 'closed' || election.phase === 'results',
    },
    {
      label: 'Voting closes',
      value: election.voting.close
        ? formatDate(election.voting.close, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Not scheduled',
      done: election.phase === 'closed' || election.phase === 'results',
    },
    {
      label: 'Results',
      value: election.phase === 'results' ? 'Published' : 'Published by the electoral committee',
      done: election.phase === 'results',
    },
  ]

  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => (
        <li key={step.label} className="relative rounded-md border border-line bg-surface p-3.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[0.625rem] font-semibold',
                step.done ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-500',
              )}
            >
              {index + 1}
            </span>
            <p className="text-[0.75rem] font-semibold text-ink-900">{step.label}</p>
          </div>
          <p className="mt-1.5 text-[0.6875rem] leading-5 text-ink-500">{step.value}</p>
        </li>
      ))}
    </ol>
  )
}

export function MemberElections() {
  const { data, loading, error, reload } = useMemberData(() => memberApi.elections(), [])

  const header = (
    <PageHeader
      title="Leadership elections"
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections' }]}
      actions={
        <ButtonLink to="/elections" variant="outline" size="sm">
          Public election page
        </ButtonLink>
      }
    />
  )

  if (loading && !data) {
    return (
      <>
        {header}
        <LoadingBlock rows={3} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        {header}
        <ErrorBlock message={error ?? 'Elections could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const current = [...data.active, ...data.upcoming]

  return (
    <>
      {header}

      {current.length ? (
        <div className="space-y-4">
          {current.map((election) => (
            <div key={election.id} className="rounded-lg border border-line bg-surface">
              <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[1rem] font-semibold text-ink-950">{election.title}</h2>
                    <StatusBadge status={election.status} />
                    <Badge tone="outline">{election.phase}</Badge>
                  </div>
                  {election.eligibility_reason ? (
                    <p className="mt-1 max-w-[72ch] text-[0.8125rem] leading-6 text-ink-500">{election.eligibility_reason}</p>
                  ) : null}
                </div>
                {election.term ? <Badge tone="outline">Term {election.term}</Badge> : null}
              </div>
              <div className="p-4">
                <ElectionTimeline election={election} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
                <p className="text-[0.75rem] text-ink-500">
                  {election.positions_count} position{election.positions_count === 1 ? '' : 's'}
                  {election.voting.close
                    ? ` · voting closes ${formatDate(election.voting.close, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                    : ''}
                  {election.has_voted ? ' · you have voted' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink to={`/member/elections/${election.id}`} variant="outline" size="sm">
                    View positions
                  </ButtonLink>
                  {election.can_vote && !election.has_voted ? (
                    <ButtonLink
                      to={`/member/elections/${election.id}/vote`}
                      size="sm"
                      iconLeft={<VoteIcon className="h-3.5 w-3.5" />}
                    >
                      Cast your vote
                    </ButtonLink>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="p-4">
            <EmptyState
              icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
              title="No election is open"
              description="When the club opens a leadership election, its timeline and positions appear here."
              action={
                <ButtonLink to="/elections" variant="outline" size="sm">
                  Public election information
                </ButtonLink>
              }
            />
          </div>
        </Card>
      )}

      {data.past.length ? (
        <Card className="mt-4">
          <CardHeader title="Past elections" description="Archived elections and their certified results." />
          <ul className="divide-y divide-line">
            {data.past.map((election) => (
              <li key={election.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium text-ink-900">{election.title}</p>
                  <p className="text-[0.6875rem] text-ink-400">
                    {election.term ? `Term ${election.term} · ` : ''}
                    {election.positions_count} positions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={election.status} />
                  <Link
                    to={`/member/elections/${election.id}/results`}
                    className="text-[0.75rem] font-medium text-brand-800 hover:underline"
                  >
                    Results
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="mt-4 rounded-lg border border-line bg-canvas/50 p-4">
        <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-900">
          <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden />
          Eligibility
        </p>
        <p className="mt-1.5 text-[0.75rem] leading-6 text-ink-500">
          One ballot per eligible member; votes cannot be changed once submitted.
        </p>
        <Link to="/leaders" className="mt-2 inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline">
          About club leadership
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </>
  )
}

export function MemberElectionDetail() {
  const { id } = useParams()
  const electionId = Number(id)
  const { data: election, loading, error, reload } = useMemberData(() => memberApi.election(electionId), [electionId])

  if (loading && !election) {
    return (
      <>
        <PageHeader
          title="Election"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }]}
        />
        <LoadingBlock rows={3} />
      </>
    )
  }

  if (error || !election) {
    return (
      <>
        <PageHeader
          title="Election"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }]}
        />
        {error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : (
          <Card>
            <div className="p-4">
              <EmptyState
                title="This election is not available"
                description="It may have been archived. Open the elections page to see the current ballot."
                action={
                  <ButtonLink to="/member/elections" size="sm">
                    Back to elections
                  </ButtonLink>
                }
              />
            </div>
          </Card>
        )}
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={election.title}
        description={election.description ?? undefined}
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }, { label: 'Positions' }]}
        badge={<StatusBadge status={election.status} />}
        actions={
          election.can_vote && !election.has_voted ? (
            <ButtonLink to={`/member/elections/${election.id}/vote`} size="sm">
              Cast your vote
            </ButtonLink>
          ) : undefined
        }
      />

      {election.eligibility_reason ? (
        <Alert tone={election.can_vote ? 'info' : 'warning'} title="Eligibility">
          {election.eligibility_reason}
        </Alert>
      ) : null}

      <div className="mt-4">
        <ElectionTimeline election={election} />
      </div>

      <div className="mt-4 space-y-4">
        {election.positions.map((position) => (
          <section key={position.id} className="rounded-lg border border-line bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
              <div>
                <h2 className="text-[0.9375rem] font-semibold text-ink-950">{position.title}</h2>
                {position.description ? <p className="mt-0.5 text-[0.75rem] text-ink-500">{position.description}</p> : null}
              </div>
              <div className="text-right">
                <Badge tone="outline">
                  {position.seats} seat{position.seats === 1 ? '' : 's'}
                </Badge>
                <p className="mt-1 text-[0.6875rem] text-ink-400">
                  {position.candidates.length} candidate{position.candidates.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            {position.candidates.length ? (
              <ul className="divide-y divide-line">
                {position.candidates.map((candidate) => (
                  <li key={candidate.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] font-medium text-ink-900">
                        {candidate.display_name}
                        {position.my_candidacy && candidate.status !== 'withdrawn' && position.my_candidacy.status !== 'withdrawn' ? null : null}
                      </p>
                      <p className="text-[0.6875rem] text-ink-400">
                        {[candidate.course, candidate.year].filter(Boolean).join(' · ')}
                      </p>
                      {candidate.manifesto ? (
                        <p className="mt-1 max-w-[70ch] text-[0.75rem] leading-5 text-ink-500">{candidate.manifesto}</p>
                      ) : null}
                    </div>
                    {election.phase === 'results' ? (
                      <Badge tone="outline">{candidate.vote_count} votes</Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4">
                <EmptyState compact title="No candidates" description="No candidate has been approved for this position yet." />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
              <p className="text-[0.6875rem] text-ink-400">
                {position.voted ? 'You have voted for this position.' : 'Each position is elected separately.'}
              </p>
              {election.can_apply && !position.my_candidacy ? (
                <ButtonLink to={`/member/elections/${election.id}/apply/${position.id}`} variant="outline" size="sm">
                  Apply for this position
                </ButtonLink>
              ) : position.my_candidacy ? (
                <Badge tone={position.my_candidacy.status === 'approved' ? 'green' : 'amber'}>
                  Your application · {position.my_candidacy.status}
                </Badge>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-canvas/50 px-4 py-3">
        <p className="text-[0.75rem] text-ink-500">
          {election.voting.close ? `Voting closes ${formatDate(election.voting.close)}.` : 'Voting dates are not scheduled.'}
        </p>
        <ButtonLink to={`/member/elections/${election.id}/results`} variant="outline" size="sm">
          Results
        </ButtonLink>
      </div>
    </>
  )
}

export function ElectionApply() {
  const { id, positionId } = useParams()
  const electionId = Number(id)
  const navigate = useNavigate()
  const { push } = useToast()
  const { data: election, loading, error, reload } = useMemberData(() => memberApi.election(electionId), [electionId])
  const [manifesto, setManifesto] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ status: string } | null>(null)

  const position = election?.positions.find((entry) => String(entry.id) === positionId)

  if (loading && !election) {
    return (
      <>
        <PageHeader title="Apply" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }]} />
        <LoadingBlock rows={3} />
      </>
    )
  }

  if (error || !election) {
    return (
      <>
        <PageHeader title="Apply" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }]} />
        <ErrorBlock message={error ?? 'This election could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  if (!position) {
    return (
      <EmptyState
        title="Application unavailable"
        description="This position is not part of the current election."
        action={
          <ButtonLink to={`/member/elections/${election.id}`} size="sm">
            Back to election
          </ButtonLink>
        }
      />
    )
  }

  if (result) {
    return (
      <>
        <PageHeader
          title="Application submitted"
          breadcrumbs={[
            { label: 'Member', to: '/member' },
            { label: 'Elections', to: '/member/elections' },
            { label: 'Application' },
          ]}
        />
        <Card>
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-[1rem] font-semibold text-ink-950">Application recorded</h2>
            <p className="mt-1 max-w-[48ch] text-[0.8125rem] leading-6 text-ink-500">
              Your application for {position.title} is {result.status}. The electoral committee reviews candidacies before voting opens.
            </p>
            <div className="mt-5 flex gap-2">
              <Button size="sm" onClick={() => navigate(`/member/elections/${election.id}`)}>
                Back to election
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
        title={`Apply — ${position.title}`}
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }, { label: position.title }]}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Your application" description={`Election: ${election.title}`} />
          <form
            className="space-y-4 p-4"
            onSubmit={async (event) => {
              event.preventDefault()
              if (manifesto.trim().length < 40) {
                setFormError('Write at least 40 characters describing what you would do in this role.')
                return
              }
              setFormError('')
              setSubmitting(true)
              try {
                const applied = await memberApi.applyForPosition(election.id, position.id, manifesto.trim(), 'submit')
                setResult({ status: applied.status })
                push({ tone: 'success', title: 'Application submitted' })
              } catch (catchError) {
                push({
                  tone: 'error',
                  title: 'Application not submitted',
                  description: errorText(catchError, 'Try again.'),
                })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            <Field label="Position" htmlFor="position">
              <Textarea id="position" value={position.title} readOnly rows={1} className="resize-none bg-ink-50/60" />
            </Field>
            <Field
              label="Manifesto"
              htmlFor="manifesto"
              required
              hint="What would you change, and how would members hold you to it?"
              error={formError}
            >
              <Textarea
                id="manifesto"
                rows={7}
                value={manifesto}
                onChange={(event) => setManifesto(event.target.value)}
                placeholder="Describe your plans for the role…"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
              <ButtonLink to={`/member/elections/${election.id}`} variant="ghost" size="sm">
                Cancel
              </ButtonLink>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Alert tone={election.can_apply ? 'info' : 'warning'} title={election.can_apply ? 'Applications are open' : 'Applications are closed'}>
            {election.can_apply
              ? `Applications close ${election.applications.close ? formatDate(election.applications.close) : 'when the committee closes them'}.`
              : 'You can only apply while the application window is open.'}
          </Alert>
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="text-[0.8125rem] font-semibold text-ink-900">Election rules</p>
            <ul className="mt-2 space-y-1.5 text-[0.75rem] leading-5 text-ink-500">
              <li>• Candidates must be approved members with an active membership.</li>
              <li>• Campaigning happens through club channels only.</li>
              <li>• The electoral committee reviews eligibility before voting opens.</li>
              <li>• Candidates may withdraw before voting begins.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

export function ElectionVote() {
  const { id } = useParams()
  const electionId = Number(id)
  const navigate = useNavigate()
  const { push } = useToast()
  const { data: election, loading, error, reload } = useMemberData(() => memberApi.election(electionId), [electionId])
  const [selections, setSelections] = useState<Record<number, number | null>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading && !election) {
    return (
      <>
        <PageHeader
          title="Cast your vote"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }]}
        />
        <LoadingBlock rows={4} />
      </>
    )
  }

  if (error || !election) {
    return (
      <>
        <PageHeader
          title="Cast your vote"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }]}
        />
        <ErrorBlock message={error ?? 'This election could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const positions = election.positions
  const completed = positions.filter((position) => position.id in selections).length

  async function submitBallot() {
    if (!election) return
    setSubmitting(true)
    try {
      const votes = positions
        .filter((position) => selections[position.id] !== null && selections[position.id] !== undefined)
        .map((position) => ({ position_id: position.id, candidate_id: selections[position.id] as number }))
      const result = await memberApi.vote(election.id, votes)
      push({ tone: 'success', title: 'Ballot submitted', description: `Receipt ${result.receipt}` })
      navigate(`/member/elections/${election.id}/results`)
    } catch (catchError) {
      push({ tone: 'error', title: 'Ballot not submitted', description: errorText(catchError, 'Try again.') })
    } finally {
      setSubmitting(false)
    }
  }

  if (election.has_voted) {
    return (
      <>
        <PageHeader
          title="Ballot already submitted"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }, { label: 'Vote' }]}
        />
        <Card>
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-[1rem] font-semibold text-ink-950">Your vote is recorded</h2>
            <p className="mt-1 max-w-[48ch] text-[0.8125rem] leading-6 text-ink-500">
              One ballot per member. Ballots cannot be edited or withdrawn after submission.
            </p>
            <div className="mt-5 flex gap-2">
              <ButtonLink to={`/member/elections/${election.id}/results`} size="sm">
                Results
              </ButtonLink>
              <ButtonLink to={`/member/elections/${election.id}`} variant="outline" size="sm">
                Back to election
              </ButtonLink>
            </div>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Cast your vote"
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }, { label: 'Vote' }]}
        actions={<Badge tone="green">Voting open</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (completed < positions.length) {
              setFormError('Choose a candidate or abstain for every position before submitting.')
              return
            }
            setFormError('')
            setConfirmOpen(true)
          }}
        >
          {positions.map((position) => (
            <fieldset key={position.id} className="rounded-lg border border-line bg-surface">
              <legend className="sr-only">{position.title}</legend>
              <div className="border-b border-line px-4 py-3">
                <p className="text-[0.875rem] font-semibold text-ink-950">{position.title}</p>
                {position.description ? <p className="mt-0.5 text-[0.75rem] text-ink-500">{position.description}</p> : null}
              </div>
              <div className="space-y-2 p-4">
                {position.voted ? (
                  <p className="text-[0.75rem] text-ink-500">You have already voted for this position.</p>
                ) : position.candidates.length ? (
                  <>
                    {position.candidates.map((candidate) => {
                      const selected = selections[position.id] === candidate.id
                      return (
                        <label
                          key={candidate.id}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-[0.8125rem] transition-colors',
                            selected ? 'border-brand-600 bg-brand-50/60' : 'border-ink-200 bg-surface hover:bg-ink-50/50',
                          )}
                        >
                          <input
                            type="radio"
                            name={`position-${position.id}`}
                            checked={selected}
                            onChange={() => setSelections((current) => ({ ...current, [position.id]: candidate.id }))}
                            className="mt-0.5 h-4 w-4 accent-brand-700"
                          />
                          <span>
                            <span className={cn('block', selected ? 'font-medium text-ink-950' : 'text-ink-800')}>
                              {candidate.display_name}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] text-ink-500">
                              {[candidate.course, candidate.year].filter(Boolean).join(' · ')}
                            </span>
                            {candidate.manifesto ? (
                              <span className="mt-1 block text-[0.75rem] leading-5 text-ink-500">{candidate.manifesto}</span>
                            ) : null}
                          </span>
                        </label>
                      )
                    })}
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-[0.8125rem] transition-colors',
                        selections[position.id] === null
                          ? 'border-brand-600 bg-brand-50/60'
                          : 'border-ink-200 bg-surface hover:bg-ink-50/50',
                      )}
                    >
                      <input
                        type="radio"
                        name={`position-${position.id}`}
                        checked={selections[position.id] === null}
                        onChange={() => setSelections((current) => ({ ...current, [position.id]: null }))}
                        className="mt-0.5 h-4 w-4 accent-brand-700"
                      />
                      <span>
                        <span className="block text-ink-800">Abstain</span>
                        <span className="mt-0.5 block text-[0.6875rem] text-ink-500">
                          Do not cast a vote for this position.
                        </span>
                      </span>
                    </label>
                  </>
                ) : (
                  <p className="text-[0.75rem] text-ink-500">No candidate has been approved for this position.</p>
                )}
              </div>
            </fieldset>
          ))}

          {formError ? (
            <Alert tone="danger" title="Ballot incomplete">
              {formError}
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
            <p className="text-[0.75rem] text-ink-500">
              {completed} of {positions.length} positions completed
            </p>
            <Button type="submit" size="md" disabled={submitting} iconLeft={<VoteIcon className="h-4 w-4" />}>
              {submitting ? 'Submitting…' : 'Review and submit'}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <Alert tone="info" title="Secret ballot">
            Votes are recorded without showing how each member voted. Election results are published by the electoral committee after
            voting closes.
          </Alert>
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="text-[0.8125rem] font-semibold text-ink-900">Before you submit</p>
            <ul className="mt-2 space-y-1.5 text-[0.75rem] leading-5 text-ink-500">
              <li>• Read each manifesto before choosing.</li>
              <li>• You can abstain on any position.</li>
              <li>• One ballot per eligible member.</li>
              <li>• Ballots cannot be edited after submission.</li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit your ballot?"
        description="You cannot change or withdraw your ballot after submitting."
        confirmLabel={submitting ? 'Submitting…' : 'Submit ballot'}
        destructive={false}
        onConfirm={() => {
          setConfirmOpen(false)
          void submitBallot()
        }}
      />
    </>
  )
}

export function ElectionResults() {
  const { id } = useParams()
  const electionId = Number(id)
  const { data, loading, error, reload } = useMemberData(() => memberApi.electionResults(electionId), [electionId])

  const header = (
    <PageHeader
      title="Election results"
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }, { label: 'Results' }]}
      actions={
        <ButtonLink to={`/member/elections/${electionId}`} variant="outline" size="sm">
          Back to election
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
        <Card>
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-500">
              <Lock className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-[1rem] font-semibold text-ink-950">Results are not published yet</h2>
            <p className="mt-1 max-w-[54ch] text-[0.8125rem] leading-6 text-ink-500">
              {error ?? 'The electoral committee has not published certified results for this election.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <ButtonLink to={`/member/elections/${electionId}`} variant="outline" size="sm">
                Back to election
              </ButtonLink>
              <Button
                variant="ghost"
                size="sm"
                onClick={reload}
              >
                Check again
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
        title="Election results"
        description={data.election.title}
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }, { label: 'Results' }]}
        badge={<StatusBadge status={data.election.status} />}
        actions={
          <ButtonLink to={`/member/elections/${electionId}`} variant="outline" size="sm">
            Back to election
          </ButtonLink>
        }
      />

      <div className="space-y-4">
        {data.positions.map((position) => (
          <Card key={position.id}>
            <CardHeader title={position.title} description="Votes recorded for each candidate." />
            {position.candidates.length ? (
              <ul className="divide-y divide-line">
                {position.candidates.map((candidate) => (
                  <li key={candidate.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[0.8125rem] font-medium text-ink-900">{candidate.display_name}</p>
                      {candidate.is_winner ? <Badge tone="green">Elected</Badge> : null}
                      <Badge tone="outline">{candidate.status}</Badge>
                    </div>
                    <p className="text-[0.8125rem] font-semibold tabular text-ink-900">{candidate.vote_count} votes</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4">
                <EmptyState compact title="No results" description="No votes were recorded for this position." />
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-900">
            <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden />
            How results are certified
          </p>
          <ol className="mt-2 space-y-1.5 text-[0.75rem] leading-5 text-ink-500">
            <li>1. Voting closes and the ballot is locked.</li>
            <li>2. The committee reviews turnout and any reported issues.</li>
            <li>3. Results are published per position with vote counts.</li>
            <li>4. Outgoing leaders mentor incoming leaders during handover.</li>
          </ol>
        </div>
        <div className="rounded-lg border border-line bg-canvas/50 p-4">
          <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-900">
            <Info className="h-4 w-4 text-ink-500" aria-hidden />
            Your ballot
          </p>
          <p className="mt-2 text-[0.75rem] leading-5 text-ink-500">
            Ballots are secret. This page never shows how you or anyone else voted.
          </p>
        </div>
      </div>
    </>
  )
}

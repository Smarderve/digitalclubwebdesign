import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Lock, ShieldCheck, Vote as VoteIcon } from 'lucide-react'
import { demoElection } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, EmptyState, Field, RadioCard, StatusBadge, Textarea } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { cn, formatDate } from '../../lib/utils'

const election = demoElection

function ElectionTimeline() {
  const steps = [
    { label: 'Applications', value: `${formatDate(election.applicationsOpen)} – ${formatDate(election.applicationsClose)}`, done: true },
    { label: 'Voting opens', value: formatDate(election.votingOpen, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), done: true },
    { label: 'Voting closes', value: formatDate(election.votingClose, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), done: false },
    { label: 'Results', value: 'Published by the electoral committee', done: false },
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
  return (
    <>
      <PageHeader
        title="Leadership elections"
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections' }]}
        actions={<ButtonLink to="/elections" variant="outline" size="sm">Public election page</ButtonLink>}
      />

      <div className="rounded-lg border border-line bg-surface">
        <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[1rem] font-semibold text-ink-950">{election.title}</h2>
              <StatusBadge status={election.status} />
            </div>
            <p className="mt-1 max-w-[72ch] text-[0.8125rem] leading-6 text-ink-500">{election.description}</p>
          </div>
          <Badge tone="outline">Term {election.term}</Badge>
        </div>
        <div className="p-4">
          <ElectionTimeline />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
          <p className="text-[0.75rem] text-ink-500">
            Voting is open · {election.positions.length} positions · closes {formatDate(election.votingClose, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={`/member/elections/${election.id}`} variant="outline" size="sm">View positions</ButtonLink>
            <ButtonLink to={`/member/elections/${election.id}/vote`} size="sm" iconLeft={<VoteIcon className="h-3.5 w-3.5" />}>Cast your vote</ButtonLink>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Positions on the ballot" description="Each position is elected separately." action={<Badge tone="outline">{election.positions.length} positions</Badge>} />
          <ul className="divide-y divide-line">
            {election.positions.map((position) => (
              <li key={position.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium text-ink-900">{position.title}</p>
                  <p className="mt-0.5 text-[0.75rem] leading-5 text-ink-500">{position.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.6875rem] text-ink-400">{position.candidates.length} candidate{position.candidates.length === 1 ? '' : 's'}</p>
                  <p className="text-[0.6875rem] text-ink-400">{position.seats} seat{position.seats === 1 ? '' : 's'}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your candidacy" description="Application submitted for this election" />
            <div className="px-4 pb-4">
              {election.myCandidateApplication ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.8125rem] font-medium text-ink-900">
                        {election.positions.find((position) => position.id === election.myCandidateApplication?.positionId)?.title}
                      </p>
                      <p className="text-[0.6875rem] text-ink-400">Submitted {formatDate(election.myCandidateApplication.submitted)}</p>
                    </div>
                    <Badge tone="green">{election.myCandidateApplication.status}</Badge>
                  </div>
                  <p className="mt-3 text-[0.75rem] leading-5 text-ink-500">
                    Applications have closed. Your candidacy is approved and appears on the ballot. Campaign material must follow the club's
                    election rules.
                  </p>
                </>
              ) : (
                <EmptyState compact title="No candidacy submitted" description="You did not apply for a position in this election." />
              )}
            </div>
          </Card>

          <div className="rounded-lg border border-line bg-canvas/50 p-4">
            <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-900">
              <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden />
              Eligibility
            </p>
            <p className="mt-1.5 text-[0.75rem] leading-6 text-ink-500">{election.eligibility}. One ballot per member; votes cannot be changed once
              submitted.</p>
            <Link to="/leaders" className="mt-2 inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline">
              About club leadership
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export function MemberElectionDetail() {
  const { id } = useParams()
  if (String(election.id) !== id) {
    return (
      <>
        <PageHeader title="Election not found" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }]} />
        <Card><div className="p-4"><EmptyState title="This election is not available" description="It may have been archived. Open the elections page to see the current ballot." action={<ButtonLink to="/member/elections" size="sm">Back to elections</ButtonLink>} /></div></Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={election.title}
        description={election.description}
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }, { label: 'Positions' }]}
        badge={<StatusBadge status={election.status} />}
        actions={<ButtonLink to={`/member/elections/${election.id}/vote`} size="sm">Cast your vote</ButtonLink>}
      />

      <div className="space-y-4">
        {election.positions.map((position) => (
          <section key={position.id} className="rounded-lg border border-line bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
              <div>
                <h2 className="text-[0.9375rem] font-semibold text-ink-950">{position.title}</h2>
                <p className="mt-0.5 text-[0.75rem] text-ink-500">{position.description}</p>
              </div>
              <div className="text-right">
                <Badge tone="outline">{position.seats} seat{position.seats === 1 ? '' : 's'}</Badge>
                <p className="mt-1 text-[0.6875rem] text-ink-400">{position.candidates.length} candidate{position.candidates.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <ul className="divide-y divide-line">
              {position.candidates.map((candidate) => (
                <li key={candidate.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] font-medium text-ink-900">
                      {candidate.name}
                      {candidate.name === 'Amina Juma' ? <Badge tone="green" className="ml-2">You</Badge> : null}
                    </p>
                    <p className="text-[0.6875rem] text-ink-400">{candidate.year}</p>
                    <p className="mt-1 max-w-[70ch] text-[0.75rem] leading-5 text-ink-500">{candidate.manifesto}</p>
                  </div>
                  {candidate.name === 'Amina Juma' ? (
                    <Link to={`/member/elections/${election.id}/apply/${position.id}`} className="shrink-0 text-[0.75rem] font-medium text-brand-800 hover:underline">
                      View application
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-canvas/50 px-4 py-3">
        <p className="text-[0.75rem] text-ink-500">Applications are closed. Voting closes {formatDate(election.votingClose)}.</p>
        <ButtonLink to={`/member/elections/${election.id}/results`} variant="outline" size="sm">Results</ButtonLink>
      </div>
    </>
  )
}

export function ElectionApply() {
  const { id, positionId } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()
  const position = election.positions.find((entry) => String(entry.id) === positionId)
  const [manifesto, setManifesto] = useState('')
  const [experience, setExperience] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!position || String(election.id) !== id) {
    return <EmptyState title="Application unavailable" description="This position is not part of the current election." />
  }

  if (submitted) {
    return (
      <>
        <PageHeader title="Application submitted" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }, { label: 'Application' }]} />
        <Card>
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700"><CheckCircle2 className="h-5 w-5" aria-hidden /></span>
            <h2 className="mt-3 text-[1rem] font-semibold text-ink-950">Application captured</h2>
            <p className="mt-1 max-w-[48ch] text-[0.8125rem] leading-6 text-ink-500">
              Nothing was sent to the electoral committee and no candidate record was created. In the live site your application would wait for
              committee review.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>Edit application</Button>
              <Button size="sm" onClick={() => navigate(`/member/elections/${election.id}`)}>Back to election</Button>
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
            onSubmit={(event) => {
              event.preventDefault()
              if (manifesto.trim().length < 40) {
                setError('Write at least 40 characters describing what you would do in this role.')
                return
              }
              setError('')
              setSubmitted(true)
              push({ tone: 'success', title: 'Application submitted' })
            }}
          >
            <Field label="Position" htmlFor="position">
              <Textarea id="position" value={position.title} readOnly rows={1} className="resize-none bg-ink-50/60" />
            </Field>
            <Field label="Manifesto" htmlFor="manifesto" required hint="What would you change, and how would members hold you to it?" error={error}>
              <Textarea id="manifesto" rows={7} value={manifesto} onChange={(event) => setManifesto(event.target.value)} placeholder="Describe your plans for the role…" />
            </Field>
            <Field label="Relevant experience" htmlFor="experience" hint="Optional. Club roles, teams, projects or sessions you have led.">
              <Textarea id="experience" rows={4} value={experience} onChange={(event) => setExperience(event.target.value)} placeholder="Optional…" />
            </Field>
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button type="submit" size="sm">Submit application</Button>
              <ButtonLink to={`/member/elections/${election.id}`} variant="ghost" size="sm">Cancel</ButtonLink>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Alert tone="warning" title="Applications are closed">
            The application window closed on {formatDate(election.applicationsClose)}. This form demonstrates how the application screen behaved
            while it was open; submitting it does not create a candidacy.
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
          <div className="rounded-lg border border-line bg-canvas/50 p-4">
            <p className="text-[0.75rem] leading-6 text-ink-500">Questions about eligibility? Contact the electoral committee through the club email.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export function ElectionVote() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { push } = useToast()
  const [selections, setSelections] = useState<Record<number, string>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState('')

  if (String(election.id) !== id) return <EmptyState title="Election unavailable" description="This election is not current." />

  const completed = Object.keys(selections).length

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
            if (completed < election.positions.length) {
              setError('Choose a candidate or abstain for every position before submitting.')
              return
            }
            setError('')
            setConfirmOpen(true)
          }}
        >
          {election.positions.map((position) => (
            <fieldset key={position.id} className="rounded-lg border border-line bg-surface">
              <legend className="sr-only">{position.title}</legend>
              <div className="border-b border-line px-4 py-3">
                <p className="text-[0.875rem] font-semibold text-ink-950">{position.title}</p>
                <p className="mt-0.5 text-[0.75rem] text-ink-500">{position.description}</p>
              </div>
              <div className="space-y-2 p-4">
                {position.candidates.map((candidate) => (
                  <RadioCard
                    key={candidate.id}
                    name={`position-${position.id}`}
                    value={String(candidate.id)}
                    checked={selections[position.id] === String(candidate.id)}
                    onChange={() => setSelections((current) => ({ ...current, [position.id]: String(candidate.id) }))}
                    label={candidate.name}
                    description={`${candidate.year} · ${candidate.manifesto}`}
                  />
                ))}
                <RadioCard
                  name={`position-${position.id}`}
                  value="abstain"
                  checked={selections[position.id] === 'abstain'}
                  onChange={() => setSelections((current) => ({ ...current, [position.id]: 'abstain' }))}
                  label="Abstain"
                  description="Do not cast a vote for this position."
                />
              </div>
            </fieldset>
          ))}

          {error ? <Alert tone="danger" title="Ballot incomplete">{error}</Alert> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
            <p className="text-[0.75rem] text-ink-500">{completed} of {election.positions.length} positions completed</p>
            <Button type="submit" size="md" iconLeft={<VoteIcon className="h-4 w-4" />}>Review and submit</Button>
          </div>
        </form>

        <div className="space-y-4">
          <Alert tone="info" title="Secret ballot">
            Votes are recorded without showing how each member voted. Election results are published by the electoral committee after voting
            closes.
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
          <div className="rounded-lg border border-line bg-canvas/50 p-4">
            <p className="text-[0.75rem] leading-6 text-ink-500">
              Results are published after the electoral committee verifies the count.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit your ballot?"
        description="You cannot change or withdraw your ballot after submitting."
        confirmLabel="Submit ballot"
        destructive={false}
        onConfirm={() => {
          push({ tone: 'success', title: 'Ballot submitted' })
          navigate(`/member/elections/${election.id}/results`)
        }}
      />
    </>
  )
}

export function ElectionResults() {
  const { id } = useParams()
  if (String(election.id) !== id) return <EmptyState title="Results unavailable" description="This election is not current." />

  return (
    <>
      <PageHeader
        title="Election results"
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Elections', to: '/member/elections' }, { label: 'Results' }]}
        actions={<ButtonLink to={`/member/elections/${election.id}`} variant="outline" size="sm">Back to election</ButtonLink>}
      />

      <Card>
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-500"><Lock className="h-5 w-5" aria-hidden /></span>
          <h2 className="mt-3 text-[1rem] font-semibold text-ink-950">Results are not published yet</h2>
          <p className="mt-1 max-w-[54ch] text-[0.8125rem] leading-6 text-ink-500">
            Voting is open until {formatDate(election.votingClose, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. The
            committee will publish certified results here after the ballot closes.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <ButtonLink to={`/member/elections/${election.id}/vote`} size="sm">Cast your vote</ButtonLink>
            <ButtonLink to="/elections" variant="outline" size="sm">Public election information</ButtonLink>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-900"><ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden />How results are certified</p>
          <ol className="mt-2 space-y-1.5 text-[0.75rem] leading-5 text-ink-500">
            <li>1. Voting closes and the ballot is locked.</li>
            <li>2. The committee reviews turnout and any reported issues.</li>
            <li>3. Results are published per position with vote counts.</li>
            <li>4. Outgoing leaders mentor incoming leaders during handover.</li>
          </ol>
        </div>
        <div className="rounded-lg border border-line bg-canvas/50 p-4">
          <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-900"><Info className="h-4 w-4 text-ink-500" aria-hidden />Your ballot</p>
          <p className="mt-2 text-[0.75rem] leading-5 text-ink-500">
            Ballots are secret. This page never shows how you or anyone else voted.
          </p>
        </div>
      </div>
    </>
  )
}

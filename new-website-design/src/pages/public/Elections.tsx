import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, CheckCircle2, FileCheck2, ShieldCheck, Vote } from 'lucide-react'
import { LEADERS, LEADERSHIP_STRUCTURE } from '../../data/site'
import { demoElection } from '../../data/demo'
import { PageNotFoundInline, SectionHead } from '../../components/site/primitives'
import { PageHero, media } from '../../components/site/hero'
import { Alert, Badge, EmptyState, StatusBadge, SampleNote } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { formatDate } from '../../lib/utils'
import { LeaderCard } from '../../components/site/cards'

const electionsHero = media(
  '/images/collaboration/study-group',
  'A group of students collaborating around a laptop',
  'Stock photograph · Pexels. Not a KIUT Digital Club election.',
)

const phases = [
  { title: 'Nominations', description: 'Members apply for published positions with a manifesto and passport photograph.', icon: FileCheck2 },
  { title: 'Screening', description: 'The electoral committee reviews eligibility and approves or rejects each application.', icon: ShieldCheck },
  { title: 'Voting', description: 'Eligible members cast one vote per position during the published voting window.', icon: Vote },
  { title: 'Results', description: 'Votes are counted, winners are recorded and the new leadership team is announced.', icon: CheckCircle2 },
]

export function Elections() {
  return (
    <>
      <PageHero
        eyebrow="Club elections"
        title="Leadership elections"
        description="Digital Club leadership is elected democratically by members each year. Public pages show the election timeline and candidate records once the club releases them."
        media={electionsHero}
        aside={
          <div className="rounded-lg border border-line bg-canvas p-4 lg:max-w-[320px]">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Current status</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              No public election is currently published. Sign in to see elections you are eligible for.
            </p>
            <div className="mt-3">
              <ButtonLink to="/auth/login" variant="outline" size="sm">
                Member sign in
              </ButtonLink>
            </div>
          </div>
        }
      />

      <section className="section border-b border-line" data-reveal>
        <div className="container-editorial">
          <SectionHead eyebrow="Process" title="Four phases, one transparent record" />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((phase, index) => {
              const Icon = phase.icon
              return (
                <div key={phase.title} className="bg-white p-5">
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-brand-700" aria-hidden />
                    <span className="font-mono text-[0.625rem] text-ink-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-950">{phase.title}</h3>
                  <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{phase.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <SectionHead eyebrow="Published elections" title="Election records" />
          <div className="mt-6">
            <EmptyState
              icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
              title="No public elections published"
              description="Election records are created by the club administration. Draft and cancelled elections are not public. When an election is published, its timeline and approved candidates appear here."
              action={
                <ButtonLink to="/leaders" variant="outline" size="sm">
                  Meet the current leadership
                </ButtonLink>
              }
            />
          </div>
        </div>
      </section>

      <section className="section border-b border-line">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Leadership structure"
            title="What members are electing"
            description="Positions follow the club's leadership structure and are configured per election."
          />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {LEADERSHIP_STRUCTURE.map((item) => (
              <div key={item.title} className="bg-white p-5">
                <p className="text-[0.9375rem] font-semibold text-ink-950">{item.title}</p>
                <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {LEADERS.slice(0, 4).map((leader) => (
              <LeaderCard key={leader.name} name={leader.name} position={leader.position} programme={leader.programme} year={leader.year} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-editorial flex flex-col items-start justify-between gap-4 rounded-lg border border-line bg-white p-6 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Want to lead?</p>
            <h2 className="mt-2 text-h2 text-ink-950">Develop leadership skills and shape technology education at KIUT.</h2>
            <p className="mt-2 max-w-[64ch] text-[0.8125rem] leading-6 text-ink-500">
              Every position is elected annually. New leaders receive mentorship from outgoing executives.
            </p>
          </div>
          <ButtonLink to="/auth/register" className="shrink-0">
            Join the club
          </ButtonLink>
        </div>
      </section>
    </>
  )
}

export function ElectionDetail() {
  const { id } = useParams()
  if (id !== String(demoElection.id)) {
    return (
      <PageNotFoundInline
        title="Election not found"
        description="This election record does not exist or is not publicly published."
      />
    )
  }

  return (
    <div className="bg-canvas/40">
      <div className="container-editorial py-8 lg:py-10">
        <Link to="/elections" className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-brand-800">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All elections
        </Link>

        <Alert tone="info" title="Sample election record" className="mt-4">
          Public election records were not available in the supplied content. This page uses a clearly labelled sample
          election to demonstrate the public record layout; it is not a real KIUT Digital Club election.
        </Alert>

        <div className="mt-6 rounded-lg border border-line bg-white">
          <div className="border-b border-line p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={demoElection.status} />
              <Badge tone="outline">Term {demoElection.term}</Badge>
              <Badge tone="sample">Demonstration</Badge>
            </div>
            <h1 className="mt-3 text-h1 text-ink-950">{demoElection.title}</h1>
            <p className="mt-2 max-w-[76ch] text-[0.9375rem] leading-7 text-ink-600">{demoElection.description}</p>
            <dl className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
              <div>
                <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">Applications</dt>
                <dd className="mt-0.5 text-[0.8125rem] text-ink-900">
                  {formatDate(demoElection.applicationsOpen)} – {formatDate(demoElection.applicationsClose)}
                </dd>
              </div>
              <div>
                <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">Voting</dt>
                <dd className="mt-0.5 text-[0.8125rem] text-ink-900">
                  {formatDate(demoElection.votingOpen)} – {formatDate(demoElection.votingClose)}
                </dd>
              </div>
              <div>
                <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">Eligibility</dt>
                <dd className="mt-0.5 text-[0.8125rem] text-ink-900">{demoElection.eligibility}</dd>
              </div>
            </dl>
          </div>

          <div className="p-6">
            <h2 className="text-h3 text-ink-950">Positions and candidates</h2>
            <div className="mt-4 space-y-4">
              {demoElection.positions.map((position) => (
                <section key={position.id} className="rounded-md border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-[0.9375rem] font-semibold text-ink-950">{position.title}</h3>
                      <p className="text-[0.75rem] text-ink-500">
                        {position.seats} {position.seats === 1 ? 'seat' : 'seats'} · {position.description}
                      </p>
                    </div>
                    <Badge tone="neutral">{position.candidates.length} approved</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {position.candidates.map((candidate) => (
                      <div key={candidate.id} className="rounded-sm bg-ink-50/70 p-3">
                        <p className="text-[0.8125rem] font-semibold text-ink-900">{candidate.name}</p>
                        <p className="text-[0.6875rem] text-ink-500">{candidate.year}</p>
                        <p className="mt-1.5 text-[0.75rem] leading-5 text-ink-600">“{candidate.manifesto}”</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <SampleNote>Sample candidates and manifestos are for layout review only.</SampleNote>
              <ButtonLink to="/member/elections/1/vote" size="sm" variant="outline">
                Open member voting screen
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Elections

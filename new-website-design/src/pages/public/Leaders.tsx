import { useMemo, useState } from 'react'
import { Search, ShieldCheck, Users } from 'lucide-react'
import { LEADERS, LEADERSHIP_STRUCTURE } from '../../data/site'
import { JoinBand, SectionHead } from '../../components/site/primitives'
import { PageHero, media } from '../../components/site/hero'
import { Badge, EmptyState } from '../../components/ui'
import { Input } from '../../components/ui/field'
import { Button } from '../../components/ui/button'
import { LeaderCard } from '../../components/site/cards'
import { cn } from '../../lib/utils'

const leadersHero = media(
  '/images/lab/library-computers',
  'Two students working together at a computer in a library',
  'Stock photograph · Pexels. Not club leaders or members.',
)

const electionPrinciples = [
  { title: 'Democratic process', description: 'All leadership positions are elected democratically by club members through transparent voting processes.' },
  { title: 'Annual elections', description: 'Elections are held annually, giving every member the opportunity to participate and contribute to club leadership.' },
  { title: 'Mentorship programme', description: 'New leaders receive mentorship from outgoing executives to ensure smooth transitions and continuity.' },
]

export function Leaders() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')

  const groups = useMemo(() => {
    return [
      { value: 'all', label: 'All roles', count: LEADERS.length },
      { value: 'executive', label: 'Executive board', count: LEADERS.filter((l) => /chair|secretary|coordination/i.test(l.position)).length },
      { value: 'technical', label: 'Technical & projects', count: LEADERS.filter((l) => /project|mentorship/i.test(l.position)).length },
      { value: 'comms', label: 'Communication', count: LEADERS.filter((l) => /communication/i.test(l.position)).length },
    ]
  }, [])

  const filtered = LEADERS.filter((leader) => {
    const matchesQuery =
      !query.trim() ||
      `${leader.name} ${leader.position} ${leader.programme}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesGroup =
      group === 'all' ||
      (group === 'executive' && /chair|secretary|coordination/i.test(leader.position)) ||
      (group === 'technical' && /project|mentorship/i.test(leader.position)) ||
      (group === 'comms' && /communication/i.test(leader.position))
    return matchesQuery && matchesGroup
  })

  return (
    <>
      <PageHero
        eyebrow="Leadership"
        title="Our leadership team"
        description="Meet the students leading Digital Club and driving innovation at KIUT. The team is elected annually by club members."
        media={leadersHero}
        aside={
          <dl className="grid gap-3 rounded-lg border border-line bg-canvas p-4 sm:grid-cols-3">
            <div>
              <dt className="text-[0.625rem] uppercase tracking-[0.1em] text-ink-400">Team size</dt>
              <dd className="mt-0.5 text-[0.8125rem] font-medium text-ink-900">{LEADERS.length} published profiles</dd>
            </div>
            <div>
              <dt className="text-[0.625rem] uppercase tracking-[0.1em] text-ink-400">Term</dt>
              <dd className="mt-0.5 text-[0.8125rem] font-medium text-ink-900">Elected annually</dd>
            </div>
            <div>
              <dt className="text-[0.625rem] uppercase tracking-[0.1em] text-ink-400">Structure</dt>
              <dd className="mt-0.5 text-[0.8125rem] font-medium text-ink-900">Board, technical, departments</dd>
            </div>
          </dl>
        }
      />

      <section className="section border-b border-line" data-reveal>
        <div className="container-editorial">
          <SectionHead
            eyebrow="Structure"
            title="An organised approach to student leadership"
            description="The club separates strategic leadership, technical direction and department management so responsibilities stay clear."
          />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {LEADERSHIP_STRUCTURE.map((item, index) => (
              <div key={item.title} className="bg-white p-5">
                <span className="font-mono text-[0.6875rem] text-brand-700">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-950">{item.title}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Meet the team</p>
              <h2 className="mt-2 text-display-md text-ink-950">Passionate students, real responsibilities</h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative">
                <label htmlFor="leader-search" className="sr-only">
                  Search leaders
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
                <Input
                  id="leader-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or role"
                  className="pl-9 sm:w-[240px]"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5" role="group" aria-label="Filter by leadership group">
            {groups.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={group === item.value}
                onClick={() => setGroup(item.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition-colors',
                  group === item.value
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                )}
              >
                {item.label}
                <span className={cn('tabular text-[0.625rem]', group === item.value ? 'text-brand-200' : 'text-ink-400')}>{item.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[0.75rem] text-ink-500" role="status">
              {filtered.length} {filtered.length === 1 ? 'profile' : 'profiles'}
            </p>
            <p className="hidden items-center gap-1.5 text-[0.6875rem] text-ink-400 sm:flex">
              <Users className="h-3 w-3" aria-hidden />
              Names and roles as published
            </p>
          </div>

          {filtered.length ? (
            <div className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((leader) => (
                <LeaderCard
                  key={leader.name}
                  name={leader.name}
                  position={leader.position}
                  programme={leader.programme}
                  year={leader.year}
                  bio={leader.bio}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              title="No leaders match that search"
              description="Try a different name or clear the role filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    setGroup('all')
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}

          <p className="mt-6 max-w-[80ch] text-[0.75rem] leading-5 text-ink-400">
            Portraits were not available for most profiles in the supplied material, so the redesign uses initials instead
            of inventing or substituting photographs. Leadership spellings, roles and years are preserved as published and
            require the club's confirmation for the current term.
          </p>
        </div>
      </section>

      <section className="section border-b border-line">
        <div className="container-editorial grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Elections</p>
            <h2 className="mt-3 text-display-md text-ink-950">Leadership is chosen by members.</h2>
            <p className="mt-3 max-w-[42ch] text-[0.9375rem] leading-7 text-ink-600">
              Elections follow a published process: nominations, screening, voting and results. Public election pages show
              candidates once the club releases them.
            </p>
            <div className="mt-5 rounded-md border border-line bg-canvas p-4">
              <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-800">
                <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden />
                No public election is currently published
              </p>
              <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                The current site's election records were not included in the content handoff. Signed-in members see any
                election they are eligible for.
              </p>
              <div className="mt-3">
                <a href="/elections" className="text-[0.75rem] font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4">
                  Election information
                </a>
              </div>
            </div>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {electionPrinciples.map((item) => (
              <div key={item.title} className="py-5">
                <h3 className="text-[0.9375rem] font-semibold text-ink-950">{item.title}</h3>
                <p className="mt-1 max-w-[60ch] text-[0.8125rem] leading-6 text-ink-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <JoinBand
        eyebrow="Become a leader"
        title="Develop leadership skills and shape technology education at KIUT."
        description="Every position is elected annually. Members receive mentorship from outgoing executives to ensure a smooth transition."
        primary={{ label: 'Join the club', to: '/auth/register' }}
        secondary={{ label: 'Contact the club', to: '/contact?topic=leadership' }}
      />
    </>
  )
}

export default Leaders

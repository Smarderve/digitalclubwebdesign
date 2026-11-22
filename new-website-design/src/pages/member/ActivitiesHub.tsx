import { Link, useSearchParams } from 'react-router-dom'
import { Vote } from 'lucide-react'
import { demoElection } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { ButtonLink, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { MemberEvents } from './Events'
import { MyProjects } from './MyProjects'

const TABS = ['events', 'projects'] as const

/** An election is only surfaced while voting is actually open. */
function activeElection() {
  if (demoElection.status !== 'voting') return null
  return new Date(demoElection.votingClose).getTime() > Date.now() ? demoElection : null
}

/** Activities contains exactly Events and Projects. Competitions and Rankings
    are primary destinations of their own. */
export function ActivitiesHub() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab = TABS.includes(requested as (typeof TABS)[number]) ? (requested as string) : 'events'
  const election = activeElection()

  return (
    <>
      <PageHeader title="Activities" description="Club events you can attend and the projects on your profile." />

      {election ? (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Vote className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[0.8125rem] font-semibold text-ink-900">Voting is open — {election.title}</p>
              <p className="mt-0.5 text-[0.75rem] text-ink-500">
                {election.positions.length} positions · closes{' '}
                {formatDate(election.votingClose, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={`/member/elections/${election.id}`} variant="outline" size="sm">
              Positions
            </ButtonLink>
            <ButtonLink to={`/member/elections/${election.id}/vote`} size="sm">
              Cast your vote
            </ButtonLink>
          </div>
        </div>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = new URLSearchParams(params)
          if (value === 'events') next.delete('tab')
          else next.set('tab', value)
          setParams(next, { replace: true })
        }}
      >
        <TabsList ariaLabel="Activities sections">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <div className="pt-5">
            <MemberEvents embedded />
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <div className="pt-5">
            <MyProjects embedded />
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-[0.6875rem] leading-5 text-ink-400">
        Looking for competitions or team standings? They live in{' '}
        <Link to="/member/competitions" className="font-medium text-brand-800 hover:underline">
          Competitions
        </Link>{' '}
        and{' '}
        <Link to="/member/rankings" className="font-medium text-brand-800 hover:underline">
          Rankings
        </Link>
        .
      </p>
    </>
  )
}

export default ActivitiesHub

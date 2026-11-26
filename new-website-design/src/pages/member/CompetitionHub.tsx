import { useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { demoCompetitions, demoLeaderboard, demoMember, DEMO_LABEL } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Dialog,
  DialogContent,
  EmptyState,
  Input,
  Select,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'

const TABS = ['overview', 'weekly', 'monthly', 'hackathons'] as const
type TabValue = (typeof TABS)[number]

const difficulty = (level: number) => (level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Hard')

function statusLabel(status: string, startsAt: string) {
  if (new Date(startsAt).getTime() > Date.now() && status === 'published') return 'Upcoming'
  if (status === 'published') return 'Open'
  if (status === 'judging') return 'Judging'
  if (status === 'finalized') return 'Completed'
  return status
}

export function CompetitionsHub() {
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const pathTab: TabValue | null = pathname.endsWith('/weekly')
    ? 'weekly'
    : pathname.endsWith('/monthly')
      ? 'monthly'
      : null
  const requested = params.get('tab')
  const tab: TabValue = TABS.includes(requested as TabValue) ? (requested as TabValue) : pathTab ?? 'overview'

  const published = demoCompetitions.filter((competition) => competition.status !== 'draft')
  const open = published.filter(
    (competition) => competition.status === 'published' && new Date(competition.endsAt).getTime() > Date.now(),
  )
  const upcoming = published
    .filter((competition) => new Date(competition.startsAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const completed = published.filter((competition) => competition.status === 'finalized')
  const myResult = demoLeaderboard.find((entry) => entry.name === demoMember.name)

  return (
    <>
      <PageHeader
        title="Competitions"
        actions={
          <Link
            to="/member/rankings"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[0.75rem] font-medium text-ink-700 hover:bg-ink-50"
          >
            Rankings
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = new URLSearchParams(params)
          if (value === 'overview') next.delete('tab')
          else next.set('tab', value)
          setParams(next, { replace: true })
        }}
      >
        <TabsList ariaLabel="Competition sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Challenges</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Challenges</TabsTrigger>
          <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Overview
            open={open}
            upcoming={upcoming}
            completed={completed}
            myResult={myResult}
            onNavigate={(value) => {
              const next = new URLSearchParams(params)
              next.set('tab', value)
              setParams(next, { replace: true })
            }}
          />
        </TabsContent>

        <TabsContent value="weekly">
          <div className="pt-5">
            <ChallengeBrowser frequency="weekly" />
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <div className="pt-5">
            <ChallengeBrowser frequency="monthly" />
          </div>
        </TabsContent>

        <TabsContent value="hackathons">
          <Hackathons />
        </TabsContent>
      </Tabs>
    </>
  )
}

function Overview({
  open,
  upcoming,
  completed,
  myResult,
  onNavigate,
}: {
  open: typeof demoCompetitions
  upcoming: typeof demoCompetitions
  completed: typeof demoCompetitions
  myResult: (typeof demoLeaderboard)[number] | undefined
  onNavigate: (tab: string) => void
}) {
  return (
    <div className="space-y-5 pt-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Open now', value: open.length, tone: 'text-brand-800' },
          { label: 'Upcoming', value: upcoming.length, tone: 'text-ink-900' },
          { label: 'Completed', value: completed.length, tone: 'text-ink-900' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-line bg-surface px-4 py-3.5">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            <p className={cn('mt-1 text-[1.5rem] font-semibold leading-none tabular', item.tone)}>{item.value}</p>
          </div>
        ))}
      </div>

      {open.length ? (
        <Card>
          <CardHeader
            title="Open now"
            action={
              <button
                type="button"
                onClick={() => onNavigate('weekly')}
                className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline"
              >
                Weekly challenges
                <ArrowRight className="h-3 w-3" aria-hidden />
              </button>
            }
          />
          <div className="divide-y divide-line">
            {open.map((competition) => (
              <Link
                key={competition.id}
                to={`/member/competitions/${competition.id}`}
                className="group flex flex-col gap-2 px-5 py-4 hover:bg-ink-50/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[0.875rem] font-semibold text-ink-950">{competition.title}</p>
                    <StatusBadge status={competition.status} />
                  </div>
                  <p className="mt-0.5 text-[0.6875rem] text-ink-500">
                    {competition.frequency === 'weekly' ? 'Weekly' : 'Monthly'} · {competition.category} ·{' '}
                    {difficulty(competition.level)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[0.6875rem] text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden /> Closes {formatDate(competition.endsAt)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-300 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState compact title="No open competitions" description="Published competitions appear here while they accept entries." />
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming" description="Scheduled but not yet open." />
          {upcoming.length ? (
            <div className="divide-y divide-line">
              {upcoming.slice(0, 4).map((competition) => (
                <div key={competition.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.8125rem] font-medium text-ink-900">{competition.title}</p>
                    <p className="text-[0.6875rem] text-ink-400">
                      Opens {formatDate(competition.startsAt)} · {competition.category}
                    </p>
                  </div>
                  <CalendarDays className="h-4 w-4 shrink-0 text-ink-300" aria-hidden />
                </div>
              ))}
            </div>
          ) : (
            <CardBody>
              <p className="text-[0.8125rem] text-ink-500">Nothing is scheduled yet.</p>
            </CardBody>
          )}
        </Card>

        <Card>
          <CardHeader title="Your participation" description="From submitted and judged records." />
          <CardBody className="space-y-3">
            {myResult ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-700" aria-hidden />
                  <p className="text-[0.8125rem] font-medium text-ink-900">Latest judged entry</p>
                </div>
                <dl className="space-y-2 text-[0.75rem]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-500">Rank</dt>
                    <dd className="font-semibold tabular text-ink-900">#{myResult.rank}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-500">Score</dt>
                    <dd className="font-semibold tabular text-ink-900">{myResult.score}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-500">Points awarded</dt>
                    <dd className="font-semibold tabular text-brand-700">+{myResult.points}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-[0.8125rem] text-ink-500">No judged competition entries yet.</p>
            )}
            {completed.length ? (
              <Link
                to={`/member/competitions/${completed[0].id}/leaderboard`}
                className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline"
              >
                Published results
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            ) : null}
          </CardBody>
        </Card>
      </div>

    </div>
  )
}

function ChallengeBrowser({ frequency }: { frequency: 'weekly' | 'monthly' }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [level, setLevel] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('deadline')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const records = useMemo(
    () => demoCompetitions.filter((competition) => competition.frequency === frequency && competition.status !== 'draft'),
    [frequency],
  )
  const categories = useMemo(() => Array.from(new Set(records.map((competition) => competition.category))).sort(), [records])
  const levels = useMemo(() => Array.from(new Set(records.map((competition) => competition.level))).sort(), [records])

  const visible = records
    .filter((competition) => {
      if (category !== 'all' && competition.category !== category) return false
      if (level !== 'all' && competition.level !== Number(level)) return false
      if (status !== 'all' && statusLabel(competition.status, competition.startsAt).toLowerCase() !== status) return false
      if (search.trim() && !`${competition.title} ${competition.category}`.toLowerCase().includes(search.trim().toLowerCase()))
        return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
      if (sort === 'difficulty') return a.level - b.level
      return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()
    })

  const activeFilters = [category !== 'all', level !== 'all', status !== 'all'].filter(Boolean).length + (sort !== 'deadline' ? 1 : 0)

  const clear = () => {
    setSearch('')
    setCategory('all')
    setLevel('all')
    setStatus('all')
    setSort('deadline')
  }

  const fields = (
    <>
      <label className="block">
        <span className="mb-1 block text-[0.6875rem] font-medium text-ink-600">Category</span>
        <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by technical category">
          <option value="all">All categories</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[0.6875rem] font-medium text-ink-600">Difficulty</span>
        <Select value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Filter by difficulty">
          <option value="all">All levels</option>
          {levels.map((value) => (
            <option key={value} value={String(value)}>
              {difficulty(value)}
            </option>
          ))}
        </Select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[0.6875rem] font-medium text-ink-600">Status</span>
        <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="upcoming">Upcoming</option>
          <option value="judging">Judging</option>
          <option value="completed">Completed</option>
        </Select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[0.6875rem] font-medium text-ink-600">Sort</span>
        <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort challenges">
          <option value="deadline">Deadline soonest</option>
          <option value="newest">Newest</option>
          <option value="difficulty">Difficulty</option>
        </Select>
      </label>
    </>
  )

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or category…"
          aria-label="Search challenges"
          className="sm:max-w-[320px]"
        />
        <div className="hidden flex-1 items-end gap-2 md:flex">
          <div className="w-[150px]">
            <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by technical category">
              <option value="all">All categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-[130px]">
            <Select value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Filter by difficulty">
              <option value="all">All levels</option>
              {levels.map((value) => (
                <option key={value} value={String(value)}>
                  {difficulty(value)}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="upcoming">Upcoming</option>
              <option value="judging">Judging</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
          <div className="w-[160px]">
            <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort challenges">
              <option value="deadline">Deadline soonest</option>
              <option value="newest">Newest</option>
              <option value="difficulty">Difficulty</option>
            </Select>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="md:hidden"
          onClick={() => setFiltersOpen(true)}
          iconLeft={<SlidersHorizontal className="h-3.5 w-3.5" />}
        >
          Filters{activeFilters ? ` (${activeFilters})` : ''}
        </Button>
        {activeFilters || search ? (
          <button type="button" onClick={clear} className="text-[0.75rem] font-medium text-brand-800 hover:underline sm:ml-auto">
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        {visible.length ? (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="divide-y divide-line">
              {visible.map((competition) => (
                <Link
                  key={competition.id}
                  to={`/member/competitions/${competition.id}`}
                  className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-ink-50/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Trophy className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[0.875rem] font-semibold text-ink-950">{competition.title}</h2>
                        <StatusBadge status={competition.status} />
                        <Badge tone="outline">{difficulty(competition.level)}</Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-2 max-w-[70ch] text-[0.75rem] leading-5 text-ink-500">
                        {competition.description}
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
                        {competition.rewards[0] ? (
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="h-3 w-3" aria-hidden />
                            {competition.rewards[0].points} points for first place
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] font-medium text-brand-800">
                    {competition.category}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Trophy className="h-4 w-4" aria-hidden />}
            title={`No ${frequency} challenges match these filters`}
            description="Try a different category, difficulty or status. Draft competitions are never shown."
            action={
              <Button variant="outline" size="sm" onClick={clear}>
                Clear filters
              </Button>
            }
          />
        )}
      </div>

      <p className="mt-3 text-[0.6875rem] text-ink-400">
        Showing {visible.length} of {records.length} published {frequency} challenges.
      </p>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent
          title="Filter challenges"
          description="Narrow by the values present in published records."
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={clear}>
                Reset
              </Button>
              <Button onClick={() => setFiltersOpen(false)}>Show {visible.length} challenges</Button>
            </>
          }
        >
          <div className="space-y-3">{fields}</div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Hackathons() {
  /* The competition records in this prototype only carry weekly and monthly
     challenges. No hackathon competition, team or result records exist, so this
     surface reports the gap instead of inventing events. */
  return (
    <div className="space-y-5 pt-5">
      <EmptyState
        icon={<Sparkles className="h-4 w-4" aria-hidden />}
        title="No hackathons are published"
        description="No hackathon records have been published yet."
        action={
          <Link to="/member/activities?tab=events" className="text-[0.8125rem] font-semibold text-brand-800 hover:underline">
            Browse club events
          </Link>
        }
      />

      <Card>
        <CardHeader title="What this section needs" />
        <CardBody>
          <ul className="space-y-2 text-[0.8125rem] leading-6 text-ink-600">
            <li>Hackathon records with theme, schedule, registration deadline and rules.</li>
            <li>Team records linked to each hackathon, with capacity and join requests.</li>
            <li>Published judging results and project submissions for past hackathons.</li>
          </ul>
          <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
            These are backend data-model gaps, not interface work. Adding sample hackathons would misrepresent the club's
            records.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

export default CompetitionsHub

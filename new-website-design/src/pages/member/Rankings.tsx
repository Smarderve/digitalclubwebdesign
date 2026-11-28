import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Medal, Search, Star, Trophy } from 'lucide-react'
import { memberApi } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { Teams } from './Teams'

/** Member leaderboard. Ranks and points come from the server; nothing is recalculated here. */
export function Rankings({ embedded = false }: { embedded?: boolean } = {}) {
  const [query, setQuery] = useState('')
  const { data, loading, error, reload } = useMemberData(() => memberApi.rankings(), [])

  const header = embedded ? null : (
    <PageHeader
      title="Rankings"
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Rankings' }]}
      actions={
        <ButtonLink to="/member/rankings/points-transactions" variant="outline" size="sm">
          Points ledger
        </ButtonLink>
      }
    />
  )

  if (loading && !data) {
    return (
      <>
        {header}
        <LoadingBlock rows={5} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        {header}
        <ErrorBlock message={error ?? 'The leaderboard could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const term = query.trim().toLowerCase()
  const members = data.leaderboard.filter(
    (member) =>
      !term ||
      member.name.toLowerCase().includes(term) ||
      (member.course ?? '').toLowerCase().includes(term) ||
      (member.team ?? '').toLowerCase().includes(term),
  )

  const isMe = (memberId: number) => data.my_entry?.member_id === memberId
  const top = data.leaderboard.slice(0, 3)

  return (
    <>
      {header}

      <div className="grid gap-3 sm:grid-cols-3">
        {top.map((member) => (
          <div key={member.member_id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-[0.8125rem] font-semibold tabular text-warning">
              {member.rank}
            </span>
            <div className="min-w-0">
              <p className="block truncate text-[0.8125rem] font-semibold text-ink-900">{member.name}</p>
              <p className="truncate text-[0.6875rem] text-ink-500">
                {member.points} points{member.team ? ` · ${member.team}` : ''}
              </p>
            </div>
            <Medal className="ml-auto h-4 w-4 shrink-0 text-gold" aria-hidden />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-[300px]">
          <label htmlFor="rank-search" className="sr-only">
            Search members
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
          <Input
            id="rank-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members…"
            className="pl-9"
          />
        </div>
        <p className="text-[0.75rem] text-ink-500">
          Showing {members.length} of {data.leaderboard.length} ranked members
        </p>
      </div>

      <Card className="mt-3 overflow-hidden">
        {members.length ? (
          <TableWrap>
            <THead>
              <TR>
                <TH className="w-[70px]">Rank</TH>
                <TH>Member</TH>
                <TH>Points</TH>
                <TH>Competitions</TH>
                <TH>Warmups</TH>
                <TH>Team</TH>
              </TR>
            </THead>
            <TBody>
              {members.map((member) => (
                <TR key={member.member_id} className={isMe(member.member_id) ? 'bg-brand-50/50' : undefined}>
                  <TD className="font-semibold tabular text-ink-700">#{member.rank}</TD>
                  <TD>
                    <span className="font-medium text-ink-900">{member.name}</span>
                    {isMe(member.member_id) ? (
                      <Badge tone="green" className="ml-2">
                        You
                      </Badge>
                    ) : null}
                    <span className="ml-2 text-[0.6875rem] text-ink-400">
                      {[member.course, member.year].filter(Boolean).join(' · ')}
                    </span>
                  </TD>
                  <TD className="font-semibold tabular text-ink-900">{member.points}</TD>
                  <TD className="tabular">{member.competitions}</TD>
                  <TD className="tabular">{member.warmups}</TD>
                  <TD className="text-ink-500">{member.team ?? '—'}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        ) : (
          <div className="p-4">
            <EmptyState
              compact
              title={term ? 'No members match that search' : 'No ranked members yet'}
              description={term ? 'Try a different name, course or team.' : 'Members appear here once points are awarded.'}
              action={
                term ? (
                  <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
        {data.my_entry ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-ink-400">
              You are ranked #{data.my_entry.rank} with {data.my_entry.points} points.
            </p>
            <Link
              to="/member/rankings/points-transactions"
              className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline"
            >
              How points are recorded
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-ink-400">Rankings include approved members and use all-time points.</p>
          </div>
        )}
      </Card>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-canvas/50 p-4">
        <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
        <p className="text-[0.75rem] leading-5 text-ink-500">
          Points are awarded by administrators for competition results, event check-ins, warmups and contributions. If a points
          entry looks wrong, contact the club with the date and reason.
        </p>
      </div>
    </>
  )
}

function TeamStandings() {
  const { data, loading, error, reload } = useMemberData(() => memberApi.rankings(), [])

  if (loading && !data) return <LoadingBlock rows={4} />
  if (error || !data) return <ErrorBlock message={error ?? 'Team standings could not be loaded.'} onRetry={reload} />

  return (
    <Card className="mb-5 overflow-hidden">
      <CardHeader title="Team standings" description="Teams are ranked by the points their members earn." />
      {data.teams.length ? (
        <TableWrap>
          <THead>
            <TR>
              <TH className="w-[70px]">Rank</TH>
              <TH>Team</TH>
              <TH>Points</TH>
              <TH>Rating</TH>
              <TH>Members</TH>
              <TH>Entries</TH>
            </TR>
          </THead>
          <TBody>
            {data.teams.map((team) => (
              <TR key={team.id}>
                <TD className="font-semibold tabular text-ink-700">#{team.rank}</TD>
                <TD className="font-medium text-ink-900">{team.name}</TD>
                <TD className="font-semibold tabular">{team.points}</TD>
                <TD>
                  <span className="inline-flex items-center gap-1 tabular">
                    {team.rating}
                    <Star className="h-3 w-3 fill-gold text-gold" aria-hidden />
                  </span>
                </TD>
                <TD className="tabular">{team.members_count}</TD>
                <TD className="tabular">{team.participations}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      ) : (
        <div className="p-4">
          <EmptyState compact title="No team standings yet" description="Teams appear here once they are formed and compete." />
        </div>
      )}
      <div className="border-t border-line px-4 py-3">
        <p className="text-[0.6875rem] text-ink-400">Suspended teams remain visible but do not compete.</p>
      </div>
    </Card>
  )
}

/** Rankings is the home of the leaderboard and the team hub. */
export function RankingsHub() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'teams' ? 'teams' : 'leaderboards'

  return (
    <>
      <PageHeader
        title="Rankings"
        actions={
          <ButtonLink to="/member/rankings/points-transactions" variant="outline" size="sm">
            Points ledger
          </ButtonLink>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = new URLSearchParams(params)
          if (value === 'leaderboards') next.delete('tab')
          else next.set('tab', value)
          setParams(next, { replace: true })
        }}
      >
        <TabsList ariaLabel="Rankings sections">
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboards">
          <div className="pt-5">
            <Rankings embedded />
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="pt-5">
            <TeamStandings />
            <Teams embedded />
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default Rankings

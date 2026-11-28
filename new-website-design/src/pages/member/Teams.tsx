import { useState } from 'react'
import { Check, Crown, Search, Star, UserMinus, Users, X } from 'lucide-react'
import { ApiError } from '../../lib/api'
import { memberApi, type TeamMemberRow } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import {
  Alert,
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui'
import { Button } from '../../components/ui/button'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

export function Teams({ embedded = false }: { embedded?: boolean } = {}) {
  const { data, loading, error, reload } = useMemberData(
    () =>
      memberApi.teams().then(async (teams) => ({
        teams,
        detail: teams.my_team ? await memberApi.team(teams.my_team.id) : null,
      })),
    [],
  )
  const [tab, setTab] = useState('my-team')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<TeamMemberRow | null>(null)
  const { push } = useToast()

  const header = embedded ? null : <PageHeader title="Team hub" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Teams' }]} />

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
        <ErrorBlock message={error ?? 'Your team records could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const { teams, detail } = data
  const requestedIds = new Set(teams.my_requests.map((request) => request.team.id))
  const filteredTeams = teams.open_teams.filter((team) => team.name.toLowerCase().includes(query.trim().toLowerCase()))

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key)
    try {
      await action()
      push({ tone: 'success', title: success })
      reload()
    } catch (catchError) {
      push({
        tone: 'error',
        title: 'Action not completed',
        description:
          catchError instanceof ApiError
            ? catchError.message
            : 'The request could not be completed. Check your connection and try again.',
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {header}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList ariaLabel="Team hub sections">
          <TabsTrigger value="my-team">My team</TabsTrigger>
          <TabsTrigger value="browse">Browse teams</TabsTrigger>
          <TabsTrigger value="requests">Requests ({teams.leader_requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-team">
          {detail ? (
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-50 text-brand-800">
                        <Users className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[1.125rem] font-semibold text-ink-950">{detail.name}</h2>
                          <Badge tone={detail.is_suspended ? 'red' : detail.is_open ? 'green' : 'neutral'} dot>
                            {detail.is_suspended ? 'Suspended' : detail.is_open ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                        {detail.description ? (
                          <p className="mt-0.5 text-[0.75rem] text-ink-500">{detail.description}</p>
                        ) : null}
                        <p className="mt-1 text-[0.6875rem] text-ink-400">
                          {detail.leader ? `Led by ${detail.leader}` : 'No leader recorded'}
                          {teams.my_membership?.is_leader ? ' · You are the leader' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[1.125rem] font-semibold tabular text-ink-950">{detail.points}</p>
                        <p className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">Team points</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-[1.125rem] font-semibold tabular text-ink-950">
                          {detail.rating}
                          <Star className="h-3.5 w-3.5 fill-[#D9A441] text-[#D9A441]" aria-hidden />
                        </p>
                        <p className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">Rating</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-line pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[0.8125rem] font-semibold text-ink-900">Members ({detail.members.length})</h3>
                      <span className="text-[0.6875rem] text-ink-400">
                        {detail.created_at ? `Created ${formatDate(detail.created_at)}` : ''}
                      </span>
                    </div>
                    {detail.members.length ? (
                      <div className="divide-y divide-line">
                        {detail.members.map((member) => (
                          <div key={member.member_id} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={member.display_name} size="sm" />
                              <div>
                                <p className="text-[0.8125rem] font-medium text-ink-900">{member.display_name}</p>
                                <p className="text-[0.625rem] text-ink-400">
                                  {[member.course, member.year].filter(Boolean).join(' · ') || 'Member'}
                                </p>
                              </div>
                            </div>
                            {member.is_leader ? (
                              <Badge tone="outline">
                                <Crown className="h-3 w-3" aria-hidden />
                                Leader
                              </Badge>
                            ) : detail.is_leader ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove ${member.display_name} from team`}
                                disabled={busy === `remove-${member.member_id}`}
                                onClick={() => setRemoveTarget(member)}
                              >
                                <UserMinus className="h-3.5 w-3.5" aria-hidden />
                              </Button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[0.75rem] text-ink-500">This team has no members listed.</p>
                    )}
                  </div>
                </CardBody>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader title="Team competitions" description="Competitions this team is entered in." />
                  {detail.competitions.length ? (
                    <div className="divide-y divide-line">
                      {detail.competitions.map((competition) => (
                        <div key={competition.competition_id} className="px-5 py-3.5">
                          <p className="text-[0.8125rem] font-medium text-ink-900">
                            Competition #{competition.competition_id}
                          </p>
                          <div className="mt-1">
                            <Badge tone="outline">{competition.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4">
                      <EmptyState compact title="No competition entries" description="Enter a team competition to appear here." />
                    </div>
                  )}
                </Card>

                {teams.my_requests.length ? (
                  <Card>
                    <CardHeader title="Your join requests" description="Requests waiting for a team leader to decide." />
                    <div className="divide-y divide-line">
                      {teams.my_requests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between gap-3 px-5 py-3">
                          <div>
                            <p className="text-[0.8125rem] font-medium text-ink-900">{request.team.name}</p>
                            <p className="text-[0.6875rem] text-ink-500">
                              {request.requested_at ? `Sent ${formatDate(request.requested_at)}` : 'Pending'}
                            </p>
                          </div>
                          <Badge tone="amber">Pending</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <Card>
                <div className="p-4">
                  <EmptyState
                    icon={<Users className="h-4 w-4" aria-hidden />}
                    title="You are not in a team yet"
                    description="Browse open teams and send a join request. A team leader reviews requests."
                    action={
                      <Button size="sm" onClick={() => setTab('browse')}>
                        Browse teams
                      </Button>
                    }
                  />
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse">
          <div className="mt-5">
            <div className="relative max-w-[340px]">
              <label htmlFor="team-search" className="sr-only">
                Search teams
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
              <Input
                id="team-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search teams…"
                className="pl-9"
              />
            </div>

            {filteredTeams.length ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredTeams.map((team) => {
                  const isMine = teams.my_team?.id === team.id
                  const requested = requestedIds.has(team.id)
                  const blocked = Boolean(teams.my_team) || !team.is_open || team.is_suspended
                  return (
                    <Card key={team.id}>
                      <CardBody>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-[0.9375rem] font-semibold text-ink-950">{team.name}</h3>
                            <p className="mt-0.5 text-[0.6875rem] text-ink-500">
                              {team.leader ? `Led by ${team.leader}` : 'No leader recorded'}
                            </p>
                          </div>
                          <Badge tone={team.is_suspended ? 'red' : team.is_open ? 'green' : 'neutral'}>
                            {team.is_suspended ? 'Suspended' : team.is_open ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                        <dl className="mt-3 grid grid-cols-3 gap-2 border-y border-line py-2.5 text-center">
                          <div>
                            <dt className="text-[0.5625rem] uppercase tracking-[0.08em] text-ink-400">Members</dt>
                            <dd className="text-[0.8125rem] font-semibold tabular text-ink-900">{team.members_count}</dd>
                          </div>
                          <div>
                            <dt className="text-[0.5625rem] uppercase tracking-[0.08em] text-ink-400">Points</dt>
                            <dd className="text-[0.8125rem] font-semibold tabular text-ink-900">{team.points}</dd>
                          </div>
                          <div>
                            <dt className="text-[0.5625rem] uppercase tracking-[0.08em] text-ink-400">Rating</dt>
                            <dd className="text-[0.8125rem] font-semibold tabular text-ink-900">{team.rating}</dd>
                          </div>
                        </dl>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                          disabled={isMine || requested || blocked || busy === `join-${team.id}`}
                          onClick={() =>
                            run(`join-${team.id}`, () => memberApi.requestTeamJoin(team.id), 'Join request sent')
                          }
                        >
                          {isMine
                            ? 'Your team'
                            : requested
                              ? 'Request pending'
                              : team.is_suspended
                                ? 'Suspended'
                                : !team.is_open
                                  ? 'Not accepting requests'
                                  : busy === `join-${team.id}`
                                    ? 'Sending…'
                                    : 'Request to join'}
                        </Button>
                        {teams.my_team && !isMine ? (
                          <p className="mt-2 text-center text-[0.6875rem] text-ink-400">
                            Leave or finish your current team before joining another.
                          </p>
                        ) : null}
                      </CardBody>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                className="mt-4"
                title={query.trim() ? 'No teams match that search' : 'No open teams'}
                description={query.trim() ? 'Try another team name.' : 'Teams accepting requests will appear here.'}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="mt-5">
            <CardHeader title="Join requests" description="Requests to join your team. Only the team leader can decide." />
            {!detail?.is_leader ? (
              <div className="p-4">
                <EmptyState
                  compact
                  title="No team to review"
                  description="Only a team leader can review join requests. Join or lead a team first."
                />
              </div>
            ) : teams.leader_requests.length ? (
              <div className="divide-y divide-line">
                {teams.leader_requests.map((request) => (
                  <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={request.display_name} size="sm" />
                      <div>
                        <p className="text-[0.8125rem] font-medium text-ink-900">{request.display_name}</p>
                        <p className="text-[0.6875rem] text-ink-500">
                          {[request.course, request.year].filter(Boolean).join(' · ') || 'Member'}
                          {request.requested_at ? ` · requested ${formatDate(request.requested_at)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busy === `decide-${request.id}`}
                        iconLeft={<Check className="h-3.5 w-3.5" />}
                        onClick={() =>
                          run(
                            `decide-${request.id}`,
                            () => memberApi.decideTeamRequest(request.team_id, request.id, 'approve'),
                            'Join request approved',
                          )
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === `decide-${request.id}`}
                        iconLeft={<X className="h-3.5 w-3.5" />}
                        onClick={() =>
                          run(
                            `decide-${request.id}`,
                            () => memberApi.decideTeamRequest(request.team_id, request.id, 'reject'),
                            'Join request rejected',
                          )
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState compact title="No pending requests" description="New requests to join your team will appear here." />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-5">
        <Alert tone="info" title="Teams and competitions">
          Teams are approved by the club and can enter team competitions. A team leader reviews join requests and manages the
          roster.
        </Alert>
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && busy === null && setRemoveTarget(null)}
        title="Remove this member?"
        description={
          removeTarget
            ? `${removeTarget.display_name} will be removed from ${detail?.name ?? 'the team'}. They can request to join again.`
            : ''
        }
        confirmLabel={busy ? 'Removing…' : 'Remove member'}
        destructive
        onConfirm={async () => {
          if (!detail || !removeTarget) return
          const member = removeTarget
          await run(
            `remove-${member.member_id}`,
            () => memberApi.removeTeamMember(detail.id, member.member_id),
            'Member removed from team',
          )
          setRemoveTarget(null)
        }}
      />
    </>
  )
}

export default Teams

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Crown, Plus, Search, Star, Trophy, UserMinus, Users, X } from 'lucide-react'
import { demoTeam, demoTeams } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Avatar, Badge, Card, CardBody, CardHeader, Dialog, DialogContent, EmptyState, Progress, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Field, Input } from '../../components/ui/field'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'
import { memberByName } from '../../features/social/directory'

export function Teams({ embedded = false }: { embedded?: boolean } = {}) {
  const [requests, setRequests] = useState(demoTeam.requests)
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamTagline, setTeamTagline] = useState('')
  const [error, setError] = useState('')
  const { push } = useToast()

  const filteredTeams = demoTeams.filter((team) => team.name.toLowerCase().includes(query.trim().toLowerCase()))

  function decide(id: number, decision: 'approve' | 'reject') {
    setRequests((current) => current.filter((request) => request.id !== id))
    push({
      tone: decision === 'approve' ? 'success' : 'info',
      title: decision === 'approve' ? 'Join request approved' : 'Join request rejected',
    })
  }

  return (
    <>
      {embedded ? (
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setCreateOpen(true)} iconLeft={<Plus className="h-3.5 w-3.5" />}>
            Create team
          </Button>
        </div>
      ) : (
        <PageHeader
          title="Team hub"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Teams' }]}
          actions={
            <Button size="sm" onClick={() => setCreateOpen(true)} iconLeft={<Plus className="h-3.5 w-3.5" />}>
              Create team
            </Button>
          }
        />
      )}

      <Tabs defaultValue="my-team">
        <TabsList ariaLabel="Team hub sections">
          <TabsTrigger value="my-team">My team</TabsTrigger>
          <TabsTrigger value="browse">Browse teams</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-team">
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
                        <h2 className="text-[1.125rem] font-semibold text-ink-950">{demoTeam.name}</h2>
                        <Badge tone="green" dot>
                          Active
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[0.75rem] text-ink-500">{demoTeam.tagline}</p>
                      <p className="mt-1 text-[0.6875rem] text-ink-400">Led by {demoTeam.leader}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[1.125rem] font-semibold tabular text-ink-950">{demoTeam.points}</p>
                      <p className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">Team points</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-[1.125rem] font-semibold tabular text-ink-950">
                        {demoTeam.rating}
                        <Star className="h-3.5 w-3.5 fill-[#D9A441] text-[#D9A441]" aria-hidden />
                      </p>
                      <p className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">Rating</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-line pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[0.8125rem] font-semibold text-ink-900">Members ({demoTeam.members.length})</h3>
                    <span className="text-[0.6875rem] text-ink-400">Maximum team size: 4</span>
                  </div>
                  <div className="divide-y divide-line">
                    {demoTeam.members.map((member) => (
                      <div key={member.name} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.name} size="sm" />
                          <div>
                            {memberByName(member.name) ? (
                              <Link to={`/members/${memberByName(member.name)!.username}`} className="text-[0.8125rem] font-medium text-ink-900 hover:text-brand-800 hover:underline">
                                {member.name}
                              </Link>
                            ) : (
                              <p className="text-[0.8125rem] font-medium text-ink-900">{member.name}</p>
                            )}
                            <p className="text-[0.625rem] text-ink-400">
                              {member.role} · joined {formatDate(member.joined)}
                            </p>
                          </div>
                        </div>
                        {member.role === 'Team leader' ? (
                          <Badge tone="outline">
                            <Crown className="h-3 w-3" aria-hidden />
                            Leader
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${member.name} from team`}
                            onClick={() =>
                              push({
                                tone: 'info',
                                title: 'Removal requires confirmation',
                              })
                            }
                          >
                            <UserMinus className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader title="Team competitions" description="Current entries for this team." />
                <div className="divide-y divide-line">
                  {demoTeam.competitions.map((competition) => (
                    <div key={competition.title} className="px-5 py-3.5">
                      <p className="text-[0.8125rem] font-medium text-ink-900">{competition.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-[0.6875rem] text-ink-500">
                        <Badge tone={competition.status === 'Enrolling' ? 'green' : 'amber'}>{competition.status}</Badge>
                        <span>{competition.teamSize} members competing</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-[0.8125rem] font-semibold text-ink-900">Team progress</p>
                  <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">Points earned across competitions this term.</p>
                  <div className="mt-3">
                    <Progress value={demoTeam.points} max={2000} label={`${demoTeam.points} of 2000 points`} />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="browse">
          <div className="mt-5">
            <div className="relative max-w-[340px]">
              <label htmlFor="team-search" className="sr-only">
                Search teams
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
              <Input id="team-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams…" className="pl-9" />
            </div>

            {filteredTeams.length ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredTeams.map((team) => (
                  <Card key={team.id}>
                    <CardBody>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[0.9375rem] font-semibold text-ink-950">{team.name}</h3>
                          <p className="mt-0.5 text-[0.6875rem] text-ink-500">Led by {team.leader}</p>
                        </div>
                        <Badge tone={team.status === 'active' ? 'green' : 'red'}>{team.status === 'active' ? 'Active' : 'Suspended'}</Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 border-y border-line py-2.5 text-center">
                        <div>
                          <dt className="text-[0.5625rem] uppercase tracking-[0.08em] text-ink-400">Members</dt>
                          <dd className="text-[0.8125rem] font-semibold tabular text-ink-900">{team.members}</dd>
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
                        disabled={team.status !== 'active' || team.id === 1}
                        onClick={() =>
                          push({
                            tone: 'success',
                            title: 'Join request sent',
                          })
                        }
                      >
                        {team.id === 1 ? 'Your team' : team.status !== 'active' ? 'Unavailable' : 'Request to join'}
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState className="mt-4" title="No teams match that search" description="Try another team name." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="mt-5">
            <CardHeader title="Join requests" description="Requests to join your team. Only the team leader can decide." />
            {requests.length ? (
              <div className="divide-y divide-line">
                {requests.map((request) => (
                  <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={request.name} size="sm" />
                      <div>
                        <p className="text-[0.8125rem] font-medium text-ink-900">{request.name}</p>
                        <p className="text-[0.6875rem] text-ink-500">
                          {request.course} · requested {formatDate(request.requested)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => decide(request.id, 'approve')} iconLeft={<Check className="h-3.5 w-3.5" />}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => decide(request.id, 'reject')} iconLeft={<X className="h-3.5 w-3.5" />}>
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
          Teams are approved by the club and can enter team competitions.
        </Alert>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          title="Create a team"
          description="Teams need at least two approved members. The club reviews new teams before competition entry."
          footer={
            <>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (teamName.trim().length < 3) {
                    setError('Enter a team name with at least 3 characters.')
                    return
                  }
                  setError('')
                  setCreateOpen(false)
                  setTeamName('')
                  setTeamTagline('')
                  push({ tone: 'success', title: 'Team created' })
                }}
              >
                Create team
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Team name" htmlFor="team-name" required error={error}>
              <Input
                id="team-name"
                value={teamName}
                onChange={(event) => {
                  setTeamName(event.target.value)
                  if (error) setError('')
                }}
                placeholder="e.g. Byte Builders"
              />
            </Field>
            <Field label="Tagline" htmlFor="team-tagline" optional hint="A short description of what the team builds.">
              <Input id="team-tagline" value={teamTagline} onChange={(event) => setTeamTagline(event.target.value)} placeholder="Small tools for campus problems" />
            </Field>
            <div className="rounded-md border border-line bg-canvas/60 p-3 text-[0.75rem] leading-5 text-ink-500">
              You will be the team leader. Invite members from the member directory after the team is created.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Teams

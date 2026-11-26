import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ShieldOff, Trophy, Users, X } from 'lucide-react'
import { demoTeam, demoTeams } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, DetailList, EmptyState, StatusBadge, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type TeamRow = (typeof demoTeams)[number]

export function AdminTeams() {
  const [rows, setRows] = useState<TeamRow[]>(demoTeams)
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [pending, setPending] = useState<TeamRow | null>(null)
  const { push } = useToast()

  const matches = useCallback((row: TeamRow, query: string) => `${row.name} ${row.leader}`.toLowerCase().includes(query), [])
  const base = rows.filter((row) => filter === 'all' || row.status === filter)
  const list = useAdminList(base, matches)

  return (
    <>
      <PageHeader
        title="Teams"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Teams' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            iconLeft={<Users className="h-3.5 w-3.5" />}
            onClick={() => push({ tone: 'info', title: 'Teams are created by members', description: 'Members create a team from the member area; administrators review and can suspend them.' })}
          >
            How teams work
          </Button>
        }
      />

      <StatStrip>
        <SmallStat label="Teams" value={rows.length} hint="All records" tone="brand" />
        <SmallStat label="Active" value={rows.filter((row) => row.status === 'active').length} hint="Compiling in competitions" />
        <SmallStat label="Members in teams" value={rows.reduce((total, row) => total + row.members, 0)} hint="Across all teams" />
        <SmallStat label="Join requests" value={rows.reduce((total, row) => total + row.requests, 0)} hint="Awaiting a decision" tone="amber" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search teams or leaders…" count={`${list.total} teams`}>
          <FilterChips
            label="Team status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} teams` }}
          emptyTitle="No teams match this filter"
          emptyDescription="Try another status or clear the search field."
          columns={[
            {
              id: 'name',
              header: 'Team',
              sortValue: (row) => row.name,
              cell: (row) => (
                <Link to={`/admin/teams/${row.id}`} className="group block">
                  <p className="font-medium text-ink-900 group-hover:text-brand-800">{row.name}</p>
                  <p className="text-[0.6875rem] text-ink-400">Led by {row.leader}</p>
                </Link>
              ),
            },
            { id: 'members', header: 'Members', align: 'right', sortValue: (row) => row.members, cell: (row) => <span className="tabular">{row.members}</span> },
            { id: 'points', header: 'Points', align: 'right', sortValue: (row) => row.points, cell: (row) => <span className="font-semibold tabular">{row.points}</span> },
            { id: 'rating', header: 'Rating', align: 'right', cell: (row) => <span className="tabular">{row.rating.toFixed(1)}</span> },
            { id: 'requests', header: 'Requests', align: 'right', cell: (row) => (row.requests ? <Badge tone="amber">{row.requests}</Badge> : <span className="text-ink-400">—</span>) },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.name}`}>
                  <DropdownItem to={`/admin/teams/${row.id}`} icon={<Users className="h-3.5 w-3.5" />}>Open team</DropdownItem>
                  <DropdownItem to={`/admin/teams/${row.id}`} icon={<Trophy className="h-3.5 w-3.5" />}>Competition record</DropdownItem>
                  <DropdownItem
                    icon={<ShieldOff className="h-3.5 w-3.5" />}
                    destructive={row.status === 'active'}
                    onSelect={() => setPending(row)}
                  >
                    {row.status === 'active' ? 'Suspend team' : 'Reactivate team'}
                  </DropdownItem>
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Suspending a team disqualifies it from open competitions but keeps its points and history.
      </p>
      <DemoNotice />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.status === 'active' ? 'Suspend this team?' : 'Reactivate this team?'}
        description={
          pending?.status === 'active'
            ? `${pending?.name} will be withdrawn from open competitions. Members keep their individual records.`
            : `${pending?.name} will be able to enter competitions again.`
        }
        confirmLabel={pending?.status === 'active' ? 'Suspend team' : 'Reactivate'}
        destructive={pending?.status === 'active'}
        onConfirm={() => {
          if (!pending) return
          setRows((current) => current.map((row) => (row.id === pending.id ? { ...row, status: row.status === 'active' ? 'suspended' : 'active' } : row)))
          push({ tone: 'info', title: pending.status === 'active' ? 'Team suspended' : 'Team reactivated' })
        }}
      />
    </>
  )
}

export function AdminTeamDetail() {
  const { id } = useParams()
  const team = demoTeams.find((row) => String(row.id) === id)
  const { push } = useToast()
  const [confirming, setConfirming] = useState<'remove' | 'transfer' | null>(null)

  if (!team) {
    return (
      <>
        <PageHeader title="Team not found" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Teams', to: '/admin/teams' }]} />
        <Card><div className="p-4"><EmptyState title="This team is unavailable" description="It may have been removed." action={<ButtonLink to="/admin/teams" size="sm">Back to teams</ButtonLink>} /></div></Card>
      </>
    )
  }

  const isDemoTeam = team.name === demoTeam.name
  const members = isDemoTeam ? demoTeam.members.map((member) => ({ name: member.name, role: member.role, joined: member.joined })) : [{ name: team.leader, role: 'Team leader', joined: '2025-10-04' }]

  return (
    <>
      <Link to="/admin/teams" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Teams
      </Link>
      <PageHeader
        title={team.name}
        description={`${team.members} members · ${team.points} points · rating ${team.rating.toFixed(1)}`}
        badge={<StatusBadge status={team.status} />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirming('transfer')}>Team leader</Button>
            <Button variant="dangerSoft" size="sm" onClick={() => setConfirming('remove')}>{team.status === 'active' ? 'Suspend team' : 'Reactivate team'}</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Members" description="Team composition as approved by the leader." action={<Badge tone="outline">{members.length}</Badge>} />
            <TableWrap>
              <THead><TR><TH>Member</TH><TH>Role</TH><TH>Joined</TH></TR></THead>
              <TBody>
                {members.map((member) => (
                  <TR key={member.name}>
                    <TD className="font-medium text-ink-900">{member.name}</TD>
                    <TD className="text-ink-500">{member.role}</TD>
                    <TD className="whitespace-nowrap text-ink-500">{formatDate(member.joined)}</TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
          </Card>

          {isDemoTeam ? (
            <Card>
              <CardHeader title="Join requests" description="Members waiting for the team leader to decide." action={<Badge tone="amber">{demoTeam.requests.length}</Badge>} />
              <ul className="divide-y divide-line">
                {demoTeam.requests.map((request) => (
                  <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <p className="text-[0.8125rem] font-medium text-ink-900">{request.name}</p>
                      <p className="text-[0.6875rem] text-ink-400">{request.course} · requested {formatDate(request.requested)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="xs" iconLeft={<Check className="h-3 w-3" />} onClick={() => push({ tone: 'success', title: 'Request accepted', description: `${request.name} — no team membership was changed.` })}>Accept</Button>
                      <Button variant="ghost" size="xs" iconLeft={<X className="h-3 w-3" />} onClick={() => push({ tone: 'info', title: 'Request declined', description: `${request.name} — no notification was sent.` })}>Decline</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Competition record" description="Entries and results for this team." />
            <TableWrap>
              <THead><TR><TH>Competition</TH><TH>Status</TH><TH>Team size</TH></TR></THead>
              <TBody>
                {(isDemoTeam ? demoTeam.competitions : [{ title: 'Weekly Challenge 06 — Array & String Patterns', status: 'Enrolling', teamSize: team.members }]).map((entry) => (
                  <TR key={entry.title}>
                    <TD className="font-medium text-ink-900">{entry.title}</TD>
                    <TD><Badge tone="outline">{entry.status}</Badge></TD>
                    <TD className="tabular">{entry.teamSize}</TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Team record" />
            <div className="p-4">
              <DetailList
                items={[
                  { label: 'Team name', value: team.name },
                  { label: 'Leader', value: team.leader },
                  { label: 'Status', value: <StatusBadge status={team.status} /> },
                  { label: 'Members', value: team.members },
                  { label: 'Team points', value: <span className="tabular">{team.points}</span> },
                  { label: 'Rating', value: team.rating.toFixed(1) },
                  { label: 'Open requests', value: team.requests },
                ]}
              />
            </div>
          </Card>
          <Alert tone="info" title="Team points">
            Team points are the sum of member points earned in team competitions. Individual points are not transferred.
          </Alert>
          <Card>
            <CardHeader title="Moderation" />
            <p className="px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
              Suspend a team only for a rule breach confirmed by the committee. Record the reason in the audit log before acting.
            </p>
          </Card>
        </div>
      </div>

      <DemoNotice />

      <ConfirmDialog
        open={confirming === 'remove'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={team.status === 'active' ? 'Suspend this team?' : 'Reactivate this team?'}
        description="Members keep their individual records and points either way."
        confirmLabel={team.status === 'active' ? 'Suspend team' : 'Reactivate'}
        destructive={team.status === 'active'}
        onConfirm={() => push({ tone: 'info', title: 'Team status is unchanged' })}
      />
      <ConfirmDialog
        open={confirming === 'transfer'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Transfer team leadership?"
        description="A new leader must be a current member of the team. The current leader becomes a regular member."
        confirmLabel="Choose new leader"
        destructive={false}
        onConfirm={() => push({ tone: 'info', title: 'Leadership transfer is available from the record page', description: 'Use the member directory to review candidates.' })}
      />
    </>
  )
}

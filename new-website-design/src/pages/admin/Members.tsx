import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Eye, ShieldCheck, ShieldOff, UserMinus, UserRound } from 'lucide-react'
import { demoMemberIds, demoMemberProjects, demoPayments, demoRewardHistory, demoUsers } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, DetailList, EmptyState, StatusBadge, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, downloadCsv, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type Row = (typeof demoUsers)[number]

export function AdminMembers() {
  const [rows, setRows] = useState<Row[]>(demoUsers.filter((user) => user.role !== 'admin'))
  const [status, setStatus] = useState<'all' | 'student' | 'alumni' | 'inactive'>('all')
  const [pending, setPending] = useState<{ type: 'quizmaster' | 'demote' | 'toggle'; row: Row } | null>(null)
  const { push } = useToast()

  const matches = useCallback((row: Row, query: string) => `${row.name} ${row.email} ${row.course} ${row.memberId} ${row.year}`.toLowerCase().includes(query), [])
  const baseRows = rows.filter((row) => {
    if (status === 'all') return true
    if (status === 'inactive') return !row.active
    return row.status === status
  })
  const list = useAdminList(baseRows, matches)

  function act() {
    if (!pending) return
    if (pending.type === 'quizmaster') {
      setRows((current) => current.map((row) => (row.id === pending.row.id ? { ...row, role: 'quizmaster' as const } : row)))
      push({ tone: 'success', title: 'Quizmaster role granted', description: `${pending.row.name} can create warmups.` })
    }
    if (pending.type === 'demote') {
      setRows((current) => current.map((row) => (row.id === pending.row.id ? { ...row, role: 'student' as const } : row)))
      push({ tone: 'info', title: 'Quizmaster role removed', description: `${pending.row.name} keeps member access.` })
    }
    if (pending.type === 'toggle') {
      setRows((current) => current.map((row) => (row.id === pending.row.id ? { ...row, active: !row.active } : row)))
      push({ tone: 'info', title: pending.row.active ? 'Member access suspended' : 'Member access restored', description: `${pending.row.name} — no production record changed.` })
    }
  }

  return (
    <>
      <PageHeader
        title="Members"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Members' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Download className="h-3.5 w-3.5" />}
              onClick={() => {
                const okay = downloadCsv(
                  'kiut-digital-club-members.csv',
                  rows.map((row) => ({ Member: row.name, Email: row.email, MemberID: row.memberId, Course: row.course, Year: row.year, Status: row.status, Active: row.active, Points: row.points })),
                )
                push({ tone: okay ? 'success' : 'error', title: okay ? 'CSV downloaded' : 'Nothing to export' })
              }}
            >
              Export CSV
            </Button>
            <ButtonLink to="/admin/member-ids" size="sm">Member IDs</ButtonLink>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Members" value={rows.length} hint="Excludes administrators" tone="brand" />
        <SmallStat label="Active access" value={rows.filter((row) => row.active).length} hint="Can sign in" />
        <SmallStat label="Alumni" value={rows.filter((row) => row.status === 'alumni').length} hint="Retained records" />
        <SmallStat label="Quizmasters" value={rows.filter((row) => row.role === 'quizmaster').length} hint="Warmup access" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search members by name, ID or course…" count={`${list.total} members`}>
          <FilterChips
            label="Member status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'student', label: 'Students' },
              { value: 'alumni', label: 'Alumni' },
              { value: 'inactive', label: 'No access', count: rows.filter((row) => !row.active).length },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} members` }}
          emptyTitle="No members match these filters"
          emptyDescription="Clear the search or choose a different status."
          columns={[
            {
              id: 'name',
              header: 'Member',
              sortValue: (row) => row.name,
              cell: (row) => (
                <Link to={`/admin/members/${row.id}`} className="group block">
                  <p className="font-medium text-ink-900 group-hover:text-brand-800">{row.name}</p>
                  <p className="text-[0.6875rem] text-ink-400">{row.email}</p>
                </Link>
              ),
            },
            { id: 'id', header: 'Member ID', cell: (row) => <span className="font-mono text-[0.75rem] text-ink-500">{row.memberId}</span> },
            {
              id: 'course',
              header: 'Course',
              sortValue: (row) => row.course,
              cell: (row) => (
                <div>
                  <p className="text-ink-700">{row.course}</p>
                  <p className="text-[0.6875rem] text-ink-400">{row.year}</p>
                </div>
              ),
            },
            { id: 'points', header: 'Points', align: 'right', sortValue: (row) => row.points, cell: (row) => <span className="font-semibold tabular">{row.points}</span> },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => (
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone={row.status === 'alumni' ? 'outline' : 'green'}>{row.status}</Badge>
                  {!row.active ? <Badge tone="red">no access</Badge> : null}
                  {row.role === 'quizmaster' ? <Badge tone="outline">quizmaster</Badge> : null}
                </div>
              ),
            },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.name}`}>
                  <DropdownItem to={`/admin/members/${row.id}`} icon={<Eye className="h-3.5 w-3.5" />}>Open record</DropdownItem>
                  {row.role === 'quizmaster' ? (
                    <DropdownItem icon={<ShieldOff className="h-3.5 w-3.5" />} onSelect={() => setPending({ type: 'demote', row })}>Remove quizmaster</DropdownItem>
                  ) : (
                    <DropdownItem icon={<ShieldCheck className="h-3.5 w-3.5" />} onSelect={() => setPending({ type: 'quizmaster', row })}>Make quizmaster</DropdownItem>
                  )}
                  <DropdownItem icon={<UserMinus className="h-3.5 w-3.5" />} destructive onSelect={() => setPending({ type: 'toggle', row })}>
                    {row.active ? 'Suspend access' : 'Restore access'}
                  </DropdownItem>
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <DemoNotice />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.type === 'quizmaster' ? 'Grant quizmaster role?' : pending?.type === 'demote' ? 'Remove quizmaster role?' : pending?.row.active ? 'Suspend member access?' : 'Restore member access?'}
        description={
          pending?.type === 'toggle'
            ? 'Access changes take effect immediately. The member keeps their records either way.'
            : 'Roles control access to the quizmaster workspace.'
        }
        confirmLabel={pending?.type === 'quizmaster' ? 'Grant role' : pending?.type === 'demote' ? 'Remove role' : pending?.row.active ? 'Suspend' : 'Restore'}
        destructive={pending?.type === 'demote' || (pending?.type === 'toggle' && pending.row.active)}
        onConfirm={act}
      />
    </>
  )
}

export function AdminMemberDetail() {
  const { id } = useParams()
  const member = demoUsers.find((row) => String(row.id) === id)
  const { push } = useToast()
  const [confirm, setConfirm] = useState<'demote' | 'delete' | null>(null)
  const memberIdRecord = demoMemberIds.find((record) => record.name === member?.name)

  if (!member) {
    return (
      <>
        <PageHeader title="Member not found" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Members', to: '/admin/members' }]} />
        <Card><div className="p-4"><EmptyState title="This member record is unavailable" description="The record may have been removed. Return to the directory to choose another member." action={<ButtonLink to="/admin/members" size="sm">Back to members</ButtonLink>} /></div></Card>
      </>
    )
  }

  const payments = demoPayments.filter((payment) => payment.member === member.name)
  const isDemoMember = member.name === 'Amina Juma'

  return (
    <>
      <Link to="/admin/members" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Members
      </Link>
      <PageHeader
        title={member.name}
        description={`${member.course} · ${member.year}`}
        badge={<Badge tone={member.active ? 'green' : 'red'}>{member.active ? 'Active access' : 'No access'}</Badge>}
        actions={
          <>
            <ButtonLink to={`/verify-id/${member.memberId}`} variant="outline" size="sm">Verify digital ID</ButtonLink>
            <Button variant="outline" size="sm" onClick={() => setConfirm('demote')}>Account actions</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Profile" description="Information supplied by the member" />
            <div className="p-4">
              <DetailList
                items={[
                  { label: 'Member ID', value: <span className="font-mono">{member.memberId}</span> },
                  { label: 'Email', value: member.email },
                  { label: 'Course', value: member.course },
                  { label: 'Year of study', value: member.year },
                  { label: 'Member since', value: formatDate(member.joined) },
                  { label: 'Points balance', value: <span className="tabular">{member.points}</span> },
                  { label: 'Quizmaster', value: member.role === 'quizmaster' ? 'Yes' : 'No' },
                  { label: 'Digital ID', value: memberIdRecord ? <Badge tone="green">{memberIdRecord.active ? 'Active' : 'Inactive'}</Badge> : <Badge tone="outline">Not issued</Badge> },
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Projects" description="Projects submitted by this member" action={<Badge tone="outline">{isDemoMember ? demoMemberProjects.length : 0}</Badge>} />
            {isDemoMember ? (
              <TableWrap>
                <THead><TR><TH>Project</TH><TH>Technologies</TH><TH>Visibility</TH><TH>Status</TH><TH>Updated</TH></TR></THead>
                <TBody>
                  {demoMemberProjects.map((project) => (
                    <TR key={project.id}>
                      <TD className="font-medium text-ink-900">{project.title}</TD>
                      <TD className="max-w-[220px] text-ink-500">{project.technologies}</TD>
                      <TD><Badge tone="outline">{project.visibility}</Badge></TD>
                      <TD><StatusBadge status={project.status} /></TD>
                      <TD className="whitespace-nowrap text-ink-500">{formatDate(project.updated)}</TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            ) : (
              <div className="p-4"><EmptyState compact title="No projects recorded" description="This member has not submitted a project yet." /></div>
            )}
          </Card>

          <Card>
            <CardHeader title="Points history" description="Latest recorded transactions" />
            {isDemoMember ? (
              <TableWrap>
                <THead><TR><TH>Date</TH><TH>Reason</TH><TH>Type</TH><TH className="text-right">Points</TH></TR></THead>
                <TBody>
                  {demoRewardHistory.slice(0, 5).map((entry) => (
                    <TR key={entry.id}>
                      <TD className="whitespace-nowrap text-ink-500">{formatDate(entry.date)}</TD>
                      <TD>{entry.reason}</TD>
                      <TD><Badge tone="outline">{entry.type}</Badge></TD>
                      <TD className="text-right font-semibold tabular text-brand-700">+{entry.points}</TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            ) : (
              <div className="p-4"><EmptyState compact title="No points transactions" description="Points awarded to this member will appear here." /></div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Account" description="Access and identity" />
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.75rem] text-ink-500">Access</p>
                <Badge tone={member.active ? 'green' : 'red'}>{member.active ? 'Can sign in' : 'Suspended'}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.75rem] text-ink-500">Registration</p>
                <Badge tone="green">Automatic</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.75rem] text-ink-500">Role</p>
                <span className="text-[0.75rem] font-medium capitalize text-ink-900">{member.role}</span>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                <Button variant="outline" size="sm" iconLeft={<ShieldCheck className="h-3.5 w-3.5" />} onClick={() => push({ tone: 'info', title: 'Role change is available from the record page', description: 'Use the member directory to grant or remove the quizmaster role.' })}>
                  Manage role
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirm('delete')}>Delete account</Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Membership payments" description="Recorded membership fees" action={<ButtonLink to="/admin/payments" variant="ghost" size="sm">Payments</ButtonLink>} />
            {payments.length ? (
              <ul className="divide-y divide-line">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-[0.8125rem] font-medium text-ink-900">{formatDate(payment.date)}</p>
                      <p className="text-[0.6875rem] text-ink-400">{payment.method} · {payment.period}</p>
                    </div>
                    <p className="text-[0.8125rem] font-semibold tabular text-ink-900">TZS {payment.amount.toLocaleString('en-US')}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4"><EmptyState compact icon={<UserRound className="h-4 w-4" aria-hidden />} title="No payments recorded" description="Membership payments are recorded from the payments page." /></div>
            )}
          </Card>

          <Alert tone="info" title="Deleting an account">
            Account deletion is permanent and requires administrator confirmation.
          </Alert>
        </div>
      </div>

      <DemoNotice />

      <ConfirmDialog
        open={confirm === 'delete'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Delete this member account?"
        description={`${member.name}'s account and personal data would be permanently removed. This cannot be undone.`}
        confirmLabel="Delete account"
        onConfirm={() => push({ tone: 'info', title: 'Deletion is not performed', description: 'No account was removed.' })}
      />
      <ConfirmDialog
        open={confirm === 'demote'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Account actions are limited here"
        description="Use the members directory for role and access changes, and the payments page for membership records."
        confirmLabel="Close"
        destructive={false}
        onConfirm={() => undefined}
      />
    </>
  )
}

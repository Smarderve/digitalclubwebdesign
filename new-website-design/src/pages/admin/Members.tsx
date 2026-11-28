import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Eye, RefreshCw, ShieldCheck, ShieldOff, UserMinus, UserRound } from 'lucide-react'
import { PageHeader } from '../../components/app/primitives'
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  ConfirmDialog,
  DetailList,
  Dialog,
  DialogContent,
  EmptyState,
  Field,
  Input,
  StatusBadge,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '../../components/ui'
import {
  AdminTable,
  AdminToolbar,
  FilterChips,
  RowActions,
  DropdownItem,
  SmallStat,
  StatStrip,
  downloadCsv,
  useAdminList,
} from './_shared'
import { useToast } from '../../context/ToastContext'
import { apiRequest, ApiError } from '../../lib/api'
import { formatDate } from '../../lib/utils'

type Role = 'student' | 'quizmaster' | 'admin'

type AdminMember = {
  user_id: number
  member_id: number | null
  email: string
  display_name: string | null
  course: string | null
  year: string | null
  student_status: string | null
  role: Role
  is_approved: boolean
  is_active: boolean
  is_super_admin: boolean
  member_number: string | null
  avatar_url: string | null
  registered_at: string | null
}

type AdminMemberDetail = AdminMember & {
  membership: { state: string; valid_from: string | null; valid_until: string | null } | null
  points: { total: number; rank: number } | null
  counts: { projects: number; reward_transactions: number } | null
  privacy: Record<string, unknown> | null
}

function errorText(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'The request could not be completed. Check your connection and try again.'
}

async function patchMember(userId: number, body: Record<string, unknown>) {
  return apiRequest<AdminMember>(`/admin/members/${userId}`, { method: 'PATCH', body })
}

export function AdminMembers() {
  const [rows, setRows] = useState<AdminMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'all' | 'student' | 'alumni' | 'inactive'>('all')
  const [pending, setPending] = useState<
    { type: 'role'; row: AdminMember; role: 'student' | 'quizmaster' } | { type: 'access'; row: AdminMember } | null
  >(null)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const { push } = useToast()

  const load = useCallback(async () => {
    setError(null)
    setRows(null)
    try {
      const data = await apiRequest<AdminMember[]>('/admin/members?per_page=100&role=any')
      setRows(data.filter((row) => row.role !== 'admin'))
    } catch (problem) {
      setError(errorText(problem))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const directory = rows ?? []
  const matches = useCallback(
    (row: AdminMember, query: string) =>
      `${row.display_name ?? ''} ${row.email} ${row.course ?? ''} ${row.member_number ?? ''} ${row.year ?? ''}`
        .toLowerCase()
        .includes(query),
    [],
  )
  const baseRows = directory.filter((row) => {
    if (status === 'all') return true
    if (status === 'inactive') return !row.is_active
    return row.student_status === status
  })
  const list = useAdminList(baseRows, matches)

  async function apply() {
    if (!pending) return
    setSaving(true)
    try {
      const updated =
        pending.type === 'role'
          ? await patchMember(pending.row.user_id, { role: pending.role })
          : await patchMember(pending.row.user_id, {
              is_active: !pending.row.is_active,
              password,
            })
      setRows((current) => current?.map((row) => (row.user_id === updated.user_id ? { ...row, ...updated } : row)) ?? current)
      push({
        tone: 'success',
        title:
          pending.type === 'role'
            ? pending.role === 'quizmaster'
              ? 'Quizmaster role granted'
              : 'Quizmaster role removed'
            : updated.is_active
              ? 'Member access restored'
              : 'Member access suspended',
        description: `${updated.display_name ?? updated.email} — saved by the server.`,
      })
      setPending(null)
      setPassword('')
    } catch (problem) {
      push({ tone: 'error', title: 'Change not saved', description: errorText(problem) })
    } finally {
      setSaving(false)
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
              disabled={!rows}
              onClick={() => {
                const okay = downloadCsv(
                  'kiut-digital-club-members.csv',
                  directory.map((row) => ({
                    Member: row.display_name ?? '',
                    Email: row.email,
                    MemberID: row.member_number ?? '',
                    Course: row.course ?? '',
                    Year: row.year ?? '',
                    Status: row.student_status ?? '',
                    Role: row.role,
                    Access: row.is_active ? 'Active' : 'Suspended',
                    Joined: row.registered_at ?? '',
                  })),
                )
                push({ tone: okay ? 'success' : 'error', title: okay ? 'CSV downloaded' : 'Nothing to export' })
              }}
            >
              Export CSV
            </Button>
            <ButtonLink to="/admin/member-ids" size="sm">
              Member IDs
            </ButtonLink>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Members" value={rows ? directory.length : '—'} hint="Excludes administrators" tone="brand" />
        <SmallStat label="Active access" value={rows ? directory.filter((row) => row.is_active).length : '—'} hint="Can sign in" />
        <SmallStat
          label="Alumni"
          value={rows ? directory.filter((row) => row.student_status === 'alumni').length : '—'}
          hint="Retained records"
        />
        <SmallStat
          label="Quizmasters"
          value={rows ? directory.filter((row) => row.role === 'quizmaster').length : '—'}
          hint="Warmup access"
        />
      </StatStrip>

      {error ? (
        <Alert
          tone="danger"
          title="Members could not be loaded"
          className="mt-4"
          action={
            <Button variant="outline" size="sm" iconLeft={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <Card className="mt-4">
        <AdminToolbar
          query={list.query}
          onQuery={list.setQuery}
          placeholder="Search members by name, ID or course…"
          count={rows ? `${list.total} members` : 'Loading…'}
        >
          <FilterChips
            label="Member status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'student', label: 'Students' },
              { value: 'alumni', label: 'Alumni' },
              { value: 'inactive', label: 'No access', count: directory.filter((row) => !row.is_active).length },
            ]}
          />
        </AdminToolbar>
        {rows === null && !error ? (
          <div className="px-4 py-10 text-center text-[0.8125rem] text-ink-500">Loading members from the club database…</div>
        ) : (
          <AdminTable
            rows={list.visible}
            keyOf={(row) => row.user_id}
            pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} members` }}
            emptyTitle="No members match these filters"
            emptyDescription={rows && rows.length ? 'Clear the search or choose a different status.' : 'No member records exist yet.'}
            columns={[
              {
                id: 'name',
                header: 'Member',
                sortValue: (row) => row.display_name ?? row.email,
                cell: (row) => (
                  <Link to={`/admin/members/${row.user_id}`} className="group block">
                    <p className="font-medium text-ink-900 group-hover:text-brand-800">{row.display_name ?? 'No profile name'}</p>
                    <p className="text-[0.6875rem] text-ink-400">{row.email}</p>
                  </Link>
                ),
              },
              {
                id: 'id',
                header: 'Member ID',
                cell: (row) => <span className="font-mono text-[0.75rem] text-ink-500">{row.member_number ?? '—'}</span>,
              },
              {
                id: 'course',
                header: 'Course',
                sortValue: (row) => row.course ?? '',
                cell: (row) => (
                  <div>
                    <p className="text-ink-700">{row.course ?? '—'}</p>
                    <p className="text-[0.6875rem] text-ink-400">{row.year ?? ''}</p>
                  </div>
                ),
              },
              {
                id: 'joined',
                header: 'Joined',
                align: 'right',
                sortValue: (row) => row.registered_at ?? '',
                cell: (row) => <span className="whitespace-nowrap text-ink-500">{row.registered_at ? formatDate(row.registered_at) : '—'}</span>,
              },
              {
                id: 'status',
                header: 'Status',
                cell: (row) => (
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge tone={row.student_status === 'alumni' ? 'outline' : 'green'}>{row.student_status ?? 'member'}</Badge>
                    {!row.is_active ? <Badge tone="red">no access</Badge> : null}
                    {row.role === 'quizmaster' ? <Badge tone="outline">quizmaster</Badge> : null}
                  </div>
                ),
              },
              {
                id: 'actions',
                header: '',
                align: 'right',
                cell: (row) => (
                  <RowActions label={`Actions for ${row.display_name ?? row.email}`}>
                    <DropdownItem to={`/admin/members/${row.user_id}`} icon={<Eye className="h-3.5 w-3.5" />}>
                      Open record
                    </DropdownItem>
                    {row.role === 'quizmaster' ? (
                      <DropdownItem icon={<ShieldOff className="h-3.5 w-3.5" />} onSelect={() => setPending({ type: 'role', row, role: 'student' })}>
                        Remove quizmaster
                      </DropdownItem>
                    ) : (
                      <DropdownItem icon={<ShieldCheck className="h-3.5 w-3.5" />} onSelect={() => setPending({ type: 'role', row, role: 'quizmaster' })}>
                        Make quizmaster
                      </DropdownItem>
                    )}
                    <DropdownItem icon={<UserMinus className="h-3.5 w-3.5" />} destructive onSelect={() => setPending({ type: 'access', row })}>
                      {row.is_active ? 'Suspend access' : 'Restore access'}
                    </DropdownItem>
                  </RowActions>
                ),
              },
            ]}
          />
        )}
      </Card>

      <ConfirmDialog
        open={pending?.type === 'role'}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.type === 'role' && pending.role === 'quizmaster' ? 'Grant quizmaster role?' : 'Remove quizmaster role?'}
        description="Roles control access to the quizmaster workspace. The change is saved on the server."
        confirmLabel={pending?.type === 'role' && pending.role === 'quizmaster' ? 'Grant role' : 'Remove role'}
        destructive={pending?.type === 'role' && pending.role === 'student'}
        onConfirm={() => void apply()}
      />

      <Dialog
        open={pending?.type === 'access'}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null)
            setPassword('')
          }
        }}
      >
        <DialogContent
          title={pending?.type === 'access' && pending.row.is_active ? 'Suspend member access?' : 'Restore member access?'}
          description="Access changes take effect immediately. Confirm with your administrator password."
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} disabled={!password} onClick={() => void apply()}>
                {pending?.type === 'access' && pending.row.is_active ? 'Suspend' : 'Restore'}
              </Button>
            </>
          }
        >
          <Field label="Your password" htmlFor="admin-access-password" required hint="Checked by the server; never stored in the browser.">
            <Input
              id="admin-access-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AdminMemberDetail() {
  const { id } = useParams()
  const userId = Number(id)
  const [member, setMember] = useState<AdminMemberDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'role' | 'access' | null>(null)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const { push } = useToast()

  const load = useCallback(async () => {
    setError(null)
    setMember(null)
    try {
      setMember(await apiRequest<AdminMemberDetail>(`/admin/members/${userId}`))
    } catch (problem) {
      setError(errorText(problem))
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  async function apply() {
    if (!member || !confirm) return
    setSaving(true)
    try {
      const updated =
        confirm === 'role'
          ? await patchMember(member.user_id, { role: member.role === 'quizmaster' ? 'student' : 'quizmaster' })
          : await patchMember(member.user_id, { is_active: !member.is_active, password })
      setMember((current) => (current ? { ...current, ...updated } : current))
      push({ tone: 'success', title: 'Member updated', description: 'The change was saved by the server.' })
      setConfirm(null)
      setPassword('')
    } catch (problem) {
      push({ tone: 'error', title: 'Change not saved', description: errorText(problem) })
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <>
        <PageHeader title="Member record" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Members', to: '/admin/members' }]} />
        <Card>
          <div className="p-4">
            <EmptyState
              title="This member record could not be loaded"
              description={error}
              action={
                <Button variant="outline" size="sm" onClick={() => void load()}>
                  Try again
                </Button>
              }
            />
          </div>
        </Card>
      </>
    )
  }

  if (!member) {
    return (
      <>
        <PageHeader title="Member record" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Members', to: '/admin/members' }]} />
        <Card>
          <div className="px-4 py-10 text-center text-[0.8125rem] text-ink-500">Loading the member record…</div>
        </Card>
      </>
    )
  }

  return (
    <>
      <Link to="/admin/members" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Members
      </Link>
      <PageHeader
        title={member.display_name ?? member.email}
        description={[member.course, member.year].filter(Boolean).join(' · ') || undefined}
        badge={<Badge tone={member.is_active ? 'green' : 'red'}>{member.is_active ? 'Active access' : 'No access'}</Badge>}
        actions={
          <>
            {member.member_number ? (
              <ButtonLink to={`/verify-id/${member.member_number}`} variant="outline" size="sm">
                Verify digital ID
              </ButtonLink>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => setConfirm('role')}>
              {member.role === 'quizmaster' ? 'Remove quizmaster' : 'Make quizmaster'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirm('access')}>
              {member.is_active ? 'Suspend access' : 'Restore access'}
            </Button>
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
                  { label: 'Member ID', value: <span className="font-mono">{member.member_number ?? 'Not issued'}</span> },
                  { label: 'Email', value: member.email },
                  { label: 'Course', value: member.course ?? '—' },
                  { label: 'Year of study', value: member.year ?? '—' },
                  { label: 'Member since', value: member.registered_at ? formatDate(member.registered_at) : '—' },
                  { label: 'Points balance', value: <span className="tabular">{member.points?.total ?? '—'}</span> },
                  { label: 'Rank', value: <span className="tabular">{member.points?.rank ?? '—'}</span> },
                  { label: 'Quizmaster', value: member.role === 'quizmaster' ? 'Yes' : 'No' },
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Projects"
              description="Submitted by this member"
              action={<Badge tone="outline">{member.counts?.projects ?? 0}</Badge>}
            />
            {member.counts?.projects ? (
              <div className="px-4 py-6 text-[0.8125rem] text-ink-600">
                {member.counts.projects} project{member.counts.projects === 1 ? '' : 's'} recorded. The project list is
                shown in the projects area and the member portal.
              </div>
            ) : (
              <div className="p-4">
                <EmptyState compact title="No projects recorded" description="This member has not submitted a project yet." />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Points history" description="Latest recorded transactions" />
            <div className="px-4 py-6 text-[0.8125rem] text-ink-600">
              {member.counts?.reward_transactions
                ? `${member.counts.reward_transactions} points transactions recorded. The full ledger is available on the rewards page.`
                : 'No points transactions recorded for this member.'}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Account" description="Access and identity" />
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.75rem] text-ink-500">Access</p>
                <Badge tone={member.is_active ? 'green' : 'red'}>{member.is_active ? 'Can sign in' : 'Suspended'}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.75rem] text-ink-500">Registration</p>
                <Badge tone="green">Automatic</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.75rem] text-ink-500">Role</p>
                <span className="text-[0.75rem] font-medium capitalize text-ink-900">{member.role}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.75rem] text-ink-500">Membership</p>
                <StatusBadge status={member.membership?.state ?? 'none'} />
              </div>
              {member.membership?.valid_until ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.75rem] text-ink-500">Valid until</p>
                  <span className="text-[0.75rem] text-ink-700">{formatDate(member.membership.valid_until)}</span>
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Membership payments"
              description="Recorded membership fees"
              action={
                <ButtonLink to="/admin/payments" variant="ghost" size="sm">
                  Payments
                </ButtonLink>
              }
            />
            <div className="p-4">
              <EmptyState
                compact
                icon={<UserRound className="h-4 w-4" aria-hidden />}
                title="Payment records are not exposed here yet"
                description="The payments page is still being connected to the club database. No payment totals are shown rather than guessed."
              />
            </div>
          </Card>

          <Alert tone="info" title="Deleting an account">
            Account deletion is not available in this portal. It stays on the original administration screens, where the
            server performs the guarded removal.
          </Alert>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'role'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={member.role === 'quizmaster' ? 'Remove quizmaster role?' : 'Grant quizmaster role?'}
        description="The change is saved on the server and takes effect immediately."
        confirmLabel={member.role === 'quizmaster' ? 'Remove role' : 'Grant role'}
        destructive={member.role === 'quizmaster'}
        onConfirm={() => void apply()}
      />

      <Dialog open={confirm === 'access'} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent
          title={member.is_active ? 'Suspend member access?' : 'Restore member access?'}
          description="Confirm with your administrator password."
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} disabled={!password} onClick={() => void apply()}>
                {member.is_active ? 'Suspend' : 'Restore'}
              </Button>
            </>
          }
        >
          <Field label="Your password" htmlFor="detail-access-password" required hint="Checked by the server; never stored in the browser.">
            <Input
              id="detail-access-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        </DialogContent>
      </Dialog>
    </>
  )
}

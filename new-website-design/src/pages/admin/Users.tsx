import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Eye, ShieldCheck, UserX, X } from 'lucide-react'
import { demoUsers } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, Card, CardHeader, ConfirmDialog, Field, Select, StatusBadge, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type Row = (typeof demoUsers)[number]

export function AdminUsers() {
  const [rows, setRows] = useState<Row[]>(demoUsers)
  const [tab, setTab] = useState('pending')
  const [mode, setMode] = useState('manual')
  const [pendingAction, setPendingAction] = useState<{ type: 'approve' | 'reject'; row: Row } | null>(null)
  const { push } = useToast()

  const pending = rows.filter((row) => !row.approved)
  const matches = useCallback((row: Row, query: string) => `${row.name} ${row.email} ${row.course} ${row.memberId}`.toLowerCase().includes(query), [])
  const list = useAdminList(rows, matches)

  function decide() {
    if (!pendingAction) return
    setRows((current) =>
      current.map((row) =>
        row.id === pendingAction.row.id ? { ...row, approved: pendingAction.type === 'approve', active: pendingAction.type === 'approve' } : row,
      ),
    )
    push({
      tone: pendingAction.type === 'approve' ? 'success' : 'info',
      title: pendingAction.type === 'approve' ? 'Registration approved in the prototype' : 'Registration rejected in the prototype',
      description: `${pendingAction.row.name} — no production account was changed and no email was sent.`,
    })
  }

  return (
    <>
      <PageHeader
        title="Users and registration"
        description="Review new registrations, manage approval mode and see who currently has access to the member area."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Users' }]}
        actions={<Button variant="outline" size="sm" onClick={() => push({ tone: 'info', title: 'Invite link copied (prototype)', description: 'In the live system this opens the registration route.' })}>Registration link</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList ariaLabel="User lists">
              <TabsTrigger value="pending">Awaiting approval ({pending.length})</TabsTrigger>
              <TabsTrigger value="all">All users ({rows.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={tab}>
              <Card className="mt-4">
                <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search by name, email or course…" count={`${list.total} records`} />
                <AdminTable
                  rows={tab === 'pending' ? list.filtered.filter((row) => !row.approved) : list.visible}
                  keyOf={(row) => row.id}
                  pagination={
                    tab === 'all'
                      ? { page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} users` }
                      : undefined
                  }
                  emptyTitle={tab === 'pending' ? 'No registrations waiting' : 'No users match that search'}
                  emptyDescription={tab === 'pending' ? 'New registrations will appear here for review.' : 'Try another name or clear the search.'}
                  columns={[
                    {
                      id: 'name',
                      header: 'User',
                      sortValue: (row) => row.name,
                      cell: (row) => (
                        <div>
                          <p className="font-medium text-ink-900">{row.name}</p>
                          <p className="text-[0.6875rem] text-ink-400">{row.email}</p>
                        </div>
                      ),
                    },
                    { id: 'memberId', header: 'Member ID', cell: (row) => <span className="font-mono text-[0.75rem] text-ink-500">{row.memberId}</span> },
                    { id: 'course', header: 'Course', cell: (row) => <span className="text-ink-500">{row.course}</span> },
                    { id: 'joined', header: 'Registered', sortValue: (row) => row.joined, cell: (row) => <span className="whitespace-nowrap text-ink-500">{formatDate(row.joined)}</span> },
                    {
                      id: 'status',
                      header: 'Status',
                      cell: (row) => (
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge status={row.approved ? 'approved' : 'pending'} />
                          {row.role !== 'student' ? <Badge tone="outline">{row.role}</Badge> : null}
                        </div>
                      ),
                    },
                    {
                      id: 'actions',
                      header: '',
                      align: 'right',
                      cell: (row) =>
                        !row.approved ? (
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setPendingAction({ type: 'approve', row })}
                              aria-label={`Approve ${row.name}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingAction({ type: 'reject', row })}
                              aria-label={`Reject ${row.name}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] border border-line text-ink-500 hover:bg-[#FEF3F2] hover:text-danger"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </div>
                        ) : (
                          <RowActions>
                            <DropdownItem to="/admin/members" icon={<Eye className="h-3.5 w-3.5" />}>Open member record</DropdownItem>
                            <DropdownItem
                              icon={<UserX className="h-3.5 w-3.5" />}
                              destructive
                              onSelect={() => push({ tone: 'info', title: 'Account suspension is a prototype action', description: 'Member records are managed from the members page.' })}
                            >
                              Suspend access
                            </DropdownItem>
                          </RowActions>
                        ),
                    },
                  ]}
                />
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-4 rounded-lg border border-line bg-white p-4">
            <p className="text-[0.8125rem] font-semibold text-ink-900">How registration works</p>
            <ol className="mt-2 space-y-1.5 text-[0.75rem] leading-5 text-ink-500">
              <li>1. A student registers with their KIUT email and course details.</li>
              <li>2. The account sits in the approval queue and cannot sign in.</li>
              <li>3. An administrator approves or rejects the registration.</li>
              <li>4. Approved members complete their profile and can join teams, competitions and elections.</li>
            </ol>
            <p className="mt-2 text-[0.75rem] leading-5 text-ink-500">
              Passwords are handled by the live application; this console never displays or edits them.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Approval mode" description="Controls whether registrations need review" />
            <div className="space-y-3 p-4">
              <Field label="New registrations" htmlFor="approval-mode" hint="Automatic approval is not recommended while the club is onboarding at scale.">
                <Select
                  id="approval-mode"
                  value={mode}
                  onChange={(event) => {
                    setMode(event.target.value)
                    push({
                      tone: 'info',
                      title: `Approval mode set to ${event.target.value} (prototype)`,
                      description: 'The live setting is saved server-side by an administrator.',
                    })
                  }}
                >
                  <option value="manual">Manual review</option>
                  <option value="auto">Automatic approval</option>
                </Select>
              </Field>
              <div className="rounded-md border border-line bg-canvas/50 p-3">
                <p className="text-[0.75rem] leading-5 text-ink-500">
                  {mode === 'manual'
                    ? 'New accounts wait for an administrator. Members cannot access the dashboard until approved.'
                    : 'New accounts are approved immediately. Use this only during a supervised onboarding window.'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Roles in this system" description="Access is controlled by role, not by the sidebar" />
            <dl className="divide-y divide-line px-4">
              {[
                { role: 'Member', detail: 'Dashboard, projects, events, competitions, elections and warmups.' },
                { role: 'Quizmaster', detail: 'Creates and publishes warmups; also has member access.' },
                { role: 'Administrator', detail: 'Full operations, content, finance and member management.' },
              ].map((item) => (
                <div key={item.role} className="py-3">
                  <dt className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-900">
                    <ShieldCheck className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                    {item.role}
                  </dt>
                  <dd className="mt-0.5 text-[0.75rem] leading-5 text-ink-500">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Alert tone="info" title="Email delivery">
            Approval emails are sent by the live application. This prototype does not send email and does not create accounts.
          </Alert>
        </div>
      </div>

      <DemoNotice />

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction?.type === 'approve' ? 'Approve this registration?' : 'Reject this registration?'}
        description={
          pendingAction?.type === 'approve'
            ? `${pendingAction?.row.name} will be able to sign in and use the member area. No email is sent from the prototype.`
            : `${pendingAction?.row.name} will not be able to sign in. The registration record stays available for review.`
        }
        confirmLabel={pendingAction?.type === 'approve' ? 'Approve' : 'Reject'}
        destructive={pendingAction?.type === 'reject'}
        onConfirm={decide}
      />
    </>
  )
}

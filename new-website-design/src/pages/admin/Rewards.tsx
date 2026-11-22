import { useCallback, useState } from 'react'
import { Award, Pencil, Plus, Trash2 } from 'lucide-react'
import { demoAdminMembers, demoAdminTrophies, demoRewardHistory } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, Dialog, DialogContent, Field, Input, Select, Textarea } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, DropdownItem, RowActions, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type Transaction = { id: number; member: string; points: number; reason: string; type: string; date: string }

const initialTransactions: Transaction[] = [
  ...demoRewardHistory.map((row) => ({ ...row, member: 'Amina Juma' })),
  { id: 101, member: 'Joseph Mtei', points: 150, reason: '1st place — Weekly Challenge 06: Graph Traversal', type: 'Competition', date: '2026-11-22' },
  { id: 102, member: 'Halima Nyoni', points: 50, reason: '3rd place — Weekly Challenge 05: Dynamic Programming', type: 'Competition', date: '2026-11-16' },
  { id: 103, member: 'Grace Emmanuel', points: 25, reason: 'Workshop attendance — Git & GitHub', type: 'Event', date: '2026-11-08' },
]

export function AdminRewards() {
  const [rows, setRows] = useState(initialTransactions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ member: '', points: '', reason: '', type: 'Manual' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { push } = useToast()

  const matches = useCallback((row: Transaction, query: string) => `${row.member} ${row.reason} ${row.type}`.toLowerCase().includes(query), [])
  const list = useAdminList(rows, matches)
  const awarded = rows.reduce((sum, row) => sum + row.points, 0)

  return (
    <>
      <PageHeader
        title="Points and rewards"
        description="Record points transactions and manage the trophies members can earn. Points feed the club rankings."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Rewards' }]}
        actions={
          <>
            <ButtonLink to="/admin/rewards/trophies" variant="outline" size="sm" iconLeft={<Award className="h-3.5 w-3.5" />}>Trophies</ButtonLink>
            <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => setDialogOpen(true)}>Add points</Button>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Points awarded" value={awarded} hint="Demonstration ledger" tone="brand" />
        <SmallStat label="Transactions" value={rows.length} hint="All members" />
        <SmallStat label="Members with points" value={new Set(rows.map((row) => row.member)).size} hint="This period" />
        <SmallStat label="Trophies" value={demoAdminTrophies.length} hint="Trophy definitions" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search by member, reason or type…" count={`${list.total} transactions`} />
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} transactions` }}
          emptyTitle="No points transactions"
          emptyDescription="Manual and competition points will appear here."
          columns={[
            { id: 'member', header: 'Member', sortValue: (row) => row.member, cell: (row) => <span className="font-medium text-ink-900">{row.member}</span> },
            { id: 'reason', header: 'Reason', cell: (row) => <span className="text-ink-600">{row.reason}</span> },
            { id: 'type', header: 'Type', cell: (row) => <Badge tone="outline">{row.type}</Badge> },
            { id: 'date', header: 'Date', sortValue: (row) => row.date, cell: (row) => <span className="whitespace-nowrap text-ink-500">{formatDate(row.date)}</span> },
            { id: 'points', header: 'Points', align: 'right', sortValue: (row) => row.points, cell: (row) => <span className="font-semibold tabular text-brand-700">+{row.points}</span> },
          ]}
        />
      </Card>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Only administrators may add points. Competition results normally award points automatically when a competition is finalised; manual points
        should include a clear reason for audit.
      </p>
      <DemoNotice />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title="Add points"
          description="Award or correct points for a member. This creates a new ledger entry."
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  const next: Record<string, string> = {}
                  if (!form.member) next.member = 'Choose a member.'
                  if (!form.points || Number(form.points) === 0) next.points = 'Enter a non-zero number of points.'
                  if (form.reason.trim().length < 8) next.reason = 'Explain why the points are being awarded.'
                  setErrors(next)
                  if (Object.keys(next).length) return
                  setRows((current) => [
                    { id: Math.max(...current.map((row) => row.id)) + 1, member: form.member, points: Number(form.points), reason: form.reason, type: form.type, date: new Date().toISOString().slice(0, 10) },
                    ...current,
                  ])
                  setDialogOpen(false)
                  setForm({ member: '', points: '', reason: '', type: 'Manual' })
                  push({ tone: 'success', title: 'Points transaction added in the prototype', description: 'No production ledger was changed.' })
                }}
              >
                Add points
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Member" htmlFor="points-member" required error={errors.member}>
              <Select id="points-member" value={form.member} onChange={(event) => setForm({ ...form, member: event.target.value })}>
                <option value="">Choose a member</option>
                {demoAdminMembers.map((member) => (
                  <option key={member.id} value={member.name}>{member.name} · {member.memberId}</option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Points" htmlFor="points-amount" required error={errors.points} hint="Use a negative value to correct a mistake.">
                <Input id="points-amount" type="number" value={form.points} onChange={(event) => setForm({ ...form, points: event.target.value })} placeholder="e.g. 50" />
              </Field>
              <Field label="Type" htmlFor="points-type">
                <Select id="points-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  <option>Manual</option>
                  <option>Competition</option>
                  <option>Event</option>
                  <option>Warmup</option>
                  <option>Contribution</option>
                </Select>
              </Field>
            </div>
            <Field label="Reason" htmlFor="points-reason" required error={errors.reason} hint="This appears in the member's points ledger.">
              <Textarea id="points-reason" rows={3} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="e.g. Assisted with the AI Bootcamp setup" />
            </Field>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

type Trophy = (typeof demoAdminTrophies)[number]

export function AdminTrophies() {
  const [rows, setRows] = useState<Trophy[]>(demoAdminTrophies)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Trophy | null>(null)
  const [form, setForm] = useState({ name: '', description: '', points: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState<Trophy | null>(null)
  const { push } = useToast()

  function openAdd() {
    setEditing(null)
    setForm({ name: '', description: '', points: '' })
    setErrors({})
    setOpen(true)
  }

  function openEdit(row: Trophy) {
    setEditing(row)
    setForm({ name: row.name, description: row.description, points: String(row.points) })
    setErrors({})
    setOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Trophies"
        description="Trophy definitions awarded manually or automatically. Points are added once when a trophy is earned."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Rewards', to: '/admin/rewards/history' }, { label: 'Trophies' }]}
        actions={<Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>Add trophy</Button>}
      />

      <Card>
        <CardHeader title="Trophy definitions" description="Awarded trophies are kept on the member's rewards page" />
        <AdminTable
          rows={rows}
          keyOf={(row) => row.id}
          emptyTitle="No trophies defined"
          emptyDescription="Create a trophy to recognise member achievements."
          columns={[
            {
              id: 'name',
              header: 'Trophy',
              sortValue: (row) => row.name,
              cell: (row) => (
                <div>
                  <p className="font-medium text-ink-900">{row.name}</p>
                  <p className="text-[0.6875rem] text-ink-400">{row.description}</p>
                </div>
              ),
            },
            { id: 'points', header: 'Points', align: 'right', sortValue: (row) => row.points, cell: (row) => <span className="tabular font-semibold">{row.points}</span> },
            { id: 'awarded', header: 'Awarded', align: 'right', sortValue: (row) => row.awarded, cell: (row) => <span className="tabular text-ink-500">{row.awarded} times</span> },
            { id: 'status', header: 'Status', cell: (row) => <Badge tone={row.active ? 'green' : 'neutral'}>{row.active ? 'Active' : 'Inactive'}</Badge> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.name}`}>
                  <DropdownItem icon={<Pencil className="h-3.5 w-3.5" />} onSelect={() => openEdit(row)}>Edit trophy</DropdownItem>
                  <DropdownItem
                    icon={<Award className="h-3.5 w-3.5" />}
                    onSelect={() => {
                      setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, active: !entry.active } : entry)))
                      push({ tone: 'info', title: 'Trophy status changed in the prototype', description: 'Existing awards are unaffected.' })
                    }}
                  >
                    {row.active ? 'Deactivate' : 'Activate'}
                  </DropdownItem>
                  <DropdownItem icon={<Trash2 className="h-3.5 w-3.5" />} destructive onSelect={() => setDeleting(row)}>Delete trophy</DropdownItem>
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={editing ? 'Edit trophy' : 'Add a trophy'}
          description="Trophies recognise achievements and can award points."
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  const next: Record<string, string> = {}
                  if (form.name.trim().length < 3) next.name = 'Enter a trophy name.'
                  if (form.description.trim().length < 10) next.description = 'Describe how the trophy is earned.'
                  if (!form.points || Number(form.points) < 0) next.points = 'Enter the points awarded.'
                  setErrors(next)
                  if (Object.keys(next).length) return
                  if (editing) {
                    setRows((current) => current.map((row) => (row.id === editing.id ? { ...row, name: form.name, description: form.description, points: Number(form.points) } : row)))
                    push({ tone: 'success', title: 'Trophy updated in the prototype', description: 'No production record was changed.' })
                  } else {
                    setRows((current) => [...current, { id: Math.max(...current.map((row) => row.id)) + 1, name: form.name, description: form.description, points: Number(form.points), active: true, awarded: 0 }])
                    push({ tone: 'success', title: 'Trophy added in the prototype', description: 'No production record was created.' })
                  }
                  setOpen(false)
                }}
              >
                {editing ? 'Save changes' : 'Add trophy'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Name" htmlFor="trophy-name" required error={errors.name}>
              <Input id="trophy-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. First Commit" />
            </Field>
            <Field label="How it is earned" htmlFor="trophy-description" required error={errors.description}>
              <Textarea id="trophy-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the achievement…" />
            </Field>
            <Field label="Points awarded" htmlFor="trophy-points" required error={errors.points}>
              <Input id="trophy-points" type="number" min={0} value={form.points} onChange={(event) => setForm({ ...form, points: event.target.value })} placeholder="e.g. 50" />
            </Field>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this trophy?"
        description={`${deleting?.name ?? 'This trophy'} would no longer be awarded. Members who already earned it keep their record.`}
        confirmLabel="Delete trophy"
        onConfirm={() => {
          if (!deleting) return
          setRows((current) => current.filter((row) => row.id !== deleting.id))
          push({ tone: 'info', title: 'Trophy removed in the prototype', description: 'No production record was deleted.' })
        }}
      />
    </>
  )
}

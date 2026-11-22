import { useCallback, useState } from 'react'
import { Download, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { demoAdminMembers, demoPayments } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Button, Card, ConfirmDialog, Dialog, DialogContent, Field, Input, Select } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, DropdownItem, RowActions, SmallStat, StatStrip, downloadCsv, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { currency, formatDate } from '../../lib/utils'

type Payment = (typeof demoPayments)[number]
const emptyForm = { member: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Mobile money', period: 'Feb 2026 – Dec 2026', reference: '' }

export function AdminPayments() {
  const [rows, setRows] = useState<Payment[]>(demoPayments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState<Payment | null>(null)
  const { push } = useToast()

  const matches = useCallback((row: Payment, query: string) => `${row.member} ${row.method} ${row.period} ${row.recordedBy} ${row.date}`.toLowerCase().includes(query), [])
  const list = useAdminList(rows, matches)
  const total = rows.reduce((sum, row) => sum + row.amount, 0)

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(row: Payment) {
    setEditing(row)
    setForm({ member: row.member, amount: String(row.amount), date: row.date, method: row.method, period: row.period, reference: '' })
    setErrors({})
    setDialogOpen(true)
  }

  function save() {
    const next: Record<string, string> = {}
    if (!form.member) next.member = 'Choose a member.'
    if (!form.amount || Number(form.amount) <= 0) next.amount = 'Enter an amount greater than zero.'
    if (!form.date) next.date = 'Choose the payment date.'
    setErrors(next)
    if (Object.keys(next).length) return
    if (editing) {
      setRows((current) => current.map((row) => (row.id === editing.id ? { ...row, member: form.member, amount: Number(form.amount), date: form.date, method: form.method, period: form.period } : row)))
      push({ tone: 'success', title: 'Payment updated in the prototype', description: 'No production record was changed.' })
    } else {
      setRows((current) => [
        { id: Math.max(...current.map((row) => row.id)) + 1, member: form.member, amount: Number(form.amount), date: form.date, method: form.method, period: form.period, recordedBy: 'Daniel Mushi' },
        ...current,
      ])
      push({ tone: 'success', title: 'Payment recorded in the prototype', description: 'No production record was created.' })
    }
    setDialogOpen(false)
  }

  return (
    <>
      <PageHeader
        title="Membership payments"
        description="Record membership fees, correct mistakes and keep a verifiable payment history. One active membership is expected per member."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Payments' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Download className="h-3.5 w-3.5" />}
              onClick={() => {
                const okay = downloadCsv('kiut-digital-club-payments.csv', rows.map((row) => ({ Member: row.member, Amount: row.amount, Date: row.date, Method: row.method, Period: row.period, RecordedBy: row.recordedBy })))
                push({ tone: okay ? 'success' : 'error', title: okay ? 'Payments CSV downloaded' : 'Nothing to export', description: 'Demonstration data only.' })
              }}
            >
              Export CSV
            </Button>
            <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>Record payment</Button>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Total recorded" value={currency(total)} hint="All demonstration payments" tone="brand" />
        <SmallStat label="Payment records" value={rows.length} hint="Across current period" />
        <SmallStat label="Members covered" value={new Set(rows.map((row) => row.member)).size} hint="Unique members" />
        <SmallStat label="Current period" value="Feb – Dec 2026" hint="Membership year" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search payments by member, method or date…" count={`${list.total} records`} />
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} payments` }}
          emptyTitle="No payments match"
          emptyDescription="Try a different member name or clear the search."
          columns={[
            {
              id: 'member',
              header: 'Member',
              sortValue: (row) => row.member,
              cell: (row) => <p className="font-medium text-ink-900">{row.member}</p>,
            },
            { id: 'date', header: 'Paid on', sortValue: (row) => row.date, cell: (row) => <span className="whitespace-nowrap text-ink-500">{formatDate(row.date)}</span> },
            { id: 'amount', header: 'Amount', align: 'right', sortValue: (row) => row.amount, cell: (row) => <span className="font-semibold tabular text-ink-900">{currency(row.amount)}</span> },
            { id: 'method', header: 'Method', cell: (row) => <span className="text-ink-500">{row.method}</span> },
            { id: 'period', header: 'Membership period', cell: (row) => <span className="whitespace-nowrap text-ink-500">{row.period}</span> },
            { id: 'recorded', header: 'Recorded by', cell: (row) => <span className="text-ink-500">{row.recordedBy}</span> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.member}'s payment`}>
                  <DropdownItem icon={<Pencil className="h-3.5 w-3.5" />} onSelect={() => openEdit(row)}>Edit payment</DropdownItem>
                  <DropdownItem icon={<Trash2 className="h-3.5 w-3.5" />} destructive onSelect={() => setDeleting(row)}>Delete record</DropdownItem>
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <Alert tone="info" title="Payment references" className="mt-4">
        Mobile money and bank references are stored in the live application. This prototype does not include a reference column in its demonstration records, and no receipt is issued.
      </Alert>
      <DemoNotice />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title={editing ? 'Edit payment' : 'Record a membership payment'}
          description={editing ? 'Correct the recorded payment. The change is limited to this browser session.' : 'Record a fee received from a member. A receipt is not generated by the prototype.'}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={save}>{editing ? 'Save changes' : 'Record payment'}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Member" htmlFor="payment-member" required error={errors.member}>
              <Select id="payment-member" value={form.member} onChange={(event) => setForm({ ...form, member: event.target.value })}>
                <option value="">Choose a member</option>
                {demoAdminMembers.map((member) => (
                  <option key={member.id} value={member.name}>{member.name} · {member.memberId}</option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (TZS)" htmlFor="payment-amount" required error={errors.amount}>
                <Input id="payment-amount" type="number" min={1} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="20000" />
              </Field>
              <Field label="Paid on" htmlFor="payment-date" required error={errors.date}>
                <Input id="payment-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Method" htmlFor="payment-method">
                <Select id="payment-method" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
                  <option>Mobile money</option>
                  <option>Bank transfer</option>
                  <option>Cash</option>
                </Select>
              </Field>
              <Field label="Membership period" htmlFor="payment-period">
                <Input id="payment-period" value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} />
              </Field>
            </div>
            <Field label="Reference" htmlFor="payment-reference" hint="Optional. Mobile money or bank reference from the live system.">
              <Input id="payment-reference" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="e.g. MP-88214" />
            </Field>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this payment record?"
        description={`The payment from ${deleting?.member ?? 'this member'} would be removed from the membership history. Delete only if the payment was recorded in error.`}
        confirmLabel="Delete payment"
        onConfirm={() => {
          if (!deleting) return
          setRows((current) => current.filter((row) => row.id !== deleting.id))
          push({ tone: 'info', title: 'Payment removed in the prototype', description: 'No production record was deleted.' })
        }}
      />
    </>
  )
}

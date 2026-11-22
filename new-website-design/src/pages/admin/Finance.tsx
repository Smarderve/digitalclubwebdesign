import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Download, Plus, Trash2 } from 'lucide-react'
import { demoFinancial } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, Dialog, DialogContent, EmptyState, Field, Input, Select, StatusBadge, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { DemoNotice, SmallStat, StatStrip, downloadCsv } from './_shared'
import { useToast } from '../../context/ToastContext'
import { cn, currency, formatDate } from '../../lib/utils'

const period = demoFinancial.period

function FinanceSummary() {
  const net = demoFinancial.revenue - demoFinancial.expenses
  return (
    <StatStrip>
      <SmallStat label="Revenue" value={currency(demoFinancial.revenue)} hint={`${period.name} · ${period.status}`} tone="brand" />
      <SmallStat label="Expenses" value={currency(demoFinancial.expenses)} hint={`${period.name} · ${period.status}`} />
      <SmallStat label="Net position" value={currency(net)} hint={net >= 0 ? 'Surplus' : 'Deficit'} tone={net >= 0 ? 'neutral' : 'danger'} />
      <SmallStat label="Transactions" value={demoFinancial.transactions.length} hint="Recorded in this period" />
    </StatStrip>
  )
}

export function AdminFinance() {
  const { push } = useToast()
  const net = demoFinancial.revenue - demoFinancial.expenses

  return (
    <>
      <PageHeader
        title="Financial records"
        description="Club income and expenditure by operating period. Membership fees are recorded separately on the payments page."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Finance' }]}
        actions={
          <>
            <ButtonLink to="/admin/financial/categories" variant="outline" size="sm">Categories</ButtonLink>
            <ButtonLink to="/admin/financial/reports" variant="outline" size="sm">Reports</ButtonLink>
            <ButtonLink to={`/admin/financial/${period.id}`} size="sm">Open period</ButtonLink>
          </>
        }
      />

      <FinanceSummary />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title={`${period.name} transactions`}
            description={`${formatDate(period.start)} – ${formatDate(period.end)} · ${period.description}`}
            action={<StatusBadge status={period.status} />}
          />
          <TableWrap>
            <THead><TR><TH>Date</TH><TH>Description</TH><TH>Category</TH><TH>Type</TH><TH className="text-right">Amount</TH></TR></THead>
            <TBody>
              {demoFinancial.transactions.map((transaction) => (
                <TR key={transaction.id}>
                  <TD className="whitespace-nowrap text-ink-500">{formatDate(transaction.date)}</TD>
                  <TD className="font-medium text-ink-900">{transaction.description}</TD>
                  <TD className="text-ink-500">{transaction.category}</TD>
                  <TD>
                    <Badge tone={transaction.type === 'revenue' ? 'green' : 'neutral'}>
                      {transaction.type === 'revenue' ? 'Revenue' : 'Expense'}
                    </Badge>
                  </TD>
                  <TD className={cn('text-right font-semibold tabular', transaction.type === 'revenue' ? 'text-brand-700' : 'text-ink-900')}>
                    {transaction.type === 'revenue' ? '+' : '−'}{currency(transaction.amount)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-ink-400">Opening balance is not tracked; only recorded transactions are shown.</p>
            <Link to={`/admin/financial/${period.id}`} className="text-[0.75rem] font-medium text-brand-800 hover:underline">Manage period</Link>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="text-[0.8125rem] font-semibold text-ink-900">By category</p>
            <div className="mt-3 space-y-3">
              {[
                { label: 'Membership payments', value: 120000, tone: 'bg-brand-600' },
                { label: 'Sponsorship', value: 300000, tone: 'bg-brand-400' },
                { label: 'Event costs', value: 45500, tone: 'bg-[#D9A441]' },
                { label: 'Equipment', value: 109000, tone: 'bg-[#8C6A3F]' },
                { label: 'Printing', value: 32000, tone: 'bg-ink-300' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[0.75rem]">
                    <span className="text-ink-500">{item.label}</span>
                    <span className="font-medium tabular text-ink-900">{currency(item.value)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div className={cn('h-full rounded-full', item.tone)} style={{ width: `${(item.value / 306500) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">Bars use recorded amounts for the open period and are not a budget comparison.</p>
          </div>

          <div className="rounded-lg border border-line bg-white">
            <div className="border-b border-line px-4 py-3">
              <p className="text-[0.8125rem] font-semibold text-ink-900">Period actions</p>
            </div>
            <div className="space-y-2 p-4">
              <ButtonLink to={`/admin/financial/${period.id}`} variant="outline" size="sm" className="w-full justify-center">Add transaction</ButtonLink>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => push({ tone: 'info', title: 'Export is a prototype action', description: 'A period export is available from the reports page using CSV.' })}
              >
                Export period
              </Button>
              <p className="text-[0.6875rem] leading-5 text-ink-400">
                Only an administrator can close a period. Closed periods cannot receive new transactions until reopened.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-canvas/50 p-4">
            <p className="text-[0.75rem] leading-6 text-ink-500">
              Net position this period: <span className={cn('font-semibold', net >= 0 ? 'text-brand-800' : 'text-danger')}>{currency(net)}</span>. Finance
              records are sensitive; only administrators can access this section.
            </p>
          </div>
        </div>
      </div>

      <DemoNotice />
    </>
  )
}

export function AdminFinancialPeriod() {
  const { periodId } = useParams()
  const [transactions, setTransactions] = useState(demoFinancial.transactions)
  const [status, setStatus] = useState<'open' | 'closed'>(period.status as 'open' | 'closed')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), category: 'Event costs', type: 'expense' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)
  const { push } = useToast()

  if (String(period.id) !== periodId) {
    return (
      <>
        <PageHeader title="Period not found" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Finance', to: '/admin/financial' }]} />
        <Card><div className="p-4"><EmptyState title="This financial period is unavailable" description="It may have been removed. Return to the finance overview." action={<ButtonLink to="/admin/financial" size="sm">Back to finance</ButtonLink>} /></div></Card>
      </>
    )
  }

  const revenue = transactions.filter((row) => row.type === 'revenue').reduce((sum, row) => sum + row.amount, 0)
  const expenses = transactions.filter((row) => row.type === 'expense').reduce((sum, row) => sum + row.amount, 0)

  return (
    <>
      <Link to="/admin/financial" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Finance
      </Link>
      <PageHeader
        title={`${period.name} — ${period.description}`}
        description={`${formatDate(period.start)} – ${formatDate(period.end)}`}
        badge={<StatusBadge status={status} />}
        actions={
          status === 'open' ? (
            <Button size="sm" onClick={() => setClosing(true)}>Close period</Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStatus('open')
                push({ tone: 'info', title: 'Period reopened in the prototype', description: 'Reopening allows transactions to be corrected.' })
              }}
            >
              Reopen period
            </Button>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Revenue', value: currency(revenue), hint: 'Recorded income' },
          { label: 'Expenses', value: currency(expenses), hint: 'Recorded spending' },
          { label: 'Net', value: currency(revenue - expenses), hint: 'Revenue minus expenses' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-white p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            <p className="mt-1.5 text-[1.125rem] font-semibold tabular tracking-tight text-ink-950">{item.value}</p>
            <p className="text-[0.6875rem] text-ink-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Transactions"
          description={status === 'closed' ? 'This period is closed. Reopen it to correct transactions.' : 'Record income and expenditure as it happens.'}
          action={<Button size="sm" disabled={status === 'closed'} onClick={() => setDialogOpen(true)} iconLeft={<Plus className="h-3.5 w-3.5" />}>Add transaction</Button>}
        />
        <TableWrap>
          <THead><TR><TH>Date</TH><TH>Description</TH><TH>Category</TH><TH>Type</TH><TH>Recorded by</TH><TH className="text-right">Amount</TH><TH /></TR></THead>
          <TBody>
            {transactions.map((transaction) => (
              <TR key={transaction.id}>
                <TD className="whitespace-nowrap text-ink-500">{formatDate(transaction.date)}</TD>
                <TD className="font-medium text-ink-900">{transaction.description}</TD>
                <TD className="text-ink-500">{transaction.category}</TD>
                <TD><Badge tone={transaction.type === 'revenue' ? 'green' : 'neutral'}>{transaction.type}</Badge></TD>
                <TD className="text-ink-500">{transaction.recordedBy}</TD>
                <TD className="text-right font-semibold tabular">{currency(transaction.amount)}</TD>
                <TD className="text-right">
                  <button
                    type="button"
                    aria-label={`Delete ${transaction.description}`}
                    disabled={status === 'closed'}
                    onClick={() => setDeleting(transaction.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-ink-400 hover:bg-[#FEF3F2] hover:text-danger disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      </Card>

      <DemoNotice />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title="Add a transaction"
          description="Record a single income or expense entry for this period."
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  const next: Record<string, string> = {}
                  if (!form.description.trim()) next.description = 'Describe the transaction.'
                  if (!form.amount || Number(form.amount) <= 0) next.amount = 'Enter an amount greater than zero.'
                  if (!form.date) next.date = 'Choose a date.'
                  setErrors(next)
                  if (Object.keys(next).length) return
                  setTransactions((current) => [
                    { id: Math.max(...current.map((row) => row.id)) + 1, date: form.date, description: form.description, category: form.category, type: form.type as 'revenue' | 'expense', amount: Number(form.amount), recordedBy: 'Daniel Mushi' },
                    ...current,
                  ])
                  setDialogOpen(false)
                  setForm({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), category: 'Event costs', type: 'expense' })
                  push({ tone: 'success', title: 'Transaction added in the prototype', description: 'No production record was created.' })
                }}
              >
                Add transaction
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Description" htmlFor="tx-description" required error={errors.description}>
              <Input id="tx-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="e.g. Workshop materials" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (TZS)" htmlFor="tx-amount" required error={errors.amount}>
                <Input id="tx-amount" type="number" min={1} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
              </Field>
              <Field label="Date" htmlFor="tx-date" required error={errors.date}>
                <Input id="tx-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" htmlFor="tx-type">
                <Select id="tx-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  <option value="expense">Expense</option>
                  <option value="revenue">Revenue</option>
                </Select>
              </Field>
              <Field label="Category" htmlFor="tx-category">
                <Select id="tx-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {demoFinancial.categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this transaction?"
        description="The transaction will be removed from this period and the totals will change. This is a prototype and no production record is deleted."
        confirmLabel="Delete transaction"
        onConfirm={() => {
          setTransactions((current) => current.filter((row) => row.id !== deleting))
          push({ tone: 'info', title: 'Transaction removed in the prototype', description: 'Totals recalculated in this session.' })
        }}
      />
      <ConfirmDialog
        open={closing}
        onOpenChange={setClosing}
        title="Close this financial period?"
        description="Closed periods cannot receive new transactions. Reopen it if a correction is needed."
        confirmLabel="Close period"
        onConfirm={() => {
          setStatus('closed')
          push({ tone: 'success', title: 'Period closed in the prototype', description: 'No production record was changed.' })
        }}
      />
    </>
  )
}

export function AdminFinancialCategories() {
  const [categories, setCategories] = useState(demoFinancial.categories)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('expense')
  const [error, setError] = useState('')
  const { push } = useToast()

  return (
    <>
      <PageHeader
        title="Financial categories"
        description="Categories group transactions for reporting. Inactive categories stay on historical records."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Finance', to: '/admin/financial' }, { label: 'Categories' }]}
        actions={<Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>Add category</Button>}
      />

      <Card>
        <TableWrap>
          <THead><TR><TH>Category</TH><TH>Type</TH><TH>Status</TH><TH>Built in</TH><TH className="text-right">Transactions</TH></TR></THead>
          <TBody>
            {categories.map((category) => {
              const count = demoFinancial.transactions.filter((row) => row.category === category.name).length
              return (
                <TR key={category.id}>
                  <TD className="font-medium text-ink-900">{category.name}</TD>
                  <TD><Badge tone={category.type === 'revenue' ? 'green' : 'neutral'}>{category.type}</Badge></TD>
                  <TD>
                    <button
                      type="button"
                      onClick={() => {
                        setCategories((current) => current.map((row) => (row.id === category.id ? { ...row, active: !row.active } : row)))
                        push({ tone: 'info', title: 'Category status changed in the prototype', description: 'Historical transactions are unaffected.' })
                      }}
                      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium', category.active ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-line bg-ink-50 text-ink-500')}
                      aria-pressed={category.active}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', category.active ? 'bg-brand-600' : 'bg-ink-300')} />
                      {category.active ? 'Active' : 'Inactive'}
                    </button>
                  </TD>
                  <TD className="text-ink-500">{category.builtin ? 'Yes' : 'No'}</TD>
                  <TD className="text-right tabular text-ink-500">{count}</TD>
                </TR>
              )
            })}
          </TBody>
        </TableWrap>
        <div className="border-t border-line px-4 py-3">
          <p className="text-[0.6875rem] text-ink-400">Built-in categories cannot be deleted because existing reports depend on them.</p>
        </div>
      </Card>

      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Add a category"
          description="New categories are available immediately for new transactions."
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  if (name.trim().length < 3) {
                    setError('Enter a category name with at least 3 characters.')
                    return
                  }
                  setCategories((current) => [...current, { id: Math.max(...current.map((row) => row.id)) + 1, name: name.trim(), type, active: true, builtin: false }])
                  setName('')
                  setError('')
                  setOpen(false)
                  push({ tone: 'success', title: 'Category added in the prototype', description: 'No production record was created.' })
                }}
              >
                Add category
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Name" htmlFor="category-name" required error={error}>
              <Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Travel" />
            </Field>
            <Field label="Type" htmlFor="category-type">
              <Select id="category-type" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="expense">Expense</option>
                <option value="revenue">Revenue</option>
              </Select>
            </Field>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AdminFinancialReports() {
  const { push } = useToast()
  const [periodClosed, setPeriodClosed] = useState(false)

  return (
    <>
      <PageHeader
        title="Financial reports"
        description="Closed periods are summarised for review and handover. The current period appears only once it is closed."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Finance', to: '/admin/financial' }, { label: 'Reports' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            iconLeft={<Download className="h-3.5 w-3.5" />}
            onClick={() => {
              const okay = downloadCsv('kiut-digital-club-financial-reports.csv', demoFinancial.reports.map((row) => ({ Period: row.period, Revenue: row.revenue, Expenses: row.expenses, Net: row.net, Status: row.status })))
              push({ tone: okay ? 'success' : 'error', title: okay ? 'Report summary downloaded' : 'Nothing to export', description: 'Demonstration data only.' })
            }}
          >
            Export summary
          </Button>
        }
      />

      <Card>
        <CardHeader title="Closed periods" description="Net position by quarter" />
        <TableWrap>
          <THead><TR><TH>Period</TH><TH className="text-right">Revenue</TH><TH className="text-right">Expenses</TH><TH className="text-right">Net</TH><TH>Result</TH><TH>Status</TH></TR></THead>
          <TBody>
            {demoFinancial.reports.map((report) => (
              <TR key={report.period}>
                <TD className="font-medium text-ink-900">{report.period}</TD>
                <TD className="text-right tabular">{currency(report.revenue)}</TD>
                <TD className="text-right tabular">{currency(report.expenses)}</TD>
                <TD className={cn('text-right font-semibold tabular', report.net >= 0 ? 'text-brand-700' : 'text-danger')}>{currency(report.net)}</TD>
                <TD>
                  <span className="inline-flex items-center gap-1 text-[0.75rem] text-ink-500">
                    {report.net >= 0 ? <ArrowUpRight className="h-3.5 w-3.5 text-brand-600" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5 text-danger" aria-hidden />}
                    {report.net >= 0 ? 'Surplus' : 'Deficit'}
                  </span>
                </TD>
                <TD><Badge tone="neutral">{report.status}</Badge></TD>
              </TR>
            ))}
            <TR>
              <TD className="font-medium text-ink-900">{period.name} <Badge tone="amber" className="ml-1">current</Badge></TD>
              <TD className="text-right tabular">{currency(demoFinancial.revenue)}</TD>
              <TD className="text-right tabular">{currency(demoFinancial.expenses)}</TD>
              <TD className="text-right font-semibold tabular text-brand-700">{currency(demoFinancial.revenue - demoFinancial.expenses)}</TD>
              <TD className="text-ink-500">{periodClosed ? 'Surplus' : 'Open period'}</TD>
              <TD><StatusBadge status={periodClosed ? 'closed' : 'open'} /></TD>
            </TR>
          </TBody>
        </TableWrap>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
          <p className="text-[0.6875rem] text-ink-400">The current period is shown for context and is excluded from the exported summary until closed.</p>
          <Button variant="ghost" size="sm" onClick={() => setPeriodClosed(true)} disabled={periodClosed}>Mark current period closed</Button>
        </div>
      </Card>

      <Alert tone="info" title="Report accuracy" className="mt-4">
        Reports summarise recorded transactions only. They are not audited accounts and should not be treated as official financial statements.
      </Alert>
      <DemoNotice />
    </>
  )
}

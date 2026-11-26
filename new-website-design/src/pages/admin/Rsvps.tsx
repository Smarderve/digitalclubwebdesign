import { useCallback, useState } from 'react'
import { Check, ClipboardList, Download, X } from 'lucide-react'
import { demoRsvps } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, Card, ConfirmDialog, StatusBadge } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, downloadCsv, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate, cn } from '../../lib/utils'

type RsvpRow = (typeof demoRsvps)[number]

export function AdminRsvps() {
  const [rows, setRows] = useState<RsvpRow[]>(demoRsvps)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [pending, setPending] = useState<{ type: 'approve' | 'reject'; row: RsvpRow } | null>(null)
  const { push } = useToast()

  const matches = useCallback((row: RsvpRow, query: string) => `${row.name} ${row.email} ${row.event} ${row.type}`.toLowerCase().includes(query), [])
  const base = rows.filter((row) => filter === 'all' || row.status === filter)
  const list = useAdminList(base, matches)

  function decide() {
    if (!pending) return
    const approving = pending.type === 'approve'
    setRows((current) => current.map((row) => (row.id === pending.row.id ? { ...row, status: approving ? 'approved' : 'rejected', checkedIn: approving ? row.checkedIn : false } : row)))
    push({
      tone: approving ? 'success' : 'info',
      title: approving ? 'RSVP approved' : 'RSVP rejected',
      description: `${pending.row.name} — no email was sent and no production record changed.`,
    })
  }

  return (
    <>
      <PageHeader
        title="Event RSVPs"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'RSVPs' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Download className="h-3.5 w-3.5" />}
              onClick={() => {
                const okay = downloadCsv('event-rsvps.csv', rows.map((row) => ({ Name: row.name, Email: row.email, Event: row.event, Type: row.type, Submitted: row.submitted, Status: row.status, CheckedIn: row.checkedIn })))
                push({ tone: okay ? 'success' : 'error', title: okay ? 'RSVP list exported' : 'Nothing to export' })
              }}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              iconLeft={<Check className="h-3.5 w-3.5" />}
              onClick={() => {
                const waiting = rows.filter((row) => row.status === 'pending')
                if (!waiting.length) {
                  push({ tone: 'info', title: 'No RSVPs are pending' })
                  return
                }
                setRows((current) => current.map((row) => (row.status === 'pending' ? { ...row, status: 'approved' } : row)))
                push({ tone: 'success', title: `${waiting.length} RSVPs approved`, description: 'No notifications were sent.' })
              }}
            >
              Approve all pending
            </Button>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Registrations" value={rows.length} hint="All events" tone="brand" />
        <SmallStat label="Awaiting decision" value={rows.filter((row) => row.status === 'pending').length} hint="Need a review" tone="amber" />
        <SmallStat label="Approved" value={rows.filter((row) => row.status === 'approved').length} hint="Admitted to events" />
        <SmallStat label="Checked in" value={rows.filter((row) => row.checkedIn).length} hint="Attended" />
      </StatStrip>

      {rows.some((row) => row.status === 'pending') ? (
        <Alert tone="warning" className="mt-4" title="Some registrations are still pending">
          Members cannot be checked in until their RSVP is approved. Approve or reject each registration before the event starts.
        </Alert>
      ) : null}

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search by name, email or event…" count={`${list.total} registrations`}>
          <FilterChips
            label="RSVP status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending', count: rows.filter((row) => row.status === 'pending').length },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} registrations` }}
          emptyTitle="No RSVPs match this filter"
          emptyDescription="Try another status or clear the search field."
          columns={[
            {
              id: 'name',
              header: 'Registrant',
              sortValue: (row) => row.name,
              cell: (row) => (
                <div>
                  <p className="font-medium text-ink-900">{row.name}</p>
                  <p className="text-[0.6875rem] text-ink-400">{row.email}</p>
                </div>
              ),
            },
            { id: 'event', header: 'Event', sortValue: (row) => row.event, cell: (row) => <span className="text-ink-600">{row.event}</span> },
            { id: 'type', header: 'Type', cell: (row) => <Badge tone="outline">{row.type}</Badge> },
            { id: 'submitted', header: 'Submitted', sortValue: (row) => row.submitted, cell: (row) => <span className="whitespace-nowrap text-ink-500">{formatDate(row.submitted)}</span> },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
            {
              id: 'checkin',
              header: 'Check-in',
              cell: (row) =>
                row.status === 'approved' ? (
                  <button
                    type="button"
                    aria-pressed={row.checkedIn}
                    onClick={() => {
                      setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, checkedIn: !entry.checkedIn } : entry)))
                      push({ tone: 'info', title: row.checkedIn ? 'Check-in removed' : 'Checked in', description: `${row.name} — no attendance record was saved.` })
                    }}
                    className={cn(
                      'inline-flex h-7 items-center rounded-full border px-2.5 text-[0.6875rem] font-semibold',
                      row.checkedIn ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-ink-200 bg-surface text-ink-500 hover:bg-ink-50',
                    )}
                  >
                    {row.checkedIn ? 'Checked in' : 'Not arrived'}
                  </button>
                ) : (
                  <span className="text-[0.6875rem] text-ink-400">—</span>
                ),
            },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) =>
                row.status === 'pending' ? (
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Approve RSVP for ${row.name}`}
                      onClick={() => setPending({ type: 'approve', row })}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`Reject RSVP for ${row.name}`}
                      onClick={() => setPending({ type: 'reject', row })}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] border border-line text-ink-500 hover:bg-danger-soft hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <RowActions label={`Actions for ${row.name}`}>
                    <DropdownItem icon={<ClipboardList className="h-3.5 w-3.5" />} onSelect={() => setPending({ type: row.status === 'approved' ? 'reject' : 'approve', row })}>
                      {row.status === 'approved' ? 'Revoke approval' : 'Approve RSVP'}
                    </DropdownItem>
                  </RowActions>
                ),
            },
          ]}
        />
      </Card>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Approval sends the member a confirmation email and updates the event organiser's list.
      </p>
      <DemoNotice />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.type === 'approve' ? 'Approve this RSVP?' : 'Reject this RSVP?'}
        description={
          pending?.type === 'approve'
            ? `${pending?.row.name} will be added to the check-in list for ${pending?.row.event}.`
            : `${pending?.row.name} will not be admitted to ${pending?.row.event}. The registration record is kept.`
        }
        confirmLabel={pending?.type === 'approve' ? 'Approve' : 'Reject'}
        destructive={pending?.type === 'reject'}
        onConfirm={decide}
      />
    </>
  )
}

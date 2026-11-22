import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, IdCard, Printer, ScanLine, Search, ShieldAlert } from 'lucide-react'
import { demoMemberIds } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, DetailList, EmptyState } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate, cn } from '../../lib/utils'

export function AdminMemberIds() {
  const matches = useCallback(
    (row: (typeof demoMemberIds)[number], query: string) => `${row.name} ${row.memberId} ${row.course}`.toLowerCase().includes(query),
    [],
  )
  const list = useAdminList(demoMemberIds, matches)

  return (
    <>
      <PageHeader
        title="Member IDs"
        description="Issued digital member IDs and their verification state. Members can download their ID from the member area."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Member IDs' }]}
        actions={
          <>
            <Button variant="outline" size="sm" iconLeft={<Printer className="h-3.5 w-3.5" />} onClick={() => window.print()}>Print list</Button>
            <ButtonLink to="/admin/scan-id" size="sm" iconLeft={<ScanLine className="h-3.5 w-3.5" />}>Scan or verify</ButtonLink>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'IDs issued', value: demoMemberIds.length, hint: 'Demonstration records' },
          { label: 'Active IDs', value: demoMemberIds.filter((row) => row.active).length, hint: 'Verifiable at the door' },
          { label: 'Inactive IDs', value: demoMemberIds.filter((row) => !row.active).length, hint: 'Suspended or expired' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-white p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            <p className="mt-1.5 text-[1.25rem] font-semibold tabular tracking-tight text-ink-950">{item.value}</p>
            <p className="text-[0.6875rem] text-ink-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search by member, ID or course…" count={`${list.total} IDs`} />
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} member IDs` }}
          emptyTitle="No member IDs match"
          emptyDescription="Try a different name or member ID."
          columns={[
            {
              id: 'name',
              header: 'Member',
              sortValue: (row) => row.name,
              cell: (row) => (
                <div>
                  <p className="font-medium text-ink-900">{row.name}</p>
                  <p className="text-[0.6875rem] text-ink-400">{row.course}</p>
                </div>
              ),
            },
            { id: 'id', header: 'Member ID', cell: (row) => <span className="font-mono text-[0.75rem] text-ink-600">{row.memberId}</span> },
            { id: 'issued', header: 'Issued', sortValue: (row) => row.issued, cell: (row) => <span className="whitespace-nowrap text-ink-500">{formatDate(row.issued)}</span> },
            { id: 'status', header: 'Status', cell: (row) => <Badge tone={row.active ? 'green' : 'neutral'}>{row.active ? 'Active' : 'Inactive'}</Badge> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <Link to={`/verify-id/${row.memberId}`} className="text-[0.75rem] font-medium text-brand-800 hover:underline">
                  Verify
                </Link>
              ),
            },
          ]}
        />
      </Card>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Printing opens the browser print dialog. In the live application, IDs are generated as PDFs and can be reissued by an administrator.
      </p>
      <DemoNotice />
    </>
  )
}

export function AdminScanId() {
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [result, setResult] = useState<(typeof demoMemberIds)[number] | null>(null)
  const { push } = useToast()

  function verify() {
    const normalized = query.trim().toUpperCase()
    const found = demoMemberIds.find((row) => row.memberId.toUpperCase() === normalized) ?? null
    setResult(found)
    setSearched(true)
    if (!normalized) {
      push({ tone: 'error', title: 'Enter a member ID', description: 'The verification field cannot be empty.' })
      setSearched(false)
      return
    }
    push({
      tone: found ? (found.active ? 'success' : 'error') : 'info',
      title: found ? (found.active ? 'Member ID is valid' : 'Member ID is inactive') : 'Member ID not found',
      description: 'Lookup runs against demonstration records only.',
    })
  }

  return (
    <>
      <PageHeader
        title="Scan or verify a member ID"
        description="Check a digital ID at an event, workshop or club meeting. Verification uses the member ID printed on the card."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Member IDs', to: '/admin/member-ids' }, { label: 'Verify' }]}
        actions={<ButtonLink to="/admin/member-ids" variant="outline" size="sm">All member IDs</ButtonLink>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader title="Verify a card" description="Enter the ID exactly as printed, for example DC-2026-0014." />
          <div className="space-y-3 p-4">
            <label htmlFor="member-id" className="block text-[0.8125rem] font-medium text-ink-900">Member ID</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
                <input
                  id="member-id"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setSearched(false)
                  }}
                  onKeyDown={(event) => event.key === 'Enter' && verify()}
                  placeholder="DC-2026-0014"
                  className="h-9 w-full rounded-sm border border-ink-200 bg-white pl-8 pr-3 font-mono text-[0.8125rem] uppercase text-ink-900 placeholder:text-ink-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <Button onClick={verify} iconLeft={<ScanLine className="h-3.5 w-3.5" />}>Verify ID</Button>
            </div>
            <p className="text-[0.6875rem] text-ink-400">Scanner input can be typed or pasted. The live system also supports camera scanning where enabled.</p>

            {searched ? (
              result ? (
                <div className={cn('rounded-md border p-4', result.active ? 'border-brand-200 bg-brand-50/50' : 'border-[#F3C0BB] bg-[#FFF6F5]')}>
                  <div className="flex items-start gap-2.5">
                    {result.active ? <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />}
                    <div>
                      <p className="text-[0.875rem] font-semibold text-ink-950">{result.active ? 'Valid member ID' : 'ID is not active'}</p>
                      <p className="mt-0.5 text-[0.75rem] text-ink-500">
                        {result.active ? 'This member can be checked in to member events.' : 'Do not admit this member until the record is reviewed.'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <DetailList
                      items={[
                        { label: 'Name', value: result.name },
                        { label: 'Member ID', value: <span className="font-mono">{result.memberId}</span> },
                        { label: 'Course', value: result.course },
                        { label: 'Year', value: result.year },
                        { label: 'Status', value: <Badge tone={result.active ? 'green' : 'neutral'}>{result.active ? 'Active' : 'Inactive'}</Badge> },
                        { label: 'Issued', value: formatDate(result.issued) },
                      ]}
                    />
                  </div>
                </div>
              ) : (
                <EmptyState compact icon={<IdCard className="h-4 w-4" aria-hidden />} title="No member matches that ID" description="Check the characters carefully. If the card looks damaged or counterfeit, escalate to a club administrator." />
              )
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          <Alert tone="info" title="Privacy at the desk">
            Verification shows only what is needed to confirm identity. Do not record member details in personal notes or share screens.
          </Alert>
          <Card>
            <CardHeader title="Recent verifications" description="Demonstration records" />
            <ul className="divide-y divide-line">
              {demoMemberIds.slice(0, 4).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-[0.8125rem] font-medium text-ink-900">{row.name}</p>
                    <p className="font-mono text-[0.6875rem] text-ink-400">{row.memberId}</p>
                  </div>
                  <Badge tone={row.active ? 'green' : 'neutral'}>{row.active ? 'Verified' : 'Rejected'}</Badge>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-4 py-3">
              <p className="text-[0.6875rem] text-ink-400">This list is static demonstration data; no scan history is stored.</p>
            </div>
          </Card>
          <div className="rounded-lg border border-line bg-canvas/50 p-4">
            <p className="text-[0.75rem] leading-6 text-ink-500">
              Members can also verify a card through the public page: <Link to="/verify-id" className="font-medium text-brand-800 hover:underline">Verify a digital ID</Link>.
            </p>
          </div>
        </div>
      </div>

      <DemoNotice />
    </>
  )
}

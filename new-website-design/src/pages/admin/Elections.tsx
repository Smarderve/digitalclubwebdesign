import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Plus, Vote } from 'lucide-react'
import { demoAdminElections, demoElection, demoPositions } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, DetailList, Dialog, DialogContent, EmptyState, Field, Input, Select, StatusBadge, Tabs, TabsContent, TabsList, TabsTrigger, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type ElectionRow = (typeof demoAdminElections)[number]

export function AdminElections() {
  const [rows, setRows] = useState<ElectionRow[]>(demoAdminElections)
  const [filter, setFilter] = useState<'all' | 'voting' | 'finalized'>('all')
  const { push } = useToast()

  const matches = useCallback((row: ElectionRow, query: string) => `${row.title} ${row.term} ${row.status}`.toLowerCase().includes(query), [])
  const base = rows.filter((row) => filter === 'all' || row.status === filter)
  const list = useAdminList(base, matches)

  return (
    <>
      <PageHeader
        title="Elections"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Elections' }]}
        actions={
          <>
            <ButtonLink to="/admin/elections/positions" variant="outline" size="sm">Positions</ButtonLink>
            <Button
              size="sm"
              iconLeft={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                setRows((current) => [
                  {
                    id: Math.max(0, ...current.map((row) => row.id)) + 1,
                    title: 'New club election',
                    term: '2026/27',
                    status: 'draft',
                    candidates: 0,
                    applications: 'Not scheduled',
                    voting: 'Not scheduled',
                  },
                  ...current,
                ])
                push({ tone: 'success', title: 'Draft election created', description: 'Configure positions and dates before members can see it.' })
              }}
            >
              New election
            </Button>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Elections" value={rows.length} hint="All records" tone="brand" />
        <SmallStat label="Open for voting" value={rows.filter((row) => row.status === 'voting').length} hint="Members can vote" />
        <SmallStat label="Candidate records" value={rows.reduce((total, row) => total + row.candidates, 0)} hint="Across elections" />
        <SmallStat label="Finalized" value={rows.filter((row) => row.status === 'finalized').length} hint="Results published" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search elections by title or term…" count={`${list.total} elections`}>
          <FilterChips
            label="Election status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'voting', label: 'Voting' },
              { value: 'finalized', label: 'Finalized' },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          emptyTitle="No elections match this filter"
          emptyDescription="Try another status or clear the search field."
          columns={[
            {
              id: 'title',
              header: 'Election',
              sortValue: (row) => row.title,
              cell: (row) => (
                <div>
                  <Link to={`/admin/elections/${row.id}`} className="font-medium text-ink-900 hover:text-brand-800">{row.title}</Link>
                  <p className="text-[0.6875rem] text-ink-400">Term {row.term}</p>
                </div>
              ),
            },
            { id: 'candidates', header: 'Candidates', align: 'right', sortValue: (row) => row.candidates, cell: (row) => <span className="tabular">{row.candidates}</span> },
            { id: 'applications', header: 'Applications', cell: (row) => <span className="whitespace-nowrap text-ink-500">{row.applications}</span> },
            { id: 'voting', header: 'Voting', cell: (row) => <span className="whitespace-nowrap text-ink-500">{row.voting}</span> },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.title}`}>
                  <DropdownItem to={`/admin/elections/${row.id}`} icon={<Vote className="h-3.5 w-3.5" />}>Open election</DropdownItem>
                  <DropdownItem to="/admin/elections/positions" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>Manage positions</DropdownItem>
                  {row.status === 'voting' ? (
                    <DropdownItem
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      onSelect={() => {
                        setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, status: 'finalized' } : entry)))
                        push({ tone: 'info', title: 'Election finalized', description: 'No votes were counted and no results were published.' })
                      }}
                    >
                      Finalize results
                    </DropdownItem>
                  ) : null}
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Elections are administered by the electoral committee. Results must not be published before all ballots are counted and verified.
      </p>
      <DemoNotice />
    </>
  )
}

export function AdminPositions() {
  const [positions, setPositions] = useState(demoPositions)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', subtitle: '', seats: '1' })
  const [error, setError] = useState('')
  const { push } = useToast()

  return (
    <>
      <PageHeader
        title="Election positions"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Elections', to: '/admin/elections' }, { label: 'Positions' }]}
        actions={<Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => { setForm({ title: '', subtitle: '', seats: '1' }); setError(''); setOpen(true) }}>Add position</Button>}
      />

      <Card>
        <CardHeader title="Positions" description="Order controls how positions appear on the ballot." action={<Badge tone="outline">{positions.length} positions</Badge>} />
        <TableWrap>
          <THead>
            <TR>
              <TH className="w-[70px]">Order</TH>
              <TH>Position</TH>
              <TH>Responsibility</TH>
              <TH>Seats</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {positions.map((row) => (
              <TR key={row.id}>
                <TD className="tabular text-ink-400">{row.order}</TD>
                <TD className="font-medium text-ink-900">{row.title}</TD>
                <TD className="text-ink-500">{row.subtitle}</TD>
                <TD className="tabular">{row.seats}</TD>
                <TD>
                  <button
                    type="button"
                    onClick={() => {
                      setPositions((current) => current.map((entry) => (entry.id === row.id ? { ...entry, active: !entry.active } : entry)))
                      push({ tone: 'info', title: row.active ? 'Position disabled' : 'Position enabled', description: 'Existing ballots are unchanged.' })
                    }}
                  >
                    <Badge tone={row.active ? 'green' : 'neutral'} dot>{row.active ? 'Active' : 'Disabled'}</Badge>
                  </button>
                </TD>
                <TD className="text-right">
                  <RowActions label={`Actions for ${row.title}`}>
                    <DropdownItem icon={<Plus className="h-3.5 w-3.5" />} onSelect={() => push({ tone: 'info', title: 'Seat changes are available from the record page', description: 'Changing seats affects the ballot for this election.' })}>
                      Change seats
                    </DropdownItem>
                  </RowActions>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      </Card>

      <div className="mt-4">
        <Alert tone="info" title="Positions are shared across elections">
          A position record is reused every cycle. Disabling a position hides it from new elections but keeps historic results intact.
        </Alert>
      </div>
      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Add a position"
          description="Positions appear on the ballot in the order shown."
          size="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  if (form.title.trim().length < 3) {
                    setError('Enter the position title.')
                    return
                  }
                  setPositions((current) => [
                    ...current,
                    { id: Math.max(0, ...current.map((row) => row.id)) + 1, title: form.title, subtitle: form.subtitle || '—', seats: Number(form.seats) || 1, active: true, order: current.length + 1 },
                  ])
                  push({ tone: 'success', title: 'Position added' })
                  setOpen(false)
                }}
              >
                Add position
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Title" htmlFor="position-title" required error={error}>
              <Input id="position-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Technical Lead — Web" />
            </Field>
            <Field label="Responsibility" htmlFor="position-subtitle" optional>
              <Input id="position-subtitle" value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} placeholder="Leads web workshops and reviews projects" />
            </Field>
            <Field label="Seats available" htmlFor="position-seats">
              <Select id="position-seats" value={form.seats} onChange={(event) => setForm({ ...form, seats: event.target.value })}>
                <option value="1">1 seat</option>
                <option value="2">2 seats</option>
                <option value="3">3 seats</option>
              </Select>
            </Field>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AdminElectionDetail() {
  const { id } = useParams()
  const election = demoAdminElections.find((row) => String(row.id) === id)
  const [tab, setTab] = useState('overview')
  const [finalizing, setFinalizing] = useState(false)
  const [status, setStatus] = useState(election?.status ?? 'voting')
  const { push } = useToast()

  if (!election) {
    return (
      <>
        <PageHeader title="Election not found" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Elections', to: '/admin/elections' }]} />
        <Card><div className="p-4"><EmptyState title="This election is unavailable" description="It may have been removed." action={<ButtonLink to="/admin/elections" size="sm">Back to elections</ButtonLink>} /></div></Card>
      </>
    )
  }

  const ballot = demoElection.positions

  return (
    <>
      <Link to="/admin/elections" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Elections
      </Link>
      <PageHeader
        title={election.title}
        description={`Term ${election.term} · applications ${election.applications} · voting ${election.voting}`}
        badge={<StatusBadge status={status} />}
        actions={
          <>
            <ButtonLink to="/admin/elections/positions" variant="outline" size="sm">Positions</ButtonLink>
            <Button size="sm" disabled={status === 'finalized'} onClick={() => setFinalizing(true)}>
              {status === 'finalized' ? 'Results finalized' : 'Finalize results'}
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList ariaLabel="Election management">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ballot">Ballot ({ballot.length})</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {tab === 'overview' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardHeader title="Election record" description="Timeline and eligibility" />
                <div className="p-4">
                  <DetailList
                    items={[
                      { label: 'Status', value: <StatusBadge status={status} /> },
                      { label: 'Term', value: election.term },
                      { label: 'Applications', value: election.applications },
                      { label: 'Voting window', value: election.voting },
                      { label: 'Positions', value: ballot.length },
                      { label: 'Candidate records', value: election.candidates },
                      { label: 'Eligibility', value: 'Approved members with an active membership' },
                      { label: 'Ballot', value: <Badge tone="outline">Secret ballot</Badge> },
                    ]}
                  />
                </div>
              </Card>
              <div className="space-y-4">
                <Alert tone="info" title="One member, one vote">
                  Each member can vote once per position. Never share or export ballot data.
                </Alert>
                <Card>
                  <CardHeader title="Checklist before finalizing" />
                  <ul className="space-y-2 px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />Applications reviewed and approved.</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />Voting window closed on time.</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />Ballots counted by two committee members.</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />Results reviewed against the constitution.</li>
                  </ul>
                </Card>
              </div>
            </div>
          ) : null}

          {tab === 'ballot' ? (
            <Card className="mt-4">
              <CardHeader title="Ballot positions" description="Positions and candidates as they will appear to voters." />
              <TableWrap>
                <THead><TR><TH>Position</TH><TH>Seats</TH><TH>Candidates</TH><TH>Responsibility</TH></TR></THead>
                <TBody>
                  {ballot.map((position) => (
                    <TR key={position.id}>
                      <TD className="font-medium text-ink-900">{position.title}</TD>
                      <TD className="tabular">{position.seats}</TD>
                      <TD className="tabular">{position.candidates.length}</TD>
                      <TD className="max-w-[320px] text-ink-500">{position.description}</TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            </Card>
          ) : null}

          {tab === 'candidates' ? (
            <div className="mt-4 space-y-4">
              {ballot.map((position) => (
                <Card key={position.id}>
                  <CardHeader title={position.title} description={`${position.seats} seat${position.seats > 1 ? 's' : ''} · ${position.candidates.length} candidate${position.candidates.length === 1 ? '' : 's'}`} />
                  <ul className="divide-y divide-line">
                    {position.candidates.map((candidate) => (
                      <li key={candidate.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[0.8125rem] font-medium text-ink-900">{candidate.name}</p>
                          <Badge tone="outline">{candidate.year}</Badge>
                        </div>
                        <p className="mt-1 max-w-[80ch] text-[0.75rem] leading-5 text-ink-500">{candidate.manifesto}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          ) : null}

          {tab === 'results' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardHeader title="Vote count" description="Provisional count." action={<Badge tone="outline">Provisional</Badge>} />
                <TableWrap>
                  <THead><TR><TH>Position</TH><TH>Candidate</TH><TH className="text-right">Votes</TH><TH>Status</TH></TR></THead>
                  <TBody>
                    {ballot.flatMap((position) =>
                      position.candidates.map((candidate, index) => (
                        <TR key={`${position.id}-${candidate.id}`}>
                          <TD className="text-ink-500">{position.title}</TD>
                          <TD className="font-medium text-ink-900">{candidate.name}</TD>
                          <TD className="text-right tabular">{42 - index * 9 - position.id}</TD>
                          <TD>{index === 0 ? <Badge tone="green">Leading</Badge> : <Badge tone="outline">Counted</Badge>}</TD>
                        </TR>
                      )),
                    )}
                  </TBody>
                </TableWrap>
                <div className="border-t border-line px-4 py-3">
                  <p className="text-[0.6875rem] text-ink-400">Final results are published after committee verification.</p>
                </div>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader title="Turnout" />
                  <div className="space-y-3 p-4">
                    {[
                      { label: 'Eligible voters', value: '112' },
                      { label: 'Ballots recorded', value: '86' },
                      { label: 'Turnout', value: '76.8%' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-[0.75rem]">
                        <span className="text-ink-500">{item.label}</span>
                        <span className="font-semibold tabular text-ink-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Alert tone="warning" title="Do not publish early">
                  Publishing results before the count is verified undermines the election. Finalizing is logged in the audit trail.
                </Alert>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <DemoNotice />

      <ConfirmDialog
        open={finalizing}
        onOpenChange={setFinalizing}
        title="Finalize this election?"
        description="Results for every position will be locked and published to members. This cannot be undone."
        confirmLabel="Finalize results"
        destructive={false}
        onConfirm={() => {
          setStatus('finalized')
          push({ tone: 'success', title: 'Election finalized', description: 'No votes were counted and no member was notified.' })
        }}
      />
    </>
  )
}

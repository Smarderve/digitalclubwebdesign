import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ExternalLink, Gavel, Plus, Trophy, Users } from 'lucide-react'
import { demoAdminJudges, demoCompetitionSubmissions, demoCompetitions, demoEnrollments, demoLeaderboard } from '../../data/demo'
import { PageHeader, SectionTitle } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, Dialog, DialogContent, EmptyState, Field, Input, Select, StatusBadge, Tabs, TabsContent, TabsList, TabsTrigger, TableWrap, TBody, TD, TH, THead, TR, Textarea } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type CompetitionRow = {
  id: number
  title: string
  category: string
  frequency: 'weekly' | 'monthly'
  level: number
  status: string
  startsAt: string
  endsAt: string
  submissionType: string
  eligibility: string
  enrolled: number
  description: string
  criteria: { name: string; max: number; weight: number; visible: boolean }[]
  rewards: { rank: string; points: number; prize: string }[]
}

export function AdminCompetitions() {
  const [rows, setRows] = useState<CompetitionRow[]>(demoCompetitions as CompetitionRow[])
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'judging' | 'finalized'>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Algorithms', frequency: 'weekly', level: '1', endsAt: '2026-12-13', description: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { push } = useToast()

  const matches = useCallback((row: CompetitionRow, query: string) => `${row.title} ${row.category} ${row.status} ${row.eligibility}`.toLowerCase().includes(query), [])
  const base = rows.filter((row) => filter === 'all' || row.status === filter)
  const list = useAdminList(base, matches)

  return (
    <>
      <PageHeader
        title="Competitions"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Competitions' }]}
        actions={<Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>New competition</Button>}
      />

      <StatStrip>
        <SmallStat label="Open for entries" value={rows.filter((row) => row.status === 'published').length} hint="Members can submit" tone="brand" />
        <SmallStat label="In judging" value={rows.filter((row) => row.status === 'judging').length} hint="Scores in progress" tone="amber" />
        <SmallStat label="Enrolled members" value={rows.reduce((total, row) => total + row.enrolled, 0)} hint="Across competitions" />
        <SmallStat label="Finalized" value={rows.filter((row) => row.status === 'finalized').length} hint="Results published" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search competitions by title or category…" count={`${list.total} competitions`}>
          <FilterChips
            label="Competition status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'draft', label: 'Drafts' },
              { value: 'published', label: 'Open' },
              { value: 'judging', label: 'Judging' },
              { value: 'finalized', label: 'Finalized' },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} competitions` }}
          emptyTitle="No competitions match this filter"
          emptyDescription="Try another status or clear the search field."
          columns={[
            {
              id: 'title',
              header: 'Competition',
              sortValue: (row) => row.title,
              cell: (row) => (
                <div>
                  <Link to={`/admin/competitions/${row.id}`} className="font-medium text-ink-900 hover:text-brand-800">{row.title}</Link>
                  <p className="text-[0.6875rem] text-ink-400">{row.category} · Level {row.level}</p>
                </div>
              ),
            },
            { id: 'frequency', header: 'Runs', cell: (row) => <Badge tone="outline">{row.frequency}</Badge> },
            { id: 'enrolled', header: 'Enrolled', align: 'right', sortValue: (row) => row.enrolled, cell: (row) => <span className="tabular">{row.enrolled}</span> },
            { id: 'ends', header: 'Closes', sortValue: (row) => row.endsAt, cell: (row) => <span className="whitespace-nowrap text-ink-500">{formatDate(row.endsAt)}</span> },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.title}`}>
                  <DropdownItem to={`/admin/competitions/${row.id}`} icon={<Trophy className="h-3.5 w-3.5" />}>Open competition</DropdownItem>
                  <DropdownItem to={`/admin/competitions/${row.id}`} icon={<Gavel className="h-3.5 w-3.5" />}>Score submissions</DropdownItem>
                  <DropdownItem
                    icon={<Users className="h-3.5 w-3.5" />}
                    onSelect={() => push({ tone: 'info', title: 'Enrollments are available from the record page', description: 'Member enrollments are managed from the competition detail page.' })}
                  >
                    View enrollments
                  </DropdownItem>
                  {row.status === 'draft' ? (
                    <DropdownItem
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      onSelect={() => {
                        setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, status: 'published' } : entry)))
                        push({ tone: 'success', title: 'Competition published', description: 'No member notification was sent.' })
                      }}
                    >
                      Publish competition
                    </DropdownItem>
                  ) : null}
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Create a competition"
          description="Competitions start as drafts. Publishing makes the brief visible to eligible members."
          size="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  const next: Record<string, string> = {}
                  if (form.title.trim().length < 6) next.title = 'Enter a clear competition title.'
                  if (form.description.trim().length < 30) next.description = 'Describe the challenge and its rules.'
                  setErrors(next)
                  if (Object.keys(next).length) return
                  setRows((current) => [
                    {
                      id: Math.max(0, ...current.map((row) => row.id)) + 1,
                      title: form.title,
                      category: form.category,
                      frequency: form.frequency as 'weekly' | 'monthly',
                      level: Number(form.level),
                      status: 'draft',
                      startsAt: new Date().toISOString().slice(0, 10),
                      endsAt: form.endsAt,
                      submissionType: 'GitHub repository',
                      eligibility: 'All members',
                      enrolled: 0,
                      description: form.description,
                      criteria: [
                        { name: 'Correctness', max: 50, weight: 50, visible: true },
                        { name: 'Code clarity', max: 30, weight: 30, visible: true },
                        { name: 'Explanation', max: 20, weight: 20, visible: true },
                      ],
                      rewards: [{ rank: 'Top 3', points: 100, prize: 'Club points' }],
                    },
                    ...current,
                  ])
                  push({ tone: 'success', title: 'Draft competition created', description: 'Configure judging and rewards, then publish.' })
                  setOpen(false)
                }}
              >
                Create draft
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Title" htmlFor="competition-title" required error={errors.title}>
              <Input id="competition-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Weekly Challenge 07 — Trees and Recursion" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Frequency" htmlFor="competition-frequency">
                <Select id="competition-frequency" value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </Field>
              <Field label="Level" htmlFor="competition-level">
                <Select id="competition-level" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>
                  <option value="1">Level 1 · Foundation</option>
                  <option value="2">Level 2 · Intermediate</option>
                  <option value="3">Level 3 · Advanced</option>
                </Select>
              </Field>
              <Field label="Category" htmlFor="competition-category">
                <Select id="competition-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  <option>Algorithms</option>
                  <option>Product build</option>
                  <option>Data</option>
                  <option>Security</option>
                </Select>
              </Field>
            </div>
            <Field label="Closes" htmlFor="competition-ends">
              <Input id="competition-ends" type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
            </Field>
            <Field label="Brief" htmlFor="competition-description" required error={errors.description}>
              <Textarea id="competition-description" rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What should members build or solve?" />
            </Field>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AdminCompetitionDetail() {
  const { id } = useParams()
  const competition = demoCompetitions.find((row) => String(row.id) === id)
  const [tab, setTab] = useState('overview')
  const [confirming, setConfirming] = useState(false)
  const [status, setStatus] = useState(competition?.status ?? 'published')
  const { push } = useToast()

  if (!competition) {
    return (
      <>
        <PageHeader title="Competition not found" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Competitions', to: '/admin/competitions' }]} />
        <Card><div className="p-4"><EmptyState title="This competition is unavailable" description="It may have been removed." action={<ButtonLink to="/admin/competitions" size="sm">Back to competitions</ButtonLink>} /></div></Card>
      </>
    )
  }

  return (
    <>
      <Link to="/admin/competitions" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Competitions
      </Link>
      <PageHeader
        title={competition.title}
        description={`${competition.category} · Level ${competition.level} · ${formatDate(competition.startsAt)} to ${formatDate(competition.endsAt)}`}
        badge={<StatusBadge status={status} />}
        actions={
          <>
            <ButtonLink to={`/member/competitions/${competition.id}/leaderboard`} variant="outline" size="sm">Public leaderboard</ButtonLink>
            <Button size="sm" disabled={status === 'finalized'} onClick={() => setConfirming(true)}>
              {status === 'finalized' ? 'Results finalized' : 'Finalize results'}
            </Button>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Enrolled" value={competition.enrolled} hint="Eligible members" tone="brand" />
        <SmallStat label="Submissions" value={demoCompetitionSubmissions.length} hint="Received" />
        <SmallStat label="Reviewed" value={demoCompetitionSubmissions.filter((row) => row.status === 'reviewed').length} hint="Scored by judges" />
        <SmallStat label="Judges assigned" value={demoAdminJudges.filter((row) => row.active).length} hint="Active panel" />
      </StatStrip>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList ariaLabel="Competition management">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({demoCompetitionSubmissions.length})</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments ({demoEnrollments.length})</TabsTrigger>
          <TabsTrigger value="judging">Judging panel</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {tab === 'overview' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-4">
                <Card>
                  <CardHeader title="Brief" />
                  <div className="p-4">
                    <p className="text-[0.875rem] leading-7 text-ink-600">{competition.description}</p>
                    <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
                      {[
                        { label: 'Eligibility', value: competition.eligibility },
                        { label: 'Submission type', value: competition.submissionType },
                        { label: 'Opens', value: formatDate(competition.startsAt) },
                        { label: 'Closes', value: formatDate(competition.endsAt) },
                      ].map((item) => (
                        <div key={item.label} className="bg-surface px-4 py-3">
                          <p className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">{item.label}</p>
                          <p className="mt-0.5 text-[0.8125rem] font-medium text-ink-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card>
                  <CardHeader title="Judging criteria" description="Published to members before entries are scored." />
                  <TableWrap>
                    <THead><TR><TH>Criterion</TH><TH>Max</TH><TH>Weight</TH><TH>Visibility</TH></TR></THead>
                    <TBody>
                      {competition.criteria.map((criterion) => (
                        <TR key={criterion.name}>
                          <TD className="font-medium text-ink-900">{criterion.name}</TD>
                          <TD className="tabular">{criterion.max}</TD>
                          <TD className="tabular">{criterion.weight}%</TD>
                          <TD><Badge tone={criterion.visible ? 'green' : 'outline'}>{criterion.visible ? 'Published' : 'Hidden'}</Badge></TD>
                        </TR>
                      ))}
                    </TBody>
                  </TableWrap>
                </Card>
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader title="Rewards" description="Awarded when results are finalized." />
                  <ul className="divide-y divide-line">
                    {competition.rewards.map((reward) => (
                      <li key={reward.rank} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-[0.8125rem] font-medium text-ink-900">{reward.rank}</p>
                          <p className="text-[0.6875rem] text-ink-400">{reward.prize}</p>
                        </div>
                        <span className="text-[0.75rem] font-semibold tabular text-brand-700">+{reward.points} pts</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Alert tone="info" title="Finalizing publishes results">
                  Finalizing locks scores, publishes the leaderboard and awards points. Check every submission has been scored first.
                </Alert>
              </div>
            </div>
          ) : null}

          {tab === 'submissions' ? (
            <Card className="mt-4">
              <CardHeader title="Submissions" description="Judge each entry against the published criteria." action={<Badge tone="amber">{demoCompetitionSubmissions.filter((row) => row.status !== 'reviewed').length} unscored</Badge>} />
              <TableWrap>
                <THead><TR><TH>Member</TH><TH>Format</TH><TH>Submitted</TH><TH>Score</TH><TH>Rank</TH><TH>Status</TH><TH className="text-right">Actions</TH></TR></THead>
                <TBody>
                  {demoCompetitionSubmissions.map((row) => (
                    <TR key={row.id}>
                      <TD className="font-medium text-ink-900">{row.member}</TD>
                      <TD className="text-ink-500">{row.type}</TD>
                      <TD className="whitespace-nowrap text-ink-500">{formatDate(row.submitted, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</TD>
                      <TD className="tabular">{row.score || '—'}</TD>
                      <TD className="tabular">{row.rank ? `#${row.rank}` : '—'}</TD>
                      <TD><StatusBadge status={row.status} /></TD>
                      <TD className="text-right">
                        <RowActions label={`Actions for ${row.member}`}>
                          <DropdownItem icon={<Gavel className="h-3.5 w-3.5" />} onSelect={() => push({ tone: 'info', title: 'Scoring is available from the record page', description: `${row.member} — score entry is part of the live judging workflow.` })}>
                            Score submission
                          </DropdownItem>
                          <DropdownItem icon={<ExternalLink className="h-3.5 w-3.5" />} onSelect={() => push({ tone: 'info', title: 'Submission link opens externally' })}>
                            Open submission
                          </DropdownItem>
                        </RowActions>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
              <div className="border-t border-line px-4 py-3">
                <p className="text-[0.6875rem] text-ink-400">Ties are broken by submission time. Judges cannot score their own entry.</p>
              </div>
            </Card>
          ) : null}

          {tab === 'enrollments' ? (
            <Card className="mt-4">
              <CardHeader title="Enrollments" description="Members and teams registered for this competition." />
              <TableWrap>
                <THead><TR><TH>Member</TH><TH>Team</TH><TH>Enrolled</TH><TH>Status</TH></TR></THead>
                <TBody>
                  {demoEnrollments.map((row) => (
                    <TR key={row.id}>
                      <TD className="font-medium text-ink-900">{row.member}</TD>
                      <TD className="text-ink-500">{row.team}</TD>
                      <TD className="whitespace-nowrap text-ink-500">{formatDate(row.enrolled)}</TD>
                      <TD><StatusBadge status={row.status} /></TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            </Card>
          ) : null}

          {tab === 'judging' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardHeader title="Judging panel" description="Judges score submissions against published criteria." />
                <ul className="divide-y divide-line">
                  {demoAdminJudges.map((judge) => (
                    <li key={judge.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-[0.8125rem] font-medium text-ink-900">{judge.name}</p>
                        <p className="text-[0.6875rem] text-ink-400">{judge.role}</p>
                      </div>
                      <Badge tone={judge.active ? 'green' : 'neutral'} dot>{judge.active ? 'Active' : 'Inactive'}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader title="Panel notes" />
                  <div className="p-4">
                    <Field label="Internal note" htmlFor="judging-note" hint="Visible to administrators and judges only.">
                      <Textarea id="judging-note" rows={4} placeholder="Record any conflict of interest or scoring decision…" />
                    </Field>
                    <Button className="mt-3" variant="outline" size="sm" onClick={() => push({ tone: 'info', title: 'Note not saved', description: 'Judging notes are stored server-side in the live application.' })}>
                      Save note
                    </Button>
                  </div>
                </Card>
                <Alert tone="warning" title="Conflicts of interest">
                  A judge must withdraw from scoring an entry from their own team. Record the withdrawal in the audit log.
                </Alert>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <div className="mt-5">
        <SectionTitle title="Top scores" description="Current order before results are finalized." action={<Badge tone="outline">Provisional</Badge>} />
        <Card>
          <TableWrap>
            <THead><TR><TH>Rank</TH><TH>Member</TH><TH>Score</TH><TH>Time</TH><TH>Status</TH></TR></THead>
            <TBody>
              {demoLeaderboard.map((row) => (
                <TR key={row.rank}>
                  <TD className="font-semibold tabular">#{row.rank}</TD>
                  <TD className="font-medium text-ink-900">{row.name}</TD>
                  <TD className="tabular">{row.score.toFixed(1)}</TD>
                  <TD className="tabular text-ink-500">{row.time}</TD>
                  <TD><StatusBadge status={row.status} /></TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        </Card>
      </div>

      <DemoNotice />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Finalize this competition?"
        description="Scores are locked, the leaderboard is published and rewards are awarded. This cannot be undone in the live application."
        confirmLabel="Finalize results"
        destructive={false}
        onConfirm={() => {
          setStatus('finalized')
          push({ tone: 'success', title: 'Competition finalized', description: 'No points were awarded and no member was notified.' })
        }}
      />
    </>
  )
}

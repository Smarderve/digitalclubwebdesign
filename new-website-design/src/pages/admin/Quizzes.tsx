import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, Clock, Eye, ListChecks, Plus, Send, Settings2, Sparkles } from 'lucide-react'
import { demoQuizAnalytics, demoQuizQuestions, demoQuizzes } from '../../data/demo'
import { PageHeader, SectionTitle } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, DetailList, EmptyState, Field, Input, Select, StatusBadge, Switch, Tabs, TabsContent, TabsList, TabsTrigger, TableWrap, TBody, TD, TH, THead, TR, Textarea } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type QuizRow = (typeof demoQuizzes)[number]

export function AdminQuizzes() {
  const [rows, setRows] = useState<QuizRow[]>(demoQuizzes)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all')
  const { push } = useToast()

  const matches = useCallback((row: QuizRow, query: string) => `${row.title} ${row.topic} ${row.field} ${row.status}`.toLowerCase().includes(query), [])
  const base = rows.filter((row) => filter === 'all' || row.status === filter)
  const list = useAdminList(base, matches)

  return (
    <>
      <PageHeader
        title="Warmup quizzes"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Quizzes' }]}
        actions={
          <>
            <ButtonLink to="/admin/quizzes/analytics" variant="outline" size="sm" iconLeft={<BarChart3 className="h-3.5 w-3.5" />}>Analytics</ButtonLink>
            <ButtonLink to="/admin/quizzes/settings" variant="outline" size="sm" iconLeft={<Settings2 className="h-3.5 w-3.5" />}>Settings</ButtonLink>
            <ButtonLink to="/quizmaster/quizzes/create" size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />}>Create quiz</ButtonLink>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Quizzes" value={rows.length} hint="All records" tone="brand" />
        <SmallStat label="Open" value={rows.filter((row) => row.status === 'published').length} hint="Accepting attempts" />
        <SmallStat label="Attempts" value={demoQuizAnalytics.attempts} hint="All time" />
        <SmallStat label="Average score" value={`${demoQuizAnalytics.averageScore}%`} hint="Across open quizzes" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search quizzes by title, topic or field…" count={`${list.total} quizzes`}>
          <FilterChips
            label="Quiz status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'published', label: 'Open' },
              { value: 'draft', label: 'Drafts' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          emptyTitle="No quizzes match this filter"
          emptyDescription="Try another status or clear the search field."
          columns={[
            {
              id: 'title',
              header: 'Quiz',
              sortValue: (row) => row.title,
              cell: (row) => (
                <div>
                  <Link to={`/admin/quizzes/${row.id}`} className="font-medium text-ink-900 hover:text-brand-800">{row.title}</Link>
                  <p className="text-[0.6875rem] text-ink-400">{row.topic} · {row.field}</p>
                </div>
              ),
            },
            { id: 'questions', header: 'Questions', align: 'right', sortValue: (row) => row.questions, cell: (row) => <span className="tabular">{row.questions}</span> },
            { id: 'attempts', header: 'Attempts', align: 'right', sortValue: (row) => row.attempts, cell: (row) => <span className="tabular">{row.attempts}</span> },
            { id: 'average', header: 'Average', align: 'right', sortValue: (row) => row.average, cell: (row) => <span className="tabular">{row.average ? `${row.average}%` : '—'}</span> },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.title}`}>
                  <DropdownItem to={`/admin/quizzes/${row.id}`} icon={<Eye className="h-3.5 w-3.5" />}>Open quiz</DropdownItem>
                  <DropdownItem to={`/admin/quizzes/${row.id}`} icon={<ListChecks className="h-3.5 w-3.5" />}>Review questions</DropdownItem>
                  {row.status === 'published' ? (
                    <DropdownItem
                      icon={<Clock className="h-3.5 w-3.5" />}
                      onSelect={() => {
                        setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, status: 'closed' } : entry)))
                        push({ tone: 'info', title: 'Quiz closed', description: 'No attempts were affected.' })
                      }}
                    >
                      Close quiz
                    </DropdownItem>
                  ) : null}
                  {row.status === 'draft' ? (
                    <DropdownItem
                      icon={<Send className="h-3.5 w-3.5" />}
                      onSelect={() => {
                        setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, status: 'published' } : entry)))
                        push({ tone: 'success', title: 'Quiz published', description: 'No notification was sent to members.' })
                      }}
                    >
                      Publish quiz
                    </DropdownItem>
                  ) : null}
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">Quizmasters create and publish warmups. Administrators keep oversight and can close a quiz at any time.</p>
      <DemoNotice />
    </>
  )
}

export function AdminQuizDetail() {
  const { id } = useParams()
  const quiz = demoQuizzes.find((row) => String(row.id) === id)
  const [tab, setTab] = useState('questions')
  const [status, setStatus] = useState(quiz?.status ?? 'published')
  const [closing, setClosing] = useState(false)
  const { push } = useToast()

  if (!quiz) {
    return (
      <>
        <PageHeader title="Quiz not found" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Quizzes', to: '/admin/quizzes' }]} />
        <Card><div className="p-4"><EmptyState title="This quiz is unavailable" description="It may have been removed." action={<ButtonLink to="/admin/quizzes" size="sm">Back to quizzes</ButtonLink>} /></div></Card>
      </>
    )
  }

  return (
    <>
      <Link to="/admin/quizzes" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Quizzes
      </Link>
      <PageHeader
        title={quiz.title}
        description={`${quiz.topic} · ${quiz.field} · ${quiz.duration} minutes`}
        badge={<StatusBadge status={status} />}
        actions={
          <>
            <ButtonLink to={`/quizmaster/quizzes/${quiz.id}/builder`} variant="outline" size="sm">Open builder</ButtonLink>
            <Button size="sm" variant={status === 'closed' ? 'outline' : 'primary'} disabled={status === 'closed'} onClick={() => setClosing(true)}>
              {status === 'closed' ? 'Quiz closed' : 'Close quiz'}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Questions', value: quiz.questions },
          { label: 'Attempts', value: quiz.attempts },
          { label: 'Average', value: quiz.average ? `${quiz.average}%` : '—' },
          { label: 'Best score', value: quiz.best ? `${quiz.best}%` : '—' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            <p className="mt-1.5 text-[1.25rem] font-semibold tabular tracking-tight text-ink-950">{item.value}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList ariaLabel="Quiz management">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {tab === 'questions' ? (
            <Card className="mt-4">
              <CardHeader title="Question set" description="Answers are not shown to members until the attempt is submitted." action={<Badge tone="outline">Single choice</Badge>} />
              <ol className="divide-y divide-line">
                {demoQuizQuestions.slice(0, quiz.questions).map((question, index) => (
                  <li key={question.id} className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[0.6875rem] font-semibold text-ink-600">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.8125rem] font-medium text-ink-900">{question.prompt}</p>
                        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                          {question.options.map((option) => (
                            <li
                              key={option}
                              className={
                                option === question.options[question.correct]
                                  ? 'rounded-sm border border-brand-200 bg-brand-50/60 px-2.5 py-1.5 text-[0.75rem] font-medium text-brand-900'
                                  : 'rounded-sm border border-line bg-surface px-2.5 py-1.5 text-[0.75rem] text-ink-600'
                              }
                            >
                              {option}
                              {option === question.options[question.correct] ? <span className="ml-1.5 text-[0.625rem] uppercase tracking-wide text-brand-700">Correct</span> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="border-t border-line px-4 py-3">
                <p className="text-[0.6875rem] text-ink-400">Editing questions is done from the quiz builder by the quizmaster who owns the quiz.</p>
              </div>
            </Card>
          ) : null}

          {tab === 'details' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardHeader title="Quiz record" />
                <div className="p-4">
                  <DetailList
                    items={[
                      { label: 'Field', value: quiz.field },
                      { label: 'Topic', value: quiz.topic },
                      { label: 'Status', value: <StatusBadge status={status} /> },
                      { label: 'Time limit', value: `${quiz.duration} minutes` },
                      { label: 'Questions', value: quiz.questions },
                      { label: 'Closes', value: quiz.closesAt === '—' ? 'Not scheduled' : formatDate(quiz.closesAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                      { label: 'Attempts allowed', value: '2' },
                      { label: 'Points', value: '60' },
                    ]}
                  />
                  <p className="mt-4 text-[0.8125rem] leading-6 text-ink-600">{quiz.description}</p>
                </div>
              </Card>
              <div className="space-y-4">
                <Alert tone="info" title="Attempts are individual">
                  Members may attempt a warmup twice. The highest completed attempt counts toward points.
                </Alert>
                <Card>
                  <CardHeader title="Integrity" />
                  <p className="px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
                    Leaving an attempt is recorded. Repeated violations should be reviewed by a quizmaster before points are awarded.
                  </p>
                </Card>
              </div>
            </div>
          ) : null}

          {tab === 'results' ? (
            <Card className="mt-4">
              <CardHeader title="Recent attempts" description="Latest submitted scores" />
              <TableWrap>
                <THead><TR><TH>Member</TH><TH>Quiz</TH><TH>Score</TH><TH>Submitted</TH></TR></THead>
                <TBody>
                  {demoQuizAnalytics.recent.map((row) => (
                    <TR key={`${row.title}-${row.member}`}>
                      <TD className="font-medium text-ink-900">{row.member}</TD>
                      <TD className="text-ink-500">{row.title}</TD>
                      <TD className="tabular font-semibold">{row.score}%</TD>
                      <TD className="whitespace-nowrap text-ink-500">{formatDate(row.submitted)}</TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>

      <DemoNotice />

      <ConfirmDialog
        open={closing}
        onOpenChange={setClosing}
        title="Close this quiz?"
        description="Members will not be able to start a new attempt. Existing results are kept and remain visible."
        confirmLabel="Close quiz"
        destructive={false}
        onConfirm={() => {
          setStatus('closed')
          push({ tone: 'info', title: 'Quiz closed' })
        }}
      />
    </>
  )
}

export function AdminQuizAnalytics() {
  const [range, setRange] = useState('semester')

  return (
    <>
      <PageHeader
        title="Quiz analytics"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Quizzes', to: '/admin/quizzes' }, { label: 'Analytics' }]}
        actions={
          <>
            <Select value={range} onChange={(event) => setRange(event.target.value)} className="h-8 w-[160px] text-[0.75rem]" aria-label="Reporting period">
              <option value="semester">This semester</option>
              <option value="month">This month</option>
              <option value="all">All time</option>
            </Select>
            <ButtonLink to="/admin/quizzes" variant="outline" size="sm">All quizzes</ButtonLink>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Quizzes" value={demoQuizAnalytics.totalQuizzes} hint={`${demoQuizAnalytics.published} published`} tone="brand" />
        <SmallStat label="Attempts" value={demoQuizAnalytics.attempts} hint="Submissions received" />
        <SmallStat label="Average score" value={`${demoQuizAnalytics.averageScore}%`} hint="Across all attempts" />
        <SmallStat label="Completion" value="86%" hint="Started attempts submitted" />
      </StatStrip>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="Performance by field" description="Average score and attempts per topic area." />
          <div className="space-y-4 p-4">
            {demoQuizAnalytics.byField.map((row) => (
              <div key={row.field}>
                <div className="flex items-center justify-between text-[0.75rem]">
                  <span className="font-medium text-ink-800">{row.field}</span>
                  <span className="tabular text-ink-500">{row.average}% · {row.attempts} attempts</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${row.average}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-ink-400">Scores below 65% usually indicate a topic that needs a follow-up session.</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Participation" description={`Reporting period: ${range === 'semester' ? 'this semester' : range === 'month' ? 'this month' : 'all time'}`} />
          <div className="p-4">
            <div className="flex items-center justify-between text-[0.75rem]">
              <span className="text-ink-500">Members who attempted a warmup</span>
              <span className="font-semibold tabular text-ink-900">74 of 128</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
              <div className="h-full w-[58%] rounded-full bg-brand-600" />
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                { label: 'First attempts', value: '111' },
                { label: 'Repeat attempts', value: '23' },
                { label: 'Abandoned attempts', value: '9' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[0.75rem]">
                  <span className="text-ink-500">{item.label}</span>
                  <span className="font-medium tabular text-ink-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <SectionTitle title="Recent submissions" description="Latest completed attempts across all quizzes." action={<Badge tone="outline">Live ordering in the app</Badge>} />
        <Card>
          <TableWrap>
            <THead><TR><TH>Member</TH><TH>Quiz</TH><TH>Score</TH><TH>Submitted</TH></TR></THead>
            <TBody>
              {demoQuizAnalytics.recent.map((row) => (
                <TR key={`${row.title}-${row.member}`}>
                  <TD className="font-medium text-ink-900">{row.member}</TD>
                  <TD className="text-ink-500">{row.title}</TD>
                  <TD className="tabular font-semibold">{row.score}%</TD>
                  <TD className="whitespace-nowrap text-ink-500">{formatDate(row.submitted)}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        </Card>
      </div>

      <div className="mt-4">
        <Alert tone="info" title="How this data is used">
          Analytics inform the learning programme. Individual scores are not shared publicly beyond the warmup leaderboard.
        </Alert>
      </div>
      <DemoNotice />
    </>
  )
}

export function AdminQuizSettings() {
  const [attempts, setAttempts] = useState('2')
  const [points, setPoints] = useState('60')
  const [shuffle, setShuffle] = useState(true)
  const [leaderboard, setLeaderboard] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(false)
  const { push } = useToast()

  return (
    <>
      <PageHeader
        title="Quiz settings"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Quizzes', to: '/admin/quizzes' }, { label: 'Settings' }]}
        actions={<ButtonLink to="/admin/quizzes" variant="outline" size="sm">All quizzes</ButtonLink>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Attempt rules" description="Applies to warmups created from now on." />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Attempts allowed" htmlFor="quiz-attempts" hint="Members keep their highest score.">
                <Select id="quiz-attempts" value={attempts} onChange={(event) => setAttempts(event.target.value)}>
                  <option value="1">1 attempt</option>
                  <option value="2">2 attempts</option>
                  <option value="3">3 attempts</option>
                  <option value="unlimited">Unlimited</option>
                </Select>
              </Field>
              <Field label="Points per warmup" htmlFor="quiz-points" hint="Awarded once, on the best attempt.">
                <Input id="quiz-points" type="number" min={0} value={points} onChange={(event) => setPoints(event.target.value)} />
              </Field>
            </div>
            <div className="space-y-4 border-t border-line px-4 py-4">
              <Switch checked={shuffle} onCheckedChange={setShuffle} label="Shuffle question order" description="Each member sees questions in a different order." />
              <Switch checked={leaderboard} onCheckedChange={setLeaderboard} label="Publish warmup leaderboard" description="Show scores to members after the quiz closes." />
            </div>
          </Card>

          <Card>
            <CardHeader title="Question generation" description="AI-assisted drafting is optional and reviewed by a quizmaster." />
            <div className="space-y-4 p-4">
              <Switch
                checked={aiEnabled}
                onCheckedChange={(value) => {
                  setAiEnabled(value)
                  push({ tone: 'info', title: value ? 'AI-assisted drafting enabled' : 'AI-assisted drafting disabled' })
                }}
                label="Allow AI-assisted question drafts"
                description="Drafts must be reviewed before publishing."
              />
              <div className="rounded-md border border-line bg-canvas/50 p-3">
                <p className="text-[0.75rem] leading-5 text-ink-500">
                  Provider: <span className="font-medium text-ink-800">Configured on server</span>. API keys are never stored in the browser.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => push({ tone: 'info', title: 'Defaults unchanged' })}>Reset</Button>
            <Button size="sm" onClick={() => push({ tone: 'success', title: 'Quiz defaults saved', description: `${attempts} attempt(s), ${points} points. No production setting changed.` })}>Save defaults</Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Current defaults" />
            <div className="p-4">
              <DetailList
                items={[
                  { label: 'Attempts', value: attempts === 'unlimited' ? 'Unlimited' : attempts },
                  { label: 'Points', value: points },
                  { label: 'Shuffle questions', value: shuffle ? 'On' : 'Off' },
                  { label: 'Leaderboard', value: leaderboard ? 'Published' : 'Hidden' },
                  { label: 'AI drafts', value: aiEnabled ? 'Enabled' : 'Disabled' },
                ]}
              />
            </div>
          </Card>
          <Alert tone="info" title="Changing defaults">
            New settings apply to quizzes created afterwards. Existing quizzes keep the rules they were published with.
          </Alert>
          <Card>
            <CardHeader title="Quizmaster" description="Warmups are created by quizmasters." />
            <div className="px-4 py-3">
              <p className="text-[0.8125rem] font-medium text-ink-900">Samuel Mwita</p>
              <p className="text-[0.6875rem] text-ink-400">Quizmaster · 3 quizzes this semester</p>
              <ButtonLink to="/admin/members" variant="outline" size="xs" className="mt-2">Manage quizmaster roles</ButtonLink>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[0.6875rem] text-ink-400">
        <Sparkles className="h-3 w-3" aria-hidden />
        AI assistance is a drafting aid only; a human quizmaster is responsible for every published question.
      </div>
      <DemoNotice />
    </>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bell, BellOff, CheckCircle2, Clock, ListChecks, Lock, Timer, Trophy } from 'lucide-react'
import { demoLeaderboard, demoQuizQuestions, demoQuizzes } from '../../data/demo'
import { PageHeader, SectionTitle } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, EmptyState, StatusBadge, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { cn, formatDate } from '../../lib/utils'

const statusTone: Record<string, 'green' | 'neutral' | 'amber'> = { published: 'green', draft: 'amber', closed: 'neutral' }

export function Warmups({ embedded = false }: { embedded?: boolean } = {}) {
  const [filter, setFilter] = useState<'all' | 'published' | 'closed'>('all')
  const published = demoQuizzes.filter((quiz) => quiz.status === 'published')
  const closed = demoQuizzes.filter((quiz) => quiz.status === 'closed')
  const visible = demoQuizzes.filter((quiz) => quiz.status !== 'draft' && (filter === 'all' || quiz.status === filter))

  return (
    <>
      {embedded ? null : (
        <PageHeader
          title="Warmup quizzes"
          description="Short quizzes published by quizmasters before or after a session. Warmups are low-stakes: the best attempt counts toward points."
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups' }]}
          actions={<ButtonLink to="/member/sessions/timetable" variant="outline" size="sm">Session timetable</ButtonLink>}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Open now', value: published.length, hint: 'Accepting attempts' },
          { label: 'Closed', value: closed.length, hint: 'Results published' },
          { label: 'Your best score', value: '88%', hint: 'React Fundamentals' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-white p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            <p className="mt-2 text-[1.375rem] font-semibold tabular tracking-tight text-ink-950">{item.value}</p>
            <p className="mt-0.5 text-[0.6875rem] text-ink-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {[
          { value: 'all' as const, label: 'All warmups' },
          { value: 'published' as const, label: 'Open' },
          { value: 'closed' as const, label: 'Closed' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'h-7 rounded-full border px-3 text-[0.75rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700',
              filter === option.value ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
        <ul className="divide-y divide-line">
          {visible.length ? (
            visible.map((quiz) => (
              <li key={quiz.id}>
                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/member/quizzes/${quiz.id}`} className="text-[0.875rem] font-semibold text-ink-950 hover:text-brand-800">
                        {quiz.title}
                      </Link>
                      <Badge tone={statusTone[quiz.status]}>{quiz.status}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 max-w-[70ch] text-[0.75rem] leading-5 text-ink-500">{quiz.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.6875rem] text-ink-400">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{quiz.duration} min</span>
                      <span className="inline-flex items-center gap-1"><ListChecks className="h-3 w-3" aria-hidden />{quiz.questions} questions</span>
                      <span>Closes {quiz.closesAt === '—' ? '—' : formatDate(quiz.closesAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{quiz.attempts} attempts</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-[0.6875rem] text-ink-400">Best</p>
                      <p className="text-[0.8125rem] font-semibold tabular text-ink-900">{quiz.best ? `${quiz.best}%` : '—'}</p>
                    </div>
                    <ButtonLink to={`/member/quizzes/${quiz.id}`} variant="outline" size="sm">Open</ButtonLink>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="p-4">
              <EmptyState title="No warmups in this filter" description="Try another filter, or check back after the next session." />
            </li>
          )}
        </ul>
      </div>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Warmups are published by quizmasters. One attempt is recorded at a time; the highest score is used for points. Do not share questions
        with members who have not attempted the warmup.
      </p>
    </>
  )
}

export function WarmupDetail() {
  const { id } = useParams()
  const quiz = demoQuizzes.find((entry) => String(entry.id) === id)
  const [reminders, setReminders] = useState(true)
  const [startOpen, setStartOpen] = useState(false)
  const navigate = useNavigate()
  const { push } = useToast()

  if (!quiz) {
    return (
      <>
        <PageHeader title="Warmup not found" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups', to: '/member/quizzes' }]} />
        <Card>
          <div className="p-4">
            <EmptyState title="This warmup is unavailable" description="It may have been unpublished or the link is incorrect." action={<ButtonLink to="/member/quizzes" size="sm">Back to warmups</ButtonLink>} />
          </div>
        </Card>
      </>
    )
  }

  const live = quiz.status === 'published'

  return (
    <>
      <Link to="/member/quizzes" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All warmups
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="rounded-lg border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="outline">{quiz.field}</Badge>
                <StatusBadge status={quiz.status} />
              </div>
              <h1 className="mt-2 text-[1.375rem] font-semibold leading-snug tracking-[-0.01em] text-ink-950">{quiz.title}</h1>
              <p className="mt-1 text-[0.8125rem] text-ink-500">{quiz.topic}</p>
            </div>
            <div className="px-5 py-4">
              <p className="max-w-[65ch] text-[0.875rem] leading-7 text-ink-700">{quiz.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-line py-4 sm:grid-cols-4">
                {[
                  { label: 'Questions', value: quiz.questions },
                  { label: 'Time limit', value: `${quiz.duration} min` },
                  { label: 'Attempts', value: '2' },
                  { label: 'Points', value: '60' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[0.6875rem] uppercase tracking-[0.08em] text-ink-400">{item.label}</p>
                    <p className="mt-1 text-[0.8125rem] font-medium tabular text-ink-900">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-line bg-canvas/40 p-4">
                <p className="text-[0.8125rem] font-semibold text-ink-900">How the warmup works</p>
                <ul className="mt-2 space-y-1.5 text-[0.75rem] leading-5 text-ink-500">
                  <li>• Questions appear one at a time. You can move back before submitting.</li>
                  <li>• The timer starts when you begin and cannot be paused.</li>
                  <li>• Leaving the attempt is recorded; repeated leaving may end the attempt.</li>
                  <li>• Your highest completed attempt counts for points.</li>
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  size="md"
                  disabled={!live}
                  onClick={() => setStartOpen(true)}
                  iconLeft={live ? <Timer className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                >
                  {live ? 'Start attempt' : 'Warmup closed'}
                </Button>
                <ButtonLink to={`/member/quizzes/${quiz.id}/leaderboard`} variant="outline" size="md">Leaderboard</ButtonLink>
                {!live ? <span className="text-[0.6875rem] text-ink-400">Only open warmups can be attempted.</span> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-white">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.9375rem] font-semibold text-ink-950">Your results</h2>
            </div>
            <dl className="divide-y divide-line px-4">
              <div className="flex items-center justify-between py-3">
                <dt className="text-[0.75rem] text-ink-500">Best score</dt>
                <dd className="text-[0.8125rem] font-semibold tabular text-ink-900">{quiz.best ? `${quiz.best}%` : 'Not attempted'}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-[0.75rem] text-ink-500">Attempts used</dt>
                <dd className="text-[0.8125rem] font-medium tabular text-ink-900">{quiz.best ? '1 of 2' : '0 of 2'}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-[0.75rem] text-ink-500">Closes</dt>
                <dd className="text-right text-[0.8125rem] font-medium text-ink-900">
                  {quiz.closesAt === '—' ? '—' : formatDate(quiz.closesAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
            </dl>
            {quiz.best ? (
              <div className="border-t border-line px-4 py-3">
                <ButtonLink to={`/member/quizzes/${quiz.id}/result`} variant="outline" size="sm">Review last result</ButtonLink>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setReminders((value) => !value)
              push({ tone: 'info', title: reminders ? 'Reminder turned off' : 'Reminder turned on', description: 'Prototype toggle — preference is not saved to the server.' })
            }}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3 text-left hover:bg-ink-50/50"
          >
            <span>
              <span className="block text-[0.8125rem] font-medium text-ink-900">Closing reminder</span>
              <span className="block text-[0.6875rem] text-ink-400">Notify me before this warmup closes</span>
            </span>
            {reminders ? <Bell className="h-4 w-4 text-brand-700" aria-hidden /> : <BellOff className="h-4 w-4 text-ink-400" aria-hidden />}
          </button>

          <Alert tone="info" title="Academic honesty">
            Warmups are individual work unless the quizmaster says otherwise. Sharing answers or using another person's account is treated as
            misconduct.
          </Alert>
        </div>
      </div>

      <ConfirmDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        title="Start the timer now?"
        description={`You will have ${quiz.duration} minutes for ${quiz.questions} questions. The attempt is a prototype demonstration and is not recorded.`}
        confirmLabel="Start attempt"
        destructive={false}
        onConfirm={() => navigate(`/member/quizzes/${quiz.id}/take`)}
      />
    </>
  )
}

export function WarmupTake() {
  const { id } = useParams()
  const quiz = demoQuizzes.find((entry) => String(entry.id) === id)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const navigate = useNavigate()

  if (!quiz) return <EmptyState title="Warmup unavailable" description="This warmup is not published." />

  const questions = demoQuizQuestions.slice(0, quiz.questions)
  const question = questions[index]
  const answered = Object.keys(answers).length

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-400">{quiz.title}</p>
          <h1 className="mt-0.5 text-[1.25rem] font-semibold tracking-[-0.01em] text-ink-950">Question {index + 1} of {questions.length}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-white px-2.5 py-1.5 text-[0.75rem] font-medium tabular text-ink-700">
            <Timer className="h-3.5 w-3.5 text-ink-400" aria-hidden />
            {quiz.duration}:00 remaining
          </span>
          <button type="button" onClick={() => navigate('/member/quizzes')} className="text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
            Exit
          </button>
        </div>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1} aria-label="Warmup progress">
        <div className="h-full bg-brand-700 transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <Card className="mt-4">
        <div className="px-5 py-5">
          <fieldset>
            <legend className="text-[1rem] font-medium leading-7 text-ink-950">{question.prompt}</legend>
            <div className="mt-4 space-y-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === optionIndex
                return (
                  <label
                    key={option}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-[0.8125rem] transition-colors',
                      selected ? 'border-brand-600 bg-brand-50/60' : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50',
                    )}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={selected}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                      className="mt-0.5 h-4 w-4 accent-brand-700"
                    />
                    <span className={selected ? 'font-medium text-ink-950' : 'text-ink-700'}>{option}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-ink-50/40 px-5 py-3">
          <p className="text-[0.6875rem] text-ink-400">{answered} of {questions.length} answered</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
              Previous
            </Button>
            {index === questions.length - 1 ? (
              <Button size="sm" onClick={() => setConfirmOpen(true)}>Submit attempt</Button>
            ) : (
              <Button size="sm" onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))} iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                Next question
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-3 flex items-start gap-2 text-[0.6875rem] leading-5 text-ink-400">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Leaving this page is recorded as a violation. This prototype does not record anything; the warning text mirrors the live quiz rules.
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit this attempt?"
        description={`You have answered ${answered} of ${questions.length} questions. You cannot change answers after submitting.`}
        confirmLabel="Submit"
        destructive={false}
        onConfirm={() => navigate(`/member/quizzes/${quiz.id}/result`)}
      />
    </div>
  )
}

export function WarmupResult() {
  const { id } = useParams()
  const quiz = demoQuizzes.find((entry) => String(entry.id) === id)
  const score = 88
  const correct = Math.round((score / 100) * demoQuizQuestions.length)

  if (!quiz) return <EmptyState title="Result unavailable" description="This warmup is not published." />

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={`/member/quizzes/${quiz.id}`} className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Warmup overview
          </Link>
          <h1 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.02em] text-ink-950">{quiz.title}</h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">Attempt completed · {formatDate(new Date())} · demonstration result</p>
        </div>
        <Badge tone="green">Submitted</Badge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-lg border border-line bg-white">
          <div className="px-5 py-5 text-center">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">Your score</p>
            <p className="mt-2 text-[2.5rem] font-semibold leading-none tabular tracking-tight text-brand-800">{score}%</p>
            <p className="mt-2 text-[0.75rem] text-ink-500">{correct} of {demoQuizQuestions.length} correct</p>
          </div>
          <dl className="divide-y divide-line border-t border-line px-4">
            <div className="flex justify-between py-2.5">
              <dt className="text-[0.75rem] text-ink-500">Points awarded</dt>
              <dd className="text-[0.75rem] font-semibold text-brand-700">+60</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[0.75rem] text-ink-500">Attempt</dt>
              <dd className="text-[0.75rem] font-medium text-ink-900">1 of 2</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[0.75rem] text-ink-500">Time used</dt>
              <dd className="text-[0.75rem] font-medium tabular text-ink-900">6m 12s</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
            <ButtonLink to={`/member/quizzes/${quiz.id}/leaderboard`} variant="outline" size="sm">Leaderboard</ButtonLink>
            <ButtonLink to="/member/quizzes" variant="ghost" size="sm">All warmups</ButtonLink>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[0.9375rem] font-semibold text-ink-950">Answer review</h2>
            <p className="mt-0.5 text-[0.6875rem] text-ink-400">Correct answers are shown after submission.</p>
          </div>
          <ol className="divide-y divide-line">
            {demoQuizQuestions.map((question, index) => (
              <li key={question.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[0.625rem] font-semibold text-brand-800">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] font-medium text-ink-900">{question.prompt}</p>
                    <p className="mt-1 text-[0.75rem] text-ink-500">
                      Your answer: <span className="font-medium text-ink-800">{question.options[question.correct]}</span> · Correct
                    </p>
                  </div>
                  <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                </div>
              </li>
            ))}
          </ol>
          <div className="border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] leading-5 text-ink-400">
              This review uses demonstration answers. In the live application, your selected answers are fetched from the attempt record.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export function WarmupLeaderboard() {
  const { id } = useParams()
  const quiz = demoQuizzes.find((entry) => String(entry.id) === id)

  if (!quiz) return <EmptyState title="Leaderboard unavailable" description="This warmup is not published." />

  return (
    <>
      <PageHeader
        title="Warmup leaderboard"
        description={`${quiz.title} · results are shown after the warmup closes.`}
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups', to: '/member/quizzes' }, { label: 'Leaderboard' }]}
        actions={<ButtonLink to={`/member/quizzes/${quiz.id}`} variant="outline" size="sm" iconLeft={<ArrowLeft className="h-3.5 w-3.5" />}>Back to warmup</ButtonLink>}
      />

      <Card>
        <CardHeader title="Results" description="Ranked by score, then by submission time." action={<Badge tone="outline">{quiz.attempts} attempts</Badge>} />
        <TableWrap>
          <THead>
            <TR>
              <TH className="w-[70px]">Rank</TH>
              <TH>Member</TH>
              <TH>Level</TH>
              <TH>Score</TH>
              <TH>Time</TH>
              <TH>Status</TH>
              <TH>Points</TH>
            </TR>
          </THead>
          <TBody>
            {demoLeaderboard.map((row) => (
              <TR key={row.rank} className={row.name === 'Amina Juma' ? 'bg-brand-50/40' : undefined}>
                <TD className="font-semibold tabular text-ink-700">#{row.rank}</TD>
                <TD>
                  <span className="font-medium text-ink-900">{row.name}</span>
                  {row.name === 'Amina Juma' ? <Badge tone="green" className="ml-2">You</Badge> : null}
                </TD>
                <TD className="text-ink-500">Level {row.level}</TD>
                <TD className="font-semibold tabular text-ink-900">{row.score.toFixed(1)}</TD>
                <TD className="tabular text-ink-500">{row.time}</TD>
                <TD><StatusBadge status={row.status} /></TD>
                <TD className="tabular text-brand-700">+{row.points}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
          <p className="text-[0.6875rem] text-ink-400">Scores are ranked before points are awarded. Ties are broken by submission time.</p>
          <Link to="/member/rankings" className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            Club rankings
          </Link>
        </div>
      </Card>

      <div className="mt-4">
        <SectionTitle title="Not on the list?" description="Only completed attempts appear. If your attempt is missing, contact the quizmaster." />
        <Alert tone="info" title="Demonstration results">
          This table shows sample results from the prototype data set. Real scores are calculated from submitted attempts.
        </Alert>
      </div>
    </>
  )
}

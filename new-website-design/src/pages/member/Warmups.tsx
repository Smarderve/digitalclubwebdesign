import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ListChecks, Lock, Timer, Trophy, X } from 'lucide-react'
import { ApiError } from '../../lib/api'
import {
  memberApi,
  type AttemptAnswerInput,
  type QuizDetail,
  type StartedAttempt,
} from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  StatusBadge,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { cn, formatDate } from '../../lib/utils'

function errorText(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function clockDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export function Warmups({ embedded = false }: { embedded?: boolean } = {}) {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const { data, loading, error, reload } = useMemberData(() => memberApi.quizzes(), [])

  const header = embedded ? null : (
    <PageHeader
      title="Warmup quizzes"
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups' }]}
      actions={
        <ButtonLink to="/member/sessions/timetable" variant="outline" size="sm">
          Session timetable
        </ButtonLink>
      }
    />
  )

  if (loading && !data) {
    return (
      <>
        {header}
        <LoadingBlock rows={4} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        {header}
        <ErrorBlock message={error ?? 'Warmups could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const open = data.filter((quiz) => quiz.is_live)
  const closed = data.filter((quiz) => !quiz.is_live)
  const visible = data.filter((quiz) => (filter === 'all' ? true : filter === 'open' ? quiz.is_live : !quiz.is_live))
  const scores = data.map((quiz) => quiz.attempt?.score).filter((score): score is number => score !== null && score !== undefined)
  const best = scores.length ? Math.max(...scores) : null

  return (
    <>
      {header}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Open now', value: open.length, hint: 'Accepting attempts' },
          { label: 'Closed', value: closed.length, hint: 'Results published' },
          { label: 'Your best score', value: best === null ? '—' : `${best}%`, hint: `${scores.length} scored attempts` },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            <p className="mt-2 text-[1.375rem] font-semibold tabular tracking-tight text-ink-950">{item.value}</p>
            <p className="mt-0.5 text-[0.6875rem] text-ink-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {[
          { value: 'all' as const, label: `All warmups (${data.length})` },
          { value: 'open' as const, label: `Open (${open.length})` },
          { value: 'closed' as const, label: `Closed (${closed.length})` },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'h-7 rounded-full border px-3 text-[0.75rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700',
              filter === option.value ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-surface text-ink-600 hover:bg-ink-50',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
        <ul className="divide-y divide-line">
          {visible.length ? (
            visible.map((quiz) => (
              <li key={quiz.id}>
                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/member/quizzes/${quiz.id}`}
                        className="text-[0.875rem] font-semibold text-ink-950 hover:text-brand-800"
                      >
                        {quiz.title}
                      </Link>
                      <Badge tone={quiz.is_live ? 'green' : 'neutral'}>{quiz.is_live ? 'Open' : 'Closed'}</Badge>
                      {quiz.attempt ? <Badge tone="outline">{quiz.attempt.status.replace('_', ' ')}</Badge> : null}
                    </div>
                    {quiz.description ? (
                      <p className="mt-1 line-clamp-2 max-w-[70ch] text-[0.75rem] leading-5 text-ink-500">{quiz.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.6875rem] text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden />
                        {quiz.duration_minutes} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="h-3 w-3" aria-hidden />
                        {quiz.total_questions} questions
                      </span>
                      {quiz.field_of_study ? <span>{quiz.field_of_study}</span> : null}
                      {quiz.scheduled_start_at ? (
                        <span>
                          Opens {formatDate(quiz.scheduled_start_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-[0.6875rem] text-ink-400">Score</p>
                      <p className="text-[0.8125rem] font-semibold tabular text-ink-900">
                        {quiz.attempt?.score !== null && quiz.attempt?.score !== undefined ? `${quiz.attempt.score}%` : '—'}
                      </p>
                    </div>
                    <ButtonLink to={`/member/quizzes/${quiz.id}`} variant="outline" size="sm">
                      Open
                    </ButtonLink>
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
        Warmups are published by quizmasters. The highest completed score is used for points. Do not share questions with members who
        have not attempted the warmup.
      </p>
    </>
  )
}

export function WarmupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [startOpen, setStartOpen] = useState(false)
  const { data: quiz, loading, error, reload } = useMemberData(() => memberApi.quiz(Number(id)), [id])

  const header = (
    <Link
      to="/member/quizzes"
      className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      All warmups
    </Link>
  )

  if (loading && !quiz) {
    return (
      <>
        <PageHeader title="Warmup" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups', to: '/member/quizzes' }]} />
        <LoadingBlock rows={3} />
      </>
    )
  }

  if (error || !quiz) {
    return (
      <>
        <PageHeader title="Warmup" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups', to: '/member/quizzes' }]} />
        {error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : (
          <Card>
            <div className="p-4">
              <EmptyState
                title="This warmup is unavailable"
                description="It may have been unpublished or the link is incorrect."
                action={
                  <ButtonLink to="/member/quizzes" size="sm">
                    Back to warmups
                  </ButtonLink>
                }
              />
            </div>
          </Card>
        )}
      </>
    )
  }

  return (
    <>
      {header}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {quiz.field_of_study ? <Badge tone="outline">{quiz.field_of_study}</Badge> : null}
                <StatusBadge status={quiz.is_live ? 'open' : 'closed'} />
              </div>
              <h1 className="mt-2 text-[1.375rem] font-semibold leading-snug tracking-[-0.01em] text-ink-950">{quiz.title}</h1>
              {quiz.topic ? <p className="mt-1 text-[0.8125rem] text-ink-500">{quiz.topic}</p> : null}
            </div>
            <div className="px-5 py-4">
              {quiz.description ? <p className="max-w-[65ch] text-[0.875rem] leading-7 text-ink-700">{quiz.description}</p> : null}
              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-line py-4 sm:grid-cols-4">
                {[
                  { label: 'Questions', value: quiz.total_questions },
                  { label: 'Time limit', value: `${quiz.duration_minutes} min` },
                  { label: 'Attempts used', value: quiz.attempt ? '1' : '0' },
                  {
                    label: 'Your score',
                    value: quiz.attempt?.score !== null && quiz.attempt?.score !== undefined ? `${quiz.attempt.score}%` : '—',
                  },
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
                  <li>• Leaving the attempt is recorded; repeated leaving may end the attempt automatically.</li>
                  <li>• Your highest completed attempt counts for points.</li>
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  size="md"
                  disabled={!quiz.can_start}
                  onClick={() => setStartOpen(true)}
                  iconLeft={quiz.can_start ? <Timer className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                >
                  {quiz.can_start ? 'Start attempt' : quiz.is_live ? 'Attempt already in progress' : 'Warmup closed'}
                </Button>
                <ButtonLink to={`/member/quizzes/${quiz.id}/leaderboard`} variant="outline" size="md">
                  Leaderboard
                </ButtonLink>
                {!quiz.is_live ? (
                  <span className="text-[0.6875rem] text-ink-400">Only open warmups can be attempted.</span>
                ) : null}
                {quiz.attempt && quiz.attempt.status !== 'submitted' ? (
                  <ButtonLink to={`/member/quizzes/${quiz.id}/take`} variant="ghost" size="md">
                    Resume attempt
                  </ButtonLink>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.9375rem] font-semibold text-ink-950">Your results</h2>
            </div>
            <dl className="divide-y divide-line px-4">
              <div className="flex items-center justify-between py-3">
                <dt className="text-[0.75rem] text-ink-500">Status</dt>
                <dd className="text-[0.8125rem] font-medium text-ink-900">
                  {quiz.attempt ? quiz.attempt.status.replace('_', ' ') : 'Not attempted'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-[0.75rem] text-ink-500">Score</dt>
                <dd className="text-[0.8125rem] font-semibold tabular text-ink-900">
                  {quiz.attempt?.score !== null && quiz.attempt?.score !== undefined ? `${quiz.attempt.score}%` : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-[0.75rem] text-ink-500">Scheduled</dt>
                <dd className="text-right text-[0.8125rem] font-medium text-ink-900">
                  {quiz.scheduled_start_at
                    ? formatDate(quiz.scheduled_start_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </dd>
              </div>
            </dl>
            {quiz.attempt ? (
              <div className="border-t border-line px-4 py-3">
                <ButtonLink to={`/member/quizzes/${quiz.id}/result`} variant="outline" size="sm">
                  Review last result
                </ButtonLink>
              </div>
            ) : null}
          </div>

          {quiz.resources.length ? (
            <div className="rounded-lg border border-line bg-surface">
              <div className="border-b border-line px-4 py-3">
                <h2 className="text-[0.9375rem] font-semibold text-ink-950">Resources</h2>
              </div>
              <ul className="divide-y divide-line">
                {quiz.resources.map((resource) => (
                  <li key={resource.id} className="px-4 py-3">
                    <p className="text-[0.8125rem] font-medium text-ink-900">{resource.title}</p>
                    {resource.uploaded_at ? (
                      <p className="text-[0.6875rem] text-ink-400">Uploaded {formatDate(resource.uploaded_at)}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Alert tone="info" title="Academic honesty">
            Warmups are individual work unless the quizmaster says otherwise. Sharing answers or using another person's account is
            treated as misconduct.
          </Alert>
        </div>
      </div>

      <ConfirmDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        title="Start the timer now?"
        description={`You will have ${quiz.duration_minutes} minutes for ${quiz.total_questions} questions. The timer cannot be paused.`}
        confirmLabel="Start attempt"
        destructive={false}
        onConfirm={() => navigate(`/member/quizzes/${quiz.id}/take`)}
      />
    </>
  )
}

export function WarmupTake() {
  const { id } = useParams()
  const quizId = Number(id)
  const navigate = useNavigate()
  const { push } = useToast()
  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [attempt, setAttempt] = useState<StartedAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<number, AttemptAnswerInput>>({})
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    let active = true
    setFailure(null)
    Promise.all([memberApi.quiz(quizId), memberApi.startAttempt(quizId)])
      .then(([detail, started]) => {
        if (!active) return
        setQuiz(detail)
        setAttempt(started)
      })
      .catch((error: unknown) => {
        if (active) setFailure(errorText(error, 'The attempt could not be started. Check your connection and try again.'))
      })
    return () => {
      active = false
    }
  }, [quizId])

  useEffect(() => {
    if (!attempt?.expires_at) return
    const target = new Date(attempt.expires_at).getTime()
    const tick = () => setRemaining(Math.max(0, Math.round((target - Date.now()) / 1000)))
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [attempt?.expires_at])

  async function submitAttempt(auto = false) {
    if (!attempt || submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    try {
      await memberApi.submitAttempt(attempt.attempt_id, Object.values(answers))
      push({ tone: 'success', title: auto ? 'Time expired — attempt submitted' : 'Attempt submitted' })
      navigate(`/member/quizzes/${quizId}/result`)
    } catch (error) {
      submittedRef.current = false
      push({
        tone: 'error',
        title: 'Attempt not submitted',
        description: errorText(error, 'The attempt could not be submitted. Try again before the timer runs out.'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (remaining === 0 && attempt && !submittedRef.current) {
      void submitAttempt(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, attempt])

  useEffect(() => {
    if (!attempt) return
    const activeAttempt = attempt
    function onVisibilityChange() {
      if (document.visibilityState !== 'hidden') return
      memberApi
        .reportViolation(activeAttempt.attempt_id, 'tab_switch')
        .then((result) => {
          if (result.auto_submitted) {
            submittedRef.current = true
            navigate(`/member/quizzes/${quizId}/result`)
          } else {
            push({
              tone: 'error',
              title: 'Leaving the attempt was recorded',
              description: `${result.remaining} violation${result.remaining === 1 ? '' : 's'} left before the attempt ends automatically.`,
            })
          }
        })
        .catch((error: unknown) => {
          push({ tone: 'error', title: 'Violation not recorded', description: errorText(error, 'Try again.') })
        })
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  if (failure) {
    return (
      <>
        <PageHeader title="Warmup attempt" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups', to: '/member/quizzes' }]} />
        <ErrorBlock message={failure} />
      </>
    )
  }

  if (!quiz || !attempt) {
    return (
      <>
        <PageHeader title="Warmup attempt" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups', to: '/member/quizzes' }]} />
        <LoadingBlock rows={3} label="Preparing your attempt…" />
      </>
    )
  }

  const questions = quiz.questions
  const question = questions[index]

  if (!question) {
    return (
      <Card>
        <div className="p-4">
          <EmptyState title="This warmup has no questions" description="Ask the quizmaster to publish the questions for this warmup." />
        </div>
      </Card>
    )
  }

  const answered = Object.keys(answers).length

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-400">{quiz.title}</p>
          <h1 className="mt-0.5 text-[1.25rem] font-semibold tracking-[-0.01em] text-ink-950">
            Question {index + 1} of {questions.length}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 py-1.5 text-[0.75rem] font-medium tabular text-ink-700">
            <Timer className="h-3.5 w-3.5 text-ink-400" aria-hidden />
            {remaining === null ? '—' : clockDuration(remaining)} remaining
          </span>
          <Link to="/member/quizzes" className="text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
            Exit
          </Link>
        </div>
      </div>

      <div
        className="mt-3 h-1 w-full overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuenow={index + 1}
        aria-label="Warmup progress"
      >
        <div className="h-full bg-brand-700 transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <Card className="mt-4">
        <div className="px-5 py-5">
          <fieldset>
            {question.scenario ? (
              <p className="mb-2 rounded-md border border-line bg-canvas/40 p-3 text-[0.75rem] leading-5 text-ink-600">
                {question.scenario}
              </p>
            ) : null}
            <legend className="text-[1rem] font-medium leading-7 text-ink-950">{question.question}</legend>
            <div className="mt-4 space-y-2">
              {question.options.map((option) => {
                const selected = answers[question.id]?.choice_id === option.id
                return (
                  <label
                    key={option.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-[0.8125rem] transition-colors',
                      selected
                        ? 'border-brand-600 bg-brand-50/60'
                        : 'border-ink-200 bg-surface hover:border-ink-300 hover:bg-ink-50/50',
                    )}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={selected}
                      onChange={() =>
                        setAnswers((current) => ({ ...current, [question.id]: { question_id: question.id, choice_id: option.id } }))
                      }
                      className="mt-0.5 h-4 w-4 accent-brand-700"
                    />
                    <span className={selected ? 'font-medium text-ink-950' : 'text-ink-700'}>{option.text}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-ink-50/40 px-5 py-3">
          <p className="text-[0.6875rem] text-ink-400">
            {answered} of {questions.length} answered
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
              Previous
            </Button>
            {index === questions.length - 1 ? (
              <Button size="sm" disabled={submitting} onClick={() => setConfirmOpen(true)}>
                Submit attempt
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}
                iconRight={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Next question
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-3 flex items-start gap-2 text-[0.6875rem] leading-5 text-ink-400">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Leaving this page during an attempt is recorded as a violation.
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit this attempt?"
        description={`You have answered ${answered} of ${questions.length} questions. You cannot change answers after submitting.`}
        confirmLabel={submitting ? 'Submitting…' : 'Submit'}
        destructive={false}
        onConfirm={() => submitAttempt(false)}
      />
    </div>
  )
}

export function WarmupResult() {
  const { id } = useParams()
  const quizId = Number(id)
  const { data, loading, error, reload } = useMemberData(
    () =>
      memberApi.quiz(quizId).then(async (quiz) => ({
        quiz,
        attempt: quiz.attempt ? await memberApi.attempt(quiz.attempt.id) : null,
      })),
    [quizId],
  )

  const header = (
    <Link
      to={`/member/quizzes/${quizId}`}
      className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      Warmup overview
    </Link>
  )

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Warmup result" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups', to: '/member/quizzes' }]} />
        <LoadingBlock rows={3} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Warmup result" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups', to: '/member/quizzes' }]} />
        <ErrorBlock message={error ?? 'This result could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const { quiz, attempt } = data

  if (!attempt) {
    return (
      <>
        {header}
        <div className="mt-4">
          <EmptyState
            title="No attempt recorded"
            description="You have not attempted this warmup yet. Open the warmup to start one."
            action={
              <ButtonLink to={`/member/quizzes/${quiz.id}`} size="sm">
                Open warmup
              </ButtonLink>
            }
          />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {header}
          <h1 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.02em] text-ink-950">{quiz.title}</h1>
          <p className="mt-1 text-[0.8125rem] text-ink-500">
            {attempt.submitted_at ? `Attempt submitted ${formatDate(attempt.submitted_at)}` : `Attempt ${attempt.status.replace('_', ' ')}`}
          </p>
        </div>
        <StatusBadge status={attempt.status} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-lg border border-line bg-surface">
          <div className="px-5 py-5 text-center">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">Your score</p>
            <p className="mt-2 text-[2.5rem] font-semibold leading-none tabular tracking-tight text-brand-800">
              {attempt.score !== null ? `${Math.round(attempt.score)}%` : '—'}
            </p>
            <p className="mt-2 text-[0.75rem] text-ink-500">
              {attempt.correct_count ?? 0} of {attempt.total_count ?? quiz.total_questions} correct
            </p>
          </div>
          <dl className="divide-y divide-line border-t border-line px-4">
            <div className="flex justify-between py-2.5">
              <dt className="text-[0.75rem] text-ink-500">Points awarded</dt>
              <dd className="text-[0.75rem] font-semibold tabular text-brand-700">+{attempt.points_awarded}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[0.75rem] text-ink-500">Rank</dt>
              <dd className="text-[0.75rem] font-medium tabular text-ink-900">{attempt.rank !== null ? `#${attempt.rank}` : '—'}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[0.75rem] text-ink-500">Violations</dt>
              <dd className="text-[0.75rem] font-medium tabular text-ink-900">{attempt.violation_count}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
            <ButtonLink to={`/member/quizzes/${quiz.id}/leaderboard`} variant="outline" size="sm">
              Leaderboard
            </ButtonLink>
            <ButtonLink to="/member/quizzes" variant="ghost" size="sm">
              All warmups
            </ButtonLink>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[0.9375rem] font-semibold text-ink-950">Answer review</h2>
            <p className="mt-0.5 text-[0.6875rem] text-ink-400">
              {attempt.results_released ? 'Correct answers are shown after submission.' : 'Results have not been released yet.'}
            </p>
          </div>
          {attempt.review && attempt.review.length ? (
            <ol className="divide-y divide-line">
              {attempt.review.map((entry, position) => (
                <li key={entry.question_id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[0.625rem] font-semibold text-brand-800">
                      {position + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] font-medium text-ink-900">{entry.question_text}</p>
                      <p className="mt-1 text-[0.75rem] text-ink-500">
                        {entry.answered ? 'Answered' : 'Not answered'}
                        {entry.is_correct ? ' · Correct' : ' · Incorrect'}
                      </p>
                    </div>
                    {entry.is_correct ? (
                      <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                    ) : (
                      <X className="ml-auto h-4 w-4 shrink-0 text-danger" aria-hidden />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="p-4">
              <EmptyState
                compact
                title="No review available"
                description="The quizmaster has not released the answers for this attempt."
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function WarmupLeaderboard() {
  const { id } = useParams()
  const quizId = Number(id)
  const { data, loading, error, reload } = useMemberData(() => memberApi.quizLeaderboard(quizId), [quizId])

  const header = (
    <PageHeader
      title="Warmup leaderboard"
      description={data ? `${data.quiz.title} · ranked by score, then submission time.` : 'Warmup results.'}
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Warmups', to: '/member/quizzes' }, { label: 'Leaderboard' }]}
      actions={
        <ButtonLink to={`/member/quizzes/${quizId}`} variant="outline" size="sm" iconLeft={<ArrowLeft className="h-3.5 w-3.5" />}>
          Back to warmup
        </ButtonLink>
      }
    />
  )

  if (loading && !data) {
    return (
      <>
        {header}
        <LoadingBlock rows={5} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        {header}
        <ErrorBlock message={error ?? 'The leaderboard could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  return (
    <>
      {header}

      <Card>
        <CardHeader
          title="Results"
          description="Ranked by score, then by submission time."
          action={<Badge tone="outline">{data.participant_count} attempts</Badge>}
        />
        {data.rows.length ? (
          <TableWrap>
            <THead>
              <TR>
                <TH className="w-[70px]">Rank</TH>
                <TH>Member</TH>
                <TH>Score</TH>
                <TH>Points</TH>
              </TR>
            </THead>
            <TBody>
              {data.rows.map((row) => (
                <TR key={`${row.rank}-${row.display_name}`}>
                  <TD className="font-semibold tabular text-ink-700">#{row.rank}</TD>
                  <TD className="font-medium text-ink-900">{row.display_name}</TD>
                  <TD className="font-semibold tabular text-ink-900">{row.score !== null ? `${row.score}%` : '—'}</TD>
                  <TD className="tabular text-brand-700">+{row.points_awarded}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        ) : (
          <div className="p-4">
            <EmptyState compact title="No attempts yet" description="Completed attempts appear here once members submit them." />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
          <p className="text-[0.6875rem] text-ink-400">Scores are ranked before points are awarded. Ties are broken by submission time.</p>
          <Link
            to="/member/rankings"
            className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline"
          >
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            Club rankings
          </Link>
        </div>
      </Card>

      <p className="mt-4 text-[0.6875rem] leading-5 text-ink-400">
        Only completed attempts appear. If your attempt is missing, contact the quizmaster.
      </p>
    </>
  )
}

export default Warmups

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, ListChecks, Plus, Send, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { demoQuizQuestions, demoQuizzes } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, ConfirmDialog, Dialog, DialogContent, EmptyState, Field, Input, Select, StatusBadge, Textarea } from '../../components/ui'
import { DemoNotice, SmallStat, StatStrip } from '../admin/_shared'
import { useToast } from '../../context/ToastContext'
import { cn, formatDate } from '../../lib/utils'

export function QuizmasterDashboard() {
  const quizzes = demoQuizzes
  const published = quizzes.filter((quiz) => quiz.status === 'published')

  return (
    <>
      <PageHeader
        title="Quizmaster dashboard"
        badge={<Badge tone="outline">Quizmaster</Badge>}
        actions={
          <>
            <ButtonLink to="/admin/quizzes/analytics" variant="outline" size="sm">Analytics</ButtonLink>
            <ButtonLink to="/quizmaster/quizzes/create" size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />}>Create quiz</ButtonLink>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Open warmups" value={published.length} hint="Accepting attempts" tone="brand" />
        <SmallStat label="Total attempts" value={quizzes.reduce((total, quiz) => total + quiz.attempts, 0)} hint="This semester" />
        <SmallStat label="Average score" value={`${Math.round(published.reduce((total, quiz) => total + quiz.average, 0) / Math.max(1, published.length))}%`} hint="Open warmups" />
        <SmallStat label="Drafts" value={quizzes.filter((quiz) => quiz.status === 'draft').length} hint="Not published" tone="amber" />
      </StatStrip>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Your quizzes" description="Open a quiz to review questions, results or close it." action={<ButtonLink to="/quizmaster/quizzes/create" variant="ghost" size="sm">New</ButtonLink>} />
          <ul className="divide-y divide-line">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[0.875rem] font-semibold text-ink-950">{quiz.title}</p>
                    <StatusBadge status={quiz.status} />
                  </div>
                  <p className="mt-0.5 text-[0.75rem] text-ink-500">{quiz.topic} · {quiz.questions} questions · {quiz.duration} min</p>
                  <p className="mt-0.5 text-[0.6875rem] text-ink-400">
                    {quiz.attempts} attempts · {quiz.average ? `${quiz.average}% average` : 'no attempts yet'}
                    {quiz.closesAt !== '—' ? ` · closes ${formatDate(quiz.closesAt, { day: 'numeric', month: 'short' })}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <ButtonLink to={`/quizmaster/quizzes/${quiz.id}/builder`} variant="outline" size="sm">Builder</ButtonLink>
                  <ButtonLink to="/member/quizzes" variant="ghost" size="sm">Preview</ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="This week" description="Week 06 · React fundamentals" />
            <div className="space-y-2 p-4 text-[0.75rem] leading-5 text-ink-500">
              <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden /> Session: Components and props, 23 Nov</p>
              <p className="flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden /> Warmup should cover state and props</p>
              <p className="flex items-center gap-1.5"><Send className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden /> Publish at least 24 hours before the session</p>
            </div>
            <div className="border-t border-line px-4 py-3">
              <ButtonLink to="/quizmaster/quizzes/create" size="sm" iconLeft={<Sparkles className="h-3.5 w-3.5" />}>Create this week's warmup</ButtonLink>
            </div>
          </Card>
          <Alert tone="info" title="Question quality">
            Every question should test one idea from the session. Avoid trick questions and keep answers unambiguous.
          </Alert>
          <Card>
            <CardHeader title="Results snapshot" action={<Badge tone="outline">Latest</Badge>} />
            <ul className="divide-y divide-line">
              {[
                { member: 'Fatuma Ally', quiz: 'Python Basics', score: 92 },
                { member: 'Amina Juma', quiz: 'React Fundamentals', score: 88 },
                { member: 'Baraka Kimaro', quiz: 'React Fundamentals', score: 75 },
              ].map((row) => (
                <li key={row.member} className="flex items-center justify-between gap-2 px-4 py-2.5">
                  <div>
                    <p className="text-[0.8125rem] font-medium text-ink-900">{row.member}</p>
                    <p className="text-[0.6875rem] text-ink-400">{row.quiz}</p>
                  </div>
                  <span className="text-[0.75rem] font-semibold tabular text-brand-700">{row.score}%</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <DemoNotice />
    </>
  )
}

export function CreateQuiz() {
  const navigate = useNavigate()
  const { push } = useToast()
  const [form, setForm] = useState({ title: '', field: 'Web Development', topic: '', difficulty: 'Level 1 · Foundation', duration: '10', questions: '5', closesAt: '2026-11-29T18:00', attempts: '2', description: '', generate: false })
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <>
      <PageHeader
        title="Create a warmup quiz"
        breadcrumbs={[{ label: 'Quizmaster', to: '/quizmaster' }, { label: 'Create quiz' }]}
        actions={<ButtonLink to="/quizmaster" variant="outline" size="sm">Cancel</ButtonLink>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Quiz details" description="Members see the title, topic and time limit." />
          <div className="space-y-4 p-4">
            <Field label="Quiz title" htmlFor="create-title" required error={errors.title}>
              <Input id="create-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="CSS Layout Warmup" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Field" htmlFor="create-field">
                <Select id="create-field" value={form.field} onChange={(event) => setForm({ ...form, field: event.target.value })}>
                  <option>Web Development</option>
                  <option>Programming</option>
                  <option>Networking</option>
                  <option>Data Science</option>
                  <option>Cybersecurity</option>
                </Select>
              </Field>
              <Field label="Difficulty" htmlFor="create-difficulty">
                <Select id="create-difficulty" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
                  <option>Level 1 · Foundation</option>
                  <option>Level 2 · Intermediate</option>
                  <option>Level 3 · Advanced</option>
                </Select>
              </Field>
            </div>
            <Field label="Topic" htmlFor="create-topic" required error={errors.topic} hint="One sentence describing what the warmup covers.">
              <Input id="create-topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} placeholder="Flexbox, grid and responsive units" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Time limit" htmlFor="create-duration">
                <Select id="create-duration" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                </Select>
              </Field>
              <Field label="Questions" htmlFor="create-count">
                <Select id="create-count" value={form.questions} onChange={(event) => setForm({ ...form, questions: event.target.value })}>
                  <option value="4">4 questions</option>
                  <option value="5">5 questions</option>
                  <option value="8">8 questions</option>
                  <option value="10">10 questions</option>
                </Select>
              </Field>
              <Field label="Attempts" htmlFor="create-attempts">
                <Select id="create-attempts" value={form.attempts} onChange={(event) => setForm({ ...form, attempts: event.target.value })}>
                  <option value="1">1 attempt</option>
                  <option value="2">2 attempts</option>
                </Select>
              </Field>
            </div>
            <Field label="Closes" htmlFor="create-closes">
              <Input id="create-closes" type="datetime-local" value={form.closesAt} onChange={(event) => setForm({ ...form, closesAt: event.target.value })} />
            </Field>
            <Field label="Description" htmlFor="create-description" hint="Shown on the warmup page before a member starts.">
              <Textarea id="create-description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A short warmup on layouts. Open to all members." />
            </Field>
            <label className={cn('flex cursor-pointer items-start gap-2.5 rounded-md border px-3.5 py-3', form.generate ? 'border-brand-300 bg-brand-50/50' : 'border-line bg-surface')}>
              <input type="checkbox" checked={form.generate} onChange={(event) => setForm({ ...form, generate: event.target.checked })} className="mt-0.5 h-4 w-4 accent-brand-700" />
              <span>
                <span className="block text-[0.8125rem] font-medium text-ink-900">Draft starter questions with AI</span>
                <span className="block text-[0.75rem] leading-5 text-ink-500">Drafts are never published automatically. Every question must be reviewed by you.</span>
              </span>
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
            <Button
              size="sm"
              iconLeft={<Wand2 className="h-3.5 w-3.5" />}
              onClick={() => {
                const next: Record<string, string> = {}
                if (form.title.trim().length < 5) next.title = 'Enter a clear quiz title.'
                if (form.topic.trim().length < 5) next.topic = 'Describe the topic.'
                setErrors(next)
                if (Object.keys(next).length) return
                push({
                  tone: 'success',
                  title: form.generate ? 'Quiz created with draft questions' : 'Quiz created',
                  description: form.generate ? 'Draft questions are placeholders; review them before publishing.' : 'Add questions in the builder next.',
                })
                navigate('/quizmaster/quizzes/1/builder')
              }}
            >
              Create and open builder
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Summary" />
            <div className="p-4">
              <dl className="space-y-2.5 text-[0.75rem]">
                {[
                  { label: 'Title', value: form.title || 'Not set' },
                  { label: 'Field', value: form.field },
                  { label: 'Time limit', value: `${form.duration} minutes` },
                  { label: 'Questions', value: form.questions },
                  { label: 'Attempts', value: form.attempts },
                  { label: 'Closes', value: formatDate(form.closesAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                  { label: 'AI drafts', value: form.generate ? 'Yes' : 'No' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-3">
                    <dt className="text-ink-500">{item.label}</dt>
                    <dd className="max-w-[60%] text-right font-medium text-ink-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>
          <Alert tone="info" title="Publishing rules">
            A quiz needs at least three questions before it can be published. Members see the closing time on the warmup page.
          </Alert>
          <Card>
            <CardHeader title="Checklist" />
            <ul className="space-y-2 px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
              <li>• Questions map to this week's session.</li>
              <li>• One correct answer per question.</li>
              <li>• No names or personal data in questions.</li>
            </ul>
          </Card>
        </div>
      </div>

      <DemoNotice />
    </>
  )
}

export function QuizBuilder() {
  const { id } = useParams()
  const quiz = demoQuizzes.find((row) => String(row.id) === id) ?? demoQuizzes[0]
  const [questions, setQuestions] = useState(demoQuizQuestions)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ prompt: '', options: ['', '', '', ''], correct: 0 })
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const { push } = useToast()

  return (
    <>
      <Link to="/quizmaster" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Quizmaster dashboard
      </Link>
      <PageHeader
        title={`${quiz.title} — builder`}
        description={`${quiz.field} · ${quiz.duration} minutes · closes ${quiz.closesAt === '—' ? 'not scheduled' : formatDate(quiz.closesAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
        badge={<StatusBadge status={quiz.status} />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} iconLeft={<Plus className="h-3.5 w-3.5" />}>Add question</Button>
            <Button size="sm" disabled={questions.length < 3} onClick={() => setPublishing(true)} iconLeft={<Send className="h-3.5 w-3.5" />}>Publish quiz</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Questions" description="Members see these in order unless shuffling is enabled." action={<Badge tone="outline">{questions.length} questions</Badge>} />
          <ol className="divide-y divide-line">
            {questions.length ? (
              questions.map((question, index) => (
                <li key={question.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[0.6875rem] font-semibold text-ink-600">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="text-[0.8125rem] font-medium text-ink-900">{question.prompt}</p>
                        <ul className="mt-1.5 space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <li key={option} className={cn('text-[0.75rem]', optionIndex === question.correct ? 'font-medium text-brand-800' : 'text-ink-500')}>
                              {optionIndex === question.correct ? '✓ ' : '· '}
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove question ${index + 1}`}
                      iconLeft={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setQuestions((current) => current.filter((entry) => entry.id !== question.id))
                        push({ tone: 'info', title: 'Question removed' })
                      }}
                    />
                  </div>
                </li>
              ))
            ) : (
              <li className="p-4">
                <EmptyState compact icon={<ListChecks className="h-4 w-4" aria-hidden />} title="No questions yet" description="Add at least three questions before publishing." action={<Button size="sm" onClick={() => setOpen(true)}>Add question</Button>} />
              </li>
            )}
          </ol>
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-ink-400">Single-choice questions with four options.</p>
            <Button variant="outline" size="xs" onClick={() => setOpen(true)}>Add another</Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Builder status" />
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between text-[0.75rem]">
                <span className="text-ink-500">Questions added</span>
                <span className="font-semibold tabular text-ink-900">{questions.length} of {quiz.questions}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (questions.length / Math.max(1, quiz.questions)) * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[0.75rem]">
                <span className="text-ink-500">Ready to publish</span>
                <span className="font-medium text-ink-900">{questions.length >= 3 ? 'Yes' : 'Add more questions'}</span>
              </div>
              <div className="flex items-center justify-between text-[0.75rem]">
                <span className="text-ink-500">Current status</span>
                <StatusBadge status={quiz.status} />
              </div>
            </div>
          </Card>
          <Alert tone="info" title="Review before publishing">
            Check the correct answer for each question. Members see their score immediately after submitting, but not the answer key before then.
          </Alert>
          <Card>
            <CardHeader title="Preview" />
            <div className="p-4">
              <p className="text-[0.75rem] text-ink-500">Preview the member experience with the published version.</p>
              <ButtonLink to={`/member/quizzes/${quiz.id}`} variant="outline" size="sm" className="mt-3">Open member preview</ButtonLink>
            </div>
          </Card>
        </div>
      </div>

      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Add a question"
          description="Write the question and mark the correct option."
          size="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  if (form.prompt.trim().length < 10) {
                    setError('Write a complete question.')
                    return
                  }
                  if (form.options.some((option) => option.trim().length < 1)) {
                    setError('Fill in all four options.')
                    return
                  }
                  setQuestions((current) => [...current, { id: Math.max(0, ...current.map((row) => row.id)) + 1, prompt: form.prompt, options: form.options, correct: form.correct }])
                  setForm({ prompt: '', options: ['', '', '', ''], correct: 0 })
                  setError('')
                  push({ tone: 'success', title: 'Question added', description: 'Publish the quiz to make it available to members.' })
                  setOpen(false)
                }}
              >
                Add question
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Question" htmlFor="builder-prompt" required error={error}>
              <Textarea id="builder-prompt" rows={3} value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} placeholder="Which property controls the space inside an element?" />
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-small font-medium text-ink-800">Options</legend>
              <div className="space-y-2">
                {form.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-option"
                      checked={form.correct === index}
                      onChange={() => setForm({ ...form, correct: index })}
                      aria-label={`Mark option ${index + 1} as correct`}
                      className="h-4 w-4 shrink-0 accent-brand-700"
                    />
                    <Input
                      value={option}
                      onChange={(event) => {
                        const options = form.options.slice()
                        options[index] = event.target.value
                        setForm({ ...form, options })
                      }}
                      placeholder={`Option ${index + 1}`}
                      aria-label={`Option ${index + 1}`}
                    />
                    {form.correct === index ? <Badge tone="green">Correct</Badge> : null}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[0.6875rem] text-ink-400">Select the radio button next to the correct answer.</p>
            </fieldset>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={publishing}
        onOpenChange={setPublishing}
        title="Publish this quiz?"
        description={`${questions.length} questions will be visible to members. They can attempt the warmup until it closes.`}
        confirmLabel="Publish quiz"
        destructive={false}
        onConfirm={() => push({ tone: 'success', title: 'Quiz published' })}
      />

      <div className="mt-3 flex items-center gap-1.5 text-[0.6875rem] text-ink-400">
        <CheckCircle2 className="h-3 w-3 text-brand-600" aria-hidden />
        Questions are saved in this browser session only. The live builder saves each change as you work.
      </div>
    </>
  )
}

import { useCallback, useState } from 'react'
import { Download, Mail, MailX, Send, Users } from 'lucide-react'
import { demoNewsletter } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, Card, CardHeader, Dialog, DialogContent, EmptyState, Field, Input, Textarea } from '../../components/ui'
import { AdminToolbar, DemoNotice, downloadCsv, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type Subscriber = (typeof demoNewsletter)[number]

export function AdminNewsletter() {
  const [rows, setRows] = useState<Subscriber[]>(demoNewsletter)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ subject: '', body: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { push } = useToast()

  const matches = useCallback((row: Subscriber, query: string) => row.email.toLowerCase().includes(query), [])
  const list = useAdminList(rows, matches)

  return (
    <>
      <PageHeader
        title="Newsletter"
        description="People who subscribed to club news from the public website. Subscribers are separate from member accounts."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Newsletter' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Download className="h-3.5 w-3.5" />}
              onClick={() => {
                const okay = downloadCsv('newsletter-subscribers.csv', rows.map((row) => ({ Email: row.email, Subscribed: row.subscribed, Active: row.active })))
                push({ tone: okay ? 'success' : 'error', title: okay ? 'Subscriber list exported' : 'Nothing to export', description: 'Handle subscriber emails as personal data.' })
              }}
            >
              Export
            </Button>
            <Button size="sm" iconLeft={<Send className="h-3.5 w-3.5" />} onClick={() => { setForm({ subject: '', body: '' }); setErrors({}); setOpen(true) }}>New campaign</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Subscribers', value: rows.length, hint: 'All records' },
          { label: 'Active', value: rows.filter((row) => row.active).length, hint: 'Will receive campaigns' },
          { label: 'Unsubscribed', value: rows.filter((row) => !row.active).length, hint: 'Excluded from sends' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-white p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            <p className="mt-1.5 text-[1.25rem] font-semibold tabular tracking-tight text-ink-950">{item.value}</p>
            <p className="text-[0.6875rem] text-ink-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search subscribers by email…" count={`${list.total} subscribers`} />
        <div className="divide-y divide-line">
          {list.visible.length ? (
            list.visible.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-400">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.8125rem] font-medium text-ink-900">{row.email}</p>
                    <p className="text-[0.6875rem] text-ink-400">Subscribed {formatDate(row.subscribed)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={row.active ? 'green' : 'neutral'} dot>{row.active ? 'Subscribed' : 'Unsubscribed'}</Badge>
                  <Button
                    variant="outline"
                    size="xs"
                    iconLeft={row.active ? <MailX className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                    onClick={() => {
                      setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, active: !entry.active } : entry)))
                      push({ tone: 'info', title: row.active ? 'Subscriber removed in the prototype' : 'Subscriber restored in the prototype', description: 'No email preference was changed.' })
                    }}
                  >
                    {row.active ? 'Unsubscribe' : 'Resubscribe'}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4">
              <EmptyState compact icon={<Users className="h-4 w-4" aria-hidden />} title="No subscribers match" description="Try another email address or clear the search field." />
            </div>
          )}
        </div>
        {list.pageCount > 1 ? (
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="text-[0.75rem] text-ink-500">Page {list.page} of {list.pageCount}</p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="xs" disabled={list.page === 1} onClick={() => list.setPage(list.page - 1)}>Previous</Button>
              <Button variant="outline" size="xs" disabled={list.page === list.pageCount} onClick={() => list.setPage(list.page + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="mt-4">
        <Alert tone="info" title="Consent matters">
          Only send to people who subscribed. Every campaign must include an unsubscribe link; unsubscribed addresses are excluded automatically.
        </Alert>
      </div>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Subscriber records are demonstration data. In the live application they are stored separately from member accounts.
      </p>
      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="New newsletter campaign"
          description={`This campaign will be sent to ${rows.filter((row) => row.active).length} active subscribers.`}
          size="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                iconLeft={<Send className="h-3.5 w-3.5" />}
                onClick={() => {
                  const next: Record<string, string> = {}
                  if (form.subject.trim().length < 5) next.subject = 'Write a subject line.'
                  if (form.body.trim().length < 30) next.body = 'Write at least 30 characters for the newsletter body.'
                  setErrors(next)
                  if (Object.keys(next).length) return
                  push({ tone: 'success', title: 'Campaign queued in the prototype', description: 'No newsletter was sent to subscribers.' })
                  setOpen(false)
                }}
              >
                Queue campaign
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Subject" htmlFor="newsletter-subject" required error={errors.subject}>
              <Input id="newsletter-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="November at KIUT Digital Club" />
            </Field>
            <Field label="Newsletter" htmlFor="newsletter-body" required error={errors.body} hint="Plain text. Links are added in the live editor.">
              <Textarea id="newsletter-body" rows={9} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write the update…" />
            </Field>
            <Card>
              <CardHeader title="Before you send" />
              <ul className="space-y-1.5 px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
                <li>• Check names, dates and links against the public site.</li>
                <li>• Do not include member email addresses in the body.</li>
                <li>• A preview is sent to the club email before a full campaign.</li>
              </ul>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

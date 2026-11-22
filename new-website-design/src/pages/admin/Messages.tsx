import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, MessageSquare, Send, Users } from 'lucide-react'
import { demoMessages, demoUsers } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, DetailList, Dialog, DialogContent, EmptyState, Field, Input, Select, TableWrap, TBody, TD, TH, THead, TR, Textarea } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, RowActions, DropdownItem, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type MessageRow = (typeof demoMessages)[number]

export function AdminMessages() {
  const [rows, setRows] = useState<MessageRow[]>(demoMessages)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ subject: '', audience: 'All members', channel: 'Email + SMS', body: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { push } = useToast()

  const matches = useCallback((row: MessageRow, query: string) => `${row.subject} ${row.audience} ${row.channel}`.toLowerCase().includes(query), [])
  const list = useAdminList(rows, matches)

  const audienceCount: Record<string, number> = {
    'All members': demoUsers.length,
    'Expired members': 0,
    'Pending registrations': demoUsers.filter((user) => !user.approved).length,
    'Event attendees': 86,
    'Quizmasters': demoUsers.filter((user) => user.role === 'quizmaster').length,
  }

  return (
    <>
      <PageHeader
        title="Messages"
        description="Bulk communications to members. Messages are sent by email and SMS and recorded in the delivery log."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Messages' }]}
        actions={
          <Button size="sm" iconLeft={<Send className="h-3.5 w-3.5" />} onClick={() => { setForm({ subject: '', audience: 'All members', channel: 'Email + SMS', body: '' }); setErrors({}); setOpen(true) }}>
            Compose message
          </Button>
        }
      />

      <StatStrip>
        <SmallStat label="Messages sent" value={rows.length} hint="This semester" tone="brand" />
        <SmallStat label="Recipients reached" value={rows.reduce((total, row) => total + row.recipients, 0)} hint="Across all sends" />
        <SmallStat label="Email + SMS" value={rows.filter((row) => row.channel.includes('SMS')).length} hint="Multi-channel sends" />
        <SmallStat label="Unread member replies" value={4} hint="In the admin inbox" tone="amber" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search messages by subject or audience…" count={`${list.total} messages`} />
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} messages` }}
          emptyTitle="No messages match this search"
          emptyDescription="Try a different subject or clear the search field."
          columns={[
            {
              id: 'subject',
              header: 'Subject',
              sortValue: (row) => row.subject,
              cell: (row) => (
                <div>
                  <Link to={`/admin/messages/${row.id}`} className="font-medium text-ink-900 hover:text-brand-800">{row.subject}</Link>
                  <p className="text-[0.6875rem] text-ink-400">{row.channel}</p>
                </div>
              ),
            },
            { id: 'audience', header: 'Audience', cell: (row) => <Badge tone="outline">{row.audience}</Badge> },
            { id: 'recipients', header: 'Recipients', align: 'right', sortValue: (row) => row.recipients, cell: (row) => <span className="tabular">{row.recipients}</span> },
            { id: 'sent', header: 'Sent', sortValue: (row) => row.sent, cell: (row) => <span className="whitespace-nowrap text-ink-500">{formatDate(row.sent, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> },
            { id: 'status', header: 'Status', cell: (row) => <Badge tone="green" dot>{row.status}</Badge> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.subject}`}>
                  <DropdownItem to={`/admin/messages/${row.id}`} icon={<Mail className="h-3.5 w-3.5" />}>Delivery record</DropdownItem>
                  <DropdownItem
                    icon={<Send className="h-3.5 w-3.5" />}
                    onSelect={() => {
                      setRows((current) => [{ ...row, id: Math.max(0, ...current.map((entry) => entry.id)) + 1, subject: `${row.subject} (resend)`, sent: new Date().toISOString() }, ...current])
                      push({ tone: 'info', title: 'Resend simulated in the prototype', description: 'No email or SMS was sent.' })
                    }}
                  >
                    Resend
                  </DropdownItem>
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Sends are rate-limited in the live application. Check the audience before sending: messages cannot be recalled.
      </p>
      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Compose a message"
          description="The message is sent to every member in the selected audience."
          size="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                iconLeft={<Send className="h-3.5 w-3.5" />}
                onClick={() => {
                  const next: Record<string, string> = {}
                  if (form.subject.trim().length < 5) next.subject = 'Write a clear subject line.'
                  if (form.body.trim().length < 20) next.body = 'Write the message body.'
                  setErrors(next)
                  if (Object.keys(next).length) return
                  setRows((current) => [
                    { id: Math.max(0, ...current.map((row) => row.id)) + 1, subject: form.subject, audience: form.audience, recipients: audienceCount[form.audience] ?? 0, sent: new Date().toISOString(), status: 'Sent', channel: form.channel },
                    ...current,
                  ])
                  push({ tone: 'success', title: 'Message queued in the prototype', description: 'No email or SMS was sent.' })
                  setOpen(false)
                }}
              >
                Send message
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Subject" htmlFor="message-subject" required error={errors.subject}>
              <Input id="message-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Week 07 session update" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Audience" htmlFor="message-audience" hint={`${audienceCount[form.audience] ?? 0} recipients in this audience`}>
                <Select id="message-audience" value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}>
                  {Object.keys(audienceCount).map((audience) => <option key={audience}>{audience}</option>)}
                </Select>
              </Field>
              <Field label="Channel" htmlFor="message-channel">
                <Select id="message-channel" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
                  <option>Email</option>
                  <option>SMS</option>
                  <option>Email + SMS</option>
                </Select>
              </Field>
            </div>
            <Field label="Message" htmlFor="message-body" required error={errors.body} hint="Plain text. Keep messages short and include any action the member must take.">
              <Textarea id="message-body" rows={7} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write the message…" />
            </Field>
            <Alert tone="warning" title="This sends immediately">
              In the live application sending is final. Preview the audience count before sending.
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AdminMessageDetail() {
  const { batchId } = useParams()
  const message = demoMessages.find((row) => String(row.id) === batchId)

  if (!message) {
    return (
      <>
        <PageHeader title="Message not found" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Messages', to: '/admin/messages' }]} />
        <Card><div className="p-4"><EmptyState icon={<MessageSquare className="h-4 w-4" aria-hidden />} title="This delivery record is unavailable" description="It may have been removed." action={<ButtonLink to="/admin/messages" size="sm">Back to messages</ButtonLink>} /></div></Card>
      </>
    )
  }

  const recipients = demoUsers.slice(0, Math.min(6, demoUsers.length))

  return (
    <>
      <Link to="/admin/messages" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Messages
      </Link>
      <PageHeader
        title={message.subject}
        description={`${message.audience} · ${message.channel} · sent ${formatDate(message.sent, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`}
        badge={<Badge tone="green" dot>Delivered</Badge>}
        actions={<ButtonLink to="/admin/messages" variant="outline" size="sm">All messages</ButtonLink>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Delivery summary" description="Channel results for this send." />
            <div className="grid gap-px overflow-hidden border-b border-line bg-line sm:grid-cols-3">
              {[
                { label: 'Recipients', value: message.recipients },
                { label: 'Delivered', value: message.recipients - 2 },
                { label: 'Failed', value: 2 },
              ].map((item) => (
                <div key={item.label} className="bg-white p-4">
                  <p className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">{item.label}</p>
                  <p className="mt-1 text-[1.125rem] font-semibold tabular text-ink-950">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="p-4">
              <DetailList
                items={[
                  { label: 'Audience', value: message.audience },
                  { label: 'Channel', value: message.channel },
                  { label: 'Sent by', value: 'Daniel Mushi' },
                  { label: 'Status', value: <Badge tone="green">Sent</Badge> },
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Recipients" description="First recipients in this batch" action={<Badge tone="outline">{message.recipients} total</Badge>} />
            <TableWrap>
              <THead><TR><TH>Member</TH><TH>Email</TH><TH>Channel</TH><TH>Status</TH></TR></THead>
              <TBody>
                {recipients.map((member, index) => (
                  <TR key={member.id}>
                    <TD className="font-medium text-ink-900">{member.name}</TD>
                    <TD className="text-ink-500">{member.email}</TD>
                    <TD className="text-ink-500">{message.channel}</TD>
                    <TD>{index === recipients.length - 1 ? <Badge tone="red">Failed</Badge> : <Badge tone="green">Delivered</Badge>}</TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
            <div className="border-t border-line px-4 py-3">
              <p className="text-[0.6875rem] text-ink-400">A failed delivery usually means a missing or invalid phone number. The member's email may still have been delivered.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Message preview" />
            <div className="p-4">
              <p className="text-[0.8125rem] font-semibold text-ink-900">{message.subject}</p>
              <p className="mt-2 text-[0.75rem] leading-6 text-ink-600">
                Hello member, this is a demonstration preview. The full message body is stored with the delivery batch in the live application.
              </p>
              <p className="mt-3 text-[0.6875rem] text-ink-400">KIUT Digital Club · {formatDate(message.sent)}</p>
            </div>
          </Card>
          <Alert tone="info" title="Member replies">
            Replies are not threaded here. Member messages arrive in the same console and can be answered from the live inbox.
          </Alert>
          <Card>
            <CardHeader title="Audience size" />
            <div className="flex items-center gap-2 px-4 py-3">
              <Users className="h-4 w-4 text-ink-400" aria-hidden />
              <p className="text-[0.75rem] text-ink-600">{message.recipients} members were included when this message was sent.</p>
            </div>
          </Card>
        </div>
      </div>

      <DemoNotice />
    </>
  )
}

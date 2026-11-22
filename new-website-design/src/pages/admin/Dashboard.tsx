import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardList, Clock, FileText, Plus, Send, UserCheck } from 'lucide-react'
import { demoAdminEvents, demoAuditLog, demoRsvps, demoUsers } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, ButtonLink, Card, CardHeader, StatusBadge } from '../../components/ui'
import { DemoNotice } from './_shared'
import { formatDate } from '../../lib/utils'

export function AdminDashboard() {
  const pendingUsers = demoUsers.filter((user) => !user.approved)
  const pendingRsvps = demoRsvps.filter((rsvp) => rsvp.status === 'pending')
  const upcoming = demoAdminEvents.filter((event) => new Date(event.date).getTime() >= Date.now())
  const tasks = [
    { label: 'Members awaiting approval', count: pendingUsers.length, to: '/admin/users', icon: UserCheck, hint: 'New registrations need review' },
    { label: 'RSVPs awaiting a decision', count: pendingRsvps.length, to: '/admin/rsvps', icon: ClipboardList, hint: 'Event registrations pending' },
    { label: 'Session reports to review', count: 2, to: '/admin/sessions/reports', icon: FileText, hint: 'Submitted by instructors' },
    { label: 'Draft content', count: 2, to: '/admin/news', icon: Clock, hint: 'News and blog drafts' },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        badge={<Badge tone="outline">18 Nov 2026</Badge>}
        actions={
          <>
            <ButtonLink to="/admin/messages" variant="outline" size="sm" iconLeft={<Send className="h-3.5 w-3.5" />}>Send message</ButtonLink>
            <ButtonLink to="/admin/events" size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />}>New event</ButtonLink>
          </>
        }
      />

      {pendingUsers.length ? (
        <Alert
          tone="warning"
          title={`${pendingUsers.length} members are waiting for approval`}
          action={
            <Link to="/admin/users" className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#7A4A06] hover:underline">
              Review registrations
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          }
        >
          Registration approval is set to manual. New accounts cannot sign in until an administrator approves them.
        </Alert>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader title="Needs a decision" action={<Badge tone="amber">{tasks.reduce((total, task) => total + task.count, 0)} open</Badge>} />
          <ul className="divide-y divide-line">
            {tasks.map((task) => {
              const Icon = task.icon
              return (
                <li key={task.label}>
                  <Link to={task.to} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-50/60">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-ink-50 text-ink-500">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.8125rem] font-medium text-ink-900">{task.label}</span>
                      <span className="block text-[0.6875rem] text-ink-400">{task.hint}</span>
                    </span>
                    <span className="text-[0.8125rem] font-semibold tabular text-ink-900">{task.count}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-300" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-line px-4 py-3">
            <Link to="/admin/members" className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline">
              Open member directory
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Upcoming events" action={<ButtonLink to="/admin/events" variant="ghost" size="sm">All events</ButtonLink>} />
            <div className="divide-y divide-line">
              {upcoming.length ? (
                upcoming.map((event) => (
                  <Link key={event.id} to="/admin/events" className="flex items-start gap-3 px-4 py-3 hover:bg-ink-50/60">
                    <span className="flex w-[42px] shrink-0 flex-col items-center rounded border border-line bg-canvas py-1">
                      <span className="text-[0.625rem] font-medium uppercase tracking-wide text-ink-400">{new Date(event.date).toLocaleString('en-GB', { month: 'short' })}</span>
                      <span className="text-[0.9375rem] font-semibold leading-tight tabular text-ink-900">{new Date(event.date).getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.8125rem] font-medium text-ink-900">{event.title}</span>
                      <span className="mt-0.5 block text-[0.6875rem] text-ink-400">
                        {formatDate(event.date, { hour: '2-digit', minute: '2-digit' })} · {event.location}
                      </span>
                      <span className="mt-1 block text-[0.6875rem] text-ink-400">{event.rsvps} RSVPs of {event.capacity}</span>
                    </span>
                    <Badge tone="outline">{event.audience}</Badge>
                  </Link>
                ))
              ) : (
                <p className="px-4 py-6 text-center text-[0.75rem] text-ink-400">No upcoming events.</p>
              )}
            </div>
          </Card>

        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Recent activity" action={<Badge tone="outline">Last 7 days</Badge>} />
        <ul className="divide-y divide-line">
          {demoAuditLog.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
              <span className="text-[0.8125rem] text-ink-900">
                <span className="font-medium">{entry.actor}</span> {entry.action.toLowerCase()} <span className="font-medium">{entry.target}</span>
              </span>
              <span className="ml-auto text-[0.6875rem] text-ink-400">
                {formatDate(entry.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </li>
          ))}
        </ul>

      </Card>

      <DemoNotice />
    </>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Clock, FileText, RefreshCw, Send, UserCheck } from 'lucide-react'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, ButtonLink, Card, CardHeader, EmptyState, Skeleton } from '../../components/ui'
import { SmallStat, StatStrip } from './_shared'
import { apiRequest, ApiError } from '../../lib/api'
import { formatDate } from '../../lib/utils'

type DashboardData = {
  members: { total: number; approved: number; pending_approval: number; deactivated: number }
  events: { upcoming: number }
  newsletter: { active_subscribers: number }
  activity: { daily_active_users: number | null }
  finance: {
    period_id: number
    period_name: string
    started_on: string | null
    revenue: number
    expenses: number
    balance: number
  } | null
  recent: {
    news: { id: number; title: string; published_at: string | null }[]
    signups: { user_id: number; email: string; display_name: string | null; registered_at: string | null }[]
  }
}

function money(value: number) {
  return `TZS ${value.toLocaleString('en-US')}`
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setData(null)
    try {
      setData(await apiRequest<DashboardData>('/admin/dashboard'))
    } catch (problem) {
      setError(
        problem instanceof ApiError
          ? problem.message
          : 'The dashboard could not be loaded. Check your connection and try again.',
      )
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const tasks = data
    ? [
        { label: 'Accounts without access', count: data.members.deactivated, to: '/admin/members', icon: UserCheck },
        { label: 'Accounts awaiting approval', count: data.members.pending_approval, to: '/admin/members', icon: ClipboardList },
        { label: 'Upcoming events', count: data.events.upcoming, to: '/admin/events', icon: Clock },
        { label: 'Active newsletter subscribers', count: data.newsletter.active_subscribers, to: '/admin/newsletter', icon: FileText },
      ]
    : []

  return (
    <>
      <PageHeader
        title="Dashboard"
        badge={<Badge tone="outline">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Badge>}
        actions={
          <>
            <ButtonLink to="/admin/messages" variant="outline" size="sm" iconLeft={<Send className="h-3.5 w-3.5" />}>
              Send message
            </ButtonLink>
            <ButtonLink to="/admin/events" size="sm">
              New event
            </ButtonLink>
          </>
        }
      />

      <Alert
        tone="info"
        title="Registration is automatic"
        action={
          <Link
            to="/admin/members"
            className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-brand-800 hover:underline"
          >
            Manage accounts
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        }
      >
        New student accounts are active immediately and can sign in without approval. Deactivate an account to block access.
      </Alert>

      {error ? (
        <Alert
          tone="danger"
          title="Dashboard data is unavailable"
          className="mt-4"
          action={
            <Button variant="outline" size="sm" iconLeft={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      {!data && !error ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : null}

      {data ? (
        <>
          <StatStrip>
            <SmallStat label="Members" value={data.members.total} hint={`${data.members.approved} approved`} tone="brand" />
            <SmallStat label="Awaiting approval" value={data.members.pending_approval} hint="Accounts" />
            <SmallStat label="Upcoming events" value={data.events.upcoming} hint="From today" />
            <SmallStat
              label="Active today"
              value={data.activity.daily_active_users ?? '—'}
              hint="Signed-in members"
            />
          </StatStrip>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <Card>
              <CardHeader
                title="Club at a glance"
                action={
                  <Badge tone="amber">
                    {tasks.reduce((total, task) => total + task.count, 0)} open
                  </Badge>
                }
              />
              <ul className="divide-y divide-line">
                {tasks.map((task) => {
                  const Icon = task.icon
                  return (
                    <li key={task.label}>
                      <Link to={task.to} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-50/60">
                        <Icon className="h-5 w-5 shrink-0 text-ink-500" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.8125rem] font-medium text-ink-900">{task.label}</span>
                        </span>
                        <span className="text-[0.8125rem] font-semibold tabular text-ink-900">{task.count}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-ink-300" aria-hidden />
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className="border-t border-line px-4 py-3">
                <Link
                  to="/admin/members"
                  className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline"
                >
                  Open member directory
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </Card>

            <Card>
              <CardHeader title="Financial period" action={<ButtonLink to="/admin/finance" variant="ghost" size="sm">Finance</ButtonLink>} />
              {data.finance ? (
                <dl className="divide-y divide-line">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-[0.75rem] text-ink-500">Period</dt>
                    <dd className="text-[0.8125rem] font-medium text-ink-900">{data.finance.period_name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-[0.75rem] text-ink-500">Revenue</dt>
                    <dd className="text-[0.8125rem] tabular text-ink-900">{money(data.finance.revenue)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-[0.75rem] text-ink-500">Expenses</dt>
                    <dd className="text-[0.8125rem] tabular text-ink-900">{money(data.finance.expenses)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-[0.75rem] text-ink-500">Balance</dt>
                    <dd className="text-[0.8125rem] font-semibold tabular text-brand-800">{money(data.finance.balance)}</dd>
                  </div>
                </dl>
              ) : (
                <div className="p-4">
                  <EmptyState
                    compact
                    title="No open financial period"
                    description="Totals appear here once a period is opened on the finance page."
                  />
                </div>
              )}
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Recent news" action={<ButtonLink to="/admin/news" variant="ghost" size="sm">All news</ButtonLink>} />
              {data.recent.news.length ? (
                <ul className="divide-y divide-line">
                  {data.recent.news.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.8125rem] font-medium text-ink-900">{item.title}</span>
                        <span className="mt-0.5 block text-[0.6875rem] text-ink-400">
                          {item.published_at ? formatDate(item.published_at) : 'Not published'}
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4">
                  <EmptyState compact title="No news yet" description="Published articles appear here." />
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Recent sign-ups" action={<Badge tone="outline">Newest accounts</Badge>} />
              {data.recent.signups.length ? (
                <ul className="divide-y divide-line">
                  {data.recent.signups.map((item) => (
                    <li key={item.user_id} className="flex items-center gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.8125rem] font-medium text-ink-900">{item.display_name ?? item.email}</span>
                        <span className="mt-0.5 block text-[0.6875rem] text-ink-400">{item.email}</span>
                      </span>
                      <span className="whitespace-nowrap text-[0.6875rem] text-ink-400">
                        {item.registered_at ? formatDate(item.registered_at) : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4">
                  <EmptyState compact title="No sign-ups yet" description="New student accounts appear here." />
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </>
  )
}

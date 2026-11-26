import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { demoNotifications } from '../../data/demo'
import { PageHeader, SectionTitle } from '../../components/app/primitives'
import { Badge, Button, ButtonLink, Card, EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { cn, formatDate } from '../../lib/utils'
import { useToast } from '../../context/ToastContext'
import { useSocial, useViewer } from '../../features/social/hooks'
import {
  approveFollowRequest,
  markSocialNotificationsRead,
  notificationsFor,
  rejectFollowRequest,
  requestViews,
} from '../../features/social/store'
import type { SocialNotification } from '../../features/social/types'

const kindLabel: Record<string, string> = {
  competition: 'Competition',
  session: 'Session',
  membership: 'Membership',
  team: 'Team',
  quiz: 'Warmup',
  follow: 'New follower',
  follow_request: 'Follow request',
  request_approved: 'Request approved',
  request_declined: 'Request declined',
  follow_removed: 'Follower removed',
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.round(diff / 36e5)
  if (hours < 24) return `${Math.max(1, hours)}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(value)
}

function socialIcon(kind: SocialNotification['kind']) {
  if (kind === 'follow') return <UserPlus className="h-3.5 w-3.5" aria-hidden />
  if (kind === 'follow_request') return <Users className="h-3.5 w-3.5" aria-hidden />
  if (kind === 'request_approved') return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
  if (kind === 'request_declined') return <X className="h-3.5 w-3.5" aria-hidden />
  return <UserMinus className="h-3.5 w-3.5" aria-hidden />
}

type CombinedItem =
  | { type: 'social'; id: string; date: string; read: boolean; item: SocialNotification }
  | { type: 'demo'; id: string; date: string; read: boolean; item: (typeof demoNotifications)[number] }

export function MemberNotifications() {
  useSocial()
  const viewer = useViewer()
  const { push } = useToast()
  const [items, setItems] = useState(demoNotifications)
  const [tab, setTab] = useState('all')

  const social = notificationsFor(viewer)
  const requests = viewer ? requestViews(viewer) : { incoming: [], outgoing: [] }
  const pendingIncoming = new Set(requests.incoming.map((request) => request.id))

  const combined: CombinedItem[] = [
    ...social.map((item) => ({ type: 'social' as const, id: item.id, date: item.createdAt, read: item.read, item })),
    ...items.map((item) => ({ type: 'demo' as const, id: String(item.id), date: item.date, read: item.read, item })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const unread = combined.filter((item) => !item.read).length
  const visible = tab === 'unread' ? combined.filter((item) => !item.read) : combined

  return (
    <>
      <PageHeader
        title="Notifications"
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Notifications' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            iconLeft={<CheckCheck className="h-3.5 w-3.5" />}
            disabled={unread === 0}
            onClick={() => {
              setItems((current) => current.map((item) => ({ ...item, read: true })))
              markSocialNotificationsRead(viewer)
              push({ tone: 'info', title: 'Notifications marked as read' })
            }}
          >
            Mark all as read
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList ariaLabel="Notification filters">
          <TabsTrigger value="all">All ({combined.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
            {visible.length ? (
              <ul className="divide-y divide-line">
                {visible.map((entry) =>
                  entry.type === 'social' ? (
                    <li key={entry.id} className={cn('px-4 py-4', !entry.read && 'bg-brand-50/25')}>
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px]',
                            !entry.read ? 'bg-brand-50 text-brand-700' : 'bg-ink-50 text-ink-400',
                          )}
                        >
                          {socialIcon(entry.item.kind)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn('text-[0.8125rem] text-ink-900', entry.read ? 'font-medium' : 'font-semibold')}>
                              {entry.item.title}
                            </p>
                            {!entry.read ? <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-label="Unread" /> : null}
                          </div>
                          <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">{entry.item.body}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.6875rem] text-ink-400">
                            <Badge tone="outline">{kindLabel[entry.item.kind]}</Badge>
                            <span>{relativeTime(entry.item.createdAt)}</span>
                            <Link to={`/members/${entry.item.actor}`} className="font-medium text-brand-800 hover:underline">
                              Open profile
                            </Link>
                          </div>
                          {entry.item.kind === 'follow_request' &&
                          entry.item.requestId &&
                          pendingIncoming.has(entry.item.requestId) ? (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                iconLeft={<Check className="h-3 w-3" />}
                                onClick={() => {
                                  const result = approveFollowRequest(viewer, entry.item.requestId as string)
                                  if (result.ok) push({ tone: 'success', title: 'Follow request approved' })
                                  else push({ tone: 'error', title: 'Could not approve request', description: result.error })
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                iconLeft={<X className="h-3 w-3" />}
                                onClick={() => {
                                  const result = rejectFollowRequest(viewer, entry.item.requestId as string)
                                  if (result.ok) push({ tone: 'info', title: 'Follow request declined' })
                                  else push({ tone: 'error', title: 'Could not decline request', description: result.error })
                                }}
                              >
                                Decline
                              </Button>
                            </div>
                          ) : null}
                          {entry.item.kind === 'follow_request' &&
                          entry.item.requestId &&
                          !pendingIncoming.has(entry.item.requestId) ? (
                            <p className="mt-2 inline-flex items-center gap-1 text-[0.6875rem] text-ink-400">
                              <Clock className="h-3 w-3" aria-hidden /> This request has been answered.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ) : (
                    <li key={`demo-${entry.id}`}>
                      <Link
                        to={`/member/notifications/${entry.id}`}
                        onClick={() =>
                          setItems((current) => current.map((item) => (item.id === entry.item.id ? { ...item, read: true } : item)))
                        }
                        className={cn('group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-ink-50/60', !entry.read && 'bg-brand-50/25')}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px]',
                            !entry.read ? 'bg-brand-50 text-brand-700' : 'bg-ink-50 text-ink-400',
                          )}
                        >
                          {entry.item.kind === 'competition' ? <Trophy className="h-3.5 w-3.5" aria-hidden /> : null}
                          {entry.item.kind === 'team' ? <Users className="h-3.5 w-3.5" aria-hidden /> : null}
                          {entry.item.kind === 'membership' ? <Wallet className="h-3.5 w-3.5" aria-hidden /> : null}
                          {!['competition', 'team', 'membership'].includes(entry.item.kind) ? <Bell className="h-3.5 w-3.5" aria-hidden /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className={cn('text-[0.8125rem] text-ink-900', entry.read ? 'font-medium' : 'font-semibold')}>
                              {entry.item.title}
                            </span>
                            {!entry.read ? <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-label="Unread" /> : null}
                          </span>
                          <span className="mt-1 block text-[0.75rem] leading-5 text-ink-500">{entry.item.body}</span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.6875rem] text-ink-400">
                            <Badge tone="outline">{kindLabel[entry.item.kind] ?? 'Notice'}</Badge>
                            <span>{relativeTime(entry.item.date)}</span>
                          </span>
                        </span>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <div className="p-4">
                <EmptyState
                  icon={<BellOff className="h-4 w-4" aria-hidden />}
                  title="No unread notifications"
                  description="You have read everything in this list. New notifications will appear here."
                  action={
                    <Button variant="outline" size="sm" onClick={() => setTab('all')}>
                      View all notifications
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Follow activity and requests are stored with the same notification records used by the member account. Club broadcasts
        remain demonstration data.
      </p>
    </>
  )
}

export function MemberNotificationDetail() {
  useSocial()
  const { id } = useParams()
  const viewer = useViewer()
  const { push } = useToast()
  const social = notificationsFor(viewer)
  const socialItem = social.find((entry) => entry.id === id)
  const item = demoNotifications.find((entry) => String(entry.id) === id)
  const requests = viewer ? requestViews(viewer) : { incoming: [], outgoing: [] }
  const pending = socialItem?.requestId ? requests.incoming.some((request) => request.id === socialItem.requestId) : false

  if (socialItem) {
    return (
      <>
        <Link to="/member/notifications" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All notifications
        </Link>

        <article className="rounded-lg border border-line bg-surface">
          <header className="border-b border-line px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="outline">{kindLabel[socialItem.kind]}</Badge>
              <span className="text-[0.6875rem] text-ink-400">
                {formatDate(socialItem.createdAt, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="mt-2 text-[1.375rem] font-semibold leading-snug tracking-[-0.01em] text-ink-950">{socialItem.title}</h1>
          </header>
          <div className="px-5 py-5">
            <p className="max-w-[68ch] text-[0.875rem] leading-7 text-ink-700">{socialItem.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink to={`/members/${socialItem.actor}`} size="sm">
                Open member profile
              </ButtonLink>
              {socialItem.kind === 'follow_request' && socialItem.requestId && pending ? (
                <>
                  <Button
                    size="sm"
                    iconLeft={<Check className="h-3.5 w-3.5" />}
                    onClick={() => {
                      const result = approveFollowRequest(viewer, socialItem.requestId as string)
                      if (result.ok) push({ tone: 'success', title: 'Follow request approved' })
                      else push({ tone: 'error', title: 'Could not approve request', description: result.error })
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    iconLeft={<X className="h-3.5 w-3.5" />}
                    onClick={() => {
                      const result = rejectFollowRequest(viewer, socialItem.requestId as string)
                      if (result.ok) push({ tone: 'info', title: 'Follow request declined' })
                      else push({ tone: 'error', title: 'Could not decline request', description: result.error })
                    }}
                  >
                    Decline
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </article>
      </>
    )
  }

  if (!item) {
    return (
      <>
        <PageHeader title="Notification not found" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Notifications', to: '/member/notifications' }]} />
        <Card>
          <div className="p-4">
            <EmptyState
              title="This notification is not available"
              description="It may have been removed, or the link is incorrect. Open the notification list to see current updates."
              action={
                <ButtonLink to="/member/notifications" size="sm">
                  Back to notifications
                </ButtonLink>
              }
            />
          </div>
        </Card>
      </>
    )
  }

  const related =
    item.kind === 'competition'
      ? { to: '/member/rankings', label: 'View rankings' }
      : item.kind === 'session'
        ? { to: '/member/sessions/timetable', label: 'Open timetable' }
        : item.kind === 'membership'
          ? { to: '/member/membership', label: 'View membership' }
          : item.kind === 'team'
            ? { to: '/member/teams', label: 'Open team hub' }
            : { to: '/member/quizzes', label: 'Open warmups' }

  return (
    <>
      <Link to="/member/notifications" className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All notifications
      </Link>

      <article className="rounded-lg border border-line bg-surface">
        <header className="border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{kindLabel[item.kind] ?? 'Notice'}</Badge>
            <span className="text-[0.6875rem] text-ink-400">
              {formatDate(item.date, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h1 className="mt-2 text-[1.375rem] font-semibold leading-snug tracking-[-0.01em] text-ink-950">{item.title}</h1>
        </header>
        <div className="px-5 py-5">
          <p className="max-w-[68ch] text-[0.875rem] leading-7 text-ink-700">{item.body}</p>
          <p className="mt-3 max-w-[68ch] text-[0.8125rem] leading-6 text-ink-500">
            If this update changes something you have already planned for, check the related page for the current schedule or result.
            Contact the club if you think the notification is wrong.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink to={related.to} size="sm">
              {related.label}
            </ButtonLink>
            <Button
              variant="outline"
              size="sm"
              onClick={() => push({ tone: 'info', title: 'Marked as read' })}
            >
              Mark as read
            </Button>
          </div>
        </div>
      </article>

      <SectionTitle className="mt-6" title="Other updates" description="Recent notifications in this list" />
      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {demoNotifications
          .filter((entry) => entry.id !== item.id)
          .slice(0, 3)
          .map((entry) => (
            <Link key={entry.id} to={`/member/notifications/${entry.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-ink-50/60">
              <div className="min-w-0">
                <p className="truncate text-[0.8125rem] font-medium text-ink-900">{entry.title}</p>
                <p className="text-[0.6875rem] text-ink-400">{formatDate(entry.date)}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" aria-hidden />
            </Link>
          ))}
      </div>
    </>
  )
}

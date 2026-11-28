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
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { memberApi, type MemberNotification } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
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
  | { type: 'server'; id: string; date: string; read: boolean; item: MemberNotification }

export function MemberNotifications() {
  useSocial()
  const viewer = useViewer()
  const { push } = useToast()
  const { data, loading, error, reload } = useMemberData(() => memberApi.notifications(), [])
  const [tab, setTab] = useState('all')
  const [marking, setMarking] = useState(false)

  const social = notificationsFor(viewer)
  const requests = viewer ? requestViews(viewer) : { incoming: [], outgoing: [] }
  const pendingIncoming = new Set(requests.incoming.map((request) => request.id))

  const combined: CombinedItem[] = [
    ...social.map((item) => ({ type: 'social' as const, id: item.id, date: item.createdAt, read: item.read, item })),
    ...(data?.items ?? []).map((item) => ({
      type: 'server' as const,
      id: String(item.id),
      date: item.created_at,
      read: item.is_read,
      item,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const unread = combined.filter((entry) => !entry.read).length
  const visible = tab === 'unread' ? combined.filter((entry) => !entry.read) : combined

  async function markAllRead() {
    setMarking(true)
    try {
      await memberApi.markAllNotificationsRead()
      markSocialNotificationsRead(viewer)
      push({ tone: 'success', title: 'Notifications marked as read' })
      reload()
    } catch (catchError) {
      push({
        tone: 'error',
        title: 'Could not mark notifications as read',
        description: catchError instanceof Error ? catchError.message : 'Try again.',
      })
    } finally {
      setMarking(false)
    }
  }

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Notifications" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Notifications' }]} />
        <LoadingBlock rows={4} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Notifications" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Notifications' }]} />
        <ErrorBlock message={error ?? 'Your notifications could not be loaded.'} onRetry={reload} />
      </>
    )
  }

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
            disabled={unread === 0 || marking}
            onClick={markAllRead}
          >
            {marking ? 'Marking…' : 'Mark all as read'}
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
                    <li key={`server-${entry.id}`}>
                      <Link
                        to={`/member/notifications/${entry.id}`}
                        className={cn(
                          'group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-ink-50/60',
                          !entry.read && 'bg-brand-50/25',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px]',
                            !entry.read ? 'bg-brand-50 text-brand-700' : 'bg-ink-50 text-ink-400',
                          )}
                        >
                          <Bell className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className={cn('text-[0.8125rem] text-ink-900', entry.read ? 'font-medium' : 'font-semibold')}>
                              {entry.item.title}
                            </span>
                            {!entry.read ? <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-label="Unread" /> : null}
                          </span>
                          {entry.item.message ? (
                            <span className="mt-1 block text-[0.75rem] leading-5 text-ink-500">{entry.item.message}</span>
                          ) : null}
                          <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.6875rem] text-ink-400">
                            <Badge tone="outline">Club notice</Badge>
                            <span>{relativeTime(entry.item.created_at)}</span>
                          </span>
                        </span>
                        <ChevronRight
                          className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <div className="p-4">
                <EmptyState
                  icon={<BellOff className="h-4 w-4" aria-hidden />}
                  title={tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  description={
                    tab === 'unread'
                      ? 'You have read everything in this list. New notifications will appear here.'
                      : 'Club updates, competition results and team notices will appear here.'
                  }
                  action={
                    tab === 'unread' ? (
                      <Button variant="outline" size="sm" onClick={() => setTab('all')}>
                        View all notifications
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Club notices are sent by administrators. Follow activity and requests are listed alongside them.
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
  const requests = viewer ? requestViews(viewer) : { incoming: [], outgoing: [] }
  const pending = socialItem?.requestId ? requests.incoming.some((request) => request.id === socialItem.requestId) : false

  const { data: item, loading, error, reload } = useMemberData(
    () => (socialItem ? Promise.resolve(null) : memberApi.notification(Number(id))),
    [id, Boolean(socialItem)],
  )
  const [marking, setMarking] = useState(false)

  if (socialItem) {
    return (
      <>
        <Link
          to="/member/notifications"
          className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All notifications
        </Link>

        <article className="rounded-lg border border-line bg-surface">
          <header className="border-b border-line px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="outline">{kindLabel[socialItem.kind]}</Badge>
              <span className="text-[0.6875rem] text-ink-400">
                {formatDate(socialItem.createdAt, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
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

  if (loading && !item) {
    return (
      <>
        <PageHeader
          title="Notification"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Notifications', to: '/member/notifications' }]}
        />
        <LoadingBlock rows={2} />
      </>
    )
  }

  if (error || !item) {
    return (
      <>
        <PageHeader
          title="Notification"
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Notifications', to: '/member/notifications' }]}
        />
        {error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : (
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
        )}
      </>
    )
  }

  async function markRead() {
    if (!item) return
    setMarking(true)
    try {
      await memberApi.markNotificationRead(item.id)
      push({ tone: 'success', title: 'Marked as read' })
      reload()
    } catch (catchError) {
      push({
        tone: 'error',
        title: 'Could not mark as read',
        description: catchError instanceof Error ? catchError.message : 'Try again.',
      })
    } finally {
      setMarking(false)
    }
  }

  return (
    <>
      <Link
        to="/member/notifications"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All notifications
      </Link>

      <article className="rounded-lg border border-line bg-surface">
        <header className="border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">Club notice</Badge>
            <Badge tone={item.is_read ? 'neutral' : 'green'}>{item.is_read ? 'Read' : 'Unread'}</Badge>
            <span className="text-[0.6875rem] text-ink-400">
              {formatDate(item.created_at, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <h1 className="mt-2 text-[1.375rem] font-semibold leading-snug tracking-[-0.01em] text-ink-950">{item.title}</h1>
        </header>
        <div className="px-5 py-5">
          <p className="max-w-[68ch] whitespace-pre-line text-[0.875rem] leading-7 text-ink-700">
            {item.message ?? 'This notice has no further detail.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink to="/member" size="sm">
              Back to dashboard
            </ButtonLink>
            <Button variant="outline" size="sm" disabled={item.is_read || marking} onClick={markRead}>
              {item.is_read ? 'Already read' : marking ? 'Marking…' : 'Mark as read'}
            </Button>
          </div>
        </div>
      </article>
    </>
  )
}

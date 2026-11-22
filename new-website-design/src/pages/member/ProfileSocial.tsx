import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, Search, UserMinus, Users, X } from 'lucide-react'
import { useSocial, useViewer } from '../../features/social/hooks'
import {
  approveFollowRequest,
  cancelFollowRequest,
  listFollowers,
  listFollowing,
  memberCounts,
  rejectFollowRequest,
  removeFollower,
  requestViews,
} from '../../features/social/store'
import type { MemberSearchItem } from '../../features/social/types'
import { MemberRow } from '../../features/social/MemberRow'
import { Button, ButtonLink, Card, CardBody, CardHeader, EmptyState, Pagination, Segmented } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

const PAGE_SIZE = 8

export function ProfileSocial() {
  useSocial()
  const viewer = useViewer()
  const { push } = useToast()
  const [view, setView] = useState<'followers' | 'following' | 'requests'>('followers')
  const [page, setPage] = useState(1)

  if (!viewer) return null
  const counts = memberCounts(viewer)
  const requests = requestViews(viewer)
  const followersResult = listFollowers(viewer, viewer)
  const followingResult = listFollowing(viewer, viewer)
  const followers = followersResult.ok ? followersResult.data : []
  const following = followingResult.ok ? followingResult.data : []
  const pendingCount = requests.incoming.length + requests.outgoing.length

  const show = (next: 'followers' | 'following' | 'requests') => {
    setView(next)
    setPage(1)
  }

  return (
    <div className="space-y-5 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Social lists"
          value={view}
          onChange={(value) => show(value as typeof view)}
          options={[
            { value: 'followers', label: 'Followers', count: counts.followers },
            { value: 'following', label: 'Following', count: counts.following },
            { value: 'requests', label: 'Requests', count: pendingCount },
          ]}
        />
        <p className="text-[0.75rem] text-ink-500">
          Counts come from real follow records. Only you decide who can see these lists.
        </p>
      </div>

      {view === 'requests' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Requests to follow you"
              description="Approve to add them as a follower, or decline without creating a relationship."
              action={<span className="text-[0.75rem] tabular text-ink-400">{requests.incoming.length}</span>}
            />
            {requests.incoming.length ? (
              <ul className="divide-y divide-line">
                {requests.incoming.map((request) => (
                  <li key={request.id} className="px-5 py-3">
                    <MemberRow member={request.profile} />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        iconLeft={<Check className="h-3 w-3" />}
                        onClick={() => {
                          const result = approveFollowRequest(viewer, request.id)
                          if (result.ok) push({ tone: 'success', title: `${request.profile.displayName} now follows you.` })
                          else push({ tone: 'error', title: 'Request not approved', description: result.error })
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        iconLeft={<X className="h-3 w-3" />}
                        onClick={() => {
                          const result = rejectFollowRequest(viewer, request.id)
                          if (result.ok) push({ tone: 'info', title: 'Request declined' })
                          else push({ tone: 'error', title: 'Request not declined', description: result.error })
                        }}
                      >
                        Decline
                      </Button>
                      <Link to={`/members/${request.profile.username}`} className="text-[0.75rem] font-medium text-brand-800 hover:underline">
                        Open profile
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact className="m-5" icon={<Users className="h-4 w-4" aria-hidden />} title="No pending requests" description="Requests to follow your private profile appear here and in your notifications." />
            )}
          </Card>

          <Card>
            <CardHeader
              title="Requests you sent"
              description="Pending requests to private accounts. You can cancel one at any time."
              action={<span className="text-[0.75rem] tabular text-ink-400">{requests.outgoing.length}</span>}
            />
            {requests.outgoing.length ? (
              <ul className="divide-y divide-line">
                {requests.outgoing.map((request) => (
                  <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <MemberRow member={request.profile} className="flex-1 py-0" />
                    <Button
                      size="xs"
                      variant="outline"
                      iconLeft={<Clock className="h-3 w-3" />}
                      onClick={() => {
                        const result = cancelFollowRequest(viewer, request.id)
                        if (result.ok) push({ tone: 'info', title: 'Follow request cancelled' })
                        else push({ tone: 'error', title: 'Could not cancel request', description: result.error })
                      }}
                    >
                      Cancel
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact className="m-5" icon={<Clock className="h-4 w-4" aria-hidden />} title="No outgoing requests" description="Requests to private accounts are listed here until they are answered." />
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader
            title={view === 'followers' ? 'Your followers' : 'Members you follow'}
            description={
              view === 'followers'
                ? 'Removing a follower ends their access to your protected profile information.'
                : 'Unfollow a member to stop seeing their protected profile information.'
            }
            action={
              <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-400">
                <Search className="h-3.5 w-3.5" aria-hidden />
                <Link to="/member" className="font-medium text-brand-800 hover:underline">Search members</Link>
              </span>
            }
          />
          <CardBody>
            <MemberList
              kind={view}
              members={view === 'followers' ? followers : following}
              page={page}
              onPage={setPage}
              onRemoveFollower={(member: MemberSearchItem) => {
                const result = removeFollower(viewer, member.username)
                if (result.ok) push({ tone: 'success', title: `${member.displayName} was removed from your followers.` })
                else push({ tone: 'error', title: 'Could not remove follower', description: result.error })
              }}
            />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.75rem] leading-5 text-ink-500">
            Follow requests also appear in your notifications, where you can approve or decline them.
          </p>
          <ButtonLink to="/member/notifications" size="sm" variant="outline">
            Open notifications
          </ButtonLink>
        </CardBody>
      </Card>
    </div>
  )
}

function MemberList({
  kind,
  members,
  page,
  onPage,
  onRemoveFollower,
}: {
  kind: 'followers' | 'following'
  members: MemberSearchItem[]
  page: number
  onPage: (page: number) => void
  onRemoveFollower: (member: MemberSearchItem) => void
}) {
  const pageCount = Math.max(1, Math.ceil(members.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = members.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  if (!members.length) {
    return (
      <EmptyState
        compact
        icon={<Users className="h-4 w-4" aria-hidden />}
        title={kind === 'followers' ? 'No followers yet' : 'You are not following anyone yet'}
        description={
          kind === 'followers'
            ? 'When another member follows you they appear here.'
            : 'Use member search in the dashboard header to find members by name, username, skills or interests.'
        }
      />
    )
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {visible.map((member) => (
          <li key={member.username}>
            <MemberRow
              member={member}
              trailing={
                kind === 'followers' ? (
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label={`Remove ${member.displayName} from your followers`}
                    iconLeft={<UserMinus className="h-3 w-3" />}
                    onClick={() => onRemoveFollower(member)}
                  >
                    Remove
                  </Button>
                ) : null
              }
            />
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Pagination
          page={current}
          pageCount={pageCount}
          onChange={onPage}
          totalLabel={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}
        />
      </div>
    </>
  )
}

export default ProfileSocial

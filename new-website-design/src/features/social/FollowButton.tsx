import { Check, Clock, LockKeyhole, UserPlus } from 'lucide-react'
import { Button, ButtonLink } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { useToast } from '../../context/ToastContext'
import { useSocial, useViewer } from './hooks'
import {
  cancelFollowRequest,
  followMember,
  profileOf,
  relationshipFor,
  requestFollow,
  unfollowMember,
} from './store'
import type { SocialResult } from './types'

export function FollowButton({
  username,
  size = 'sm',
  className,
}: {
  username: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  useSocial()
  const viewer = useViewer()
  const { push } = useToast()
  const profile = profileOf(username)
  const relationship = relationshipFor(viewer, username)
  /* Slightly larger tap targets on phones, matching the existing desktop sizing. */
  const tap = size === 'xs' ? 'h-9 sm:h-7' : size === 'sm' ? 'h-9 sm:h-8' : undefined

  if (!viewer) {
    return (
      <ButtonLink
        to="/auth/login"
        size={size}
        className={cn(tap, className)}
        iconLeft={<UserPlus className="h-3.5 w-3.5" aria-hidden />}
      >
        Follow
      </ButtonLink>
    )
  }
  if (!profile || relationship.state === 'self') return null

  const report = (result: SocialResult, success: string) => {
    if (result.ok) push({ tone: 'success', title: success })
    else push({ tone: 'error', title: 'Action not completed', description: result.error })
  }

  if (relationship.state === 'blocked') {
    return (
      <Button size={size} variant="outline" disabled className={cn(tap, className)}>
        Unavailable
      </Button>
    )
  }

  if (relationship.isFollower) {
    return (
      <Button
        size={size}
        variant="outline"
        className={cn('group', tap, className)}
        iconLeft={<Check className="h-3.5 w-3.5 text-brand-700" aria-hidden />}
        onClick={() => report(unfollowMember(viewer, username), `You no longer follow ${profile.displayName}.`)}
        title="Unfollow"
      >
        Following
      </Button>
    )
  }

  if (relationship.hasPendingRequest && relationship.outgoingRequestId) {
    return (
      <Button
        size={size}
        variant="outline"
        className={cn(tap, className)}
        iconLeft={<Clock className="h-3.5 w-3.5" aria-hidden />}
        onClick={() => {
          const result = cancelFollowRequest(viewer, relationship.outgoingRequestId as string)
          report(result, 'Follow request cancelled.')
        }}
        title="Cancel follow request"
      >
        Request pending
      </Button>
    )
  }

  if (profile.visibility === 'private') {
    return (
      <Button
        size={size}
        className={cn(tap, className)}
        iconLeft={<LockKeyhole className="h-3.5 w-3.5" aria-hidden />}
        onClick={() => report(requestFollow(viewer, username), 'Follow request sent.')}
      >
        Request to follow
      </Button>
    )
  }

  return (
    <Button
      size={size}
      className={cn(tap, className)}
      iconLeft={<UserPlus className="h-3.5 w-3.5" aria-hidden />}
      onClick={() => report(followMember(viewer, username), `You now follow ${profile.displayName}.`)}
    >
      Follow
    </Button>
  )
}

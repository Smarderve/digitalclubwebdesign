import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { Avatar } from '../../components/ui/misc'
import { cn } from '../../lib/utils'
import { FollowButton } from './FollowButton'
import type { MemberSearchItem } from './types'

export function MemberRow({
  member,
  className,
  compact,
  trailing,
  linkBase = '/members',
}: {
  member: MemberSearchItem
  className?: string
  compact?: boolean
  trailing?: ReactNode
  /** Public site by default; the authenticated shell passes /member/members. */
  linkBase?: string
}) {
  return (
    <div className={cn('flex items-start gap-3', compact ? 'py-2' : 'py-3', className)}>
      <Avatar name={member.displayName} size={compact ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to={`${linkBase}/${member.username}`}
            className="truncate text-[0.8125rem] font-semibold text-ink-950 hover:text-brand-800 hover:underline"
          >
            {member.displayName}
          </Link>
          <span className="truncate font-mono text-[0.6875rem] text-ink-400">@{member.username}</span>
          {member.isPrivate ? (
            <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium text-ink-500">
              <LockKeyhole className="h-3 w-3" aria-hidden /> Private
            </span>
          ) : null}
        </div>
        {member.tagline ? (
          <p className="mt-0.5 line-clamp-1 text-[0.75rem] text-ink-500">{member.tagline}</p>
        ) : (
          <p className="mt-0.5 text-[0.75rem] text-ink-400">
            {member.isPrivate ? 'Follow to see this profile.' : 'No tagline added yet.'}
          </p>
        )}
        {member.skills.length ? (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {member.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-[3px] border border-line bg-ink-50 px-1.5 py-0.5 text-[0.625rem] text-ink-600"
              >
                {skill}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 pt-0.5">
        <FollowButton username={member.username} size={compact ? 'xs' : 'sm'} />
        {trailing}
      </div>
    </div>
  )
}

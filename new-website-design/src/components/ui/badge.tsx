import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

const tones = {
  neutral: 'border-ink-200 bg-ink-50 text-ink-700',
  green: 'border-brand-200 bg-brand-50 text-brand-800',
  amber: 'border-warning-line bg-warning-soft text-warning',
  red: 'border-danger-line bg-danger-soft text-danger',
  blue: 'border-info-line bg-info-soft text-info',
  dark: 'border-ink-800 bg-ink-900 text-white',
  outline: 'border-ink-200 bg-white text-ink-600',
  sample: 'border-dashed border-ink-300 bg-white text-ink-500',
} as const

export type BadgeTone = keyof typeof tones

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold leading-5',
        tones[tone],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            tone === 'green' && 'bg-brand-600',
            tone === 'amber' && 'bg-warning',
            tone === 'red' && 'bg-danger',
            tone === 'blue' && 'bg-info',
            tone === 'neutral' && 'bg-ink-400',
            tone === 'dark' && 'bg-brand-400',
            tone === 'outline' && 'bg-ink-300',
            tone === 'sample' && 'bg-ink-300',
          )}
        />
      ) : null}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    approved: { tone: 'green', label: 'Approved' },
    active: { tone: 'green', label: 'Active' },
    published: { tone: 'green', label: 'Published' },
    finalized: { tone: 'green', label: 'Finalized' },
    open: { tone: 'green', label: 'Open' },
    enrolled: { tone: 'green', label: 'Enrolled' },
    pending: { tone: 'amber', label: 'Pending' },
    submitted: { tone: 'amber', label: 'Submitted' },
    under_review: { tone: 'amber', label: 'Under review' },
    draft: { tone: 'neutral', label: 'Draft' },
    judging: { tone: 'amber', label: 'Judging' },
    closed: { tone: 'neutral', label: 'Closed' },
    rejected: { tone: 'red', label: 'Rejected' },
    disqualified: { tone: 'red', label: 'Disqualified' },
    suspended: { tone: 'red', label: 'Suspended' },
    archived: { tone: 'neutral', label: 'Archived' },
    cancelled: { tone: 'red', label: 'Cancelled' },
    voting: { tone: 'blue', label: 'Voting' },
    nominations: { tone: 'amber', label: 'Nominations' },
    screening: { tone: 'blue', label: 'Screening' },
    counting: { tone: 'blue', label: 'Counting' },
  }
  const entry = map[status] ?? { tone: 'neutral' as BadgeTone, label: status.replace(/_/g, ' ') }
  return (
    <Badge tone={entry.tone} dot>
      {entry.label}
    </Badge>
  )
}

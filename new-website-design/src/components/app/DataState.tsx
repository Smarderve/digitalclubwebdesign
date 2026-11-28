import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardBody, EmptyState, Skeleton } from '../ui'

/** Loading placeholder sized like the list it replaces, so the page never jumps. */
export function LoadingBlock({
  label = 'Loading your records…',
  rows = 3,
}: {
  label?: string
  rows?: number
}) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div role="status" aria-label={label} className="space-y-3">
          <span className="sr-only">{label}</span>
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-6 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

/** The server's message, never a generic "something went wrong" fallback. */
export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger-line bg-danger-soft px-5 py-4">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold text-ink-900">Could not load this page</p>
          <p className="mt-0.5 text-[0.8125rem] leading-5 text-ink-600">{message}</p>
          {onRetry ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onRetry}
              iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function EmptyBlock({
  title,
  description,
  icon,
  action,
  compact,
}: {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  return <EmptyState title={title} description={description} icon={icon} action={action} compact={compact} />
}

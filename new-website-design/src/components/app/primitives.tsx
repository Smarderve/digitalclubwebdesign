import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Breadcrumbs } from '../ui/misc'
import { Input } from '../ui/field'

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  badge,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: { label: string; to?: string }[]
  badge?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className={cn('flex flex-wrap items-start justify-between gap-4', breadcrumbs?.length && 'mt-2')}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink-950">{title}</h1>
            {badge}
          </div>
          {description ? <p className="mt-1 max-w-[72ch] text-[0.8125rem] leading-6 text-ink-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

export function MetricRow({
  items,
  className,
}: {
  items: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; tone?: 'brand' | 'amber' | 'neutral' | 'danger' }[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2',
        items.length > 2 && 'lg:grid-cols-4',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col justify-between gap-3 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            {item.icon ? (
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-[4px]',
                  (item.tone ?? 'neutral') === 'brand' && 'bg-brand-50 text-brand-700',
                  (item.tone ?? 'neutral') === 'amber' && 'bg-warning-soft text-warning',
                  (item.tone ?? 'neutral') === 'danger' && 'bg-danger-soft text-danger',
                  (item.tone ?? 'neutral') === 'neutral' && 'bg-ink-50 text-ink-500',
                )}
              >
                {item.icon}
              </span>
            ) : null}
          </div>
          <div>
            <p className="text-[1.375rem] font-semibold tabular tracking-tight text-ink-950">{item.value}</p>
            {item.hint ? <p className="mt-0.5 text-[0.6875rem] text-ink-400">{item.hint}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DataToolbar({
  search,
  onSearch,
  placeholder = 'Search…',
  children,
  count,
  className,
}: {
  search: string
  onSearch: (value: string) => void
  placeholder?: string
  children?: ReactNode
  count?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      <div className="relative min-w-[200px] flex-1 sm:max-w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
          className="h-9 pl-8"
          aria-label={placeholder}
        />
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      {count ? <p className="text-[0.6875rem] text-ink-400 sm:ml-auto">{count}</p> : null}
    </div>
  )
}

export function SectionTitle({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex flex-wrap items-end justify-between gap-2', className)}>
      <div>
        <h2 className="text-[0.9375rem] font-semibold text-ink-950">{title}</h2>
        {description ? <p className="mt-0.5 text-[0.75rem] text-ink-500">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}


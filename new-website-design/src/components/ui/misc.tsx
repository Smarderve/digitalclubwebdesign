import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Info, SearchX, TriangleAlert } from 'lucide-react'
import { cn, initials } from '../../lib/utils'

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[0.625rem]',
    sm: 'h-8 w-8 text-[0.6875rem]',
    md: 'h-10 w-10 text-[0.8125rem]',
    lg: 'h-14 w-14 text-[1rem]',
    xl: 'h-20 w-20 text-[1.35rem]',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 font-semibold tracking-wide text-brand-800 ring-1 ring-inset ring-brand-100',
        sizes[size],
        className,
      )}
      aria-hidden={!name}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </span>
  )
}

export function Progress({
  value,
  max = 100,
  label,
  tone = 'brand',
  className,
}: {
  value: number
  max?: number
  label?: string
  tone?: 'brand' | 'amber' | 'neutral'
  className?: string
}) {
  const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-[0.75rem] text-ink-500">
          <span>{label}</span>
          <span className="tabular font-medium text-ink-700">{percent}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500',
            tone === 'brand' && 'bg-brand-600',
            tone === 'amber' && 'bg-gold',
            tone === 'neutral' && 'bg-ink-400',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

const alertTones = {
  info: { wrap: 'border-info-line bg-info-soft', icon: 'text-info', Icon: Info },
  success: { wrap: 'border-brand-200 bg-brand-50/70', icon: 'text-brand-700', Icon: CheckCircle2 },
  warning: { wrap: 'border-warning-line bg-warning-soft', icon: 'text-warning', Icon: TriangleAlert },
  danger: { wrap: 'border-danger-line bg-danger-soft', icon: 'text-danger', Icon: AlertCircle },
} as const

export function Alert({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof alertTones
  title?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  const config = alertTones[tone]
  const Icon = config.Icon
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('rounded-md border px-4 py-3', config.wrap, className)}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.icon)} aria-hidden />
        <div className="min-w-0 flex-1">
          {title ? <p className="text-[0.8125rem] font-semibold text-ink-900">{title}</p> : null}
          <div className={cn('text-[0.8125rem] leading-5 text-ink-600', title && 'mt-0.5')}>{children}</div>
          {action ? <div className="mt-2">{action}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-6 text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-400">
        {icon ?? <SearchX className="h-4.5 w-4.5" aria-hidden />}
      </div>
      <p className="text-[0.9375rem] font-semibold text-ink-900">{title}</p>
      <p className="mt-1 max-w-[46ch] text-[0.8125rem] leading-6 text-ink-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-ink-100', className)} aria-hidden />
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-[0.75rem] text-ink-500">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span aria-hidden className="text-ink-300">
                /
              </span>
            ) : null}
            {item.to ? (
              <Link to={item.to} className="hover:text-brand-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink-800">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Pagination({
  page,
  pageCount,
  onChange,
  totalLabel,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
  totalLabel?: string
}) {
  if (pageCount <= 1) return totalLabel ? <p className="text-[0.75rem] text-ink-500">{totalLabel}</p> : null
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (item) => item === 1 || item === pageCount || Math.abs(item - page) <= 1,
  )
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      {totalLabel ? <p className="text-[0.75rem] text-ink-500">{totalLabel}</p> : <span />}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        </button>
        {pages.map((item, index) => {
          const previous = pages[index - 1]
          return (
            <span key={item} className="flex items-center gap-1">
              {previous && item - previous > 1 ? <span className="px-1 text-[0.75rem] text-ink-400">…</span> : null}
              <button
                type="button"
                onClick={() => onChange(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-[0.75rem] font-medium tabular',
                  item === page
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-ink-200 text-ink-600 hover:bg-ink-50',
                )}
              >
                {item}
              </button>
            </span>
          )
        })}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40"
        >
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </nav>
  )
}

export function SampleNote({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-start gap-1.5 text-[0.6875rem] leading-5 text-ink-400', className)}>
      <Info className="mt-px h-3 w-3 shrink-0" aria-hidden />
      <span>{children ?? 'Demonstration data — sample records, not live club information.'}</span>
    </p>
  )
}

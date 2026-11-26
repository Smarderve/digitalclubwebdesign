import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/utils'

/* min-w-0 keeps Radix tab panels inside their grid/flex track on small screens. */
export function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn('min-w-0', className)} {...props} />
}

export function TabsList({ children, className, ariaLabel }: { children: ReactNode; className?: string; ariaLabel: string }) {
  return (
    <TabsPrimitive.List
      aria-label={ariaLabel}
      className={cn(
        'flex w-full min-w-0 gap-0 overflow-x-auto overflow-y-hidden border-b border-line scrollbar-thin sm:gap-1',
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className="relative shrink-0 whitespace-nowrap px-2.5 py-2.5 text-[0.75rem] font-medium text-ink-500 transition-colors hover:text-ink-900 sm:px-3 sm:text-[0.8125rem] data-[state=active]:text-brand-800 after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:after:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn('min-w-0 focus-visible:outline-none data-[state=inactive]:hidden', className)}
    >
      {children}
    </TabsPrimitive.Content>
  )
}

/** Segmented control used for view switches and compact filters. */
export function Segmented({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string; label: string; count?: number }[]
  value: string
  onChange: (value: string) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-sm border border-ink-200 bg-ink-50 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-2 text-[0.75rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 sm:py-1.5',
            value === option.value ? 'bg-surface text-ink-950 shadow-xs' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {option.label}
          {typeof option.count === 'number' ? (
            <span className="tabular text-[0.6875rem] text-ink-400">{option.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

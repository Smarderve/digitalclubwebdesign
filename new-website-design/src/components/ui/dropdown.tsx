import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '../../lib/utils'

export const Dropdown = DropdownPrimitive.Root
export const DropdownTrigger = DropdownPrimitive.Trigger

export function DropdownContent({
  children,
  side = 'bottom',
  align = 'end',
  className,
}: {
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        side={side}
        align={align}
        sideOffset={6}
        className={cn(
          'z-50 min-w-[190px] overflow-hidden rounded-md border border-line bg-white p-1 shadow-pop data-[state=open]:animate-fade-in',
          className,
        )}
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  )
}

export function DropdownItem({
  children,
  onSelect,
  to,
  icon,
  destructive,
  className,
}: {
  children: ReactNode
  onSelect?: () => void
  to?: string
  icon?: ReactNode
  destructive?: boolean
  className?: string
}) {
  const classes = cn(
    'flex cursor-pointer select-none items-center gap-2 rounded-[4px] px-2.5 py-2 text-[0.8125rem] outline-none transition-colors data-[highlighted]:bg-ink-50',
    destructive ? 'text-danger data-[highlighted]:bg-[#FEF3F2]' : 'text-ink-700 data-[highlighted]:text-ink-950',
    className,
  )
  if (to) {
    return (
      <DropdownPrimitive.Item asChild onSelect={onSelect}>
        <Link to={to} className={classes}>
          {icon ? <span className="text-ink-400">{icon}</span> : null}
          {children}
        </Link>
      </DropdownPrimitive.Item>
    )
  }
  return (
    <DropdownPrimitive.Item onSelect={onSelect} className={classes}>
      {icon ? <span className="text-ink-400">{icon}</span> : null}
      {children}
    </DropdownPrimitive.Item>
  )
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownPrimitive.Label className="px-2.5 pb-1 pt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
      {children}
    </DropdownPrimitive.Label>
  )
}

export function DropdownSeparator() {
  return <DropdownPrimitive.Separator className="my-1 h-px bg-line" />
}

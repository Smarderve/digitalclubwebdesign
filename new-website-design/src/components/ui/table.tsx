import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/**
 * Shared table language: a quiet header row, generous row rhythm, one hairline
 * per row and a restrained hover. Data decides the columns; this only sets the
 * typography, spacing and separator weight.
 */
export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('w-full min-w-0 overflow-x-auto scrollbar-thin', className)}>
      <table className="w-full min-w-[600px] border-collapse text-left text-[0.8125rem]">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-surface-2 text-[0.75rem] font-semibold tracking-[0.01em] text-ink-500">
      {children}
    </thead>
  )
}

export function TH({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn('whitespace-nowrap border-b border-line px-4 py-3 font-semibold first:pl-5 last:pr-5', className)}
      {...props}
    >
      {children}
    </th>
  )
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line/70">{children}</tbody>
}

export function TR({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-surface-2/70', className)} {...props}>
      {children}
    </tr>
  )
}

export function TD({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3.5 align-middle text-ink-700 first:pl-5 last:pr-5', className)} {...props}>
      {children}
    </td>
  )
}

/** Compact label/value list used in detail panels on all screens. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line/70">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-6 py-3">
          <dt className="text-[0.8125rem] text-ink-500">{item.label}</dt>
          <dd className="max-w-[62%] text-right text-[0.8125rem] font-medium text-ink-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

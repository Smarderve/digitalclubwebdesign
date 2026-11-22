import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('w-full min-w-0 overflow-x-auto scrollbar-thin', className)}>
      <table className="w-full min-w-[680px] border-collapse text-left text-[0.8125rem]">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-ink-50/70 text-[0.6875rem] uppercase tracking-[0.08em] text-ink-500">{children}</thead>
}

export function TH({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('whitespace-nowrap border-b border-line px-4 py-2.5 font-semibold', className)} {...props}>
      {children}
    </th>
  )
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>
}

export function TR({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-ink-50/60', className)} {...props}>
      {children}
    </tr>
  )
}

export function TD({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 align-middle text-ink-700', className)} {...props}>
      {children}
    </td>
  )
}

/** Compact label/value list used in detail panels on all screens. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-6 py-2.5">
          <dt className="text-[0.8125rem] text-ink-500">{item.label}</dt>
          <dd className="max-w-[62%] text-right text-[0.8125rem] font-medium text-ink-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

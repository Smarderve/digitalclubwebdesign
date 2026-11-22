import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Inbox, MoreHorizontal, Search } from 'lucide-react'
import { Badge, Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger, EmptyState, Pagination, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { Input } from '../../components/ui/field'
import { cn } from '../../lib/utils'

const PER_PAGE = 8

export function useAdminList<T>(rows: T[], matches: (row: T, query: string) => boolean, perPage = PER_PAGE) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return normalized ? rows.filter((row) => matches(row, normalized)) : rows
  }, [rows, matches, query])
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * perPage, current * perPage)
  return { query, setQuery, page: current, setPage, pageCount, filtered, visible, total: filtered.length }
}

export type AdminColumn<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  className?: string
  align?: 'left' | 'right'
  width?: string
}

export function AdminTable<T>({
  rows,
  columns,
  keyOf,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Records will appear here once they are added.',
  pagination,
}: {
  rows: T[]
  columns: AdminColumn<T>[]
  keyOf: (row: T) => string | number
  emptyTitle?: string
  emptyDescription?: string
  pagination?: { page: number; pageCount: number; onChange: (page: number) => void; totalLabel?: string }
}) {
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null)
  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((entry) => entry.id === sort.id)
    if (!column?.sortValue) return rows
    return rows.slice().sort((a, b) => {
      const left = column.sortValue!(a)
      const right = column.sortValue!(b)
      if (left === right) return 0
      const result = left > right ? 1 : -1
      return sort.dir === 'asc' ? result : -result
    })
  }, [rows, sort, columns])

  return (
    <div>
      <TableWrap>
        <THead>
          <TR>
            {columns.map((column) => (
              <TH key={column.id} style={column.width ? { width: column.width } : undefined} className={cn(column.align === 'right' && 'text-right', column.className)}>
                {column.sortValue ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSort((current) =>
                        current?.id === column.id
                          ? { id: column.id, dir: current.dir === 'asc' ? 'desc' : 'asc' }
                          : { id: column.id, dir: 'asc' },
                      )
                    }
                    className="inline-flex items-center gap-1 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                  >
                    {column.header}
                    {sort?.id === column.id ? (
                      sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />
                    ) : null}
                  </button>
                ) : (
                  column.header
                )}
              </TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {sorted.length ? (
            sorted.map((row) => (
              <TR key={keyOf(row)}>
                {columns.map((column) => (
                  <TD key={column.id} className={cn(column.align === 'right' && 'text-right', column.className)}>
                    {column.cell(row)}
                  </TD>
                ))}
              </TR>
            ))
          ) : (
            <TR>
              <TD colSpan={columns.length} className="p-0">
                <EmptyState compact icon={<Inbox className="h-4 w-4" aria-hidden />} title={emptyTitle} description={emptyDescription} />
              </TD>
            </TR>
          )}
        </TBody>
      </TableWrap>
      {pagination ? (
        <div className="border-t border-line px-4 py-3">
          <Pagination {...pagination} />
        </div>
      ) : null}
    </div>
  )
}

export function AdminToolbar({
  query,
  onQuery,
  placeholder = 'Search records…',
  children,
  count,
}: {
  query: string
  onQuery: (value: string) => void
  placeholder?: string
  children?: ReactNode
  count?: string
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-[200px] flex-1 sm:max-w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
        <Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-9 pl-8" />
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      {count ? <p className="text-[0.6875rem] text-ink-400 sm:ml-auto">{count}</p> : null}
    </div>
  )
}

export function RowActions({ children, label = 'Record actions' }: { children: ReactNode; label?: string }) {
  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={label}
        className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </DropdownTrigger>
      <DropdownContent>{children}</DropdownContent>
    </Dropdown>
  )
}

export { DropdownItem, DropdownSeparator }

export function DemoNotice({ children = 'This console uses demonstration records. Changes are applied in the browser only and are not saved to the club database.' }) {
  return (
    <p className="mt-3 flex items-start gap-1.5 text-[0.6875rem] leading-5 text-ink-400">
      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-300" aria-hidden />
      {children}
    </p>
  )
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[0.75rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700',
            value === option.value ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
          )}
        >
          {option.label}
          {typeof option.count === 'number' ? <span className={cn('tabular text-[0.6875rem]', value === option.value ? 'text-white/70' : 'text-ink-400')}>{option.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function downloadCsv(filename: string, rows: Record<string, string | number | boolean | null | undefined>[]) {
  if (!rows.length) return false
  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [headers.map(escape).join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}

export function SmallStat({ label, value, hint, tone = 'neutral' }: { label: string; value: ReactNode; hint?: string; tone?: 'neutral' | 'brand' | 'amber' | 'danger' }) {
  return (
    <div className="flex flex-col justify-between gap-2 bg-white p-4">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{label}</p>
      <div>
        <p
          className={cn(
            'text-[1.375rem] font-semibold tabular tracking-tight',
            tone === 'brand' && 'text-brand-800',
            tone === 'amber' && 'text-[#A15C07]',
            tone === 'danger' && 'text-danger',
            tone === 'neutral' && 'text-ink-950',
          )}
        >
          {value}
        </p>
        {hint ? <p className="mt-0.5 text-[0.6875rem] text-ink-400">{hint}</p> : null}
      </div>
    </div>
  )
}

export function StatStrip({ children }: { children: ReactNode }) {
  return <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

export function DataNoteBadge() {
  return <Badge tone="outline">Demo records</Badge>
}

import { useMemo } from 'react'
import { cn } from '../../lib/utils'
import type { ActivityEntry } from './types'

const DAY_MS = 86_400_000
const WEEKS = 24

function dateKey(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/**
 * A calendar matrix built only from recorded activity dates. No random
 * intensity, no invented streaks: a cell counts entries that actually exist.
 */
export function ActivityMatrix({ entries }: { entries: ActivityEntry[] }) {
  const { columns, total } = useMemo(() => {
    const counts = new Map<string, number>()
    let latest = new Date()
    latest.setHours(0, 0, 0, 0)
    for (const entry of entries) {
      const key = entry.date.slice(0, 10)
      counts.set(key, (counts.get(key) ?? 0) + 1)
      const parsed = new Date(`${key}T00:00:00`)
      if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > latest.getTime()) latest = parsed
    }

    const lastWeekStart = startOfWeek(latest)
    const firstWeekStart = new Date(lastWeekStart.getTime() - (WEEKS - 1) * 7 * DAY_MS)
    const result: { key: string; date: Date; count: number; level: number; future: boolean }[][] = []

    for (let week = 0; week < WEEKS; week += 1) {
      const column: { key: string; date: Date; count: number; level: number; future: boolean }[] = []
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(firstWeekStart.getTime() + (week * 7 + day) * DAY_MS)
        const key = dateKey(date)
        const count = counts.get(key) ?? 0
        const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4
        column.push({ key, date, count, level, future: date.getTime() > latest.getTime() })
      }
      result.push(column)
    }
    return { columns: result, total: entries.length }
  }, [entries])

  const levels = [
    'bg-ink-100',
    'bg-brand-200',
    'bg-brand-400',
    'bg-brand-600',
    'bg-brand-800',
  ]

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-start gap-2">
        <div className="hidden shrink-0 flex-col justify-between pb-0.5 pt-0 text-[0.5625rem] leading-none text-ink-400 sm:flex">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto pb-1 scrollbar-thin">
          <div className="flex w-max gap-[3px]">
            {columns.map((column, index) => (
              <div key={index} className="grid grid-rows-7 gap-[3px]">
                {column.map((cell) => (
                  <span
                    key={cell.key}
                    title={`${cell.count} ${cell.count === 1 ? 'activity' : 'activities'} on ${cell.key}`}
                    aria-label={`${cell.count} activities on ${cell.key}`}
                    className={cn(
                      'h-[11px] w-[11px] rounded-[2px]',
                      cell.future ? 'bg-transparent' : levels[cell.level],
                      cell.level > 0 && 'ring-1 ring-inset ring-white/20',
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.6875rem] text-ink-400">
        <span>
          {total} recorded {total === 1 ? 'activity' : 'activities'} · last {WEEKS} weeks
        </span>
        <span className="inline-flex items-center gap-1.5">
          Less
          {levels.map((className) => (
            <span key={className} aria-hidden className={cn('h-[9px] w-[9px] rounded-[2px]', className)} />
          ))}
          More
        </span>
      </div>
    </div>
  )
}

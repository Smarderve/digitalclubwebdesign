import { Info } from 'lucide-react'
import { Tooltip } from '../ui/tooltip'
import { DEMO_LABEL } from '../../data/demo'

export function DemoBadge() {
  return (
    <Tooltip label={DEMO_LABEL}>
      <span className="hidden items-center gap-1 rounded-full border border-dashed border-ink-300 px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-ink-500 sm:inline-flex">
        <Info className="h-2.5 w-2.5" aria-hidden />
        Demo data
      </span>
    </Tooltip>
  )
}

export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-dashed border-ink-200 bg-ink-50/60 px-3.5 py-2.5">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
      <p className="text-[0.75rem] leading-5 text-ink-500">
        {children ?? DEMO_LABEL} Prototype actions are not connected to the club database.
      </p>
    </div>
  )
}

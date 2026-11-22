import type { ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={250}>{children}</TooltipPrimitive.Provider>
}

export function Tooltip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className="z-50 rounded-[4px] bg-ink-950 px-2 py-1 text-[0.6875rem] font-medium text-white shadow-md data-[state=delayed-open]:animate-fade-in"
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-ink-950" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

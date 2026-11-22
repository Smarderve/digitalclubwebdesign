import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  children,
  title,
  description,
  size = 'md',
  footer,
}: {
  children: ReactNode
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}) {
  const width = {
    sm: 'max-w-[420px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[720px]',
    xl: 'max-w-[920px]',
  }[size]
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-950/45 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-line bg-white shadow-pop focus:outline-none',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <DialogPrimitive.Title className="text-h3 text-ink-950">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-[0.8125rem] leading-5 text-ink-500">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" aria-hidden />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line bg-ink-50/50 px-5 py-3.5">{footer}</div> : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** Right-side drawer for create/edit forms and mobile navigation. */
export function DrawerContent({
  children,
  title,
  description,
  footer,
  size = 'md',
}: {
  children: ReactNode
  title: string
  description?: string
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const width = { sm: 'sm:max-w-[380px]', md: 'sm:max-w-[520px]', lg: 'sm:max-w-[680px]' }[size]
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-950/40 data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-white shadow-pop focus:outline-none data-[state=open]:animate-slide-in',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <DialogPrimitive.Title className="text-h3 text-ink-950">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-[0.8125rem] leading-5 text-ink-500">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close
            className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" aria-hidden />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-ink-50/50 px-5 py-3.5">{footer}</div>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  destructive?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={title}
        description={description}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-sm border border-ink-200 px-3 text-[0.8125rem] font-medium text-ink-700 hover:bg-ink-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
              className={cn(
                'h-9 rounded-sm px-3 text-[0.8125rem] font-medium',
                destructive ? 'bg-danger hover:bg-danger-strong' : 'bg-brand-400 text-ink-950 hover:bg-brand-300',
              )}
            >
              {confirmLabel}
            </button>
          </>
        }
      >
        <p className="text-small leading-6 text-ink-600">
          This confirmation is part of the prototype. No production record is changed.
        </p>
      </DialogContent>
    </Dialog>
  )
}

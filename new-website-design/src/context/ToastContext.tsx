import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

type ToastTone = 'success' | 'info' | 'error'
type Toast = { id: number; title: string; description?: string; tone: ToastTone }

const ToastContext = createContext<{ push: (toast: Omit<Toast, 'id'>) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { ...toast, id }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 5200)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertCircle : Info
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-full max-w-[380px] items-start gap-2.5 rounded-md border border-line bg-white px-3.5 py-3 shadow-pop animate-fade-up"
            >
              <Icon
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0',
                  toast.tone === 'success' && 'text-brand-700',
                  toast.tone === 'info' && 'text-info',
                  toast.tone === 'error' && 'text-danger',
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-semibold text-ink-900">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-[0.75rem] leading-5 text-ink-500">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="text-ink-400 hover:text-ink-700"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

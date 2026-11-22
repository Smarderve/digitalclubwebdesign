import { Minus, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useKiutbot } from '../context'
import type { ConnectionState } from '../types'

const statusCopy: Record<ConnectionState, { label: string; dot: string; text: string }> = {
  idle: { label: 'Not connected', dot: 'bg-ink-300', text: 'text-ink-400' },
  connecting: { label: 'Connecting…', dot: 'bg-warning', text: 'text-warning' },
  connected: { label: 'Online', dot: 'bg-brand-500', text: 'text-brand-700' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-warning', text: 'text-warning' },
  offline: { label: 'Offline', dot: 'bg-danger', text: 'text-danger' },
}

/**
 * Compact header: identity, real connection status, minimise and close.
 * Status is derived from the socket; it never claims a connection that the
 * backend has not confirmed.
 */
export function KiutbotHeader() {
  const { connection, minimize, close } = useKiutbot()
  const status = statusCopy[connection]

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-line bg-white px-3.5 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint ring-1 ring-inset ring-brand-100">
        <img src="/brand/digital-club-logo.svg" alt="" className="h-5 w-5 object-contain" />
      </span>

      <div className="min-w-0 flex-1">
        <h2 id="kiutbot-title" className="truncate text-[0.875rem] font-semibold leading-tight tracking-tight text-ink-950">
          KIUTBOT
        </h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-[0.6875rem] leading-tight text-ink-500">
          <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', status.dot)} />
          <span className="truncate">KIUT Digital Club Assistant</span>
          <span aria-hidden className="text-ink-300">
            ·
          </span>
          <span className={cn('shrink-0', status.text)} role="status">
            {status.label}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={minimize}
          aria-label="Minimise KIUTBOT"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-brand-600 md:h-8 md:w-8"
        >
          <Minus size={17} aria-hidden />
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Close KIUTBOT"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-brand-600 md:h-8 md:w-8"
        >
          <X size={17} aria-hidden />
        </button>
      </div>
    </header>
  )
}

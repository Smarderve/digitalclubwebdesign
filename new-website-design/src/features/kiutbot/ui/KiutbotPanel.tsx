import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useKiutbot } from '../context'
import { KiutbotComposer } from './KiutbotComposer'
import { KiutbotConversation } from './KiutbotConversation'
import { KiutbotHeader } from './KiutbotHeader'
import { KiutbotOnboarding } from './KiutbotOnboarding'

/** Tracks the phone breakpoint plus the visual viewport (keyboard) height. */
function usePhoneViewport() {
  const [state, setState] = useState({ phone: false, height: 0, top: 0 })

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const viewport = window.visualViewport

    const update = () => {
      setState({
        phone: query.matches,
        height: viewport ? Math.round(viewport.height) : window.innerHeight,
        top: viewport ? Math.round(viewport.offsetTop) : 0,
      })
    }

    update()
    query.addEventListener('change', update)
    window.addEventListener('resize', update)
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)

    return () => {
      query.removeEventListener('change', update)
      window.removeEventListener('resize', update)
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
    }
  }, [])

  return state
}

export function KiutbotPanel({ launcherRef }: { launcherRef: RefObject<HTMLButtonElement> }) {
  const { view, phase, connection, close, minimize, expand } = useKiutbot()
  const [step, setStep] = useState<'name' | 'contact'>('name')
  const { phone, height, top } = usePhoneViewport()
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)
  /* Keeps the panel mounted for one exit animation after it closes. */
  const [rendered, setRendered] = useState(view !== 'closed')

  useEffect(() => {
    if (view !== 'closed') {
      setRendered(true)
      return
    }
    const timer = window.setTimeout(() => setRendered(false), 190)
    return () => window.clearTimeout(timer)
  }, [view])

  /* Lock the page behind the full-screen phone panel only. */
  useEffect(() => {
    if (!phone || view !== 'open') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phone, view])

  /* Escape closes; focus goes back to the launcher only when fully closed. */
  useEffect(() => {
    if (view !== 'open') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [view, close])

  /* Clicking outside the panel collapses it and keeps the conversation. The
     launcher is excluded so its own click toggles instead of double-firing. */
  useEffect(() => {
    if (view !== 'open' || phone) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      if (launcherRef.current?.contains(target)) return
      minimize()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [view, phone, launcherRef, minimize])

  useEffect(() => {
    if (view === 'open') {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current || view !== 'closed') return
    wasOpenRef.current = false
    const timer = window.setTimeout(() => launcherRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [view, launcherRef])

  /* Move focus into the panel when it opens. Phones keep the keyboard closed. */
  useEffect(() => {
    if (view !== 'open') return
    if (phone) {
      panelRef.current?.focus()
      return
    }
    const target = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')
    target?.focus()
  }, [view, phone, phase, step])

  if (!rendered) return null

  if (view === 'minimized') {
    return (
      <div
        className="kb-panel-in fixed z-[60] flex w-[300px] max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-xl border border-line bg-surface py-2 pl-2 pr-1.5 shadow-pop"
        style={{
          right: 'max(1.25rem, env(safe-area-inset-right))',
          bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
        }}
        role="dialog"
        aria-label="KIUTBOT, minimised"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint ring-1 ring-inset ring-brand-100">
          <img src="/brand/digital-club-logo.svg" alt="" className="h-4 w-4 object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.8125rem] font-semibold leading-tight text-ink-950">KIUTBOT</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[0.625rem] leading-tight text-ink-500">
            <span
              aria-hidden
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                connection === 'connected' ? 'bg-brand-500' : connection === 'offline' ? 'bg-danger' : 'bg-warning',
              )}
            />
            {connection === 'connected' ? 'Online' : connection === 'offline' ? 'Offline' : 'Connecting…'}
          </p>
        </div>
        <button
          type="button"
          onClick={expand}
          aria-label="Expand KIUTBOT"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <ArrowUpRight size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Close KIUTBOT"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div
      id="kiutbot-panel"
      ref={panelRef}
      role="dialog"
      aria-modal={phone || undefined}
      aria-labelledby="kiutbot-title"
      tabIndex={-1}
      aria-hidden={view === 'closed' || undefined}
      className={cn(
        'fixed z-[60] flex flex-col overflow-hidden bg-surface outline-none',
        view === 'closed' ? 'kb-panel-out' : 'kb-panel-in',
        phone
          ? 'bottom-auto left-0 right-0 rounded-none border-0 shadow-none'
          : 'bottom-[5.75rem] right-5 w-[400px] rounded-[18px] border border-line shadow-pop',
        !phone && 'h-[min(660px,calc(100dvh-8rem))]',
      )}
      style={
        phone
          ? {
              top: top || 0,
              height: height || undefined,
              paddingTop: 'env(safe-area-inset-top)',
            }
          : undefined
      }
    >
      <KiutbotHeader />

      <div className="flex min-h-0 flex-1 flex-col bg-canvas">
        <KiutbotConversation onboardingStep={step} />
      </div>

      {phase === 'ready' ? (
        <div style={phone ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}>
          <KiutbotComposer />
        </div>
      ) : (
        <KiutbotOnboarding step={step} onStep={setStep} />
      )}
    </div>
  )
}

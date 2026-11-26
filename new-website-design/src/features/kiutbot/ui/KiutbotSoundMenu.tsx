import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Switch } from '../../../components/ui/field'
import { cn } from '../../../lib/utils'
import { useKiutbot } from '../context'

/**
 * The sound controls live in the header as one small icon, because they are a
 * preference rather than a primary action. Opening it reveals two switches; the
 * choice is stored by the provider and survives a refresh.
 */
export function KiutbotSoundMenu() {
  const { sound, setSound } = useKiutbot()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const anyEnabled = sound.outgoing || sound.incoming

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      /* The panel also closes on Escape; this menu is the innermost layer, so it
         consumes the key instead of dismissing the whole chat. */
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLElement>('[role="switch"]')?.focus()
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={anyEnabled ? 'Chat sounds are on, change' : 'Chat sounds are off, change'}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Chat sounds"
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-brand-600 md:h-8 md:w-8',
          anyEnabled ? 'text-ink-500' : 'text-ink-400',
          open && 'bg-ink-50 text-ink-900',
        )}
      >
        {anyEnabled ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Chat sounds"
          className="absolute right-0 top-[calc(100%+0.375rem)] z-20 w-[15rem] rounded-lg border border-line bg-surface p-3 shadow-pop"
        >
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
            Chat sounds
          </p>
          <div className="mt-2.5 space-y-3">
            <Switch
              id="kiutbot-sound-outgoing"
              checked={sound.outgoing}
              onCheckedChange={(checked) => setSound('outgoing', checked)}
              label="Sent"
              description="When your message is delivered"
            />
            <Switch
              id="kiutbot-sound-incoming"
              checked={sound.incoming}
              onCheckedChange={(checked) => setSound('incoming', checked)}
              label="Received"
              description="When an answer arrives"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

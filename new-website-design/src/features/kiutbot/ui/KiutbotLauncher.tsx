import { forwardRef } from 'react'
import { Icon } from '@iconify/react'
import { KIUTBOT_LAUNCHER_ICON } from '../../../icons/line-md'
import { useKiutbot } from '../context'
import { cn } from '../../../lib/utils'

/**
 * Persistent floating launcher.
 *
 * Uses the mandated `line-md:chat-bubble` Iconify glyph (bundled collection, so
 * it never depends on a network icon request). The unread badge only appears
 * when a real message arrived while the panel was closed.
 */
export const KiutbotLauncher = forwardRef<HTMLButtonElement>(function KiutbotLauncher(_props, ref) {
  const { view, toggle, unread } = useKiutbot()

  if (view === 'minimized') return null

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      className={cn(
        'kb-launcher fixed z-[60]',
        /* On phones the panel is full screen, so the launcher would sit on the
           composer; there the panel header owns the close control. */
        view === 'open' && 'hidden md:inline-flex',
      )}
      style={{
        right: 'max(1.25rem, env(safe-area-inset-right))',
        bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
      }}
      aria-label={unread > 0 ? `Open KIUTBOT chat, ${unread} new ${unread === 1 ? 'message' : 'messages'}` : 'Open KIUTBOT chat'}
      aria-haspopup="dialog"
      aria-expanded={view === 'open'}
      aria-controls="kiutbot-panel"
    >
      <Icon icon={KIUTBOT_LAUNCHER_ICON} className="kb-launcher-icon" aria-hidden />
      {unread > 0 ? <span aria-hidden className="kb-unread" /> : null}
    </button>
  )
})

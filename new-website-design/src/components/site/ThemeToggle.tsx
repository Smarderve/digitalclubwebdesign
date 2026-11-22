import { Icon } from '@iconify/react'
import { usePublicTheme } from '../../features/settings/preferences'
import { MOON_ICON, SUN_ICON } from '../../icons/phosphor-theme'
import { cn } from '../../lib/utils'

/**
 * Day/night switch for the site navbar.
 *
 * It drives the same theme preference the application uses: light is the
 * `fresh` palette, dark is the `midnight` palette. The selection is saved, so
 * it survives refreshes, and a first visit follows the operating system.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggle } = usePublicTheme()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        className,
      )}
    >
      <Icon icon={isDark ? MOON_ICON : SUN_ICON} className="h-[1.05rem] w-[1.05rem]" aria-hidden />
    </button>
  )
}

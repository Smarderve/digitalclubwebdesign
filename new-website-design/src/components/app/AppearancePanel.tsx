import { Check, RefreshCw } from 'lucide-react'
import { Button, Card, CardBody, CardHeader } from '../ui'
import {
  ACCENTS,
  THEMES,
  accentHex,
  usePreferences,
  type ThemePreview as ThemePreviewTokens,
} from '../../features/settings/preferences'
import { cn } from '../../lib/utils'

/**
 * A miniature of the real interface: page, floating rail, topbar, content
 * surface, typography and a control. Painted from the theme's own tokens so all
 * eight previews are visibly different.
 */
function ThemePreview({ tokens }: { tokens: ThemePreviewTokens }) {
  const navStyle = {
    backgroundColor: tokens.nav,
    border: `1px solid ${tokens.border}`,
  }
  return (
    <span
      className="flex h-[104px] w-full gap-1.5 overflow-hidden rounded-lg p-2"
      style={{ backgroundColor: tokens.page, border: `1px solid ${tokens.border}` }}
      aria-hidden
    >
      <span className="flex w-[32px] shrink-0 flex-col gap-1 rounded-[5px] p-1" style={navStyle}>
        <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: tokens.accent }} />
        <span className="mt-1 h-[7px] w-full rounded-[2px]" style={{ backgroundColor: tokens.accent, opacity: 0.9 }} />
        <span className="h-[7px] w-full rounded-[2px]" style={{ backgroundColor: tokens.text, opacity: 0.2 }} />
        <span className="h-[7px] w-full rounded-[2px]" style={{ backgroundColor: tokens.text, opacity: 0.2 }} />
        <span className="mt-auto h-[7px] w-full rounded-[2px]" style={{ backgroundColor: tokens.text, opacity: 0.2 }} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex h-6 items-center gap-1.5 rounded-[5px] px-1.5" style={navStyle}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tokens.accent }} />
          <span className="h-1 w-8 rounded-full" style={{ backgroundColor: tokens.text, opacity: 0.55 }} />
          <span className="ml-auto h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tokens.accent, opacity: 0.9 }} />
        </span>
        <span
          className="flex min-h-0 flex-1 flex-col gap-1 rounded-[5px] p-1.5"
          style={{ backgroundColor: tokens.surface, border: `1px solid ${tokens.border}` }}
        >
          <span className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: tokens.text, opacity: 0.8 }} />
          <span className="h-1 w-full rounded-full" style={{ backgroundColor: tokens.muted, opacity: 0.5 }} />
          <span className="h-1 w-5/6 rounded-full" style={{ backgroundColor: tokens.muted, opacity: 0.35 }} />
          <span className="mt-auto flex items-center gap-1">
            <span className="h-3 w-9 rounded-[2px]" style={{ backgroundColor: tokens.accent }} />
            <span className="h-3 w-6 rounded-[2px]" style={{ backgroundColor: tokens.text, opacity: 0.1 }} />
          </span>
        </span>
      </span>
    </span>
  )
}

/**
 * Theme and accent selection, shared by the member and admin dashboards so the
 * same controls appear in both areas.
 */
export function AppearancePanel() {
  const { preferences, setTheme, setAccent, update } = usePreferences()
  const selectedAccent = ACCENTS.find((entry) => entry.id === preferences.accent) ?? ACCENTS[0]
  const selectedHex = accentHex(preferences.accent, preferences.customAccent)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Theme"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => update({ theme: 'fresh', accent: 'default' })}
              iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Reset
            </Button>
          }
        />
        <CardBody className="space-y-6">
          {(['light', 'dark'] as const).map((group) => (
            <div key={group}>
              <div className="mb-2.5 flex items-center gap-2">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-500">
                  {group === 'light' ? 'Light' : 'Dark'}
                </p>
                <span aria-hidden className="h-px flex-1 bg-line" />
              </div>
              <div role="radiogroup" aria-label={`${group} themes`} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {THEMES.filter((theme) => theme.dark === (group === 'dark')).map((theme) => {
                  const active = preferences.theme === theme.id
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setTheme(theme.id)}
                      className={cn(
                        'group rounded-xl border p-2.5 text-left transition-[border-color,box-shadow,transform] duration-200 press',
                        active
                          ? 'border-accent shadow-[0_0_0_1px_rgb(var(--accent))]'
                          : 'border-line hover:border-ink-300 hover:shadow-xs',
                      )}
                    >
                      <ThemePreview tokens={theme.preview} />
                      <span className="mt-2.5 flex items-center justify-between gap-1.5">
                        <span className="min-w-0 truncate text-[0.8125rem] font-semibold text-ink-900">{theme.label}</span>
                        {active ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-fg">
                            <Check className="h-3 w-3" aria-hidden />
                          </span>
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Accent colour"
          action={
            <span className="flex items-center gap-2 text-[0.75rem] font-medium text-ink-600">
              <span
                aria-hidden
                className="h-4 w-4 rounded-full ring-1 ring-inset ring-ink-950/15"
                style={{ backgroundColor: selectedHex ?? 'rgb(var(--accent))' }}
              />
              <span className="font-mono uppercase">{selectedHex ?? selectedAccent.label}</span>
            </span>
          }
        />
        <CardBody className="space-y-5">
          <div role="radiogroup" aria-label="Accent colour" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {ACCENTS.map((accent) => {
              const active = preferences.accent === accent.id
              return (
                <button
                  key={accent.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={accent.label}
                  title={accent.label}
                  onClick={() => setAccent(accent.id, accent.hex ?? undefined)}
                  className={cn(
                    'group flex flex-col items-center gap-1.5 rounded-lg border px-1 py-2 transition-colors press',
                    active ? 'border-accent bg-accent/10' : 'border-line hover:border-ink-300 hover:bg-nav-hover',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full shadow-inner ring-1 ring-inset ring-ink-950/10',
                      !accent.hex &&
                        accent.id === 'default' &&
                        'bg-[conic-gradient(at_50%_50%,#3AB658,#2378C4,#6C55C8,#B07818,#3AB658)]',
                    )}
                    style={
                      accent.hex
                        ? { backgroundColor: accent.hex }
                        : accent.id === 'custom'
                          ? { backgroundColor: preferences.customAccent }
                          : undefined
                    }
                  >
                    {active ? (
                      <Check
                        className={cn(
                          'h-4 w-4 drop-shadow',
                          accent.hex && accent.id !== 'custom' ? 'text-white' : 'text-ink-950',
                        )}
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <span className="w-full truncate text-center text-[0.625rem] font-medium text-ink-600">
                    {accent.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface-2/60 p-3">
            <label
              className="relative flex h-11 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-line bg-surface p-1 transition-colors hover:border-ink-300"
              title="Pick a custom accent colour"
            >
              <input
                type="color"
                value={preferences.customAccent}
                onChange={(event) => setAccent('custom', event.target.value)}
                aria-label="Pick a custom accent colour"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span
                aria-hidden
                className="h-full w-full rounded-[5px] ring-1 ring-inset ring-ink-950/10"
                style={{ backgroundColor: preferences.customAccent }}
              />
            </label>
            <div className="min-w-0 flex-1">
              <p className="text-[0.8125rem] font-medium text-ink-900">Custom colour</p>
              <p className="font-mono text-[0.7rem] uppercase tracking-wide text-ink-500">
                {preferences.customAccent}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAccent('custom', preferences.customAccent)}>
              Use colour
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

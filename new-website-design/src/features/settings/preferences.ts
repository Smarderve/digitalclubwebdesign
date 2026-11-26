import { useCallback, useEffect, useState } from 'react'

/**
 * Application preferences. There is no account preference API yet, so the
 * selection is persisted in localStorage under a single key and applied to the
 * document root as design-token attributes.
 */
export type ThemeId = 'clean' | 'fresh' | 'sand' | 'ocean' | 'midnight' | 'forest' | 'ocean-dark' | 'slate'

export type AccentId =
  | 'default'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'magenta'
  | 'crimson'
  | 'orange'
  | 'amber'
  | 'custom'

export type Preferences = {
  theme: ThemeId
  accent: AccentId
  /** Hex value used when `accent` is `custom`. */
  customAccent: string
  textScale: 'compact' | 'default' | 'large'
  motion: 'system' | 'reduced'
  contrast: 'normal' | 'high'
}

/**
 * The colour set each theme preview paints with. These mirror the CSS tokens for
 * the theme, so a preview is a miniature of the real interface, not a shared
 * illustration with a different accent line.
 */
export type ThemePreview = {
  page: string
  surface: string
  nav: string
  border: string
  text: string
  muted: string
  accent: string
  accentFg: string
}

export const THEMES: {
  id: ThemeId
  label: string
  dark: boolean
  preview: ThemePreview
}[] = [
  {
    id: 'clean',
    label: 'Clean White',
    dark: false,
    preview: {
      page: '#F3F4F6',
      surface: '#FFFFFF',
      nav: '#FFFFFF',
      border: '#DDE0E4',
      text: '#121418',
      muted: '#7A7F87',
      accent: '#3AB658',
      accentFg: '#092012',
    },
  },
  {
    id: 'fresh',
    label: 'Fresh Green',
    dark: false,
    preview: {
      page: '#E4F3EA',
      surface: '#F6FDF9',
      nav: '#EEFBF4',
      border: '#C7E3D3',
      text: '#0F2017',
      muted: '#69877A',
      accent: '#3AB658',
      accentFg: '#092012',
    },
  },
  {
    id: 'sand',
    label: 'Warm Sand',
    dark: false,
    preview: {
      page: '#EFE5D4',
      surface: '#FAF4E8',
      nav: '#F8F1E4',
      border: '#DDCDB5',
      text: '#271F17',
      muted: '#9E8C74',
      accent: '#B06233',
      accentFg: '#FDF8EE',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean Light',
    dark: false,
    preview: {
      page: '#E2EDF6',
      surface: '#F4FAFF',
      nav: '#F0F8FE',
      border: '#C7DBEA',
      text: '#0C1B28',
      muted: '#69849A',
      accent: '#186CAA',
      accentFg: '#FFFFFF',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight Black',
    dark: true,
    preview: {
      page: '#050607',
      surface: '#0B0C0E',
      nav: '#101215',
      border: '#212429',
      text: '#F3F6F9',
      muted: '#949DA8',
      accent: '#3AB658',
      accentFg: '#06140C',
    },
  },
  {
    id: 'forest',
    label: 'Forest Dark',
    dark: true,
    preview: {
      page: '#04120B',
      surface: '#081D12',
      nav: '#0C2417',
      border: '#193C28',
      text: '#EEF8F2',
      muted: '#8AA393',
      accent: '#3AB658',
      accentFg: '#05190D',
    },
  },
  {
    id: 'ocean-dark',
    label: 'Ocean Dark',
    dark: true,
    preview: {
      page: '#030B14',
      surface: '#071421',
      nav: '#0B1D2E',
      border: '#1A3045',
      text: '#EEF6FC',
      muted: '#889EB4',
      accent: '#4AACDB',
      accentFg: '#030B14',
    },
  },
  {
    id: 'slate',
    label: 'Graphite Dark',
    dark: true,
    preview: {
      page: '#121315',
      surface: '#1B1D20',
      nav: '#202226',
      border: '#393D43',
      text: '#F5F6F8',
      muted: '#9EA4AB',
      accent: '#D88A4A',
      accentFg: '#121315',
    },
  },
]

export const ACCENTS: { id: AccentId; label: string; hex: string | null }[] = [
  { id: 'default', label: 'Theme default', hex: null },
  { id: 'green', label: 'Green', hex: '#3AB658' },
  { id: 'emerald', label: 'Emerald', hex: '#0E7C5A' },
  { id: 'teal', label: 'Teal', hex: '#17897F' },
  { id: 'sky', label: 'Sky', hex: '#1F8FB8' },
  { id: 'blue', label: 'Blue', hex: '#2378C4' },
  { id: 'indigo', label: 'Indigo', hex: '#4B5BC8' },
  { id: 'violet', label: 'Violet', hex: '#6C55C8' },
  { id: 'magenta', label: 'Magenta', hex: '#A93C93' },
  { id: 'crimson', label: 'Crimson', hex: '#B23B3B' },
  { id: 'orange', label: 'Orange', hex: '#C2622B' },
  { id: 'amber', label: 'Amber', hex: '#B07818' },
  { id: 'custom', label: 'Custom', hex: null },
]

export const DEFAULT_CUSTOM_ACCENT = '#3E7BFA'

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'fresh',
  accent: 'default',
  customAccent: DEFAULT_CUSTOM_ACCENT,
  textScale: 'default',
  motion: 'system',
  contrast: 'normal',
}

const STORAGE_KEY = 'kiut-preferences-v1'
const CHANGE_EVENT = 'kiut-preferences-change'
const TEXT_SCALE: Record<Preferences['textScale'], string> = {
  compact: '93.75%',
  default: '100%',
  large: '112.5%',
}

/** Themes that existed before the eight-theme palette was introduced. */
const LEGACY_THEMES: Record<string, ThemeId> = {
  light: 'clean',
  yellow: 'sand',
  glass: 'clean',
  'dark-green': 'forest',
}

const HEX = /^#[0-9a-f]{6}$/i

export function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<Preferences> & { theme?: string }
    const requested = parsed.theme ? LEGACY_THEMES[parsed.theme] ?? parsed.theme : undefined
    return {
      theme: THEMES.some((theme) => theme.id === requested) ? (requested as ThemeId) : DEFAULT_PREFERENCES.theme,
      accent: ACCENTS.some((accent) => accent.id === parsed.accent) ? (parsed.accent as AccentId) : 'default',
      customAccent:
        typeof parsed.customAccent === 'string' && HEX.test(parsed.customAccent)
          ? parsed.customAccent
          : DEFAULT_CUSTOM_ACCENT,
      textScale: parsed.textScale === 'compact' || parsed.textScale === 'large' ? parsed.textScale : 'default',
      motion: parsed.motion === 'reduced' ? 'reduced' : 'system',
      contrast: parsed.contrast === 'high' ? 'high' : 'normal',
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

/* --- Accent colour ---------------------------------------------------------
   A user-selected accent is expanded into the same 50–950 ramp the components
   already use. Dark themes invert the ramp (50 darkest, 950 lightest), so the
   generated stops are reversed there — buttons, links, progress bars, switches,
   focus rings and active navigation then follow the chosen accent everywhere. */

const hexChannels = (hex: string) => {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ] as [number, number, number]
}

const mix = (from: [number, number, number], to: [number, number, number], amount: number) =>
  from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount)) as [number, number, number]

const WHITE: [number, number, number] = [255, 255, 255]
const BLACK: [number, number, number] = [0, 0, 0]
const LIGHT_WHITE = [0.92, 0.83, 0.66, 0.46, 0.24, 0.08]
const LIGHT_BLACK = [0.14, 0.27, 0.4, 0.58]
const DARK_BLACK = [0.72, 0.62, 0.5, 0.36, 0.22, 0.1]
const DARK_WHITE = [0.16, 0.32, 0.5, 0.66]
const RAMP = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

/** Resolve the accent to a hex value: the custom picker or a predefined swatch. */
export function accentHex(accent: AccentId, customAccent: string): string | null {
  if (accent === 'custom') return HEX.test(customAccent) ? customAccent : null
  return ACCENTS.find((item) => item.id === accent)?.hex ?? null
}

function accentTokens(hex: string | null, dark: boolean) {
  if (!hex) return null
  const base = hexChannels(hex)
  const ramp = RAMP.map((stop, index) => {
    let value: [number, number, number]
    if (index === 6) value = base
    else if (index < 6) value = dark ? mix(base, BLACK, DARK_BLACK[index]) : mix(base, WHITE, LIGHT_WHITE[index])
    else value = dark ? mix(base, WHITE, DARK_WHITE[index - 7]) : mix(base, BLACK, LIGHT_BLACK[index - 7])
    return [stop, value] as const
  })
  const byStop = Object.fromEntries(ramp)
  const luminance = (0.299 * base[0] + 0.587 * base[1] + 0.114 * base[2]) / 255
  /* Dark text from 0.5 up: the brand green (#3AB658, 0.526) needs dark labels,
     while deep terracotta and blue accents keep white labels. */
  const foreground = luminance > 0.5 ? [10, 14, 18] : [255, 255, 255]
  const asChannels = (value: [number, number, number]) => `${value[0]} ${value[1]} ${value[2]}`
  const tokens: Record<string, string> = {
    '--accent': asChannels(byStop[600]),
    '--accent-hover': asChannels(byStop[700]),
    '--accent-fg': asChannels(foreground as [number, number, number]),
    '--ring': asChannels(byStop[600]),
    '--nav-hover': asChannels(byStop[50]),
    '--nav-active': asChannels(byStop[100]),
    '--nav-active-text': asChannels(byStop[dark ? 900 : 800]),
    '--btn-primary': asChannels(byStop[600]),
    '--btn-primary-hover': asChannels(byStop[700]),
    '--btn-primary-fg': asChannels(foreground as [number, number, number]),
    '--focus-ring': `0 0 0 3px rgb(${asChannels(byStop[600])} / 0.24)`,
  }
  for (const [stop, value] of ramp) tokens[`--brand-${stop}`] = asChannels(value)
  return tokens
}

function applyAccent(accent: AccentId, customAccent: string, dark: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const stop of RAMP) root.style.removeProperty(`--brand-${stop}`)
  for (const name of [
    '--accent',
    '--accent-hover',
    '--accent-fg',
    '--ring',
    '--nav-hover',
    '--nav-active',
    '--nav-active-text',
    '--btn-primary',
    '--btn-primary-hover',
    '--btn-primary-fg',
    '--focus-ring',
  ]) {
    root.style.removeProperty(name)
  }
  const tokens = accentTokens(accentHex(accent, customAccent), dark)
  if (!tokens) return
  for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value)
}

export function applyPreferences(preferences: Preferences) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const theme = THEMES.find((entry) => entry.id === preferences.theme) ?? THEMES[0]
  root.dataset.theme = theme.id
  root.dataset.contrast = preferences.contrast
  root.dataset.motion = preferences.motion
  root.style.fontSize = TEXT_SCALE[preferences.textScale]
  root.style.colorScheme = theme.dark ? 'dark' : 'light'
  applyAccent(preferences.accent, preferences.customAccent, theme.dark)
}

export function savePreferences(next: Preferences) {
  applyPreferences(next)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* storage can be unavailable; the live theme still applies */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }))
}

export function resetPreferences() {
  savePreferences(DEFAULT_PREFERENCES)
}

export type ColorMode = 'light' | 'dark'

/**
 * The public site resolves the saved theme to a light or dark colour mode. With
 * no saved preference it opens in its light identity.
 */
export function readColorMode(): ColorMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Preferences> & { theme?: string }
      const id = parsed.theme ? LEGACY_THEMES[parsed.theme] ?? parsed.theme : undefined
      const theme = THEMES.find((entry) => entry.id === id)
      if (theme) return theme.dark ? 'dark' : 'light'
    }
  } catch {
    /* fall through to the light default */
  }

  return 'light'
}

/** Public surfaces use the fresh palette by day and midnight by night. */
export function applyColorMode(mode: ColorMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = mode === 'dark' ? 'midnight' : 'fresh'
  root.style.colorScheme = mode
  const preferences = readPreferences()
  applyAccent(preferences.accent, preferences.customAccent, mode === 'dark')
}

/**
 * Day/night mode for the public site, shared by the navbar toggle and the
 * public layouts. The selection is written through the existing preference
 * store, so dashboards and the footer follow the same theme.
 */
export function usePublicTheme() {
  const [mode, setMode] = useState<ColorMode>(readColorMode)

  useEffect(() => {
    applyColorMode(mode)
  }, [mode])

  useEffect(() => {
    const sync = () => setMode(readColorMode())
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setColorMode = useCallback((next: ColorMode) => {
    savePreferences({ ...readPreferences(), theme: next === 'dark' ? 'midnight' : 'fresh' })
    setMode(next)
  }, [])

  const toggle = useCallback(() => {
    setColorMode(readColorMode() === 'dark' ? 'light' : 'dark')
  }, [setColorMode])

  return { mode, setColorMode, toggle }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => readPreferences())

  useEffect(() => {
    applyPreferences(preferences)
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<Preferences>).detail
      setPreferences(detail ?? readPreferences())
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setPreferences(readPreferences())
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [preferences])

  return {
    preferences,
    setTheme: (theme: ThemeId) => savePreferences({ ...preferences, theme }),
    setAccent: (accent: AccentId, customAccent?: string) =>
      savePreferences({
        ...preferences,
        accent,
        customAccent: customAccent ?? preferences.customAccent,
      }),
    update: (patch: Partial<Preferences>) => savePreferences({ ...preferences, ...patch }),
    reset: resetPreferences,
  }
}

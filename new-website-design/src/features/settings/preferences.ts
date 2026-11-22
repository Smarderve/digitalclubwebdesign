import { useCallback, useEffect, useState } from 'react'

/**
 * Application preferences. There is no server-side account preference API in
 * this prototype, so the selection is persisted in localStorage under a single
 * key and applied to the document root as design-token attributes.
 */
export type ThemeId = 'fresh' | 'dark-green' | 'light' | 'midnight' | 'yellow' | 'glass' | 'ocean'

export type Preferences = {
  theme: ThemeId
  textScale: 'compact' | 'default' | 'large'
  motion: 'system' | 'reduced'
  contrast: 'normal' | 'high'
}

/**
 * The colour set each theme preview actually paints with. These mirror the CSS
 * tokens for the theme, so a preview is a miniature of the real interface, not
 * a shared illustration with a different accent line.
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
  glass?: boolean
}

export const THEMES: {
  id: ThemeId
  label: string
  description: string
  dark: boolean
  preview: ThemePreview
}[] = [
  {
    id: 'fresh',
    label: 'Fresh Green',
    description: 'The default KIUT palette: fresh green accent on clean light surfaces.',
    dark: false,
    preview: {
      page: '#EEF6F1',
      surface: '#FFFFFF',
      nav: '#FFFFFF',
      border: '#E1EAE4',
      text: '#121A16',
      muted: '#6B7A72',
      accent: '#258F55',
      accentFg: '#FFFFFF',
    },
  },
  {
    id: 'dark-green',
    label: 'Dark Green',
    description: 'Deep neutral-green surfaces with the club green carrying every action.',
    dark: true,
    preview: {
      page: '#08140E',
      surface: '#0D1C15',
      nav: '#13291D',
      border: '#1F382B',
      text: '#F2F7F4',
      muted: '#99AC9F',
      accent: '#52B47A',
      accentFg: '#08140E',
    },
  },
  {
    id: 'light',
    label: 'Clean Light',
    description: 'Neutral grey surfaces and restrained borders with the green accent.',
    dark: false,
    preview: {
      page: '#FFFFFF',
      surface: '#FFFFFF',
      nav: '#FFFFFF',
      border: '#DEDFE3',
      text: '#17171A',
      muted: '#80858D',
      accent: '#258F55',
      accentFg: '#FFFFFF',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight Dark',
    description: 'Charcoal surfaces, muted text and a controlled green accent.',
    dark: true,
    preview: {
      page: '#0A0C0F',
      surface: '#111419',
      nav: '#1A1F26',
      border: '#262B33',
      text: '#F4F7FA',
      muted: '#97A1AE',
      accent: '#60BC94',
      accentFg: '#0A0C0F',
    },
  },
  {
    id: 'yellow',
    label: 'Yellow',
    description: 'Warm paper surfaces with a balanced amber accent, not a yellow wash.',
    dark: false,
    preview: {
      page: '#FAF7EE',
      surface: '#FFFDF9',
      nav: '#FFFDF9',
      border: '#EAE2D0',
      text: '#211E18',
      muted: '#7C7362',
      accent: '#A87C1E',
      accentFg: '#FFFDF9',
    },
  },
  {
    id: 'glass',
    label: 'Glass',
    description: 'Soft mint depth with translucent floating navigation and crisp content.',
    dark: false,
    preview: {
      page: '#E8F1EC',
      surface: '#FCFEFD',
      nav: '#FCFEFD',
      border: '#D2E2D9',
      text: '#111C16',
      muted: '#697A71',
      accent: '#258F55',
      accentFg: '#FFFFFF',
      glass: true,
    },
  },
  {
    id: 'ocean',
    label: 'Ocean Blue',
    description: 'Cool blue accent over calm, light neutral surfaces.',
    dark: false,
    preview: {
      page: '#F1F7FC',
      surface: '#FFFFFF',
      nav: '#FFFFFF',
      border: '#DBE8F2',
      text: '#0F1B24',
      muted: '#657785',
      accent: '#1870B2',
      accentFg: '#FFFFFF',
    },
  },
]

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'fresh',
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

export function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<Preferences>
    return {
      theme: THEMES.some((theme) => theme.id === parsed.theme) ? (parsed.theme as ThemeId) : DEFAULT_PREFERENCES.theme,
      textScale: parsed.textScale === 'compact' || parsed.textScale === 'large' ? parsed.textScale : 'default',
      motion: parsed.motion === 'reduced' ? 'reduced' : 'system',
      contrast: parsed.contrast === 'high' ? 'high' : 'normal',
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
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
 * The public site resolves the saved theme to a light or dark colour mode. A
 * first visit with no saved preference follows the operating system.
 */
export function readColorMode(): ColorMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Preferences>
      const theme = THEMES.find((entry) => entry.id === parsed.theme)
      if (theme) return theme.dark ? 'dark' : 'light'
    }
  } catch {
    /* fall through to the system preference */
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

/** Public surfaces use the fresh palette by day and midnight by night. */
export function applyColorMode(mode: ColorMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = mode === 'dark' ? 'midnight' : 'fresh'
  root.style.colorScheme = mode
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
    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
    const onSystem = () => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return
      } catch {
        /* no storage: keep following the system */
      }
      sync()
    }

    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    media?.addEventListener('change', onSystem)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
      media?.removeEventListener('change', onSystem)
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
    update: (patch: Partial<Preferences>) => savePreferences({ ...preferences, ...patch }),
    reset: resetPreferences,
  }
}

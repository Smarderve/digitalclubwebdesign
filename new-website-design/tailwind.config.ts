import type { Config } from 'tailwindcss'

/* Colour tokens are CSS custom properties (see src/index.css) so a theme swap
   repaints every component without touching individual screens. */
const scale = (name: string, shades: number[]) =>
  Object.fromEntries(shades.map((shade) => [shade, `rgb(var(--${name}-${shade}) / <alpha-value>)`]))

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1240px' },
    },
    extend: {
      colors: {
        brand: scale('brand', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        ink: scale('ink', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        mint: 'rgb(var(--mint) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent-hover) / <alpha-value>)',
        'accent-fg': 'rgb(var(--accent-fg) / <alpha-value>)',
        'nav-surface': 'rgb(var(--nav-surface) / <alpha-value>)',
        'nav-hover': 'rgb(var(--nav-hover) / <alpha-value>)',
        'nav-active': 'rgb(var(--nav-active) / <alpha-value>)',
        'nav-active-text': 'rgb(var(--nav-active-text) / <alpha-value>)',
        'focus-ring': 'rgb(var(--ring) / <alpha-value>)',
        lime: '#DDF06A',
        success: 'rgb(var(--success) / <alpha-value>)',
        'success-soft': 'rgb(var(--success-soft) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
        'warning-line': 'rgb(var(--warning-line) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        'danger-strong': 'rgb(var(--danger-strong) / <alpha-value>)',
        'danger-soft': 'rgb(var(--danger-soft) / <alpha-value>)',
        'danger-soft-strong': 'rgb(var(--danger-soft-strong) / <alpha-value>)',
        'danger-line': 'rgb(var(--danger-line) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        'info-soft': 'rgb(var(--info-soft) / <alpha-value>)',
        'info-line': 'rgb(var(--info-line) / <alpha-value>)',
        gold: '#DC8A16',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 6.6vw, 5.5rem)', { lineHeight: '0.98', letterSpacing: '-0.04em', fontWeight: '600' }],
        'display-2xl': ['clamp(2.75rem, 8vw, 7rem)', { lineHeight: '0.92', letterSpacing: '-0.045em', fontWeight: '600' }],
        'display-lg': ['clamp(2.25rem, 4.4vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '650' }],
        'display-md': ['clamp(1.875rem, 3.2vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '650' }],
        h1: ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '640' }],
        h2: ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '640' }],
        h3: ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '620' }],
        h4: ['1.0625rem', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
        lead: ['1.125rem', { lineHeight: '1.65', letterSpacing: '-0.005em' }],
        body: ['0.9375rem', { lineHeight: '1.65' }],
        small: ['0.8125rem', { lineHeight: '1.55' }],
        micro: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '22px',
        '2xl': '26px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(18, 26, 22, 0.04)',
        sm: '0 1px 3px 0 rgba(18, 26, 22, 0.06), 0 1px 2px -1px rgba(18, 26, 22, 0.04)',
        md: '0 10px 30px -18px rgba(18, 26, 22, 0.28)',
        lg: '0 24px 60px -30px rgba(18, 26, 22, 0.35)',
        pop: '0 16px 40px -12px rgba(18, 26, 22, 0.18), 0 2px 8px -2px rgba(18, 26, 22, 0.06)',
        float: '0 24px 55px -28px rgba(10, 30, 20, 0.45), 0 4px 14px -8px rgba(10, 30, 20, 0.18)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'palette-in': {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.985)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-up': 'fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 300ms ease-out both',
        'slide-in': 'slide-in 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'palette-in': 'palette-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config

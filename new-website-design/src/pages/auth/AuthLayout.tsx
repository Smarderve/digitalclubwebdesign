import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AuthBackdrop } from './AuthBackdrop'

export function AuthLayout() {
  const { pathname } = useLocation()
  const wide = pathname.includes('/register')

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-canvas">
      <AuthBackdrop />

      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 transition-colors hover:text-brand-800"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 ease-smooth group-hover:-translate-x-0.5" aria-hidden />
          Back to website
        </Link>
        <span className="text-[0.625rem] uppercase tracking-[0.16em] text-ink-400">KIUT Digital Club</span>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className={`relative w-full ${wide ? 'max-w-[480px]' : 'max-w-[420px]'}`}>
          {/* Guide lines that frame the form: dashed verticals running past the
              panel, solid hairlines running to both edges of the viewport. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-7 -top-24 hidden w-px border-l border-dashed border-ink-300/70 sm:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-7 -top-24 hidden w-px border-l border-dashed border-ink-300/70 sm:block"
          />
          <div aria-hidden className="pointer-events-none absolute -top-9 left-1/2 h-px w-screen -translate-x-1/2 bg-line" />
          <div aria-hidden className="pointer-events-none absolute -bottom-9 left-1/2 h-px w-screen -translate-x-1/2 bg-line" />

          <div key={pathname} className="auth-card">
            <Outlet />
          </div>
        </div>
      </main>

      <footer className="relative z-10 pb-6 text-center">
        <p className="text-[0.6875rem] leading-5 text-ink-400">
          KIUT Digital Club · Student technology community
        </p>
      </footer>
    </div>
  )
}

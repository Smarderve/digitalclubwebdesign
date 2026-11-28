import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ArtBackdrop } from '../../components/site/art'

/**
 * Authentication shell: one column for the task, one for artwork.
 *
 * The form is not wrapped in a floating card. It sits directly on the page
 * surface, separated by rules, so the fields are the only strong elements on
 * screen. The illustration panel carries the club's visual identity without
 * adding copy the student has to read before signing in.
 */
export function AuthLayout() {
  const { pathname } = useLocation()
  const wide = pathname.includes('/register')

  return (
    <div className="relative min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]">
      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 transition-colors hover:text-brand-800"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 ease-smooth group-hover:-translate-x-0.5" aria-hidden />
            Back to website
          </Link>
          <span className="text-[0.625rem] uppercase tracking-[0.16em] text-ink-400">KIUT Digital Club</span>
        </header>

        <main className="flex flex-1 items-start justify-center px-5 pb-14 pt-4 sm:px-8 lg:items-center lg:pb-10 lg:pt-0">
          <div className={`w-full ${wide ? 'max-w-[480px]' : 'max-w-[400px]'}`}>
            <div key={pathname} className="page-enter border-t border-line pt-8">
              <Outlet />
            </div>
          </div>
        </main>

        <footer className="px-5 pb-6 sm:px-8">
          <p className="text-[0.6875rem] leading-5 text-ink-400">KIUT Digital Club · Student technology community</p>
        </footer>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-brand-50/50 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="paper-grid absolute inset-0 opacity-40" />
        <ArtBackdrop
          scene="study"
          tone="strong"
          motion
          className="inset-x-[-16%] top-[14%] w-[132%] max-w-none [&_.art-scene]:text-ink-700"
        />

        <div className="relative z-10 flex items-center gap-2.5 p-8">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface p-1.5">
            <img src="/brand/digital-club-logo.svg" alt="" className="h-full w-full object-contain" />
          </span>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-700">
            Digital Club
          </span>
        </div>

        <div className="relative z-10 p-8">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-ink-500">
            Student technology community
          </p>
          <p className="mt-2 max-w-[30ch] text-[0.8125rem] leading-6 text-ink-600">
            Kampala International University in Tanzania · Gongo la Mboto, Dar es Salaam
          </p>
        </div>
      </aside>
    </div>
  )
}

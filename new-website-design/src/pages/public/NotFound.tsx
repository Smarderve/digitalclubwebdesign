import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '../../components/site/SiteHeader'
import { SiteFooter } from '../../components/site/SiteFooter'
import { ButtonLink } from '../../components/ui/button'
import { usePublicTheme } from '../../features/settings/preferences'

export function NotFound() {
  usePublicTheme()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex flex-1 items-center">
        <div className="container-editorial py-20">
          <div className="max-w-[620px]">
            <p className="font-mono text-[0.75rem] text-brand-700">404 / Not found</p>
            <h1 className="mt-3 text-display-lg text-ink-950">This page isn't part of the club site.</h1>
            <p className="mt-4 max-w-[56ch] text-[0.9375rem] leading-7 text-ink-600">
              The address may be wrong, or the page may have moved. The redesign preserves the existing routes only, so no
              placeholder pages have been created.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink to="/" iconLeft={<ArrowLeft className="h-4 w-4" />}>
                Back to home
              </ButtonLink>
              <ButtonLink to="/contact" variant="outline">
                Contact the club
              </ButtonLink>
            </div>
            <div className="mt-10 grid gap-2 border-t border-line pt-5 sm:grid-cols-3">
              {[
                { label: 'Projects', to: '/projects' },
                { label: 'Events', to: '/events' },
                { label: 'Blog', to: '/blogs' },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="text-[0.8125rem] font-medium text-ink-600 hover:text-brand-800">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export default NotFound

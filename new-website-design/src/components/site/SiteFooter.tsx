import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { SITE } from '../../data/site'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/button'
import { Input } from '../ui/field'

const columns = [
  {
    title: 'Club',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Leadership', to: '/leaders' },
      { label: 'Members', to: '/members' },
      { label: 'Elections', to: '/elections' },
    ],
  },
  {
    title: 'Activities',
    links: [
      { label: 'Events', to: '/events' },
      { label: 'Projects', to: '/projects' },
      { label: 'Topics', to: '/topics' },
      { label: 'Learn', to: '/learn' },
    ],
  },
  {
    title: 'Reading',
    links: [
      { label: 'News & updates', to: '/news' },
      { label: 'Blog', to: '/blogs' },
      { label: 'Gallery', to: '/gallery' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { push } = useToast()

  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-editorial pt-14 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <img src="/brand/digital-club-logo.svg" alt="" className="h-10 w-10 object-contain" />
              <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-ink-500">
                KIUT Digital Club
              </span>
            </Link>
            <p className="mt-6 max-w-[18ch] text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-950">
              Learn the craft, together.
            </p>
            <p className="mt-4 max-w-[46ch] text-[0.875rem] leading-6 text-ink-600">
              A student technology community at Kampala International University in Tanzania. Open to every KIUT
              student, free to join.
            </p>
          </div>

          <div className="lg:pt-2">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-500">Newsletter</p>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setError('Enter a valid email address.')
                  return
                }
                setError('')
                setEmail('')
                push({
                  tone: 'success',
                  title: 'Email validated',
                })
              }}
              noValidate
            >
              <div className="flex-1">
                <label htmlFor="footer-newsletter" className="sr-only">
                  Email address
                </label>
                <Input
                  id="footer-newsletter"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (error) setError('')
                  }}
                  placeholder="you@student.kiut.ac.tz"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'footer-newsletter-error' : undefined}
                />
                {error ? (
                  <p id="footer-newsletter-error" className="mt-1 text-[0.6875rem] text-danger">
                    {error}
                  </p>
                ) : null}
              </div>
              <Button type="submit" className="h-10 shrink-0">
                Subscribe
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </form>
            <p className="mt-2 text-[0.6875rem] leading-5 text-ink-500">
              Event and workshop announcements. No account required.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-500">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1 text-[0.875rem] text-ink-700 transition-colors hover:text-ink-950"
                    >
                      {link.label}
                      <ArrowUpRight
                        className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-60"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-500">Contact</p>
            <ul className="mt-4 space-y-2.5 text-[0.875rem] text-ink-700">
              <li>
                <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 hover:text-ink-950">
                  <Mail className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                  {SITE.email}
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                {SITE.phone}
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
                <span>
                  KIUT Campus, Gongo la Mboto
                  <br />
                  Dar es Salaam, Tanzania
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line py-6 text-[0.6875rem] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Digital Club — KIUT. All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-3">
            <a href="https://kiut.ac.tz/" target="_blank" rel="noreferrer" className="hover:text-ink-900">
              University website
            </a>
            <span aria-hidden className="text-ink-300">
              ·
            </span>
            <span>Student technology community</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowUpRight, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, UserPlus, UserRound, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth, homeForRole } from '../../context/AuthContext'
import { Button, ButtonLink } from '../ui/button'
import { Avatar } from '../ui/misc'
import { ThemeToggle } from './ThemeToggle'

const groups = [
  {
    label: 'About',
    items: [
      { label: 'About the club', to: '/about' },
      { label: 'Leadership', to: '/leaders' },
      { label: 'Members', to: '/members' },
      { label: 'Elections', to: '/elections' },
    ],
  },
  {
    label: 'Activities',
    items: [
      { label: 'Events', to: '/events' },
      { label: 'Projects', to: '/projects' },
      { label: 'Topics', to: '/topics' },
      { label: 'Learn', to: '/learn' },
    ],
  },
  {
    label: 'Stories',
    items: [
      { label: 'News', to: '/news' },
      { label: 'Blog', to: '/blogs' },
      { label: 'Gallery', to: '/gallery' },
    ],
  },
]

/**
 * A desktop dropdown that opens on hover and on click. Pointer travel into the
 * panel keeps it open; leaving closes it after a short delay. Escape and focus
 * loss close it, and the trigger stays a real button for keyboard and touch.
 */
function NavDropdown({ label, items, active }: { label: string; items: { label: string; to: string }[]; active: boolean }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | null>(null)

  const cancel = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  const closeSoon = () => {
    cancel()
    timer.current = window.setTimeout(() => setOpen(false), 160)
  }

  useEffect(() => () => cancel(), [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [items])

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => {
        cancel()
        setOpen(true)
      }}
      onMouseLeave={closeSoon}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className={cn(
          'nav-underline group inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          active || open ? 'text-ink-950' : 'text-ink-600 hover:text-ink-950',
        )}
      >
        {label}
        <ChevronDown
          className={cn('h-3 w-3 text-ink-400 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={label}
          className="glass-pop absolute left-0 top-[calc(100%+20px)] z-50 w-[248px] origin-top-left animate-palette-in overflow-hidden rounded-2xl p-1.5"
        >
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[0.8125rem] font-medium text-ink-700 transition-colors hover:bg-nav-hover hover:text-ink-950 focus-visible:bg-nav-hover focus-visible:outline-none"
            >
              {item.label}
              <ArrowUpRight className="h-3 w-3 text-ink-300" aria-hidden />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) return null

  return (
    <div ref={wrapRef} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
    }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          'flex items-center gap-2 rounded-full border border-line/80 py-0.5 pl-0.5 pr-2.5 text-[0.75rem] font-medium text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          open && 'border-ink-300 text-ink-950',
        )}
      >
        <Avatar name={user.name} size="xs" />
        <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
        <ChevronDown className={cn('hidden h-3 w-3 text-ink-400 transition-transform sm:block', open && 'rotate-180')} aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="glass-pop absolute right-0 top-[calc(100%+20px)] z-50 w-[248px] origin-top-right animate-palette-in overflow-hidden rounded-2xl p-1.5 max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-[calc(100%+0.75rem)] max-sm:w-auto max-sm:origin-top"
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[0.8125rem] font-semibold text-ink-900">{user.name}</p>
              <p className="truncate text-[0.6875rem] text-ink-500">{user.email}</p>
            </div>
          </div>
          <div aria-hidden className="my-1 h-px bg-line" />
          <Link
            to={homeForRole(user.role)}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.8125rem] text-ink-700 transition-colors hover:bg-nav-hover hover:text-ink-950"
          >
            <LayoutDashboard size={15} className="text-ink-400" aria-hidden />
            {user.role === 'admin' ? 'Admin dashboard' : 'Member dashboard'}
          </Link>
          <Link
            to={user.role === 'admin' ? '/admin/profile' : '/member/profile'}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.8125rem] text-ink-700 transition-colors hover:bg-nav-hover hover:text-ink-950"
          >
            <UserRound size={15} className="text-ink-400" aria-hidden />
            My profile
          </Link>
          <div aria-hidden className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
              navigate('/')
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[0.8125rem] text-danger transition-colors hover:bg-danger-soft"
          >
            <LogOut size={15} aria-hidden />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function SiteHeader() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-small focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Floating glass bar: detached from the top and side edges. */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="container-editorial">
          <div className="glass-nav flex h-14 items-center justify-between gap-2 rounded-full pl-2.5 pr-2 sm:h-16 sm:gap-4 sm:pl-4 sm:pr-2.5">
            <Link
              to="/"
              className="flex shrink-0 items-center rounded-full p-1 transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              aria-label="KIUT Digital Club home"
            >
              <img src="/brand/digital-club-logo.svg" alt="" className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
              <NavItem to="/">Home</NavItem>
              {groups.map((group) => (
                <NavDropdown
                  key={group.label}
                  label={group.label}
                  items={group.items}
                  active={group.items.some((item) => location.pathname.startsWith(item.to))}
                />
              ))}
              <NavItem to="/contact">Contact</NavItem>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {user ? (
                <ProfileMenu />
              ) : (
                <ButtonLink
                  to="/auth/login"
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                  iconLeft={<LogIn className="h-3.5 w-3.5" />}
                >
                  Log in
                </ButtonLink>
              )}
              <ThemeToggle />
              {!user ? (
                <ButtonLink
                  to="/auth/register"
                  size="sm"
                  className="hidden rounded-full sm:inline-flex"
                  iconLeft={<UserPlus className="h-3.5 w-3.5" />}
                >
                  Join the club
                </ButtonLink>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open navigation menu"
                className="anim-menu inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-nav-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </header>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[65] bg-ink-950/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed inset-0 z-[70] flex flex-col bg-surface focus:outline-none data-[state=open]:animate-slide-in sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[400px] sm:border-l sm:border-line">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Link to="/" className="flex items-center" aria-label="KIUT Digital Club home">
                <img src="/brand/digital-club-logo.svg" alt="" className="h-9 w-9" />
              </Link>
              <Dialog.Close
                aria-label="Close navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-nav-hover"
              >
                <X className="h-5 w-5" aria-hidden />
              </Dialog.Close>
            </div>
            <Dialog.Title className="sr-only">Site navigation</Dialog.Title>
            <nav aria-label="Mobile primary" className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-5">
                <div>
                  <Link to="/" className="block rounded-sm py-2 text-[0.9375rem] font-medium text-ink-900">
                    Home
                  </Link>
                  <Link to="/learn" className="block rounded-sm py-2 text-[0.9375rem] font-medium text-ink-900">
                    Learn
                  </Link>
                </div>
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">{group.label}</p>
                    <div className="divide-y divide-line border-y border-line">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center justify-between py-2.5 text-[0.875rem] text-ink-700"
                        >
                          {item.label}
                          <ArrowUpRight className="h-3.5 w-3.5 text-ink-300" aria-hidden />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <Link to="/contact" className="block rounded-sm py-2 text-[0.9375rem] font-medium text-ink-900">
                    Contact
                  </Link>
                </div>
              </div>
            </nav>
            <div className="border-t border-line p-5">
              {user ? (
                <div className="grid gap-2">
                  <ButtonLink to={homeForRole(user.role)} size="lg" className="w-full">
                    Go to dashboard
                  </ButtonLink>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    iconLeft={<LogOut className="h-4 w-4" />}
                    onClick={() => {
                      setOpen(false)
                      logout()
                      navigate('/')
                    }}
                  >
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <ButtonLink to="/auth/register" size="lg" className="w-full">
                    Join the club
                  </ButtonLink>
                  <ButtonLink to="/auth/login" variant="outline" size="lg" className="w-full">
                    Log in
                  </ButtonLink>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation()
  const active = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
  return (
    <NavLink
      to={to}
      end={to === '/'}
      data-active={active}
      className={cn(
        'nav-underline relative inline-flex h-9 items-center rounded-full px-3.5 text-[0.8125rem] font-medium transition-colors hover:text-ink-950',
        active ? 'text-ink-950' : 'text-ink-600',
      )}
    >
      {children}
    </NavLink>
  )
}

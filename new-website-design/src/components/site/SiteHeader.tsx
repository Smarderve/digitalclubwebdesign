import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDown, LogIn, Menu, UserPlus, X, LayoutDashboard, ArrowUpRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth, homeForRole } from '../../context/AuthContext'
import { ButtonLink } from '../ui/button'
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '../ui/dropdown'
import { Avatar } from '../ui/misc'
import { ThemeToggle } from './ThemeToggle'

const groups = [
  {
    label: 'About',
    items: [
      { label: 'About the club', to: '/about', description: 'Mission, values and how the club works' },
      { label: 'Leadership', to: '/leaders', description: 'The student team leading the club' },
      { label: 'Members', to: '/members', description: 'Students and alumni in the community' },
      { label: 'Elections', to: '/elections', description: 'Club leadership elections' },
    ],
  },
  {
    label: 'Activities',
    items: [
      { label: 'Events', to: '/events', description: 'Workshops, bootcamps and meetups' },
      { label: 'Projects', to: '/projects', description: 'Work built by club members' },
      { label: 'Topics', to: '/topics', description: 'Learning paths and skill areas' },
      { label: 'Learn', to: '/learn', description: 'Published notes and warmup material' },
    ],
  },
  {
    label: 'Stories',
    items: [
      { label: 'News', to: '/news', description: 'Club announcements and updates' },
      { label: 'Blog', to: '/blogs', description: 'Tutorials and technical writing' },
      { label: 'Gallery', to: '/gallery', description: 'Photos from club activities' },
    ],
  },
]

const simpleLinks = [
  { label: 'Home', to: '/' },
  { label: 'Contact', to: '/contact' },
]

export function SiteHeader() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-small focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 bg-surface pt-3">
        <div className="container-editorial">
          <div className="flex h-14 items-center justify-between gap-4 rounded-xl border border-line bg-surface px-3 shadow-[0_18px_40px_-30px_rgba(18,26,22,0.45)] sm:px-4">
            <Link to="/" className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" aria-label="KIUT Digital Club home">
              <img src="/brand/digital-club-logo.svg" alt="" className="h-9 w-9 object-contain" />
              <span className="hidden text-[0.875rem] font-semibold tracking-tight text-ink-950 sm:block">KIUT Digital Club</span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-0.5 xl:flex">
              <NavItem to="/">Home</NavItem>
              {groups.map((group) => (
                <Dropdown key={group.label}>
                  <DropdownTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'group inline-flex h-8 items-center gap-1 rounded-sm px-2.5 text-[0.8125rem] font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                        group.items.some((item) => location.pathname.startsWith(item.to)) && 'bg-ink-100 text-ink-950',
                      )}
                    >
                      {group.label}
                      <ChevronDown className="h-3 w-3 text-ink-400 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
                    </button>
                  </DropdownTrigger>
                  <DropdownContent align="start" className="w-[326px] p-1.5">
                    {group.items.map((item) => (
                      <DropdownItem key={item.to} to={item.to} className="items-start py-2">
                        <span className="block w-full">
                          <span className="block text-[0.8125rem] font-medium text-ink-900">{item.label}</span>
                          <span className="mt-0.5 block text-[0.6875rem] leading-4 text-ink-500">{item.description}</span>
                        </span>
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>
              ))}
              <NavItem to="/contact">Contact</NavItem>
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <Dropdown>
                  <DropdownTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full border border-line py-0.5 pl-0.5 pr-2.5 text-[0.75rem] font-medium text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      <Avatar name={user.name} size="xs" />
                      <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                    </button>
                  </DropdownTrigger>
                  <DropdownContent>
                    <DropdownItem to={homeForRole(user.role)} icon={<LayoutDashboard className="h-3.5 w-3.5" />}>
                      {user.role === 'admin' ? 'Admin dashboard' : 'Member dashboard'}
                    </DropdownItem>
                    <DropdownItem
                      to={user.role === 'admin' ? '/admin/profile' : '/member/profile'}
                      icon={<ArrowUpRight className="h-3.5 w-3.5" />}
                    >
                      My profile
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
              ) : (
                <ButtonLink to="/auth/login" variant="ghost" size="sm" className="hidden sm:inline-flex" iconLeft={<LogIn className="h-3.5 w-3.5" />}>
                  Log in
                </ButtonLink>
              )}
              <ThemeToggle />
              <ButtonLink to="/auth/register" size="sm" className="hidden sm:inline-flex" iconLeft={<UserPlus className="h-3.5 w-3.5" />}>
                Join the club
              </ButtonLink>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open navigation menu"
                className="anim-menu inline-flex h-9 w-9 items-center justify-center rounded-sm text-ink-700 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:bg-ink-200 xl:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </header>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-white focus:outline-none data-[state=open]:animate-slide-in sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[400px] sm:border-l sm:border-line">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Link to="/" className="flex items-center gap-2.5">
                <img src="/brand/digital-club-logo.svg" alt="" className="h-9 w-9" />
                <span className="text-[0.8125rem] font-semibold text-ink-950">KIUT Digital Club</span>
              </Link>
              <Dialog.Close
                aria-label="Close navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-ink-500 hover:bg-ink-100"
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
                        <Link key={item.to} to={item.to} className="flex items-center justify-between py-2.5 text-[0.875rem] text-ink-700">
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
                <ButtonLink to={homeForRole(user.role)} size="lg" className="w-full">
                  Go to dashboard
                </ButtonLink>
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
              <p className="mt-3 text-center text-[0.6875rem] text-ink-400">Membership is free for KIUT students.</p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'inline-flex h-8 items-center rounded-sm px-2.5 text-[0.8125rem] font-medium transition-colors hover:bg-ink-100 hover:text-ink-950',
          isActive ? 'bg-ink-100 text-ink-950' : 'text-ink-600',
        )
      }
    >
      {children}
    </NavLink>
  )
}

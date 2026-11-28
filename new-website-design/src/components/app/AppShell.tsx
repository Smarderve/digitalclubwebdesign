import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ArrowLeft,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/misc'
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from '../ui/dropdown'
import { useToast } from '../../context/ToastContext'
import { GlobalSearch } from './GlobalSearch'
import { useSocial, useSocialSync, useViewer } from '../../features/social/hooks'
import { unreadSocialCount } from '../../features/social/store'
import { usePreferences } from '../../features/settings/preferences'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  badge?: number | string
  end?: boolean
  /** Routes that belong to this destination, so consolidated hubs stay highlighted. */
  match?: string[]
}

export type NavSection = { label: string; items: NavItem[] }

/** Tracks a media query so the rail can switch to its compact state on tablets. */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** Internal dashboard history. Browser refresh keeps the current page; the
    stack itself starts fresh, exactly like an application menu. */
function useAppHistory(homeTo: string) {
  const location = useLocation()
  const navigate = useNavigate()
  const entries = useRef<string[]>([`${location.pathname}${location.search}`])
  const [index, setIndex] = useState(0)
  const pending = useRef<string | null>(null)

  useEffect(() => {
    const current = `${location.pathname}${location.search}`
    if (pending.current) {
      if (pending.current === current) pending.current = null
      return
    }
    if (entries.current[index] === current) return
    entries.current = [...entries.current.slice(0, index + 1), current].slice(-40)
    setIndex(entries.current.length - 1)
  }, [location.pathname, location.search, index])

  const go = (target: number) => {
    const next = entries.current[target]
    if (!next) return
    pending.current = next
    setIndex(target)
    navigate(next)
  }

  const current = `${location.pathname}${location.search}`
  const canBack = index > 0 || current !== homeTo
  const canForward = index < entries.current.length - 1

  return {
    canBack,
    canForward,
    back: () => (index > 0 ? go(index - 1) : navigate(homeTo)),
    forward: () => (canForward ? go(index + 1) : undefined),
  }
}

function NavItemLink({
  item,
  active,
  collapsed,
  compact,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  collapsed?: boolean
  compact?: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center rounded-[11px] font-medium transition-colors duration-200',
        compact ? 'h-11 gap-3 px-3 text-[0.875rem]' : 'h-11 gap-3 px-3 text-[0.8125rem]',
        collapsed ? 'mx-auto h-12 w-12 justify-center px-0' : 'w-full',
        active ? 'bg-nav-active text-nav-active-text' : 'text-ink-600 hover:bg-nav-hover hover:text-ink-950',
      )}
    >
      {/* The glyph sits directly on the navigation surface: no tile, chip or
          square container of its own. */}
      <Icon
        className={cn('shrink-0', active ? 'opacity-100' : 'opacity-85 group-hover:opacity-100')}
        size={22}
        aria-hidden
      />
      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
      {!collapsed && item.badge ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-100 px-1.5 text-[0.6875rem] font-semibold tabular text-brand-900">
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  )
}

function NavRail({
  nav,
  collapsed,
  activeItem,
  compact,
  onNavigate,
}: {
  nav: NavSection[]
  collapsed?: boolean
  activeItem: (item: NavItem) => boolean
  compact?: boolean
  onNavigate?: () => void
}) {
  return (
    <nav
      aria-label="Dashboard navigation"
      className={cn(
        'rail-block flex min-h-0 flex-col gap-0.5 overflow-y-auto scrollbar-thin',
        collapsed ? 'rounded-2xl p-1.5' : 'rounded-2xl p-2',
      )}
    >
      {nav.map((section, sectionIndex) => (
        <div key={section.label || 'primary'} className="flex flex-col gap-0.5">
          {section.label && !collapsed ? (
            <p
              className={cn(
                'px-3 pb-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-400',
                sectionIndex === 0 ? 'pt-1' : 'pt-3',
              )}
            >
              {section.label}
            </p>
          ) : null}
          {sectionIndex > 0 && collapsed ? <span aria-hidden className="mx-2.5 my-1.5 h-px bg-line" /> : null}
          {section.items.map((item) => (
            <NavItemLink
              key={item.to}
              item={item}
              active={activeItem(item)}
              collapsed={collapsed}
              compact={compact}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}

export function AppShell({
  nav,
  areaLabel,
  areaTone = 'member',
  homeTo,
  profileTo,
  notificationsTo,
  settingsTo,
  unread = 0,
}: {
  nav: NavSection[]
  areaLabel: string
  areaTone?: 'member' | 'admin' | 'quizmaster'
  homeTo: string
  profileTo: string
  notificationsTo: string
  settingsTo?: string
  unread?: number
}) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { push } = useToast()
  useSocial()
  useSocialSync()
  /* Re-apply the stored theme on entry, so a visit to the public site cannot
     leave the dashboard in the day/night palette. */
  usePreferences()
  const viewer = useViewer()
  const totalUnread = unread + unreadSocialCount(viewer)
  const [mobileOpen, setMobileOpen] = useState(false)
  /* Tablets (768–1023px) keep an icon rail instead of a full sidebar, and the
     drawer is reserved for phones. */
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(`kiut-nav-${areaTone}`) === 'collapsed'
    } catch {
      return false
    }
  })

  const railCollapsed = collapsed || !isDesktop

  const settingsTarget = settingsTo ?? (areaTone === 'admin' ? '/admin/settings' : '/member/settings')
  const history = useAppHistory(homeTo)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem(`kiut-nav-${areaTone}`, collapsed ? 'collapsed' : 'expanded')
    } catch {
      /* ignore */
    }
  }, [collapsed, areaTone])

  const isItemActive = (item: NavItem) => {
    if (item.end) return location.pathname === item.to
    return (item.match ?? [item.to]).some(
      (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    )
  }

  const settingsActive = location.pathname === settingsTarget || location.pathname.startsWith(`${settingsTarget}/`)

  const title = useMemo(() => {
    if (settingsActive) return 'Settings'
    if (areaTone === 'member' && location.pathname.startsWith('/member/members/')) return 'Member profile'
    const ranked = nav
      .flatMap((section) => section.items)
      .map((item) => {
        const prefixes = item.match ?? [item.to]
        const matched = prefixes
          .filter((path) => (item.end ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`)))
          .sort((a, b) => b.length - a.length)[0]
        return { item, matched }
      })
      .filter((entry) => entry.matched)
      .sort((a, b) => (b.matched?.length ?? 0) - (a.matched?.length ?? 0))
    return ranked[0]?.item.label ?? areaLabel
  }, [location.pathname, nav, areaLabel, areaTone, settingsActive, settingsTarget])

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar: branding block, one centred navigation block, settings block. */}
      <aside
        className={cn(
          'fixed bottom-3 left-3 top-3 z-30 hidden flex-col gap-3 transition-[width] duration-300 ease-smooth md:flex',
          railCollapsed ? 'w-[64px]' : 'w-[232px]',
        )}
        aria-label={`${areaLabel} navigation`}
      >
        {/* Branding and collapse control share one block in both states. */}
        {railCollapsed ? (
          <div className="rail-block mx-auto flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full p-1">
            <Link
              to="/"
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-nav-hover"
              aria-label="KIUT Digital Club public website"
              title="KIUT Digital Club"
            >
              <img src="/brand/digital-club-logo.svg" alt="" className="h-5 w-5 object-contain" />
            </Link>
            {isDesktop ? (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-nav-hover hover:text-ink-950"
                aria-label="Open sidebar"
                title="Open sidebar"
              >
                <PanelLeftOpen size={16} aria-hidden />
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rail-block flex shrink-0 items-center gap-1 rounded-2xl p-2">
            <Link
              to="/"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-0.5 py-1"
              aria-label="KIUT Digital Club public website"
              title="Open the public website"
            >
              <img
                src="/brand/digital-club-logo.svg"
                alt=""
                className="h-9 w-9 shrink-0 object-contain"
              />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[0.8125rem] font-semibold text-ink-950">KIUT Digital Club</span>
                <span className="block truncate text-[0.6875rem] text-ink-500">{areaLabel}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-nav-hover hover:text-ink-950"
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <PanelLeftClose size={19} aria-hidden />
            </button>
          </div>
        )}

        {/* One shared navigation block, centred vertically in the rail. */}
        <div className="flex min-h-0 flex-1 items-center">
          <div className="max-h-full w-full">
            <NavRail nav={nav} collapsed={railCollapsed} activeItem={isItemActive} />
          </div>
        </div>

        {/* Settings, anchored at the bottom in its own block. */}
        <div className={cn('rail-block shrink-0', railCollapsed ? 'rounded-full p-1.5' : 'rounded-2xl p-2')}>
          <NavLink
            to={settingsTarget}
            title={railCollapsed ? 'Settings' : undefined}
            aria-label={railCollapsed ? 'Settings' : undefined}
            className={cn(
              'flex items-center font-medium transition-colors',
              railCollapsed
                ? 'mx-auto h-12 w-12 justify-center rounded-full'
                : 'h-11 w-full gap-3 rounded-[11px] px-3 text-[0.8125rem]',
              settingsActive ? 'bg-nav-active text-nav-active-text' : 'text-ink-600 hover:bg-nav-hover hover:text-ink-950',
            )}
          >
            <Settings size={22} className="shrink-0" aria-hidden />
            {!railCollapsed ? <span>Settings</span> : null}
          </NavLink>
        </div>
      </aside>

      <div
        className={cn(
          'min-h-screen transition-[padding] duration-300 ease-smooth',
          railCollapsed ? 'md:pl-[88px]' : 'md:pl-[256px]',
        )}
      >
        {/* Topbar: four independent floating surfaces. */}
        <div className="sticky top-3 z-20 px-3 sm:px-4 lg:px-5">
          <header className="flex items-center gap-2 sm:gap-2.5">
            <div className="rail-block flex h-12 min-w-0 flex-1 items-center gap-1 rounded-2xl px-1.5 sm:h-14 sm:gap-1.5 sm:px-2.5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="anim-menu inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-nav-hover hover:text-ink-950 md:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>

              <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
                <button
                  type="button"
                  onClick={history.back}
                  disabled={!history.canBack}
                  aria-label="Back"
                  title="Back"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-nav-hover hover:text-ink-950 disabled:pointer-events-none disabled:text-ink-300"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={history.forward}
                  disabled={!history.canForward}
                  aria-label="Forward"
                  title="Forward"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-nav-hover hover:text-ink-950 disabled:pointer-events-none disabled:text-ink-300"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div aria-hidden className="mx-0.5 hidden h-5 w-px shrink-0 bg-line sm:block" />

              <p className="min-w-0 flex-1 truncate px-1 text-[0.8125rem] font-semibold text-ink-900">{title}</p>
            </div>

            <div className="h-12 shrink-0 sm:h-14">
              <GlobalSearch nav={nav} areaLabel={areaLabel} areaTone={areaTone} settingsTo={settingsTarget} />
            </div>

            <Link
              to={notificationsTo}
              aria-label={`Notifications${totalUnread ? `, ${totalUnread} unread` : ''}`}
              className="rail-block group relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-950 sm:h-14 sm:w-14"
            >
              <Bell className="anim-bell h-5 w-5" aria-hidden />
              {totalUnread > 0 ? (
                <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.5625rem] font-semibold tabular text-white ring-2 ring-surface sm:right-2.5 sm:top-2.5">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              ) : null}
            </Link>

            <Dropdown>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="rail-block flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-1 transition-shadow hover:ring-2 hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:h-14 sm:w-14 sm:p-1.5"
                  aria-label="Account menu"
                >
                  <Avatar name={user?.name ?? 'Member'} size="sm" />
                </button>
              </DropdownTrigger>
              <DropdownContent>
                <div className="px-2.5 py-2">
                  <p className="text-[0.8125rem] font-semibold text-ink-900">{user?.name}</p>
                  <p className="truncate text-[0.6875rem] text-ink-500">{user?.email}</p>
                </div>
                <DropdownSeparator />
                <DropdownItem to={profileTo} icon={<UserRound size={15} />}>
                  Profile
                </DropdownItem>
                <DropdownItem to={settingsTarget} icon={<Settings size={15} />}>
                  Settings
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem to="/" icon={<ArrowLeft size={15} />}>
                  Back to website
                </DropdownItem>
                <DropdownItem
                  destructive
                  icon={<LogOut size={15} />}
                  onSelect={() => {
                    logout()
                    push({ tone: 'info', title: 'Signed out' })
                    navigate('/')
                  }}
                >
                  Sign out
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </header>
        </div>

        {/* Extra bottom padding on phones keeps the floating chat launcher from
            sitting on top of the last controls of the page. */}
        <main id="main" className="mx-auto w-full max-w-[1320px] px-4 pb-24 pt-6 sm:px-6 sm:pb-10 lg:px-5 lg:pb-7 lg:pt-7">
          <Outlet />
        </main>
      </div>

      {/* Mobile: the same three areas inside an intentional drawer. */}
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[65] bg-ink-950/50 data-[state=open]:animate-fade-in md:hidden" />
          <Dialog.Content className="fixed bottom-3 left-3 top-3 z-[70] flex w-[82%] max-w-[300px] flex-col gap-3 rounded-2xl bg-canvas p-2 text-ink-700 shadow-float focus:outline-none data-[state=open]:animate-slide-in md:hidden">
            <div className="rail-block flex items-center justify-between gap-2 rounded-2xl p-2">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center gap-2.5 p-1">
                <img src="/brand/digital-club-logo.svg" alt="" className="h-9 w-9 shrink-0 object-contain" />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[0.8125rem] font-semibold text-ink-950">KIUT Digital Club</span>
                  <span className="block truncate text-[0.6875rem] text-ink-500">{areaLabel}</span>
                </span>
              </Link>
              <Dialog.Close
                aria-label="Close navigation"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-nav-hover"
              >
                <X className="h-4 w-4" aria-hidden />
              </Dialog.Close>
            </div>
            <Dialog.Title className="sr-only">{areaLabel} navigation</Dialog.Title>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavRail nav={nav} activeItem={isItemActive} compact onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="rail-block shrink-0 rounded-2xl p-2">
              <NavLink
                to={settingsTarget}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-[11px] px-3 text-[0.875rem] font-medium',
                  settingsActive ? 'bg-nav-active text-nav-active-text' : 'text-ink-600 hover:bg-nav-hover hover:text-ink-950',
                )}
              >
                <Settings size={22} className="shrink-0" aria-hidden />
                Settings
              </NavLink>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

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

/**
 * One navigation destination. Each item is its own floating surface — the rail
 * is a stack of compact blocks, never one continuous container.
 */
function RailNavItem({
  item,
  active,
  collapsed,
  onNavigate,
  compact,
}: {
  item: NavItem
  active: boolean
  collapsed?: boolean
  onNavigate?: () => void
  compact?: boolean
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
        'rail-block group flex items-center gap-2.5 rounded-[16px] font-medium transition-[background-color,color,border-color,transform] duration-200',
        compact ? 'h-11 px-3 text-[0.875rem]' : 'h-11 px-3 text-[0.8125rem]',
        collapsed ? 'justify-center px-0' : 'w-full',
        active
          ? 'border-transparent bg-nav-active text-nav-active-text'
          : 'text-ink-600 hover:border-ink-300 hover:bg-nav-hover hover:text-ink-950',
      )}
    >
      <Icon className="iconify h-[18px] w-[18px] shrink-0" aria-hidden />
      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
      {!collapsed && item.badge ? (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-100 px-1 text-[0.625rem] font-semibold tabular text-brand-900">
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  )
}

function RailNav({
  nav,
  collapsed,
  activeItem,
  onNavigate,
  compact,
}: {
  nav: NavSection[]
  collapsed?: boolean
  activeItem: (item: NavItem) => boolean
  onNavigate?: () => void
  compact?: boolean
}) {
  return (
    <nav
      className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto py-0.5 scrollbar-thin"
      aria-label="Dashboard navigation"
    >
      {nav.map((section) => (
        <div key={section.label || 'primary'} className={cn('flex flex-col gap-1.5', collapsed && 'mt-1 first:mt-0')}>
          {section.label && !collapsed ? (
            <p className="px-2.5 pb-0.5 pt-2 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
              {section.label}
            </p>
          ) : null}
          {section.items.map((item) => (
            <RailNavItem
              key={item.to}
              item={item}
              active={activeItem(item)}
              collapsed={collapsed}
              onNavigate={onNavigate}
              compact={compact}
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
  unread = 2,
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
  const viewer = useViewer()
  const totalUnread = unread + unreadSocialCount(viewer)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(`kiut-nav-${areaTone}`) === 'collapsed'
    } catch {
      return false
    }
  })

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
      {/* Floating desktop rail: three independent areas plus one block per link. */}
      <aside
        className={cn(
          'fixed bottom-4 left-4 top-4 z-30 hidden flex-col gap-2 transition-[width] duration-300 ease-smooth lg:flex',
          collapsed ? 'w-[76px]' : 'w-[248px]',
        )}
        aria-label={`${areaLabel} navigation`}
      >
        {/* 1. Logo block. Clicking it opens the public website; the session stays intact. */}
        <div className={cn('rail-block flex items-center gap-2.5 rounded-2xl px-3 py-2.5', collapsed && 'justify-center px-2')}>
          <Link
            to="/"
            className={cn('flex min-w-0 items-center gap-2.5', collapsed && 'justify-center')}
            aria-label="Open the KIUT Digital Club public website"
            title="Open the public website"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas p-1.5 ring-1 ring-inset ring-line">
              <img src="/brand/digital-club-logo.svg" alt="" className="h-full w-full object-contain" />
            </span>
            {!collapsed ? (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[0.875rem] font-semibold text-ink-950">Digital Club</span>
                <span className="block text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">{areaLabel}</span>
              </span>
            ) : null}
          </Link>
        </div>

        {/* 2. Collapse control: its own floating surface, visible in both states. */}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className={cn(
            'rail-block flex h-10 w-full items-center justify-center gap-2 rounded-2xl text-[0.6875rem] font-medium text-ink-500 transition-colors hover:text-ink-950',
            !collapsed && 'px-3',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
          {!collapsed ? <span>Collapse sidebar</span> : null}
        </button>

        {/* 3. Navigation: each destination is its own compact floating block. */}
        <RailNav nav={nav} collapsed={collapsed} activeItem={isItemActive} />

        {/* 4. Settings stays anchored at the bottom, in its own block. */}
        <div className={cn('mt-auto shrink-0', collapsed ? 'w-full' : 'w-full')}>
          <NavLink
            to={settingsTarget}
            title={collapsed ? 'Settings' : undefined}
            aria-label={collapsed ? 'Settings' : undefined}
            className={cn(
              'rail-block flex h-11 items-center gap-2.5 rounded-[16px] text-[0.8125rem] font-medium transition-colors',
              collapsed ? 'justify-center px-0' : 'px-3',
              settingsActive
                ? 'border-transparent bg-nav-active text-nav-active-text'
                : 'text-ink-600 hover:border-ink-300 hover:bg-nav-hover hover:text-ink-950',
            )}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {!collapsed ? <span>Settings</span> : null}
          </NavLink>
        </div>
      </aside>

      <div className={cn('min-h-screen transition-[padding] duration-300 ease-smooth', collapsed ? 'lg:pl-[108px]' : 'lg:pl-[284px]')}>
        {/* Topbar: four independent floating surfaces with consistent gaps. */}
        <div className="sticky top-3 z-20 px-3 sm:px-4 lg:px-5">
          <header className="flex items-center gap-2 sm:gap-2.5">
            {/* Navigation + page heading */}
            <div className="rail-block flex h-12 min-w-0 flex-1 items-center gap-1 rounded-2xl px-1.5 sm:h-14 sm:gap-1.5 sm:px-2.5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="anim-menu inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-nav-hover hover:text-ink-950 lg:hidden"
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

            {/* Search: its own floating block */}
            <div className="rail-block flex h-12 shrink-0 items-center rounded-2xl px-1 sm:h-14">
              <GlobalSearch nav={nav} areaLabel={areaLabel} areaTone={areaTone} settingsTo={settingsTarget} />
            </div>

            {/* Notification: independent circle */}
            <Link
              to={notificationsTo}
              aria-label={`Notifications${totalUnread ? `, ${totalUnread} unread` : ''}`}
              className="rail-block group relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-950 sm:h-14 sm:w-14"
            >
              <Bell className="anim-bell h-[18px] w-[18px]" aria-hidden />
              {totalUnread > 0 ? (
                <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.5625rem] font-semibold tabular text-white ring-2 ring-surface sm:right-2.5 sm:top-2.5">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              ) : null}
            </Link>

            {/* Profile: independent circle, outside the search block */}
            <Dropdown>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="rail-block flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-1 transition-shadow hover:ring-2 hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:h-14 sm:w-14 sm:p-1.5"
                  aria-label="Account menu"
                >
                  <Avatar name={user?.name ?? 'Demo Member'} size="sm" />
                </button>
              </DropdownTrigger>
              <DropdownContent>
                <div className="px-2.5 py-2">
                  <p className="text-[0.8125rem] font-semibold text-ink-900">{user?.name}</p>
                  <p className="truncate text-[0.6875rem] text-ink-500">{user?.email}</p>
                  <p className="mt-1 inline-flex rounded-[3px] border border-dashed border-ink-200 px-1.5 text-[0.5625rem] uppercase tracking-wide text-ink-400">
                    Demo account
                  </p>
                </div>
                <DropdownSeparator />
                <DropdownItem to={profileTo} icon={<UserRound className="h-3.5 w-3.5" />}>
                  Profile
                </DropdownItem>
                <DropdownItem to={settingsTarget} icon={<Settings className="h-3.5 w-3.5" />}>
                  Settings
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem to="/" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                  Back to website
                </DropdownItem>
                <DropdownItem
                  destructive
                  icon={<LogOut className="h-3.5 w-3.5" />}
                  onSelect={() => {
                    logout()
                    push({ tone: 'info', title: 'Signed out', description: 'This prototype session has ended.' })
                    navigate('/')
                  }}
                >
                  Sign out
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </header>
        </div>

        <main id="main" className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-5 lg:py-7">
          <Outlet />
        </main>
      </div>

      {/* Mobile: the same block structure inside an intentional drawer. */}
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/50 data-[state=open]:animate-fade-in lg:hidden" />
          <Dialog.Content className="fixed bottom-3 left-3 top-3 z-50 flex w-[86%] max-w-[320px] flex-col gap-2 rounded-2xl bg-canvas p-2 text-ink-700 shadow-float focus:outline-none data-[state=open]:animate-slide-in lg:hidden">
            <div className="rail-block flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas p-1.5 ring-1 ring-inset ring-line">
                  <img src="/brand/digital-club-logo.svg" alt="" className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.875rem] font-semibold text-ink-950">Digital Club</span>
                  <span className="block text-[0.625rem] uppercase tracking-[0.12em] text-ink-400">{areaLabel}</span>
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
            <RailNav nav={nav} activeItem={isItemActive} onNavigate={() => setMobileOpen(false)} compact />
            <div className="mt-auto shrink-0">
              <NavLink
                to={settingsTarget}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rail-block flex h-11 items-center gap-2.5 rounded-[16px] px-3 text-[0.875rem] font-medium',
                  settingsActive
                    ? 'border-transparent bg-nav-active text-nav-active-text'
                    : 'text-ink-600 hover:border-ink-300 hover:bg-nav-hover hover:text-ink-950',
                )}
              >
                <Settings className="h-[18px] w-[18px] shrink-0" aria-hidden />
                Settings
              </NavLink>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

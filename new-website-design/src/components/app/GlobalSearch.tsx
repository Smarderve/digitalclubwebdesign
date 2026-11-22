import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Search, X } from 'lucide-react'
import { Avatar, Skeleton } from '../ui/misc'
import { useSocial, useViewer } from '../../features/social/hooks'
import { searchMembers } from '../../features/social/store'
import type { MemberSearchItem } from '../../features/social/types'
import { cn } from '../../lib/utils'
import type { NavSection } from '../app/AppShell'
import {
  GROUP_ORDER,
  searchContent,
  searchDestinations,
  type DestinationResult,
  type SearchGroup,
} from '../../features/search/catalog'

type PaletteItem =
  | { type: 'destination'; key: string; destination: DestinationResult }
  | { type: 'member'; key: string; member: MemberSearchItem }

/**
 * Website-wide command search: destinations, settings, members and content
 * records that actually exist. Member results go through the social service,
 * which enforces privacy and discovery rules.
 */
export function GlobalSearch({
  nav,
  areaLabel,
  areaTone,
  settingsTo,
}: {
  nav: NavSection[]
  areaLabel: string
  areaTone: 'member' | 'admin' | 'quizmaster'
  settingsTo: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [deferred, setDeferred] = useState('')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<MemberSearchItem[]>([])
  const [memberTotal, setMemberTotal] = useState(0)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const viewer = useViewer()
  const social = useSocial()

  const trimmed = query.trim()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(Boolean(trimmed))
    const timer = window.setTimeout(() => {
      setDeferred(trimmed)
      if (!trimmed) {
        setMembers([])
        setMemberTotal(0)
        setMemberError(null)
        setLoading(false)
        return
      }
      if (!viewer) {
        setMembers([])
        setMemberTotal(0)
        setMemberError(null)
        setLoading(false)
        return
      }
      const result = searchMembers(viewer, trimmed, { limit: 8 })
      if (result.ok) {
        setMembers(result.data.items)
        setMemberTotal(result.data.total)
        setMemberError(null)
      } else {
        setMembers([])
        setMemberTotal(0)
        setMemberError(result.error)
      }
      setLoading(false)
    }, 220)
    return () => window.clearTimeout(timer)
  }, [open, trimmed, viewer, social.follows, social.requests, social.blocks, retry])

  const destinations = useMemo(
    () => searchDestinations(deferred, nav, settingsTo, areaTone === 'member'),
    [deferred, nav, settingsTo, areaTone],
  )
  const content = useMemo(
    () => (areaTone === 'member' ? searchContent(deferred) : []),
    [deferred, areaTone],
  )

  const grouped = useMemo(() => {
    const map = new Map<SearchGroup, DestinationResult[]>()
    for (const item of [...destinations, ...content]) {
      const bucket = map.get(item.group) ?? []
      if (!bucket.some((entry) => entry.to === item.to && entry.label === item.label)) bucket.push(item)
      map.set(item.group, bucket)
    }
    return map
  }, [destinations, content])

  const flat = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = []
    for (const group of GROUP_ORDER) {
      if (group === 'Members') {
        for (const member of members) items.push({ type: 'member', key: `member-${member.username}`, member })
        continue
      }
      for (const destination of grouped.get(group) ?? []) {
        items.push({ type: 'destination', key: destination.id, destination })
      }
    }
    return items
  }, [grouped, members])

  useEffect(() => {
    setActive(0)
  }, [deferred])

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function choose(item: PaletteItem) {
    const to = item.type === 'member' ? memberHref(item.member) : item.destination.to
    setOpen(false)
    setQuery('')
    setDeferred('')
    navigate(to)
  }

  function memberHref(member: MemberSearchItem) {
    return areaTone === 'member' ? `/member/members/${member.username}` : `/members/${member.username}`
  }

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (flat.length) setActive((index) => (index + 1) % flat.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (flat.length) setActive((index) => (index - 1 + flat.length) % flat.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = flat[active]
      if (item) choose(item)
    }
  }

  let runningIndex = -1

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setQuery('')
          setDeferred('')
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full px-2.5 text-[0.75rem] text-ink-500 transition-colors hover:bg-nav-hover hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:min-w-[176px] sm:px-3 lg:min-w-[228px]"
          aria-label={`Search ${areaLabel}`}
        >
          <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="hidden flex-1 text-left sm:inline">Search</span>
          <kbd className="ml-auto hidden rounded-[5px] border border-line bg-ink-50 px-1.5 py-0.5 font-sans text-[0.5625rem] uppercase tracking-wide text-ink-400 sm:inline">
            Ctrl K
          </kbd>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/45 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          onKeyDown={onInputKeyDown}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-float focus:outline-none data-[state=open]:animate-palette-in sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-[7vh] sm:max-h-[82vh] sm:w-[calc(100vw-2rem)] sm:max-w-[620px] sm:-translate-x-1/2 sm:rounded-2xl"
        >
          <Dialog.Title className="sr-only">Search {areaLabel}</Dialog.Title>
          <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-4">
            <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages, members, competitions, settings…"
              className="min-w-0 flex-1 bg-transparent py-3.5 text-[0.9375rem] text-ink-900 outline-none placeholder:text-ink-400"
              aria-label="Search pages, members and settings"
              role="combobox"
              aria-expanded="true"
              aria-controls="global-search-results"
              aria-activedescendant={flat.length ? `search-result-${active}` : undefined}
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setDeferred('')
                }}
                aria-label="Clear search"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
            <Dialog.Close
              aria-label="Close search"
              className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-ink-50 hover:text-ink-700 sm:inline-flex"
            >
              <X className="h-4 w-4" aria-hidden />
            </Dialog.Close>
          </div>

          <div id="global-search-results" ref={listRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            {GROUP_ORDER.map((group) => {
              const items = grouped.get(group) ?? []
              if (group === 'Members') {
                return (
                  <section key={group} aria-label="Member results" className="px-2 py-1.5">
                    <div className="flex items-baseline justify-between gap-2 px-2 py-1.5">
                      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-400">Members</p>
                      {!loading && !memberError && memberTotal > 0 ? (
                        <p className="text-[0.625rem] tabular text-ink-400">{memberTotal} found</p>
                      ) : null}
                    </div>
                    {loading ? (
                      <div className="space-y-2 px-2 py-1" aria-busy="true" aria-label="Searching members">
                        {[0, 1].map((row) => (
                          <div key={row} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <Skeleton className="h-2.5 w-1/3" />
                              <Skeleton className="h-2 w-2/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : memberError ? (
                      <div className="mx-2 my-1 rounded-md border border-warning-line bg-warning-soft px-3 py-2">
                        <p className="text-[0.75rem] leading-5 text-ink-700">{memberError}</p>
                        <button
                          type="button"
                          onClick={() => setRetry((value) => value + 1)}
                          className="mt-1 text-[0.75rem] font-semibold text-brand-800 hover:underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : members.length ? (
                      <ul>
                        {members.map((member) => {
                          runningIndex += 1
                          const index = runningIndex
                          return (
                            <li key={member.username}>
                              <button
                                type="button"
                                id={`search-result-${index}`}
                                data-index={index}
                                onMouseMove={() => setActive(index)}
                                onClick={() => choose({ type: 'member', key: `member-${member.username}`, member })}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors',
                                  active === index ? 'bg-ink-50' : 'hover:bg-ink-50/60',
                                )}
                              >
                                <Avatar name={member.displayName} size="sm" />
                                <span className="min-w-0 flex-1">
                                  <span className="flex min-w-0 items-center gap-2">
                                    <span className="truncate text-[0.8125rem] font-medium text-ink-900">
                                      <Highlight text={member.displayName} query={deferred} />
                                    </span>
                                    <span className="truncate font-mono text-[0.6875rem] text-ink-400">
                                      @<Highlight text={member.username} query={deferred} />
                                    </span>
                                  </span>
                                  <span className="mt-0.5 block truncate text-[0.75rem] text-ink-500">
                                    {member.isPrivate
                                      ? 'Private profile · request to follow'
                                      : member.tagline || member.skills.slice(0, 3).join(' · ') || 'Member'}
                                  </span>
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : deferred && viewer ? (
                      <p className="px-3 py-2 text-[0.75rem] text-ink-500">No members match “{deferred}”.</p>
                    ) : null}
                  </section>
                )
              }

              if (!items.length) return null
              return (
                <section key={group} aria-label={`${group} results`} className="px-2 py-1.5">
                  <p className="px-2 pb-1 pt-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
                    {group}
                  </p>
                  <ul>
                    {items.map((item) => {
                      runningIndex += 1
                      const index = runningIndex
                      const Icon = item.icon
                      return (
                        <li key={`${item.id}-${item.to}`}>
                          <button
                            type="button"
                            id={`search-result-${index}`}
                            data-index={index}
                            onMouseMove={() => setActive(index)}
                            onClick={() => choose({ type: 'destination', key: item.id, destination: item })}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors',
                              active === index ? 'bg-ink-50' : 'hover:bg-ink-50/60',
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                active === index ? 'bg-brand-50 text-brand-700' : 'bg-ink-50 text-ink-500',
                              )}
                            >
                              <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[0.8125rem] font-medium text-ink-900">
                                <Highlight text={item.label} query={deferred} />
                              </span>
                              {item.description ? (
                                <span className="mt-0.5 block truncate text-[0.75rem] text-ink-500">{item.description}</span>
                              ) : null}
                            </span>
                            <span className="shrink-0 text-[0.625rem] uppercase tracking-[0.08em] text-ink-300">
                              {item.kind === 'setting' ? 'Setting' : item.kind === 'content' ? 'Open' : 'Page'}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}

            {deferred && !loading && !flat.length && !memberError ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[0.875rem] font-medium text-ink-800">Nothing matches “{deferred}”</p>
                <p className="mx-auto mt-1 max-w-[42ch] text-[0.75rem] leading-5 text-ink-500">
                  Try a section name such as “rank”, “warm” or “privacy”, or a member’s name or username.
                </p>
              </div>
            ) : null}

            {!deferred ? (
              <div className="border-t border-line px-3 py-2.5">
                <p className="text-[0.6875rem] leading-4 text-ink-400">
                  Search everything in {areaLabel}: destinations, settings, members and published content.
                </p>
              </div>
            ) : null}
          </div>

          <div className="hidden shrink-0 items-center justify-between gap-3 border-t border-line bg-ink-50/50 px-4 py-2 text-[0.625rem] text-ink-400 sm:flex">
            <span className="flex items-center gap-3">
              <span>
                <kbd className="rounded border border-line bg-surface px-1">↑</kbd>{' '}
                <kbd className="rounded border border-line bg-surface px-1">↓</kbd> navigate
              </span>
              <span>
                <kbd className="rounded border border-line bg-surface px-1">↵</kbd> open
              </span>
              <span>
                <kbd className="rounded border border-line bg-surface px-1">esc</kbd> close
              </span>
            </span>
            <span>Member details follow privacy settings</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const index = text.toLowerCase().indexOf(q.toLowerCase())
  if (index < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <mark className="result-mark">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  )
}

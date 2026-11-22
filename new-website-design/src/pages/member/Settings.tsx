import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Accessibility,
  Bell,
  Check,
  KeyRound,
  LockKeyhole,
  Palette,
  RefreshCw,
  Settings,
  UserCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Button, ButtonLink, Card, CardBody, CardHeader, Segmented, Switch } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { usePreferences, THEMES, type ThemeId, type ThemePreview as ThemePreviewTokens } from '../../features/settings/preferences'
import { profileOf } from '../../features/social/store'
import { useSocial, useViewer } from '../../features/social/hooks'
import { ProfilePrivacy } from './ProfilePrivacy'
import { cn } from '../../lib/utils'

/**
 * A miniature of the real dashboard: page, floating rail, floating topbar,
 * content surface, typography and a control. Painted from the theme's own
 * tokens so all seven previews are visibly different.
 */
function ThemePreview({ tokens }: { tokens: ThemePreviewTokens }) {
  const navStyle = {
    backgroundColor: tokens.nav,
    border: `1px solid ${tokens.border}`,
    ...(tokens.glass
      ? { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', opacity: 0.92 }
      : null),
  }
  return (
    <span
      className="flex h-[104px] w-full gap-1.5 overflow-hidden rounded-lg p-2"
      style={{ backgroundColor: tokens.page, border: `1px solid ${tokens.border}` }}
      aria-hidden
    >
      <span className="flex w-[32px] shrink-0 flex-col gap-1 rounded-[5px] p-1" style={navStyle}>
        <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: tokens.accent }} />
        <span className="mt-1 h-[7px] w-full rounded-[2px]" style={{ backgroundColor: tokens.accent, opacity: 0.9 }} />
        <span className="h-[7px] w-full rounded-[2px]" style={{ backgroundColor: tokens.text, opacity: 0.2 }} />
        <span className="h-[7px] w-full rounded-[2px]" style={{ backgroundColor: tokens.text, opacity: 0.2 }} />
        <span className="mt-auto h-[7px] w-full rounded-[2px]" style={{ backgroundColor: tokens.text, opacity: 0.2 }} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex h-6 items-center gap-1.5 rounded-[5px] px-1.5" style={navStyle}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tokens.accent }} />
          <span className="h-1 w-8 rounded-full" style={{ backgroundColor: tokens.text, opacity: 0.55 }} />
          <span className="ml-auto h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tokens.accent, opacity: 0.9 }} />
        </span>
        <span
          className="flex min-h-0 flex-1 flex-col gap-1 rounded-[5px] p-1.5"
          style={{ backgroundColor: tokens.surface, border: `1px solid ${tokens.border}` }}
        >
          <span className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: tokens.text, opacity: 0.8 }} />
          <span className="h-1 w-full rounded-full" style={{ backgroundColor: tokens.muted, opacity: 0.5 }} />
          <span className="h-1 w-5/6 rounded-full" style={{ backgroundColor: tokens.muted, opacity: 0.35 }} />
          <span className="mt-auto flex items-center gap-1">
            <span
              className="h-3 w-9 rounded-[2px]"
              style={{ backgroundColor: tokens.accent, color: tokens.accentFg }}
            />
            <span className="h-3 w-6 rounded-[2px]" style={{ backgroundColor: tokens.text, opacity: 0.1 }} />
          </span>
        </span>
      </span>
    </span>
  )
}

type SectionId = 'general' | 'appearance' | 'account' | 'privacy' | 'notifications' | 'security' | 'accessibility'

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'account', label: 'Account', icon: UserCircle },
  { id: 'privacy', label: 'Privacy', icon: LockKeyhole },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: KeyRound },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
]

export function MemberSettings() {
  useSocial()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const viewer = useViewer()
  const profile = profileOf(viewer)
  const { preferences, setTheme, update, reset } = usePreferences()

  const requested = params.get('section') as SectionId | null
  const section: SectionId = SECTIONS.some((entry) => entry.id === requested) ? (requested as SectionId) : 'general'

  /* Search results can deep-link a theme: /member/settings?section=appearance&theme=dark-green */
  const requestedTheme = params.get('theme')
  useEffect(() => {
    if (section !== 'appearance' || !requestedTheme) return
    if (!THEMES.some((theme) => theme.id === requestedTheme)) return
    if (preferences.theme !== requestedTheme) setTheme(requestedTheme as ThemeId)
  }, [section, requestedTheme, preferences.theme, setTheme])

  const select = (id: SectionId) => {
    const next = new URLSearchParams(params)
    next.set('section', id)
    next.delete('theme')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader title="Settings" description="Preferences apply to your account on this device." />

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <nav aria-label="Settings sections" className="-mx-1 min-w-0">
          <ul className="flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-thin lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:px-0">
            {SECTIONS.map((entry) => {
              const Icon = entry.icon
              const active = section === entry.id
              return (
                <li key={entry.id} className="shrink-0 lg:w-full">
                  <button
                    type="button"
                    onClick={() => select(entry.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-10 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 text-[0.8125rem] font-medium transition-colors',
                      active ? 'bg-brand-50 text-brand-900' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-950',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', active ? 'text-brand-700' : 'text-ink-400')} aria-hidden />
                    {entry.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          {section === 'general' ? (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Language and region" />
                <CardBody className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.8125rem] font-medium text-ink-900">Language</p>
                      <p className="text-[0.75rem] text-ink-500">English (United Kingdom) is the only language this prototype ships with.</p>
                    </div>
                    <Badge tone="outline">English</Badge>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <div>
                      <p className="text-[0.8125rem] font-medium text-ink-900">Time zone</p>
                      <p className="text-[0.75rem] text-ink-500">Detected from this browser. It is not stored on an account.</p>
                    </div>
                    <Badge tone="outline">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[0.75rem] leading-5 text-ink-500">
                    Theme, text size, motion and contrast preferences are saved on this device. The prototype has no
                    server-side preference API.
                  </p>
                  <Button variant="outline" size="sm" onClick={reset} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
                    Reset preferences
                  </Button>
                </CardBody>
              </Card>
            </div>
          ) : null}

          {section === 'appearance' ? (
            <div className="space-y-5">
              <Card>
                <CardHeader
                  title="Theme"
                  description="Selecting a theme repaints the entire dashboard immediately."
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => update({ theme: 'fresh' })}
                      iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
                    >
                      Reset to Fresh Green
                    </Button>
                  }
                />
                <CardBody>
                  <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {THEMES.map((theme) => {
                      const active = preferences.theme === theme.id
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setTheme(theme.id)}
                          className={cn(
                            'group rounded-xl border p-3 text-left transition-[border-color,box-shadow,transform] duration-200',
                            active
                              ? 'border-accent shadow-[0_0_0_1px_rgb(var(--accent))]'
                              : 'border-line hover:border-ink-300 hover:shadow-xs',
                          )}
                        >
                          <ThemePreview tokens={theme.preview} />
                          <span className="mt-2.5 flex items-center justify-between gap-2">
                            <span className="text-[0.8125rem] font-semibold text-ink-900">{theme.label}</span>
                            {active ? (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-fg">
                                <Check className="h-3 w-3" aria-hidden />
                              </span>
                            ) : (
                              <span className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-300">{theme.dark ? 'Dark' : 'Light'}</span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[0.6875rem] leading-4 text-ink-500">{theme.description}</span>
                        </button>
                      )
                    })}
                  </div>
                </CardBody>
              </Card>
              <p className="text-[0.6875rem] leading-5 text-ink-400">
                Glass keeps content surfaces opaque for readability and applies blur only to the floating navigation.
              </p>
            </div>
          ) : null}

          {section === 'account' ? (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Account" action={<Badge tone="outline">{user?.role ?? 'member'}</Badge>} />
                <CardBody>
                  <dl className="divide-y divide-line">
                    <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                      <dt className="text-[0.75rem] text-ink-500">Display name</dt>
                      <dd className="text-[0.8125rem] font-medium text-ink-900">{user?.name ?? '—'}</dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <dt className="text-[0.75rem] text-ink-500">Email</dt>
                      <dd className="text-[0.8125rem] font-medium text-ink-900">{user?.email ?? '—'}</dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <dt className="text-[0.75rem] text-ink-500">Username</dt>
                      <dd className="font-mono text-[0.8125rem] font-medium text-ink-900">
                        {profile ? `@${profile.username}` : '—'}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
                      <dt className="text-[0.75rem] text-ink-500">Profile</dt>
                      <dd>
                        <Link to="/member/profile" className="text-[0.8125rem] font-medium text-brand-800 hover:underline">
                          Open your profile
                        </Link>
                      </dd>
                    </div>
                  </dl>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Account management" />
                <CardBody className="flex flex-wrap gap-2">
                  <ButtonLink to="/member/edit-profile" size="sm" variant="outline">
                    Edit profile
                  </ButtonLink>
                  {profile ? (
                    <ButtonLink to={`/member/members/${profile.username}`} size="sm" variant="outline">
                      View as members see you
                    </ButtonLink>
                  ) : null}
                  <ButtonLink to="/member/profile?tab=digital-id" size="sm" variant="ghost">
                    Digital ID
                  </ButtonLink>
                  <ButtonLink to="/member/profile?tab=membership" size="sm" variant="ghost">
                    Membership
                  </ButtonLink>
                </CardBody>
              </Card>
              <p className="text-[0.6875rem] leading-5 text-ink-400">
                Student records, payment details and member identifiers are not editable here and are never published on a
                profile.
              </p>
            </div>
          ) : null}

          {section === 'privacy' ? (
            <div>
              <ProfilePrivacy />
            </div>
          ) : null}

          {section === 'notifications' ? (
            <div className="space-y-5">
              <Card>
                <CardHeader title="In-app notifications" action={<Badge tone="green" dot>On</Badge>} />
                <CardBody className="space-y-3">
                  <p className="text-[0.8125rem] leading-6 text-ink-600">
                    Follow requests, competition results and session changes are delivered to the notification control in
                    the dashboard header.
                  </p>
                  <ul className="grid gap-2 text-[0.75rem] text-ink-600 sm:grid-cols-2">
                    {['Follow requests and approvals', 'Competition results', 'Learning and session changes', 'Event updates', 'Team updates'].map(
                      (item) => (
                        <li key={item} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                          <Check className="h-3.5 w-3.5 text-brand-700" aria-hidden />
                          {item}
                        </li>
                      ),
                    )}
                  </ul>
                  <ButtonLink to="/member/notifications" size="sm" variant="outline">
                    Open notifications
                  </ButtonLink>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Email and per-category delivery" />
                <CardBody>
                  <p className="text-[0.8125rem] leading-6 text-ink-600">
                    This prototype has no email delivery service or saved notification preferences, so no toggles are shown
                    here. Adding them requires backend notification preferences; a switch that changes nothing would be
                    misleading.
                  </p>
                </CardBody>
              </Card>
            </div>
          ) : null}

          {section === 'security' ? (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Password" />
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[0.8125rem] leading-6 text-ink-600">
                    Change the password used to sign in to this prototype account.
                  </p>
                  <ButtonLink to="/member/change-password" size="sm" variant="outline">
                    Change password
                  </ButtonLink>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Current session" />
                <CardBody className="space-y-3">
                  <dl className="space-y-2 text-[0.75rem]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <dt className="text-ink-500">Signed in as</dt>
                      <dd className="font-medium text-ink-900">{user?.email}</dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <dt className="text-ink-500">Role</dt>
                      <dd className="font-medium capitalize text-ink-900">{user?.role}</dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <dt className="text-ink-500">Device</dt>
                      <dd className="font-medium text-ink-900">This browser</dd>
                    </div>
                  </dl>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logout()
                      navigate('/')
                    }}
                  >
                    Sign out
                  </Button>
                </CardBody>
              </Card>
              <p className="text-[0.6875rem] leading-5 text-ink-400">
                Session management and account recovery are not implemented in this prototype, so no controls for them are
                shown.
              </p>
            </div>
          ) : null}

          {section === 'accessibility' ? (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Reading and motion" />
                <CardBody className="space-y-5">
                  <div>
                    <p className="mb-2 text-[0.8125rem] font-medium text-ink-900">Text size</p>
                    <Segmented
                      label="Text size"
                      value={preferences.textScale}
                      onChange={(value) => update({ textScale: value as typeof preferences.textScale })}
                      options={[
                        { value: 'compact', label: 'Compact' },
                        { value: 'default', label: 'Default' },
                        { value: 'large', label: 'Large' },
                      ]}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-[0.8125rem] font-medium text-ink-900">Motion</p>
                    <Segmented
                      label="Motion preference"
                      value={preferences.motion}
                      onChange={(value) => update({ motion: value as typeof preferences.motion })}
                      options={[
                        { value: 'system', label: 'Follow system' },
                        { value: 'reduced', label: 'Reduced' },
                      ]}
                    />
                  </div>
                  <div className="border-t border-line pt-4">
                    <Switch
                      checked={preferences.contrast === 'high'}
                      onCheckedChange={(checked) => update({ contrast: checked ? 'high' : 'normal' })}
                      label="High contrast"
                      description="Strengthens borders and secondary text across the interface."
                    />
                  </div>
                </CardBody>
              </Card>
              <p className="text-[0.6875rem] leading-5 text-ink-400">
                Reduced motion also follows the operating-system setting automatically. Interface scaling beyond text size
                is not available.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default MemberSettings

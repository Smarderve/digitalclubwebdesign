import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Accessibility, Bell, Check, KeyRound, LockKeyhole, Palette, RefreshCw, Settings, UserCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Button, ButtonLink, Card, CardBody, CardHeader, Segmented, Switch } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { THEMES, usePreferences, type ThemeId } from '../../features/settings/preferences'
import { profileOf } from '../../features/social/store'
import { useSocial, useViewer } from '../../features/social/hooks'
import { ProfilePrivacy } from './ProfilePrivacy'
import { AppearancePanel } from '../../components/app/AppearancePanel'
import { cn } from '../../lib/utils'

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

  /* Search results can deep-link a theme: /member/settings?section=appearance&theme=forest */
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
      <PageHeader title="Settings" />

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <nav aria-label="Settings sections" className="-mx-1 min-w-0">
          <ul className="flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:px-0">
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
                      'flex h-11 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 text-[0.8125rem] font-medium transition-colors',
                      active
                        ? 'bg-nav-active text-nav-active-text'
                        : 'text-ink-600 hover:bg-nav-hover hover:text-ink-950',
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', active ? 'opacity-100' : 'text-ink-400')} aria-hidden />
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
                <CardBody className="divide-y divide-line">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                    <p className="text-[0.8125rem] font-medium text-ink-900">Language</p>
                    <Badge tone="outline">English</Badge>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                    <p className="text-[0.8125rem] font-medium text-ink-900">Time zone</p>
                    <Badge tone="outline">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[0.8125rem] font-medium text-ink-900">Preferences saved on this device</p>
                  <Button variant="outline" size="sm" onClick={reset} iconLeft={<RefreshCw className="h-3.5 w-3.5" />}>
                    Reset preferences
                  </Button>
                </CardBody>
              </Card>
            </div>
          ) : null}

          {section === 'appearance' ? (
            <AppearancePanel />
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
                          Open profile
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
                      Public view
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
                <CardHeader
                  title="In-app notifications"
                  action={
                    <Badge tone="green" dot>
                      On
                    </Badge>
                  }
                />
                <CardBody className="space-y-3">
                  <ul className="grid gap-2 text-[0.75rem] text-ink-600 sm:grid-cols-2">
                    {[
                      'Follow requests and approvals',
                      'Competition results',
                      'Learning and session changes',
                      'Event updates',
                      'Team updates',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                        <Check className="h-3.5 w-3.5 text-brand-700" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink to="/member/notifications" size="sm" variant="outline">
                    Open notifications
                  </ButtonLink>
                </CardBody>
              </Card>
            </div>
          ) : null}

          {section === 'security' ? (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Password" />
                <CardBody>
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
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default MemberSettings

import { Link } from 'react-router-dom'
import { Eye, Globe, Lock, LockKeyhole, Search, ShieldCheck } from 'lucide-react'
import { SECTION_META } from '../../features/social/directory'
import { useSocial, useViewer } from '../../features/social/hooks'
import {
  blockedMembers,
  profileOf,
  resetPrivacyDefaults,
  unblockMember,
  updatePrivacy,
} from '../../features/social/store'
import type { SectionKey } from '../../features/social/types'
import { Alert, Badge, Button, ButtonLink, Card, CardBody, CardHeader, RadioCard, Switch } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

const GROUPS = ['Identity', 'About', 'Learning', 'Work', 'Club']

export function ProfilePrivacy() {
  useSocial()
  const viewer = useViewer()
  const { push } = useToast()
  const profile = profileOf(viewer)

  if (!profile) {
    return <p className="pt-5 text-[0.8125rem] text-ink-500">Sign in to manage profile privacy.</p>
  }

  const blocked = blockedMembers(viewer)
  const setSection = (key: SectionKey, value: boolean) => {
    const result = updatePrivacy(viewer, { sections: { [key]: value } })
    if (!result.ok) push({ tone: 'error', title: 'Setting not saved', description: result.error })
  }

  return (
    <div className="space-y-5 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.75rem] leading-5 text-ink-500">
          These settings are enforced by the profile service for every request, not just hidden in the interface.
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/member/members/${profile.username}`} size="sm" variant="outline" iconLeft={<Eye className="h-3.5 w-3.5" />}>
            View public profile
          </ButtonLink>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Profile visibility"
          description="A private profile shows only your name, username and follower counts until a request is approved."
          action={<Badge tone={profile.visibility === 'public' ? 'green' : 'outline'} dot>{profile.visibility === 'public' ? 'Public' : 'Private'}</Badge>}
        />
        <CardBody className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <RadioCard
              name="visibility"
              value="public"
              checked={profile.visibility === 'public'}
              onChange={() => {
                const result = updatePrivacy(viewer, { visibility: 'public' })
                if (!result.ok) push({ tone: 'error', title: 'Setting not saved', description: result.error })
              }}
              label={
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-brand-700" aria-hidden /> Public profile
                </span>
              }
              description="Members can discover you and see the sections you have chosen to publish. Contact details stay private."
            />
            <RadioCard
              name="visibility"
              value="private"
              checked={profile.visibility === 'private'}
              onChange={() => {
                const result = updatePrivacy(viewer, { visibility: 'private' })
                if (!result.ok) push({ tone: 'error', title: 'Setting not saved', description: result.error })
              }}
              label={
                <span className="inline-flex items-center gap-1.5">
                  <LockKeyhole className="h-3.5 w-3.5" aria-hidden /> Private profile
                </span>
              }
              description="Only approved followers can see your protected sections. New accounts start here."
            />
          </div>
          <p className="text-[0.6875rem] text-ink-400">Last updated {formatDate(profile.updatedAt)}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Member discovery" description="Controls whether your account appears in the navbar member search." />
        <CardBody className="space-y-4">
          <Switch
            checked={profile.discoverable}
            onCheckedChange={(checked) => {
              const result = updatePrivacy(viewer, { discoverable: checked })
              if (result.ok) {
                push({
                  tone: 'success',
                  title: checked ? 'You can appear in member search' : 'You are hidden from member search',
                  description: checked ? undefined : 'Your profile link and follower relationships still work.',
                })
              } else push({ tone: 'error', title: 'Setting not saved', description: result.error })
            }}
            label="Discoverable in member search"
            description="Your display name, username, tagline and published skills can appear in results."
          />
          <div className="flex items-start gap-2 rounded-sm border border-line bg-ink-50/60 px-3 py-2.5 text-[0.75rem] leading-5 text-ink-500">
            <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
            Turning discovery off excludes you from ordinary member search. It does not unpublish your profile link.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Section visibility"
          description="Applies only when your profile is visible. Email, phone, student number and digital ID data are never published."
        />
        <CardBody className="space-y-5">
          {GROUPS.map((group) => (
            <div key={group}>
              <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-400">{group}</p>
              <div className="divide-y divide-line border-y border-line">
                {SECTION_META.filter((section) => section.group === group).map((section) => (
                  <div key={section.key} className="py-3">
                    <Switch
                      checked={profile.sections[section.key]}
                      onCheckedChange={(checked) => setSection(section.key, checked)}
                      label={section.label}
                      description={section.description}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.6875rem] text-ink-400">Changes take effect immediately for future profile requests.</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const result = resetPrivacyDefaults(viewer)
                if (result.ok) push({ tone: 'info', title: 'Privacy reset', description: 'Your profile is private and discovery is off.' })
                else push({ tone: 'error', title: 'Could not reset settings', description: result.error })
              }}
            >
              Reset to defaults
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Blocked members"
          description="Blocked members cannot follow you or see your protected profile information."
          action={<Badge tone="outline">{blocked.length}</Badge>}
        />
        <CardBody>
          {blocked.length ? (
            <ul className="divide-y divide-line">
              {blocked.map(({ profile: member, block }) => (
                <li key={member.username} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link to={`/members/${member.username}`} className="text-[0.8125rem] font-medium text-ink-900 hover:underline">
                      {member.displayName}
                    </Link>
                    <p className="font-mono text-[0.6875rem] text-ink-400">@{member.username} · blocked {formatDate(block.createdAt)}</p>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    iconLeft={<Lock className="h-3 w-3" />}
                    onClick={() => {
                      const result = unblockMember(viewer, member.username)
                      if (result.ok) push({ tone: 'success', title: `${member.displayName} unblocked` })
                      else push({ tone: 'error', title: 'Could not unblock', description: result.error })
                    }}
                  >
                    Unblock
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.8125rem] text-ink-500">You have not blocked anyone.</p>
          )}
        </CardBody>
      </Card>

      <Alert tone="success" title="What always stays private">
        <span className="inline-flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
          Your email address, phone number, student identification number, login credentials, digital ID data and membership
          payment records are never included in a public profile, search result or preview, regardless of these settings.
        </span>
      </Alert>
    </div>
  )
}

export default ProfilePrivacy

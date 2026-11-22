import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Copy,
  Eye,
  FolderGit2,
  Github,
  Globe,
  Linkedin,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  TriangleAlert,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Avatar, Badge, Card, CardBody, CardHeader, Dialog, DialogContent, EmptyState, Pagination, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from '../../components/ui/dropdown'
import { Field, Select, Textarea } from '../../components/ui/field'
import { cn, formatDate } from '../../lib/utils'
import { FollowButton } from '../../features/social/FollowButton'
import { MemberRow } from '../../features/social/MemberRow'
import { ActivityMatrix } from '../../features/social/ActivityMatrix'
import { useSocial } from '../../features/social/hooks'
import {
  GUEST,
  REPORT_REASONS,
  accessProfile,
  blockMember,
  listFollowers,
  listFollowing,
  reportMember,
  unblockMember,
  viewerFromUser,
  relationshipFor,
} from '../../features/social/store'
import {
  achievementsFor,
  activityFor,
  learningFor,
  membershipFor,
  projectsFor,
} from '../../features/social/directory'
import type { ActivityEntry, MemberSearchItem, ReportReason } from '../../features/social/types'

const activityLabels: Record<ActivityEntry['kind'], string> = {
  warmup: 'Warmup',
  session: 'Session',
  competition: 'Competition',
  project: 'Project',
  achievement: 'Achievement',
  event: 'Event',
  membership: 'Membership',
  joined: 'Joined',
}

export function MemberProfilePage({ embedded = false }: { embedded?: boolean } = {}) {
  useSocial()
  const { username } = useParams()
  const { user } = useAuth()
  const { push } = useToast()
  const [params, setParams] = useSearchParams()
  const [preview, setPreview] = useState(false)
  const [listKind, setListKind] = useState<'followers' | 'following' | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [blockedView, setBlockedView] = useState(false)
  const shell = embedded ? '' : 'container-editorial section'

  /* Preview belongs to one profile; moving to another member exits it. */
  useEffect(() => {
    setPreview(false)
    setListKind(null)
    setBlockedView(false)
  }, [username])

  const actualViewer = viewerFromUser(user)
  const viewer = preview ? GUEST : actualViewer
  const access = accessProfile(viewer, username ?? '')
  const profile = access.profile
  const isOwner = access.isOwner && !preview

  if (access.status === 'not_found') {
    return (
      <div className={shell}>
        <EmptyState
          icon={<UserRound className="h-4 w-4" aria-hidden />}
          title="Member not found"
          description="This profile link does not match a member of KIUT Digital Club."
          action={<Link to="/member" className="text-[0.8125rem] font-semibold text-brand-800 hover:underline">Back to your dashboard</Link>}
        />
      </div>
    )
  }

  if (access.status === 'unavailable') {
    return (
      <div className="container-editorial section">
        <EmptyState
          icon={<LockKeyhole className="h-4 w-4" aria-hidden />}
          title="This profile isn't available"
          description="The member may have changed their visibility settings, or the link may be out of date."
          action={<Link to="/member" className="text-[0.8125rem] font-semibold text-brand-800 hover:underline">Back to your dashboard</Link>}
        />
      </div>
    )
  }

  if (access.status === 'suspended') {
    return (
      <div className="container-editorial section">
        <EmptyState
          icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          title="This account is suspended"
          description="Suspended accounts do not accept follows and do not publish profile information."
        />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container-editorial section">
        <EmptyState
          icon={<UserRound className="h-4 w-4" aria-hidden />}
          title="Member not found"
          description="This profile link does not match a member of KIUT Digital Club."
        />
      </div>
    )
  }

  const restricted = access.status === 'private'
  const activity = access.visible.activity ? activityFor(profile.memberId) : []
  const achievements = access.visible.achievements ? achievementsFor(profile.memberId) : []
  const projects = access.visible.projects
    ? projectsFor(profile.memberId).filter((project) => project.visibility === 'Public' || isOwner)
    : []
  const learning = access.visible.activity ? learningFor(profile.memberId) : null
  const membership = access.visible.membership ? membershipFor(profile.memberId) : null
  const sections = [
    { value: 'overview', label: 'Overview', available: true },
    { value: 'activity', label: 'Activity', available: access.visible.activity },
    { value: 'achievements', label: 'Achievements', available: access.visible.achievements },
    { value: 'projects', label: 'Projects', available: access.visible.projects },
    { value: 'skills', label: 'Skills', available: access.visible.skills },
  ]
  const availableSections = sections.filter((section) => section.available)
  const requestedTab = params.get('tab') ?? 'overview'
  const currentTab = availableSections.some((section) => section.value === requestedTab) ? requestedTab : 'overview'
  const counts = access.counts
  const canSeeLists = access.isOwner || access.visible.socialLists

  return (
    <div className={shell}>
      <div className={cn('mb-4 flex flex-wrap items-center justify-between gap-3', embedded && 'justify-end')}>
        {embedded ? null : (
          <Link to={actualViewer ? '/member' : '/members'} className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 hover:text-brand-800">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {actualViewer ? 'Member dashboard' : 'Community'}
          </Link>
        )}
        {isOwner ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="xs" variant="outline" iconLeft={<Eye className="h-3.5 w-3.5" />} onClick={() => setPreview(true)}>
              Preview as visitor
            </Button>
            <Link to="/member/edit-profile" className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-ink-200 px-2.5 text-[0.75rem] text-ink-700 hover:bg-ink-50">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit profile
            </Link>
            <Link to="/member/profile?tab=privacy" className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-ink-200 px-2.5 text-[0.75rem] text-ink-700 hover:bg-ink-50">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden /> Privacy
            </Link>
          </div>
        ) : null}
      </div>

      {preview ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-info-line bg-info-soft px-4 py-3">
          <p className="text-[0.8125rem] text-ink-700">
            Previewing your profile as a signed-out visitor. Private sections are hidden by the same rules other members see.
          </p>
          <Button size="xs" variant="outline" onClick={() => setPreview(false)}>
            Exit preview
          </Button>
        </div>
      ) : null}

      <header className="border-b border-line pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={profile.displayName} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[1.75rem]">
                  {profile.displayName}
                </h1>
                {restricted ? (
                  <Badge tone="outline" className="gap-1">
                    <LockKeyhole className="h-3 w-3" aria-hidden /> Private
                  </Badge>
                ) : null}
                {membership?.active ? <Badge tone="green" dot>Active member</Badge> : null}
              </div>
              <p className="mt-0.5 font-mono text-[0.75rem] text-ink-400">@{profile.username}</p>
              {access.visible.bio && profile.tagline ? (
                <p className="mt-2 max-w-[56ch] text-[0.9375rem] leading-6 text-ink-600">{profile.tagline}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-ink-500">
                {access.visible.course ? (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpenCheck className="h-3.5 w-3.5 text-ink-400" aria-hidden /> {profile.course} · {profile.year}
                  </span>
                ) : null}
                {access.visible.membership ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-ink-400" aria-hidden /> Member since {formatDate(profile.joined)}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-[0.75rem] text-ink-600">
                <button
                  type="button"
                  onClick={() => canSeeLists && setListKind('followers')}
                  disabled={!canSeeLists}
                  className={cn('inline-flex items-center gap-1', canSeeLists && 'hover:text-brand-800 hover:underline')}
                >
                  <strong className="tabular text-ink-950">{counts?.followers ?? 0}</strong> followers
                </button>
                <button
                  type="button"
                  onClick={() => canSeeLists && setListKind('following')}
                  disabled={!canSeeLists}
                  className={cn('inline-flex items-center gap-1', canSeeLists && 'hover:text-brand-800 hover:underline')}
                >
                  <strong className="tabular text-ink-950">{counts?.following ?? 0}</strong> following
                </button>
                {!canSeeLists ? <span className="text-[0.6875rem] text-ink-400">Lists kept private</span> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {preview ? (
              <span className="rounded-sm border border-dashed border-ink-300 px-3 py-1.5 text-[0.75rem] text-ink-500">
                Follow actions are hidden in preview
              </span>
            ) : (
              <FollowButton username={profile.username} size="md" />
            )}
            {!preview ? (
              <Button
                size="icon"
                variant="outline"
                aria-label="Copy profile link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href)
                    push({ tone: 'success', title: 'Profile link copied' })
                  } catch {
                    push({ tone: 'info', title: 'Copy the address from your browser to share this profile.' })
                  }
                }}
              >
                <Copy className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            {actualViewer && !isOwner && !preview ? (
              <Dropdown>
                <DropdownTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Profile actions">
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownTrigger>
                <DropdownContent>
                  {relationshipFor(actualViewer, profile.username).state === 'blocked' ? (
                    <DropdownItem
                      icon={<UnblockIcon />}
                      onSelect={() => {
                        const result = unblockMember(actualViewer, profile.username)
                        if (result.ok) {
                          setBlockedView(false)
                          push({ tone: 'success', title: 'Member unblocked' })
                        } else push({ tone: 'error', title: 'Could not unblock', description: result.error })
                      }}
                    >
                      Unblock member
                    </DropdownItem>
                  ) : (
                    <>
                      <DropdownItem icon={<TriangleAlert className="h-3.5 w-3.5" />} onSelect={() => setReportOpen(true)}>
                        Report profile
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem destructive icon={<ShieldOff className="h-3.5 w-3.5" />} onSelect={() => setBlockOpen(true)}>
                        Block member
                      </DropdownItem>
                    </>
                  )}
                </DropdownContent>
              </Dropdown>
            ) : null}
          </div>
        </div>

        {access.visible.skills && profile.skills.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <li key={skill} className="rounded-[3px] border border-line bg-white px-2 py-1 text-[0.75rem] text-ink-700">
                {skill}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {restricted ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardBody className="py-14 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-ink-50 text-ink-500">
                <LockKeyhole className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-3 text-[1.0625rem] font-semibold text-ink-950">This profile is private</h2>
              <p className="mx-auto mt-1.5 max-w-[46ch] text-[0.8125rem] leading-6 text-ink-500">
                {relationshipFor(viewer, profile.username).hasPendingRequest
                  ? 'Your follow request is pending. This member will see it in their notifications.'
                  : 'Send a follow request. This member decides whether to approve it before any profile details are shared.'}
              </p>
              <p className="mt-3 text-[0.6875rem] text-ink-400">Use the follow control in the profile header to request access.</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Profile privacy" description="The member controls each section separately." />
            <CardBody className="space-y-2.5 text-[0.8125rem] text-ink-600">
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                Private accounts start hidden and default to this state.
              </p>
              <p className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                Only approved followers can see activity, achievements and projects.
              </p>
              <p className="text-[0.75rem] text-ink-400">
                Contact details, student numbers and digital ID data are never part of a public profile.
              </p>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Tabs
          className="mt-6"
          value={currentTab}
          onValueChange={(value) => {
            const next = new URLSearchParams(params)
            if (value === 'overview') next.delete('tab')
            else next.set('tab', value)
            setParams(next, { replace: true })
          }}
        >
          <TabsList ariaLabel="Profile sections">
            {availableSections.map((section) => (
              <TabsTrigger key={section.value} value={section.value}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 pt-6 lg:grid-cols-[1fr_296px]">
              <div className="min-w-0 space-y-6">
                {access.visible.bio ? (
                  <section>
                    <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">About</h2>
                    {profile.bio ? (
                      <p className="mt-2 max-w-[70ch] text-[0.9375rem] leading-7 text-ink-700">{profile.bio}</p>
                    ) : (
                      <p className="mt-2 text-[0.875rem] text-ink-500">This member has not added a biography yet.</p>
                    )}
                  </section>
                ) : null}

                {access.visible.skills && profile.interests.length ? (
                  <section>
                    <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Technical interests</h2>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {profile.interests.map((interest) => (
                        <li key={interest} className="rounded-[3px] border border-line bg-white px-2 py-1 text-[0.75rem] text-ink-700">
                          {interest}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {learning ? (
                  <section>
                    <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Learning progress</h2>
                    <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
                      {[
                        { label: 'Club points', value: learning.points ?? '—' },
                        { label: 'Warmups', value: learning.warmups ?? '—' },
                        { label: 'Competitions', value: learning.competitions ?? '—' },
                        { label: 'Best rank', value: learning.bestRank ? `#${learning.bestRank}` : '—' },
                      ].map((item) => (
                        <div key={item.label} className="bg-white px-3.5 py-3">
                          <p className="text-[1.125rem] font-semibold tabular text-ink-950">{item.value}</p>
                          <p className="text-[0.6875rem] text-ink-500">{item.label}</p>
                        </div>
                      ))}
                    </div>
                    {learning.team ? (
                      <p className="mt-2 text-[0.75rem] text-ink-500">Team: {learning.team}</p>
                    ) : null}
                  </section>
                ) : null}

                {access.visible.projects && projects.length ? (
                  <section>
                    <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Selected projects</h2>
                    <ul className="mt-2 divide-y divide-line border-y border-line">
                      {projects.slice(0, 3).map((project) => (
                        <li key={project.id} className="py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[0.875rem] font-medium text-ink-900">{project.title}</p>
                            <Badge tone={project.status === 'Published' ? 'green' : 'outline'}>{project.status}</Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 max-w-[70ch] text-[0.8125rem] leading-5 text-ink-500">{project.description}</p>
                          <p className="mt-1 text-[0.6875rem] text-ink-400">{project.technologies.join(' · ')}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {access.visible.achievements && achievements.length ? (
                  <section>
                    <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Recognition</h2>
                    <ul className="mt-2 space-y-2">
                      {achievements.slice(0, 3).map((achievement) => (
                        <li key={achievement.id} className="flex items-start gap-2.5 rounded-md border border-line bg-white px-3.5 py-3">
                          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                          <div className="min-w-0">
                            <p className="text-[0.8125rem] font-medium text-ink-900">{achievement.name}</p>
                            <p className="text-[0.6875rem] text-ink-400">{formatDate(achievement.date)} · {achievement.category}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>

              <aside className="space-y-4">
                {access.visible.socialLinks &&
                (profile.github || profile.linkedin || profile.website) ? (
                  <Card>
                    <CardHeader title="Links" />
                    <CardBody className="space-y-2">
                      {profile.github ? <ProfileLink href={profile.github} icon={<Github className="h-3.5 w-3.5" />}>GitHub</ProfileLink> : null}
                      {profile.linkedin ? <ProfileLink href={profile.linkedin} icon={<Linkedin className="h-3.5 w-3.5" />}>LinkedIn</ProfileLink> : null}
                      {profile.website ? <ProfileLink href={profile.website} icon={<Globe className="h-3.5 w-3.5" />}>Portfolio</ProfileLink> : null}
                    </CardBody>
                  </Card>
                ) : null}

                {access.visible.membership && membership ? (
                  <Card>
                    <CardHeader title="Membership" />
                    <CardBody className="space-y-2 text-[0.8125rem] text-ink-600">
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brand-700" aria-hidden />
                        {membership.active ? 'Active club membership' : 'Membership not active'}
                      </p>
                      <p className="text-[0.75rem] text-ink-500">
                        {membership.since ? `Member since ${formatDate(membership.since)}` : null}
                        {membership.until ? ` · valid through ${formatDate(membership.until)}` : ''}
                      </p>
                      <p className="text-[0.6875rem] text-ink-400">Payment details and student identifiers are never shown here.</p>
                    </CardBody>
                  </Card>
                ) : null}

                <Card>
                  <CardHeader
                    title="Discover"
                    description={profile.visibility === 'public' ? 'This profile is open to the community.' : 'This profile is private; approved followers see the shared sections.'}
                  />
                  <CardBody className="space-y-2 text-[0.75rem] leading-5 text-ink-500">
                    <p>Use the member search in the dashboard header to find members by name, username, skills or interests.</p>
                    {actualViewer ? (
                      <Link to="/member" className="inline-flex text-[0.75rem] font-semibold text-brand-800 hover:underline">
                        Back to dashboard
                      </Link>
                    ) : (
                      <Link to="/auth/login" className="inline-flex text-[0.75rem] font-semibold text-brand-800 hover:underline">
                        Sign in to follow members
                      </Link>
                    )}
                  </CardBody>
                </Card>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="space-y-5 pt-6">
              {isOwner && !profile.sections.activity ? (
                <div className="rounded-md border border-info-line bg-info-soft px-4 py-3 text-[0.8125rem] leading-6 text-ink-600">
                  Activity is hidden from other members. You can still see your complete history here.
                </div>
              ) : null}
              <Card>
                <CardHeader title="Activity matrix" description="Derived from recorded submissions, RSVPs, payments, session reports and awards." />
                <CardBody>
                  <ActivityMatrix entries={activity} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Recent activity" />
                {activity.length ? (
                  <ul className="divide-y divide-line">
                    {activity.slice(0, 12).map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                          {activityIcon(entry.kind)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.8125rem] font-medium text-ink-900">{entry.label}</p>
                          {entry.detail ? <p className="text-[0.75rem] text-ink-500">{entry.detail}</p> : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[0.6875rem] text-ink-400">{formatDate(entry.date)}</p>
                          <p className="text-[0.625rem] uppercase tracking-wide text-ink-300">{activityLabels[entry.kind]}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState compact className="m-5" title="No recorded activity" description="This member has no recorded platform activity in the current records." />
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="pt-6">
              {achievements.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {achievements.map((achievement) => (
                    <li key={achievement.id} className="rounded-lg border border-line bg-white p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                          <Trophy className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.875rem] font-semibold text-ink-950">{achievement.name}</p>
                          <p className="mt-0.5 text-[0.8125rem] leading-5 text-ink-500">{achievement.description}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge tone="outline">{achievement.category}</Badge>
                            {achievement.verified ? (
                              <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium text-brand-800">
                                <ShieldCheck className="h-3 w-3" aria-hidden /> Verified by club records
                              </span>
                            ) : null}
                            <span className="text-[0.625rem] text-ink-400">{formatDate(achievement.date)}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<Trophy className="h-4 w-4" aria-hidden />} title="No achievements yet" description="Awards and judged competition placements appear here when the club records them." />
              )}
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <div className="space-y-4 pt-6">
              {projects.length ? (
                projects.map((project) => (
                  <Card key={project.id}>
                    <CardBody>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-[1rem] font-semibold text-ink-950">{project.title}</h2>
                          <p className="mt-0.5 text-[0.75rem] text-ink-400">{project.technologies.join(' · ')} · updated {formatDate(project.updated)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={project.visibility === 'Public' ? 'green' : 'outline'}>{project.visibility}</Badge>
                          <Badge tone={project.status === 'Published' ? 'green' : 'neutral'}>{project.status}</Badge>
                        </div>
                      </div>
                      <p className="mt-2 max-w-[74ch] text-[0.875rem] leading-6 text-ink-600">{project.description}</p>
                      {project.link ? (
                        <a href={project.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[0.75rem] font-semibold text-brand-800 hover:underline">
                          View project <Globe className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                    </CardBody>
                  </Card>
                ))
              ) : (
                <EmptyState icon={<FolderGit2 className="h-4 w-4" aria-hidden />} title="No public projects" description="This member has not published a project that is visible to you." />
              )}
              {isOwner ? (
                <p className="text-[0.75rem] text-ink-500">
                  Private drafts stay visible only to you. <Link to="/member/projects" className="font-semibold text-brand-800 hover:underline">Manage projects</Link>
                </p>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <div className="grid gap-5 pt-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Skills and tools" description="Added by the member from their project records." />
                <CardBody>
                  {profile.skills.length ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {profile.skills.map((skill) => (
                        <li key={skill} className="rounded-[3px] border border-line bg-ink-50 px-2 py-1 text-[0.75rem] text-ink-700">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[0.8125rem] text-ink-500">No skills listed yet.</p>
                  )}
                  <p className="mt-3 text-[0.6875rem] text-ink-400">Self-declared — not a verified assessment.</p>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Technical interests" />
                <CardBody>
                  {profile.interests.length ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {profile.interests.map((interest) => (
                        <li key={interest} className="rounded-[3px] border border-line bg-ink-50 px-2 py-1 text-[0.75rem] text-ink-700">
                          {interest}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[0.8125rem] text-ink-500">No interests listed yet.</p>
                  )}
                </CardBody>
              </Card>
              <Card className="lg:col-span-2">
                <CardBody className="flex items-start gap-2.5 text-[0.75rem] leading-5 text-ink-500">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                  Verified skills will appear separately when the club records an assessment or judged result. Self-declared skills are never labelled as verified.
                </CardBody>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <SocialListDialog
        open={listKind !== null}
        kind={listKind ?? 'followers'}
        onOpenChange={(open) => setListKind(open ? listKind ?? 'followers' : null)}
        username={profile.username}
        displayName={profile.displayName}
        viewer={viewer}
        linkBase={embedded ? '/member/members' : '/members'}
      />

      {actualViewer && !isOwner ? (
        <>
          <ReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            viewer={actualViewer}
            target={profile.username}
            targetName={profile.displayName}
          />
          <BlockDialog
            open={blockOpen}
            onOpenChange={setBlockOpen}
            viewer={actualViewer}
            target={profile.username}
            targetName={profile.displayName}
          />
        </>
      ) : null}

      {actualViewer && !isOwner && relationshipFor(actualViewer, profile.username).state === 'blocked' && !blockedView ? (
        <div className="mt-6 rounded-md border border-warning-line bg-warning-soft px-4 py-3 text-[0.8125rem] text-ink-700">
          You blocked this member. They cannot follow you or see your protected profile information.
        </div>
      ) : null}
    </div>
  )
}

function UnblockIcon() {
  return <CheckCircle2 className="h-3.5 w-3.5" />
}

function ProfileLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const url = href.startsWith('http') ? href : `https://${href}`
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-[0.75rem] text-ink-600 hover:border-ink-300">
      {icon}
      {children}
    </a>
  )
}

function activityIcon(kind: ActivityEntry['kind']) {
  const props = { className: 'h-3.5 w-3.5', 'aria-hidden': true } as const
  switch (kind) {
    case 'warmup':
      return <Sparkles {...props} />
    case 'session':
      return <BookOpenCheck {...props} />
    case 'competition':
      return <Trophy {...props} />
    case 'project':
      return <FolderGit2 {...props} />
    case 'achievement':
      return <ShieldCheck {...props} />
    case 'event':
      return <CalendarDays {...props} />
    case 'membership':
      return <CheckCircle2 {...props} />
    default:
      return <UserRound {...props} />
  }
}

function SocialListDialog({
  open,
  onOpenChange,
  username,
  displayName,
  kind,
  viewer,
  linkBase,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  displayName: string
  kind: 'followers' | 'following'
  viewer: string | null
  linkBase?: string
}) {
  const [page, setPage] = useState(1)
  const result = kind === 'followers' ? listFollowers(viewer, username) : listFollowing(viewer, username)
  const members: MemberSearchItem[] = result.ok ? result.data : []
  const pageSize = 8
  const pageCount = Math.max(1, Math.ceil(members.length / pageSize))
  const current = Math.min(page, pageCount)
  const visible = members.slice((current - 1) * pageSize, current * pageSize)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={kind === 'followers' ? `Followers of ${displayName}` : `${displayName} is following`}
        description={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}
      >
        {!result.ok ? (
          <p className="py-6 text-center text-[0.8125rem] text-ink-500">{result.error}</p>
        ) : members.length ? (
          <>
            <ul className="divide-y divide-line">
              {visible.map((member) => (
                <li key={member.username}>
                  <MemberRow member={member} linkBase={linkBase} />
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Pagination
                page={current}
                pageCount={pageCount}
                onChange={setPage}
                totalLabel={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}
              />
            </div>
          </>
        ) : (
          <EmptyState compact title="Nobody here yet" description={kind === 'followers' ? 'No members follow this account yet.' : 'This member does not follow anyone yet.'} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReportDialog({
  open,
  onOpenChange,
  viewer,
  target,
  targetName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewer: string
  target: string
  targetName: string
}) {
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0])
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setSubmitted(false)
          setError(null)
          setDescription('')
        }
      }}
    >
      <DialogContent
        title={submitted ? 'Report submitted' : `Report ${targetName}`}
        description={submitted ? undefined : 'Reports are reviewed by club administrators. The reported member is not told who reported them.'}
        size="sm"
      >
        {submitted ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-brand-700" aria-hidden />
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              Your report has been recorded for administrator review. Thank you for helping keep the community safe.
            </p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              const result = reportMember(viewer, target, reason, description)
              if (result.ok) setSubmitted(true)
              else setError(result.error)
            }}
          >
            <Field label="Reason" htmlFor="report-reason" required>
              <Select id="report-reason" value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
                {REPORT_REASONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="What happened?" htmlFor="report-detail" optional hint="Do not include passwords or private contact details.">
              <Textarea
                id="report-detail"
                rows={4}
                maxLength={1000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the issue…"
              />
            </Field>
            {error ? <p className="text-[0.75rem] font-medium text-danger">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="danger">
                Submit report
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function BlockDialog({
  open,
  onOpenChange,
  viewer,
  target,
  targetName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewer: string
  target: string
  targetName: string
}) {
  const { push } = useToast()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Block ${targetName}?`}
        description="Blocking removes any follow relationship between you, cancels pending requests and prevents new ones. They will not be notified."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                const result = blockMember(viewer, target)
                if (result.ok) push({ tone: 'success', title: `${targetName} was blocked.` })
                else push({ tone: 'error', title: 'Could not block member', description: result.error })
                onOpenChange(false)
              }}
            >
              Block member
            </Button>
          </>
        }
      >
        <p className="text-[0.8125rem] leading-6 text-ink-600">
          Their profile and activity will be unavailable to you, and your profile will be unavailable to them.
        </p>
      </DialogContent>
    </Dialog>
  )
}

export default MemberProfilePage

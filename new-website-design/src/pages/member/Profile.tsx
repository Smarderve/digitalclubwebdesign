import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Github, Globe, Linkedin, LockKeyhole, Mail, Phone, ShieldCheck } from 'lucide-react'
import { memberApi } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import { Avatar, Badge, Card, CardBody, CardHeader, Progress, StatusBadge, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { formatDate } from '../../lib/utils'
import { DigitalId } from './DigitalId'
import { Membership } from './Membership'
import { Rewards } from './Rewards'
import { ProfileSocial } from './ProfileSocial'
import { ProfilePrivacy } from './ProfilePrivacy'

const PROFILE_TABS = ['overview', 'social', 'privacy', 'digital-id', 'membership', 'rewards'] as const

function linkHref(value: string | null) {
  if (!value) return null
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

export function MemberProfile() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab = PROFILE_TABS.includes(requested as (typeof PROFILE_TABS)[number]) ? (requested as string) : 'overview'

  const { data, loading, error, reload } = useMemberData(
    () =>
      Promise.all([memberApi.profile(), memberApi.projects(), memberApi.rewards()]).then(
        ([profile, projects, rewards]) => ({ profile, projects, rewards }),
      ),
    [],
  )

  if (loading && !data) {
    return (
      <>
        <PageHeader title="My profile" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Profile' }]} />
        <LoadingBlock rows={4} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="My profile" breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Profile' }]} />
        <ErrorBlock message={error ?? 'Your profile could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const { profile, projects, rewards } = data
  const earned = rewards.trophies.filter((trophy) => trophy.earned)
  const membershipsActive = profile.membership.state === 'valid'
  const github = linkHref(profile.github)
  const linkedin = linkHref(profile.linkedin)

  return (
    <>
      <PageHeader
        title="My profile"
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Profile' }]}
        actions={
          <ButtonLink to="/member/edit-profile" size="sm">
            Edit profile
          </ButtonLink>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = new URLSearchParams(params)
          if (value === 'overview') next.delete('tab')
          else next.set('tab', value)
          setParams(next, { replace: true })
        }}
      >
        <TabsList ariaLabel="Profile sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="digital-id">Digital ID</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-5 pt-5 lg:grid-cols-[320px_1fr]">
            <div className="space-y-5">
              <Card>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <Avatar name={profile.full_name} src={profile.avatar_url} size="xl" />
                    <div className="min-w-0">
                      <h2 className="text-[1.0625rem] font-semibold text-ink-950">{profile.full_name}</h2>
                      <p className="text-[0.75rem] text-ink-500">{profile.title ?? 'Member'}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone={membershipsActive ? 'green' : 'outline'} dot>
                          {membershipsActive ? 'Active member' : 'Membership inactive'}
                        </Badge>
                        <Badge tone="outline">{profile.year ?? 'Year not set'}</Badge>
                      </div>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[0.75rem]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Member ID</dt>
                      <dd className="font-mono text-ink-900">{profile.member_number ?? 'Not issued'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Course</dt>
                      <dd className="max-w-[62%] text-right font-medium text-ink-900">{profile.course ?? 'Not set'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Joined</dt>
                      <dd className="font-medium text-ink-900">{profile.joined_at ? formatDate(profile.joined_at) : '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Membership</dt>
                      <dd className="font-medium text-ink-900">
                        {profile.membership.valid_until ? `Until ${formatDate(profile.membership.valid_until)}` : 'Not active'}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">Club standing</p>
                    <div className="mt-2">
                      <Progress
                        value={rewards.points}
                        max={rewards.next_trophy?.points_required ?? Math.max(1, rewards.points)}
                      />
                    </div>
                    <p className="mt-1.5 text-[0.75rem] text-ink-500">
                      {rewards.points} points · {rewards.tier ? rewards.tier.name : 'No tier yet'}
                    </p>
                  </div>

                  {github || linkedin ? (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                      {github ? (
                        <a
                          href={github}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-[0.75rem] text-ink-600 hover:border-ink-300"
                        >
                          <Github className="h-3.5 w-3.5" aria-hidden />
                          GitHub
                        </a>
                      ) : null}
                      {linkedin ? (
                        <a
                          href={linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-[0.75rem] text-ink-600 hover:border-ink-300"
                        >
                          <Linkedin className="h-3.5 w-3.5" aria-hidden />
                          LinkedIn
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Account" description="Contact details are only visible to you and club administrators." />
                <CardBody className="space-y-3">
                  <div className="flex items-center gap-2.5 text-[0.8125rem] text-ink-700">
                    <Mail className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                    {profile.email}
                  </div>
                  <div className="flex items-center gap-2.5 text-[0.8125rem] text-ink-700">
                    <Phone className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                    {profile.phone ?? 'No phone number on record'}
                  </div>
                  <div className="flex flex-col gap-2 border-t border-line pt-3">
                    <Link to="/member/change-password" className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-brand-800 hover:underline">
                      <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
                      Change password
                    </Link>
                    <Link to="/member/profile?tab=membership" className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-brand-800 hover:underline">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                      Membership details
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="space-y-5">
              <Card>
                <CardHeader title="About" description="This is what other members see on your public profile." />
                <CardBody className="space-y-4">
                  <p className="text-[0.875rem] leading-7 text-ink-600">
                    {profile.bio?.trim() || 'You have not written a biography yet.'}
                  </p>
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">Areas of interest</p>
                    {profile.areas_of_interest.length ? (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {profile.areas_of_interest.map((interest) => (
                          <li key={interest} className="rounded-[4px] border border-line bg-ink-50 px-2 py-1 text-[0.75rem] text-ink-700">
                            {interest}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[0.75rem] text-ink-500">No interests listed yet.</p>
                    )}
                  </div>
                  <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                    {[
                      { label: 'Club points', value: rewards.points },
                      { label: 'Projects', value: projects.length },
                      { label: 'Trophies earned', value: earned.length },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface px-4 py-3">
                        <p className="text-[1.125rem] font-semibold tabular text-ink-950">{item.value}</p>
                        <p className="text-[0.6875rem] text-ink-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="My projects"
                  description="Projects attached to your member profile."
                  action={
                    <Link to="/member/projects" className="text-[0.75rem] font-medium text-brand-800 hover:underline">
                      Manage
                    </Link>
                  }
                />
                {projects.length ? (
                  <div className="divide-y divide-line">
                    {projects.map((project) => (
                      <div key={project.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="text-[0.8125rem] font-medium text-ink-900">{project.title}</p>
                          <p className="mt-0.5 truncate text-[0.6875rem] text-ink-500">
                            {project.technologies.length ? project.technologies.join(', ') : 'No technologies listed'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={project.is_public ? 'green' : 'outline'}>{project.is_public ? 'Public' : 'Private'}</Badge>
                          <StatusBadge status={project.is_public ? 'published' : 'draft'} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-[0.75rem] text-ink-500">
                    You have not added a project yet.{' '}
                    <Link to="/member/projects/add" className="font-semibold text-brand-800 hover:underline">
                      Add your first project
                    </Link>
                    .
                  </div>
                )}
              </Card>

              <div className="grid gap-5 sm:grid-cols-2">
                <Card>
                  <CardHeader
                    title="Trophies"
                    action={<Link to="/member/profile?tab=rewards" className="text-[0.75rem] font-medium text-brand-800 hover:underline">View all</Link>}
                  />
                  <CardBody className="space-y-3">
                    {earned.length ? (
                      earned.slice(0, 3).map((trophy) => (
                        <div key={trophy.id} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <div>
                            <p className="text-[0.75rem] font-medium text-ink-900">{trophy.name}</p>
                            <p className="text-[0.625rem] text-ink-400">
                              Earned {trophy.earned_at ? formatDate(trophy.earned_at) : '—'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[0.75rem] text-ink-500">No trophies earned yet.</p>
                    )}
                    <Link to="/member/profile?tab=rewards" className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline">
                      Trophy shelf
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    </Link>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    title="Recent points"
                    action={<Link to="/member/rankings/points-transactions" className="text-[0.75rem] font-medium text-brand-800 hover:underline">All</Link>}
                  />
                  <CardBody className="space-y-3">
                    <RecentPoints />
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[0.75rem] text-ink-500">
                    <Globe className="h-4 w-4 text-ink-400" aria-hidden />
                    Public profile visibility and directory listings are managed by the club.
                  </div>
                  <ButtonLink to="/members" variant="ghost" size="sm">
                    View community directory
                  </ButtonLink>
                </CardBody>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="social">
          <ProfileSocial />
        </TabsContent>

        <TabsContent value="privacy">
          <ProfilePrivacy />
        </TabsContent>

        <TabsContent value="digital-id">
          <div className="pt-5">
            <DigitalId embedded />
          </div>
        </TabsContent>

        <TabsContent value="membership">
          <div className="pt-5">
            <Membership embedded />
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <div className="pt-5">
            <Rewards embedded />
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

/** The three most recent awards, read from the same ledger endpoint. */
function RecentPoints() {
  const { data, loading, error, reload } = useMemberData(() => memberApi.rewardsHistory({ per_page: 3 }), [])

  if (loading && !data) return <p className="text-[0.75rem] text-ink-500">Loading points…</p>
  if (error || !data) return <ErrorBlock message={error ?? 'Your points could not be loaded.'} onRetry={reload} />
  if (!data.length) return <p className="text-[0.75rem] text-ink-500">No points awarded yet.</p>

  return (
    <>
      {data.map((reward) => (
        <div key={reward.id} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[0.75rem] leading-5 text-ink-700">{reward.reason}</p>
            <p className="text-[0.625rem] text-ink-400">{formatDate(reward.awarded_at)}</p>
          </div>
          <span className="text-[0.75rem] font-semibold tabular text-brand-700">
            {reward.points > 0 ? '+' : ''}
            {reward.points}
          </span>
        </div>
      ))}
    </>
  )
}

export default MemberProfile

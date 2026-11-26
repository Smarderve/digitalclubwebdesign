import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Github, Globe, Linkedin, LockKeyhole, Mail, Phone, ShieldCheck } from 'lucide-react'
import { demoMember, demoMemberProjects, demoRewardHistory, demoTrophies } from '../../data/demo'
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

export function MemberProfile() {
  const earned = demoTrophies.filter((trophy) => trophy.earnedOn)
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab = PROFILE_TABS.includes(requested as (typeof PROFILE_TABS)[number]) ? (requested as string) : 'overview'

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
                <Avatar name={demoMember.name} size="xl" />
                <div className="min-w-0">
                  <h2 className="text-[1.0625rem] font-semibold text-ink-950">{demoMember.name}</h2>
                  <p className="text-[0.75rem] text-ink-500">{demoMember.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="green" dot>
                      Active member
                    </Badge>
                    <Badge tone="outline">{demoMember.year}</Badge>
                  </div>
                </div>
              </div>

              <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[0.75rem]">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Member ID</dt>
                  <dd className="font-mono text-ink-900">{demoMember.memberId}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Course</dt>
                  <dd className="max-w-[62%] text-right font-medium text-ink-900">{demoMember.course}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Joined</dt>
                  <dd className="font-medium text-ink-900">{formatDate(demoMember.joined)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Membership</dt>
                  <dd className="font-medium text-ink-900">Until {formatDate(demoMember.membership.endDate)}</dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-line pt-4">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">Profile completion</p>
                <div className="mt-2">
                  <Progress value={demoMember.profileCompletion} />
                </div>
                <p className="mt-1.5 text-[0.75rem] text-ink-500">
                  {demoMember.profileCompletion}% complete · add a LinkedIn profile to finish.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <a
                  href={`https://${demoMember.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-[0.75rem] text-ink-600 hover:border-ink-300"
                >
                  <Github className="h-3.5 w-3.5" aria-hidden />
                  GitHub
                </a>
                <a
                  href={`https://${demoMember.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-[0.75rem] text-ink-600 hover:border-ink-300"
                >
                  <Linkedin className="h-3.5 w-3.5" aria-hidden />
                  LinkedIn
                </a>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Account" description="Contact details are only visible to you and club administrators." />
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2.5 text-[0.8125rem] text-ink-700">
                <Mail className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                {demoMember.email}
              </div>
              <div className="flex items-center gap-2.5 text-[0.8125rem] text-ink-700">
                <Phone className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                {demoMember.phone}
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
              <p className="text-[0.875rem] leading-7 text-ink-600">{demoMember.bio}</p>
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">Areas of interest</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {demoMember.areasOfInterest.map((interest) => (
                    <li key={interest} className="rounded-[4px] border border-line bg-ink-50 px-2 py-1 text-[0.75rem] text-ink-700">
                      {interest}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                {[
                  { label: 'Club points', value: demoMember.points },
                  { label: 'Competitions', value: demoMember.competitions },
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
            <div className="divide-y divide-line">
              {demoMemberProjects.map((project) => (
                <div key={project.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] font-medium text-ink-900">{project.title}</p>
                    <p className="mt-0.5 truncate text-[0.6875rem] text-ink-500">{project.technologies}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={project.visibility === 'Public' ? 'green' : 'outline'}>{project.visibility}</Badge>
                    <StatusBadge status={project.status.toLowerCase()} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader title="Trophies" action={<Link to="/member/profile?tab=rewards" className="text-[0.75rem] font-medium text-brand-800 hover:underline">View all</Link>} />
              <CardBody className="space-y-3">
                {earned.slice(0, 3).map((trophy) => (
                  <div key={trophy.name} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[0.75rem] font-medium text-ink-900">{trophy.name}</p>
                      <p className="text-[0.625rem] text-ink-400">Earned {trophy.earnedOn ? formatDate(trophy.earnedOn) : '—'}</p>
                    </div>
                  </div>
                ))}
                <Link to="/member/profile?tab=rewards" className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-brand-800 hover:underline">
                  Trophy shelf
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </Link>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Recent points" action={<Link to="/member/rankings/points-transactions" className="text-[0.75rem] font-medium text-brand-800 hover:underline">All</Link>} />
              <CardBody className="space-y-3">
                {demoRewardHistory.slice(0, 3).map((reward) => (
                  <div key={reward.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[0.75rem] leading-5 text-ink-700">{reward.reason}</p>
                      <p className="text-[0.625rem] text-ink-400">{formatDate(reward.date)}</p>
                    </div>
                    <span className="text-[0.75rem] font-semibold tabular text-brand-700">+{reward.points}</span>
                  </div>
                ))}
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

export default MemberProfile

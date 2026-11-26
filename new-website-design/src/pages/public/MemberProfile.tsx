import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpenCheck, CalendarDays, Github, Globe, Linkedin, LockKeyhole, Trophy, UserRound } from 'lucide-react'
import { PageNotFoundInline } from '../../components/site/primitives'
import { Alert, Avatar, Badge, Card, CardBody, CardHeader, EmptyState } from '../../components/ui'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi } from '../../lib/publicApi'
import { formatDate } from '../../lib/utils'

function ProfileLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-[0.8125rem] text-ink-700 hover:text-brand-800"
    >
      {icon}
      {children}
    </a>
  )
}

export function MemberProfilePage({ embedded = false }: { embedded?: boolean } = {}) {
  const { username = '' } = useParams()
  const { data: profile, loading, error } = usePublicData(() => publicApi.memberProfile(username), [username])
  const shell = embedded ? '' : 'container-editorial section'

  if (loading) {
    return (
      <div className={`${shell} text-center text-[0.8125rem] text-ink-400`} role="status">
        Loading profile…
      </div>
    )
  }

  if (error || !profile) {
    if (embedded) {
      return (
        <div className={shell}>
          <EmptyState
            icon={<UserRound className="h-4 w-4" aria-hidden />}
            title="Member not found"
            description="This profile link does not match a published member of KIUT Digital Club."
            action={
              <Link to="/member" className="text-[0.8125rem] font-semibold text-brand-800 hover:underline">
                Back to your dashboard
              </Link>
            }
          />
        </div>
      )
    }
    return (
      <PageNotFoundInline
        title="Member not found"
        description="This profile link does not match a published member of KIUT Digital Club."
      />
    )
  }

  return (
    <div className={shell}>
      {embedded ? null : (
        <div className="mb-4">
          <Link to="/members" className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-500 hover:text-brand-800">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Community
          </Link>
        </div>
      )}

      <header className="border-b border-line pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={profile.display_name} src={profile.avatar_url} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[1.75rem]">
                  {profile.display_name}
                </h1>
                <Badge tone={profile.status === 'alumni' ? 'neutral' : 'green'} dot>
                  {profile.status === 'alumni' ? 'Alumni' : 'Student'}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-ink-500">
                {profile.course ? (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpenCheck className="h-3.5 w-3.5 text-ink-400" aria-hidden /> {profile.course}
                    {profile.year ? ` · ${profile.year}` : ''}
                  </span>
                ) : null}
                {profile.joined_year ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-ink-400" aria-hidden /> Member since {profile.joined_year}
                  </span>
                ) : null}
              </div>
              {profile.bio ? <p className="mt-2 max-w-[56ch] text-[0.9375rem] leading-6 text-ink-600">{profile.bio}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-line px-3 py-1.5 text-[0.75rem] text-ink-500">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
              Contact details are private
            </span>
          </div>
        </div>

        {profile.skills.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <li key={skill} className="rounded-[3px] border border-line bg-surface px-2 py-1 text-[0.75rem] text-ink-700">
                {skill}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {profile.interests.length ? (
            <section>
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Technical interests</h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <li key={interest} className="rounded-[3px] border border-line bg-surface px-2 py-1 text-[0.75rem] text-ink-700">
                    {interest}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Published projects</h2>
            {profile.projects.length ? (
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {profile.projects.map((project) => (
                  <li key={project.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[0.875rem] font-medium text-ink-900">{project.title}</p>
                      <Badge tone="green">Published</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 max-w-[70ch] text-[0.8125rem] leading-5 text-ink-500">{project.summary}</p>
                    <p className="mt-1 text-[0.6875rem] text-ink-400">{project.technologies.join(' · ')}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[0.8125rem] text-ink-500">No public projects have been published by this member.</p>
            )}
          </section>

          <section>
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Recognition</h2>
            {profile.achievements.length ? (
              <ul className="mt-2 space-y-2">
                {profile.achievements.map((achievement) => (
                  <li key={achievement.name} className="flex items-start gap-2.5 rounded-md border border-line bg-surface px-3.5 py-3">
                    <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] font-medium text-ink-900">{achievement.name}</p>
                      <p className="text-[0.6875rem] text-ink-400">
                        {achievement.earned_at ? formatDate(achievement.earned_at) : ''}
                        {achievement.description ? ` · ${achievement.description}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[0.8125rem] text-ink-500">No recognition has been recorded yet.</p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {Object.keys(profile.links).length ? (
            <Card>
              <CardHeader title="Links" />
              <CardBody className="space-y-2">
                {profile.links.github ? (
                  <ProfileLink href={profile.links.github} icon={<Github className="h-3.5 w-3.5" />}>
                    GitHub
                  </ProfileLink>
                ) : null}
                {profile.links.linkedin ? (
                  <ProfileLink href={profile.links.linkedin} icon={<Linkedin className="h-3.5 w-3.5" />}>
                    LinkedIn
                  </ProfileLink>
                ) : null}
                {profile.links.website ? (
                  <ProfileLink href={profile.links.website} icon={<Globe className="h-3.5 w-3.5" />}>
                    Portfolio
                  </ProfileLink>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Public profile" description="Only published fields are shown." />
            <CardBody className="space-y-2 text-[0.75rem] leading-5 text-ink-500">
              <p>Contact details, student numbers, payment records and digital ID data are never part of a public profile.</p>
              <Alert tone="info">
                Sign in to open your own member area, projects and digital ID.
              </Alert>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export default MemberProfilePage

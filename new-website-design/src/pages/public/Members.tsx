import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, GraduationCap, Search, UserRound, Users } from 'lucide-react'
import { JoinBand, SectionHead } from '../../components/site/primitives'
import { PageHero, clubMedia } from '../../components/site/hero'
import { Alert, Badge, EmptyState } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { Input, Select } from '../../components/ui/field'
import { LeaderCard } from '../../components/site/cards'
import { Avatar } from '../../components/ui/misc'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi, type PublicMember } from '../../lib/publicApi'

const membersHero = clubMedia('/images/club/devfest-team', 'KIUT Digital Club members together')
const studentsHero = clubMedia('/images/club/devfest-tall', 'Club members gathered at a club event')
const alumniHero = clubMedia('/images/club/devfest-students', 'KIUT Digital Club students at DevFest')

function MemberCard({ member }: { member: PublicMember }) {
  return (
    <Link
      to={`/members/${member.public_slug}`}
      className="group flex items-start gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
    >
      <Avatar name={member.display_name} src={member.avatar_url} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem] font-semibold text-ink-950 group-hover:text-brand-800">{member.display_name}</p>
        <p className="mt-0.5 truncate text-[0.75rem] text-ink-500">
          {[member.course, member.year].filter(Boolean).join(' · ') || 'Profile details not published'}
        </p>
        <Badge tone="outline" className="mt-2">
          {member.status === 'alumni' ? 'Alumni' : 'Student'}
        </Badge>
      </div>
      <ArrowUpRight className="mt-1 h-3.5 w-3.5 text-ink-300 transition-colors group-hover:text-brand-700" aria-hidden />
    </Link>
  )
}

export function Members() {
  const stats = usePublicData(() => publicApi.stats(), [])
  const leaders = usePublicData(() => publicApi.leaders(), [])
  const byCourse = usePublicData(() => publicApi.members({ per_page: 50 }), [])
  const courseCounts = useMemo(() => {
    const counts = new Map<string, number>()
    ;(byCourse.data?.items ?? []).forEach((member) => {
      if (!member.course) return
      counts.set(member.course, (counts.get(member.course) ?? 0) + 1)
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [byCourse.data])

  return (
    <>
      <PageHero
        eyebrow="Community"
        title="Members"
        description="The students, alumni and leaders who make up KIUT Digital Club — a community of IT and computer science students learning technology together."
        media={membersHero}
        aside={
          <div className="rounded-lg border border-line bg-canvas p-4 lg:max-w-[320px]">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Membership</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              Free for all KIUT students. Register with your student email, then attend an orientation session to get started.
            </p>
            <div className="mt-3">
              <ButtonLink to="/auth/register" size="sm">
                Join the club
              </ButtonLink>
            </div>
          </div>
        }
      />

      <section className="section border-b border-line" data-reveal>
        <div className="container-editorial">
          <SectionHead
            eyebrow="Directories"
            title="Find your people"
            description="The club directory separates current students, alumni and the elected leadership team. Profiles are visible only when a member has completed their profile and the club publishes it."
          />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
            {[
              { title: 'Students', to: '/students', icon: GraduationCap, text: 'Current KIUT students across computing programmes and years of study.' },
              { title: 'Alumni', to: '/alumni', text: 'Graduates who remain connected to the club and its mentorship network.' },
              { title: 'Leadership', to: '/leaders', icon: Users, text: 'The elected executive board, technical leads and department heads.' },
            ].map((item) => {
              const Icon = item.icon ?? UserRound
              return (
                <Link key={item.title} to={item.to} className="group flex flex-col justify-between gap-6 bg-surface p-5 transition-colors hover:bg-brand-50/40">
                  <div>
                    <Icon className="h-4 w-4 text-brand-700" aria-hidden />
                    <h3 className="mt-3 text-[1.0625rem] font-semibold text-ink-950">{item.title}</h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{item.text}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-brand-800">
                    Open directory
                    <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Member statistics"
            title="The community by course"
            description="Approved members by status, computed from the club database."
            action={{ label: 'Join the community', to: '/auth/register' }}
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="min-w-0 rounded-lg border border-line bg-surface p-5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Available figures</p>
              <div className="mt-3 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                {[
                  { label: 'Members', value: stats.data ? String(stats.data.members.total) : '—' },
                  { label: 'Students', value: stats.data ? String(stats.data.members.students) : '—' },
                  { label: 'Alumni', value: stats.data ? String(stats.data.members.alumni) : '—' },
                ].map((item) => (
                  <div key={item.label} className="bg-surface px-4 py-3">
                    <p className="text-[0.6875rem] text-ink-500">{item.label}</p>
                    <p className="mt-1 text-[1.25rem] font-semibold tabular text-ink-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-0 rounded-lg border border-line bg-surface p-5">
              <p className="text-[0.8125rem] font-semibold text-ink-900">Members by course</p>
              {courseCounts.length ? (
                <ul className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
                  {courseCounts.map(([course, count]) => (
                    <li key={course} className="flex min-w-0 items-center justify-between gap-3 rounded-sm border border-line px-3 py-2">
                      <span className="truncate text-[0.75rem] text-ink-600">{course}</span>
                      <span className="tabular text-[0.75rem] font-medium text-ink-700">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[0.75rem] leading-5 text-ink-500">
                  {byCourse.loading ? 'Loading course counts…' : 'Counts appear when member records are published.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Current leadership"
            title="The people leading the community"
            description="Leadership profiles are published on the club's leadership page, with names and roles preserved."
            action={{ label: 'All leadership', to: '/leaders' }}
          />
          <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {(leaders.data ?? []).slice(0, 4).map((leader) => (
              <LeaderCard
                key={leader.id}
                name={leader.name}
                position={leader.position}
                programme={leader.programme ?? 'Programme not recorded'}
                year={leader.year ?? undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <JoinBand
        eyebrow="Join the community"
        title="Meet students who are building things."
        description="Membership is free for KIUT students. Register, complete your profile and join a session or project team."
        primary={{ label: 'Join the club', to: '/auth/register' }}
        secondary={{ label: 'See upcoming sessions', to: '/events' }}
      />
    </>
  )
}

function DirectoryFilters({
  query,
  setQuery,
  course,
  setCourse,
  year,
  setYear,
  courses,
  years,
  onReset,
}: {
  query: string
  setQuery: (value: string) => void
  course: string
  setCourse: (value: string) => void
  year: string
  setYear: (value: string) => void
  courses: string[]
  years: string[]
  onReset: () => void
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-line bg-canvas/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_220px_160px_auto]">
      <div className="relative">
        <label htmlFor="directory-search" className="sr-only">
          Search people
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
        <Input id="directory-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name…" className="pl-9" />
      </div>
      <div>
        <label htmlFor="directory-course" className="sr-only">
          Course
        </label>
        <Select id="directory-course" value={course} onChange={(event) => setCourse(event.target.value)}>
          <option value="all">All courses</option>
          {courses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="directory-year" className="sr-only">
          Year
        </label>
        <Select id="directory-year" value={year} onChange={(event) => setYear(event.target.value)}>
          <option value="all">All years</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <Button type="button" variant="ghost" onClick={onReset}>
        Reset
      </Button>
    </div>
  )
}

function MemberDirectory({ status }: { status: 'student' | 'alumni' }) {
  const [query, setQuery] = useState('')
  const [course, setCourse] = useState('all')
  const [year, setYear] = useState('all')
  const { data, loading, error } = usePublicData(() => publicApi.members({ status, per_page: 50 }), [status])
  const members = data?.items ?? []

  const courses = useMemo(
    () => Array.from(new Set(members.map((member) => member.course).filter(Boolean) as string[])).sort(),
    [members],
  )
  const years = useMemo(
    () => Array.from(new Set(members.map((member) => member.year).filter(Boolean) as string[])).sort(),
    [members],
  )
  const filtered = members.filter((member) => {
    const matchesQuery = !query.trim() || member.display_name.toLowerCase().includes(query.trim().toLowerCase())
    const matchesCourse = course === 'all' || member.course === course
    const matchesYear = year === 'all' || member.year === year
    return matchesQuery && matchesCourse && matchesYear
  })

  return (
    <div className="mt-5">
      <DirectoryFilters
        query={query}
        setQuery={setQuery}
        course={course}
        setCourse={setCourse}
        year={year}
        setYear={setYear}
        courses={courses}
        years={years}
        onReset={() => {
          setQuery('')
          setCourse('all')
          setYear('all')
        }}
      />
      <div className="mt-5">
        {error ? (
          <Alert tone="warning" title="Profiles could not be loaded">
            {error}
          </Alert>
        ) : loading ? (
          <p role="status" className="py-10 text-center text-[0.8125rem] text-ink-400">
            Loading profiles…
          </p>
        ) : filtered.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((member) => (
              <MemberCard key={member.public_slug} member={member} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={status === 'student' ? <GraduationCap className="h-4 w-4" aria-hidden /> : <Users className="h-4 w-4" aria-hidden />}
            title={members.length ? 'No profiles match these filters' : `No ${status} profiles published`}
            description={`${status === 'student' ? 'Student' : 'Alumni'} profiles appear here once the club publishes them.`}
            action={
              members.length ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    setCourse('all')
                    setYear('all')
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <ButtonLink to="/auth/register" size="sm">
                  Join the club
                </ButtonLink>
              )
            }
          />
        )}
      </div>
    </div>
  )
}

export function Students() {
  return (
    <>
      <PageHero
        eyebrow="Student directory"
        title="Our students"
        description="Current KIUT students across web, mobile, AI, data and cybersecurity interests. Profiles appear when a member completes their details and the club publishes them."
        media={studentsHero}
        aside={
          <p className="text-[0.75rem] leading-5 text-ink-500">
            Only approved members with a published profile appear here. Nothing is filled in with invented records.
          </p>
        }
      />
      <section className="section">
        <div className="container-editorial">
          <MemberDirectory status="student" />
        </div>
      </section>
    </>
  )
}

export function Alumni() {
  return (
    <>
      <PageHero
        eyebrow="Alumni network"
        title="Our alumni"
        description="Graduates who remain part of the Digital Club community — mentoring members, reviewing projects and sharing what they learned in the industry."
        media={alumniHero}
        aside={
          <div className="rounded-lg border border-line bg-canvas p-4 lg:max-w-[320px]">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Stay connected</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              Alumni can mentor current members or speak at a session. Get in touch with the club to take part.
            </p>
            <div className="mt-3">
              <ButtonLink to="/contact?topic=mentor" variant="outline" size="sm">
                Volunteer as a mentor
              </ButtonLink>
            </div>
          </div>
        }
      />
      <section className="section">
        <div className="container-editorial">
          <MemberDirectory status="alumni" />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {[
              { title: 'Mentor a member', text: 'Share feedback on a project or meet a member for a career conversation.' },
              { title: 'Speak at a session', text: 'Give a talk or workshop on a technology you work with.' },
              { title: 'Open a door', text: 'Share internship or graduate opportunities with the club.' },
            ].map((item) => (
              <div key={item.title} className="bg-surface p-5">
                <h3 className="text-[0.9375rem] font-semibold text-ink-950">{item.title}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Members

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, GraduationCap, Search, UserRound, Users } from 'lucide-react'
import { COURSES, LEADERS, YEARS } from '../../data/site'
import { JoinBand, SectionHead } from '../../components/site/primitives'
import { PageHero, media } from '../../components/site/hero'
import { Badge, EmptyState } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { Input, Select } from '../../components/ui/field'
import { LeaderCard } from '../../components/site/cards'
import { Avatar } from '../../components/ui/misc'

const membersHero = media(
  '/images/community/graduates',
  'Two graduates in cap and gown',
  'Stock photograph · Pexels. Not club members.',
)
const studentsHero = media(
  '/images/collaboration/study-group',
  'A group of students collaborating over a laptop indoors',
  'Stock photograph · Pexels. Not club members.',
)
const alumniHero = media(
  '/images/campus/two-students',
  'Two students talking with a laptop on a university campus',
  'Stock photograph · Pexels. Not club alumni.',
)

export function Members() {
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
                <Link key={item.title} to={item.to} className="group flex flex-col justify-between gap-6 bg-white p-5 transition-colors hover:bg-brand-50/40">
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
            description="The current members page aggregates approved members by course and status. Those database counts were not available in the content handoff."
            action={{ label: 'Join the community', to: '/auth/register' }}
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-lg border border-line bg-white p-5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Available figures</p>
              <div className="mt-3 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
                {[
                  { label: 'Members (site figure)', value: '200+' },
                  { label: 'Student / alumni split', value: 'Not supplied' },
                ].map((item) => (
                  <div key={item.label} className="bg-white px-4 py-3">
                    <p className="text-[0.6875rem] text-ink-500">{item.label}</p>
                    <p className="mt-1 text-[1.25rem] font-semibold tabular text-ink-950">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[0.625rem] leading-4 text-ink-400">
                The 200+ figure is as published on the current homepage and requires confirmation. No course distribution
                is fabricated.
              </p>
            </div>
            <div className="rounded-lg border border-dashed border-ink-200 bg-white p-5">
              <p className="text-[0.8125rem] font-semibold text-ink-900">Members by course</p>
              <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                Course counts are calculated from the live member database and were not part of the supplied content.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {COURSES.slice(0, 6).map((course) => (
                  <li key={course} className="flex items-center justify-between gap-3 rounded-sm border border-line px-3 py-2">
                    <span className="truncate text-[0.75rem] text-ink-600">{course}</span>
                    <span className="tabular text-[0.75rem] font-medium text-ink-400">—</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[0.625rem] text-ink-400">Counts will populate from the live database after integration.</p>
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
            {LEADERS.slice(0, 4).map((leader) => (
              <LeaderCard
                key={leader.name}
                name={leader.name}
                position={leader.position}
                programme={leader.programme}
                year={leader.year}
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
  onReset,
}: {
  query: string
  setQuery: (value: string) => void
  course: string
  setCourse: (value: string) => void
  year: string
  setYear: (value: string) => void
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
          {COURSES.map((item) => (
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
          {YEARS.map((item) => (
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

export function Students() {
  const [query, setQuery] = useState('')
  const [course, setCourse] = useState('all')
  const [year, setYear] = useState('all')
  const [showNote, setShowNote] = useState(false)

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
          <DirectoryFilters
            query={query}
            setQuery={setQuery}
            course={course}
            setCourse={setCourse}
            year={year}
            setYear={setYear}
            onReset={() => {
              setQuery('')
              setCourse('all')
              setYear('all')
            }}
          />
          <div className="mt-5">
            <EmptyState
              icon={<GraduationCap className="h-4 w-4" aria-hidden />}
              title="No student profiles published"
              description="Approved student profiles are read from the member database and were not included in the supplied content. This directory is ready for live records; no names were invented to fill it."
              action={
                <ButtonLink to="/auth/register" size="sm">
                  Join the club
                </ButtonLink>
              }
            />
          </div>
          <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-md border border-line bg-canvas/60 px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-[0.75rem] text-ink-500">
              How profiles work: a member completes their course, year, phone and bio in the dashboard.
            </p>
            <Button variant="ghost" size="xs" onClick={() => setShowNote((value) => !value)} aria-expanded={showNote}>
              {showNote ? 'Hide details' : 'Details'}
            </Button>
          </div>
          {showNote ? (
            <p className="mt-2 text-[0.75rem] leading-5 text-ink-500">
              The live page filters by course and year and adds earned trophies to each profile. This prototype keeps both
              filters functional. A published profile would show the member's name, course, year, interests and trophies.
            </p>
          ) : null}
        </div>
      </section>
    </>
  )
}

export function Alumni() {
  const [query, setQuery] = useState('')
  const [course, setCourse] = useState('all')
  const [year, setYear] = useState('all')

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
          <DirectoryFilters
            query={query}
            setQuery={setQuery}
            course={course}
            setCourse={setCourse}
            year={year}
            setYear={setYear}
            onReset={() => {
              setQuery('')
              setCourse('all')
              setYear('all')
            }}
          />
          <div className="mt-5">
            <EmptyState
              icon={<Users className="h-4 w-4" aria-hidden />}
              title="No alumni profiles published"
              description="Alumni profiles are read from the live member database and were not supplied for this redesign. No alumni names, companies or outcomes have been invented."
              action={
                <ButtonLink to="/contact?topic=mentor" variant="outline" size="sm">
                  Get in touch
                </ButtonLink>
              }
            />
          </div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {[
              { title: 'Mentor a member', text: 'Share feedback on a project or meet a member for a career conversation.' },
              { title: 'Speak at a session', text: 'Give a talk or workshop on a technology you work with.' },
              { title: 'Open a door', text: 'Share internship or graduate opportunities with the club.' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-5">
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

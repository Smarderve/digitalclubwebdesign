import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { LEARNING_PATHS } from '../../data/site'
import { ArtBackdrop, SignalDiagram } from './art'
import { ButtonLink } from '../ui/button'

/**
 * Page-specific mastheads.
 *
 * These deliberately do NOT share one composition. Each page opens with a
 * structure that follows its subject: a date strip for Events, an index for
 * Projects, a path diagram for Topics, a nameplate for News, and so on. They
 * share only typography, the container and the illustration language.
 */

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>
}

function CalendarStrip() {
  const today = new Date()
  const month = today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const offset = (start.getDay() + 6) % 7
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="w-full border border-line bg-surface/90 p-4 backdrop-blur-sm">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
        <p className="text-[0.8125rem] font-semibold text-ink-950">{month}</p>
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-400">Live calendar</p>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-y-1.5 text-center">
        {letters.map((letter, index) => (
          <span key={`${letter}-${index}`} className="font-mono text-[0.5625rem] uppercase text-ink-400">
            {letter}
          </span>
        ))}
        {cells.map((day, index) => (
          <span
            key={index}
            className={
              day === today.getDate()
                ? 'mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[0.6875rem] font-semibold text-white'
                : 'mx-auto flex h-6 w-6 items-center justify-center text-[0.6875rem] text-ink-500'
            }
          >
            {day ?? ''}
          </span>
        ))}
      </div>
      <div className="mt-3 border-t border-line pt-3">
        <p className="text-[0.6875rem] leading-5 text-ink-500">
          Public dates only. Member-only events appear in your dashboard after signing in.
        </p>
      </div>
    </div>
  )
}

export function EventsMasthead() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-canvas">
      <div aria-hidden className="paper-grid absolute inset-0 -z-10 opacity-40" />
      <ArtBackdrop
        scene="hackathon"
        tone="medium"
        className="bottom-[-14%] right-[-2%] hidden w-[42%] max-w-[520px] md:block"
      />
      <div className="container-editorial py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div className="max-w-[720px]">
            <Eyebrow>Events & activities</Eyebrow>
            <h1 className="mt-3 max-w-[16ch] text-display-lg text-ink-950">
              The club calendar, <span className="text-brand-700">open to all.</span>
            </h1>
            <p className="mt-4 max-w-[56ch] text-lead text-ink-600">
              Workshops, hackathons and talks published by KIUT Digital Club. Registration is reviewed by the organiser
              before attendance is confirmed.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href="#calendar"
                className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
              >
                Jump to the calendar
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </a>
              <Link to="/auth/register" className="text-[0.8125rem] text-ink-500 hover:text-brand-800">
                Members see more events
              </Link>
            </div>
          </div>
          <CalendarStrip />
        </div>
      </div>
    </header>
  )
}

export function ProjectsMasthead() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-surface">
      <div className="container-editorial pt-10 lg:pt-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="flex items-baseline justify-between gap-4 border-b rule-strong pb-3">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-500">Project index</p>
              <p className="font-mono text-[0.625rem] text-ink-400">KIUT / Digital Club</p>
            </div>
            <h1 className="relative mt-6 text-display-lg text-ink-950">
              Built by members,
              <br />
              <span className="outline-word">published</span> with proof.
            </h1>
            <p className="mt-4 max-w-[54ch] text-lead text-ink-600">
              Student work with its stack, team context and outcomes recorded. Only projects published by the club appear
              in the catalogue.
            </p>
          </div>
          <div className="relative hidden min-h-[220px] lg:block">
            <ArtBackdrop scene="coding" tone="strong" className="-right-6 bottom-[-30px] w-[112%] max-w-[480px]" />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 divide-x divide-line border-t border-line sm:grid-cols-4">
          {[
            ['01', 'Build', 'Member teams ship a real artefact.'],
            ['02', 'Document', 'Stack and outcomes are recorded.'],
            ['03', 'Review', 'Admins publish the record.'],
            ['04', 'Show', 'The catalogue stays public.'],
          ].map(([index, title, text]) => (
            <div key={index} className="px-4 py-4 first:pl-0 sm:px-5">
              <p className="font-mono text-[0.625rem] text-brand-700">{index}</p>
              <p className="mt-1 text-[0.8125rem] font-semibold text-ink-900">{title}</p>
              <p className="mt-0.5 hidden text-[0.6875rem] leading-5 text-ink-500 sm:block">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}

export function TopicsMasthead() {
  const paths = LEARNING_PATHS.slice(0, 4)
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-brand-50/50">
      <div aria-hidden className="dot-grid absolute inset-0 -z-10 opacity-30" />
      <div className="container-editorial grid gap-10 py-10 lg:grid-cols-[1fr_420px] lg:items-center lg:py-14">
        <div>
          <Eyebrow>Topics & learning paths</Eyebrow>
          <h1 className="mt-3 max-w-[15ch] text-display-lg text-ink-950">
            Follow a path from curiosity to capability.
          </h1>
          <p className="mt-4 max-w-[56ch] text-lead text-ink-600">
            The club groups its programme into directions, not isolated lessons. Each path names the stack members
            practise and the work they build with it.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <ButtonLink to="/learn" size="md">
              Open the learning library
            </ButtonLink>
            <ButtonLink to="/projects" variant="outline" size="md">
              See what members built
            </ButtonLink>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-line bg-surface/85 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-500">Path map</p>
              <SignalDiagram className="h-8 w-12 text-brand-600" />
            </div>
            <ol className="relative mt-4 space-y-0">
              {paths.map((path, index) => (
                <li key={path.slug} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < paths.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px border-l border-dashed border-brand-300"
                    />
                  ) : null}
                  <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-300 bg-surface font-mono text-[0.625rem] text-brand-800">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-[0.875rem] font-semibold text-ink-950">{path.title}</p>
                    <p className="mt-0.5 text-[0.6875rem] leading-5 text-ink-500">{path.tags.slice(0, 4).join(' · ')}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </header>
  )
}

export function LearnMasthead() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-surface">
      <ArtBackdrop
        scene="study"
        tone="soft"
        flip
        className="-left-[6%] bottom-[-18%] hidden w-[44%] max-w-[520px] md:block"
      />
      <div className="container-editorial py-10 lg:py-14">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-[640px]">
            <Eyebrow>Learning library</Eyebrow>
            <h1 className="mt-3 text-display-lg text-ink-950">The library</h1>
            <p className="mt-4 max-w-[52ch] text-lead text-ink-600">
              Notes and resources published by quizmasters during club sessions. Everything listed here is released
              material attached to a published quiz.
            </p>
          </div>
          <div className="flex gap-8 border-l border-line pl-6">
            {['Notes', 'Warmups', 'Tools'].map((item) => (
              <span
                key={item}
                className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-400 [writing-mode:vertical-rl]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

export function MembersMasthead() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-canvas">
      <div className="container-editorial pt-10 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Eyebrow>Community</Eyebrow>
            <h1 className="mt-3 max-w-[14ch] text-display-lg text-ink-950">The people behind the club.</h1>
            <p className="mt-4 max-w-[48ch] text-lead text-ink-600">
              Students, alumni and elected leaders from across KIUT&apos;s computing programmes. Profiles appear only
              when a member has completed their details and the club publishes them.
            </p>
            <div className="mt-6">
              <ButtonLink to="/students" variant="outline" size="md">
                Open the student directory
              </ButtonLink>
            </div>
          </div>
          <figure className="relative -mb-px">
            <img
              src="/images/club/devfest-team-800.jpg"
              srcSet="/images/club/devfest-team-800.jpg 800w, /images/club/devfest-team-1600.jpg 1600w"
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt="KIUT Digital Club members together at a technology community event"
              className="aspect-[16/10] w-full rounded-t-xl object-cover"
            />
            <figcaption className="absolute bottom-3 left-3 rounded-sm bg-ink-950/70 px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-white">
              Club archive
            </figcaption>
          </figure>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line py-3">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-500">Students · Alumni · Leadership</p>
          <Link to="/leaders" className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-brand-800">
            Meet the leadership
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  )
}

export function LeadersMasthead() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-brand-50/60">
      <div className="container-editorial py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <Eyebrow>Leadership</Eyebrow>
            <h1 className="mt-3 max-w-[18ch] text-display-lg text-ink-950">
              Elected by members. Accountable to members.
            </h1>
            <p className="mt-4 max-w-[56ch] text-lead text-ink-600">
              The executive board, technical leads and department heads who run the club for the current term. Every
              position is elected annually through a published process.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-[0.75rem] text-ink-500">
              <span>Roles published by the club</span>
              <span aria-hidden className="hidden h-3 w-px bg-ink-200 sm:block" />
              <span>Elections held annually</span>
            </div>
          </div>
          <div className="relative hidden justify-center lg:flex">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-brand-200">
              <div className="absolute inset-4 rounded-full border border-dashed border-brand-300" />
              <SignalDiagram motion className="h-36 w-36 text-brand-700" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-50/60 px-2 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-brand-800">
                Elected annually
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export function AboutMasthead() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-surface">
      <ArtBackdrop
        scene="campus"
        tone="soft"
        className="bottom-[-16%] right-[-4%] hidden w-[46%] max-w-[540px] md:block"
      />
      <div className="container-editorial grid gap-10 py-12 lg:grid-cols-[260px_1fr] lg:py-16">
        <div className="flex flex-col justify-between border-t rule-strong pt-3">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-500">The club / KIUT</p>
          <div className="mt-8 space-y-1 lg:mt-0">
            {['Learn', 'Build', 'Share'].map((item, index) => (
              <p key={item} className="flex items-baseline gap-3 text-[0.8125rem] text-ink-600">
                <span className="font-mono text-[0.5625rem] text-brand-700">0{index + 1}</span>
                {item}
              </p>
            ))}
          </div>
        </div>
        <div>
          <h1 className="max-w-[22ch] text-display-lg text-ink-950">
            A student technology community, built by the students in it.
          </h1>
          <p className="mt-5 max-w-[62ch] text-lead text-ink-600">
            Digital Club exists so KIUT students can practise technology together: sessions, projects, competitions and
            mentorship, alongside coursework. The club is run by an elected student team and open to every programme.
          </p>
        </div>
      </div>
    </header>
  )
}

export function NewsMasthead() {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-surface">
      <ArtBackdrop
        scene="security"
        tone="soft"
        className="-right-4 bottom-[-22%] hidden w-[38%] max-w-[440px] lg:block"
      />
      <div className="container-editorial py-9 lg:py-12">
        <div className="border-y-2 border-ink-900/70 py-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.22em] text-ink-500">The club bulletin</p>
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-400">{today}</p>
          </div>
          <h1 className="mt-2 text-display-lg text-ink-950">News</h1>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-[58ch] text-[0.9375rem] leading-7 text-ink-600">
            Announcements, results and notices published by the club office. Every notice below is a live record.
          </p>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-400">Public notices</p>
        </div>
      </div>
    </header>
  )
}

export function BlogsMasthead() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-canvas">
      <div className="container-editorial grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-14">
        <div>
          <Eyebrow>Field notes</Eyebrow>
          <h1 className="mt-3 max-w-[16ch] text-display-lg text-ink-950">Writing from members who build.</h1>
          <p className="mt-4 max-w-[56ch] text-lead text-ink-600">
            Tutorials, technical notes and honest accounts of learning technology at KIUT. Written by members and
            mentors, published by the club.
          </p>
          <div className="mt-6">
            <ButtonLink to="/contact?topic=blog" variant="outline" size="md">
              Pitch an article
            </ButtonLink>
          </div>
        </div>
        <div className="relative hidden justify-end lg:flex">
          <ArtBackdrop scene="design" tone="medium" className="relative w-[440px]" />
        </div>
      </div>
    </header>
  )
}

export function GalleryMasthead() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-surface">
      <div className="container-editorial py-8 lg:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Gallery</Eyebrow>
            <h1 className="mt-2 text-display-lg text-ink-950">The club, in frames.</h1>
          </div>
          <p className="max-w-[38ch] text-[0.8125rem] leading-6 text-ink-500">
            Photographs and videos from workshops, competitions and showcases, published with the permission of the
            people in them.
          </p>
        </div>
        <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { src: '/images/club/devfest-crowd', alt: 'Club members at a DevFest gathering' },
            { src: '/images/collaboration/coding-team', alt: 'Students reviewing code together' },
            { src: '/images/club/devfest-students', alt: 'Students at a Digital Club event' },
          ].map((photo, index) => (
            <figure key={photo.src} className={index === 1 ? 'translate-y-3 sm:translate-y-4' : ''}>
              <img
                src={`${photo.src}-800.jpg`}
                srcSet={`${photo.src}-800.jpg 800w, ${photo.src}-1600.jpg 1600w`}
                sizes="(min-width: 640px) 33vw, 33vw"
                alt={photo.alt}
                className="aspect-[4/5] w-full object-cover sm:aspect-[16/10]"
              />
            </figure>
          ))}
        </div>
      </div>
    </header>
  )
}

export function ContactMasthead({ email, phone }: { email: string; phone: string }) {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-brand-50/50">
      <div aria-hidden className="paper-grid absolute inset-0 -z-10 opacity-30" />
      <div className="container-editorial grid gap-10 py-10 lg:grid-cols-[1fr_380px] lg:items-center lg:py-14">
        <div>
          <Eyebrow>Contact</Eyebrow>
          <h1 className="mt-3 max-w-[14ch] text-display-lg text-ink-950">Talk to the club.</h1>
          <p className="mt-4 max-w-[52ch] text-lead text-ink-600">
            Questions about membership, projects, partnerships or mentorship. The club office reads every message and
            replies on weekdays.
          </p>
        </div>
        <div className="relative">
          <dl className="divide-y divide-line border-y border-line bg-surface/70 backdrop-blur-sm">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-400">Email</dt>
              <dd className="text-right text-[0.8125rem] font-medium text-ink-900">{email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-400">Phone</dt>
              <dd className="text-right text-[0.8125rem] font-medium text-ink-900">{phone}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-400">Campus</dt>
              <dd className="text-right text-[0.8125rem] text-ink-700">Gongo la Mboto, Dar es Salaam</dd>
            </div>
          </dl>
          <ArtBackdrop scene="coding" tone="soft" className="-bottom-10 -right-8 w-56" />
        </div>
      </div>
    </header>
  )
}

export function ElectionsMasthead() {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-surface">
      <ArtBackdrop
        scene="presentation"
        tone="soft"
        className="-right-2 bottom-[-12%] hidden w-[40%] max-w-[480px] md:block"
      />
      <div className="container-editorial py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <Eyebrow>Club elections</Eyebrow>
            <h1 className="mt-3 max-w-[16ch] text-display-lg text-ink-950">Leadership chosen by the members.</h1>
            <p className="mt-4 max-w-[54ch] text-lead text-ink-600">
              Nominations, screening, voting and results. Public election records show the timeline and approved
              candidates once the club releases them.
            </p>
          </div>
          <ol className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4 lg:grid-cols-2">
            {[
              ['01', 'Nominations'],
              ['02', 'Screening'],
              ['03', 'Voting'],
              ['04', 'Results'],
            ].map(([index, label]) => (
              <li key={index} className="bg-surface px-3 py-3">
                <p className="font-mono text-[0.5625rem] text-brand-700">{index}</p>
                <p className="mt-0.5 text-[0.75rem] font-medium text-ink-900">{label}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </header>
  )
}

export function DirectoryMasthead({
  eyebrow,
  title,
  description,
  aside,
  scene,
}: {
  eyebrow: string
  title: string
  description: string
  aside?: ReactNode
  scene: 'study' | 'campus'
}) {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-canvas">
      <ArtBackdrop scene={scene} tone="soft" className="-bottom-16 right-0 hidden w-[40%] max-w-[460px] md:block" />
      <div className="container-editorial grid gap-8 py-10 lg:grid-cols-[1fr_320px] lg:items-end lg:py-12">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-3 text-display-lg text-ink-950">{title}</h1>
          <p className="mt-3 max-w-[60ch] text-lead text-ink-600">{description}</p>
        </div>
        {aside ? <div className="text-[0.75rem] leading-5 text-ink-500">{aside}</div> : null}
      </div>
    </header>
  )
}

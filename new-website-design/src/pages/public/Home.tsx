import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import {
  ARTICLES,
  BENEFITS,
  CLUB_FACTS,
  COMPETITION_ARCHIVE,
  EVENTS,
  LEARNING_PATHS,
  PROJECTS,
  TESTIMONIALS,
} from '../../data/site'
import { ButtonLink } from '../../components/ui/button'
import { Badge } from '../../components/ui'
import { ArticleCard, Testimonial } from '../../components/site/cards'
import { JoinBand, LinkArrow, SectionHead } from '../../components/site/primitives'
import { EditorialFigure, media } from '../../components/site/hero'
import { HomeHero } from '../../components/site/HomeHero'
import { cn, formatDate } from '../../lib/utils'

const campusImage = media(
  '/images/campus/campus-arrival',
  'Students walking outside a university building',
  'Stock photograph · Pexels. Not KIUT campus.',
)
const sessionImage = media('/images/learning/robotics-demo', 'Students demonstrating a humanoid robot')
const eventImage = media('/images/events/auditorium', 'A full auditorium audience at a conference')
const communityImage = media('/images/campus/two-students', 'Two students talking on campus')
const projectImage = media('/images/development/workspace-flatlay', 'A desk with a laptop and notebooks')
const editorialImage = media('/images/development/code-closeup', 'A close view of code on a screen')
const joinImage = media('/images/collaboration/duo-laptops', 'Two people working on laptops at a table')

export function Home() {
  const [activePath, setActivePath] = useState(LEARNING_PATHS[0].slug)
  const path = LEARNING_PATHS.find((item) => item.slug === activePath) ?? LEARNING_PATHS[0]
  const event = EVENTS[0]

  return (
    <>
      <HomeHero />

      {/* The club */}
      <section className="section border-b border-line">
        <div className="container-editorial">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <h2 className="max-w-[16ch] text-display-lg text-ink-950" data-reveal>
              A place to practise, not just study.
            </h2>
            <div className="max-w-[46ch]" data-reveal style={{ transitionDelay: '80ms' }}>
              <p className="text-[1rem] leading-7 text-ink-700">
                Digital Club is the student technology community at KIUT. Members learn together, build projects, enter
                competitions and mentor one another — alongside their coursework.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                <LinkArrow to="/about">Read about the club</LinkArrow>
                <LinkArrow to="/leaders">Meet the leadership</LinkArrow>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-12" data-reveal data-reveal-kind="image">
            <div className="lg:col-span-8">
              <EditorialFigure media={campusImage} ratio="aspect-[16/9]" sizes="(min-width: 1024px) 66vw, 100vw" />
            </div>
            <div className="flex flex-col justify-end gap-6 lg:col-span-4">
              <p className="max-w-[34ch] text-[0.9375rem] leading-7 text-ink-600">
                Membership is free for KIUT students and no prior programming experience is required.
              </p>
              <dl className="divide-y divide-line border-y border-line">
                {CLUB_FACTS.map((fact) => (
                  <div key={fact.label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-[0.75rem] text-ink-500">{fact.label}</dt>
                    <dd className="text-[1.25rem] font-semibold tabular text-ink-950">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* What members do */}
      <section className="section border-b border-line bg-canvas">
        <div className="container-editorial">
          <SectionHead
            eyebrow="What members do"
            title="Four things the club actually runs"
            action={{ label: 'How to join', to: '/about#faq' }}
          />
          <div className="mt-10 grid gap-x-10 gap-y-0 sm:grid-cols-2" data-reveal>
            {BENEFITS.slice(0, 4).map((benefit, index) => (
              <article key={benefit.title} className="group grid grid-cols-[44px_1fr] gap-4 border-t border-line py-6">
                <span className="font-mono text-[0.6875rem] text-ink-400">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-[1.0625rem] font-semibold text-ink-950">{benefit.title}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-[0.8125rem] leading-6 text-ink-500">{benefit.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Learning paths */}
      <section className="section border-b border-line">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Learning paths"
            title="Pick a direction and go deep"
            action={{ label: 'All topics', to: '/topics' }}
          />
          <div className="mt-9 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="divide-y divide-line border-y border-line" role="tablist" aria-label="Learning paths">
              {LEARNING_PATHS.map((item, index) => {
                const selected = item.slug === activePath
                return (
                  <button
                    key={item.slug}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActivePath(item.slug)}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600',
                      selected ? 'text-ink-950' : 'text-ink-500 hover:text-ink-800',
                    )}
                  >
                    <span className="flex items-center gap-4">
                      <span className={cn('font-mono text-[0.625rem]', selected ? 'text-brand-700' : 'text-ink-400')}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={cn('text-[1rem]', selected ? 'font-semibold' : 'font-medium')}>{item.title}</span>
                    </span>
                    <ArrowRight
                      className={cn(
                        'h-4 w-4 transition-transform duration-300',
                        selected ? 'translate-x-0 text-brand-700' : '-translate-x-1 text-ink-300',
                      )}
                      aria-hidden
                    />
                  </button>
                )
              })}
            </div>

            <div key={path.slug} className="page-enter" role="tabpanel" aria-label={path.title}>
              <EditorialFigure
                media={sessionImage}
                ratio="aspect-[16/10]"
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="mb-6"
              />
              <h3 className="text-h2 text-ink-950">{path.title}</h3>
              <p className="mt-2 max-w-[58ch] text-[0.9375rem] leading-7 text-ink-600">{path.description}</p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${path.title} stack`}>
                {path.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line bg-white px-3 py-1 text-[0.75rem] font-medium text-ink-700"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <LinkArrow to="/topics">Explore {path.title.toLowerCase()}</LinkArrow>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="section border-b border-line bg-canvas">
        <div className="container-editorial grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <SectionHead eyebrow="Projects" title="Built by members" action={{ label: 'All projects', to: '/projects' }} />
            <div className="mt-8 divide-y divide-line border-y border-line" data-reveal>
              {PROJECTS.map((project, index) => (
                <a
                  key={project.slug}
                  href={`/projects#${project.slug}`}
                  className="group grid grid-cols-[36px_1fr_auto] items-start gap-4 py-5 transition-colors hover:bg-white/70"
                >
                  <span className="font-mono text-[0.6875rem] text-ink-400">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-[1.0625rem] font-semibold text-ink-950 group-hover:text-brand-800">
                      {project.title}
                    </span>
                    <span className="mt-1 block max-w-[58ch] text-[0.8125rem] leading-6 text-ink-500">
                      {project.summary}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <span key={tech} className="rounded-[4px] border border-line px-1.5 py-0.5 text-[0.625rem] text-ink-500">
                          {tech}
                        </span>
                      ))}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="mt-1 h-4 w-4 text-ink-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700"
                    aria-hidden
                  />
                </a>
              ))}
            </div>
            <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
              Project records are typographic because no project artwork was supplied.
            </p>
          </div>
          <div className="hidden lg:block" data-reveal data-reveal-kind="image">
            <EditorialFigure media={projectImage} ratio="aspect-[4/5]" sizes="32vw" />
          </div>
        </div>
      </section>

      {/* Programme */}
      <section className="section border-b border-line">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Programme"
            title="Competitions and the event calendar"
            action={{ label: 'Events & RSVP', to: '/events' }}
          />

          <div className="mt-9 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="divide-y divide-line border-y border-line" data-reveal>
              {COMPETITION_ARCHIVE.map((item) => (
                <article key={item.title} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[0.9375rem] font-semibold text-ink-950">{item.title}</h3>
                      <Badge tone={item.status === 'As published' ? 'outline' : 'neutral'}>{item.status}</Badge>
                    </div>
                    <p className="mt-1 max-w-[56ch] text-[0.8125rem] leading-6 text-ink-500">{item.description}</p>
                  </div>
                  <p className="text-[0.75rem] text-ink-400 sm:text-right">{item.timing}</p>
                </article>
              ))}
            </div>

            <article className="overflow-hidden" data-reveal style={{ transitionDelay: '80ms' }}>
              <EditorialFigure media={eventImage} ratio="aspect-[16/10]" sizes="(min-width: 1024px) 40vw, 100vw" />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-500">Most recent event</p>
                <Badge tone="neutral">Ended</Badge>
              </div>
              <h3 className="mt-2 text-h3 text-ink-950">{event.title}</h3>
              <p className="mt-1 text-[0.75rem] text-ink-500">
                {formatDate(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
                {event.time} · {event.location}
              </p>
              <div className="mt-3">
                <LinkArrow to="/events">View event archive</LinkArrow>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div data-reveal>
              <p className="eyebrow">Community</p>
              <h2 className="mt-3 max-w-[14ch] text-display-md text-ink-950">Students teaching students.</h2>
              <p className="mt-4 max-w-[42ch] text-[0.9375rem] leading-7 text-ink-600">
                Members lead workshops, review each other's code and represent the club in competitions. The club is led
                by an elected student team.
              </p>
              <div className="mt-6">
                <ButtonLink to="/members" size="sm" variant="outline" iconRight={<ArrowUpRight className="h-3.5 w-3.5" />}>
                  The community
                </ButtonLink>
              </div>
            </div>
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2" data-reveal style={{ transitionDelay: '70ms' }}>
              {TESTIMONIALS.slice(0, 2).map((testimonial) => (
                <Testimonial key={testimonial.name} {...testimonial} />
              ))}
            </div>
          </div>

          <div className="mt-10" data-reveal data-reveal-kind="image">
            <EditorialFigure media={communityImage} ratio="aspect-[21/9]" sizes="100vw" />
          </div>
        </div>
      </section>

      {/* Reading */}
      <section className="section">
        <div className="container-editorial grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <SectionHead eyebrow="From the blog" title="Notes from members" action={{ label: 'All articles', to: '/blogs' }} />
            <div className="mt-6" data-reveal>
              {ARTICLES.slice(0, 3).map((article, index) => (
                <ArticleCard key={article.slug} article={article} index={index} />
              ))}
            </div>
          </div>
          <div className="hidden lg:block lg:pt-16" data-reveal data-reveal-kind="image">
            <EditorialFigure media={editorialImage} ratio="aspect-[3/4]" sizes="30vw" />
          </div>
        </div>
      </section>

      <JoinBand
        media={joinImage}
        title="There is a place here whether you have written code before or not."
        description="Membership is free for KIUT students. Register with your student email and come to an orientation session."
        primary={{ label: 'Join the club', to: '/auth/register' }}
        secondary={{ label: 'Contact the club', to: '/contact' }}
      />
    </>
  )
}

export default Home

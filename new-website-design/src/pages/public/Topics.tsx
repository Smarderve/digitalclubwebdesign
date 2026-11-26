import { ArrowRight, BookOpen, Layers } from 'lucide-react'
import { LEARNING_PATHS, SKILL_CATEGORIES } from '../../data/site'
import { JoinBand, SectionHead } from '../../components/site/primitives'
import { PageHero, media } from '../../components/site/hero'
import { Alert } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi } from '../../lib/publicApi'

const topicsHero = media('/images/topics/server-room', 'Network and server racks in a data centre')

export function Topics() {
  const { data, loading, error } = usePublicData(() => publicApi.topics(), [])
  const topics = data?.topics ?? []
  const technologies = data?.technologies ?? []

  return (
    <>
      <PageHero
        layout="overlay"
        eyebrow="Topics & learning paths"
        title="Topics we cover"
        description="Master the technologies and skills driving the digital future through the club's learning programmes, sessions and projects."
        media={topicsHero}
        actions={
          <ButtonLink to="/learn" size="md" variant="brandSoft" className="bg-brand-500 text-ink-950 hover:bg-brand-400">
            Open the learning library
          </ButtonLink>
        }
        aside={
          <p className="text-[0.8125rem] leading-6 text-white/70">
            Learning paths and skill categories are the club's programme. The topic and technology lists below are read
            from the club database.
          </p>
        }
      />

      <section className="section border-b border-line" data-reveal>
        <div className="container-editorial">
          <SectionHead
            eyebrow="Technology stack"
            title="Comprehensive coverage of modern technologies"
            description="The club's topic areas group the tools and languages members work with across sessions and projects."
            action={{ label: 'Published notes', to: '/learn' }}
          />

          {error ? (
            <Alert tone="warning" title="Topics could not be loaded" className="mt-6">
              {error}
            </Alert>
          ) : null}

          <div className="mt-9 grid gap-x-12 gap-y-0 sm:grid-cols-2">
            {topics.length ? (
              topics.map((topic, index) => (
                <article key={topic.id} className="group grid grid-cols-[44px_1fr_auto] items-start gap-4 border-t border-line py-5">
                  <span className="font-mono text-[0.6875rem] text-ink-400">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-[1.0625rem] font-semibold text-ink-950">{topic.name}</h3>
                    <p className="mt-1 max-w-[46ch] text-[0.8125rem] leading-6 text-ink-500">{topic.description}</p>
                  </div>
                  <BookOpen className="mt-0.5 h-4 w-4 text-ink-200 transition-colors group-hover:text-brand-600" aria-hidden />
                </article>
              ))
            ) : (
              <p className="border-t border-line py-5 text-[0.8125rem] text-ink-400 sm:col-span-2">
                {loading ? 'Loading topics…' : 'No topics have been published yet.'}
              </p>
            )}
          </div>

          <div className="mt-8 border-y border-line py-4">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Technologies we work with</p>
            {technologies.length ? (
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {technologies.map((tech) => (
                  <li key={tech.id} className="text-[0.8125rem] text-ink-600">
                    {tech.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[0.8125rem] text-ink-400">
                {loading ? 'Loading technologies…' : 'No technologies have been published yet.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Learning paths"
            title="Structured journeys to build expertise"
            description="Each path describes the direction and a recommended stack. Members can combine paths as their interests develop."
          />
          <div className="mt-9 space-y-0 divide-y divide-line border-y border-line">
            {LEARNING_PATHS.map((path, index) => (
              <article key={path.slug} className="grid gap-5 py-7 lg:grid-cols-[56px_1fr_280px] lg:gap-8">
                <div className="flex items-start gap-3 lg:block">
                  <span className="font-mono text-[0.75rem] text-brand-700">{String(index + 1).padStart(2, '0')}</span>
                  <span aria-hidden className="mt-2 hidden h-px w-6 bg-brand-400 lg:block" />
                </div>
                <div>
                  <h3 className="text-h3 text-ink-950">{path.title}</h3>
                  <p className="mt-2 max-w-[62ch] text-[0.875rem] leading-7 text-ink-600">{path.description}</p>
                </div>
                <div className="lg:border-l lg:border-line lg:pl-6">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Typical stack</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {path.tags.map((tag) => (
                      <li key={tag} className="rounded-[4px] border border-line bg-surface px-2 py-0.5 text-[0.6875rem] font-medium text-ink-700">
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-b border-line">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Skill categories"
            title="Organised learning tracks"
            description="Beyond a single language or framework, these categories cover the breadth of a working technology practice."
          />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {SKILL_CATEGORIES.map((category) => (
              <div key={category.title} className="bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[0.9375rem] font-semibold text-ink-950">{category.title}</h3>
                  <Layers className="h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden />
                </div>
                <p className="mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-brand-700">{category.count}</p>
                <p className="mt-2 text-[0.8125rem] leading-6 text-ink-500">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-display-md text-ink-950">Topics become practice.</h2>
            <p className="mt-3 max-w-[40ch] text-[0.9375rem] leading-7 text-ink-600">
              The club's learning material is delivered through weekly sessions, warmup quizzes, workshops and project
              work. Published notes appear in the Learn library when a quizmaster releases them.
            </p>
            <div className="mt-5">
              <ButtonLink to="/learn" variant="outline" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                Open the learning library
              </ButtonLink>
            </div>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              { step: '01', title: 'Pick a path', text: 'Choose a direction based on what you want to build.' },
              { step: '02', title: 'Attend sessions', text: 'Weekly published sessions and workshops build the foundations.' },
              { step: '03', title: 'Ship a project', text: 'Apply the skills in a project, competition or warmup challenge.' },
            ].map((item) => (
              <li key={item.step} className="border-t border-line pt-4">
                <span className="font-mono text-[0.625rem] text-brand-700">{item.step}</span>
                <p className="mt-2 text-[0.875rem] font-semibold text-ink-950">{item.title}</p>
                <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <JoinBand
        eyebrow="Ready to learn?"
        title="Ready to master new technologies?"
        description="Join our workshops, hands-on sessions and expert-led training to build in-demand skills and advance your career in technology."
        primary={{ label: 'Join the club', to: '/auth/register' }}
        secondary={{ label: 'Talk to the club', to: '/contact' }}
      />
    </>
  )
}

export default Topics

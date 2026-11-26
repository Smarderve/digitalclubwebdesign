import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookMarked, FileText, Github, Library, MonitorPlay, Search, Wrench } from 'lucide-react'
import { SectionHead } from '../../components/site/primitives'
import { PageHero, media } from '../../components/site/hero'
import { EmptyState } from '../../components/ui'
import { Button, ButtonLink } from '../../components/ui/button'
import { Input, Select } from '../../components/ui/field'
import { POPULAR_TOPICS } from '../../data/site'

const learnHero = media('/images/learning/developer-desk', 'A laptop showing code in a shared workspace')

const resources = [
  {
    title: 'Study materials',
    description: 'Notes, tutorials and study guides for programming languages and computer science topics.',
    icon: BookMarked,
    action: { label: 'Explore topics', to: '/topics' },
  },
  {
    title: 'Workshop recordings',
    description: 'Recordings of past workshops and tech talks, available to learn at your own pace.',
    icon: MonitorPlay,
    action: { label: 'Link not published', to: '' },
  },
  {
    title: 'Code repository',
    description: 'Starter projects, templates and starter code from the club organisation.',
    icon: Github,
    action: { label: 'Link not published', to: '' },
  },
  {
    title: 'Development tools',
    description: 'Access to development tools, cloud credits and software licences for club projects.',
    icon: Wrench,
    action: { label: 'Request access', to: '/contact?topic=tools' },
  },
  {
    title: 'Tech blog',
    description: 'Articles, tutorials and insights written by club members and mentors.',
    icon: FileText,
    action: { label: 'Read the blog', to: '/blogs' },
  },
  {
    title: 'Event calendar',
    description: 'Upcoming workshops, hackathons and networking events.',
    icon: Library,
    action: { label: 'View events', to: '/events' },
  },
]

export function Learn() {
  const [query, setQuery] = useState('')
  const [field, setField] = useState('all')
  const [topic, setTopic] = useState('all')

  return (
    <>
      <PageHero
        eyebrow="Learning library"
        title="Learn with material from the club"
        description="Published notes and warmup resources from club sessions. Filter by field of study or topic to find the material that matches your learning path."
        media={learnHero}
        actions={
          <ButtonLink to="/topics" size="md">
            Browse learning paths
          </ButtonLink>
        }
        aside={
          <div className="rounded-lg border border-line bg-canvas p-4 lg:max-w-[320px]">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Who publishes notes</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              Quizmasters upload notes to a quiz and release them when the quiz is published. Member-only quizzes appear
              in the Warmup area after signing in.
            </p>
          </div>
        }
      />

      <section className="section border-b border-line" data-reveal>
        <div className="container-editorial">
          <SectionHead
            eyebrow="Published notes"
            title="The library"
            description="Only notes attached to a published quiz are listed publicly."
          />

          <form
            className="mt-6 grid gap-3 rounded-lg border border-line bg-canvas/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_200px_220px]"
            role="search"
            aria-label="Filter learning notes"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="relative">
              <label htmlFor="learn-search" className="sr-only">
                Search notes
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
              <Input
                id="learn-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes, topics or titles…"
                className="pl-9"
              />
            </div>
            <div>
              <label htmlFor="learn-field" className="sr-only">
                Field of study
              </label>
              <Select id="learn-field" value={field} onChange={(event) => setField(event.target.value)}>
                <option value="all">All fields</option>
                <option value="web">Web development</option>
                <option value="programming">Programming</option>
                <option value="data">Data science</option>
                <option value="security">Cybersecurity</option>
              </Select>
            </div>
            <div>
              <label htmlFor="learn-topic" className="sr-only">
                Topic
              </label>
              <Select id="learn-topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="all">All topics</option>
                {POPULAR_TOPICS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
          </form>

          <div className="mt-4">
            <EmptyState
              icon={<FileText className="h-4 w-4" aria-hidden />}
              title="No published notes yet"
              description="Learning notes appear here when a quizmaster publishes a quiz with attached material."
              action={
                query || field !== 'all' || topic !== 'all' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery('')
                      setField('all')
                      setTopic('all')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <ButtonLink to="/topics" variant="outline" size="sm">
                    Browse learning paths
                  </ButtonLink>
                )
              }
            />
          </div>
          <p className="mt-2 text-[0.6875rem] text-ink-400">
            Filters are functional. No note records are displayed because publication could not be verified.
          </p>
        </div>
      </section>

      <section className="section border-b border-line bg-canvas/60">
        <div className="container-editorial">
          <SectionHead
            eyebrow="Learning resources"
            title="Where to find the rest"
            description="The club's wider resource hub links study material, recordings, code, tools and the event calendar. Only destinations that exist are linked."
          />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => {
              const Icon = resource.icon
              const disabled = !resource.action.to
              return (
                <div key={resource.title} className="flex flex-col justify-between gap-4 bg-surface p-5">
                  <div>
                    <Icon className="h-4 w-4 text-brand-700" aria-hidden />
                    <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-950">{resource.title}</h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{resource.description}</p>
                  </div>
                  {disabled ? (
                    <span className="inline-flex items-center gap-1 text-[0.75rem] text-ink-400">
                      {resource.action.label}
                    </span>
                  ) : (
                    <Link
                      to={resource.action.to}
                      className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-brand-800 hover:underline"
                    >
                      {resource.action.label}
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

export default Learn

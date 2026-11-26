import { useMemo, useState } from 'react'
import { FolderGit2, Search, SlidersHorizontal } from 'lucide-react'
import { JoinBand, LinkArrow } from '../../components/site/primitives'
import { PageHero, media } from '../../components/site/hero'
import { Alert, Badge, EmptyState } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Input, Select } from '../../components/ui/field'
import { TypeCover } from '../../components/site/primitives'
import { usePublicData } from '../../lib/usePublicData'
import { publicApi } from '../../lib/publicApi'

const projectsHero = media('/images/projects/phone-ui', 'A phone screen showing an app interface')

export function Projects() {
  const [query, setQuery] = useState('')
  const [technology, setTechnology] = useState('all')
  const [year, setYear] = useState('all')
  const { data, loading, error } = usePublicData(() => publicApi.projects({ per_page: 50 }), [])
  const projects = data?.items ?? []

  const technologies = useMemo(
    () => Array.from(new Set(projects.flatMap((project) => project.technologies))).sort(),
    [projects],
  )
  const years = useMemo(
    () => Array.from(new Set(projects.map((project) => project.year).filter(Boolean) as string[])).sort().reverse(),
    [projects],
  )

  const results = projects.filter((project) => {
    const text = `${project.title} ${project.summary} ${project.technologies.join(' ')}`.toLowerCase()
    const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase())
    const matchesTech = technology === 'all' || project.technologies.includes(technology)
    const matchesYear = year === 'all' || project.year === year
    return matchesQuery && matchesTech && matchesYear
  })

  const filtered = Boolean(query.trim()) || technology !== 'all' || year !== 'all'
  const featured = projects[0]

  return (
    <>
      <PageHero
        eyebrow="Projects"
        title="Our projects"
        description="Discover solutions built by club members using the technologies they are learning. Published records show the stack and, where available, the outcomes."
        media={projectsHero}
        actions={
          <Button variant="outline" size="md" onClick={() => document.getElementById('project-catalogue')?.scrollIntoView({ behavior: 'smooth' })}>
            Browse the catalogue
          </Button>
        }
        aside={
          <div className="rounded-lg border border-line bg-canvas p-5">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Build with the club</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-ink-600">
              Have an idea? Join to collaborate with like-minded students, access mentorship and turn concepts into real
              solutions.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <LinkArrow to="/auth/register">Join to start a project</LinkArrow>
              <LinkArrow to="/contact?topic=project-idea">Submit a project idea</LinkArrow>
            </div>
          </div>
        }
      />

      {error ? (
        <div className="container-editorial py-8">
          <Alert tone="warning" title="Projects could not be loaded">
            {error}
          </Alert>
        </div>
      ) : null}

      {featured ? (
        <section className="section border-b border-line">
          <div className="container-editorial">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="eyebrow">Featured project</p>
                <h2 className="mt-3 text-display-md text-ink-950">A project record, not a screenshot.</h2>
                <p className="mt-3 max-w-[40ch] text-[0.9375rem] leading-7 text-ink-600">
                  The club publishes individual project records with their stack, team context and outcomes.
                </p>
              </div>
              <article id={`project-${featured.id}`} className="overflow-hidden rounded-lg border border-line">
                {featured.cover_url ? (
                  <img src={featured.cover_url} alt={featured.title} className="aspect-[16/9] w-full object-cover" />
                ) : (
                  <TypeCover title={featured.title} label="Featured project" index="01" className="min-h-[200px]" />
                )}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="green">Published record</Badge>
                    <span className="text-[0.6875rem] text-ink-400">{featured.year ?? ''}</span>
                  </div>
                  <h3 className="mt-3 text-h2 text-ink-950">{featured.title}</h3>
                  <p className="mt-2 text-[0.875rem] leading-7 text-ink-600">{featured.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <ul className="flex flex-wrap gap-1.5">
                      {featured.technologies.map((tech) => (
                        <li key={tech} className="rounded-[4px] border border-line bg-ink-50 px-2 py-0.5 text-[0.6875rem] text-ink-600">
                          {tech}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[0.625rem] text-ink-400">By {featured.owner_display_name}</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" id="project-catalogue" data-reveal>
        <div className="container-editorial">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Catalogue</p>
              <h2 className="mt-2 text-display-md text-ink-950">All projects</h2>
            </div>
            <p className="max-w-[46ch] text-[0.75rem] leading-5 text-ink-400">
              Search by name, technology or description. Only projects published by the club appear here.
            </p>
          </div>

          <form
            className="mt-6 grid gap-3 rounded-lg border border-line bg-canvas/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_200px_220px_auto]"
            onSubmit={(event) => event.preventDefault()}
            role="search"
            aria-label="Filter projects"
          >
            <div className="relative">
              <label htmlFor="project-search" className="sr-only">
                Search projects
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
              <Input
                id="project-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects by name, technology or description…"
                className="pl-9"
              />
            </div>
            <div>
              <label htmlFor="project-year" className="sr-only">
                Year
              </label>
              <Select id="project-year" value={year} onChange={(event) => setYear(event.target.value)}>
                <option value="all">All years</option>
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="project-tech" className="sr-only">
                Technology
              </label>
              <Select id="project-tech" value={technology} onChange={(event) => setTechnology(event.target.value)}>
                <option value="all">All technologies</option>
                {technologies.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                iconLeft={<SlidersHorizontal className="h-3.5 w-3.5" />}
                onClick={() => {
                  setQuery('')
                  setTechnology('all')
                  setYear('all')
                }}
              >
                Reset
              </Button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.75rem] text-ink-500" role="status">
              {loading ? 'Loading projects…' : `${results.length} ${results.length === 1 ? 'project' : 'projects'}`}
              {filtered ? ' match your filters' : ' published'}
            </p>
          </div>

          <div className="mt-6">
            {results.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {results.map((project, index) => (
                  <article key={project.id} id={`project-${project.id}`} className="overflow-hidden rounded-lg border border-line bg-surface">
                    {project.cover_url ? (
                      <img src={project.cover_url} alt={project.title} className="aspect-[16/9] w-full object-cover" />
                    ) : (
                      <TypeCover
                        title={project.title}
                        label={project.technologies[0] ?? 'Member project'}
                        index={String(index + 1).padStart(2, '0')}
                        tone={index % 2 === 0 ? 'soft' : 'charcoal'}
                        className="min-h-[170px]"
                      />
                    )}
                    <div className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge tone="outline">{project.year ?? 'Undated'}</Badge>
                        <span className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">
                          {project.owner_display_name}
                        </span>
                      </div>
                      <h3 className="mt-3 text-h3 text-ink-950">{project.title}</h3>
                      <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-500">{project.summary}</p>
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <li key={tech} className="rounded-[4px] border border-line px-2 py-0.5 text-[0.6875rem] text-ink-600">
                            {tech}
                          </li>
                        ))}
                        {project.technologies.length > 4 ? (
                          <li className="px-1 py-0.5 text-[0.6875rem] text-ink-400">+{project.technologies.length - 4}</li>
                        ) : null}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FolderGit2 className="h-4 w-4" aria-hidden />}
                title={loading ? 'Loading projects…' : filtered ? 'No projects match these filters' : 'No projects available'}
                description={
                  filtered
                    ? 'Try a different technology or year, or clear the filters to see every published project.'
                    : 'Projects will appear here once they are published by administrators or members.'
                }
                action={
                  filtered ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuery('')
                        setTechnology('all')
                        setYear('all')
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <LinkArrow to="/contact?topic=project-idea">Submit a project idea</LinkArrow>
                  )
                }
              />
            )}
          </div>
        </div>
      </section>

      <JoinBand
        eyebrow="Start your own project"
        title="Have an innovative idea?"
        description="Join Digital Club to collaborate with like-minded students, access mentorship, and turn your concepts into real-world solutions."
        primary={{ label: 'Join to start a project', to: '/auth/register' }}
        secondary={{ label: 'Submit a project idea', to: '/contact?topic=project-idea' }}
      />
    </>
  )
}

export default Projects

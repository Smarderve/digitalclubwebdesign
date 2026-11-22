import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FolderGit2, Github, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { demoMemberProjects } from '../../data/demo'
import { PageHeader, DataToolbar } from '../../components/app/primitives'
import { Badge, ConfirmDialog, EmptyState, StatusBadge, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { Teams } from './Teams'
import { Button, ButtonLink } from '../../components/ui/button'
import { Select } from '../../components/ui/field'
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '../../components/ui/dropdown'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

export function MyProjects({ embedded = false }: { embedded?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'team' ? 'team' : 'projects'
  const [projects, setProjects] = useState(demoMemberProjects)
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const { push } = useToast()
  const navigate = useNavigate()

  const filtered = projects.filter((project) => {
    const matchesSearch = `${project.title} ${project.technologies}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesVisibility = visibility === 'all' || project.visibility.toLowerCase() === visibility
    return matchesSearch && matchesVisibility
  })

  return (
    <>
      {embedded ? null : (
        <PageHeader
          title="My projects"
          description="Projects attached to your member profile. Public projects can appear in the club catalogue after review."
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Projects' }]}
          actions={
            <ButtonLink to="/member/projects/add" size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />}>
              Add project
            </ButtonLink>
          }
        />
      )}

      <Tabs
        value="projects"
        onValueChange={(value) => {
          const next = new URLSearchParams(searchParams)
          if (value === 'projects') next.delete('tab')
          else next.set('tab', value)
          setSearchParams(next, { replace: true })
        }}
      >
        {embedded ? null : (
          <TabsList ariaLabel="Projects sections">
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="projects">
          <div className={embedded ? 'pt-0' : 'pt-5'}>
            {embedded ? (
              <div className="mb-3 flex justify-end">
                <ButtonLink to="/member/projects/add" size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />}>
                  Add project
                </ButtonLink>
              </div>
            ) : null}
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <DataToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search your projects…"
          count={`${filtered.length} of ${projects.length} projects`}
        >
          <Select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="h-9 w-[140px]" aria-label="Filter by visibility">
            <option value="all">All visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </Select>
        </DataToolbar>

        {filtered.length ? (
          <div className="divide-y divide-line">
            {filtered.map((project) => (
              <div key={project.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[0.9375rem] font-semibold text-ink-950">{project.title}</h2>
                    <Badge tone={project.visibility === 'Public' ? 'green' : 'outline'}>{project.visibility}</Badge>
                    <StatusBadge status={project.status.toLowerCase()} />
                  </div>
                  <p className="mt-1 max-w-[80ch] text-[0.8125rem] leading-6 text-ink-500">{project.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.6875rem] text-ink-400">
                    <span>{project.technologies}</span>
                    <span>Updated {formatDate(project.updated)}</span>
                    {project.link ? (
                      <a href={project.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-800 hover:underline">
                        <Github className="h-3 w-3" aria-hidden />
                        Repository
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/member/projects/edit/${project.id}`)} iconLeft={<Pencil className="h-3.5 w-3.5" />}>
                    Edit
                  </Button>
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${project.title}`}>
                        <MoreHorizontal className="h-4 w-4" aria-hidden />
                      </Button>
                    </DropdownTrigger>
                    <DropdownContent>
                      <DropdownItem to={`/member/projects/edit/${project.id}`} icon={<Pencil className="h-3.5 w-3.5" />}>
                        Edit project
                      </DropdownItem>
                      <DropdownItem destructive icon={<Trash2 className="h-3.5 w-3.5" />} onSelect={() => setDeleteTarget(project.id)}>
                        Delete project
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<FolderGit2 className="h-4 w-4" aria-hidden />}
              title={projects.length ? 'No projects match these filters' : 'No projects yet'}
              description={
                projects.length
                  ? 'Try a different search term or visibility filter.'
                  : 'Add a project to build your profile. It stays private until you choose to publish it.'
              }
              action={
                projects.length ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setVisibility('all')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <ButtonLink to="/member/projects/add" size="sm">
                    Add your first project
                  </ButtonLink>
                )
              }
            />
          </div>
        )}
      </div>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Projects marked private are visible only to you and club administrators. Public projects may be featured on the
        club website after review. This prototype does not persist changes.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-md border border-line bg-canvas/50 px-4 py-3">
        <p className="text-[0.75rem] text-ink-500">Looking for project ideas or teammates?</p>
        <Link to="/projects" className="text-[0.75rem] font-semibold text-brand-800 hover:underline">
          Browse club projects
        </Link>
      </div>

          </div>
        </TabsContent>

      </Tabs>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this project?"
        description="The project would be removed from your profile and the public catalogue."
        confirmLabel="Delete project"
        onConfirm={() => {
          if (deleteTarget === null) return
          setProjects((current) => current.filter((project) => project.id !== deleteTarget))
          push({ tone: 'success', title: 'Project removed', description: 'Prototype only — nothing was deleted from the database.' })
        }}
      />
    </>
  )
}

export default MyProjects

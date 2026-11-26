import { useCallback, useMemo, useState } from 'react'
import { ExternalLink, FolderGit2, Pencil, Trash2 } from 'lucide-react'
import { PROJECTS } from '../../data/site'
import { demoMemberProjects } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Button, ButtonLink, Card, ConfirmDialog, EmptyState, StatusBadge } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type ProjectRow = {
  id: string
  title: string
  owner: string
  technologies: string
  status: string
  visibility: string
  updated: string
  link: string
  source: 'Published record' | 'Member submission'
}

export function AdminProjects() {
  const [filter, setFilter] = useState<'all' | 'published' | 'submitted'>('all')
  const [removed, setRemoved] = useState<string[]>([])
  const [deleting, setDeleting] = useState<ProjectRow | null>(null)
  const { push } = useToast()

  const rows = useMemo<ProjectRow[]>(
    () => [
      ...PROJECTS.map((project) => ({
        id: project.slug,
        title: project.title,
        owner: 'Club project',
        technologies: project.technologies.join(', ') || 'Not listed',
        status: 'Published',
        visibility: 'Public',
        updated: project.year,
        link: `/projects`,
        source: 'Published record' as const,
      })),
      ...demoMemberProjects.map((project) => ({
        id: `member-${project.id}`,
        title: project.title,
        owner: 'Amina Juma',
        technologies: project.technologies,
        status: project.status,
        visibility: project.visibility,
        updated: project.updated,
        link: project.link || '/projects',
        source: 'Member submission' as const,
      })),
    ],
    [],
  )

  const active = rows.filter((row) => !removed.includes(row.id) && (filter === 'all' || (filter === 'published' ? row.status === 'Published' : row.source === 'Member submission')))
  const matches = useCallback((row: ProjectRow, query: string) => `${row.title} ${row.owner} ${row.technologies} ${row.status}`.toLowerCase().includes(query), [])
  const list = useAdminList(active, matches)

  return (
    <>
      <PageHeader
        title="Projects"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Projects' }]}
        actions={<ButtonLink to="/projects" variant="outline" size="sm" iconLeft={<ExternalLink className="h-3.5 w-3.5" />}>View showcase</ButtonLink>}
      />

      <StatStrip>
        <SmallStat label="Published projects" value={rows.filter((row) => row.status === 'Published').length} hint="On the public site" tone="brand" />
        <SmallStat label="Member submissions" value={rows.filter((row) => row.source === 'Member submission').length} hint="Awaiting review" tone="amber" />
        <SmallStat label="Drafts" value={rows.filter((row) => row.status === 'Draft').length} hint="Not public yet" />
        <SmallStat label="Technologies listed" value={new Set(rows.flatMap((row) => row.technologies.split(',').map((item) => item.trim()).filter(Boolean))).size} hint="Across records" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search projects by title, owner or technology…" count={`${list.total} projects`}>
          <FilterChips
            label="Project source"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'published', label: 'Published' },
              { value: 'submitted', label: 'Member submissions' },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} projects` }}
          emptyTitle="No projects match these filters"
          emptyDescription="Try another source or clear the search field."
          columns={[
            {
              id: 'title',
              header: 'Project',
              sortValue: (row) => row.title,
              cell: (row) => (
                <div className="max-w-[320px]">
                  <p className="font-medium text-ink-900">{row.title}</p>
                  <p className="text-[0.6875rem] text-ink-400">{row.source} · {row.owner}</p>
                </div>
              ),
            },
            { id: 'technologies', header: 'Technologies', cell: (row) => <span className="block max-w-[220px] text-[0.75rem] text-ink-500">{row.technologies}</span> },
            { id: 'visibility', header: 'Visibility', cell: (row) => <Badge tone="outline">{row.visibility}</Badge> },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status.toLowerCase()} /> },
            { id: 'updated', header: 'Updated', sortValue: (row) => row.updated, cell: (row) => <span className="whitespace-nowrap text-ink-500">{row.updated.length > 7 ? formatDate(row.updated) : row.updated}</span> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.title}`}>
                  <DropdownItem to="/projects" icon={<ExternalLink className="h-3.5 w-3.5" />}>View on showcase</DropdownItem>
                  <DropdownItem icon={<Pencil className="h-3.5 w-3.5" />} onSelect={() => push({ tone: 'info', title: 'Project editing is available from the record page', description: `${row.title} — members edit their own submissions from the member area.` })}>
                    Edit record
                  </DropdownItem>
                  <DropdownItem icon={<Trash2 className="h-3.5 w-3.5" />} destructive onSelect={() => setDeleting(row)}>Remove from showcase</DropdownItem>
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.6875rem] leading-5 text-ink-400">
          Published projects in this table come from the current site. Member projects are demonstration records.
        </p>
        <Button
          variant="ghost"
          size="xs"
          iconLeft={<FolderGit2 className="h-3 w-3" />}
          onClick={() => push({ tone: 'info', title: 'Project review queue', description: 'New member submissions appear here once the live upload flow is connected.' })}
        >
          Review queue
        </Button>
      </div>
      <DemoNotice />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove this project?"
        description={`${deleting?.title ?? 'This project'} will no longer appear on the public showcase. The member's record is kept.`}
        confirmLabel="Remove project"
        onConfirm={() => {
          if (!deleting) return
          setRemoved((current) => [...current, deleting.id])
          push({ tone: 'info', title: 'Project removed' })
        }}
      />

      {active.length === 0 ? (
        <div className="mt-4">
          <Card><div className="p-4"><EmptyState icon={<FolderGit2 className="h-4 w-4" aria-hidden />} title="No projects in this view" description="Choose another filter to see the full project list." /></div></Card>
        </div>
      ) : null}
    </>
  )
}

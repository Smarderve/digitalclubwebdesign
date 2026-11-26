import { useCallback, useState } from 'react'
import { Layers, Plus, Power } from 'lucide-react'
import { demoTechnologies } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Button, Card, Dialog, DialogContent, Field, Input, Select, Textarea } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, FilterChips, RowActions, DropdownItem, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'

type TechRow = (typeof demoTechnologies)[number]

const fieldLabels: Record<string, string> = { web: 'Web development', mobile: 'Mobile', ai: 'AI & data', data: 'Data', iot: 'IoT', other: 'Other' }

export function AdminTechnologies() {
  const [rows, setRows] = useState<TechRow[]>(demoTechnologies)
  const [filter, setFilter] = useState<'all' | 'web' | 'mobile' | 'ai' | 'data' | 'iot' | 'other'>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'web', description: '' })
  const [error, setError] = useState('')
  const { push } = useToast()

  const matches = useCallback((row: TechRow, query: string) => `${row.name} ${row.category} ${row.description}`.toLowerCase().includes(query), [])
  const base = rows.filter((row) => filter === 'all' || row.category === filter)
  const list = useAdminList(base, matches, 10)

  return (
    <>
      <PageHeader
        title="Technologies"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Technologies' }]}
        actions={<Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => { setForm({ name: '', category: 'web', description: '' }); setError(''); setOpen(true) }}>Add technology</Button>}
      />

      <StatStrip>
        <SmallStat label="Technologies" value={rows.length} hint="In the vocabulary" tone="brand" />
        <SmallStat label="Active" value={rows.filter((row) => row.active).length} hint="Selectable by members" />
        <SmallStat label="Hidden" value={rows.filter((row) => !row.active).length} hint="Retained for records" />
        <SmallStat label="Categories" value={new Set(rows.map((row) => row.category)).size} hint="Used in filters" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search technologies…" count={`${list.total} technologies`}>
          <FilterChips
            label="Technology category"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'web', label: 'Web' },
              { value: 'mobile', label: 'Mobile' },
              { value: 'ai', label: 'AI' },
              { value: 'data', label: 'Data' },
              { value: 'iot', label: 'IoT' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </AdminToolbar>
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} technologies` }}
          emptyTitle="No technologies match"
          emptyDescription="Try another category or clear the search field."
          columns={[
            { id: 'name', header: 'Technology', sortValue: (row) => row.name, cell: (row) => <span className="font-medium text-ink-900">{row.name}</span> },
            { id: 'category', header: 'Category', sortValue: (row) => row.category, cell: (row) => <Badge tone="outline">{fieldLabels[row.category] ?? row.category}</Badge> },
            { id: 'description', header: 'Description', cell: (row) => <span className="block max-w-[420px] text-[0.75rem] text-ink-500">{row.description}</span> },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => (
                <button
                  type="button"
                  aria-pressed={row.active}
                  onClick={() => {
                    setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, active: !entry.active } : entry)))
                    push({ tone: 'info', title: row.active ? 'Technology hidden' : 'Technology enabled', description: `${row.name} — no production vocabulary changed.` })
                  }}
                >
                  <Badge tone={row.active ? 'green' : 'neutral'} dot>{row.active ? 'Active' : 'Hidden'}</Badge>
                </button>
              ),
            },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.name}`}>
                  <DropdownItem
                    icon={<Power className="h-3.5 w-3.5" />}
                    onSelect={() => {
                      setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, active: !entry.active } : entry)))
                      push({ tone: 'info', title: row.active ? 'Technology hidden' : 'Technology enabled', description: `${row.name} — existing project tags are unaffected.` })
                    }}
                  >
                    {row.active ? 'Hide from selection' : 'Enable for selection'}
                  </DropdownItem>
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <div className="mt-4">
        <Alert tone="info" title="Why the vocabulary is controlled">
          A shared list keeps project filters and member profiles consistent. Remove duplicates instead of adding similar names.
        </Alert>
      </div>
      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Add a technology"
          description="Members will be able to tag projects with this technology."
          size="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  if (form.name.trim().length < 2) {
                    setError('Enter the technology name.')
                    return
                  }
                  if (rows.some((row) => row.name.toLowerCase() === form.name.trim().toLowerCase())) {
                    setError('This technology is already in the list.')
                    return
                  }
                  setRows((current) => [...current, { id: Math.max(0, ...current.map((row) => row.id)) + 1, name: form.name.trim(), category: form.category, active: true, description: form.description || 'No description yet.' }])
                  push({ tone: 'success', title: 'Technology added' })
                  setOpen(false)
                }}
              >
                Add technology
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Name" htmlFor="tech-name" required error={error}>
              <Input id="tech-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Svelte" />
            </Field>
            <Field label="Category" htmlFor="tech-category">
              <Select id="tech-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {Object.entries(fieldLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </Field>
            <Field label="Description" htmlFor="tech-description" optional hint="One short sentence shown as a tooltip.">
              <Textarea id="tech-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A compiler that turns components into small web apps." />
            </Field>
          </div>
        </DialogContent>
      </Dialog>

      <p className="mt-3 flex items-center gap-1.5 text-[0.6875rem] text-ink-400">
        <Layers className="h-3 w-3" aria-hidden />
        Hidden technologies stay on existing records but cannot be selected for new projects.
      </p>
    </>
  )
}

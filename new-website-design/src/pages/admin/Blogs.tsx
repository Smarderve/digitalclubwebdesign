import { useCallback, useState } from 'react'
import { ExternalLink, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { demoAdminBlogs } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Button, Card, ConfirmDialog, Dialog, DialogContent, Field, Input, Select, StatusBadge, Textarea } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, DropdownItem, RowActions, SmallStat, StatStrip, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

type BlogRow = (typeof demoAdminBlogs)[number]

const emptyForm = { title: '', category: 'Tutorial', status: 'Draft', summary: '' }

export function AdminBlogs() {
  const [rows, setRows] = useState<BlogRow[]>(demoAdminBlogs)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BlogRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState<BlogRow | null>(null)
  const { push } = useToast()

  const matches = useCallback((row: BlogRow, query: string) => `${row.title} ${row.category} ${row.author} ${row.status}`.toLowerCase().includes(query), [])
  const list = useAdminList(rows, matches)

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setOpen(true)
  }

  function openEdit(row: BlogRow) {
    setEditing(row)
    setForm({ title: row.title, category: row.category, status: row.status, summary: '' })
    setErrors({})
    setOpen(true)
  }

  function save() {
    const next: Record<string, string> = {}
    if (form.title.trim().length < 10) next.title = 'Write a clear article title.'
    if (form.status === 'Published' && form.summary.trim().length < 30) next.summary = 'Add a summary of at least 30 characters before publishing.'
    setErrors(next)
    if (Object.keys(next).length) return
    if (editing) {
      setRows((current) =>
        current.map((row) =>
          row.id === editing.id
            ? { ...row, title: form.title, category: form.category, status: form.status, date: form.status === 'Published' && row.date === '—' ? new Date().toISOString().slice(0, 10) : row.date }
            : row,
        ),
      )
      push({ tone: 'success', title: 'Article updated' })
    } else {
      setRows((current) => [
        {
          id: Math.max(0, ...current.map((row) => row.id)) + 1,
          title: form.title,
          category: form.category,
          author: 'Daniel Mushi',
          status: form.status,
          views: 0,
          date: form.status === 'Published' ? new Date().toISOString().slice(0, 10) : '—',
        },
        ...current,
      ])
      push({ tone: 'success', title: 'Draft article created' })
    }
    setOpen(false)
  }

  return (
    <>
      <PageHeader
        title="Blogs"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Blogs' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => push({ tone: 'info', title: 'Blog index is public', description: 'Open /blogs in the site header to review published articles.' })}>
              View public blog
            </Button>
            <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>New article</Button>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Articles" value={rows.length} hint="All records" tone="brand" />
        <SmallStat label="Published" value={rows.filter((row) => row.status === 'Published').length} hint="Visible to visitors" />
        <SmallStat label="Drafts" value={rows.filter((row) => row.status === 'Draft').length} hint="Not visible publicly" tone="amber" />
        <SmallStat label="Total views" value={rows.reduce((total, row) => total + row.views, 0).toLocaleString('en-US')} hint="Published articles" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search articles by title, category or author…" count={`${list.total} articles`} />
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} articles` }}
          emptyTitle="No articles match this search"
          emptyDescription="Try a different title or clear the search field."
          columns={[
            {
              id: 'title',
              header: 'Article',
              sortValue: (row) => row.title,
              cell: (row) => (
                <div className="max-w-[440px]">
                  <p className="font-medium text-ink-900">{row.title}</p>
                  <p className="text-[0.6875rem] text-ink-400">{row.category} · {row.author}</p>
                </div>
              ),
            },
            { id: 'views', header: 'Views', align: 'right', sortValue: (row) => row.views, cell: (row) => <span className="tabular">{row.views.toLocaleString('en-US')}</span> },
            { id: 'date', header: 'Published', sortValue: (row) => row.date, cell: (row) => <span className="whitespace-nowrap text-ink-500">{row.date === '—' ? 'Not published' : formatDate(row.date)}</span> },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status.toLowerCase()} /> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.title}`}>
                  <DropdownItem to="/blogs" icon={<ExternalLink className="h-3.5 w-3.5" />}>View public blog</DropdownItem>
                  <DropdownItem icon={<Eye className="h-3.5 w-3.5" />} onSelect={() => push({ tone: 'info', title: 'Article preview', description: `${row.title} — preview opens the public blog in the live application.` })}>
                    Preview article
                  </DropdownItem>
                  <DropdownItem icon={<Pencil className="h-3.5 w-3.5" />} onSelect={() => openEdit(row)}>Edit article</DropdownItem>
                  <DropdownItem
                    icon={<Eye className="h-3.5 w-3.5" />}
                    onSelect={() => {
                      const publishing = row.status !== 'Published'
                      setRows((current) =>
                        current.map((entry) =>
                          entry.id === row.id
                            ? { ...entry, status: publishing ? 'Published' : 'Draft', date: publishing ? new Date().toISOString().slice(0, 10) : '—' }
                            : entry,
                        ),
                      )
                      push({ tone: 'info', title: publishing ? 'Article published' : 'Article unpublished' })
                    }}
                  >
                    {row.status === 'Published' ? 'Unpublish' : 'Publish'}
                  </DropdownItem>
                  <DropdownItem icon={<Trash2 className="h-3.5 w-3.5" />} destructive onSelect={() => setDeleting(row)}>Delete</DropdownItem>
                </RowActions>
              ),
            },
          ]}
        />
      </Card>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        The published articles in this list come from the club's existing blog. New articles and edits stay in this browser session only.
      </p>
      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={editing ? 'Edit article' : 'New article'}
          description="Articles support long-form Markdown content in the live application."
          size="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={save}>{editing ? 'Save changes' : 'Create article'}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Title" htmlFor="blog-title" required error={errors.title}>
              <Input id="blog-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Article title" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="blog-category">
                <Select id="blog-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  <option>Tutorial</option>
                  <option>Tech</option>
                  <option>General</option>
                </Select>
              </Field>
              <Field label="Status" htmlFor="blog-status" hint="Drafts are only visible to administrators.">
                <Select id="blog-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option>Draft</option>
                  <option>Published</option>
                </Select>
              </Field>
            </div>
            <Field label="Summary" htmlFor="blog-summary" required={form.status === 'Published'} error={errors.summary} hint="Shown on the blog index and in search results.">
              <Textarea id="blog-summary" rows={4} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="What is this article about?" />
            </Field>
            <Field label="Body" htmlFor="blog-body" hint="Markdown is supported in the live editor. ">
              <Textarea id="blog-body" rows={7} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="Write the article…" />
            </Field>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this article?"
        description={`${deleting?.title ?? 'This article'} will be removed. In the live application deletion is permanent and removes the public page.`}
        confirmLabel="Delete article"
        onConfirm={() => {
          if (!deleting) return
          setRows((current) => current.filter((row) => row.id !== deleting.id))
          push({ tone: 'info', title: 'Article removed' })
        }}
      />
    </>
  )
}

import { useState } from 'react'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { demoAdminNews } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Button, Card, ConfirmDialog, Dialog, DialogContent, Field, Input, Select, StatusBadge, Textarea } from '../../components/ui'
import { AdminTable, AdminToolbar, DemoNotice, DropdownItem, RowActions, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'
import { useCallback } from 'react'

type NewsRow = (typeof demoAdminNews)[number]

export function AdminNews() {
  const [rows, setRows] = useState<NewsRow[]>(demoAdminNews)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<NewsRow | null>(null)
  const [form, setForm] = useState({ title: '', category: 'General', excerpt: '', body: '', status: 'Draft' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState<NewsRow | null>(null)
  const { push } = useToast()

  const matches = useCallback((row: NewsRow, query: string) => `${row.title} ${row.category} ${row.status}`.toLowerCase().includes(query), [])
  const list = useAdminList(rows, matches)

  function openAdd() {
    setEditing(null)
    setForm({ title: '', category: 'General', excerpt: '', body: '', status: 'Draft' })
    setErrors({})
    setOpen(true)
  }

  function openEdit(row: NewsRow) {
    setEditing(row)
    setForm({ title: row.title, category: row.category, excerpt: '', body: '', status: row.status })
    setErrors({})
    setOpen(true)
  }

  return (
    <>
      <PageHeader
        title="News"
        description="Short announcements shown on the homepage and news page. News is separate from long-form blog articles."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'News' }]}
        actions={<Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>New announcement</Button>}
      />

      <Card>
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search announcements…" count={`${list.total} items`} />
        <AdminTable
          rows={list.visible}
          keyOf={(row) => row.id}
          pagination={{ page: list.page, pageCount: list.pageCount, onChange: list.setPage, totalLabel: `${list.total} announcements` }}
          emptyTitle="No announcements"
          emptyDescription="Create an announcement for members and visitors."
          columns={[
            {
              id: 'title',
              header: 'Title',
              sortValue: (row) => row.title,
              cell: (row) => (
                <div>
                  <p className="font-medium text-ink-900">{row.title}</p>
                  <p className="text-[0.6875rem] text-ink-400">{row.category}</p>
                </div>
              ),
            },
            { id: 'author', header: 'Author', cell: (row) => <span className="text-ink-500">{row.author}</span> },
            { id: 'date', header: 'Date', sortValue: (row) => row.date, cell: (row) => <span className="whitespace-nowrap text-ink-500">{row.date === '—' ? 'Not published' : formatDate(row.date)}</span> },
            { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
            {
              id: 'actions',
              header: '',
              align: 'right',
              cell: (row) => (
                <RowActions label={`Actions for ${row.title}`}>
                  <DropdownItem to="/news" icon={<ExternalLink className="h-3.5 w-3.5" />}>View public news</DropdownItem>
                  <DropdownItem icon={<Pencil className="h-3.5 w-3.5" />} onSelect={() => openEdit(row)}>Edit announcement</DropdownItem>
                  <DropdownItem
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onSelect={() => {
                      setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, status: entry.status === 'Published' ? 'Draft' : 'Published', date: entry.status === 'Published' ? '—' : new Date().toISOString().slice(0, 10) } : row.id === entry.id ? entry : entry)))
                      push({ tone: 'info', title: row.status === 'Published' ? 'Unpublished in the prototype' : 'Published in the prototype', description: 'No production content was changed.' })
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

      <p className="mt-3 text-[0.6875rem] text-ink-400">Archived announcements stay available in the record but are not shown as current news.</p>
      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={editing ? 'Edit announcement' : 'New announcement'}
          description="Keep announcements short. Long-form content belongs in blogs."
          size="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  const next: Record<string, string> = {}
                  if (form.title.trim().length < 8) next.title = 'Write a clear title.'
                  if (form.excerpt.trim().length < 20) next.excerpt = 'Write at least 20 characters for the summary.'
                  if (!form.body.trim()) next.body = 'Add the announcement text.'
                  setErrors(next)
                  if (Object.keys(next).length) return
                  if (editing) {
                    setRows((current) => current.map((row) => (row.id === editing.id ? { ...row, title: form.title, category: form.category, status: form.status, date: form.status === 'Published' ? new Date().toISOString().slice(0, 10) : row.date } : row)))
                    push({ tone: 'success', title: 'Announcement updated in the prototype', description: 'No production content was changed.' })
                  } else {
                    setRows((current) => [{ id: Math.max(...current.map((row) => row.id)) + 1, title: form.title, category: form.category, status: form.status, date: form.status === 'Published' ? new Date().toISOString().slice(0, 10) : '—', author: 'Daniel Mushi' }, ...current])
                    push({ tone: 'success', title: 'Announcement created in the prototype', description: 'No production content was created.' })
                  }
                  setOpen(false)
                }}
              >
                {editing ? 'Save changes' : 'Create announcement'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Title" htmlFor="news-title" required error={errors.title}>
              <Input id="news-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Announcement title" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="news-category">
                <Select id="news-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  <option>General</option>
                  <option>Hackathon</option>
                  <option>Workshop</option>
                  <option>Membership</option>
                  <option>Announcement</option>
                </Select>
              </Field>
              <Field label="Status" htmlFor="news-status" hint="Published announcements appear publicly.">
                <Select id="news-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Archived</option>
                </Select>
              </Field>
            </div>
            <Field label="Summary" htmlFor="news-excerpt" required error={errors.excerpt}>
              <Textarea id="news-excerpt" rows={3} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} placeholder="One or two sentences for listings…" />
            </Field>
            <Field label="Announcement" htmlFor="news-body" required error={errors.body}>
              <Textarea id="news-body" rows={6} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write the announcement…" />
            </Field>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this announcement?"
        description={`${deleting?.title ?? 'This announcement'} will be removed from the news list. This is permanent in the live application.`}
        confirmLabel="Delete announcement"
        onConfirm={() => {
          if (!deleting) return
          setRows((current) => current.filter((row) => row.id !== deleting.id))
          push({ tone: 'info', title: 'Announcement removed in the prototype', description: 'No production content was deleted.' })
        }}
      />
    </>
  )
}

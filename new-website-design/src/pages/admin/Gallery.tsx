import { useCallback, useState } from 'react'
import { ExternalLink, Film, Image as ImageIcon, Plus, Trash2, Upload } from 'lucide-react'
import { demoGalleryItems } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Button, Card, ConfirmDialog, Dialog, DialogContent, Field, FileInput, Input, Select } from '../../components/ui'
import { AdminToolbar, DemoNotice, FilterChips, SmallStat, StatStrip, downloadCsv, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'

type GalleryRow = (typeof demoGalleryItems)[number]

export function AdminGallery() {
  const [rows, setRows] = useState<GalleryRow[]>(demoGalleryItems)
  const [filter, setFilter] = useState<'all' | 'Published' | 'Draft'>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Workshops', type: 'Image', status: 'Draft', file: null as string | null })
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<GalleryRow | null>(null)
  const { push } = useToast()

  const matches = useCallback((row: GalleryRow, query: string) => `${row.title} ${row.category} ${row.type} ${row.status}`.toLowerCase().includes(query), [])
  const base = rows.filter((row) => filter === 'all' || row.status === filter)
  const list = useAdminList(base, matches)

  const categories = ['Workshops', 'Competitions', 'Projects', 'Events']

  return (
    <>
      <PageHeader
        title="Gallery"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Gallery' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => push({ tone: 'info', title: 'Gallery is public', description: 'Review published items from the site navigation.' })}>
              View public gallery
            </Button>
            <Button size="sm" iconLeft={<Upload className="h-3.5 w-3.5" />} onClick={() => { setForm({ title: '', category: 'Workshops', type: 'Image', status: 'Draft', file: null }); setError(''); setOpen(true) }}>
              Add media
            </Button>
          </>
        }
      />

      <StatStrip>
        <SmallStat label="Media items" value={rows.length} hint="All records" tone="brand" />
        <SmallStat label="Published" value={rows.filter((row) => row.status === 'Published').length} hint="Visible publicly" />
        <SmallStat label="Drafts" value={rows.filter((row) => row.status === 'Draft').length} hint="Awaiting review" tone="amber" />
        <SmallStat label="Video items" value={rows.filter((row) => row.type === 'Video').length} hint="Embedded on the gallery" />
      </StatStrip>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search media by title or category…" count={`${list.total} items`}>
          <FilterChips
            label="Publication status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'Published', label: 'Published' },
              { value: 'Draft', label: 'Drafts' },
            ]}
          />
        </AdminToolbar>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.visible.length ? (
            list.visible.map((row) => (
              <article key={row.id} className="overflow-hidden rounded-md border border-line bg-surface">
                <div className={cn('flex h-[120px] items-center justify-center border-b border-line', row.type === 'Video' ? 'bg-ink-900' : 'bg-canvas')}>
                  {row.type === 'Video' ? <Film className="h-7 w-7 text-white/70" aria-hidden /> : <ImageIcon className="h-7 w-7 text-ink-300" aria-hidden />}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[0.8125rem] font-semibold leading-5 text-ink-950">{row.title}</p>
                    <Badge tone={row.status === 'Published' ? 'green' : 'neutral'} dot>{row.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-[0.6875rem] text-ink-400">{row.category} · {formatDate(row.uploaded)}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, status: entry.status === 'Published' ? 'Draft' : 'Published' } : entry)))
                        push({ tone: 'info', title: row.status === 'Published' ? 'Item unpublished' : 'Item published' })
                      }}
                    >
                      {row.status === 'Published' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button variant="ghost" size="xs" iconLeft={<Trash2 className="h-3 w-3" />} onClick={() => setDeleting(row)}>Remove</Button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="sm:col-span-2 xl:col-span-3">
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-6 py-12 text-center">
                <ImageIcon className="h-5 w-5 text-ink-300" aria-hidden />
                <p className="mt-2 text-[0.9375rem] font-semibold text-ink-900">No media match this filter</p>
                <p className="mt-1 text-[0.8125rem] text-ink-500">Clear the search or choose a different status.</p>
              </div>
            </div>
          )}
        </div>
        {list.pageCount > 1 ? (
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="text-[0.75rem] text-ink-500">Page {list.page} of {list.pageCount}</p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="xs" disabled={list.page === 1} onClick={() => list.setPage(list.page - 1)}>Previous</Button>
              <Button variant="outline" size="xs" disabled={list.page === list.pageCount} onClick={() => list.setPage(list.page + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.6875rem] leading-5 text-ink-400">Uploads are not stored. The live application accepts images and video embeds.</p>
        <Button
          variant="ghost"
          size="xs"
          iconLeft={<ExternalLink className="h-3 w-3" />}
          onClick={() => {
            const okay = downloadCsv('gallery-index.csv', rows.map((row) => ({ Title: row.title, Type: row.type, Category: row.category, Status: row.status, Uploaded: row.uploaded })))
            push({ tone: okay ? 'success' : 'error', title: okay ? 'Gallery index exported' : 'Nothing to export' })
          }}
        >
          Export index
        </Button>
      </div>
      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Add media"
          description="Add a photograph or video link to the club gallery."
          size="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  if (form.title.trim().length < 5) {
                    setError('Give the item a descriptive title.')
                    return
                  }
                  if (!form.file) {
                    setError('Choose a file to upload.')
                    return
                  }
                  setRows((current) => [
                    { id: Math.max(0, ...current.map((row) => row.id)) + 1, title: form.title, type: form.type, category: form.category, uploaded: new Date().toISOString().slice(0, 10), status: form.status },
                    ...current,
                  ])
                  push({ tone: 'success', title: 'Media added' })
                  setOpen(false)
                }}
              >
                Add to gallery
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Title" htmlFor="gallery-title" required error={error}>
              <Input id="gallery-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="AI Bootcamp — group work" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Media type" htmlFor="gallery-type">
                <Select id="gallery-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  <option>Image</option>
                  <option>Video</option>
                </Select>
              </Field>
              <Field label="Category" htmlFor="gallery-category">
                <Select id="gallery-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Status" htmlFor="gallery-status">
              <Select id="gallery-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option>Draft</option>
                <option>Published</option>
              </Select>
            </Field>
            <Field label="File" htmlFor="gallery-file" hint="Images up to 10 MB. Video items use a link in the live application.">
              <FileInput id="gallery-file" accept="image/*,video/*" fileName={form.file} onChange={(file) => setForm({ ...form, file: file ? file.name : null })} />
            </Field>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove this media item?"
        description={`${deleting?.title ?? 'This item'} will be removed from the gallery. In the live application the stored file is deleted too.`}
        confirmLabel="Remove item"
        onConfirm={() => {
          if (!deleting) return
          setRows((current) => current.filter((row) => row.id !== deleting.id))
          push({ tone: 'info', title: 'Media removed', description: 'No stored file was deleted.' })
        }}
      />
    </>
  )
}

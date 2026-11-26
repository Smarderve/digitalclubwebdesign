import { useCallback, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { LEADERS } from '../../data/site'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Button, Card, ConfirmDialog, Dialog, DialogContent, EmptyState, Field, Input, Select, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { AdminToolbar, DemoNotice, RowActions, DropdownItem, useAdminList } from './_shared'
import { useToast } from '../../context/ToastContext'

type LeaderRow = { id: number; name: string; position: string; programme: string; year: string; order: number; active: boolean }

const initial: LeaderRow[] = LEADERS.map((leader, index) => ({
  id: index + 1,
  name: leader.name,
  position: leader.position,
  programme: leader.programme,
  year: leader.year ?? '—',
  order: index + 1,
  active: true,
}))

const emptyForm = { name: '', position: 'Project Manager', programme: '', year: 'Year 1' }

export function AdminLeaders() {
  const [rows, setRows] = useState<LeaderRow[]>(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LeaderRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState<LeaderRow | null>(null)
  const { push } = useToast()

  const matches = useCallback((row: LeaderRow, query: string) => `${row.name} ${row.position} ${row.programme} ${row.year}`.toLowerCase().includes(query), [])
  const list = useAdminList(rows, matches, 12)

  const positions = Array.from(new Set(rows.map((row) => row.position)))

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setOpen(true)
  }

  function openEdit(row: LeaderRow) {
    setEditing(row)
    setForm({ name: row.name, position: row.position, programme: row.programme, year: row.year === '—' ? 'Year 1' : row.year })
    setErrors({})
    setOpen(true)
  }

  function save() {
    const next: Record<string, string> = {}
    if (form.name.trim().length < 3) next.name = 'Enter the full name of the leader.'
    if (!form.programme.trim()) next.programme = 'Enter the programme of study.'
    setErrors(next)
    if (Object.keys(next).length) return
    if (editing) {
      setRows((current) => current.map((row) => (row.id === editing.id ? { ...row, ...form } : row)))
      push({ tone: 'success', title: 'Leader record updated', description: 'The public leadership page is unchanged.' })
    } else {
      setRows((current) => [{ id: Math.max(0, ...current.map((row) => row.id)) + 1, ...form, order: current.length + 1, active: true }, ...current])
      push({ tone: 'success', title: 'Leader added' })
    }
    setOpen(false)
  }

  function move(row: LeaderRow, direction: -1 | 1) {
    setRows((current) => {
      const index = current.findIndex((entry) => entry.id === row.id)
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = current.slice()
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((entry, position) => ({ ...entry, order: position + 1 }))
    })
  }

  return (
    <>
      <PageHeader
        title="Leaders"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Leaders' }]}
        actions={<Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>Add leader</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Leaders listed', value: rows.length, hint: 'On the public page' },
          { label: 'Published positions', value: positions.length, hint: 'Across the executive' },
          { label: 'Hidden records', value: rows.filter((row) => !row.active).length, hint: 'Not shown publicly' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-500">{item.label}</p>
            <p className="mt-1.5 text-[1.25rem] font-semibold tabular tracking-tight text-ink-950">{item.value}</p>
            <p className="text-[0.6875rem] text-ink-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <AdminToolbar query={list.query} onQuery={list.setQuery} placeholder="Search by name, position or programme…" count={`${list.total} leaders`} />
        <TableWrap>
          <THead>
            <TR>
              <TH className="w-[64px]">Order</TH>
              <TH>Leader</TH>
              <TH>Position</TH>
              <TH>Programme</TH>
              <TH>Year</TH>
              <TH>Visibility</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {list.filtered.length ? (
              list.filtered.map((row) => (
                <TR key={row.id}>
                  <TD>
                    <div className="flex items-center gap-1">
                      <span className="w-4 text-[0.75rem] tabular text-ink-400">{row.order}</span>
                      <button type="button" aria-label={`Move ${row.name} up`} onClick={() => move(row, -1)} className="rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800">
                        <ArrowUp className="h-3 w-3" aria-hidden />
                      </button>
                      <button type="button" aria-label={`Move ${row.name} down`} onClick={() => move(row, 1)} className="rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800">
                        <ArrowDown className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                  </TD>
                  <TD className="font-medium text-ink-900">{row.name}</TD>
                  <TD className="text-ink-600">{row.position}</TD>
                  <TD className="max-w-[220px] text-ink-500">{row.programme}</TD>
                  <TD className="whitespace-nowrap text-ink-500">{row.year}</TD>
                  <TD>
                    <button
                      type="button"
                      onClick={() => {
                        setRows((current) => current.map((entry) => (entry.id === row.id ? { ...entry, active: !entry.active } : entry)))
                        push({ tone: 'info', title: row.active ? 'Leader hidden' : 'Leader shown', description: 'The public page is unchanged.' })
                      }}
                    >
                      <Badge tone={row.active ? 'green' : 'neutral'} dot>{row.active ? 'Published' : 'Hidden'}</Badge>
                    </button>
                  </TD>
                  <TD className="text-right">
                    <RowActions label={`Actions for ${row.name}`}>
                      <DropdownItem icon={<Pencil className="h-3.5 w-3.5" />} onSelect={() => openEdit(row)}>Edit record</DropdownItem>
                      <DropdownItem
                        icon={<Users className="h-3.5 w-3.5" />}
                        onSelect={() => push({ tone: 'info', title: 'Leadership bios are public' })}
                      >
                        Manage biography
                      </DropdownItem>
                      <DropdownItem icon={<Trash2 className="h-3.5 w-3.5" />} destructive onSelect={() => setDeleting(row)}>Remove leader</DropdownItem>
                    </RowActions>
                  </TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={7} className="p-0">
                  <EmptyState compact title="No leaders match that search" description="Try another name or position." />
                </TD>
              </TR>
            )}
          </TBody>
        </TableWrap>
      </Card>

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Names and positions come from the club's published leadership list.
      </p>
      <DemoNotice />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={editing ? 'Edit leader record' : 'Add a leader'}
          description="Only current office holders should appear on the public leadership page."
          size="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={save}>{editing ? 'Save changes' : 'Add leader'}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Full name" htmlFor="leader-name" required error={errors.name}>
              <Input id="leader-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="As published" />
            </Field>
            <Field label="Position" htmlFor="leader-position">
              <Select id="leader-position" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })}>
                {positions.map((position) => (
                  <option key={position}>{position}</option>
                ))}
                <option>Chairman</option>
                <option>Vice Chairman</option>
                <option>General Secretary</option>
                <option>Project Manager</option>
                <option>Mentorship And Training</option>
                <option>Communication and Branding</option>
              </Select>
            </Field>
            <Field label="Programme" htmlFor="leader-programme" required error={errors.programme}>
              <Input id="leader-programme" value={form.programme} onChange={(event) => setForm({ ...form, programme: event.target.value })} placeholder="Bachelor of Computer Science" />
            </Field>
            <Field label="Year of study" htmlFor="leader-year">
              <Select id="leader-year" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}>
                <option>Year 1</option>
                <option>Year 2</option>
                <option>Year 3</option>
                <option>Year 4</option>
                <option>Graduate</option>
              </Select>
            </Field>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Remove this leader?"
        description={`${deleting?.name ?? 'This leader'} will no longer appear on the leadership page. The account is not affected.`}
        confirmLabel="Remove leader"
        onConfirm={() => {
          if (!deleting) return
          setRows((current) => current.filter((row) => row.id !== deleting.id).map((row, index) => ({ ...row, order: index + 1 })))
          push({ tone: 'info', title: 'Leader removed' })
        }}
      />
    </>
  )
}

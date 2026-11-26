import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Eye, ShieldCheck, TriangleAlert, X } from 'lucide-react'
import { PageHeader, SectionTitle } from '../../components/app/primitives'
import { Badge, Button, Card, CardBody, EmptyState, Pagination, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { Segmented } from '../../components/ui/tabs'
import { useSocial, useViewer } from '../../features/social/hooks'
import { allReports, auditLog, displayNameFor, reviewReport } from '../../features/social/store'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'

/**
 * Moderation surface for member reports. Reports are written by the social
 * service; resolving or dismissing one records reviewer metadata and an audit
 * entry, so the action is not merely a UI state.
 */
export function AdminReports() {
  useSocial()
  const viewer = useViewer()
  const { push } = useToast()
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [page, setPage] = useState(1)
  const reports = allReports(viewer)
  const audit = auditLog(viewer).filter((entry) => /report|block/i.test(entry.action))
  const visible = filter === 'pending' ? reports.filter((report) => report.status === 'pending') : reports
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize))
  const current = Math.min(page, pageCount)
  const rows = visible.slice((current - 1) * pageSize, current * pageSize)

  const act = (id: string, status: 'reviewed' | 'dismissed') => {
    const result = reviewReport(viewer, id, status)
    if (result.ok) push({ tone: 'success', title: status === 'reviewed' ? 'Report resolved' : 'Report dismissed' })
    else push({ tone: 'error', title: 'Could not update report', description: result.error })
  }

  return (
    <>
      <PageHeader
        title="Member reports"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Reports' }]}
        actions={
          <Segmented
            label="Report filter"
            value={filter}
            onChange={(value) => {
              setFilter(value as 'pending' | 'all')
              setPage(1)
            }}
            options={[
              { value: 'pending', label: 'Pending', count: reports.filter((report) => report.status === 'pending').length },
              { value: 'all', label: 'All', count: reports.length },
            ]}
          />
        }
      />

      <Card>
        {rows.length ? (
          <>
            <TableWrap>
              <THead>
                <TR>
                  <TH>Reported member</TH>
                  <TH>Reason</TH>
                  <TH>Reported by</TH>
                  <TH>Submitted</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((report) => (
                  <TR key={report.id}>
                    <TD>
                      <Link to={`/members/${report.reported}`} className="font-medium text-ink-900 hover:text-brand-800 hover:underline">
                        {displayNameFor(report.reported)}
                      </Link>
                      <p className="font-mono text-[0.6875rem] text-ink-400">@{report.reported}</p>
                    </TD>
                    <TD>
                      <p className="font-medium text-ink-800">{report.reason}</p>
                      {report.description ? (
                        <p className="mt-0.5 max-w-[34ch] text-[0.75rem] leading-5 text-ink-500">{report.description}</p>
                      ) : null}
                    </TD>
                    <TD className="text-[0.75rem]">{displayNameFor(report.reporter)}</TD>
                    <TD className="text-[0.75rem] text-ink-500">{formatDate(report.createdAt)}</TD>
                    <TD>
                      <Badge tone={report.status === 'pending' ? 'amber' : report.status === 'reviewed' ? 'green' : 'outline'} dot>
                        {report.status}
                      </Badge>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1.5">
                        <Button size="xs" variant="outline" iconLeft={<Eye className="h-3 w-3" />} onClick={() => window.open(`/members/${report.reported}`, '_blank')}>
                          Profile
                        </Button>
                        {report.status === 'pending' ? (
                          <>
                            <Button size="xs" iconLeft={<Check className="h-3 w-3" />} onClick={() => act(report.id, 'reviewed')}>
                              Resolve
                            </Button>
                            <Button size="xs" variant="ghost" iconLeft={<X className="h-3 w-3" />} onClick={() => act(report.id, 'dismissed')}>
                              Dismiss
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
            <div className="border-t border-line px-4 py-3">
              <Pagination page={current} pageCount={pageCount} onChange={setPage} totalLabel={`${visible.length} reports`} />
            </div>
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<TriangleAlert className="h-4 w-4" aria-hidden />}
              title={filter === 'pending' ? 'No pending reports' : 'No reports submitted'}
              description="Reports submitted from public member profiles appear here for review."
            />
          </div>
        )}
      </Card>

      <div className="mt-6">
        <SectionTitle title="Moderation audit" description="Sensitive moderation actions recorded by the social service." />
        <Card>
          {audit.length ? (
            <CardBody className="divide-y divide-line p-0">
              {audit.slice(0, 12).map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
                    <div>
                      <p className="text-[0.8125rem] font-medium text-ink-900">{entry.action}</p>
                      <p className="text-[0.75rem] text-ink-500">
                        {entry.detail} · target {displayNameFor(entry.target)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[0.6875rem] text-ink-400">
                    {displayNameFor(entry.actor)} · {formatDate(entry.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </CardBody>
          ) : (
            <CardBody>
              <p className="text-[0.8125rem] text-ink-500">No moderation actions recorded yet.</p>
            </CardBody>
          )}
        </Card>
      </div>
    </>
  )
}

export default AdminReports

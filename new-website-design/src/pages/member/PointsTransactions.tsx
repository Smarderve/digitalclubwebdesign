import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, History } from 'lucide-react'
import { memberApi } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Card, CardHeader, EmptyState, Pagination, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { formatDate } from '../../lib/utils'

const PER_PAGE = 10

export function PointsTransactions() {
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useMemberData(
    () => memberApi.pointsTransactions({ page, per_page: PER_PAGE }),
    [page],
  )

  return (
    <>
      <PageHeader
        title="Points ledger"
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Rankings', to: '/member/rankings' }, { label: 'Points ledger' }]}
        actions={
          <ButtonLink to="/member/rankings" variant="outline" size="sm" iconLeft={<ArrowLeft className="h-3.5 w-3.5" />}>
            Back to rankings
          </ButtonLink>
        }
      />

      {loading && !data ? (
        <LoadingBlock rows={4} />
      ) : error || !data ? (
        <ErrorBlock message={error ?? 'Your points ledger could not be loaded.'} onRetry={reload} />
      ) : (
        <Card>
          <CardHeader
            title="Transactions"
            description="Only administrators can add or reverse a points transaction."
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-[0.8125rem] font-medium text-ink-900">Your ledger</p>
              <Badge tone="green">You</Badge>
            </div>
            <p className="text-[0.75rem] text-ink-500">
              Balance: <span className="font-semibold tabular text-ink-900">{data.points}</span> points
            </p>
          </div>

          {data.transactions.length ? (
            <>
              <TableWrap>
                <THead>
                  <TR>
                    <TH>Date</TH>
                    <TH>Reason</TH>
                    <TH>Type</TH>
                    <TH className="text-right">Points</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.transactions.map((transaction) => (
                    <TR key={transaction.id}>
                      <TD className="whitespace-nowrap text-ink-500">{formatDate(transaction.awarded_at)}</TD>
                      <TD className="max-w-[420px]">{transaction.reason}</TD>
                      <TD>
                        <Badge tone="outline">{transaction.type}</Badge>
                      </TD>
                      <TD className="text-right font-semibold tabular text-brand-700">
                        {transaction.points > 0 ? '+' : ''}
                        {transaction.points}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
              <div className="border-t border-line px-4 py-3">
                <Pagination
                  page={page}
                  pageCount={1}
                  onChange={setPage}
                  totalLabel={`${data.transactions.length} transactions on this page`}
                />
              </div>
            </>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<History className="h-4 w-4" aria-hidden />}
                title="No transactions yet"
                description="Points appear here after a competition, warmup or event is recorded."
              />
            </div>
          )}
        </Card>
      )}

      <p className="mt-3 text-[0.6875rem] leading-5 text-ink-400">
        Member points are visible to other signed-in members on the rankings page. Private personal details are not shown in
        this ledger.
      </p>

      <div className="mt-4 rounded-md border border-line bg-canvas/50 px-4 py-3">
        <p className="text-[0.75rem] text-ink-500">
          Need a correction?{' '}
          <Link to="/contact" className="font-semibold text-brand-800 hover:underline">
            Contact the club
          </Link>{' '}
          with the date and reason shown here.
        </p>
      </div>
    </>
  )
}

export default PointsTransactions

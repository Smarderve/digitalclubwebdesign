import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, History } from 'lucide-react'
import { demoMember, demoRewardHistory, demoUsers } from '../../data/demo'
import { PageHeader } from '../../components/app/primitives'
import { Badge, Card, CardHeader, EmptyState, Pagination, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { Select } from '../../components/ui/field'
import { formatDate } from '../../lib/utils'

const PER_PAGE = 5

export function PointsTransactions() {
  const selfId = demoUsers.find((user) => user.name === demoMember.name)?.id ?? 4
  const [memberId, setMemberId] = useState(String(selfId))
  const [page, setPage] = useState(1)
  const member = demoUsers.find((user) => String(user.id) === memberId)
  const rows = useMemo(() => {
    if (member?.name !== demoMember.name) return []
    return demoRewardHistory
  }, [member?.name])

  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const current = Math.min(page, pageCount)
  const visible = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  return (
    <>
      <PageHeader
        title="Points ledger"
        description="View the individual points transactions recorded for a member. Totals are calculated from this ledger."
        breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Rankings', to: '/member/rankings' }, { label: 'Points ledger' }]}
        actions={
          <ButtonLink to="/member/rankings" variant="outline" size="sm" iconLeft={<ArrowLeft className="h-3.5 w-3.5" />}>
            Back to rankings
          </ButtonLink>
        }
      />

      <Card>
        <CardHeader
          title="Transactions"
          description="Only administrators can add or reverse a points transaction."
          action={
            <Select
              value={memberId}
              onChange={(event) => {
                setMemberId(event.target.value)
                setPage(1)
              }}
              className="h-9 w-[230px]"
              aria-label="Select a member"
            >
              {demoUsers
                .filter((user) => user.role !== 'admin')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.memberId}
                  </option>
                ))}
            </Select>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-[0.8125rem] font-medium text-ink-900">{member?.name}</p>
            <Badge tone="outline">{member?.memberId}</Badge>
            {member?.name === demoMember.name ? <Badge tone="green">You</Badge> : null}
          </div>
          <p className="text-[0.75rem] text-ink-500">
            Balance: <span className="font-semibold tabular text-ink-900">{member?.points ?? 0}</span> points
          </p>
        </div>

        {visible.length ? (
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
                {visible.map((transaction) => (
                  <TR key={transaction.id}>
                    <TD className="whitespace-nowrap text-ink-500">{formatDate(transaction.date)}</TD>
                    <TD className="max-w-[420px]">{transaction.reason}</TD>
                    <TD>
                      <Badge tone="outline">{transaction.type}</Badge>
                    </TD>
                    <TD className="text-right font-semibold tabular text-brand-700">+{transaction.points}</TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
            <div className="border-t border-line px-4 py-3">
              <Pagination page={current} pageCount={pageCount} onChange={setPage} totalLabel={`${rows.length} transactions`} />
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<History className="h-4 w-4" aria-hidden />}
              title="No transactions for this member"
              description="This prototype only includes a points ledger for the demonstration member. Select Amina Juma to review the ledger layout."
            />
          </div>
        )}
      </Card>

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

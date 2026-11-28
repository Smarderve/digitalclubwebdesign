import { useState } from 'react'
import { Award, Flame, Lock, Trophy } from 'lucide-react'
import { memberApi } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader, MetricRow } from '../../components/app/primitives'
import { Badge, Card, CardBody, CardHeader, EmptyState, Progress, Select, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { formatDate } from '../../lib/utils'

export function Rewards({ embedded = false }: { embedded?: boolean } = {}) {
  const [type, setType] = useState('All')
  const { data, loading, error, reload } = useMemberData(
    () => Promise.all([memberApi.rewards(), memberApi.rewardsHistory()]).then(([summary, history]) => ({ summary, history })),
    [],
  )

  const header = embedded ? null : (
    <PageHeader
      title="Rewards & points"
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Rewards' }]}
      actions={
        <ButtonLink to="/member/rankings" variant="outline" size="sm" iconLeft={<Trophy className="h-3.5 w-3.5" />}>
          Club rankings
        </ButtonLink>
      }
    />
  )

  if (loading && !data) {
    return (
      <>
        {header}
        <LoadingBlock rows={4} />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        {header}
        <ErrorBlock message={error ?? 'Your rewards could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const { summary, history } = data
  const types = ['All', ...Array.from(new Set(history.map((item) => item.type)))]
  const rows = type === 'All' ? history : history.filter((item) => item.type === type)
  const earned = summary.trophies.filter((trophy) => trophy.earned)
  const nextTrophy = summary.next_trophy

  return (
    <>
      {header}

      <MetricRow
        items={[
          { label: 'Current points', value: summary.points, icon: <Flame className="h-3.5 w-3.5" />, tone: 'brand' },
          {
            label: 'Trophies earned',
            value: `${earned.length} / ${summary.trophies.length}`,
            icon: <Award className="h-3.5 w-3.5" />,
            tone: 'amber',
          },
          {
            label: 'Current tier',
            value: summary.tier ? summary.tier.name : 'None',
            hint: summary.tier ? `${summary.tier.points_required} points required` : 'No trophy reached yet',
          },
          { label: 'Club rank', value: `#${summary.rank}` },
        ]}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px] xl:items-start">
        <Card>
          <CardHeader
            title="Points history"
            description="Every award and deduction applied to your member record."
            action={
              types.length > 1 ? (
                <Select value={type} onChange={(event) => setType(event.target.value)} className="h-8 w-[140px]" aria-label="Filter by reward type">
                  {types.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              ) : null
            }
          />
          {rows.length ? (
            <TableWrap>
              <THead>
                <TR>
                  <TH>Reason</TH>
                  <TH>Type</TH>
                  <TH>Date</TH>
                  <TH className="text-right">Points</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((reward) => (
                  <TR key={reward.id}>
                    <TD className="max-w-[360px]">{reward.reason}</TD>
                    <TD>
                      <Badge tone="outline">{reward.type}</Badge>
                    </TD>
                    <TD className="whitespace-nowrap text-ink-500">{formatDate(reward.awarded_at)}</TD>
                    <TD className="text-right font-semibold tabular text-brand-700">
                      {reward.points > 0 ? '+' : ''}
                      {reward.points}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
          ) : (
            <div className="p-4">
              <EmptyState
                compact
                title={history.length ? 'No rewards in this category' : 'No points awarded yet'}
                description={
                  history.length
                    ? 'Choose another type to see your points history.'
                    : 'Points appear here when you take part in competitions, quizzes and events.'
                }
              />
            </div>
          )}
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-ink-400">Totals are calculated from the points ledger.</p>
            <ButtonLink to="/member/rankings/points-transactions" variant="ghost" size="xs">
              Full ledger
            </ButtonLink>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Trophy shelf" description={`${earned.length} of ${summary.trophies.length} unlocked`} />
            <CardBody className="space-y-3">
              {summary.trophies.length ? (
                summary.trophies.map((trophy) => (
                  <div key={trophy.id} className="flex items-start gap-3">
                    <span
                      className={
                        trophy.earned
                          ? 'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700'
                          : 'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-400'
                      }
                    >
                      {trophy.earned ? <Trophy className="h-4 w-4" aria-hidden /> : <Lock className="h-3.5 w-3.5" aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={trophy.earned ? 'text-[0.8125rem] font-semibold text-ink-900' : 'text-[0.8125rem] font-medium text-ink-500'}>
                          {trophy.name}
                        </p>
                        <span className="text-[0.625rem] tabular text-ink-400">{trophy.points_required} pts</span>
                      </div>
                      <p className="mt-0.5 text-[0.6875rem] leading-5 text-ink-500">{trophy.description}</p>
                      <p className="mt-0.5 text-[0.625rem] text-ink-400">
                        {trophy.earned && trophy.earned_at ? `Earned ${formatDate(trophy.earned_at)}` : 'Not yet earned'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[0.75rem] text-ink-500">No trophies have been configured yet.</p>
              )}
            </CardBody>
          </Card>

          {nextTrophy ? (
            <Card>
              <CardBody>
                <p className="text-[0.8125rem] font-semibold text-ink-900">Next trophy: {nextTrophy.name}</p>
                <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                  {nextTrophy.points_remaining} more points needed to reach {nextTrophy.points_required}.
                </p>
                <div className="mt-3">
                  <Progress
                    value={summary.points}
                    max={nextTrophy.points_required}
                    label={`${summary.points} of ${nextTrophy.points_required} points`}
                  />
                </div>
                <p className="mt-2 text-[0.6875rem] text-ink-400">
                  Trophy thresholds are configured by club administrators.
                </p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardBody>
              <p className="text-[0.8125rem] font-semibold text-ink-900">How to earn more</p>
              <ul className="mt-2 space-y-1.5 text-[0.75rem] leading-5 text-ink-500">
                <li>Submit an entry to a weekly or monthly competition.</li>
                <li>Complete a warmup quiz — your best attempt counts.</li>
                <li>Check in to events and workshops.</li>
                <li>Take part in team projects and code reviews.</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

export default Rewards

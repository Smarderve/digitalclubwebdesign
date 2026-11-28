import { Link } from 'react-router-dom'
import { CheckCircle2, CreditCard, Mail, ShieldCheck, Wallet } from 'lucide-react'
import { MEMBERSHIP_BENEFITS, SITE } from '../../data/site'
import { memberApi } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Card, CardBody, CardHeader, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { formatDate } from '../../lib/utils'

export function Membership({ embedded = false }: { embedded?: boolean } = {}) {
  const { data, loading, error, reload } = useMemberData(() => memberApi.membership(), [])

  const header = embedded ? (
    <div className="mb-4 flex justify-end">
      <ButtonLink href={`mailto:${SITE.email}?subject=Membership%20renewal`} size="sm" iconLeft={<Mail className="h-3.5 w-3.5" />}>
        Contact admin
      </ButtonLink>
    </div>
  ) : (
    <PageHeader
      title="Membership"
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Membership' }]}
      actions={
        <ButtonLink href={`mailto:${SITE.email}?subject=Membership%20renewal`} size="sm" iconLeft={<Mail className="h-3.5 w-3.5" />}>
          Contact admin
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
        <ErrorBlock message={error ?? 'Your membership record could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  const active = data.state === 'valid'
  const latest = data.latest_payment

  return (
    <>
      {header}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <ShieldCheck className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[1rem] font-semibold text-ink-950">
                      {active ? 'Membership active' : data.state === 'expired' ? 'Membership expired' : 'No membership yet'}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-ink-500">
                      {data.valid_until ? `Valid through ${formatDate(data.valid_until)}` : 'No payment covers a membership period.'}
                    </p>
                  </div>
                </div>
                <Badge tone={active ? 'green' : 'outline'} dot>
                  {active ? 'Paid member' : data.state === 'expired' ? 'Expired' : 'Not paid'}
                </Badge>
              </div>

              <dl className="mt-5 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                {[
                  {
                    label: 'Last payment',
                    value: latest ? `TZS ${latest.amount.toLocaleString()}` : '—',
                  },
                  { label: 'Recorded on', value: latest?.recorded_at ? formatDate(latest.recorded_at) : '—' },
                  { label: 'Method', value: latest?.method ?? '—' },
                ].map((item) => (
                  <div key={item.label} className="bg-surface px-4 py-3">
                    <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">{item.label}</dt>
                    <dd className="mt-0.5 text-[0.875rem] font-semibold text-ink-900">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="flex items-center gap-1.5 text-[0.75rem] text-ink-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                  {active
                    ? 'You can attend paid-member events while this membership is valid.'
                    : 'Renew at the club to attend paid-member events again.'}
                </p>
                <ButtonLink to="/member/digital-id" variant="ghost" size="sm">
                  View digital ID
                </ButtonLink>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payment history" description="Payments recorded by a club administrator." />
            {data.payments.length ? (
              <TableWrap>
                <THead>
                  <TR>
                    <TH>Date</TH>
                    <TH>Amount</TH>
                    <TH>Method</TH>
                    <TH>Coverage</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.payments.map((item) => (
                    <TR key={item.id}>
                      <TD className="whitespace-nowrap">{item.recorded_at ? formatDate(item.recorded_at) : '—'}</TD>
                      <TD className="font-medium text-ink-900">TZS {item.amount.toLocaleString()}</TD>
                      <TD>{item.method}</TD>
                      <TD className="whitespace-nowrap text-ink-500">
                        {item.period.start ? formatDate(item.period.start) : '—'} –{' '}
                        {item.period.end ? formatDate(item.period.end) : '—'}
                      </TD>
                      <TD>
                        <Badge tone={item.active ? 'green' : 'outline'}>{item.active ? 'Active' : 'Ended'}</Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            ) : (
              <div className="px-5 py-6">
                <p className="text-[0.8125rem] font-semibold text-ink-900">No payments recorded</p>
                <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                  Once an administrator records your membership payment it appears here.
                </p>
              </div>
            )}
            <div className="border-t border-line px-4 py-3">
              <p className="text-[0.6875rem] text-ink-400">
                Membership payments are recorded by the club. There is no online checkout in the current system.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Renewal and payments" />
            <CardBody className="space-y-3">
              <Alert tone="info" title="Renew at the club">
                The current system records membership payments through an administrator; members cannot pay online. Contact
                the club before your membership expires to arrange renewal.
              </Alert>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={`mailto:${SITE.email}?subject=Membership%20renewal`} variant="outline" size="sm" iconLeft={<CreditCard className="h-3.5 w-3.5" />}>
                  Email the club
                </ButtonLink>
                <ButtonLink href={`tel:${SITE.phone.replace(/\s/g, '')}`} variant="ghost" size="sm">
                  Call {SITE.phone}
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="What membership includes" />
            <CardBody>
              <ul className="space-y-2.5">
                {MEMBERSHIP_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-[0.8125rem] leading-5 text-ink-600">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-line pt-3">
                <Link to="/about#faq" className="text-[0.75rem] font-semibold text-brand-800 hover:underline">
                  Membership FAQs
                </Link>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-brand-700" aria-hidden />
                <p className="text-[0.8125rem] font-semibold text-ink-900">Membership period</p>
              </div>
              <p className="mt-2 text-[0.875rem] leading-6 text-ink-700">
                {data.valid_from && data.valid_until
                  ? `${formatDate(data.valid_from)} – ${formatDate(data.valid_until)}`
                  : 'No covering period on record.'}
              </p>
              <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                {data.days_remaining !== null && data.days_remaining > 0
                  ? `${data.days_remaining} days remaining.`
                  : data.days_expired
                    ? `${data.days_expired} days since expiry.`
                    : 'The fee is set by the club administration for the academic year.'}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

export default Membership

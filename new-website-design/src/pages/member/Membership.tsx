import { Link } from 'react-router-dom'
import { CheckCircle2, CreditCard, Mail, ShieldCheck, Wallet } from 'lucide-react'
import { demoMember, DEMO_LABEL } from '../../data/demo'
import { MEMBERSHIP_BENEFITS, SITE } from '../../data/site'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Badge, Card, CardBody, CardHeader, TableWrap, TBody, TD, TH, THead, TR } from '../../components/ui'
import { ButtonLink } from '../../components/ui/button'
import { formatDate } from '../../lib/utils'

export function Membership({ embedded = false }: { embedded?: boolean } = {}) {
  const payment = demoMember.membership
  const payments = [
    { id: 1, amount: payment.amount, date: payment.paidOn, method: payment.method, period: 'Feb 2026 – Dec 2026', reference: payment.reference },
    { id: 2, amount: 20000, date: '2025-10-12', method: 'Mobile money', period: 'Oct 2025 – Oct 2026', reference: 'MP-71903' },
  ]

  return (
    <>
      {embedded ? (
        <div className="mb-4 flex justify-end">
          <ButtonLink href={`mailto:${SITE.email}?subject=Membership%20renewal`} size="sm" iconLeft={<Mail className="h-3.5 w-3.5" />}>
            Contact admin
          </ButtonLink>
        </div>
      ) : (
        <PageHeader
          title="Membership"
          description="Your club membership status, payment record and what membership includes."
          breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Membership' }]}
          actions={
            <ButtonLink href={`mailto:${SITE.email}?subject=Membership%20renewal`} size="sm" iconLeft={<Mail className="h-3.5 w-3.5" />}>
              Contact admin
            </ButtonLink>
          }
        />
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
        <div className="space-y-5">
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <ShieldCheck className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[1rem] font-semibold text-ink-950">Membership active</p>
                    <p className="mt-0.5 text-[0.75rem] text-ink-500">Valid through {formatDate(payment.endDate)}</p>
                  </div>
                </div>
                <Badge tone="green" dot>
                  Paid member
                </Badge>
              </div>

              <dl className="mt-5 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                {[
                  { label: 'Last payment', value: `TZS ${payment.amount.toLocaleString()}` },
                  { label: 'Paid on', value: formatDate(payment.paidOn) },
                  { label: 'Method', value: payment.method },
                ].map((item) => (
                  <div key={item.label} className="bg-white px-4 py-3">
                    <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">{item.label}</dt>
                    <dd className="mt-0.5 text-[0.875rem] font-semibold text-ink-900">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="flex items-center gap-1.5 text-[0.75rem] text-ink-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                  You can attend paid-member events while this membership is valid.
                </p>
                <ButtonLink to="/member/digital-id" variant="ghost" size="sm">
                  View digital ID
                </ButtonLink>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payment history" description="Payments recorded by a club administrator." />
            <TableWrap>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Amount</TH>
                  <TH>Method</TH>
                  <TH>Coverage</TH>
                  <TH>Reference</TH>
                </TR>
              </THead>
              <TBody>
                {payments.map((item) => (
                  <TR key={item.id}>
                    <TD className="whitespace-nowrap">{formatDate(item.date)}</TD>
                    <TD className="font-medium text-ink-900">TZS {item.amount.toLocaleString()}</TD>
                    <TD>{item.method}</TD>
                    <TD className="whitespace-nowrap text-ink-500">{item.period}</TD>
                    <TD className="font-mono text-[0.6875rem] text-ink-500">{item.reference}</TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
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

        <div className="space-y-4">
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
                <p className="text-[0.8125rem] font-semibold text-ink-900">Membership fee</p>
              </div>
              <p className="mt-2 text-[1.25rem] font-semibold tabular text-ink-950">TZS 20,000</p>
              <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                The fee is configured by the club administration. The amount shown here is sample data for the prototype.
              </p>
              <p className="mt-2 text-[0.625rem] leading-4 text-ink-400">{DEMO_LABEL}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

export default Membership

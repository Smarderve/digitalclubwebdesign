import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, QrCode, Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import { demoMember } from '../../data/demo'
import { Alert, Avatar, Badge } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Field, Input } from '../../components/ui/field'

export function VerifyId() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const verified = memberId?.toUpperCase() === demoMember.memberId

  return (
    <div className="bg-canvas/50">
      <div className="container-editorial py-12 lg:py-16">
        <div className="mx-auto max-w-[760px]">
          <div className="text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-brand-700">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <p className="eyebrow mt-4">Member verification</p>
            <h1 className="mt-2 text-display-md text-ink-950">Verify a Digital Club ID</h1>
            <p className="mx-auto mt-3 max-w-[58ch] text-[0.9375rem] leading-7 text-ink-600">
              Every digital member ID carries a QR code linking to this page. Enter the member ID printed on the card to
              confirm the record.
            </p>
          </div>

          <div className="mt-8 rounded-lg border border-line bg-white">
            <form
              className="border-b border-line p-5 sm:p-6"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                const normalised = value.trim().toUpperCase()
                if (!/^DC-\d{4}-\d{4}$/.test(normalised)) {
                  setError('Use the format DC-YYYY-XXXX, for example DC-2026-0014.')
                  return
                }
                setError('')
                navigate(`/verify-id/${normalised}`)
              }}
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field
                  label="Member ID"
                  htmlFor="verify-id"
                  hint="The ID is printed on the front of the digital member card."
                  error={error}
                  required
                >
                  <Input
                    id="verify-id"
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value)
                      if (error) setError('')
                    }}
                    placeholder="DC-2026-0000"
                    autoComplete="off"
                    aria-invalid={Boolean(error)}
                  />
                </Field>
                <Button type="submit" className="h-10" iconLeft={<Search className="h-3.5 w-3.5" />}>
                  Verify ID
                </Button>
              </div>
            </form>

            <div className="p-5 sm:p-6">
              {memberId ? (
                verified ? (
                  <div>
                    <div className="flex items-start gap-3 rounded-md border border-brand-200 bg-brand-50/70 p-4">
                      <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
                      <div>
                        <p className="text-[0.875rem] font-semibold text-brand-900">Valid member record</p>
                        <p className="mt-0.5 text-[0.75rem] leading-5 text-brand-800">
                          This ID matches an approved Digital Club member record. Membership status: active.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md border border-line">
                      <div className="flex items-center gap-4 border-b border-line p-4">
                        <Avatar name={demoMember.name} size="lg" />
                        <div className="min-w-0">
                          <p className="text-[1rem] font-semibold text-ink-950">{demoMember.name}</p>
                          <p className="text-[0.75rem] text-ink-500">{demoMember.memberId}</p>
                          <Badge tone="green" dot className="mt-1.5">
                            Active member
                          </Badge>
                        </div>
                      </div>
                      <dl className="grid gap-px bg-line sm:grid-cols-2">
                        {[
                          { label: 'Course', value: demoMember.course },
                          { label: 'Year', value: demoMember.year },
                          { label: 'Member since', value: 'October 2025' },
                          { label: 'ID valid through', value: 'September 2028' },
                        ].map((item) => (
                          <div key={item.label} className="bg-white p-3.5">
                            <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-400">{item.label}</dt>
                            <dd className="mt-0.5 text-[0.8125rem] font-medium text-ink-900">{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <p className="mt-3 text-[0.6875rem] text-ink-400">
                      Sample record for prototype review. In production this page reads the live member record and reports
                      whether the account is active.
                    </p>
                  </div>
                ) : (
                  <Alert tone="warning" title="No matching member record">
                    <p>
                      <strong className="font-medium text-ink-800">{memberId.toUpperCase()}</strong> does not match an active
                      member record in this prototype. Only the demonstration ID DC-2026-0014 is available for review.
                    </p>
                    <p className="mt-2 text-[0.75rem] text-ink-500">
                      If this ID was copied from a physical card, check the characters carefully and contact the club if the
                      problem continues.
                    </p>
                  </Alert>
                )
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border border-line bg-canvas/60 p-4">
                    <QrCode className="h-4 w-4 text-ink-500" aria-hidden />
                    <p className="mt-2 text-[0.8125rem] font-semibold text-ink-900">Scanning the card</p>
                    <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                      The QR code opens this page with the member ID already filled in. No personal details are encoded in
                      the QR itself.
                    </p>
                  </div>
                  <div className="rounded-md border border-line bg-canvas/60 p-4">
                    <ShieldAlert className="h-4 w-4 text-ink-500" aria-hidden />
                    <p className="mt-2 text-[0.8125rem] font-semibold text-ink-900">What this confirms</p>
                    <p className="mt-1 text-[0.75rem] leading-5 text-ink-500">
                      Verification confirms that the ID belongs to an approved member. It does not expose a phone number,
                      email address or other private account data.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-[0.6875rem] text-ink-400">
            Try the sample ID <button type="button" className="font-mono underline decoration-ink-300 underline-offset-2" onClick={() => setValue('DC-2026-0014')}>DC-2026-0014</button> to preview a verified record.
          </p>
        </div>
      </div>
    </div>
  )
}

export default VerifyId

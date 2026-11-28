import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, ExternalLink, IdCard, RefreshCw, ShieldCheck } from 'lucide-react'
import { SITE } from '../../data/site'
import { ApiError } from '../../lib/api'
import { memberApi } from '../../lib/memberApi'
import { useMemberData } from '../../lib/useMemberData'
import { ErrorBlock, LoadingBlock } from '../../components/app/DataState'
import { PageHeader } from '../../components/app/primitives'
import { Alert, Avatar, Badge, ConfirmDialog } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { useToast } from '../../context/ToastContext'
import { cn, formatDate } from '../../lib/utils'

function QrPattern({ value, className }: { value: string; className?: string }) {
  const cells = 21
  const seed = Array.from(value || '0').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return (
    <div
      className={cn('grid aspect-square grid-cols-[repeat(21,1fr)] gap-px rounded-[3px] bg-surface p-1.5', className)}
      aria-hidden
    >
      {Array.from({ length: cells * cells }).map((_, index) => {
        const row = Math.floor(index / cells)
        const col = index % cells
        const inFinder = (row < 7 && col < 7) || (row < 7 && col > 13) || (row > 13 && col < 7)
        const finderOn =
          inFinder &&
          (row % 6 === 0 || col % 6 === 0 || (row % 6 >= 2 && row % 6 <= 4 && col % 6 >= 2 && col % 6 <= 4))
        const on = inFinder ? finderOn : (row * 31 + col * 17 + seed) % 7 < 3
        return <span key={index} className={on ? 'bg-ink-950' : 'bg-surface'} />
      })}
    </div>
  )
}

export function DigitalId({ embedded = false }: { embedded?: boolean } = {}) {
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const { push } = useToast()
  const { data, loading, error, reload, setData } = useMemberData(() => memberApi.digitalId(), [])

  async function regenerate() {
    setRegenerating(true)
    try {
      const result = await memberApi.regenerateDigitalId()
      setData(result)
      push({ tone: 'success', title: 'Card regenerated', description: 'Your digital ID now matches your current profile.' })
    } catch (err) {
      push({
        tone: 'error',
        title: 'Card not regenerated',
        description: err instanceof ApiError ? err.message : 'The card could not be rebuilt. Try again later.',
      })
    } finally {
      setRegenerating(false)
      setConfirmRegenerate(false)
    }
  }

  const actions = (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!data?.image_urls.front}
        onClick={() => data?.image_urls.front && window.open(data.image_urls.front, '_blank', 'noopener')}
        iconLeft={<Download className="h-3.5 w-3.5" />}
      >
        Front
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!data?.image_urls.back}
        onClick={() => data?.image_urls.back && window.open(data.image_urls.back, '_blank', 'noopener')}
        iconLeft={<Download className="h-3.5 w-3.5" />}
      >
        Back
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={regenerating}
        onClick={() => setConfirmRegenerate(true)}
        iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
      >
        Regenerate
      </Button>
    </>
  )

  const header = embedded ? (
    <div className="mb-4 flex flex-wrap justify-end gap-2">{actions}</div>
  ) : (
    <PageHeader
      title="Digital member ID"
      breadcrumbs={[{ label: 'Member', to: '/member' }, { label: 'Digital ID' }]}
      actions={actions}
      badge={
        data ? (
          <Badge tone={data.status === 'active' ? 'green' : 'amber'} dot>
            {data.status === 'active' ? 'Active' : 'Pending'}
          </Badge>
        ) : undefined
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
        <ErrorBlock message={error ?? 'Your digital ID could not be loaded.'} onRetry={reload} />
      </>
    )
  }

  return (
    <>
      {header}

      {data.status !== 'active' ? (
        <Alert tone="info" title="No card image yet" className="mb-4">
          Use Regenerate to build your digital ID from your current profile details. Your member number does not change.
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="space-y-6">
          {/* Card front */}
          <div className="mx-auto w-full max-w-[640px]">
            <div className="relative aspect-[1.586] overflow-hidden rounded-lg bg-ink-950 text-white shadow-lg">
              <div aria-hidden className="absolute inset-0 opacity-[0.15] surface-grid" />
              <div aria-hidden className="absolute -right-20 -top-24 h-[300px] w-[300px] rounded-full border border-brand-500/30" />
              <div aria-hidden className="absolute -right-8 top-10 h-[170px] w-[170px] rounded-full border border-brand-500/20" />
              <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-surface p-1">
                      <img src="/brand/digital-club-logo.svg" alt="" className="h-full w-full object-contain" />
                    </span>
                    <div>
                      <p className="text-[0.75rem] font-semibold leading-tight">KIUT DIGITAL CLUB</p>
                      <p className="text-[0.5625rem] uppercase tracking-[0.12em] text-ink-400">Member identification</p>
                    </div>
                  </div>
                  <Badge tone="green" className="border-brand-500/40 bg-brand-500/15 text-brand-200">
                    {data.status === 'active' ? 'Active' : 'Pending'}
                  </Badge>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex items-end gap-3">
                    <Avatar name={data.display_name} size="lg" className="ring-2 ring-white/20" />
                    <div>
                      <p className="text-[1.0625rem] font-semibold leading-tight sm:text-[1.25rem]">{data.display_name}</p>
                      <p className="mt-0.5 font-mono text-[0.6875rem] text-brand-300">
                        {data.member_number ?? 'Number pending'}
                      </p>
                      <p className="mt-0.5 text-[0.625rem] text-ink-400">{data.course ?? 'Course not set'}</p>
                    </div>
                  </div>
                  <QrPattern
                    value={data.qr_payload ?? data.member_number ?? '0'}
                    className="h-[62px] w-[62px] shrink-0 sm:h-[78px] sm:w-[78px]"
                  />
                </div>

                <div className="flex items-end justify-between border-t border-white/10 pt-2.5 text-[0.5625rem] uppercase tracking-[0.08em] text-ink-400">
                  <span>{SITE.university}</span>
                  <span>{data.valid_until ? `Valid through ${formatDate(data.valid_until)}` : 'Validity pending'}</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-[0.625rem] text-ink-400">Front of the digital member card.</p>
          </div>

          {/* Card back */}
          <div className="mx-auto w-full max-w-[640px]">
            <div className="rounded-lg border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">Card back</p>
                  <p className="mt-1 text-[0.9375rem] font-semibold text-ink-950">About the club</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                  <IdCard className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <p className="mt-4 text-[0.8125rem] leading-6 text-ink-600">
                Digital Club is the student technology community at {SITE.university}. This card identifies an approved
                member and links to a public verification record.
              </p>
              <dl className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
                {[
                  { label: 'Contact', value: SITE.email },
                  { label: 'Phone', value: SITE.phone },
                  { label: 'Verification', value: data.verify_url ?? 'Not available' },
                  {
                    label: 'Membership',
                    value: data.valid_until ? `Valid through ${formatDate(data.valid_until)}` : 'No membership on record',
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-surface px-3.5 py-2.5">
                    <dt className="text-[0.5625rem] uppercase tracking-[0.08em] text-ink-400">{item.label}</dt>
                    <dd className="mt-0.5 break-all text-[0.75rem] font-medium text-ink-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[0.625rem] leading-4 text-ink-400">
                If found, please return this card to the KIUT Digital Club office or email the club. The card remains the
                property of KIUT Digital Club.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-900">
              <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden />
              Verification
            </p>
            <p className="mt-1.5 text-[0.75rem] leading-5 text-ink-500">
              Anyone can verify this card by scanning its QR code or entering the member ID on the public verification page.
            </p>
            {data.member_number ? (
              <Link
                to={`/verify-id/${data.member_number}`}
                className="mt-3 inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-brand-800 hover:underline"
              >
                Open verification page
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            ) : (
              <p className="mt-3 text-[0.75rem] text-ink-500">A member number is issued with your card.</p>
            )}
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="text-[0.8125rem] font-semibold text-ink-900">Card details</p>
            <dl className="mt-3 space-y-2 text-[0.75rem]">
              {[
                { label: 'Member ID', value: data.member_number ?? 'Pending' },
                { label: 'Issued', value: data.issued_at ? formatDate(data.issued_at) : '—' },
                { label: 'Valid through', value: data.valid_until ? formatDate(data.valid_until) : '—' },
                { label: 'Status', value: data.status === 'active' ? 'Active' : 'Pending' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between gap-3">
                  <dt className="text-ink-500">{item.label}</dt>
                  <dd className="font-medium text-ink-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-md border border-dashed border-ink-200 p-4">
            <p className="text-[0.75rem] font-medium text-ink-700">About regeneration</p>
            <p className="mt-1 text-[0.6875rem] leading-5 text-ink-500">
              Regenerating creates a new card image with your current profile details. Your member ID does not change.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRegenerate}
        onOpenChange={setConfirmRegenerate}
        title="Regenerate the card?"
        description="The card image is rebuilt with your current profile details."
        confirmLabel="Regenerate"
        destructive={false}
        onConfirm={regenerate}
      />
    </>
  )
}

export default DigitalId

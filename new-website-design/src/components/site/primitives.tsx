import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ButtonLink } from '../ui/button'
import type { HeroMedia } from './hero'

export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
  className,
}: {
  eyebrow: string
  title: string
  description?: string
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('border-b border-line', className)}>
      <div className="container-editorial py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-[760px]">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-3 text-display-lg text-ink-950">{title}</h1>
            {description ? <p className="mt-4 max-w-[62ch] text-lead text-ink-600">{description}</p> : null}
          </div>
          {aside ? <div className="lg:justify-self-end">{aside}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function SectionHead({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: { label: string; to: string } | ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-10 gap-y-4', className)}>
      <div className="max-w-[62ch]">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-2 text-display-md text-ink-950">{title}</h2>
        {description ? <p className="mt-3 text-[0.9375rem] leading-7 text-ink-600">{description}</p> : null}
      </div>
      {action && typeof action === 'object' && 'label' in action && 'to' in action ? (
        <ButtonLink to={action.to} variant="outline" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
          {action.label}
        </ButtonLink>
      ) : (
        action ?? null
      )}
    </div>
  )
}

export function LinkArrow({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 transition-colors hover:decoration-brand-700',
        className,
      )}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}

export function MetaDivider() {
  return <span aria-hidden className="inline-block h-3 w-px bg-ink-200" />
}

export function JoinBand({
  eyebrow = 'Join the club',
  title,
  description,
  primary,
  secondary,
  media,
}: {
  eyebrow?: string
  title: string
  description: string
  primary?: { label: string; to: string }
  secondary?: { label: string; to: string }
  /** Optional editorial photograph; always presented as stock imagery in the caption. */
  media?: HeroMedia
}) {
  return (
    <section className="border-y border-line bg-mint">
      <div className="container-editorial grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div className="max-w-[680px]">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brand-700">{eyebrow}</p>
          <h2 className="mt-3 text-display-md text-ink-950">{title}</h2>
          <p className="mt-3 max-w-[56ch] text-[0.9375rem] leading-7 text-ink-600">{description}</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <ButtonLink to={primary?.to ?? '/auth/register'} size="lg">
              {primary?.label ?? 'Join the club'}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink to={secondary?.to ?? '/contact'} variant="secondary" size="lg">
              {secondary?.label ?? 'Talk to the club'}
            </ButtonLink>
          </div>
        </div>
        {media ? (
          <figure className="relative overflow-hidden rounded-xl">
            <img
              src={media.src}
              srcSet={media.srcSet}
              sizes="(min-width: 1024px) 44vw, 100vw"
              alt={media.alt}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-smooth hover:scale-[1.03]"
            />
          </figure>
        ) : null}
      </div>
    </section>
  )
}

/** Typographic cover used where no genuine photograph exists. Not a stock image. */
export function TypeCover({
  title,
  label,
  className,
  tone = 'green',
  index,
}: {
  title: string
  label?: string
  className?: string
  tone?: 'green' | 'charcoal' | 'soft'
  index?: string
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between overflow-hidden p-5',
        tone === 'green' && 'bg-brand-100 text-brand-900',
        tone === 'charcoal' && 'bg-ink-50 text-ink-900',
        tone === 'soft' && 'bg-canvas text-ink-900',
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.18] surface-grid" />
      <div className="relative flex items-start justify-between gap-4">
        <span
          className={cn(
            'text-[0.625rem] font-semibold uppercase tracking-[0.14em]',
            tone === 'soft' ? 'text-brand-700' : 'text-brand-700',
          )}
        >
          {label ?? 'KIUT Digital Club'}
        </span>
        {index ? <span className="font-mono text-[0.6875rem] opacity-60">{index}</span> : null}
      </div>
      <div className="relative mt-10">
        <p
          className={cn(
            'max-w-[18ch] text-[1.375rem] font-semibold leading-tight tracking-tight',
            'text-ink-950',
          )}
        >
          {title}
        </p>
        <div
          aria-hidden
          className="mt-4 h-px w-10 bg-brand-500"
        />
      </div>
    </div>
  )
}

export function PageNotFoundInline({ title, description }: { title: string; description: string }) {
  return (
    <div className="container-editorial py-24 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-2 text-h1">{title}</h1>
      <p className="mx-auto mt-3 max-w-[52ch] text-ink-600">{description}</p>
      <ButtonLink to="/" className="mt-6" variant="outline">
        Back to home
      </ButtonLink>
    </div>
  )
}

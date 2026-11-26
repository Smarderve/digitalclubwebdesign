import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/** Photography used as editorial atmosphere. Never presented as club documentation. */
export type HeroMedia = {
  src: string
  srcSet: string
  alt: string
  caption?: string
}

/** Build a responsive media reference from an asset stored in /public/images. */
export function media(base: string, alt: string, caption?: string): HeroMedia {
  return {
    src: `${base}-1600.jpg`,
    srcSet: `${base}-800.jpg 800w, ${base}-1600.jpg 1600w`,
    alt,
    caption,
  }
}

/** A club photograph at the widths that were exported for it. */
export function clubMedia(base: string, alt: string, widths: number[] = [800, 1600]): HeroMedia {
  return {
    src: `${base}-${widths[widths.length - 1]}.jpg`,
    srcSet: widths.map((width) => `${base}-${width}.jpg ${width}w`).join(', '),
    alt,
  }
}

function MediaImage({ media, sizes, priority }: { media: HeroMedia; sizes: string; priority?: boolean }) {
  return (
    <img
      src={media.src}
      srcSet={media.srcSet}
      sizes={sizes}
      alt={media.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className="media-reveal h-full w-full object-cover"
    />
  )
}

/**
 * Full desktop-viewport page hero.
 *
 * - `split`: oversized headline beside a tall photograph.
 * - `overlay`: headline and copy above a full-bleed photograph.
 * - `type`: typographic composition for pages with no approved photography.
 *
 * The composition follows the Preline digital-agency reference: large type,
 * generous negative space and one substantial photograph rather than a card grid.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  media: image,
  aside,
  actions,
  layout = 'split',
  footnote,
  className,
}: {
  eyebrow: string
  title: ReactNode
  description?: string
  media?: HeroMedia
  aside?: ReactNode
  actions?: ReactNode
  layout?: 'split' | 'overlay' | 'type'
  footnote?: string
  className?: string
}) {
  if (layout === 'overlay') {
    return (
      <section className={cn('flex flex-col border-b border-line bg-surface', className)}>
        <div className="container-editorial pt-12 lg:pt-16">
          <div className="max-w-[980px]">
            <p className="animate-fade-up text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-brand-700">
              {eyebrow}
            </p>
            <h1 className="animate-fade-up mt-4 text-display-xl text-ink-950" style={{ animationDelay: '60ms' }}>
              {title}
            </h1>
            {description ? (
              <p
                className="animate-fade-up mt-5 max-w-[58ch] text-[1.0625rem] leading-8 text-ink-600"
                style={{ animationDelay: '120ms' }}
              >
                {description}
              </p>
            ) : null}
            {actions ? (
              <div className="animate-fade-up mt-7 flex flex-wrap items-center gap-2.5" style={{ animationDelay: '170ms' }}>
                {actions}
              </div>
            ) : null}
          </div>
        </div>
        {image ? (
          <div className="container-editorial mt-9 flex-1 pb-3">
            <figure className="media-zoom animate-fade-up relative h-full min-h-[260px] overflow-hidden rounded-xl bg-ink-100 lg:min-h-[calc(100svh-30rem)]">
              <MediaImage media={image} sizes="100vw" priority />
            </figure>
          </div>
        ) : null}
      </section>
    )
  }

  if (layout === 'type') {
    return (
      <section
        className={cn(
          'relative isolate flex flex-col justify-end overflow-hidden border-b border-line bg-canvas',
          'min-h-[70svh] lg:min-h-[calc(100svh-4.25rem)]',
          className,
        )}
      >
        <div aria-hidden className="absolute inset-0 -z-10 hairline-grid opacity-[0.5]" />
        <div className="container-editorial pb-12 pt-24 sm:pb-16 lg:pb-20">
          <p className="animate-fade-up text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-brand-700">
            {eyebrow}
          </p>
          <h1 className="animate-fade-up mt-4 max-w-[22ch] text-display-xl text-ink-950" style={{ animationDelay: '60ms' }}>
            {title}
          </h1>
          {description ? (
            <p
              className="animate-fade-up mt-5 max-w-[58ch] text-[1.0625rem] leading-8 text-ink-600"
              style={{ animationDelay: '120ms' }}
            >
              {description}
            </p>
          ) : null}
          {actions ? (
            <div className="animate-fade-up mt-7 flex flex-wrap items-center gap-2.5" style={{ animationDelay: '170ms' }}>
              {actions}
            </div>
          ) : null}
          <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-5">
            <div className="max-w-[520px]">{aside}</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={cn('border-b border-line bg-surface', className)}>
      <div className="container-editorial">
        <div className="grid gap-8 pb-10 lg:min-h-[calc(100svh-4.25rem)] lg:grid-cols-[1.04fr_0.96fr] lg:items-stretch lg:gap-12 lg:pb-0">
          <div className="flex flex-col justify-center lg:py-14">
            <p className="animate-fade-up text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-brand-700">
              {eyebrow}
            </p>
            <h1
              className="animate-fade-up mt-4 max-w-[20ch] text-display-xl text-ink-950"
              style={{ animationDelay: '60ms' }}
            >
              {title}
            </h1>
            {description ? (
              <p
                className="animate-fade-up mt-5 max-w-[50ch] text-[1.0625rem] leading-8 text-ink-600"
                style={{ animationDelay: '120ms' }}
              >
                {description}
              </p>
            ) : null}
            {actions ? (
              <div className="animate-fade-up mt-7 flex flex-wrap items-center gap-2.5" style={{ animationDelay: '170ms' }}>
                {actions}
              </div>
            ) : null}
            {aside ? (
              <div className="animate-fade-up mt-8 max-w-[420px]" style={{ animationDelay: '220ms' }}>
                {aside}
              </div>
            ) : null}
          </div>

          {image ? (
            <figure className="media-zoom animate-fade-up -mx-5 sm:-mx-6 lg:mx-0 lg:my-8 lg:flex lg:h-[calc(100%-4rem)] lg:flex-col">
              <div className="relative min-h-[260px] flex-1 overflow-hidden sm:min-h-[340px] lg:rounded-xl">
                <MediaImage media={image} sizes="(min-width: 1024px) 46vw, 100vw" priority />
              </div>
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/** In-page editorial photograph. Alt text carries the description; no caption clutter. */
export function EditorialFigure({
  media: image,
  className,
  ratio = 'aspect-[4/3]',
  sizes = '(min-width: 1024px) 50vw, 100vw',
}: {
  media: HeroMedia
  className?: string
  ratio?: string
  sizes?: string
}) {
  return (
    <figure className={cn('overflow-hidden', className)}>
      <div className={cn('media-zoom relative w-full overflow-hidden rounded-lg bg-ink-100', ratio)}>
        <MediaImage media={image} sizes={sizes} />
      </div>
    </figure>
  )
}

/** Small supporting block used inside heroes. */
export function HeroAside({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        tone === 'light' ? 'border-line bg-canvas/80' : 'border-white/15 bg-white/10',
      )}
    >
      {children}
    </div>
  )
}

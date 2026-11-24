import type { CSSProperties, ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, LayoutDashboard } from 'lucide-react'
import { ButtonLink } from '../ui/button'
import { clubMedia, media, type HeroMedia } from './hero'
import { homeForRole, useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

/**
 * Home hero — editorial photographic collage.
 *
 * The headline and copy sit on the left and are centred against the image
 * composition on wide screens. Each photograph has its own solid backing block
 * and the two elements drift independently in opposite directions, slowly
 * enough to keep the copy readable.
 */

/* Club photography: students at the DevFest and API Conference 2026 events. */
const portraitLead = clubMedia(
  '/images/club/devfest-students',
  'KIUT Digital Club students together at the DevFest 2026 event',
)
const codeDetail = media('/images/development/code-screen', 'A screen showing program code')
const labWide = clubMedia(
  '/images/club/api-conference-2026',
  'Club members at the API Conference 2026',
  [600, 900],
)
const hardwareDetail = clubMedia('/images/club/devfest-steps', 'KIUT Digital Club members after a DevFest event')
const workshopDetail = clubMedia('/images/club/devfest-portrait', 'Club members together at a DevFest session')

/** One leg of a drift: horizontal and vertical travel in px. */
type Movement = { dx: number; dy: number }

type DriftStyle = CSSProperties & { '--dx'?: string; '--dy'?: string }

function driftStyle({ dx, dy }: Movement, duration: number, delay: number): DriftStyle {
  return {
    '--dx': `${dx}px`,
    '--dy': `${dy}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  }
}

/* Literal class names so Tailwind keeps the backing utilities in the build. */
const backingClass = {
  charcoal: 'hero-backing',
  green: 'hero-backing-green',
  moss: 'hero-backing-moss',
  slate: 'hero-backing-slate',
} as const

/**
 * A photograph with its own backing block. The photograph and the block are
 * separate elements, each with its own animation, moving in opposite
 * directions so the offset opens and closes as they float.
 */
function HeroImageFrame({
  image,
  sizes,
  ratio,
  priority,
  backing,
  offset,
  photo,
  block,
  duration,
  delay,
  radius = 'rounded-[3px]',
  fill,
  className,
}: {
  image: HeroMedia
  sizes: string
  /** Fixed aspect ratio for frames that size themselves. */
  ratio?: string
  /** Fill the parent cell instead of using an aspect ratio. */
  fill?: boolean
  priority?: boolean
  backing: keyof typeof backingClass
  offset: { x: number; y: number }
  /** The photograph's travel. */
  photo: Movement
  /** The backing block's travel, mirrored so the two always counter-move. */
  block: Movement
  /** Shared cycle: identical timing keeps the directions opposed throughout. */
  duration: number
  delay: number
  radius?: string
  className?: string
}) {
  return (
    <div className={cn('relative', fill && 'h-full min-h-0', className)}>
      <span
        aria-hidden
        className={cn('hero-drift absolute inset-0', backingClass[backing])}
        style={{ ...driftStyle(block, duration, delay), translate: `${offset.x}px ${offset.y}px` }}
      />
      <div
        className={cn('hero-drift media-zoom relative overflow-hidden bg-ink-100', radius, fill && 'h-full')}
        style={driftStyle(photo, duration, delay)}
      >
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={sizes}
          alt={image.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          className={cn('block w-full object-cover', fill ? 'h-full' : ratio)}
        />
      </div>
    </div>
  )
}

/** Thin line work anchoring the composition without adding weight. */
function HeroDecorativeLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      <svg
        className="absolute left-[44%] top-[9%] hidden h-16 w-24 text-ink-950/35 sm:block"
        viewBox="0 0 96 64"
        fill="none"
      >
        <line className="hero-line" x1="1" y1="62" x2="95" y2="2" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg
        className="absolute right-[1%] top-[30%] hidden h-20 w-4 text-brand-700/50 lg:block"
        viewBox="0 0 4 80"
        fill="none"
      >
        <line className="hero-line hero-line-late" x1="2" y1="0" x2="2" y2="80" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg
        className="absolute left-[2%] top-[55%] hidden h-3 w-20 text-ink-950/25 lg:block"
        viewBox="0 0 80 6"
        fill="none"
      >
        <line className="hero-line hero-line-late" x1="0" y1="3" x2="80" y2="3" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  )
}

/**
 * Stacked mosaic for phones and tablets, where the image column is too narrow
 * for the layered desktop collage. Laid out in normal flow so no photograph can
 * be clipped or drift outside the viewport. The lower band is a single
 * fixed-height grid: the tall portrait and the stacked details share one
 * baseline, so the mosaic reads as a deliberate composition.
 */
function HeroStackedCollage() {
  return (
    <div className="grid gap-3 lg:hidden">
      <HeroImageFrame
        image={labWide}
        sizes="92vw"
        ratio="aspect-[16/10]"
        priority
        radius="rounded-[3px]"
        backing="moss"
        offset={{ x: 6, y: 5 }}
        photo={{ dx: 2, dy: -5 }}
        block={{ dx: -2, dy: 4 }}
        duration={6.8}
        delay={-2.7}
      />
      <div className="grid aspect-[3/2] grid-cols-[0.97fr_1.03fr] gap-3">
        <HeroImageFrame
          fill
          image={portraitLead}
          sizes="45vw"
          priority
          backing="charcoal"
          offset={{ x: 6, y: 6 }}
          photo={{ dx: -4, dy: 2 }}
          block={{ dx: 4, dy: -2 }}
          duration={5.4}
          delay={-0.6}
        />
        <div className="grid min-h-0 grid-rows-[1.15fr_1fr] gap-3">
          <HeroImageFrame
            fill
            image={codeDetail}
            sizes="45vw"
            backing="green"
            offset={{ x: -6, y: 5 }}
            photo={{ dx: 4, dy: 2 }}
            block={{ dx: -4, dy: -2 }}
            duration={6.1}
            delay={-1.8}
          />
          <HeroImageFrame
            fill
            image={hardwareDetail}
            sizes="45vw"
            backing="green"
            offset={{ x: 6, y: -5 }}
            photo={{ dx: 5, dy: -3 }}
            block={{ dx: -4, dy: 3 }}
            duration={5.8}
            delay={-3.2}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Five photographs in an asymmetrical editorial arrangement: varied aspect
 * ratios, deliberate negative space, no strict grid. Only shown from 1024px up,
 * where the column is wide enough for the layering to read.
 */
function HeroImageCollage() {
  return (
    <div className="relative hidden aspect-[6/5] w-full lg:block">
      <HeroDecorativeLines />

      {/* Tall portrait, upper left */}
      <div className="absolute left-0 top-[3%] w-[23%]">
        <HeroImageFrame
          image={portraitLead}
          sizes="(min-width: 1024px) 16vw, 44vw"
          ratio="aspect-[3/4]"
          priority
          backing="charcoal"
          offset={{ x: 12, y: 11 }}
          duration={5.4}
          delay={-0.6}
          photo={{ dx: -8, dy: 3 }}
          block={{ dx: 7, dy: -3 }}
        />
      </div>

      {/* Landscape detail, upper right */}
      <div className="absolute right-[4%] top-0 w-[31%]">
        <HeroImageFrame
          image={codeDetail}
          sizes="(min-width: 1024px) 20vw, 46vw"
          ratio="aspect-[4/3]"
          backing="green"
          offset={{ x: -11, y: 10 }}
          duration={6.1}
          delay={-1.8}
          photo={{ dx: 7, dy: 4 }}
          block={{ dx: -8, dy: -2 }}
        />
      </div>

      {/* Wide frame through the middle, inset from both edges */}
      <div className="absolute left-[24%] top-[36%] w-[44%]">
        <HeroImageFrame
          image={labWide}
          sizes="(min-width: 1024px) 28vw, 82vw"
          ratio="aspect-[16/10]"
          priority
          radius="rounded-none"
          backing="moss"
          offset={{ x: 12, y: -10 }}
          duration={6.8}
          delay={-2.7}
          photo={{ dx: 2, dy: -7 }}
          block={{ dx: -2, dy: 6 }}
        />
      </div>

      {/* Small portrait, lower right (desktop and tablet) */}
      <div className="absolute right-0 top-[44%] z-10 w-[19%]">
        <HeroImageFrame
          image={workshopDetail}
          sizes="(min-width: 1024px) 12vw, 19vw"
          ratio="aspect-[3/4]"
          backing="slate"
          offset={{ x: -12, y: 8 }}
          duration={5.0}
          delay={-1.1}
          photo={{ dx: -7, dy: 6 }}
          block={{ dx: 8, dy: -4 }}
        />
      </div>

      {/* Small landscape, lower left, overlapping the wide frame's corner */}
      <div className="absolute left-0 top-[72%] z-10 w-[27%]">
        <HeroImageFrame
          image={hardwareDetail}
          sizes="(min-width: 1024px) 17vw, 38vw"
          ratio="aspect-[5/4]"
          backing="green"
          offset={{ x: 10, y: -9 }}
          duration={5.8}
          delay={-3.2}
          photo={{ dx: 9, dy: -5 }}
          block={{ dx: -7, dy: 5 }}
        />
      </div>
    </div>
  )
}

/**
 * Marker stroke that draws left-to-right, holds, then erases right-to-left.
 * Kept inline so it follows the word without affecting line breaks.
 */
function AnimatedHighlight({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="relative isolate inline-block">
      <span aria-hidden className="hero-mark" style={{ animationDelay: `${delay}s` }} />
      {children}
    </span>
  )
}

function HeroCopy() {
  const { user } = useAuth()

  return (
    <div className="max-w-[620px]">
      <h1 className="max-w-[20ch] text-[2.125rem] font-semibold leading-[1.18] tracking-[-0.03em] text-ink-950 sm:text-[2.625rem] lg:text-[clamp(3rem,3.55vw,3.5rem)] lg:leading-[1.12]">
        <AnimatedHighlight>Technology</AnimatedHighlight> is better when we{' '}
        <AnimatedHighlight delay={0.9}>explore</AnimatedHighlight> it{' '}
        <AnimatedHighlight delay={1.8}>together</AnimatedHighlight>.
      </h1>

      <p className="mt-7 max-w-[46ch] text-[1rem] leading-7 text-ink-600">
        KIUT Digital Club brings students together to explore technology, exchange ideas, develop practical skills and
        collaborate on projects, competitions and creative initiatives.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
        {user ? (
          <ButtonLink to={homeForRole(user.role)} size="lg" iconRight={<LayoutDashboard className="h-4 w-4" />}>
            Open dashboard
          </ButtonLink>
        ) : (
          <ButtonLink to="/auth/register" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
            Join the club
          </ButtonLink>
        )}
        <ButtonLink to="/about" variant="ghost" size="lg" iconRight={<ArrowUpRight className="h-4 w-4" />}>
          How the club works
        </ButtonLink>
      </div>
    </div>
  )
}

export function HomeHero() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-4.25rem)] flex-col justify-center overflow-hidden border-b border-line bg-surface pb-12 pt-12 sm:min-h-[calc(100svh-5rem)] sm:pb-14 sm:pt-14 lg:py-14">
      <div className="container-editorial w-full">
        <div className="grid gap-y-8 md:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] md:items-center md:gap-x-10 lg:gap-x-16">
          <div className="md:col-start-1">
            <HeroCopy />
          </div>

          <div className="w-full min-w-0 md:col-start-2">
            <HeroStackedCollage />
            <HeroImageCollage />
          </div>
        </div>
      </div>
    </section>
  )
}

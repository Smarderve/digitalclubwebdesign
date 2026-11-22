import type { CSSProperties, ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { ButtonLink } from '../ui/button'
import { media, type HeroMedia } from './hero'
import { cn } from '../../lib/utils'

/**
 * Home hero — editorial photographic collage.
 *
 * The headline and copy sit on the left and are centred against the image
 * composition on wide screens. Each photograph has its own solid backing block
 * and the two elements drift independently in opposite directions, slowly
 * enough to keep the copy readable.
 */

const portraitLead = media(
  '/images/learning/developer-portrait',
  'A developer working at a laptop in a shared workspace',
)
const codeDetail = media('/images/development/code-screen', 'A screen showing program code')
const labWide = media(
  '/images/lab/computer-lab-study',
  'A student working at a computer in a university laboratory',
)
const hardwareDetail = media('/images/learning/robotics-demo', 'Students demonstrating a humanoid robot')
const workshopDetail = media('/images/events/workshop-room', 'A technology workshop in progress in a teaching room')

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
  className,
}: {
  image: HeroMedia
  sizes: string
  ratio: string
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
    <div className={cn('relative', className)}>
      <span
        aria-hidden
        className={cn('hero-drift absolute inset-0', backingClass[backing])}
        style={{ ...driftStyle(block, duration, delay), translate: `${offset.x}px ${offset.y}px` }}
      />
      <div className={cn('hero-drift relative overflow-hidden bg-ink-100', radius)} style={driftStyle(photo, duration, delay)}>
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={sizes}
          alt={image.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          className={cn('block w-full object-cover', ratio)}
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
 * Five photographs in an asymmetrical editorial arrangement: varied aspect
 * ratios, deliberate negative space, no strict grid. Positions are tuned per
 * breakpoint; desktop keeps the widest gaps.
 */
function HeroImageCollage() {
  return (
    <div className="relative aspect-[4/5] w-full sm:aspect-[16/11] lg:aspect-[6/5]">
      <HeroDecorativeLines />

      {/* Tall portrait, upper left */}
      <div className="absolute left-0 top-0 w-[45%] sm:w-[24%] lg:top-[3%] lg:w-[23%]">
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
      <div className="absolute right-0 top-[4%] w-[44%] sm:top-0 sm:w-[30%] lg:top-0 lg:right-[4%] lg:w-[31%]">
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
      <div className="absolute left-[6%] top-[34%] w-[84%] sm:left-[20%] sm:top-[42%] sm:w-[52%] lg:left-[24%] lg:top-[36%] lg:w-[44%]">
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
      <div className="absolute right-0 top-[46%] z-10 hidden w-[20%] sm:block lg:top-[44%] lg:w-[19%]">
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
      <div className="absolute left-[2%] top-[77%] z-10 w-[38%] sm:left-[2%] sm:top-[76%] sm:w-[26%] lg:top-[72%] lg:w-[27%]">
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
  return (
    <div className="max-w-[620px]">
      <h1 className="max-w-[20ch] text-[2.125rem] font-semibold leading-[1.14] tracking-[-0.03em] text-ink-950 sm:text-[2.625rem] lg:text-[clamp(3rem,3.55vw,3.5rem)]">
        <AnimatedHighlight>Technology</AnimatedHighlight> is better when we{' '}
        <AnimatedHighlight delay={0.9}>explore</AnimatedHighlight> it{' '}
        <AnimatedHighlight delay={1.8}>together</AnimatedHighlight>.
      </h1>

      <p className="mt-6 max-w-[46ch] text-[1rem] leading-7 text-ink-600">
        KIUT Digital Club brings students together to explore technology, exchange ideas, develop practical skills and
        collaborate on projects, competitions and creative initiatives.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
        <ButtonLink to="/auth/register" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
          Join the club
        </ButtonLink>
        <ButtonLink to="/about" variant="ghost" size="lg" iconRight={<ArrowUpRight className="h-4 w-4" />}>
          How the club works
        </ButtonLink>
      </div>
    </div>
  )
}

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-surface">
      <div className="container-editorial">
        <div className="grid gap-y-10 pb-16 pt-[58px] sm:pt-[64px] lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-center lg:gap-x-16 lg:pb-24 lg:pt-[62px]">
          <div className="lg:col-start-1">
            <HeroCopy />
          </div>

          <div className="w-full lg:col-start-2">
            <HeroImageCollage />
          </div>
        </div>
      </div>
    </section>
  )
}

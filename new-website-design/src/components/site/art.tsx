import { cn } from '../../lib/utils'

/**
 * Human-centred line illustrations for public pages.
 *
 * Every scene is drawn from the same language: one thin charcoal contour,
 * a restrained green accent and a little technical furniture (screens, code,
 * network lines, grids). They are decorative, so callers mark their wrapper
 * aria-hidden and keep the artwork behind the reading order.
 *
 * Scenes are deliberately outline-only. Fills are limited to translucent
 * brand tints on screens and light washes so artwork can sit behind text in
 * both themes without lowering contrast.
 */

type SceneProps = {
  className?: string
  /** Adds the slow drift/sway motion. Off for stacked or repeated instances. */
  motion?: boolean
  /** Animates the contour as if it were being drawn. */
  draw?: boolean
}

function Frame({
  children,
  className,
  motion,
  draw,
  label,
}: SceneProps & { children: React.ReactNode; label: string }) {
  return (
    <svg
      viewBox="0 0 360 260"
      fill="none"
      role="img"
      aria-label={label}
      className={cn(
        'art-scene h-auto w-full',
        motion && 'art-drift',
        draw && 'art-draw',
        className,
      )}
    >
      <g stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  )
}

function Screen({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" className="art-screen" />
      <path d={`M${x + 10} ${y + 16}h${w * 0.42}`} className="art-accent" />
      <path d={`M${x + 10} ${y + 27}h${w * 0.64}`} />
      <path d={`M${x + 10} ${y + 38}h${w * 0.52}`} />
      <path d={`M${x + 10} ${y + 49}h${w * 0.3}`} className="art-accent" />
    </g>
  )
}

function Person({
  x,
  y,
  scale = 1,
  seated = false,
  arm = 'keyboard',
}: {
  x: number
  y: number
  scale?: number
  seated?: boolean
  arm?: 'keyboard' | 'point' | 'tablet' | 'up'
}) {
  const armPath =
    arm === 'point'
      ? 'M12 2c10 4 18 10 26 6'
      : arm === 'tablet'
        ? 'M12 4c12 2 18 12 14 22'
        : arm === 'up'
          ? 'M10 0c6-8 12-10 18-8'
          : 'M12 4c10 3 16 10 18 16'
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="4" cy="-24" r="9" />
      <path d={seated ? 'M-2 -14c-2 8-2 16 0 24h14c2-8 2-16 0-24' : 'M-1 -14c-3 12-3 26 0 38h15c3-12 3-26 0-38'} />
      <path d={armPath} />
      {seated ? <path d="M-2 10h-10M16 10h12" /> : <path d="M0 24v12M12 24v12" />}
    </g>
  )
}

export function CodingDesk(props: SceneProps) {
  return (
    <Frame {...props} label="Two students working together at a computer">
      <path d="M28 206h300M56 206v22M300 206v22" />
      <Screen x={168} y={96} w={112} h={78} />
      <path d="M224 174v18M204 194h40" />
      <Person x={128} y={170} seated arm="keyboard" />
      <Person x={310} y={184} arm="point" />
      <path d="M60 190h34v16H60z" />
      <path d="M66 190l6-10h16l4 10" />
      <path d="M44 174c0-8 6-14 14-14M58 152v-8M51 155l-6-6M65 155l6-6" className="art-accent" />
      <path d="M292 78l10-10M302 78l-10-10M286 66l16 16" />
      <path d="M36 64h64M36 72h40" className="art-strong" />
      <path d="M246 58h58v22h-58z" />
      <path d="M254 66h22M254 72h34" className="art-accent" />
    </Frame>
  )
}

export function SecurityLab(props: SceneProps) {
  return (
    <Frame {...props} label="A cybersecurity researcher reviewing a terminal">
      <path d="M24 208h312" />
      <Screen x={150} y={84} w={124} h={92} />
      <path d="M212 176v18M190 194h44M188 194h48" />
      <Person x={112} y={176} seated arm="keyboard" />
      <g transform="translate(292 118)">
        <path d="M0-30l22 8v20C22 12 12 22 0 28-12 22-22 12-22 0v-20z" />
        <path d="M-8 0l6 8 12-14" className="art-accent" />
      </g>
      <path d="M40 96h54v86H40z" />
      <path d="M48 108h38M48 120h38M48 132h22" />
      <path d="M48 150h38M48 162h28" className="art-accent" />
      <path d="M94 118h56M94 134h74M94 150h66" />
      <circle cx="118" cy="60" r="3" />
      <circle cx="210" cy="48" r="4" />
      <path d="M122 60l84-10M214 52l66 24" />
      <path d="M74 48h20M84 38v20" className="art-accent" />
    </Frame>
  )
}

export function DesignStudio(props: SceneProps) {
  return (
    <Frame {...props} label="A designer sketching digital artwork on a tablet">
      <path d="M30 208h300M72 208v-92h150v92" />
      <path d="M222 116l42 92" />
      <Person x={110} y={176} seated arm="tablet" />
      <g transform="translate(160 158)">
        <rect x="0" y="0" width="70" height="46" rx="3" transform="rotate(-12)" />
        <path d="M10 12c14-8 26 10 40 2s10 12-2 16" className="art-accent" />
        <circle cx="22" cy="14" r="2" />
      </g>
      <path d="M248 70l30 30M278 70l-30 30" />
      <path d="M64 70h58v28H64zM74 82h34" />
      <circle cx="292" cy="58" r="10" className="art-accent" />
      <path d="M292 48v20M282 58h20" />
      <path d="M246 156h34M246 166h22" />
      <path d="M300 120v-26M290 104h20" />
    </Frame>
  )
}

export function NetworkRoom(props: SceneProps) {
  return (
    <Frame {...props} label="Students maintaining networking equipment">
      <path d="M20 210h320M56 210v18M300 210v18" />
      <path d="M70 62h76v148H70zM86 78h44v18H86zM86 108h44v18H86zM86 138h44v18H86zM86 168h44v18H86z" />
      <path d="M108 96v12M108 126v12M108 156v12" className="art-accent" />
      <Person x={196} y={180} arm="up" />
      <Person x={290} y={180} seated arm="keyboard" />
      <path d="M220 92c22 4 34 14 44 26M272 130c12 0 20 4 26 10" className="art-accent" />
      <circle cx="220" cy="92" r="3" className="art-accent" />
      <circle cx="272" cy="130" r="3" className="art-accent" />
      <path d="M160 40h150M160 48h96" className="art-strong" />
      <path d="M24 40h100v26H24zM36 50h60M36 58h46" />
    </Frame>
  )
}

export function RoboticsBench(props: SceneProps) {
  return (
    <Frame {...props} label="A student assembling a small robot at a workbench">
      <path d="M22 202h318M62 202v20M300 202v20" />
      <Person x={122} y={172} seated arm="keyboard" />
      <g transform="translate(210 128)">
        <path d="M0 46h26M13 46V22" />
        <circle cx="13" cy="10" r="11" />
        <path d="M2 4l-10-6M24 4l10-6" className="art-accent" />
        <path d="M8 30h10M8 36h18" />
        <circle cx="38" cy="20" r="7" />
        <path d="M33 20h-5M40 13l4-6" />
      </g>
      <path d="M44 128h32v30H44zM52 138h16M52 146h10" />
      <g transform="translate(300 84)" className="art-accent">
        <circle cx="0" cy="0" r="13" />
        <path d="M0-18v36M-18 0h36M-13-13l26 26M13-13l-26 26" />
      </g>
      <path d="M286 60l-16 22M298 62l6 24" />
      <path d="M250 38h84M250 46h52" className="art-strong" />
    </Frame>
  )
}

export function Presentation(props: SceneProps) {
  return (
    <Frame {...props} label="A student presenting a project to the club">
      <path d="M20 210h320" />
      <path d="M60 44h150v100H60z" />
      <path d="M74 66h54v10H74zM74 86h92M74 98h76M74 110h56" />
      <path d="M92 144v18M178 144v18" />
      <Person x={250} y={192} arm="up" scale={1.15} />
      <path d="M100 192h48v18h-48zM114 186l-8-6M134 186l8-6" />
      <Person x={172} y={198} seated arm="keyboard" scale={0.8} />
      <Person x={312} y={198} seated arm="keyboard" scale={0.8} />
      <path d="M20 70h26M20 78h16" className="art-accent" />
      <path d="M236 50h96v24h-96zM248 58h42M248 66h62" />
      <path d="M246 30l14 10M260 30l-14 10" />
    </Frame>
  )
}

export function StudyCircle(props: SceneProps) {
  return (
    <Frame {...props} label="Students studying programming together around a table">
      <ellipse cx="180" cy="150" rx="150" ry="26" />
      <ellipse cx="180" cy="150" rx="118" ry="18" className="art-dash" />
      <path d="M180 176v34M150 210h60" />
      <Person x={92} y={120} scale={0.9} arm="point" />
      <Person x={180} y={112} scale={0.9} arm="tablet" />
      <Person x={268} y={120} scale={0.9} arm="up" />
      <Screen x={132} y={72} w={54} h={34} />
      <path d="M210 96l22 10M240 92l18 14" />
      <path d="M48 60h42v20H48zM56 68h26" />
      <path d="M290 58h44M290 66h28" className="art-strong" />
      <circle cx="320" cy="98" r="8" className="art-accent" />
      <path d="M314 92l12 12M326 92l-12 12" />
    </Frame>
  )
}

export function Hackathon(props: SceneProps) {
  return (
    <Frame {...props} label="A student team working through a hackathon">
      <path d="M16 208h328M16 208V44h328v164" />
      <path d="M52 44V24h84v20M132 32h110M242 32l10-10" />
      <path d="M52 76h256M52 88h180" className="art-strong" />
      <Screen x={62} y={112} w={78} h={54} />
      <Screen x={154} y={112} w={78} h={54} />
      <Screen x={246} y={112} w={70} h={54} />
      <Person x={100} y={198} seated arm="keyboard" scale={0.85} />
      <Person x={192} y={198} seated arm="keyboard" scale={0.85} />
      <Person x={284} y={198} seated arm="tablet" scale={0.85} />
      <path d="M250 60h44v10h-44z" className="art-accent" />
      <path d="M258 65h28" />
      <circle cx="70" cy="60" r="4" />
      <circle cx="86" cy="60" r="4" />
      <path d="M66 60h16" />
    </Frame>
  )
}

export function CampusWalk(props: SceneProps) {
  return (
    <Frame {...props} label="Two club members talking on campus">
      <path d="M18 210h324" />
      <path d="M80 210V86l70-34 70 34v124" />
      <path d="M96 96h20v18H96zM114 96h20v18h-20zM138 96h20v18h-20zM162 96h20v18h-20z" />
      <path d="M96 122h20v18H96zM114 122h20v18h-20zM138 122h20v18h-20zM162 122h20v18h-20z" />
      <path d="M150 210v-36h34v36" />
      <Person x={246} y={190} arm="point" />
      <Person x={304} y={190} scale={0.92} arm="up" />
      <path d="M224 62c0-12 10-22 22-22s22 10 22 22" className="art-accent" />
      <path d="M236 62c0-6 5-11 11-11s11 5 11 11" />
      <path d="M34 70h30M34 78h18" className="art-strong" />
    </Frame>
  )
}

export type ArtSceneName =
  | 'coding'
  | 'security'
  | 'design'
  | 'network'
  | 'robotics'
  | 'presentation'
  | 'study'
  | 'hackathon'
  | 'campus'

const scenes: Record<ArtSceneName, (props: SceneProps) => JSX.Element> = {
  coding: CodingDesk,
  security: SecurityLab,
  design: DesignStudio,
  network: NetworkRoom,
  robotics: RoboticsBench,
  presentation: Presentation,
  study: StudyCircle,
  hackathon: Hackathon,
  campus: CampusWalk,
}

/** Small technical diagram used as an accent on the homepage and about page. */
export function SignalDiagram({ className, motion }: { className?: string; motion?: boolean }) {
  return (
    <svg
      viewBox="0 0 220 160"
      fill="none"
      aria-hidden
      className={cn('art-scene', motion && 'art-sway', className)}
    >
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="110" cy="80" r="18" />
        <circle cx="110" cy="80" r="38" className="art-dash" />
        <circle cx="110" cy="80" r="58" className="art-dash" />
        <path d="M110 22v20M110 118v20M52 80h20M148 80h20" />
        <circle cx="110" cy="18" r="3" className="art-accent" />
        <circle cx="152" cy="80" r="3" className="art-accent" />
        <circle cx="110" cy="142" r="3" />
        <circle cx="48" cy="80" r="3" />
        <path d="M110 22l42 58-42 62-62-62z" className="art-dash art-accent" />
        <path d="M92 80h36M110 62v36" className="art-accent" />
      </g>
    </svg>
  )
}

/**
 * Positions a scene behind page content without touching the reading order.
 * `tone` controls how strongly it reads in the background.
 */
export function ArtBackdrop({
  scene,
  className,
  tone = 'soft',
  flip = false,
  motion = true,
}: {
  scene: ArtSceneName
  className?: string
  tone?: 'soft' | 'medium' | 'strong'
  flip?: boolean
  motion?: boolean
}) {
  const Scene = scenes[scene]
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute select-none',
        tone === 'soft' && 'opacity-[0.16]',
        tone === 'medium' && 'opacity-[0.26]',
        tone === 'strong' && 'opacity-[0.4]',
        flip && '-scale-x-100',
        className,
      )}
    >
      <Scene motion={motion} />
    </div>
  )
}

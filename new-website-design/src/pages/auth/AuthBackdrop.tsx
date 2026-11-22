/**
 * Full-bleed decorative field behind the auth forms.
 * Light canvas, architectural grid, large low-contrast circles and
 * dashed vertical guides. Purely presentational: aria-hidden, no focus,
 * no pointer events. Motion is limited to slow drift/rotation and is
 * switched off by the reduced-motion rules in index.css.
 */

function RingGroup({ className, dashed = false }: { className: string; dashed?: boolean }) {
  return (
    <div className={`auth-orbit ${className}`}>
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className={
            dashed && index === 1
              ? 'absolute rounded-full border border-dashed border-brand-700/[0.14]'
              : 'absolute rounded-full border border-ink-900/[0.055]'
          }
          style={{ inset: `${index * 13.5}%` }}
        />
      ))}
    </div>
  )
}

export function AuthBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(125%_90%_at_50%_-12%,#FFFFFF_0%,#F8FBF9_38%,#EFF5F1_100%)]" />
      <div className="auth-grid absolute -inset-[8%]" />

      {/* Long edge guides: the composition reads as a measured page, not a card floating in space. */}
      <div className="absolute inset-y-0 left-[11%] hidden w-px border-l border-dashed border-ink-300/45 xl:block" />
      <div className="absolute inset-y-0 right-[11%] hidden w-px border-l border-dashed border-ink-300/45 xl:block" />

      <RingGroup className="auth-orbit-slow -right-[26vw] -top-[30vw] h-[66vw] w-[66vw] max-h-[820px] max-w-[820px]" />
      <RingGroup className="auth-orbit-reverse -left-[30vw] -bottom-[34vw] h-[64vw] w-[64vw] max-h-[760px] max-w-[760px]" dashed />

      <div className="absolute inset-x-0 top-[18%] h-px bg-line/70" />
      <div className="absolute inset-x-0 bottom-[16%] h-px bg-line/70" />

      <div className="absolute left-1/2 top-0 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-line to-transparent" />
    </div>
  )
}

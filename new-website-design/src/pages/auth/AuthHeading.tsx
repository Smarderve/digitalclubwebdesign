import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function AuthHeading({
  label,
  title,
  description,
  align = 'center',
}: {
  label: string
  title: string
  description: ReactNode
  align?: 'center' | 'left'
}) {
  const centered = align === 'center'
  return (
    <div className={centered ? 'text-center' : ''}>
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-brand-700">{label}</p>
      <h1 className="mt-2 text-[1.6875rem] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-950 sm:text-[1.875rem]">
        {title}
      </h1>
      <p className={`mt-2 text-[0.875rem] leading-6 text-ink-500 ${centered ? 'mx-auto max-w-[38ch]' : 'max-w-[54ch]'}`}>
        {description}
      </p>
    </div>
  )
}

export function AuthLogo({ align = 'center' }: { align?: 'center' | 'left' }) {
  return (
    <Link
      to="/"
      className={`group items-center gap-2.5 rounded-sm ${align === 'center' ? 'mx-auto flex w-fit' : 'inline-flex'}`}
      aria-label="KIUT Digital Club home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white p-1.5 shadow-xs transition-transform duration-300 ease-smooth group-hover:-translate-y-0.5">
        <img src="/brand/digital-club-logo.svg" alt="" className="h-full w-full object-contain" />
      </span>
      <span className="text-left">
        <span className="block text-[0.8125rem] font-semibold leading-tight text-ink-950">KIUT Digital Club</span>
        <span className="block text-[0.5625rem] uppercase tracking-[0.14em] text-ink-400">Member access</span>
      </span>
    </Link>
  )
}

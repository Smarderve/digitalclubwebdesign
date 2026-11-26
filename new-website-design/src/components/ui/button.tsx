import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const variants = {
  /* The primary action is the theme's brand colour exactly (for the green
     themes that is #3AB658), not a tint of it. */
  primary:
    'bg-[rgb(var(--btn-primary))] btn-primary-fg shadow-xs hover:bg-[rgb(var(--btn-primary-hover))] hover:shadow-md active:bg-[rgb(var(--btn-primary-hover))] disabled:bg-ink-200 disabled:text-ink-500',
  secondary:
    'border border-ink-900 bg-surface text-ink-950 hover:bg-ink-950 hover:text-white active:bg-ink-900 disabled:border-ink-200 disabled:text-ink-400',
  outline:
    'border border-ink-200 bg-surface text-ink-800 hover:border-ink-300 hover:bg-ink-50 active:bg-ink-100 disabled:text-ink-400',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-950 active:bg-ink-200 disabled:text-ink-400',
  brandSoft: 'bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200 disabled:text-ink-400',
  danger: 'bg-danger text-white hover:bg-danger-strong active:bg-danger-strong disabled:bg-ink-200',
  dangerSoft: 'bg-danger-soft text-danger hover:bg-danger-soft-strong active:bg-danger-soft-strong',
  link: 'px-0 text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700',
} as const

const sizes = {
  xs: 'h-7 gap-1.5 px-2.5 text-[0.75rem]',
  sm: 'h-8 gap-1.5 px-3 text-small',
  md: 'h-10 gap-2 px-4 text-[0.875rem]',
  lg: 'h-11 gap-2 px-5 text-[0.9375rem]',
  icon: 'h-9 w-9 justify-center px-0',
  'icon-sm': 'h-8 w-8 justify-center px-0',
} as const

type Variant = keyof typeof variants
type Size = keyof typeof sizes

const base =
  'inline-flex select-none items-center justify-center rounded-sm font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-smooth hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:hover:translate-y-0 active:translate-y-0 active:scale-[0.99] motion-reduce:transform-none'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, children, iconLeft, iconRight, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : iconLeft}
      {children}
      {iconRight}
    </button>
  )
})

export function ButtonLink({
  to,
  href,
  className,
  variant = 'primary',
  size = 'md',
  children,
  iconLeft,
  iconRight,
  ...props
}: {
  to?: string
  href?: string
  className?: string
  variant?: Variant
  size?: Size
  children: ReactNode
  iconLeft?: ReactNode
  iconRight?: ReactNode
  target?: string
  rel?: string
  'aria-label'?: string
}) {
  const classes = cn(base, variants[variant], sizes[size], className)
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {iconLeft}
        {children}
        {iconRight}
      </Link>
    )
  }
  return (
    <a href={href} className={classes} {...props}>
      {iconLeft}
      {children}
      {iconRight}
    </a>
  )
}

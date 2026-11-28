import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '../../lib/utils'

export const inputStyles =
  'block w-full rounded-sm border border-ink-200 bg-surface px-3 py-2 text-[0.875rem] text-ink-900 shadow-xs transition-colors placeholder:text-ink-500 hover:border-ink-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20'

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  optional?: boolean
}

export function Field({ label, htmlFor, hint, error, required, children, className, optional }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-small font-medium text-ink-800">
          {label}
          {required ? <span className="ml-0.5 text-danger">*</span> : null}
        </label>
        {optional ? <span className="text-[0.6875rem] uppercase tracking-wide text-ink-400">Optional</span> : null}
      </div>
      {children}
      {hint && !error ? (
        <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-[0.75rem] leading-5 text-ink-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-[0.75rem] font-medium leading-5 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputStyles, 'h-10', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(inputStyles, 'min-h-[104px] resize-y', className)} {...props} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(inputStyles, 'h-10 cursor-pointer appearance-none pr-9', className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500"
      >
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
})

export const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }
>(function Checkbox({ className, label, id, ...props }, ref) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-[4px] border-ink-300 text-brand-700 accent-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
        {...props}
      />
      {label ? (
        <label htmlFor={inputId} className="cursor-pointer text-small leading-5 text-ink-700">
          {label}
        </label>
      ) : null}
    </div>
  )
})

export function RadioCard({
  name,
  value,
  checked,
  onChange,
  label,
  description,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  label: ReactNode
  description?: ReactNode
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 transition-colors',
        checked ? 'border-brand-600 bg-brand-50/60' : 'border-ink-200 bg-surface hover:border-ink-300 hover:bg-ink-50/50',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
      />
      <span className="min-w-0">
        <span className={cn('block text-[0.8125rem]', checked ? 'font-semibold text-ink-950' : 'font-medium text-ink-800')}>{label}</span>
        {description ? <span className="mt-0.5 block text-[0.75rem] leading-5 text-ink-500">{description}</span> : null}
      </span>
    </label>
  )
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  id,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
  id?: string
}) {
  const generated = useId()
  const switchId = id ?? generated
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={switchId} className="text-small font-medium text-ink-900">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-[0.75rem] leading-5 text-ink-500">{description}</p> : null}
      </div>
      <SwitchPrimitive.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2',
          checked ? 'bg-brand-700' : 'bg-ink-200',
        )}
      >
        <SwitchPrimitive.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-xs transition-transform data-[state=checked]:translate-x-[18px]" />
      </SwitchPrimitive.Root>
    </div>
  )
}

export function FileInput({
  id,
  accept,
  hint,
  onChange,
  fileName,
}: {
  id: string
  accept?: string
  hint?: string
  onChange?: (file: File | null) => void
  fileName?: string | null
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-ink-300 bg-ink-50/60 px-4 py-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50/40 focus-within:ring-2 focus-within:ring-brand-700 focus-within:ring-offset-2"
      >
        <span className="text-small font-medium text-ink-800">
          {fileName ? fileName : 'Choose a file or drag it here'}
        </span>
        <span className="mt-1 text-[0.75rem] text-ink-500">{hint ?? 'PNG, JPG, PDF up to 10 MB'}</span>
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => onChange?.(event.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}

export function InputWithIcon({
  icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{icon}</span>
      <Input className={cn('pl-9', className)} {...props} />
    </div>
  )
}

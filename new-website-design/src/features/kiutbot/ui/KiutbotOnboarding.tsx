import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useKiutbot } from '../context'
import { isValidContact } from '../text'

/**
 * The original widget blocked service until the visitor registered a name and
 * a contact (`register_client`). That requirement is preserved, but expressed
 * as a compact docked step instead of a full-width grey form.
 */
export function KiutbotOnboarding({
  step,
  onStep,
}: {
  step: 'name' | 'contact'
  onStep: (step: 'name' | 'contact') => void
}) {
  const { register, registering, registrationError, connection, savedName } = useKiutbot()
  const [name, setName] = useState(savedName)
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const contactRef = useRef<HTMLInputElement>(null)
  const initialStep = useRef(step)

  useEffect(() => {
    if (initialStep.current === 'name' && step === 'contact') contactRef.current?.focus()
  }, [step])

  const offline = connection !== 'connected'
  const busy = registering
  const message = error ?? registrationError

  const submitName = () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Please enter the name we should use.')
      return
    }
    setError(null)
    onStep('contact')
  }

  const submitContact = () => {
    if (!isValidContact(contact)) {
      setError('Enter a valid email address or phone number.')
      return
    }
    setError(null)
    register(name.trim(), contact.trim())
  }

  return (
    <form
      className="shrink-0 border-t border-line bg-white px-3 pb-2.5 pt-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (step === 'name') submitName()
        else submitContact()
      }}
    >
      <div className="rounded-xl border border-line bg-canvas/60 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`kiutbot-${step}`}
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-500"
          >
            {step === 'name' ? 'Your name' : 'Email or phone'}
          </label>
          {step === 'contact' ? (
            <button
              type="button"
              onClick={() => {
                setError(null)
                onStep('name')
              }}
              className="rounded-sm px-1 text-[0.625rem] font-medium text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              Change name
            </button>
          ) : null}
        </div>

        <div className="mt-1.5 flex items-stretch gap-1.5">
          {step === 'name' ? (
            <input
              id="kiutbot-name"
              data-autofocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="given-name"
              placeholder="e.g. Amani"
              aria-invalid={Boolean(error) || undefined}
              className="h-9 min-w-0 flex-1 rounded-md border border-line bg-white px-2.5 text-[0.8125rem] text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          ) : (
            <input
              id="kiutbot-contact"
              ref={contactRef}
              data-autofocus
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(error) || undefined}
              className="h-9 min-w-0 flex-1 rounded-md border border-line bg-white px-2.5 text-[0.8125rem] text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          )}

          <button
            type="submit"
            disabled={offline || busy}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-[0.75rem] font-semibold transition-colors',
              'focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1',
              offline || busy
                ? 'bg-ink-100 text-ink-400'
                : 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
            )}
          >
            {busy ? <Loader2 size={13} className="animate-spin" aria-hidden /> : null}
            {busy ? 'Saving…' : step === 'name' ? 'Continue' : 'Start chat'}
          </button>
        </div>

        {step === 'contact' ? (
          <p className="mt-1.5 text-[0.625rem] leading-4 text-ink-400">
            KIUTBOT only uses this to follow up on your question.
          </p>
        ) : null}

        {message ? (
          <p role="alert" className="mt-1.5 text-[0.6875rem] leading-4 text-danger">
            {message}
          </p>
        ) : offline ? (
          <p className="mt-1.5 text-[0.6875rem] leading-4 text-ink-400">Connecting to KIUTBOT…</p>
        ) : null}
      </div>
    </form>
  )
}

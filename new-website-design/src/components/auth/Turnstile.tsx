import { useEffect, useRef, useState } from 'react'
import { TURNSTILE_SITE_KEY } from '../../lib/api'
import { cn } from '../../lib/utils'

/**
 * Cloudflare Turnstile, as the backend expects it.
 *
 * The login, registration and password-reset endpoints refuse the request when
 * human verification is missing or unconfigured, so this widget is not
 * decoration: the forms stay disabled until it yields a token. The token is
 * single-use and short-lived, which is why a failed submit clears it.
 */

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      theme?: 'light' | 'dark' | 'auto'
      size?: 'normal' | 'compact' | 'flexible'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => string
  remove: (widgetId: string) => void
  reset: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null

function loadScript() {
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Turnstile could not load'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

export function Turnstile({
  onToken,
  className,
  resetSignal = 0,
}: {
  onToken: (token: string) => void
  className?: string
  /** Change this to discard the used token and obtain a fresh one. */
  resetSignal?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  const [failed, setFailed] = useState(false)
  onTokenRef.current = onToken

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let cancelled = false


    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          size: 'flexible',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => {
            setFailed(true)
            onTokenRef.current('')
          },
        })
      })
      .catch(() => setFailed(true))

    return () => {
      cancelled = true
      if (widgetRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetRef.current)
        } catch {
          /* the widget may already be gone after a route change */
        }
      }
      widgetRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!resetSignal || !widgetRef.current || !window.turnstile) return
    try {
      window.turnstile.reset(widgetRef.current)
    } catch {
      /* the widget may have been replaced by a route change */
    }
  }, [resetSignal])

  if (!TURNSTILE_SITE_KEY) {
    return (
      <p className={cn('text-[0.6875rem] leading-5 text-ink-400', className)}>
        Human verification is not configured in this environment, so sign-in and registration are
        unavailable.
      </p>
    )
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
      {failed ? (
        <p className="mt-1.5 text-[0.6875rem] leading-5 text-danger">
          Human verification could not load. Check your connection and reload the page.
        </p>
      ) : null}
    </div>
  )
}

export default Turnstile

import { useEffect, useState } from 'react'
import { Check, Copy, Share2, ThumbsDown, ThumbsUp } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { ChatMessage, MessageFeedback } from '../types'

/** Copy with a fallback for browsers that block the async clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the selection fallback */
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-1000px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(area)
    return copied
  } catch {
    return false
  }
}

type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/**
 * Use the device share sheet where it exists (phones, some desktop browsers) and
 * fall back to copying the answer, since a chat message has no shareable URL.
 */
export async function shareText(text: string): Promise<ShareResult> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: 'KIUTBOT answer', text })
      return 'shared'
    } catch (error) {
      if ((error as DOMException | undefined)?.name === 'AbortError') return 'cancelled'
      /* a rejected share falls back to copying below */
    }
  }
  return (await copyText(text)) ? 'copied' : 'failed'
}

const buttonClass =
  'inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-800 active:bg-ink-100 focus-visible:ring-2 focus-visible:ring-brand-600 disabled:pointer-events-none disabled:opacity-40'

/**
 * Copy / share / like / dislike for one assistant answer. The row sits below the
 * bubble, never inside the answer text, and stays reachable by keyboard: on
 * hover-capable devices it appears on hover or focus-within, on touch devices it
 * is always visible.
 */
export function KiutbotMessageActions({
  message,
  feedback,
  onRate,
}: {
  message: ChatMessage
  feedback: MessageFeedback | null
  onRate: (value: MessageFeedback) => void
}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared' | 'failed'>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timer = window.setTimeout(() => setStatus('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [status])

  const copy = async () => {
    setStatus((await copyText(message.text)) ? 'copied' : 'failed')
  }

  const share = async () => {
    const result = await shareText(message.text)
    if (result === 'cancelled') return
    setStatus(result === 'shared' ? 'shared' : result === 'copied' ? 'copied' : 'failed')
  }

  const label =
    status === 'copied' ? 'Copied' : status === 'shared' ? 'Shared' : status === 'failed' ? 'Not available' : ''

  return (
    <div
      role="group"
      aria-label="Message actions"
      className={cn(
        'flex min-h-6 flex-wrap items-center gap-0.5 transition-opacity',
        '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/msg:opacity-100 [@media(hover:hover)]:group-focus-within/msg:opacity-100',
      )}
    >
      <button
        type="button"
        onClick={copy}
        className={buttonClass}
        aria-label={status === 'copied' ? 'Copied to clipboard' : 'Copy answer'}
        title={status === 'copied' ? 'Copied' : 'Copy'}
      >
        {status === 'copied' ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      </button>

      <button
        type="button"
        onClick={share}
        className={buttonClass}
        aria-label="Share answer"
        title="Share"
      >
        <Share2 size={13} aria-hidden />
      </button>

      <span aria-hidden className="mx-0.5 h-3 w-px bg-line" />

      <button
        type="button"
        onClick={() => onRate('like')}
        className={cn(buttonClass, feedback === 'like' && 'bg-brand-50 text-brand-700 hover:bg-brand-100 hover:text-brand-800')}
        aria-label="Good answer"
        aria-pressed={feedback === 'like'}
        title={feedback === 'like' ? 'Liked — click to remove' : 'Good answer'}
      >
        <ThumbsUp size={13} aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => onRate('dislike')}
        className={cn(buttonClass, feedback === 'dislike' && 'bg-danger-soft text-danger hover:bg-danger-soft-strong hover:text-danger-strong')}
        aria-label="Bad answer"
        aria-pressed={feedback === 'dislike'}
        title={feedback === 'dislike' ? 'Disliked — click to remove' : 'Bad answer'}
      >
        <ThumbsDown size={13} aria-hidden />
      </button>

      <span aria-live="polite" className="ml-1 text-[0.625rem] font-medium text-ink-500">
        {label}
      </span>
    </div>
  )
}

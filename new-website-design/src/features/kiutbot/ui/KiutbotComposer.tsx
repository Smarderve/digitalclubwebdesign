import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { KIUTBOT } from '../config'
import { useKiutbot } from '../context'

const MAX_HEIGHT = 128

/**
 * Composer docked to the bottom of the panel. Grows with the message, scrolls
 * internally past 128px, and never covers the conversation (flex layout).
 */
export function KiutbotComposer() {
  const { send, canSend, connection, typing } = useKiutbot()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  const submit = () => {
    const text = value.trim()
    if (!text || !canSend) return
    send(text)
    setValue('')
    textareaRef.current?.focus()
  }

  const disabled = !canSend
  const offline = connection !== 'connected'

  return (
    <div className="shrink-0 border-t border-line bg-white px-3 pb-2.5 pt-2">
      <div
        className={cn(
          'flex items-end gap-1.5 rounded-[16px] border border-line bg-white py-1 pl-3 pr-1 transition-colors',
          'focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100',
          offline && 'bg-ink-50/60',
        )}
      >
        <label htmlFor="kiutbot-input" className="sr-only">
          Message KIUTBOT
        </label>
        <textarea
          id="kiutbot-input"
          ref={textareaRef}
          data-autofocus
          rows={1}
          value={value}
          maxLength={KIUTBOT.maxMessageLength}
          placeholder={offline ? 'Waiting for connection…' : 'Type your message…'}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            /* Never send while an IME is composing (Enter picks a character). */
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.shiftKey) return
            event.preventDefault()
            submit()
          }}
          className="kb-scroll max-h-[128px] min-h-[26px] flex-1 resize-none bg-transparent py-[5px] text-[0.8125rem] leading-5 text-ink-900 outline-none placeholder:text-ink-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || value.trim().length === 0}
          aria-label="Send message"
          className={cn(
            'mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-smooth md:h-8 md:w-8',
            'focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1',
            value.trim().length > 0 && !disabled
              ? 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
              : 'bg-ink-100 text-ink-400',
          )}
        >
          <Send size={15} aria-hidden />
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 px-1">
        <p className="text-[0.625rem] text-ink-400" role="status">
          {offline ? 'Reconnecting to KIUTBOT…' : typing ? 'KIUTBOT is replying…' : '\u00a0'}
        </p>
        {value.length > KIUTBOT.maxMessageLength - 100 ? (
          <p className="tabular text-[0.625rem] text-ink-400">
            {value.length}/{KIUTBOT.maxMessageLength}
          </p>
        ) : null}
      </div>
    </div>
  )
}

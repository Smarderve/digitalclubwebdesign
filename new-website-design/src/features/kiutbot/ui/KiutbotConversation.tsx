import { useEffect, useRef, useState } from 'react'
import { Check, Copy, RefreshCw } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useKiutbot } from '../context'
import { messageTime } from '../text'
import type { ChatMessage } from '../types'
import { KiutbotWelcome } from './KiutbotWelcome'

const GROUP_WINDOW_MS = 5 * 60 * 1000
const TIME_DIVIDER_MS = 10 * 60 * 1000

export function KiutbotConversation({ onboardingStep }: { onboardingStep: 'name' | 'contact' }) {
  const { phase, messages, typing, suggestions, send, canSend, retry } = useKiutbot()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, typing, phase, onboardingStep])

  useEffect(() => {
    if (!copiedId) return
    const timer = window.setTimeout(() => setCopiedId(null), 1800)
    return () => window.clearTimeout(timer)
  }, [copiedId])

  const copy = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.text)
      setCopiedId(message.id)
    } catch {
      /* clipboard blocked; the action stays silent rather than lying */
    }
  }

  const hasConversation = messages.some((message) => message.role !== 'system')
  const showSuggestions = suggestions.length > 0 && hasConversation && typing === false

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Conversation with KIUTBOT"
      className="kb-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-3"
    >
      {phase === 'onboarding' ? (
        <div className="space-y-2.5">
          <AssistantBubble>
            Before we get started, what should we call you?
          </AssistantBubble>
          {onboardingStep === 'contact' ? (
            <AssistantBubble>
              Thanks. How can we contact you if we need to follow up on your question?
            </AssistantBubble>
          ) : null}
          <p className="px-1 text-[0.6875rem] leading-5 text-ink-400">
            KIUTBOT asks for a name and one contact so the club can follow up. Nothing else is collected.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {messages.map((message, index) => {
            const previous = messages[index - 1]
            const newGroup = !previous || previous.role !== message.role || message.at - previous.at > GROUP_WINDOW_MS
            const showTime = !previous || message.at - previous.at > TIME_DIVIDER_MS

            if (message.role === 'system') {
              return (
                <div key={message.id} className="kb-msg-in flex justify-center py-0.5">
                  <p
                    className={cn(
                      'max-w-[94%] rounded-md border px-2.5 py-1.5 text-center text-[0.6875rem] leading-[1.5]',
                      message.tone === 'error' && 'border-danger-line bg-danger-soft text-danger-strong',
                      message.tone === 'success' && 'border-brand-200 bg-success-soft text-success',
                      (!message.tone || message.tone === 'neutral') && 'border-line bg-white text-ink-500',
                    )}
                  >
                    {message.text}
                  </p>
                </div>
              )
            }

            return (
              <div key={message.id}>
                {showTime ? (
                  <p className="py-1.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.08em] text-ink-400">
                    {messageTime(message.at)}
                  </p>
                ) : null}

                <div className={cn('kb-msg-in', newGroup ? 'mt-1' : 'mt-0.5')}>
                  {message.role === 'user' ? (
                    <div className="flex flex-col items-end gap-1">
                      <div
                        className={cn(
                          'max-w-[86%] whitespace-pre-wrap break-words rounded-[14px] rounded-br-[5px] bg-brand-600 px-3 py-2 text-[0.8125rem] leading-[1.6] text-white',
                          message.failed && 'bg-brand-700/80',
                        )}
                        title={messageTime(message.at)}
                      >
                        {message.text}
                      </div>
                      {message.failed ? (
                        <button
                          type="button"
                          onClick={() => retry(message.id)}
                          className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[0.6875rem] font-medium text-danger hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-brand-600"
                        >
                          <RefreshCw size={12} aria-hidden />
                          Not delivered · Retry
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="group/msg flex max-w-[92%] flex-col items-start gap-1">
                      <div
                        aria-hidden={message.streaming || undefined}
                        className="whitespace-pre-wrap break-words rounded-[14px] rounded-bl-[5px] border border-line bg-white px-3 py-2 text-[0.8125rem] leading-[1.6] text-ink-800 [overflow-wrap:anywhere]"
                        title={messageTime(message.at)}
                      >
                        {message.text ? renderText(message.text) : <span className="text-ink-400">…</span>}
                      </div>
                      {!message.streaming && message.text ? (
                        <button
                          type="button"
                          onClick={() => copy(message)}
                          className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[0.625rem] font-medium text-ink-400 transition-opacity hover:text-ink-700 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-600 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/msg:opacity-100"
                          aria-label="Copy answer"
                        >
                          {copiedId === message.id ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
                          {copiedId === message.id ? 'Copied' : 'Copy'}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {!hasConversation ? <KiutbotWelcome /> : null}

          {typing ? <TypingIndicator /> : null}

          {showSuggestions ? (
            <div className="space-y-1.5 pt-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={!canSend}
                  onClick={() => send(suggestion)}
                  className="flex w-full items-start gap-2 rounded-md border border-line bg-white/70 px-2.5 py-2 text-left text-[0.75rem] leading-5 text-ink-700 transition-colors hover:border-brand-200 hover:bg-white hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="kb-msg-in max-w-[92%] whitespace-pre-wrap break-words rounded-[14px] rounded-bl-[5px] border border-line bg-white px-3 py-2 text-[0.8125rem] leading-[1.6] text-ink-800">
      {children}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div
      className="kb-msg-in mt-1 inline-flex items-center gap-1 rounded-[14px] rounded-bl-[5px] border border-line bg-white px-3 py-2.5"
      aria-label="KIUTBOT is typing"
      role="status"
    >
      <span className="kb-dot" />
      <span className="kb-dot" />
      <span className="kb-dot" />
    </div>
  )
}

/** Links in answers are real links; everything else stays plain text. */
function renderText(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-700 break-all"
      >
        {part.replace(/^https?:\/\//, '')}
      </a>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
}

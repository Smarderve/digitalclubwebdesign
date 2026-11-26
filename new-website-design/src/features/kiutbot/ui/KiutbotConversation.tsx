import { useEffect, useRef, useState } from 'react'
import { Pencil, RefreshCw } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { KIUTBOT } from '../config'
import { useKiutbot } from '../context'
import { messageTime } from '../text'
import type { ChatMessage } from '../types'
import { KiutbotMessageActions } from './KiutbotMessageActions'
import { KiutbotWelcome } from './KiutbotWelcome'

const GROUP_WINDOW_MS = 5 * 60 * 1000
const TIME_DIVIDER_MS = 10 * 60 * 1000

/** Reveal-on-hover on pointer devices, always visible on touch. */
const HOVER_REVEAL =
  '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/msg:opacity-100 [@media(hover:hover)]:group-focus-within/msg:opacity-100'

const QUIET_ACTION =
  'inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-800 focus-visible:ring-2 focus-visible:ring-brand-600'

export function KiutbotConversation({ onboardingStep }: { onboardingStep: 'name' | 'contact' }) {
  const { phase, messages, typing, suggestions, send, canSend, retry, editMessage, feedback, rateMessage } =
    useKiutbot()
  const scrollRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, typing, phase, onboardingStep])

  /* The editor grows with its text, up to a few lines, like the composer. */
  useEffect(() => {
    const node = editorRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 132)}px`
  }, [draft, editingId])

  useEffect(() => {
    if (!editingId) return
    const node = editorRef.current
    if (!node) return
    node.focus()
    node.setSelectionRange(node.value.length, node.value.length)
  }, [editingId])

  const startEdit = (message: ChatMessage) => {
    setEditingId(message.id)
    setDraft(message.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft('')
  }

  const saveEdit = () => {
    const text = draft.trim()
    if (!editingId || !text || !canSend) return
    editMessage(editingId, text)
    cancelEdit()
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
                    <div className="group/msg flex flex-col items-end gap-1">
                      {editingId === message.id ? (
                        <div className="w-full max-w-[86%]">
                          <textarea
                            ref={editorRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape') {
                                /* Cancel the edit only: the panel also closes on
                                   Escape, and losing the chat is not what the
                                   visitor asked for here. */
                                event.preventDefault()
                                event.stopPropagation()
                                cancelEdit()
                                return
                              }
                              /* Enter saves, Shift+Enter adds a line. */
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault()
                                saveEdit()
                              }
                            }}
                            rows={1}
                            maxLength={KIUTBOT.maxMessageLength}
                            aria-label="Edit your message"
                            className="w-full resize-none rounded-[14px] rounded-br-[5px] border border-brand-300 bg-white px-3 py-2 text-[0.8125rem] leading-[1.6] text-ink-900 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/30"
                          />
                          <div className="mt-1.5 flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="inline-flex h-7 items-center rounded-[6px] px-2 text-[0.6875rem] font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-brand-600"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={!draft.trim() || !canSend}
                              className="inline-flex h-7 items-center rounded-[6px] bg-brand-600 px-2.5 text-[0.6875rem] font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Save and resend
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={cn(
                              'max-w-[86%] whitespace-pre-wrap break-words rounded-[14px] rounded-br-[5px] bg-brand-600 px-3 py-2 text-[0.8125rem] leading-[1.6] text-white',
                              message.failed && 'bg-brand-700/80',
                            )}
                            title={messageTime(message.at)}
                          >
                            {message.text}
                          </div>
                          <div className="flex items-center gap-1">
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
                            {canSend ? (
                              <button
                                type="button"
                                onClick={() => startEdit(message)}
                                className={cn(QUIET_ACTION, 'transition-opacity', HOVER_REVEAL)}
                                aria-label="Edit message"
                                title="Edit message"
                              >
                                <Pencil size={11} aria-hidden />
                                Edit
                              </button>
                            ) : null}
                          </div>
                        </>
                      )}
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
                        <KiutbotMessageActions
                          message={message}
                          feedback={feedback[message.id] ?? null}
                          onRate={(value) => rateMessage(message.id, value)}
                        />
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

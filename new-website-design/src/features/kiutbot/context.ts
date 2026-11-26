import { createContext, useContext } from 'react'
import type { ChatSound, SoundPreferences } from './sound'
import type { ChatMessage, ChatPhase, ConnectionState, MessageFeedback, PanelView } from './types'

export type KiutbotContextValue = {
  view: PanelView
  open: () => void
  close: () => void
  minimize: () => void
  expand: () => void
  toggle: () => void

  connection: ConnectionState
  phase: ChatPhase
  messages: ChatMessage[]
  suggestions: string[]
  typing: boolean
  unread: number
  /** True while the backend has the input locked (lock_input_field). */
  inputLocked: boolean

  canSend: boolean
  send: (text: string) => void
  retry: (messageId: string) => void
  /**
   * Replace a sent message's text and regenerate its answer. The answer that
   * belonged to the old text is removed, so the conversation keeps one exchange.
   */
  editMessage: (messageId: string, text: string) => void
  clearSuggestions: () => void

  /** Feedback per assistant message id: one value, toggled by the visitor. */
  feedback: Record<string, MessageFeedback>
  rateMessage: (messageId: string, value: MessageFeedback) => void

  sound: SoundPreferences
  setSound: (key: ChatSound, enabled: boolean) => void

  registering: boolean
  registrationError: string | null
  register: (name: string, contact: string) => void
  savedName: string
}

export const KiutbotContext = createContext<KiutbotContextValue | null>(null)

export function useKiutbot(): KiutbotContextValue {
  const value = useContext(KiutbotContext)
  if (!value) throw new Error('useKiutbot must be used inside <KiutbotProvider>')
  return value
}

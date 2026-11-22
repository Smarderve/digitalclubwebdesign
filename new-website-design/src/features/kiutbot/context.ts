import { createContext, useContext } from 'react'
import type { ChatMessage, ChatPhase, ConnectionState, PanelView } from './types'

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
  clearSuggestions: () => void

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

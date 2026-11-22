export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'offline'

export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatTone = 'neutral' | 'success' | 'error'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  at: number
  /** A user message that the socket reported as failed can be retried. */
  failed?: boolean
  /** Assistant text that is still being streamed in. */
  streaming?: boolean
  tone?: ChatTone
}

export type PanelView = 'closed' | 'open' | 'minimized'

export type ChatPhase = 'onboarding' | 'ready'

export type RegistrationResult = {
  success?: boolean
  client_id?: string
  session_id?: string
  message?: string
  error?: string
}

export type StoredProfile = {
  name: string
  contact: string
  clientId: string
}

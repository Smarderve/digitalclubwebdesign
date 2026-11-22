import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { KIUTBOT } from './config'
import { getChatSessionId } from './session'
import type { RegistrationResult } from './types'

export type ChatbotEvents = {
  onConnect: () => void
  onDisconnect: (reason: string) => void
  onReconnecting: (attempt: number) => void
  onConnectError: (message: string) => void
  /** `message_response`: a complete (non-streamed) answer. */
  onMessage: (payload: unknown) => void
  onStreamStart: () => void
  onStreamChunk: (chunk: string) => void
  onStreamEnd: () => void
  onSuggestions: (items: string[]) => void
  /** `command_execution`: lock_input_field, unlock_input_field, clear_content. */
  onCommand: (command: string) => void
  onRegistration: (result: RegistrationResult) => void
}

/**
 * Thin wrapper around the Socket.IO protocol used by the original KIUTBOT
 * widget. No request shape is invented here: every event name and payload
 * matches `static/chatbot-v1.50/chatbot.js` served by the club's backend.
 */
export class ChatbotClient {
  private socket: Socket | null = null

  connect(events: ChatbotEvents) {
    if (this.socket) return

    const socket = io(KIUTBOT.socketUrl, {
      path: KIUTBOT.socketPath,
      /*
       * WebSocket only, exactly like the original widget. The backend sends no
       * CORS headers for the XHR polling transport, so starting with polling
       * leaves a half-open session that fails its upgrade; a direct WebSocket
       * handshake is accepted from any origin.
       */
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: KIUTBOT.maxReconnectAttempts,
      reconnectionDelay: 1200,
      reconnectionDelayMax: 6000,
      timeout: 20000,
      autoConnect: true,
    })

    this.socket = socket

    socket.on('connect', () => {
      const chatSessionId = getChatSessionId()
      socket.emit('SmartAgent', { id: KIUTBOT.agentKey, ChatSessionId: chatSessionId })
      socket.emit('user_id', chatSessionId)
      events.onConnect()
    })

    socket.on('disconnect', (reason: string) => events.onDisconnect(reason))
    socket.io.on('reconnect_attempt', (attempt: number) => events.onReconnecting(attempt))
    socket.on('connect_error', (error: Error) => events.onConnectError(error.message))

    socket.on('message_response', (payload: unknown) => events.onMessage(payload))
    socket.on('stream_response_start', () => events.onStreamStart())
    socket.on('stream_response_chunk', (chunk: unknown) => events.onStreamChunk(String(chunk ?? '')))
    socket.on('stream_response_end', () => events.onStreamEnd())
    socket.on('registration_response', (result: RegistrationResult) => events.onRegistration(result))
    socket.on('command_execution', (command: unknown) => events.onCommand(String(command ?? '')))
    socket.on('suggestion_list', (items: unknown) => {
      if (Array.isArray(items)) {
        events.onSuggestions(items.filter((item): item is string => typeof item === 'string'))
      }
    })
  }

  get connected(): boolean {
    return this.socket?.connected ?? false
  }

  send(message: string, clientId: string | null, onError: (message: string) => void) {
    if (!this.socket) return
    this.socket.emit(
      'Intergrated_web_chat',
      {
        id: KIUTBOT.agentKey,
        message,
        ChatSessionId: getChatSessionId(),
        client_id: clientId,
      },
      (ack: { error?: string } | undefined) => {
        if (ack && ack.error) onError(String(ack.error))
      },
    )
  }

  register(name: string, contact: string) {
    if (!this.socket) return
    this.socket.emit('register_client', {
      agent_key: KIUTBOT.agentKey,
      name,
      contact,
      ChatSessionId: getChatSessionId(),
      is_anonymous: false,
    })
  }

  disconnect() {
    this.socket?.removeAllListeners()
    this.socket?.disconnect()
    this.socket = null
  }
}

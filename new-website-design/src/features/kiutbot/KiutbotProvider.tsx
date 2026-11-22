import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChatbotClient } from './chatbotApi'
import type { ChatbotEvents } from './chatbotApi'
import { KIUTBOT } from './config'
import { KiutbotContext } from './context'
import type { KiutbotContextValue } from './context'
import {
  clearStoredClientId,
  getStoredClientId,
  getStoredProfile,
  saveClientId,
  saveProfile,
} from './session'
import {
  isEmptyReply,
  isConnectionNotice,
  isRegistrationPrompt,
  normalizeServerText,
} from './text'
import type {
  ChatMessage,
  ChatPhase,
  ChatTone,
  ConnectionState,
  PanelView,
  RegistrationResult,
} from './types'

const uid = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

const EMPTY_REPLY_NOTICE =
  "KIUTBOT didn't return an answer for that. Try rephrasing your question, or contact the club directly."

export function KiutbotProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<PanelView>('closed')
  const [connection, setConnection] = useState<ConnectionState>('idle')
  const [phase, setPhase] = useState<ChatPhase>(() => (getStoredClientId() ? 'ready' : 'onboarding'))
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [typing, setTyping] = useState(false)
  const [inputLocked, setInputLocked] = useState(false)
  const [unread, setUnread] = useState(0)
  const [registering, setRegistering] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [savedName, setSavedName] = useState(() => getStoredProfile()?.name ?? '')

  const clientRef = useRef<ChatbotClient | null>(null)
  const clientIdRef = useRef<string | null>(getStoredClientId())
  const viewRef = useRef<PanelView>('closed')
  const phaseRef = useRef<ChatPhase>(phase)
  const messagesRef = useRef<ChatMessage[]>([])
  const streamIdRef = useRef<string | null>(null)
  const streamTextRef = useRef('')
  const responseTimerRef = useRef<number | null>(null)
  const registrationTimerRef = useRef<number | null>(null)
  const pendingProfileRef = useRef<{ name: string; contact: string } | null>(null)

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const clearResponseTimer = useCallback(() => {
    if (responseTimerRef.current !== null) {
      window.clearTimeout(responseTimerRef.current)
      responseTimerRef.current = null
    }
  }, [])

  const stopTyping = useCallback(() => {
    clearResponseTimer()
    setTyping(false)
  }, [clearResponseTimer])

  const append = useCallback((message: Omit<ChatMessage, 'id' | 'at'> & { id?: string; at?: number }) => {
    const next: ChatMessage = {
      id: message.id ?? uid(),
      role: message.role,
      text: message.text,
      at: message.at ?? Date.now(),
      failed: message.failed,
      streaming: message.streaming,
      tone: message.tone,
    }
    setMessages((prev) => [...prev, next])
    if (message.role !== 'user' && viewRef.current !== 'open' && message.streaming !== true) {
      setUnread((count) => count + 1)
    }
  }, [])

  const appendNotice = useCallback(
    (text: string, tone: ChatTone = 'neutral') => {
      append({ role: 'system', text, tone })
    },
    [append],
  )

  const startResponseTimer = useCallback(() => {
    clearResponseTimer()
    responseTimerRef.current = window.setTimeout(() => {
      setTyping(false)
      setMessages((prev) =>
        prev.map((message) =>
          message.role === 'user' && !message.failed ? { ...message, failed: true } : message,
        ),
      )
      appendNotice('KIUTBOT is not responding right now. Check your connection, then retry your message.', 'error')
      responseTimerRef.current = null
    }, KIUTBOT.responseTimeoutMs)
  }, [appendNotice, clearResponseTimer])

  const handleServerText = useCallback(
    (raw: unknown) => {
      const text = normalizeServerText(raw)
      if (!text) return

      if (isConnectionNotice(text)) {
        setConnection('connected')
        return
      }

      if (isRegistrationPrompt(text)) {
        /* The backend refuses service until a client is registered. If a stored
           client id was rejected, fall back to conversational onboarding. */
        if (phaseRef.current === 'ready') {
          clearStoredClientId()
          clientIdRef.current = null
          setPhase('onboarding')
        }
        return
      }

      stopTyping()

      if (isEmptyReply(text)) {
        appendNotice(EMPTY_REPLY_NOTICE, 'neutral')
        return
      }

      append({ role: 'assistant', text })
    },
    [append, appendNotice, stopTyping],
  )

  const handleRegistration = useCallback(
    (result: RegistrationResult) => {
      if (registrationTimerRef.current !== null) {
        window.clearTimeout(registrationTimerRef.current)
        registrationTimerRef.current = null
      }

      const clientId = result?.client_id
      if (result?.success && clientId) {
        const profile = pendingProfileRef.current
        clientIdRef.current = clientId
        saveClientId(clientId)
        if (profile) {
          saveProfile({ ...profile, clientId })
          setSavedName(profile.name)
        }
        setRegistering(false)
        setRegistrationError(null)
        setInputLocked(false)
        setPhase('ready')
        appendNotice(
          profile?.name
            ? `You're registered as ${profile.name}. Ask KIUTBOT anything about the club.`
            : "You're registered. Ask KIUTBOT anything about the club.",
          'success',
        )
        return
      }

      setRegistering(false)
      setRegistrationError(
        result?.message || result?.error || 'Registration was not accepted. Check your details and try again.',
      )
    },
    [appendNotice],
  )

  const connect = useCallback(() => {
    if (clientRef.current) return
    setConnection((current) => (current === 'connected' ? current : 'connecting'))

    const events: ChatbotEvents = {
      onConnect: () => setConnection('connected'),
      onDisconnect: () => {
        setConnection('reconnecting')
        stopTyping()
      },
      onReconnecting: () => setConnection('reconnecting'),
      onConnectError: () => setConnection('offline'),
      onMessage: handleServerText,
      onStreamStart: () => {
        stopTyping()
        const id = uid()
        streamIdRef.current = id
        streamTextRef.current = ''
        setMessages((prev) => [...prev, { id, role: 'assistant', text: '', at: Date.now(), streaming: true }])
      },
      onStreamChunk: (chunk) => {
        const id = streamIdRef.current
        if (!id) return
        streamTextRef.current += chunk
        setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, text: message.text + chunk } : message)))
      },
      onStreamEnd: () => {
        const id = streamIdRef.current
        const text = normalizeServerText(streamTextRef.current)
        streamIdRef.current = null
        streamTextRef.current = ''
        if (!id) return
        if (!text || isEmptyReply(text)) {
          setMessages((prev) => prev.filter((message) => message.id !== id))
          appendNotice(EMPTY_REPLY_NOTICE, 'neutral')
          return
        }
        setMessages((prev) =>
          prev.map((message) => (message.id === id ? { ...message, text, streaming: false } : message)),
        )
        if (viewRef.current !== 'open') setUnread((count) => count + 1)
      },
      onSuggestions: (items) => setSuggestions(items.slice(0, 3)),
      onCommand: (command) => {
        if (command === 'clear_content') {
          setMessages([])
          setSuggestions([])
          return
        }
        if (command === 'lock_input_field') {
          /* Only honour the lock once onboarding has completed; the backend
             sends it on connect for the registration step we render ourselves. */
          if (phaseRef.current === 'ready') setInputLocked(true)
          return
        }
        if (command === 'unlock_input_field') setInputLocked(false)
      },
      onRegistration: handleRegistration,
    }

    const client = new ChatbotClient()
    client.connect(events)
    clientRef.current = client
  }, [appendNotice, handleRegistration, handleServerText, stopTyping])

  useEffect(() => {
    return () => {
      clearResponseTimer()
      if (registrationTimerRef.current !== null) window.clearTimeout(registrationTimerRef.current)
      clientRef.current?.disconnect()
      clientRef.current = null
    }
  }, [clearResponseTimer])

  const open = useCallback(() => {
    setView('open')
    setUnread(0)
    connect()
  }, [connect])

  const close = useCallback(() => setView('closed'), [])
  const minimize = useCallback(() => setView('minimized'), [])
  const expand = useCallback(() => {
    setView('open')
    setUnread(0)
  }, [])

  const toggle = useCallback(() => {
    setView((current) => {
      if (current === 'open') return 'closed'
      setUnread(0)
      connect()
      return 'open'
    })
  }, [connect])

  const canSend = phase === 'ready' && connection === 'connected' && !inputLocked && !registering

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim().slice(0, KIUTBOT.maxMessageLength)
      if (!text) return
      if (phaseRef.current !== 'ready') return
      if (!clientRef.current?.connected) {
        appendNotice('KIUTBOT is offline. Reconnecting — please try again in a moment.', 'error')
        return
      }

      const id = uid()
      setMessages((prev) => [...prev, { id, role: 'user', text, at: Date.now() }])
      setSuggestions([])
      setTyping(true)
      startResponseTimer()

      clientRef.current.send(text, clientIdRef.current, (error) => {
        stopTyping()
        setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, failed: true } : message)))
        appendNotice(`Message not delivered: ${error}`, 'error')
      })
    },
    [appendNotice, startResponseTimer, stopTyping],
  )

  const retry = useCallback(
    (messageId: string) => {
      const target = messagesRef.current.find((message) => message.id === messageId)
      if (!target) return
      setMessages((prev) => prev.filter((message) => message.id !== messageId))
      send(target.text)
    },
    [send],
  )

  const register = useCallback(
    (name: string, contact: string) => {
      if (!clientRef.current?.connected) {
        setRegistrationError('The chat service is not connected yet. Please wait a moment and try again.')
        return
      }
      pendingProfileRef.current = { name: name.trim(), contact: contact.trim() }
      setRegistering(true)
      setRegistrationError(null)
      clientRef.current.register(name.trim(), contact.trim())

      if (registrationTimerRef.current !== null) window.clearTimeout(registrationTimerRef.current)
      registrationTimerRef.current = window.setTimeout(() => {
        setRegistering(false)
        setRegistrationError('The chat service did not confirm your registration. Please try again.')
        registrationTimerRef.current = null
      }, KIUTBOT.registrationTimeoutMs)
    },
    [],
  )

  const clearSuggestions = useCallback(() => setSuggestions([]), [])

  const value = useMemo<KiutbotContextValue>(
    () => ({
      view,
      open,
      close,
      minimize,
      expand,
      toggle,
      connection,
      phase,
      messages,
      suggestions,
      typing,
      unread,
      inputLocked,
      canSend,
      send,
      retry,
      clearSuggestions,
      registering,
      registrationError,
      register,
      savedName,
    }),
    [
      view,
      open,
      close,
      minimize,
      expand,
      toggle,
      connection,
      phase,
      messages,
      suggestions,
      typing,
      unread,
      inputLocked,
      canSend,
      send,
      retry,
      clearSuggestions,
      registering,
      registrationError,
      register,
      savedName,
    ],
  )

  return <KiutbotContext.Provider value={value}>{children}</KiutbotContext.Provider>
}

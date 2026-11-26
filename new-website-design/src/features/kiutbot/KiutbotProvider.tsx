import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChatbotClient } from './chatbotApi'
import type { ChatbotEvents } from './chatbotApi'
import { KIUTBOT } from './config'
import { KiutbotContext } from './context'
import type { KiutbotContextValue } from './context'
import { playChatSound, primeChatAudio, readSoundPreferences, saveSoundPreferences } from './sound'
import type { ChatSound, SoundPreferences } from './sound'
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
  MessageFeedback,
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
  const [feedback, setFeedback] = useState<Record<string, MessageFeedback>>({})
  const [sound, setSoundState] = useState<SoundPreferences>(() => readSoundPreferences())
  const soundRef = useRef<SoundPreferences>(sound)
  /** Pending outgoing-tone timers, keyed by message id, so a failure cancels one. */
  const outgoingTimersRef = useRef<Map<string, number>>(new Map())

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

  useEffect(() => {
    soundRef.current = sound
  }, [sound])

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
      /* One tone per complete answer: never for a notice or a refused reply. */
      playChatSound('incoming', soundRef.current.incoming)
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
        /* The streamed answer is complete now, so this is the one moment the
           incoming tone plays — not for each chunk. */
        playChatSound('incoming', soundRef.current.incoming)
      },
      onSuggestions: (items) => setSuggestions(items.slice(0, 3)),
      onCommand: (command) => {
        if (command === 'clear_content') {
          setMessages([])
          setSuggestions([])
          setFeedback({})
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
      for (const timer of outgoingTimersRef.current.values()) window.clearTimeout(timer)
      outgoingTimersRef.current.clear()
      clientRef.current?.disconnect()
      clientRef.current = null
    }
  }, [clearResponseTimer])

  const open = useCallback(() => {
    setView('open')
    setUnread(0)
    primeChatAudio()
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
      primeChatAudio()
      connect()
      return 'open'
    })
  }, [connect])

  const canSend = phase === 'ready' && connection === 'connected' && !inputLocked && !registering

  /**
   * Send an existing user message. The message is already in state, which is what
   * lets an edit keep its place in the conversation instead of appending a copy.
   */
  const dispatch = useCallback(
    (id: string, text: string) => {
      const client = clientRef.current
      if (!client?.connected) {
        appendNotice('KIUTBOT is offline. Reconnecting — please try again in a moment.', 'error')
        return
      }

      setSuggestions([])
      setTyping(true)
      startResponseTimer()
      /* Sending is a gesture, so this is where the audio context may start. */
      primeChatAudio()

      /* The sent tone is scheduled a beat later: a delivery failure reported in
         that window cancels it, so a failed send stays silent. */
      const timer = window.setTimeout(() => {
        outgoingTimersRef.current.delete(id)
        const failed = messagesRef.current.some((message) => message.id === id && message.failed)
        if (!failed) playChatSound('outgoing', soundRef.current.outgoing)
      }, 160)
      outgoingTimersRef.current.set(id, timer)

      client.send(text, clientIdRef.current, (error) => {
        const pending = outgoingTimersRef.current.get(id)
        if (pending !== undefined) {
          window.clearTimeout(pending)
          outgoingTimersRef.current.delete(id)
        }
        stopTyping()
        setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, failed: true } : message)))
        appendNotice(`Message not delivered: ${error}`, 'error')
      })
    },
    [appendNotice, startResponseTimer, stopTyping],
  )

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
      dispatch(id, text)
    },
    [appendNotice, dispatch],
  )

  /**
   * Edit a sent message and regenerate its answer. The exchange — the message
   * plus every non-user message that directly follows it — is replaced, so the
   * old answer disappears instead of sitting above a new one. Everything before
   * and after that span is left exactly as it was.
   */
  const editMessage = useCallback(
    (messageId: string, raw: string) => {
      const text = raw.trim().slice(0, KIUTBOT.maxMessageLength)
      if (!text) return
      if (phaseRef.current !== 'ready') return
      if (!clientRef.current?.connected) {
        appendNotice('KIUTBOT is offline. Reconnecting — please try again in a moment.', 'error')
        return
      }

      const list = messagesRef.current
      const index = list.findIndex((message) => message.id === messageId)
      if (index === -1 || list[index].role !== 'user') return
      if (list[index].text === text) return

      let end = index + 1
      while (end < list.length && list[end].role !== 'user') end += 1

      const next = [
        ...list.slice(0, index),
        { ...list[index], text, at: Date.now(), failed: false },
        ...list.slice(end),
      ]
      messagesRef.current = next
      setMessages(next)

      /* Feedback that belonged to the replaced answer no longer refers to
         anything on screen. */
      const liveIds = new Set(next.map((message) => message.id))
      setFeedback((previous) => {
        const kept: Record<string, MessageFeedback> = {}
        for (const [key, value] of Object.entries(previous)) {
          if (liveIds.has(key)) kept[key] = value
        }
        return kept
      })

      dispatch(messageId, text)
    },
    [appendNotice, dispatch],
  )

  /** One feedback value per answer: the same choice again clears it. */
  const rateMessage = useCallback((messageId: string, value: MessageFeedback) => {
    setFeedback((previous) => {
      if (previous[messageId] === value) {
        const next = { ...previous }
        delete next[messageId]
        return next
      }
      return { ...previous, [messageId]: value }
    })
  }, [])

  const setSound = useCallback((key: ChatSound, enabled: boolean) => {
    setSoundState((previous) => {
      if (previous[key] === enabled) return previous
      const next = { ...previous, [key]: enabled }
      saveSoundPreferences(next)
      return next
    })
  }, [])

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
        setRegistrationError('The assistant is unavailable right now. Please try again in a moment.')
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
      editMessage,
      clearSuggestions,
      feedback,
      rateMessage,
      sound,
      setSound,
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
      editMessage,
      clearSuggestions,
      feedback,
      rateMessage,
      sound,
      setSound,
      registering,
      registrationError,
      register,
      savedName,
    ],
  )

  return <KiutbotContext.Provider value={value}>{children}</KiutbotContext.Provider>
}

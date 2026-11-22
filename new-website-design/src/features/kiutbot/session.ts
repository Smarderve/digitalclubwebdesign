import { KIUTBOT } from './config'
import type { StoredProfile } from './types'

/*
 * Session storage mirrors the original widget exactly:
 *   ChatSessionId-<agentKey>  -> "<10 digit random>-<agentKey>"
 *   client_id_<agentKey>      -> id returned by the register_client ack
 *   kiutbot_profile           -> the name/contact the visitor submitted
 *
 * Everything is wrapped because storage can throw in private mode.
 */
const chatSessionKey = () => `ChatSessionId-${KIUTBOT.agentKey}`
const clientIdKey = () => `client_id_${KIUTBOT.agentKey}`
const PROFILE_KEY = 'kiutbot_profile'

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* storage unavailable, session stays in memory */
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Same shape the original widget generated: 10 digits, dash, agent key. */
function generateSessionId(): string {
  let digits = String(Math.floor(Math.random() * 1_000_000_000_000))
  while (digits.length < 10) digits = `0${digits}`
  return `${digits}-${KIUTBOT.agentKey}`
}

export function getChatSessionId(): string {
  const existing = read(chatSessionKey())
  if (existing && existing.endsWith(`-${KIUTBOT.agentKey}`)) return existing
  const created = generateSessionId()
  write(chatSessionKey(), created)
  return created
}

export function getStoredClientId(): string | null {
  return read(clientIdKey())
}

export function saveClientId(clientId: string) {
  write(clientIdKey(), clientId)
}

export function clearStoredClientId() {
  remove(clientIdKey())
}

export function saveProfile(profile: StoredProfile) {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    /* ignore */
  }
}

export function getStoredProfile(): StoredProfile | null {
  const raw = read(PROFILE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<StoredProfile>
    if (typeof parsed.name === 'string' && typeof parsed.contact === 'string') {
      return { name: parsed.name, contact: parsed.contact, clientId: parsed.clientId ?? '' }
    }
    return null
  } catch {
    return null
  }
}

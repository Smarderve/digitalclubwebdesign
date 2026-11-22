const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[1-9]\d{0,15}$/

/**
 * Normalise a backend answer: the service returns HTML fragments
 * (`<br>`, `<div>`, `<strong>`), so they are flattened to plain text before
 * rendering. Rendering raw backend HTML would be an XSS path.
 */
export function normalizeServerText(raw: unknown): string {
  if (typeof raw !== 'string') return String(raw ?? '')
  return raw
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*div\s*>/gi, '\n')
    .replace(/<\s*div[^>]*>/gi, '')
    .replace(/<\s*\/\s*p\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** The backend greets every socket with this text; it belongs in the header, not a bubble. */
export const isConnectionNotice = (text: string) => /you are connected/i.test(text)

/** The backend's own onboarding form; the redesigned conversational flow replaces it. */
export const isRegistrationPrompt = (text: string) =>
  /contact_details|share your name and contact info|fill out the form above/i.test(text)

/** Some responses arrive as the literal string "None" when the agent has no answer. */
export const isEmptyReply = (text: string) => /^(none|null|undefined|n\/a)$/i.test(text.trim())

/** Same accepted formats as the original widget. */
export function isValidContact(value: string): boolean {
  const contact = value.trim()
  if (!contact) return false
  return EMAIL_PATTERN.test(contact) || PHONE_PATTERN.test(contact.replace(/[\s\-()]/g, ''))
}

export function looksLikeEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function messageTime(at: number): string {
  try {
    return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

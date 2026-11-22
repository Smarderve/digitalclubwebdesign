/*
 * KIUTBOT integration settings.
 *
 * These values come from the chat widget that shipped with the original
 * KIUT Digital Club site (`current-website/DIgital-Club/app/templates/base.html`):
 *   1. a Socket.IO widget at https://fightforme.hudumabot.com/v1/chatbot/widget/socket/<agentKey>
 *   2. which connects to the same origin's Socket.IO server on /socket.io
 *   3. with the public widget key `Uwv2sj5hpR`.
 *
 * They can be overridden per environment without touching component code.
 */
export const KIUTBOT = {
  agentKey: import.meta.env.VITE_KIUTBOT_AGENT_KEY ?? 'Uwv2sj5hpR',
  socketUrl: import.meta.env.VITE_KIUTBOT_SOCKET_URL ?? 'https://fightforme.hudumabot.com',
  socketPath: '/socket.io',
  /** Matches the original widget's MAX_MESSAGE_LENGTH. */
  maxMessageLength: 1000,
  maxReconnectAttempts: 5,
  /** How long to wait for any answer before telling the user it failed. */
  responseTimeoutMs: 60000,
  registrationTimeoutMs: 15000,
} as const

/**
 * Starter prompts for the empty conversation. These mirror the follow-up
 * questions the backend itself suggests, and map to real club pages.
 */
export const KIUTBOT_STARTER_PROMPTS = [
  'How do I join the club?',
  'What activities does the club run?',
  'How can I contact the club?',
] as const

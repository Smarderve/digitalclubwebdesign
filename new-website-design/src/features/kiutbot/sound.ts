/*
 * Chat interaction sounds for KIUTBOT.
 *
 * These are original, synthesised message tones built with the Web Audio API —
 * no proprietary audio files are bundled or copied. Each sound is two short
 * sine/triangle notes, the way a messaging app signals a bubble leaving or
 * arriving:
 *
 *   outgoing — a light rising "pop" when a message is accepted
 *   incoming — a gentle two-note "ding" when the complete answer is shown
 *
 * Deliberately not notification chimes: both are short (~150 ms), quiet and
 * band-limited, and the incoming sound plays once per complete answer, never
 * per streamed chunk.
 */

export type ChatSound = 'outgoing' | 'incoming'

export type SoundPreferences = {
  outgoing: boolean
  incoming: boolean
}

export const DEFAULT_SOUND_PREFERENCES: SoundPreferences = {
  outgoing: true,
  incoming: true,
}

const STORAGE_KEY = 'kiutbot-sounds-v1'
/** Two sounds of the same kind closer than this would overlap into noise. */
const MIN_GAP_MS = 160

export function readSoundPreferences(): SoundPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SOUND_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<SoundPreferences>
    return {
      outgoing: parsed.outgoing !== false,
      incoming: parsed.incoming !== false,
    }
  } catch {
    return DEFAULT_SOUND_PREFERENCES
  }
}

export function saveSoundPreferences(next: SoundPreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable: the choice still applies for this session */
  }
}

let context: AudioContext | null = null
const voices = new Map<ChatSound, AudioScheduledSourceNode[]>()
const lastPlayedAt = new Map<ChatSound, number>()

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (context) return context
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    context = new Ctor()
  } catch {
    context = null
  }
  return context
}

/**
 * Start (or resume) the audio context from a user gesture. Browsers block audio
 * until the visitor has interacted with the page, so this is called when the
 * panel opens and before each send — never on page load.
 */
export function primeChatAudio() {
  const ctx = audioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {
      /* the browser refused; the next gesture can try again */
    })
  }
}

type Note = {
  frequency: number
  /** Seconds after the sound starts. */
  at: number
  duration: number
  peak: number
  type: OscillatorType
  /** Frequency reached at the end of the note (a small glide). */
  glideTo?: number
}

function playNote(ctx: AudioContext, note: Note): AudioScheduledSourceNode {
  const start = ctx.currentTime + note.at
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = note.type
  oscillator.frequency.setValueAtTime(note.frequency, start)
  if (note.glideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(note.glideTo, start + note.duration * 0.72)
  }

  /* Soft attack and exponential release: a bubble, not a beep. */
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(note.peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + note.duration + 0.03)
  return oscillator
}

const SOUNDS: Record<ChatSound, Note[]> = {
  /* Sent: one short note rising a fifth, like a bubble snapping into place. */
  outgoing: [
    { frequency: 660, at: 0, duration: 0.11, peak: 0.1, type: 'sine', glideTo: 990 },
    { frequency: 1320, at: 0.004, duration: 0.07, peak: 0.028, type: 'sine' },
  ],
  /* Received: two soft notes a fourth apart, the familiar "reply" ding. */
  incoming: [
    { frequency: 784, at: 0, duration: 0.14, peak: 0.075, type: 'triangle' },
    { frequency: 1046, at: 0.09, duration: 0.19, peak: 0.06, type: 'triangle' },
  ],
}

/**
 * Play one chat sound. Returns false when nothing was played (disabled, audio
 * unavailable, not unlocked by a gesture, or too soon after the previous one).
 */
export function playChatSound(key: ChatSound, enabled: boolean): boolean {
  if (!enabled) return false
  const ctx = audioContext()
  if (!ctx || ctx.state !== 'running') return false

  const now = performance.now()
  const last = lastPlayedAt.get(key) ?? 0
  if (now - last < MIN_GAP_MS) return false
  lastPlayedAt.set(key, now)

  /* Cut the previous instance of the same sound instead of layering them. */
  for (const voice of voices.get(key) ?? []) {
    try {
      voice.stop()
    } catch {
      /* already finished */
    }
  }

  voices.set(
    key,
    SOUNDS[key].map((note) => playNote(ctx, note)),
  )
  return true
}

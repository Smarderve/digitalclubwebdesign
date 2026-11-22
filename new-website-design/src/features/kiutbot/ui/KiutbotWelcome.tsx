import { useKiutbot } from '../context'
import { KIUTBOT_STARTER_PROMPTS } from '../config'

/**
 * Empty-state greeting. Compact text plus suggestion chips — no card grid.
 * Suggestions come from the backend's `suggestion_list` once available, so the
 * chips always reflect questions the assistant actually offers.
 */
export function KiutbotWelcome() {
  const { suggestions, send, canSend } = useKiutbot()
  const prompts = suggestions.length ? suggestions : [...KIUTBOT_STARTER_PROMPTS]

  return (
    <div className="kb-msg-in space-y-3">
      <div className="max-w-[92%] rounded-[14px] rounded-bl-[5px] border border-line bg-white px-3 py-2.5 text-[0.8125rem] leading-[1.6] text-ink-800">
        Hi! Welcome to KIUT Digital Club. What would you like to know?
      </div>

      <div className="space-y-1.5">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={!canSend}
            onClick={() => send(prompt)}
            className="flex w-full items-start gap-2 rounded-md border border-line bg-white/70 px-2.5 py-2 text-left text-[0.75rem] leading-5 text-ink-700 transition-colors hover:border-brand-200 hover:bg-white hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

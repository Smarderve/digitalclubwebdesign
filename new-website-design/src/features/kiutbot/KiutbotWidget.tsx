import { useRef } from 'react'
import { KiutbotLauncher } from './ui/KiutbotLauncher'
import { KiutbotPanel } from './ui/KiutbotPanel'

/**
 * One shared conversation state, one launcher, one responsive panel.
 * Must be rendered inside <KiutbotProvider>.
 */
export function KiutbotWidget() {
  const launcherRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <KiutbotLauncher ref={launcherRef} />
      <KiutbotPanel launcherRef={launcherRef} />
    </>
  )
}

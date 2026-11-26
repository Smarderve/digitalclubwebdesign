import type { ReactNode } from 'react'

/**
 * Retained for call sites that still render a data note. The application no
 * longer presents itself as a prototype, so these render nothing.
 */
export function DemoBadge() {
  return null
}

export function DemoNotice(_props: { children?: ReactNode }) {
  return null
}

import { useEffect, useRef, useState } from 'react'
import { ApiError } from './api'

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Read one public resource and keep the page's loading / empty / error states
 * honest. There is no fallback content: a failed request shows the message the
 * server returned, never a demo record.
 */
export function usePublicData<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let active = true
    setState({ data: null, loading: true, error: null })
    loaderRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!active) return
        const message =
          error instanceof ApiError
            ? error.message
            : 'The club content could not be loaded. Please try again.'
        setState({ data: null, loading: false, error: message })
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from './api'

export type MemberAsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Read one member resource and keep loading / empty / error honest.
 *
 * A failed request shows the message the server returned; it never falls back
 * to sample records. `reload` refetches after a successful write and `setData`
 * applies the record the write returned so the page updates without a flash.
 */
export function useMemberData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<MemberAsyncState<T>>({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, loading: true, error: null }))
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
            : 'Your club records could not be loaded. Check your connection and try again.'
        setState({ data: null, loading: false, error: message })
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])
  const setData = useCallback((data: T) => setState({ data, loading: false, error: null }), [])

  return { ...state, reload, setData }
}

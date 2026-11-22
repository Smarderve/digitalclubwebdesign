import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getState, subscribe, syncFromStorage, viewerFromUser } from './store'

/** Subscribes a component to the social store. */
export function useSocial() {
  return useSyncExternalStore(subscribe, getState, getState)
}

/** The signed-in member's username, or null for visitors. */
export function useViewer() {
  const { user } = useAuth()
  return viewerFromUser(user)
}

/** Keeps two open tabs of the prototype consistent. */
export function useSocialSync() {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'kiut-social-v1') syncFromStorage()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
}

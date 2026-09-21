'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Skip inside the native APK wrapper: Capacitor serves bundled files from
    // its own local server and there is no server-side push to receive.
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    try {
      if (cap?.isNativePlatform?.()) return
    } catch {
      // fall through to normal registration
    }
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.warn('[JharBhoomi] service worker registration failed', error)
      })
  }, [])

  return null
}

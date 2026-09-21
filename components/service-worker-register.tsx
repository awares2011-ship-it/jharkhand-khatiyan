'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.warn('[JharBhoomi] service worker registration failed', error)
      })
  }, [])

  return null
}

'use client'

// Mounts once at the app root. Handles the full ad lifecycle:
//   • On first mount (cold start) → initialize + show App Open ad + banner
//   • When the page becomes hidden/visible, re-arm the App Open on return
//   • Exposes nothing visible on web — on the APK it manages native AdMob UI
import { useEffect } from 'react'
import { initAdMob, maybeShowAppOpen, showBottomBanner } from '@/lib/admob'

export function AdManager() {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const ok = await initAdMob()
      if (!ok || cancelled) return
      // App open on cold start — showBottomBanner also safe to call: the
      // helper no-ops when the plugin isn't present (web / dev).
      await maybeShowAppOpen()
      await showBottomBanner()
    })()

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        // Treat a resume (user swiping back into the app) as a fresh moment
        // where an App Open ad is appropriate — guarded by its own cool-down.
        maybeShowAppOpen().catch(() => undefined)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return null
}

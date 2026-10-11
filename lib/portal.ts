'use client'

// Portal access, two modes:
//
// 1) silentPrefetchPortal(url)
//    "Background only" — loads the gov portal inside a hidden iframe pinned
//    off-screen. The user never sees the government UI; the app stays in the
//    foreground. We use this for "warm up" / "sync" effects when the user
//    saves a record. Nothing is scraped (gov sites send X-Frame-Options so
//    the iframe body is usually blocked anyway) — it's a background touch
//    for freshness-of-source signaling, not a scraper. Fire-and-forget.
//
// 2) tryOpenNativeBrowser(url)
//    The old explicit "open in Chrome Custom Tab" path. Kept for an opt-in
//    "आधिकारिक पोर्टल" link only — never the default now. On the APK it
//    opens a Chrome Custom Tab; on the web it falls back to window.open.
export async function tryOpenNativeBrowser(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return false
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url, presentationStyle: 'popover' })
    return true
  } catch {
    return false
  }
}

export async function openOfficialPortal(url: string): Promise<void> {
  if (typeof window === 'undefined') return
  const native = await tryOpenNativeBrowser(url)
  if (!native) window.open(url, '_blank', 'noopener,noreferrer')
}

const PREFETCH_ID = 'jbi-portal-prefetch'
let prefetchTimer: number | null = null

/**
 * Load the gov portal invisibly in a hidden iframe. Even when the gov site
 * blocks framing, the request still fires (DNS, TLS, caching warms), which is
 * the "background sync" effect the user feels. Nothing shows on screen.
 *
 * Returns a Promise that resolves after the iframe either loads or ~4s
 * timeout — the caller can use it to show a short "sync" indicator.
 */
export function silentPrefetchPortal(url: string): Promise<void> {
  if (typeof window === 'undefined' || !url.startsWith('http')) return Promise.resolve()
  return new Promise((resolve) => {
    try {
      let frame = document.getElementById(PREFETCH_ID) as HTMLIFrameElement | null
      if (!frame) {
        frame = document.createElement('iframe')
        frame.id = PREFETCH_ID
        frame.setAttribute('aria-hidden', 'true')
        frame.setAttribute('tabindex', '-1')
        frame.style.cssText =
          'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;border:0;'
        // sandbox so the iframe can't navigate the host or steal focus
        frame.setAttribute('sandbox', 'allow-same-origin allow-scripts')
        frame.setAttribute('referrerpolicy', 'no-referrer')
        document.body.appendChild(frame)
      }
      if (prefetchTimer !== null) window.clearTimeout(prefetchTimer)
      const done = () => {
        if (prefetchTimer !== null) {
          window.clearTimeout(prefetchTimer)
          prefetchTimer = null
        }
        resolve()
      }
      frame.onload = done
      frame.onerror = done
      frame.src = url
      prefetchTimer = window.setTimeout(done, 4000)
    } catch {
      resolve()
    }
  })
}

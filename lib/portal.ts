'use client'

// Opens an official government-portal link. On Android (the Capacitor/APK
// build) this uses the Capacitor Browser plugin, which opens a Chrome Custom
// Tab — a real, separate browser process layered inside the app's UI. That
// matters because most .gov.in sites send X-Frame-Options/CSP headers that
// block iframes outright, so an <iframe>-based "in-app webview" would just
// show a blank or broken frame for them. A Custom Tab has no such
// restriction: it is not a frame, so framing headers don't apply to it, and
// the user still never has to leave the app (Android's back gesture returns
// them straight to JharBhoomi Info).
//
// Outside Capacitor (the regular web/PWA build, or a desktop browser) there
// is no native browser API to reach for, so the caller falls back to the
// iframe-based InAppWebView component, which still works for sites that do
// allow framing and degrades gracefully (with an "open in browser" link) for
// the ones that don't.
export async function tryOpenNativeBrowser(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return false
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url, presentationStyle: 'popover' })
    return true
  } catch {
    // @capacitor/browser not installed yet, or the native call failed for
    // some other reason — fall back to the in-app iframe view instead of
    // failing the tap outright.
    return false
  }
}

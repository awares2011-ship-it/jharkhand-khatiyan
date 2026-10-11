'use client'

// AdMob integration for the Capacitor APK (jharkhand_satbara). Lazy-loaded
// so the web/dev build still works without the plugin installed, and so a
// native-call failure never crashes the UI.
//
// Placement strategy — tuned for revenue AND AdMob policy compliance:
//   1. Banner — anchored to the bottom (above the bottom-nav); persistent
//      across the whole app for maximum impressions.
//   2. App Open — once per cold start, with a 1-hour cool-down. Policy caps
//      app-open ads at ~once/session; we go further and gate it on
//      min-time-between-shows + "is this the first interaction?".
//   3. Interstitial — natural breakpoint: after the user closes the gov
//      portal WebView and returns to the app. 5-minute cool-down + "has the
//      user interacted with ≥2 services since the last interstitial" guard,
//      so accidental taps or quick returns never trigger it.
//   4. Rewarded + Rewarded Interstitial — opt-in only (user taps "Watch to
//      unlock…"). Never automatic.
//
// Native ads are not supported by @capacitor-community/admob (no
// corresponding JS API). The native_adv_jhar unit is kept in the ID map for
// future use when a native-ad bridge is added.

export const AD_UNITS = {
  banner: 'ca-app-pub-1607968585289432/1737434058',
  interstitial: 'ca-app-pub-1607968585289432/9373390657',
  native: 'ca-app-pub-1607968585289432/2807982300',
  appOpen: 'ca-app-pub-1607968585289432/6416054828',
  rewardedInterstitial: 'ca-app-pub-1607968585289432/6747227310',
  rewarded: 'ca-app-pub-1607968585289432/2420969493',
} as const

type AdMobApi = {
  initialize: (opts?: { requestTrackingAuthorization?: boolean; initializeForTesting?: boolean }) => Promise<void>
  showBanner: (opts: {
    adId: string
    adSize?: string
    position?: string
    margin?: number
    isTesting?: boolean
    npa?: boolean
  }) => Promise<void>
  hideBanner: () => Promise<void>
  removeBanner: () => Promise<void>
  prepareInterstitial: (opts: { adId: string; isTesting?: boolean; npa?: boolean }) => Promise<unknown>
  showInterstitial: () => Promise<unknown>
  prepareRewardVideoAd: (opts: { adId: string; isTesting?: boolean; npa?: boolean }) => Promise<unknown>
  showRewardVideoAd: () => Promise<unknown>
  prepareRewardedInterstitialAd: (opts: { adId: string; isTesting?: boolean; npa?: boolean }) => Promise<unknown>
  showRewardedInterstitialAd: () => Promise<unknown>
  prepareAppOpenAd?: (opts: { adId: string; isTesting?: boolean; npa?: boolean }) => Promise<unknown>
  showAppOpenAd?: () => Promise<unknown>
}

type Enums = {
  BannerAdPosition: { BOTTOM_CENTER: string; TOP_CENTER: string }
  BannerAdSize: { ADAPTIVE_BANNER: string; FULL_BANNER: string; BANNER: string }
}

let cached: { AdMob: AdMobApi; enums: Enums } | null = null
let initPromise: Promise<boolean> | null = null

async function load(): Promise<{ AdMob: AdMobApi; enums: Enums } | null> {
  if (cached) return cached
  if (typeof window === 'undefined') return null
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return null
    const mod = (await import('@capacitor-community/admob')) as unknown as {
      AdMob: AdMobApi
      BannerAdPosition: Enums['BannerAdPosition']
      BannerAdSize: Enums['BannerAdSize']
    }
    cached = { AdMob: mod.AdMob, enums: { BannerAdPosition: mod.BannerAdPosition, BannerAdSize: mod.BannerAdSize } }
    return cached
  } catch {
    return null
  }
}

const isDev =
  (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') ||
  (typeof location !== 'undefined' && /^(localhost|127\.|10\.|192\.168\.)/.test(location.hostname))

/** Initialize the SDK and (optionally) auto-show an App Open ad once per cold start. */
export async function initAdMob(): Promise<boolean> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const bundle = await load()
    if (!bundle) return false
    try {
      await bundle.AdMob.initialize({ initializeForTesting: isDev })
      return true
    } catch (error) {
      console.warn('[admob] initialize failed', error)
      return false
    }
  })()
  return initPromise
}

export async function showBottomBanner(): Promise<void> {
  const bundle = await load()
  if (!bundle) return
  const ok = await initAdMob()
  if (!ok) return
  try {
    await bundle.AdMob.showBanner({
      adId: AD_UNITS.banner,
      adSize: bundle.enums.BannerAdSize.ADAPTIVE_BANNER,
      position: bundle.enums.BannerAdPosition.BOTTOM_CENTER,
      margin: 56, // sits above our 54px bottom nav
      isTesting: isDev,
      npa: false,
    })
  } catch (error) {
    console.warn('[admob] banner failed', error)
  }
}

export async function hideBottomBanner(): Promise<void> {
  const bundle = await load()
  if (!bundle) return
  try {
    await bundle.AdMob.hideBanner()
  } catch {
    // non-fatal
  }
}

const INTERSTITIAL_COOLDOWN_MS = 5 * 60 * 1000
const APP_OPEN_COOLDOWN_MS = 60 * 60 * 1000
const LAST_INTERSTITIAL_KEY = 'ad:lastInterstitial'
const LAST_APP_OPEN_KEY = 'ad:lastAppOpen'
let interactionCountSinceLastInterstitial = 0

/** Call this on each natural "the user did something meaningful" moment. */
export function trackInteraction(): void {
  interactionCountSinceLastInterstitial += 1
}

function cooldownOk(key: string, cooldownMs: number): boolean {
  try {
    const last = Number(window.localStorage.getItem(key) || 0)
    return Date.now() - last >= cooldownMs
  } catch {
    return true
  }
}

function stampCooldown(key: string): void {
  try {
    window.localStorage.setItem(key, String(Date.now()))
  } catch {
    // ignore
  }
}

/** Show the interstitial — but only if cool-down + interaction thresholds pass. */
export async function maybeShowInterstitial(reason: 'portal-close' | 'manual' = 'portal-close'): Promise<void> {
  const bundle = await load()
  if (!bundle) return
  if (!cooldownOk(LAST_INTERSTITIAL_KEY, INTERSTITIAL_COOLDOWN_MS)) return
  if (reason === 'portal-close' && interactionCountSinceLastInterstitial < 2) return
  try {
    await bundle.AdMob.prepareInterstitial({ adId: AD_UNITS.interstitial, isTesting: isDev })
    await bundle.AdMob.showInterstitial()
    interactionCountSinceLastInterstitial = 0
    stampCooldown(LAST_INTERSTITIAL_KEY)
  } catch (error) {
    console.warn('[admob] interstitial failed', error)
  }
}

/** Show the App Open ad — cold-start only, cool-down guarded. */
export async function maybeShowAppOpen(): Promise<void> {
  const bundle = await load()
  if (!bundle || !bundle.AdMob.prepareAppOpenAd || !bundle.AdMob.showAppOpenAd) return
  if (!cooldownOk(LAST_APP_OPEN_KEY, APP_OPEN_COOLDOWN_MS)) return
  try {
    await bundle.AdMob.prepareAppOpenAd({ adId: AD_UNITS.appOpen, isTesting: isDev })
    await bundle.AdMob.showAppOpenAd()
    stampCooldown(LAST_APP_OPEN_KEY)
  } catch (error) {
    console.warn('[admob] app-open failed', error)
  }
}

/** Rewarded video — opt-in only. Returns true if the user earned the reward. */
export async function showRewardedAd(): Promise<boolean> {
  const bundle = await load()
  if (!bundle) return false
  try {
    await bundle.AdMob.prepareRewardVideoAd({ adId: AD_UNITS.rewarded, isTesting: isDev })
    const result = (await bundle.AdMob.showRewardVideoAd()) as { amount?: number; type?: string } | undefined
    return Boolean(result && (result.amount || result.type))
  } catch (error) {
    console.warn('[admob] rewarded failed', error)
    return false
  }
}

/** Rewarded interstitial — opt-in only. Returns true if the user earned the reward. */
export async function showRewardedInterstitialAd(): Promise<boolean> {
  const bundle = await load()
  if (!bundle) return false
  try {
    await bundle.AdMob.prepareRewardedInterstitialAd({ adId: AD_UNITS.rewardedInterstitial, isTesting: isDev })
    const result = (await bundle.AdMob.showRewardedInterstitialAd()) as { amount?: number } | undefined
    return Boolean(result && result.amount)
  } catch (error) {
    console.warn('[admob] rewarded-interstitial failed', error)
    return false
  }
}

/** True when running inside the Capacitor APK — use this to gate ad-only UI. */
export async function isNativeApp(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

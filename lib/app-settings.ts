'use client'

// Tiny settings store backed by localStorage. Everything persists on the
// device only — no account, no server.
export type AppSettings = {
  language: 'hi' | 'en'
  reducedMotion: boolean
  compact: boolean
}

const KEY = 'jbi-settings:v1'
const DEFAULTS: AppSettings = { language: 'hi', reducedMotion: false, compact: false }

export function readSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch {
    return DEFAULTS
  }
}

export function writeSettings(update: Partial<AppSettings>): AppSettings {
  const next = { ...readSettings(), ...update }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore quota errors
  }
  return next
}

/** Removes every cached entry the app itself writes. Does NOT touch native plugin state. */
export function clearAppCaches(): number {
  if (typeof window === 'undefined') return 0
  const prefixes = ['jbi-cache:', 'jbi-records:', 'jbi-history:', 'jbi-last-local-notify-slot', 'jbi-splash-shown', 'ad:']
  let removed = 0
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (!k) continue
      if (prefixes.some((p) => k.startsWith(p))) keys.push(k)
    }
    for (const k of keys) {
      window.localStorage.removeItem(k)
      removed += 1
    }
  } catch {
    // ignore
  }
  return removed
}

export const APP_VERSION = '1.0.0'

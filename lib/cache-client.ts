// Client-safe replacement for lib/file-cache.ts (which uses node:fs and only
// works on a server). Persists the same { data, updatedAt } envelope in
// localStorage so the APK build — which has no server or API routes — keeps
// the live → cache → sample fallback chain working fully offline-capable.
export type CacheEnvelope<T> = { data: T; updatedAt: string }

const PREFIX = 'jbi-cache:v1:'

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

export async function readCache<T>(name: string): Promise<CacheEnvelope<T> | null> {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(PREFIX + name)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEnvelope<T>
    if (!parsed || !('data' in parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export async function writeCache<T>(name: string, data: T): Promise<CacheEnvelope<T>> {
  const envelope: CacheEnvelope<T> = { data, updatedAt: new Date().toISOString() }
  try {
    storage()?.setItem(PREFIX + name, JSON.stringify(envelope))
  } catch {
    // Quota exceeded / private mode — cache is best-effort only.
  }
  return envelope
}

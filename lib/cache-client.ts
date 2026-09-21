// Persists a { data, updatedAt } envelope in localStorage so the live →
// cache → sample fallback chain (lib/mandi.ts, lib/news.ts) still has
// something to show on a repeat visit with no network — this is a static
// export with no server, so there's no file-backed cache to fall back to.
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

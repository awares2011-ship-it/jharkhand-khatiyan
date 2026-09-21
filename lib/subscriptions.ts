// File-backed store for Web Push subscriptions (server-only). Fine for local
// dev / a single Node server; on serverless (Vercel) writes fall back to the
// ephemeral tmp dir — swap for a real DB/KV (Vercel KV, Upstash, Postgres)
// before relying on this for production-scale retention notifications.
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export type StoredSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  subscribedAt: string
}

const PRIMARY = path.join(process.cwd(), 'data', 'subscriptions.json')
const FALLBACK = path.join(os.tmpdir(), 'jharbhoomi-subscriptions.json')

async function readablePath(): Promise<string> {
  try {
    await fs.access(PRIMARY)
    return PRIMARY
  } catch {
    return FALLBACK
  }
}

async function writablePath(): Promise<string> {
  try {
    await fs.mkdir(path.dirname(PRIMARY), { recursive: true })
    return PRIMARY
  } catch {
    return FALLBACK
  }
}

export async function readSubscriptions(): Promise<StoredSubscription[]> {
  try {
    const raw = await fs.readFile(await readablePath(), 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function persist(subs: StoredSubscription[]) {
  try {
    await fs.writeFile(await writablePath(), JSON.stringify(subs, null, 2), 'utf8')
  } catch (error) {
    console.warn('[subscriptions] failed to persist:', (error as Error).message)
  }
}

export async function addSubscription(sub: StoredSubscription): Promise<number> {
  const subs = await readSubscriptions()
  const next = [...subs.filter((s) => s.endpoint !== sub.endpoint), sub]
  await persist(next)
  return next.length
}

export async function removeSubscription(endpoint: string): Promise<number> {
  const subs = await readSubscriptions()
  const next = subs.filter((s) => s.endpoint !== endpoint)
  await persist(next)
  return next.length
}

export async function pruneSubscriptions(deadEndpoints: string[]): Promise<void> {
  if (!deadEndpoints.length) return
  const subs = await readSubscriptions()
  const next = subs.filter((s) => !deadEndpoints.includes(s.endpoint))
  await persist(next)
}

// Tiny JSON file cache used to survive a failed live fetch (rate limit, upstream
// outage, offline dev) and to give the /api/cron/refresh route somewhere to warm
// data into. Works out of the box for local dev and any Node server deployment.
// On read-only serverless filesystems (e.g. Vercel functions) it transparently
// falls back to the OS tmp dir, which is ephemeral per instance — fine for a demo,
// but swap this for Vercel KV / Upstash / a real DB before relying on it in prod.
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const PRIMARY_DIR = path.join(process.cwd(), 'data', 'cache')
const FALLBACK_DIR = path.join(os.tmpdir(), 'jharbhoomi-cache')

export type CacheEnvelope<T> = { data: T; updatedAt: string }

async function firstWritableDir(): Promise<string> {
  for (const dir of [PRIMARY_DIR, FALLBACK_DIR]) {
    try {
      await fs.mkdir(dir, { recursive: true })
      const probe = path.join(dir, '.write-test')
      await fs.writeFile(probe, 'ok')
      await fs.unlink(probe)
      return dir
    } catch {
      continue
    }
  }
  return FALLBACK_DIR
}

export async function readCache<T>(name: string): Promise<CacheEnvelope<T> | null> {
  for (const dir of [PRIMARY_DIR, FALLBACK_DIR]) {
    try {
      const raw = await fs.readFile(path.join(dir, `${name}.json`), 'utf8')
      return JSON.parse(raw) as CacheEnvelope<T>
    } catch {
      continue
    }
  }
  return null
}

export async function writeCache<T>(name: string, data: T): Promise<CacheEnvelope<T>> {
  const envelope: CacheEnvelope<T> = { data, updatedAt: new Date().toISOString() }
  try {
    const dir = await firstWritableDir()
    await fs.writeFile(path.join(dir, `${name}.json`), JSON.stringify(envelope, null, 2), 'utf8')
  } catch (error) {
    console.warn(`[file-cache] could not persist "${name}":`, (error as Error).message)
  }
  return envelope
}

'use client'

import { useCallback, useEffect, useState } from 'react'

export function useLiveData<T>(url: string, intervalMs = 30 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`अनुरोध विफल (${res.status})`)
      const json = (await res.json()) as T
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'अज्ञात त्रुटि')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    load()
    if (!intervalMs) return
    const id = window.setInterval(load, intervalMs)
    return () => window.clearInterval(id)
  }, [load, intervalMs])

  return { data, loading, error, reload: load }
}

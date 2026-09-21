'use client'

import { useCallback, useEffect, useState } from 'react'

export function useLiveData<T>(fetcher: () => Promise<T>, intervalMs = 30 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetcher())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'अज्ञात त्रुटि')
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    load()
    if (!intervalMs) return
    const id = window.setInterval(load, intervalMs)
    return () => window.clearInterval(id)
  }, [load, intervalMs])

  return { data, loading, error, reload: load }
}

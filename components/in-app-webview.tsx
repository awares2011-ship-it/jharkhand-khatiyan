'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Lock, RotateCw, X } from 'lucide-react'

export type WebViewTarget = { title: string; url: string } | null

export function InAppWebView({ target, onClose }: { target: WebViewTarget; onClose: () => void }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'blocked'>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!target) return
    setStatus('loading')
    timeoutRef.current = window.setTimeout(() => {
      setStatus((current) => (current === 'loading' ? 'blocked' : current))
    }, 6000)
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [target, reloadKey])

  useEffect(() => {
    if (!target) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target, onClose])

  if (!target) return null

  let hostname = target.url
  try {
    hostname = new URL(target.url).hostname
  } catch {
    // non-URL target, show as-is
  }

  return (
    <div className="webview-overlay" onClick={onClose} role="presentation">
      <div className="webview-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={target.title}>
        <div className="webview-topbar">
          <button type="button" className="webview-topbar-btn" onClick={onClose} aria-label="बंद करें">
            <X aria-hidden="true" />
          </button>
          <span className="webview-url">
            <Lock aria-hidden="true" />
            <span>{hostname}</span>
          </span>
          <button type="button" className="webview-topbar-btn" onClick={() => setReloadKey((k) => k + 1)} aria-label="रीलोड करें">
            <RotateCw aria-hidden="true" />
          </button>
          <a className="webview-topbar-btn" href={target.url} target="_blank" rel="noreferrer" aria-label="ब्राउज़र में खोलें">
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
        <div className="webview-body">
          {status === 'loading' && (
            <div className="webview-loading">
              <span className="webview-spinner" aria-hidden="true" />
              <p>{target.title} लोड हो रहा है…</p>
            </div>
          )}
          {status === 'blocked' && (
            <div className="webview-blocked">
              <p>
                <b>{target.title}</b> को इन-ऐप व्यू में लोड करने में समय लग रहा है। कुछ सरकारी पोर्टल सुरक्षा कारणों से सीधे एम्बेड होने की अनुमति नहीं देते — कृपया ब्राउज़र में खोलें।
              </p>
              <a className="webview-open-external" href={target.url} target="_blank" rel="noreferrer">
                ब्राउज़र में खोलें <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          )}
          <iframe
            key={reloadKey}
            className="webview-frame"
            src={target.url}
            title={target.title}
            onLoad={() => setStatus('loaded')}
            style={{ opacity: status === 'loaded' ? 1 : 0 }}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  )
}

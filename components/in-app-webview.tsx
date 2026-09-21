'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Lock, RotateCw, X } from 'lucide-react'

export type WebViewTarget = { title: string; url: string } | null

type Status = 'loading' | 'loaded' | 'blocked'

// Web/PWA fallback view. On Android the app never gets here at all — see
// lib/portal.ts, which opens a Chrome Custom Tab instead and returns before
// this component's target is ever set. This component only renders when
// that native path isn't available.
export function InAppWebView({ target, onClose }: { target: WebViewTarget; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const timeoutRef = useRef<number | null>(null)

  // We have no server to pre-check X-Frame-Options/CSP headers here (this is
  // a static export with no API routes), so we just attempt the iframe and
  // cap how long we wait for `onLoad` before treating it as blocked. A
  // load event that never fires (the common case when a site refuses to
  // frame) is the only signal available client-side.
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
                <b>{target.title}</b> इन-ऐप व्यू में एम्बेड होने की अनुमति नहीं देता। कुछ सरकारी पोर्टल सुरक्षा कारणों से यह ब्लॉक करते हैं — कृपया ब्राउज़र में खोलें।
              </p>
              <a className="webview-open-external" href={target.url} target="_blank" rel="noreferrer">
                ब्राउज़र में खोलें <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          )}
          {status !== 'blocked' && (
            <iframe
              key={reloadKey}
              className="webview-frame"
              src={target.url}
              title={target.title}
              onLoad={() => setStatus('loaded')}
              style={{ opacity: status === 'loaded' ? 1 : 0 }}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
    </div>
  )
}

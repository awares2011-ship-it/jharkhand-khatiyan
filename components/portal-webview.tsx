'use client'

// Full-screen in-app WebView overlay. Opens the real government portal
// right inside the current tab — no new window, no page redirect, no app
// switch. On a Capacitor APK it still falls through to the native Chrome
// Custom Tab (which also stays "inside" the app). On web/PWA we render an
// iframe inside this overlay; many Jharkhand gov pages set
// X-Frame-Options: DENY, so we also show a short fallback inviting the
// user to continue in the same tab if the frame cannot load within 3.5s.
import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, RefreshCw, X } from 'lucide-react'

type Props = {
  url: string
  title: string
  onClose: () => void
}

export function PortalWebView({ url, title, onClose }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'blocked'>('loading')
  const [frameKey, setFrameKey] = useState(0)

  useEffect(() => {
    setStatus('loading')
    const t = window.setTimeout(() => {
      setStatus((prev) => (prev === 'loaded' ? 'loaded' : 'blocked'))
    }, 3500)
    return () => window.clearTimeout(t)
  }, [frameKey, url])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  function openInSameTab() {
    // Last-resort fallback for sites that refuse to frame. Still "same tab"
    // (not a popup) so a user tap on back returns to the app.
    window.location.href = url
  }

  return (
    <div className="webview-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <header className="webview-topbar">
        <button type="button" className="webview-icon" onClick={onClose} aria-label="वापस">
          <ArrowLeft aria-hidden="true" />
        </button>
        <div className="webview-title">
          <b>{title}</b>
          <small>jharbhoomi.jharkhand.gov.in</small>
        </div>
        <button type="button" className="webview-icon" onClick={() => setFrameKey((k) => k + 1)} aria-label="रीफ्रेश">
          <RefreshCw aria-hidden="true" />
        </button>
        <button type="button" className="webview-icon" onClick={onClose} aria-label="बंद">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className="webview-body">
        {status === 'loading' && (
          <div className="webview-loading">
            <span className="webview-spinner" aria-hidden="true" />
            <p>लाइव रिकॉर्ड लोड हो रहा है…</p>
          </div>
        )}
        {status === 'blocked' && (
          <div className="webview-blocked">
            <p><b>यह सेवा इनलाइन नहीं खुल सकी</b></p>
            <p>सरकारी पोर्टल ने इस फ्रेम में लोड होने से मना किया है। उसी टैब में खोलें —
              असली डेटा वहीं दिखेगा और ब्राउज़र बैक से यहाँ लौट आएंगे।</p>
            <button type="button" className="primary-button" onClick={openInSameTab}>
              <ExternalLink aria-hidden="true" /> इसी टैब में खोलें
            </button>
          </div>
        )}
        <iframe
          key={frameKey}
          src={url}
          title={title}
          className="webview-frame"
          onLoad={() => setStatus('loaded')}
          referrerPolicy="no-referrer"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  )
}

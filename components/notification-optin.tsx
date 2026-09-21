'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { NOTIFICATION_THEMES, currentSlotIndex, pickNotificationPayload, urlBase64ToUint8Array } from '@/lib/notifications'

const INTERVAL_MS = 3 * 60 * 60 * 1000
const LAST_LOCAL_KEY = 'jbi-last-local-notify-slot'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export function NotificationOptIn() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)
  }, [])

  // Foreground fallback: fires a real local notification every 3 hours while this
  // tab/PWA is open, cycling the same theme the server-side cron uses — so the
  // "every 3 hr multi-color" behaviour is visible immediately, even before this
  // app is deployed with a scheduler hitting /api/cron/notify in the background.
  useEffect(() => {
    if (permission !== 'granted') return
    const fireIfDue = () => {
      const slot = currentSlotIndex(INTERVAL_MS)
      const last = Number(window.localStorage.getItem(LAST_LOCAL_KEY) || '-1')
      if (slot === last) return
      const { theme, message } = pickNotificationPayload(slot)
      try {
        new Notification(message.title, { body: message.body, icon: '/icon-192.png', tag: `jbi-local-${theme.id}` })
        window.localStorage.setItem(LAST_LOCAL_KEY, String(slot))
        setStatus(`अंतिम सूचना · ${theme.label} · ${new Date().toLocaleTimeString('hi-IN')}`)
      } catch {
        // Notification constructor can throw on some browsers (e.g. iOS Safari) — ignore.
      }
    }
    fireIfDue()
    const id = window.setInterval(fireIfDue, 5 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [permission])

  const enable = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setBusy(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result as PermissionState)
      if (result !== 'granted') {
        setStatus('अनुमति नहीं मिली। ब्राउज़र सेटिंग में जाकर बदलें।')
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if ('serviceWorker' in navigator && 'PushManager' in window && vapidKey) {
        const registration = await navigator.serviceWorker.ready
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          })
        }
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })
        setStatus('सूचनाएं चालू — हर 3 घंटे में रंगीन अपडेट मिलेंगे।')
      } else {
        setStatus('बैकग्राउंड पुश उपलब्ध नहीं — ऐप खुला रहने पर हर 3 घंटे में सूचना मिलेगी।')
      }
    } finally {
      setBusy(false)
    }
  }, [])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          })
          await subscription.unsubscribe()
        }
      }
      setStatus('सूचनाएं बंद कर दी गईं।')
    } finally {
      setBusy(false)
    }
  }, [])

  const isOn = permission === 'granted'

  return (
    <div className="notify-card">
      <span className="notify-icon-wrap">{isOn ? <BellRing aria-hidden="true" /> : <Bell aria-hidden="true" />}</span>
      <div className="notify-copy">
        <b>
          स्मार्ट सूचनाएं
          <span className="notify-theme-dots" aria-hidden="true">
            {NOTIFICATION_THEMES.map((theme) => (
              <span key={theme.id} className={`notify-dot-${theme.id}`} />
            ))}
          </span>
        </b>
        <p>हर 3 घंटे में मंडी भाव, योजना, भूमि रिकॉर्ड और समाचार की बारी-बारी रंगीन सूचनाएं।</p>
        {status && <p className="notify-status">{status}</p>}
      </div>
      {permission === 'unsupported' ? (
        <span className="notify-status">इस ब्राउज़र में सूचनाएं समर्थित नहीं</span>
      ) : (
        <button type="button" className={`notify-toggle ${isOn ? 'is-on' : ''}`} onClick={isOn ? disable : enable} disabled={busy || permission === 'denied'}>
          {permission === 'denied' ? 'ब्लॉक्ड' : isOn ? 'चालू' : busy ? '...' : 'चालू करें'}
        </button>
      )}
    </div>
  )
}

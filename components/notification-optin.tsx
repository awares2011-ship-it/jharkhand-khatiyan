'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { NOTIFICATION_THEMES, currentSlotIndex, pickNotificationPayload } from '@/lib/notifications'

const INTERVAL_MS = 3 * 60 * 60 * 1000
const LAST_LOCAL_KEY = 'jbi-last-local-notify-slot'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

// This is a static, server-less build (see next.config.mjs), so there is
// nowhere to hold a Web Push subscription or send from — notifications are
// local-only: a real Notification fires on a rotating 3-hour cadence while
// the app is open (foreground). They will not arrive while the app/tab is
// closed. True background delivery needs either a live deployed backend
// (Web Push) or Capacitor's native Push Notifications plugin + Firebase
// Cloud Messaging — neither is wired up here.
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
      setStatus(
        result === 'granted'
          ? 'सूचनाएं चालू — ऐप खुला रहने पर हर 3 घंटे में रंगीन अपडेट मिलेंगे।'
          : 'अनुमति नहीं मिली। ब्राउज़र सेटिंग में जाकर बदलें।',
      )
    } finally {
      setBusy(false)
    }
  }, [])

  const disable = useCallback(() => {
    setStatus('सूचनाएं बंद कर दी गईं — ब्राउज़र सेटिंग में दोबारा अनुमति दें तो फिर चालू होंगी।')
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
        <p>हर 3 घंटे में मंडी भाव, योजना, भूमि रिकॉर्ड और समाचार की बारी-बारी रंगीन सूचनाएं (ऐप खुला रहने पर)।</p>
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

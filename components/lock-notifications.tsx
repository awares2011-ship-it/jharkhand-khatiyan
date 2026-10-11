'use client'

// Smart color notifications card with a visual lock-screen preview. The
// preview shows a stylised phone lock-screen stack of 4 colored
// notifications (saffron / green / blue / rose) so the user understands
// what they will see on their actual lock screen BEFORE they enable.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, BellOff, BellRing, Smartphone } from 'lucide-react'
import { NOTIFICATION_THEMES, pickNotificationPayload } from '@/lib/notifications'
import {
  cancelNative,
  describeSchedule,
  firePreview,
  readPermission,
  requestPermission,
  scheduleNative,
  startWebRotation,
  type PermissionState,
} from '@/lib/lock-notifications'

export function LockNotifications() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [previewTick, setPreviewTick] = useState(0)
  const schedule = useMemo(() => describeSchedule(), [])

  useEffect(() => {
    setPermission(readPermission())
    const id = window.setInterval(() => setPreviewTick((t) => t + 1), 4000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return
    const stop = startWebRotation((theme) => setStatus(`भेजा गया · ${theme.label}`))
    return stop
  }, [permission])

  const activeIndex = previewTick % schedule.length
  const sampleTime = useMemo(() => new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }), [])

  const enable = useCallback(async () => {
    setBusy(true)
    try {
      const result = await requestPermission()
      setPermission(result)
      if (result === 'granted') {
        const native = await scheduleNative()
        setStatus(
          native
            ? `रंगीन सूचनाएं चालू — हर दिन ${schedule.length} बार लॉक स्क्रीन पर।`
            : 'सूचनाएं चालू — ऐप खुला रहने पर रंगीन अपडेट मिलेंगे।',
        )
      } else if (result === 'denied') {
        setStatus('अनुमति नहीं मिली। डिवाइस सेटिंग से बदलें।')
      }
    } finally {
      setBusy(false)
    }
  }, [schedule.length])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      await cancelNative()
      setStatus('सूचनाएं बंद कर दी गईं।')
    } finally {
      setBusy(false)
    }
  }, [])

  const preview = useCallback(async (themeIndex: number) => {
    const theme = NOTIFICATION_THEMES[themeIndex]
    const ok = await firePreview(theme)
    setStatus(ok ? `नमूना भेजा गया · ${theme.label}` : 'सूचना नहीं भेजी जा सकी')
  }, [])

  const isOn = permission === 'granted'

  return (
    <section id="notifications" className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">स्मार्ट रंगीन अलर्ट</p>
          <h2>लॉक स्क्रीन पर दिन में 4 बार</h2>
        </div>
      </div>
      <div className="lock-card">
        <div className="lock-screen" aria-hidden="true">
          <div className="lock-topline">
            <small>{sampleTime}</small>
            <small>Jharkhand Khatiyan</small>
          </div>
          <ul className="lock-stack">
            {schedule.map(({ theme, time }, index) => {
              const themeIndex = NOTIFICATION_THEMES.indexOf(theme)
              const { message } = pickNotificationPayload(themeIndex)
              const isActive = index === activeIndex
              return (
                <li key={theme.id} className={`lock-notif lock-notif-${theme.id} ${isActive ? 'is-active' : ''}`}>
                  <span className="lock-stripe" />
                  <div className="lock-icon">{theme.emoji}</div>
                  <div className="lock-body">
                    <div className="lock-head">
                      <b>{theme.label}</b>
                      <small>{time}</small>
                    </div>
                    <p>{message.body}</p>
                  </div>
                  <button
                    type="button"
                    className="lock-preview-btn"
                    onClick={() => preview(themeIndex)}
                    aria-label={`${theme.label} नमूना भेजें`}
                  >
                    नमूना
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="lock-side">
          <div className="lock-side-head">
            <span className={`lock-icon-wrap ${isOn ? 'is-on' : ''}`}>
              {permission === 'denied' ? <BellOff aria-hidden="true" /> : isOn ? <BellRing aria-hidden="true" /> : <Bell aria-hidden="true" />}
            </span>
            <div>
              <b>रंगीन लॉक-स्क्रीन सूचनाएं</b>
              <p>
                मंडी भाव · भूमि रिकॉर्ड · योजना · समाचार — हर एक का अपना रंग, अपना समय।
                <br />
                <Smartphone aria-hidden="true" style={{ width: 12, verticalAlign: '-2px', marginRight: 4 }} />
                Android APK पर असली लॉक स्क्रीन पर; वेब पर ऐप खुला रहने पर।
              </p>
            </div>
          </div>
          {permission === 'unsupported' ? (
            <p className="lock-status">इस ब्राउज़र में सूचनाएं समर्थित नहीं हैं।</p>
          ) : (
            <button
              type="button"
              className={`primary-button lock-cta ${isOn ? 'is-on' : ''}`}
              onClick={isOn ? disable : enable}
              disabled={busy || permission === 'denied'}
            >
              {permission === 'denied' ? 'ब्लॉक्ड — सेटिंग से बदलें' : isOn ? 'सूचनाएं बंद करें' : busy ? '…' : 'चालू करें'}
            </button>
          )}
          {status && <p className="lock-status">{status}</p>}
        </div>
      </div>
    </section>
  )
}

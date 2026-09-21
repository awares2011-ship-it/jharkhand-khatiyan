'use client'

import { useEffect, useState } from 'react'

const MIN_VISIBLE_MS = 1300

export function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'leaving' | 'gone'>('visible')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Skip the long intro on fast in-session navigations (still shows briefly), but
    // always show it in full on a genuine first load / PWA launch.
    const alreadyShown = window.sessionStorage.getItem('jbi-splash-shown') === '1'
    const delay = alreadyShown ? 350 : MIN_VISIBLE_MS

    const leaveTimer = window.setTimeout(() => {
      setPhase('leaving')
      window.sessionStorage.setItem('jbi-splash-shown', '1')
    }, delay)

    return () => window.clearTimeout(leaveTimer)
  }, [])

  useEffect(() => {
    if (phase !== 'leaving') return
    const removeTimer = window.setTimeout(() => setPhase('gone'), 420)
    return () => window.clearTimeout(removeTimer)
  }, [phase])

  if (phase === 'gone') return null

  return (
    <div className={`splash-screen ${phase === 'leaving' ? 'splash-leaving' : ''}`} role="status" aria-live="polite" aria-label="JharBhoomi Info लोड हो रहा है">
      <div className="splash-glow" aria-hidden="true" />
      <div className="splash-mark">
        <img src="/logo.svg" alt="" width={104} height={104} className="splash-logo" />
      </div>
      <div className="splash-text">
        <b>JharBhoomi Info</b>
        <span>झारखंड भूमि रिकॉर्ड और किसान सेवाएं</span>
      </div>
      <div className="splash-bar"><span /></div>
    </div>
  )
}

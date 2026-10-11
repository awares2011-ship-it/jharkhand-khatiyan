'use client'

import { useEffect, useState } from 'react'

const MIN_VISIBLE_MS = 1300

export function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'leaving' | 'gone'>('visible')

  useEffect(() => {
    if (typeof window === 'undefined') return

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
    <div
      className={`splash-screen ${phase === 'leaving' ? 'splash-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Jharkhand Khatiyan — Land Info लोड हो रहा है"
    >
      <div className="splash-mark">
        <img
          src="/jharkhand-khatiyan-logo.png"
          alt=""
          width={104}
          height={104}
          className="splash-logo"
        />
      </div>
      <div className="splash-text">
        <b>Jharkhand Khatiyan</b>
        <span>झारखंड खातियान · भूमि जानकारी</span>
      </div>
      <div className="splash-bar"><span /></div>
    </div>
  )
}

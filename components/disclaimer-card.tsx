'use client'

// Compact home-screen disclaimer. Required language: we are not the gov,
// data comes from official JharBhoomi via links, verify on the portal.
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export function DisclaimerCard() {
  return (
    <section className="content-section disclaimer-section">
      <div className="disclaimer-card" role="note">
        <span className="disclaimer-icon" aria-hidden="true"><ShieldAlert /></span>
        <p>
          <b>यह सरकारी ऐप नहीं है।</b> असली डेटा आधिकारिक{' '}
          <a href="https://jharbhoomi.jharkhand.gov.in/" target="_blank" rel="noreferrer">JharBhoomi</a>{' '}
          पोर्टल से — किसी भी उपयोग से पहले सत्यापन करें। <Link href="/privacy-policy">नीति</Link>
        </p>
      </div>
    </section>
  )
}

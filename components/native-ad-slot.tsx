'use client'

// Inline ad slot that lives inside the news grid, styled like a news card
// so it blends in — but clearly labeled "विज्ञापन" per AdMob policy. On tap
// it fires an interstitial (the Capacitor community plugin does not
// expose a true native-ad API, so we route to the next-best format while
// still filling the slot visually and labeling it correctly).
import { useCallback } from 'react'
import { Megaphone, Sparkles } from 'lucide-react'
import { maybeShowInterstitial, trackInteraction } from '@/lib/admob'

type Props = {
  category?: string
}

export function NativeAdSlot({ category = 'सहयोग' }: Props) {
  const open = useCallback(async () => {
    trackInteraction()
    trackInteraction()
    await maybeShowInterstitial('manual')
  }, [])

  return (
    <article className="news-card news-card-ad" onClick={open} role="button" tabIndex={0}>
      <div className="news-card-top">
        <span className="news-source-pill ad-pill"><Megaphone aria-hidden="true" /> विज्ञापन</span>
        <small>{category}</small>
      </div>
      <h3>JharBhoomi Info को आगे बढ़ाने में मदद करें</h3>
      <p>ऐप मुफ्त रखने के लिए विज्ञापन देखें — आपका एक टैप हमारी सेवा चालू रखता है।</p>
      <div className="news-card-foot">
        <span className="news-read-link ad-cta">
          <Sparkles aria-hidden="true" /> एक नज़र डालें
        </span>
      </div>
    </article>
  )
}

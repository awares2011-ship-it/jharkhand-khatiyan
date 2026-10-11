'use client'

// On-device settings panel. Everything persists in localStorage via
// lib/app-settings.ts. Linking (notifications, privacy, source portal)
// uses hash links or the system handler — no new routes needed.
import { useCallback, useEffect, useState } from 'react'
import {
  BellRing,
  Globe,
  Mail,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import {
  APP_VERSION,
  clearAppCaches,
  readSettings,
  writeSettings,
  type AppSettings,
} from '@/lib/app-settings'
import { shareText } from '@/lib/share'

type Props = {
  notify?: (message: string) => void
}

const SHARE_TEXT =
  'Jharkhand Khatiyan — Land Info · झारखंड की सभी भूमि सेवाएं, मौसम, योजनाएं और रंगीन अलर्ट, एक ऐप में।'

export function SettingsSection({ notify }: Props) {
  const [settings, setSettings] = useState<AppSettings>(() => readSettings())

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('prefers-reduced-motion', settings.reducedMotion)
    root.classList.toggle('is-compact', settings.compact)
  }, [settings])

  const update = useCallback(
    (patch: Partial<AppSettings>, message?: string) => {
      const next = writeSettings(patch)
      setSettings(next)
      if (message) notify?.(message)
    },
    [notify],
  )

  const toggleLang = useCallback(() => {
    update(
      { language: settings.language === 'hi' ? 'en' : 'hi' },
      settings.language === 'hi' ? 'Language changed to English' : 'भाषा बदली — हिंदी',
    )
  }, [settings.language, update])

  const toggleReducedMotion = useCallback(() => {
    update({ reducedMotion: !settings.reducedMotion }, 'एनिमेशन सेटिंग सहेजी गई')
  }, [settings.reducedMotion, update])

  const toggleCompact = useCallback(() => {
    update({ compact: !settings.compact }, 'कार्ड स्टाइल सहेजी गई')
  }, [settings.compact, update])

  const onClear = useCallback(() => {
    const removed = clearAppCaches()
    notify?.(`${removed} कैश प्रविष्टियां हटाई गईं`)
  }, [notify])

  const onShare = useCallback(async () => {
    const outcome = await shareText(
      'Jharkhand Khatiyan — Land Info',
      SHARE_TEXT,
      typeof window !== 'undefined' ? window.location.origin : undefined,
    )
    if (outcome === 'shared') notify?.('ऐप साझा किया गया')
    else if (outcome === 'copied') notify?.('लिंक कॉपी हो गया')
  }, [notify])

  const onRate = useCallback(() => {
    const url = 'https://play.google.com/store/apps/details?id=com.jharbhoomi.info'
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  return (
    <section id="settings" className="content-section settings-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">सेटिंग</p>
          <h2>ऐप पसंद और सहायता</h2>
        </div>
      </div>

      <div className="settings-grid">
        <button type="button" className="settings-row" onClick={toggleLang}>
          <span className="settings-icon settings-icon-sky"><Globe aria-hidden="true" /></span>
          <span className="settings-copy">
            <b>भाषा / Language</b>
            <small>वर्तमान: {settings.language === 'hi' ? 'हिंदी' : 'English'}</small>
          </span>
          <span className="settings-value">{settings.language === 'hi' ? 'हिंदी' : 'EN'}</span>
        </button>

        <a href="#notifications" className="settings-row">
          <span className="settings-icon settings-icon-rose"><BellRing aria-hidden="true" /></span>
          <span className="settings-copy">
            <b>रंगीन लॉक-स्क्रीन अलर्ट</b>
            <small>मंडी · भूमि · योजना · समाचार — हर एक का रंग</small>
          </span>
          <span className="settings-value">खोलें</span>
        </a>

        <button type="button" className="settings-row" onClick={toggleReducedMotion} aria-pressed={settings.reducedMotion}>
          <span className="settings-icon settings-icon-saffron"><Sparkles aria-hidden="true" /></span>
          <span className="settings-copy">
            <b>एनिमेशन कम करें</b>
            <small>धीमे फोन पर स्क्रॉल तेज़ करता है</small>
          </span>
          <span className={`settings-toggle ${settings.reducedMotion ? 'is-on' : ''}`} aria-hidden="true">
            <span />
          </span>
        </button>

        <button type="button" className="settings-row" onClick={toggleCompact} aria-pressed={settings.compact}>
          <span className="settings-icon settings-icon-green"><Sparkles aria-hidden="true" /></span>
          <span className="settings-copy">
            <b>कॉम्पैक्ट कार्ड</b>
            <small>एक नज़र में ज़्यादा सेवाएं</small>
          </span>
          <span className={`settings-toggle ${settings.compact ? 'is-on' : ''}`} aria-hidden="true">
            <span />
          </span>
        </button>

        <button type="button" className="settings-row" onClick={onClear}>
          <span className="settings-icon settings-icon-rose"><Trash2 aria-hidden="true" /></span>
          <span className="settings-copy">
            <b>कैश साफ़ करें</b>
            <small>समाचार, इतिहास, स्थानीय डेटा मिटाएं</small>
          </span>
          <span className="settings-value">मिटाएं</span>
        </button>

        <button type="button" className="settings-row" onClick={onShare}>
          <span className="settings-icon settings-icon-sky"><Share2 aria-hidden="true" /></span>
          <span className="settings-copy">
            <b>ऐप शेयर करें</b>
            <small>दोस्तों और परिवार को भेजें</small>
          </span>
          <span className="settings-value">शेयर</span>
        </button>

        <button type="button" className="settings-row" onClick={onRate}>
          <span className="settings-icon settings-icon-saffron"><Star aria-hidden="true" /></span>
          <span className="settings-copy">
            <b>Play Store पर रेटिंग दें</b>
            <small>आपकी राय हमें बेहतर बनाती है</small>
          </span>
          <span className="settings-value">★</span>
        </button>

        <Link href="/privacy-policy" className="settings-row">
          <span className="settings-icon settings-icon-green"><ShieldCheck aria-hidden="true" /></span>
          <span className="settings-copy">
            <b>गोपनीयता नीति</b>
            <small>डेटा और विज्ञापन की जानकारी</small>
          </span>
          <span className="settings-value">पढ़ें</span>
        </Link>

        <a className="settings-row" href="mailto:supportbreakouttrade@gmail.com">
          <span className="settings-icon settings-icon-sky"><Mail aria-hidden="true" /></span>
          <span className="settings-copy">
            <b>सहायता / Support</b>
            <small>supportbreakouttrade@gmail.com</small>
          </span>
          <span className="settings-value">लिखें</span>
        </a>
      </div>

      <p className="settings-version">Version {APP_VERSION} · Independent app · Not affiliated with GoJ</p>
    </section>
  )
}

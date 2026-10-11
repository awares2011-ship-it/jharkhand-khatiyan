'use client'

import { useState } from 'react'
import {
  FileSearch,
  Home,
  Menu,
  Newspaper,
  Scroll,
  Settings as SettingsIcon,
  X,
} from 'lucide-react'
import { useLiveData } from '@/lib/use-live-data'
import { getNews, type NewsResult } from '@/lib/news'
import { getRanchiWeather, type WeatherNow } from '@/lib/weather'
import { NewsSection } from '@/components/news-section'
import { SchemesSection } from '@/components/schemes-section'
import { LandServices } from '@/components/land-services'
import { LockNotifications } from '@/components/lock-notifications'
import { PortalWebView } from '@/components/portal-webview'
import { DownloadShare } from '@/components/download-share'
import { DisclaimerCard } from '@/components/disclaimer-card'
import { SettingsSection } from '@/components/settings-section'
import { AdManager } from '@/components/ad-manager'
import { tryOpenNativeBrowser } from '@/lib/portal'
import { maybeShowInterstitial, trackInteraction } from '@/lib/admob'

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [webview, setWebview] = useState<{ url: string; title: string } | null>(null)

  const news = useLiveData<NewsResult>(getNews, 30 * 60 * 1000)
  const weather = useLiveData<WeatherNow>(getRanchiWeather, 30 * 60 * 1000)

  function openToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  async function openInApp(url: string, title: string) {
    if (!url.startsWith('http')) return
    trackInteraction()
    const openedNative = await tryOpenNativeBrowser(url)
    if (openedNative) return
    setWebview({ url, title })
  }

  async function closeWebview() {
    setWebview(null)
    // Natural breakpoint — show an interstitial, gated by the cool-down
    // and interaction-count checks inside admob.ts (policy-safe).
    await maybeShowInterstitial('portal-close')
  }

  const temp = weather.data?.temp
  const condition = weather.data?.label

  return (
    <main className="app-shell">
      <header className="topbar">
        <a href="#home" className="brand" aria-label="Jharkhand Khatiyan home">
          <span className="brand-mark brand-mark-logo">
            <img src="/jharkhand-khatiyan-logo.png" alt="" width={42} height={42} />
          </span>
          <span>
            <strong>Jharkhand Khatiyan</strong>
            <small>झारखंड खातियान · भूमि जानकारी</small>
          </span>
        </a>
        <div className="header-actions">
          {temp !== undefined && (
            <span className="weather-pill" aria-label={`आज का मौसम ${temp} डिग्री ${condition ?? ''}`}>
              {temp}° <small>{condition}</small>
            </span>
          )}
          <a className="icon-button" href="#settings" aria-label="सेटिंग">
            <SettingsIcon aria-hidden="true" />
          </a>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="mobile-menu" aria-label="मुख्य मेनू">
          <a href="#services" onClick={() => setMenuOpen(false)}>भूमि सेवाएं</a>
          <a href="#notifications" onClick={() => setMenuOpen(false)}>रंगीन अलर्ट</a>
          <a href="#news" onClick={() => setMenuOpen(false)}>समाचार</a>
          <a href="#schemes" onClick={() => setMenuOpen(false)}>योजनाएं</a>
          <a href="#settings" onClick={() => setMenuOpen(false)}>सेटिंग</a>
        </nav>
      )}

      <section id="home" className="hero hero-compact">
        <div className="hero-copy">
          <p className="hero-kicker"><span className="live-dot" /> Jharkhand Khatiyan · लाइव</p>
          <h1>झारखंड खातियान और भूमि सेवाएं, <em>एक ऐप में।</em></h1>
          <p className="hero-description">
            अपना खाता · रजिस्टर-II · खेसरा · भू-नक्शा · लगान — सब कुछ असली सरकारी डेटा के साथ,
            इसी ऐप के भीतर।
          </p>
          <a href="#services" className="primary-button hero-cta">
            <FileSearch aria-hidden="true" /> 11 सेवाएं खोलें
          </a>
        </div>
      </section>

      <DisclaimerCard />

      <LandServices notify={openToast} />

      <DownloadShare targetId="services" fileName="Jharkhand-Khatiyan-सेवाएं" notify={openToast} />

      <LockNotifications />

      <NewsSection
        data={news.data}
        loading={news.loading}
        error={news.error}
        onReload={news.reload}
        onOpen={(url) => openInApp(url, 'समाचार')}
        onToast={openToast}
      />

      <SchemesSection onOpen={(url) => openInApp(url, 'सरकारी योजना')} />

      <SettingsSection notify={openToast} />

      <footer>
        <div className="footer-brand">
          <span className="brand-mark brand-mark-logo brand-mark-sm">
            <img src="/jharkhand-khatiyan-logo.png" alt="" width={32} height={32} />
          </span>
          <div><b>Jharkhand Khatiyan</b><small>झारखंड खातियान · स्वतंत्र मंच</small></div>
        </div>
        <p>
          © 2026 · सरकारी डेटा के लिए JharBhoomi पोर्टल से लिंक ·{' '}
          <a href="/privacy-policy.html">गोपनीयता नीति</a>
        </p>
      </footer>

      <nav className="bottom-nav" aria-label="नीचे का मेनू">
        <a className="active" href="#home"><Home /><span>होम</span></a>
        <a href="#services"><FileSearch /><span>सेवाएं</span></a>
        <a href="#news"><Newspaper /><span>समाचार</span></a>
        <a href="#schemes"><Scroll /><span>योजना</span></a>
      </nav>

      {toast && <div className="toast" role="status">{toast}</div>}
      {webview && (
        <PortalWebView
          url={webview.url}
          title={webview.title}
          onClose={closeWebview}
        />
      )}
      <AdManager />
    </main>
  )
}

'use client'

import { useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Calculator,
  ChevronRight,
  CloudSun,
  FileCheck2,
  FileText,
  Home,
  Languages,
  Landmark,
  Map,
  MapPin,
  Menu,
  Newspaper,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  Store,
  TrendingUp,
  X,
} from 'lucide-react'
import { useLiveData } from '@/lib/use-live-data'
import { getMandiRates, type MandiResult } from '@/lib/mandi'
import { getNews, type NewsResult } from '@/lib/news'
import { tryOpenNativeBrowser } from '@/lib/portal'
import { NotificationOptIn } from '@/components/notification-optin'
import { ExportButtons } from '@/components/export-buttons'

const officialLinks = {
  land: 'https://jharbhoomi.jharkhand.gov.in/',
  map: 'https://jharbhunaksha.jharkhand.gov.in/',
  services: 'https://jharsewa.jharkhand.gov.in/',
}

const quickActions = [
  { label: 'भूमि रिकॉर्ड', sub: 'खाता / खेसरा', icon: FileText, tone: 'saffron', href: '#land-records' },
  { label: 'अपना खाता', sub: 'Know your Khata', icon: BookOpen, tone: 'green', href: '#land-records' },
  { label: 'Register-II', sub: 'पंजी-II देखें', icon: FileCheck2, tone: 'blue', href: '#land-records' },
  { label: 'भू-नक्शा', sub: 'जमीन का नक्शा', icon: Map, tone: 'purple', href: officialLinks.map },
  { label: 'दाखिल-खारिज', sub: 'Mutation सेवाएं', icon: Landmark, tone: 'rose', href: '#services' },
  { label: 'लगान', sub: 'भूमि राजस्व', icon: Calculator, tone: 'amber', href: officialLinks.land },
]

const tools = [
  { label: 'जमीन माप कैलकुलेटर', desc: 'क्षेत्रफल और इकाई बदलें', icon: Calculator },
  { label: 'GPS माप', desc: 'चलकर अनुमानित क्षेत्रफल', icon: MapPin },
  { label: 'फसल लाभ कैलकुलेटर', desc: 'लागत और आय का अनुमान', icon: TrendingUp },
  { label: 'बीज व खाद कैलकुलेटर', desc: 'फसल के अनुसार मात्रा', icon: Sprout },
]

const services = [
  { label: 'राजस्व एवं भूमि', items: ['भूमि रिकॉर्ड', 'खाता / Register-II', 'दाखिल-खारिज', 'भू-नक्शा', 'लगान भुगतान'] },
  { label: 'किसान सेवाएं', items: ['सरकारी योजनाएं', 'मंडी भाव', 'मौसम', 'फसल सलाह'] },
  { label: 'नागरिक सेवाएं', items: ['राजस्व न्यायालय', 'प्रमाण पत्र', 'पंजीकरण जानकारी', 'सरकारी सूचनाएं'] },
]

function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action && <a className="text-link" href="#services">{action}<ChevronRight aria-hidden="true" /></a>}
    </div>
  )
}

function LiveBadge({ source, updatedAt }: { source?: 'live' | 'cache' | 'sample'; updatedAt?: string }) {
  if (!source) return null
  const label = source === 'live' ? 'लाइव' : source === 'cache' ? 'कैश्ड' : 'नमूना डेटा'
  const time = updatedAt ? new Date(updatedAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <span className={`live-badge ${source === 'sample' ? 'is-stale' : ''}`}>
      <span className="live-dot" />
      {label}{time ? ` · ${time}` : ''}
    </span>
  )
}

function formatINR(value: number) {
  return `₹${value.toLocaleString('en-IN')}`
}

function timeAgoHi(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return ''
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'अभी'
  if (minutes < 60) return `${minutes} मिनट पहले`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} घंटे पहले`
  return `${Math.floor(hours / 24)} दिन पहले`
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('हिंदी')
  const [toast, setToast] = useState('')

  const mandi = useLiveData<MandiResult>(getMandiRates, 30 * 60 * 1000)
  const news = useLiveData<NewsResult>(getNews, 30 * 60 * 1000)

  const mandiRef = useRef<HTMLDivElement>(null)
  const newsRef = useRef<HTMLDivElement>(null)
  const landRef = useRef<HTMLDivElement>(null)

  const searchLabel = useMemo(() => (query ? `“${query}” के लिए खोजें` : 'खाता / खेसरा / जमीन की जानकारी खोजें'), [query])

  function openToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  async function handlePortalClick(event: MouseEvent<HTMLAnchorElement>, title: string, url: string) {
    if (url === '#' || !url.startsWith('http')) return
    if (event.metaKey || event.ctrlKey || event.shiftKey) return // let the user open a real new tab if they want
    event.preventDefault()
    // Portals open directly — most .gov.in sites block iframing outright, so an
    // in-app "webview" modal just adds a loading spinner before failing. On
    // Android this is a Chrome Custom Tab (stays inside the app); everywhere
    // else it's a normal new tab straight to the real, working page.
    const openedNatively = await tryOpenNativeBrowser(url)
    if (!openedNatively) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a href="#home" className="brand" aria-label="JharBhoomi Info home">
          <span className="brand-mark"><Sprout aria-hidden="true" /></span>
          <span><strong>JharBhoomi Info</strong><small>झारखंड भूमि रिकॉर्ड और किसान सेवाएं</small></span>
        </a>
        <div className="header-actions">
          <a className="icon-button" href="#notifications" aria-label="सूचनाएं"><Bell aria-hidden="true" /></a>
          <button className="language-button" onClick={() => setLanguage(language === 'हिंदी' ? 'English' : 'हिंदी')}><Languages aria-hidden="true" />{language}</button>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      {menuOpen && (
        <nav className="mobile-menu" aria-label="मुख्य मेनू">
          <a href="#land-records" onClick={() => setMenuOpen(false)}>भूमि रिकॉर्ड</a>
          <a href="#mandi" onClick={() => setMenuOpen(false)}>मंडी भाव</a>
          <a href="#news" onClick={() => setMenuOpen(false)}>समाचार</a>
          <a href="#tools" onClick={() => setMenuOpen(false)}>किसान टूल्स</a>
          <a href="#schemes" onClick={() => setMenuOpen(false)}>योजनाएं</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>सरकारी सेवाएं</a>
          <a href="#notifications" onClick={() => setMenuOpen(false)}>सूचनाएं</a>
        </nav>
      )}

      <div className="notice-bar"><ShieldCheck aria-hidden="true" /><span><b>स्वतंत्र सूचना मंच</b> — यह सरकारी ऐप नहीं है। आधिकारिक रिकॉर्ड के लिए संबंधित पोर्टल पर सत्यापन करें।</span><a href="#about">जानें</a></div>

      <section id="home" className="hero">
        <div className="hero-copy">
          <p className="hero-kicker"><span className="live-dot" /> झारखंड के लिए सरल डिजिटल सेवाएं</p>
          <h1>अपनी जमीन और खेती की जानकारी, <em>एक ही जगह।</em></h1>
          <p className="hero-description">स्थानीय भाषा में भूमि रिकॉर्ड, लाइव मंडी भाव, समाचार और किसान सेवाएं — सरल, तेज़ और भरोसेमंद तरीके से।</p>
          <form className="search-box" onSubmit={(event) => { event.preventDefault(); openToast(query ? `“${query}” के लिए आधिकारिक सेवा देखें` : 'कृपया खाता या खेसरा नंबर डालें') }}>
            <Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchLabel} aria-label="भूमि जानकारी खोजें" /><button type="submit">खोजें</button>
          </form>
          <p className="search-help">उदाहरण: Ranchi · Kanke · Khata 123 · Khesra 456</p>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="sun" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="field-lines" /><div className="hero-card"><MapPin /><span><b>आपके जिले की सेवाएं</b><small>ऑनलाइन जानकारी से शुरुआत करें</small></span></div></div>
      </section>

      <section className="content-section quick-section"><SectionHeading eyebrow="जल्दी पहुंचें" title="लोकप्रिय सेवाएं" action="सभी सेवाएं" /><div className="quick-grid">{quickActions.map(({ label, sub, icon: Icon, tone, href }) => <a className={`quick-card ${tone}`} key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} onClick={href.startsWith('http') ? (event) => handlePortalClick(event, label, href) : undefined}><span className="quick-icon"><Icon aria-hidden="true" /></span><span><b>{label}</b><small>{sub}</small></span><ArrowUpRight aria-hidden="true" /></a>)}</div></section>

      <section id="land-records" className="content-section land-panel">
        <div className="panel-copy">
          <p className="eyebrow">आधिकारिक पोर्टल से जुड़ें</p><h2>भूमि रिकॉर्ड खोजें</h2>
          <p>जिला, अंचल और मौजा चुनकर खाता, खेसरा और Register-II की जानकारी देखें। इस ऐप में संरक्षित या कानूनी रिकॉर्ड कॉपी नहीं किए जाते।</p>
          <div className="steps"><span><i>1</i>जिला चुनें</span><span><i>2</i>अंचल / मौजा</span><span><i>3</i>आधिकारिक रिकॉर्ड</span></div>
          <a className="primary-button" href={officialLinks.land} target="_blank" rel="noreferrer" onClick={(event) => handlePortalClick(event, 'JharBhoomi', officialLinks.land)}>JharBhoomi खोलें (इन-ऐप) <ArrowUpRight data-icon="inline-end" /></a>
        </div>
        <div>
          <div ref={landRef} className="land-preview export-capture">
            <div className="preview-top"><span>ऑनलाइन रिकॉर्ड</span><span className="secure"><ShieldCheck /> सुरक्षित लिंक</span></div>
            <div className="select-row"><div><small>जिला</small><b>Ranchi</b></div><div><small>अंचल</small><b>Kanke</b></div></div>
            <div className="record-row"><span><small>खाता</small><b>— — —</b></span><span><small>खेसरा / प्लॉट</small><b>— — —</b></span><span><small>स्थिति</small><b className="muted-value">आधिकारिक पोर्टल पर देखें</b></span></div>
            <div className="preview-note">CAPTCHA या लॉगिन की आवश्यकता होने पर ऐप उसे आधिकारिक पोर्टल पर खोल देगा।</div>
          </div>
          <div style={{ marginTop: 10 }}><ExportButtons targetRef={landRef} fileName="jharbhoomi-land-summary" label="रिकॉर्ड" /></div>
        </div>
      </section>

      <section id="tools" className="content-section"><SectionHeading eyebrow="किसान टूल्स" title="रोजमर्रा के काम आसान करें" action="सभी टूल्स" /><div className="tools-grid">{tools.map(({ label, desc, icon: Icon }) => <button className="tool-card" key={label} onClick={() => openToast(`${label} जल्द उपलब्ध होगा`)}><span className="tool-icon"><Icon aria-hidden="true" /></span><span><b>{label}</b><small>{desc}</small></span><ChevronRight aria-hidden="true" /></button>)}</div><div className="calculator-banner"><div><span className="mini-label">अनुमानित उपयोगिता</span><h3>जमीन माप कैलकुलेटर</h3><p>वर्ग फुट, एकड़, हेक्टेयर और डिसमिल में तुरंत बदलें।</p></div><button onClick={() => openToast('कैलकुलेटर मॉड्यूल जल्द उपलब्ध होगा')}>शुरू करें <ArrowUpRight data-icon="inline-end" /></button></div></section>

      <section id="schemes" className="content-section insight-grid"><article className="insight-card scheme-card"><div className="insight-head"><span className="insight-icon"><Sprout /></span><span className="status-pill">अपडेटेड</span></div><p className="eyebrow">किसान योजनाएं</p><h3>आपके लिए कौन-सी योजना?</h3><p>कृषि, सिंचाई, बीज, पशुपालन और सहायता योजनाओं की पात्रता और आधिकारिक आवेदन लिंक जानें।</p><a className="text-link" href="#services">योजनाएं देखें <ChevronRight /></a></article><article className="insight-card weather-card"><div className="weather-top"><div><p className="eyebrow">आज का मौसम · Ranchi</p><h3>28° <small>°C</small></h3><p>आंशिक बादल · नमी 64%</p></div><CloudSun aria-hidden="true" /></div><div className="weather-strip"><span>बारिश की संभावना <b>20%</b></span><span>हवा <b>12 km/h</b></span></div><a className="text-link" href="#services">7 दिन का पूर्वानुमान <ChevronRight /></a></article></section>

      <section id="mandi" className="content-section market-section">
        <SectionHeading eyebrow="कृषि बाजार" title="आज के मंडी भाव" />
        <div className="section-toolbar" style={{ marginBottom: 14, justifyContent: 'space-between' }}>
          <LiveBadge source={mandi.data?.source} updatedAt={mandi.data?.updatedAt} />
          <button type="button" className={`refresh-btn ${mandi.loading ? 'is-loading' : ''}`} onClick={() => mandi.reload()} disabled={mandi.loading}><RefreshCw aria-hidden="true" /> रीफ्रेश</button>
        </div>
        <div ref={mandiRef} className="export-capture">
          <div className="market-table">
            <div className="market-row market-header"><span>फसल</span><span>मंडी</span><span>मोडल भाव</span><span>दिनांक</span></div>
            {mandi.loading && !mandi.data && Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ padding: '8px 16px' }}><div className="skeleton-row" /></div>)}
            {mandi.error && !mandi.data && <div className="inline-error" style={{ margin: 14 }}>मंडी डेटा लोड नहीं हो सका: {mandi.error}</div>}
            {mandi.data?.rates.slice(0, 12).map((rate, index) => (
              <div className="market-row" key={`${rate.commodity}-${rate.market}-${index}`}>
                <span>{rate.commodity}{rate.variety && rate.variety !== '—' ? ` · ${rate.variety}` : ''}</span>
                <span>{rate.market}</span>
                <span>{formatINR(rate.modalPrice)} / क्विंटल</span>
                <span>{rate.arrivalDate}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="section-toolbar" style={{ justifyContent: 'space-between', marginTop: 12, alignItems: 'flex-start' }}>
          <p className="freshness"><span className="live-dot" /> स्रोत: data.gov.in (Agmarknet) · अंतिम निर्णय से पहले आधिकारिक मंडी स्रोत से सत्यापित करें।</p>
          <ExportButtons targetRef={mandiRef} fileName="jharbhoomi-mandi-bhav" label="मंडी भाव" />
        </div>
      </section>

      <section id="news" className="content-section news-section">
        <SectionHeading eyebrow="समाचार" title="ताज़ा झारखंड समाचार" />
        <div className="section-toolbar" style={{ marginBottom: 14, justifyContent: 'space-between' }}>
          <LiveBadge source={news.data?.source} updatedAt={news.data?.updatedAt} />
          <button type="button" className={`refresh-btn ${news.loading ? 'is-loading' : ''}`} onClick={() => news.reload()} disabled={news.loading}><RefreshCw aria-hidden="true" /> रीफ्रेश</button>
        </div>
        <div ref={newsRef} className="export-capture">
          <div className="news-grid">
            {news.loading && !news.data && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-row" style={{ minHeight: 120 }} />)}
            {news.error && !news.data && <div className="news-error">समाचार लोड नहीं हो सके: {news.error}</div>}
            {news.data && news.data.items.length === 0 && <div className="news-empty">अभी कोई समाचार उपलब्ध नहीं</div>}
            {news.data?.items.map((item) => (
              <article className="news-card" key={item.id}>
                <div className="news-card-top"><span className="news-source-pill">{item.category}</span><span>{timeAgoHi(item.publishedAt)}</span></div>
                <h3>{item.title}</h3>
                <div className="news-card-foot">
                  <span style={{ color: 'var(--muted)', fontSize: 10 }}>{item.source}</span>
                  <a className="news-read-link" href={item.link} target="_blank" rel="noreferrer" onClick={(event) => handlePortalClick(event, item.title, item.link)}>पूरा पढ़ें <ArrowUpRight aria-hidden="true" /></a>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="section-toolbar" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <ExportButtons targetRef={newsRef} fileName="jharbhoomi-samachar" label="समाचार" />
        </div>
      </section>

      <section id="notifications" className="content-section">
        <SectionHeading eyebrow="रिटेंशन के लिए" title="स्मार्ट सूचनाएं" />
        <NotificationOptIn />
      </section>

      <section id="services" className="content-section services-section"><SectionHeading eyebrow="एक जगह सभी लिंक" title="सरकारी सेवाएं" /><div className="service-grid">{services.map((service) => <div className="service-column" key={service.label}><h3>{service.label}</h3>{service.items.map((item) => { const url = item === 'भू-नक्शा' ? officialLinks.map : item.includes('खाता') || item.includes('लगान') ? officialLinks.land : officialLinks.services; return <a href={url} target="_blank" rel="noreferrer" key={item} onClick={(event) => handlePortalClick(event, item, url)}>{item}<ArrowUpRight /></a> })}</div>)}</div></section>

      <section id="about" className="disclaimer"><ShieldCheck aria-hidden="true" /><div><b>जरूरी सूचना</b><p>JharBhoomi Info एक स्वतंत्र सूचना और उपयोगिता मंच है। यह Government of Jharkhand से संबद्ध, समर्थित या संचालित नहीं है। आधिकारिक रिकॉर्ड, आवेदन, भुगतान और कानूनी मामलों के लिए संबंधित सरकारी पोर्टल या कार्यालय से सत्यापन करें। GPS माप केवल अनुमानित है, कानूनी सर्वे नहीं। मंडी भाव data.gov.in (Agmarknet) से और समाचार सार्वजनिक Google News फीड से स्वतः एकत्र किए जाते हैं — दोनों की सटीकता के लिए मूल स्रोत देखें।</p><small>आधिकारिक स्रोत: Revenue Department · JharBhoomi · Bhu-Naksha · Jharkhand e-District</small></div></section>

      <footer><div className="footer-brand"><span className="brand-mark"><Sprout /></span><div><b>JharBhoomi Info</b><small>स्थानीय भाषा, सरल सेवाएं</small></div></div><div className="footer-links"><a href="#about">गोपनीयता</a><a href="#about">उपयोग की शर्तें</a><a href={officialLinks.land} target="_blank" rel="noreferrer" onClick={(event) => handlePortalClick(event, 'JharBhoomi', officialLinks.land)}>आधिकारिक स्रोत</a></div><p>© 2026 JharBhoomi Info · स्वतंत्र सूचना मंच</p></footer>

      <nav className="bottom-nav" aria-label="नीचे का मेनू">
        <a className="active" href="#home"><Home /><span>होम</span></a>
        <a href="#land-records"><FileText /><span>भूमि</span></a>
        <a href="#mandi"><Store /><span>मंडी</span></a>
        <a href="#news"><Newspaper /><span>समाचार</span></a>
        <a href="#services"><Menu /><span>और</span></a>
      </nav>

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  )
}

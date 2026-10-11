'use client'

// The 10 live JharBhoomi services. Taps open the REAL government portal:
//
//   • On the APK (Capacitor native): @capacitor/browser → Chrome Custom Tab,
//     which stays inside the app (same window, no app switch). Android back
//     returns to this app.
//
//   • On web / PWA: an in-app full-screen WebView overlay (same tab, no
//     redirect). If the gov site refuses to frame (X-Frame-Options), the
//     overlay offers an "इसी टैब में खोलें" fallback.
import { useState } from 'react'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { JHARKHAND_SERVICES, groupServices, type JharkhandService } from '@/lib/jharkhand-services'
import { tryOpenNativeBrowser } from '@/lib/portal'
import { PortalWebView } from './portal-webview'

type Props = {
  notify?: (message: string) => void
}

export function LandServices({ notify }: Props) {
  const groups = groupServices()
  const [active, setActive] = useState<JharkhandService | null>(null)

  async function openService(service: JharkhandService) {
    notify?.(`${service.title} खुल रहा है · असली डेटा`)
    // On a Capacitor APK, Chrome Custom Tab is the native in-app experience.
    const openedNative = await tryOpenNativeBrowser(service.url)
    if (openedNative) return
    // On web, show the in-app WebView modal (same tab, no redirect).
    setActive(service)
  }

  return (
    <section id="services" className="content-section services-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">आधिकारिक सेवाएं · JharBhoomi</p>
          <h2>झारखंड भूमि सेवाएं — असली डेटा</h2>
        </div>
        <small style={{ color: 'var(--muted)', fontSize: 11 }}>
          सभी {JHARKHAND_SERVICES.length} सेवाएं · इसी टैब में
        </small>
      </div>

      {(Object.entries(groups) as [JharkhandService['category'], JharkhandService[]][]).map(([category, items]) => (
        <div key={category} className="services-group">
          <h3 className="services-group-heading">{category}</h3>
          <div className="services-grid">
            {items.map((service) => {
              const Icon = service.icon
              return (
                <button
                  key={service.id}
                  type="button"
                  className={`service-tile service-${service.theme}`}
                  onClick={() => openService(service)}
                >
                  <span className="service-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="service-copy">
                    <b>{service.title}</b>
                    <small>{service.english}</small>
                    <p>{service.description}</p>
                  </span>
                  <span className="service-cta">
                    खोलें <ArrowRight aria-hidden="true" />
                  </span>
                  <span className="service-link-hint" aria-hidden="true">
                    <ExternalLink />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {active && (
        <PortalWebView
          url={active.url}
          title={active.title}
          onClose={() => setActive(null)}
        />
      )}
    </section>
  )
}

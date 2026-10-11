'use client'

// Curated Jharkhand/Centre schemes relevant to a Jharkhand farmer. Static
// list (updated by hand) because scheme pages are permanent — not something
// an RSS feed covers reliably. Each card uses the smart-color system so a
// user can scan by category.
import { ArrowRight, Banknote, HeartHandshake, Leaf, Sprout, Tractor } from 'lucide-react'
import type { ReactNode } from 'react'

type Scheme = {
  id: string
  theme: 'saffron' | 'green' | 'blue' | 'rose'
  title: string
  summary: string
  benefit: string
  url: string
  icon: ReactNode
}

const SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    theme: 'saffron',
    title: 'PM-किसान सम्मान निधि',
    summary: 'छोटे और सीमांत किसानों को प्रत्यक्ष आय सहायता।',
    benefit: '₹6,000 / वर्ष · तीन किस्तों में',
    url: 'https://pmkisan.gov.in/',
    icon: <Banknote />,
  },
  {
    id: 'mukhyamantri-maiya',
    theme: 'rose',
    title: 'मुख्यमंत्री मंईयाँ सम्मान योजना',
    summary: 'झारखंड की 18-50 वर्ष की महिलाओं के लिए मासिक सहायता।',
    benefit: '₹1,000 / माह',
    url: 'https://mmmsy.jharkhand.gov.in/',
    icon: <HeartHandshake />,
  },
  {
    id: 'birsa-harit',
    theme: 'green',
    title: 'बिरसा हरित ग्राम योजना',
    summary: 'बंजर भूमि पर फलदार पौधारोपण — मनरेगा मजदूरी के साथ।',
    benefit: '3 वर्ष मजदूरी + 50% आय',
    url: 'https://msy.jharkhand.gov.in/',
    icon: <Leaf />,
  },
  {
    id: 'kcc',
    theme: 'blue',
    title: 'किसान क्रेडिट कार्ड',
    summary: 'खेती, पशुपालन और मत्स्यपालन के लिए कम ब्याज पर कर्ज।',
    benefit: '4% ब्याज · ₹3 लाख तक',
    url: 'https://pmkisan.gov.in/Documents/Kcc.pdf',
    icon: <Tractor />,
  },
  {
    id: 'soil-health',
    theme: 'green',
    title: 'मृदा स्वास्थ्य कार्ड',
    summary: 'मुफ्त मिट्टी जांच और फसल-अनुकूल सिफारिशें।',
    benefit: 'निःशुल्क',
    url: 'https://soilhealth.dac.gov.in/',
    icon: <Sprout />,
  },
  {
    id: 'fasal-bima',
    theme: 'saffron',
    title: 'PM फसल बीमा योजना',
    summary: 'प्राकृतिक आपदा से फसल नुकसान पर क्षतिपूर्ति।',
    benefit: 'खरीफ 2% · रबी 1.5% प्रीमियम',
    url: 'https://pmfby.gov.in/',
    icon: <Leaf />,
  },
]

type Props = {
  onOpen: (url: string) => void
}

export function SchemesSection({ onOpen }: Props) {
  return (
    <section id="schemes" className="content-section schemes-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">सरकारी योजनाएं</p>
          <h2>किसानों और परिवारों के लिए</h2>
        </div>
      </div>
      <div className="schemes-grid">
        {SCHEMES.map((scheme) => (
          <button
            type="button"
            key={scheme.id}
            className={`scheme-tile scheme-${scheme.theme}`}
            onClick={() => onOpen(scheme.url)}
          >
            <span className="scheme-icon">{scheme.icon}</span>
            <b>{scheme.title}</b>
            <p>{scheme.summary}</p>
            <span className="scheme-benefit">{scheme.benefit}</span>
            <span className="scheme-cta">
              विवरण <ArrowRight aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

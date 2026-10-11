'use client'

// News grid driven by lib/news.ts (Google News RSS for Jharkhand). Each
// category gets a distinct color pill so users can scan the feed quickly.
import { Fragment, useState } from 'react'
import { ExternalLink, RefreshCw, Share2 } from 'lucide-react'
import type { NewsResult, NewsItem } from '@/lib/news'
import { shareText } from '@/lib/share'
import { NativeAdSlot } from './native-ad-slot'

const CATEGORY_CLASS: Record<NewsItem['category'], string> = {
  'भूमि रिकॉर्ड': 'news-cat-blue',
  'किसान योजना': 'news-cat-saffron',
  'मंडी भाव': 'news-cat-green',
  'झारखंड': 'news-cat-rose',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diff) || diff < 0) return ''
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `${mins} मिनट पहले`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} घंटे पहले`
  const days = Math.round(hrs / 24)
  return `${days} दिन पहले`
}

type Props = {
  data: NewsResult | null
  loading: boolean
  error: string | null
  onReload: () => void
  onOpen: (url: string) => void
  onToast?: (message: string) => void
}

export function NewsSection({ data, loading, error, onReload, onOpen, onToast }: Props) {
  async function shareItem(item: NewsItem) {
    const outcome = await shareText(item.title, `${item.title} · ${item.source}`, item.link)
    if (outcome === 'shared') onToast?.('खबर साझा की गई')
    else if (outcome === 'copied') onToast?.('लिंक कॉपी हो गया')
    else if (outcome === 'failed') onToast?.('साझा नहीं हो सका')
  }

  const [filter, setFilter] = useState<'all' | NewsItem['category']>('all')
  const items = (data?.items ?? []).filter((n) => filter === 'all' || n.category === filter)

  return (
    <section id="news" className="content-section news-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ताज़ा समाचार · RSS</p>
          <h2>झारखंड की ताज़ा खबरें</h2>
        </div>
        <div className="section-toolbar">
          {data && (
            <span className={`live-badge ${data.source !== 'live' ? 'is-stale' : ''}`}>
              <span className="live-dot" />
              {data.source === 'live' ? 'लाइव' : data.source === 'cache' ? 'कैश' : 'नमूना'}
            </span>
          )}
          <button type="button" className={`refresh-btn ${loading ? 'is-loading' : ''}`} onClick={onReload} disabled={loading}>
            <RefreshCw aria-hidden="true" /> रीफ्रेश
          </button>
        </div>
      </div>

      <div className="news-filter-row" role="tablist" aria-label="श्रेणी">
        {(['all', 'भूमि रिकॉर्ड', 'किसान योजना', 'मंडी भाव', 'झारखंड'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`news-filter ${filter === key ? 'is-active' : ''} ${key !== 'all' ? CATEGORY_CLASS[key] : ''}`}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? 'सभी' : key}
          </button>
        ))}
      </div>

      {error && !data && <div className="inline-error">समाचार लोड नहीं हो सके — {error}</div>}

      {loading && !data ? (
        <div className="news-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-row" style={{ height: 150 }} />)}
        </div>
      ) : (
        <div className="news-grid">
          {items.length === 0 && <div className="news-empty">इस श्रेणी में अभी कोई खबर नहीं।</div>}
          {items.map((n, index) => (
            <Fragment key={n.id}>
              {index === 3 && <NativeAdSlot category="सहयोग" />}
            <article className={`news-card ${CATEGORY_CLASS[n.category]}`}>
              <div className="news-card-top">
                <span className="news-source-pill">{n.category}</span>
                <small>{timeAgo(n.publishedAt)}</small>
              </div>
              <h3>{n.title}</h3>
              <p>{n.source}</p>
              <div className="news-card-foot">
                <button
                  type="button"
                  className="news-read-link"
                  onClick={() => n.link.startsWith('http') && onOpen(n.link)}
                >
                  पढ़ें <ExternalLink aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="news-share-btn"
                  onClick={() => shareItem(n)}
                  aria-label="खबर साझा करें"
                >
                  <Share2 aria-hidden="true" />
                </button>
              </div>
            </article>
            </Fragment>
          ))}
        </div>
      )}
    </section>
  )
}

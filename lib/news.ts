// Live news for the app's News section.
// Source: Google News RSS search/topic feeds — no API key required, which keeps
// this working out of the box. Swap FEEDS for a licensed news API (NewsAPI,
// NewsData.io, a specific publisher's RSS) if you need a single authoritative
// source instead of an aggregator. Refreshed by /api/news on each request
// (Next.js caches per `revalidate` below) and additionally warmed on a timer by
// /api/cron/refresh so a cold cache is rare.
import { readCache, writeCache } from './cache-client'

export type NewsItem = {
  id: string
  title: string
  link: string
  source: string
  category: 'भूमि रिकॉर्ड' | 'किसान योजना' | 'मंडी भाव' | 'झारखंड'
  publishedAt: string
}

export type NewsResult = {
  items: NewsItem[]
  source: 'live' | 'cache' | 'sample'
  updatedAt: string
}

const FEEDS: { url: string; category: NewsItem['category'] }[] = [
  { url: 'https://news.google.com/rss/search?q=%E0%A4%9D%E0%A4%BE%E0%A4%B0%E0%A4%96%E0%A4%82%E0%A4%A1+%E0%A4%9C%E0%A4%AE%E0%A5%80%E0%A4%A8+%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%89%E0%A4%B0%E0%A5%8D%E0%A4%A1&hl=hi&gl=IN&ceid=IN:hi', category: 'भूमि रिकॉर्ड' },
  { url: 'https://news.google.com/rss/search?q=%E0%A4%9D%E0%A4%BE%E0%A4%B0%E0%A4%96%E0%A4%82%E0%A4%A1+%E0%A4%95%E0%A4%BF%E0%A4%B8%E0%A4%BE%E0%A4%A8+%E0%A4%AF%E0%A5%8B%E0%A4%9C%E0%A4%A8%E0%A4%BE&hl=hi&gl=IN&ceid=IN:hi', category: 'किसान योजना' },
  { url: 'https://news.google.com/rss/search?q=%E0%A4%9D%E0%A4%BE%E0%A4%B0%E0%A4%96%E0%A4%82%E0%A4%A1+%E0%A4%AE%E0%A4%82%E0%A4%A1%E0%A5%80+%E0%A4%AD%E0%A4%BE%E0%A4%B5&hl=hi&gl=IN&ceid=IN:hi', category: 'मंडी भाव' },
  { url: 'https://news.google.com/rss/headlines/section/geo/Jharkhand?hl=hi&gl=IN&ceid=IN:hi', category: 'झारखंड' },
]

const SAMPLE_NEWS: NewsItem[] = [
  { id: 'sample-1', title: 'झारखंड में ऑनलाइन दाखिल-खारिज प्रक्रिया को और सरल बनाने की तैयारी (नमूना)', link: 'https://jharbhoomi.jharkhand.gov.in/', source: 'नमूना स्रोत', category: 'भूमि रिकॉर्ड', publishedAt: new Date().toISOString() },
  { id: 'sample-2', title: 'रबी सीजन के लिए किसानों को बीज अनुदान योजना का लाभ लेने की अपील (नमूना)', link: 'https://jharsewa.jharkhand.gov.in/', source: 'नमूना स्रोत', category: 'किसान योजना', publishedAt: new Date().toISOString() },
  { id: 'sample-3', title: 'रांची मंडी में धान और मक्का के भाव में हल्की तेजी (नमूना)', link: 'https://agmarknet.gov.in/', source: 'नमूना स्रोत', category: 'मंडी भाव', publishedAt: new Date().toISOString() },
  { id: 'sample-4', title: 'झारखंड राजस्व न्यायालयों में लंबित मामलों के निपटारे के लिए विशेष अभियान (नमूना)', link: 'https://jharsewa.jharkhand.gov.in/', source: 'नमूना स्रोत', category: 'झारखंड', publishedAt: new Date().toISOString() },
]

function cleanTitle(rawTitle: string, sourceHint?: string) {
  if (sourceHint) {
    const suffix = ` - ${sourceHint}`
    if (rawTitle.endsWith(suffix)) return rawTitle.slice(0, -suffix.length).trim()
  }
  const lastDash = rawTitle.lastIndexOf(' - ')
  if (lastDash > 20) return rawTitle.slice(0, lastDash).trim()
  return rawTitle.trim()
}

function extractSource(rawTitle: string, feedSource?: string) {
  if (feedSource) return feedSource
  const lastDash = rawTitle.lastIndexOf(' - ')
  if (lastDash > 20) return rawTitle.slice(lastDash + 3).trim()
  return 'Google News'
}

// Public CORS proxy used as a second attempt: Google News RSS sends no
// CORS headers, so a direct in-app fetch is rejected by the WebView. The
// bundled sample data below remains the final fallback if both fail.
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

async function fetchText(url: string, timeoutMs = 10000): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function fetchFeedXml(feedUrl: string): Promise<string> {
  try {
    return await fetchText(feedUrl)
  } catch {
    return fetchText(`${CORS_PROXY}${encodeURIComponent(feedUrl)}`, 12000)
  }
}

function textOf(parent: Element, tag: string): string {
  const el = parent.getElementsByTagName(tag)[0]
  return el?.textContent?.trim() ?? ''
}

function parseRss(xmlText: string, feed: { url: string; category: NewsItem['category'] }): NewsItem[] {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  if (doc.querySelector('parsererror')) throw new Error('RSS parse failed')
  return Array.from(doc.getElementsByTagName('item'))
    .slice(0, 8)
    .map((item, index) => {
      const rawTitle = textOf(item, 'title')
      const sourceTag = textOf(item, 'source')
      const source = extractSource(rawTitle, sourceTag || undefined)
      return {
        id: textOf(item, 'guid') || textOf(item, 'link') || `${feed.category}-${index}`,
        title: cleanTitle(rawTitle, source),
        link: textOf(item, 'link') || '#',
        source,
        category: feed.category,
        publishedAt: textOf(item, 'pubDate') || new Date().toISOString(),
      }
    })
}

async function fetchFeed(feed: { url: string; category: NewsItem['category'] }): Promise<NewsItem[]> {
  return parseRss(await fetchFeedXml(feed.url), feed)
}

export async function fetchLiveNews(): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed)))
  const items = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  if (!items.length) throw new Error('सभी समाचार स्रोत उपलब्ध नहीं')

  const seen = new Set<string>()
  const deduped: NewsItem[] = []
  for (const item of items.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))) {
    const key = item.title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(item)
  }
  return deduped.slice(0, 18)
}

export async function getNews(): Promise<NewsResult> {
  try {
    const items = await fetchLiveNews()
    await writeCache('news', items)
    return { items, source: 'live', updatedAt: new Date().toISOString() }
  } catch (error) {
    console.warn('[news] live fetch failed, using fallback:', (error as Error).message)
    const cached = await readCache<NewsItem[]>('news')
    if (cached && cached.data.length > 0) {
      return { items: cached.data, source: 'cache', updatedAt: cached.updatedAt }
    }
    return { items: SAMPLE_NEWS, source: 'sample', updatedAt: new Date().toISOString() }
  }
}

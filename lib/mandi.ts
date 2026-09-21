// Live Jharkhand mandi (agricultural market) rates.
// Source: data.gov.in — "Variety-wise Daily Market Prices Data of Commodity"
// (the official Agmarknet feed mirrored on the Government of India Open
// Government Data platform). Get a free key at https://data.gov.in/user/register
// and set DATA_GOV_IN_API_KEY in .env.local — without one this falls back to
// data.gov.in's shared public demo key, which is rate-limited and may throttle.
import { readCache, writeCache } from './file-cache'

export type MandiRate = {
  commodity: string
  variety: string
  market: string
  district: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  unit: string
  arrivalDate: string
}

export type MandiResult = {
  rates: MandiRate[]
  source: 'live' | 'cache' | 'sample'
  updatedAt: string
}

const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070'
const DEMO_KEY = '579b464db66ec23bdd000001cdd3946e44ce69cad1302895cf6535c'

const SAMPLE_RATES: MandiRate[] = [
  { commodity: 'धान (Paddy)', variety: 'Common', market: 'Ranchi', district: 'Ranchi', minPrice: 2050, maxPrice: 2260, modalPrice: 2180, unit: '₹/क्विंटल', arrivalDate: 'नमूना डेटा' },
  { commodity: 'मक्का (Maize)', variety: 'Hybrid', market: 'Ramgarh', district: 'Ramgarh', minPrice: 1920, maxPrice: 2140, modalPrice: 2050, unit: '₹/क्विंटल', arrivalDate: 'नमूना डेटा' },
  { commodity: 'गेहूं (Wheat)', variety: 'Dara', market: 'Hazaribagh', district: 'Hazaribagh', minPrice: 2280, maxPrice: 2540, modalPrice: 2420, unit: '₹/क्विंटल', arrivalDate: 'नमूना डेटा' },
  { commodity: 'आलू (Potato)', variety: 'Jyoti', market: 'Deoghar', district: 'Deoghar', minPrice: 980, maxPrice: 1240, modalPrice: 1120, unit: '₹/क्विंटल', arrivalDate: 'नमूना डेटा' },
  { commodity: 'सरसों (Mustard)', variety: 'Black', market: 'Dumka', district: 'Dumka', minPrice: 4980, maxPrice: 5320, modalPrice: 5180, unit: '₹/क्विंटल', arrivalDate: 'नमूना डेटा' },
  { commodity: 'प्याज (Onion)', variety: 'Red', market: 'Jamshedpur', district: 'East Singhbhum', minPrice: 1450, maxPrice: 1780, modalPrice: 1620, unit: '₹/क्विंटल', arrivalDate: 'नमूना डेटा' },
]

function apiKey() {
  return process.env.DATA_GOV_IN_API_KEY?.trim() || DEMO_KEY
}

function buildUrl() {
  const params = new URLSearchParams({
    'api-key': apiKey(),
    format: 'json',
    limit: '150',
    'filters[state]': 'Jharkhand',
  })
  return `https://api.data.gov.in/resource/${RESOURCE_ID}?${params.toString()}`
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function normalize(record: Record<string, unknown>): MandiRate | null {
  const modal = toNumber(record.modal_price)
  const commodity = typeof record.commodity === 'string' ? record.commodity : ''
  if (!commodity || modal <= 0) return null
  return {
    commodity,
    variety: (record.variety as string) || '—',
    market: (record.market as string) || (record.district as string) || '—',
    district: (record.district as string) || '—',
    minPrice: toNumber(record.min_price) || modal,
    maxPrice: toNumber(record.max_price) || modal,
    modalPrice: modal,
    unit: '₹/क्विंटल',
    arrivalDate: (record.arrival_date as string) || '—',
  }
}

export async function fetchLiveMandiRates(): Promise<MandiRate[]> {
  const res = await fetch(buildUrl(), {
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`data.gov.in responded with ${res.status}`)
  const json = (await res.json()) as { records?: Record<string, unknown>[] }
  const records = Array.isArray(json.records) ? json.records : []
  const rates = records
    .map(normalize)
    .filter((rate): rate is MandiRate => rate !== null)
  if (!rates.length) throw new Error('data.gov.in returned no Jharkhand mandi records')
  return rates
}

export async function getMandiRates(): Promise<MandiResult> {
  try {
    const rates = await fetchLiveMandiRates()
    await writeCache('mandi', rates)
    return { rates, source: 'live', updatedAt: new Date().toISOString() }
  } catch (error) {
    console.warn('[mandi] live fetch failed, using fallback:', (error as Error).message)
    const cached = await readCache<MandiRate[]>('mandi')
    if (cached && cached.data.length > 0) {
      return { rates: cached.data, source: 'cache', updatedAt: cached.updatedAt }
    }
    return { rates: SAMPLE_RATES, source: 'sample', updatedAt: new Date().toISOString() }
  }
}

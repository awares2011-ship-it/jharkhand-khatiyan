// Live weather via Open-Meteo (free, no API key, CORS-enabled) so the app's
// weather card shows real data instead of hardcoded placeholders.
export type WeatherNow = {
  temp: number
  humidity: number
  wind: number
  code: number
  label: string
  updatedAt: string
}

export const RANCHI_COORDS = { lat: 23.36, lon: 85.33, name: 'Ranchi' }

function codeToHindi(code: number): string {
  if (code === 0) return 'साफ आसमान'
  if (code <= 3) return 'आंशिक बादल'
  if (code <= 48) return 'कोहरा / धुंध'
  if (code <= 57) return 'बूंदाबांदी'
  if (code <= 67) return 'बारिश'
  if (code <= 77) return 'हल्की बर्फबारी'
  if (code <= 82) return 'बौछारें'
  if (code <= 86) return 'बर्फीली बौछारें'
  return 'आंधी-तूफान'
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherNow> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`मौसम सेवा विफल (${res.status})`)
  const json = (await res.json()) as {
    current?: { temperature_2m?: number; relative_humidity_2m?: number; weather_code?: number; wind_speed_10m?: number }
  }
  const current = json.current
  if (!current || typeof current.temperature_2m !== 'number') throw new Error('मौसम डेटा खाली')
  const code = current.weather_code ?? 0
  return {
    temp: Math.round(current.temperature_2m),
    humidity: current.relative_humidity_2m ?? 0,
    wind: Math.round(current.wind_speed_10m ?? 0),
    code,
    label: codeToHindi(code),
    updatedAt: new Date().toISOString(),
  }
}

export function getRanchiWeather(): Promise<WeatherNow> {
  return fetchWeather(RANCHI_COORDS.lat, RANCHI_COORDS.lon)
}

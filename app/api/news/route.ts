import { NextResponse } from 'next/server'
import { getNews } from '@/lib/news'

export const revalidate = 1800

export async function GET() {
  const result = await getNews()
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600' },
  })
}

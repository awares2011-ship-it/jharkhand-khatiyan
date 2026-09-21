// Hit by vercel.json's cron schedule (or any external scheduler such as
// cron-job.org / GitHub Actions) to warm the mandi + news file cache ahead of
// user requests, so /api/mandi and /api/news almost never hit a cold cache.
// Protect with CRON_SECRET in production: set it in your environment and pass
// it back as ?secret=... or an `Authorization: Bearer <secret>` header.
import { NextResponse, type NextRequest } from 'next/server'
import { getMandiRates } from '@/lib/mandi'
import { getNews } from '@/lib/news'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // no secret configured yet — allow (dev convenience)
  const header = request.headers.get('authorization')
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
  const query = request.nextUrl.searchParams.get('secret')
  return bearer === secret || query === secret
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const [mandi, news] = await Promise.allSettled([getMandiRates(), getNews()])

  return NextResponse.json({
    ok: true,
    refreshedAt: new Date().toISOString(),
    mandi: mandi.status === 'fulfilled' ? { source: mandi.value.source, count: mandi.value.rates.length } : { error: mandi.reason?.message },
    news: news.status === 'fulfilled' ? { source: news.value.source, count: news.value.items.length } : { error: news.reason?.message },
  })
}

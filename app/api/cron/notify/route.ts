// Hit every 3 hours by vercel.json's cron schedule (or any external scheduler)
// to push a rotating, color-themed retention notification to every subscribed
// device. Protect with CRON_SECRET in production.
import { NextResponse, type NextRequest } from 'next/server'
import webpush from 'web-push'
import { pruneSubscriptions, readSubscriptions } from '@/lib/subscriptions'
import { pickNotificationPayload } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // no secret configured yet — allow (dev convenience)
  const header = request.headers.get('authorization')
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
  const query = request.nextUrl.searchParams.get('secret')
  return bearer === secret || query === secret
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (!configureWebPush()) {
    return NextResponse.json(
      { ok: false, error: 'VAPID keys not configured — set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY (see .env.local.example)' },
      { status: 500 },
    )
  }

  const { theme, message } = pickNotificationPayload()
  const subscriptions = await readSubscriptions()
  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    theme: theme.id,
    color: theme.color,
    url: '/',
  })

  const dead: string[] = []
  let sent = 0
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
        sent += 1
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) dead.push(sub.endpoint)
      }
    }),
  )
  await pruneSubscriptions(dead)

  return NextResponse.json({
    ok: true,
    theme: theme.id,
    title: message.title,
    sent,
    pruned: dead.length,
    totalSubscribers: subscriptions.length - dead.length,
  })
}

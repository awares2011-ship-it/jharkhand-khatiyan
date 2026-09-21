import { NextResponse } from 'next/server'
import { addSubscription } from '@/lib/subscriptions'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ ok: false, error: 'invalid subscription payload' }, { status: 400 })
  }
  const subscribers = await addSubscription({
    endpoint: body.endpoint,
    keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
    subscribedAt: new Date().toISOString(),
  })
  return NextResponse.json({ ok: true, subscribers })
}

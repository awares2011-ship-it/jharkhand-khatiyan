import { NextResponse } from 'next/server'
import { removeSubscription } from '@/lib/subscriptions'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.endpoint) {
    return NextResponse.json({ ok: false, error: 'endpoint required' }, { status: 400 })
  }
  const subscribers = await removeSubscription(body.endpoint)
  return NextResponse.json({ ok: true, subscribers })
}

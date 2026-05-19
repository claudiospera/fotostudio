import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe non configurato' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Firma webhook non valida' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    if (orderId) {
      await sql`
        UPDATE shop_orders
        SET payment_status = 'paid', status = 'confirmed', updated_at = now()
        WHERE id = ${orderId}
      `
    }
  }

  return NextResponse.json({ ok: true })
}

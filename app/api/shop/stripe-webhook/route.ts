import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '@/lib/db'
import { notifyNewOrder } from '@/lib/notify-order'

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
      // Recupera i dati ordine per la notifica
      const rows = await sql`SELECT * FROM shop_orders WHERE id = ${orderId}`
      const order = rows[0]
      if (order) {
        await notifyNewOrder({
          orderId,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          items: order.items,
          total: order.total,
          paymentMethod: 'stripe',
          couponCode: order.coupon_code ?? undefined,
          discount: order.discount || undefined,
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}

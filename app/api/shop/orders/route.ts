import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import Stripe from 'stripe'
import { notifyNewOrder } from '@/lib/notify-order'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// POST — crea un ordine, ritorna { orderId } oppure { stripeUrl }
export async function POST(req: NextRequest) {
  const { customer, items, total, paymentMethod, couponCode, discount } = await req.json()

  if (!customer?.name || !customer?.email || !customer?.phone) {
    return NextResponse.json({ error: 'Dati cliente mancanti' }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 })
  }

  // Verifica server-side del coupon (se presente)
  let verifiedDiscount = 0
  if (couponCode) {
    const subtotal = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0)
    const couponRows = await sql`
      SELECT * FROM shop_coupons
      WHERE code = ${couponCode}
        AND active = true
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
        AND (max_uses IS NULL OR used_count < max_uses)
    `
    if (couponRows.length > 0) {
      const c = couponRows[0]
      verifiedDiscount = c.type === 'percent'
        ? Math.round(subtotal * c.value / 100)
        : Math.min(c.value, subtotal)
    }
  }

  // Il total arrivato dal client è già il finalTotal (subtotale - sconto applicato lato client)
  const safeTotal = Math.max(0, total)

  // Salva l'ordine nel DB
  const rows = await sql`
    INSERT INTO shop_orders
      (status, payment_method, payment_status, customer_name, customer_email, customer_phone, notes, items, total, coupon_code, discount)
    VALUES (
      'pending',
      ${paymentMethod},
      'unpaid',
      ${customer.name},
      ${customer.email},
      ${customer.phone},
      ${customer.notes ?? null},
      ${JSON.stringify(items)},
      ${safeTotal},
      ${couponCode ?? null},
      ${verifiedDiscount}
    )
    RETURNING id
  `
  const orderId = rows[0].id

  // Incrementa uso coupon
  if (couponCode && verifiedDiscount > 0) {
    await sql`UPDATE shop_coupons SET used_count = used_count + 1 WHERE code = ${couponCode}`
  }

  // Pagamento allo studio → conferma diretta + notifica immediata
  if (paymentMethod === 'studio') {
    await notifyNewOrder({ orderId, customerName: customer.name, customerEmail: customer.email, customerPhone: customer.phone, items, total, paymentMethod })
    return NextResponse.json({ orderId })
  }

  // Pagamento online → crea sessione Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe non configurato' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey)

  const lineItems = items.map((item: {
    productName: string; variantLabel: string; image: string; price: number; quantity: number
  }) => ({
    price_data: {
      currency: 'eur',
      unit_amount: item.price,
      product_data: {
        name: `${item.productName} — ${item.variantLabel}`,
        images: item.image?.startsWith('https://') ? [item.image] : [],
      },
    },
    quantity: item.quantity,
  }))

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: customer.email,
    metadata: { orderId },
    success_url: `${APP_URL}/shop/ordine-confermato?orderId=${orderId}&paid=1`,
    cancel_url: `${APP_URL}/shop/carrello`,
  })

  // Salva stripe_session_id
  await sql`
    UPDATE shop_orders SET stripe_session_id = ${session.id} WHERE id = ${orderId}
  `

  return NextResponse.json({ stripeUrl: session.url })
}

// GET — lista ordini (per la dashboard admin)
export async function GET() {
  const orders = await sql`
    SELECT * FROM shop_orders ORDER BY created_at DESC LIMIT 100
  `
  return NextResponse.json(orders)
}

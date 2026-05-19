import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import Stripe from 'stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// POST — crea un ordine, ritorna { orderId } oppure { stripeUrl }
export async function POST(req: NextRequest) {
  const { customer, items, total, paymentMethod } = await req.json()

  if (!customer?.name || !customer?.email || !customer?.phone) {
    return NextResponse.json({ error: 'Dati cliente mancanti' }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 })
  }

  // Salva l'ordine nel DB
  const rows = await sql`
    INSERT INTO shop_orders
      (status, payment_method, payment_status, customer_name, customer_email, customer_phone, notes, items, total)
    VALUES (
      'pending',
      ${paymentMethod},
      'unpaid',
      ${customer.name},
      ${customer.email},
      ${customer.phone},
      ${customer.notes ?? null},
      ${JSON.stringify(items)},
      ${total}
    )
    RETURNING id
  `
  const orderId = rows[0].id

  // Pagamento allo studio → conferma diretta
  if (paymentMethod === 'studio') {
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

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import Stripe from 'stripe'
import { notifyNewOrder } from '@/lib/notify-order'
import { PRODUCTS, getPriceForQuantity, resolveVariant } from '@/lib/shop/products'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// POST — crea un ordine, ritorna { orderId } oppure { stripeUrl }
export async function POST(req: NextRequest) {
  const { customer, items, paymentMethod, couponCode, cancelUrl } = await req.json()

  if (!customer?.name || !customer?.email || !customer?.phone) {
    return NextResponse.json({ error: 'Dati cliente mancanti' }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 })
  }

  // Verifica server-side che i prezzi inviati dal client non siano inferiori al minimo
  // legittimo per prodotto/variante/quantità — impedisce di manomettere il totale.
  // Le opzioni (cornici, passepartout, tipo carta) possono solo aggiungere costo,
  // quindi il prezzo dello scaglione base è un limite inferiore sicuro.
  // Il variantId inviato dal client è spesso composito (id base + opzioni o + id
  // della singola foto, es. "sc-10x15--a1b2c3"): resolveVariant lo riconduce alla
  // variante base del catalogo. La quantità usata per lo scaglione è aggregata per
  // variante BASE su tutto l'ordine, perché un ordine può avere più righe della
  // stessa variante (es. foto diverse stampate nello stesso formato) che insieme
  // raggiungono uno scaglione più conveniente.
  const resolved = items.map((item: { productId: string; variantId: string; quantity: number; price: number }) => {
    const product = PRODUCTS.find((p) => p.id === item.productId)
    const variant = product ? resolveVariant(product, item.variantId) : undefined
    return { item, product, variant }
  })
  const qtyByVariant = new Map<string, number>()
  for (const { item, variant } of resolved) {
    if (!variant) continue
    const key = `${item.productId}::${variant.id}`
    qtyByVariant.set(key, (qtyByVariant.get(key) ?? 0) + (Number(item.quantity) || 0))
  }
  for (const { item, product, variant } of resolved) {
    if (!product || !variant) {
      return NextResponse.json({ error: 'Prodotto non valido' }, { status: 400 })
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return NextResponse.json({ error: 'Quantità non valida' }, { status: 400 })
    }
    const totalQty = qtyByVariant.get(`${item.productId}::${variant.id}`) ?? item.quantity
    const minUnitPrice = getPriceForQuantity(variant.price, variant.priceBreaks, totalQty)
    if (typeof item.price !== 'number' || item.price < minUnitPrice) {
      return NextResponse.json({ error: 'Prezzo non valido' }, { status: 400 })
    }
  }

  // Subtotale ricalcolato dai prezzi appena validati (mai dal `total` inviato dal client)
  const subtotal = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0)

  // Verifica server-side del coupon (se presente) e riserva l'utilizzo in un'unica
  // UPDATE atomica: SELECT+UPDATE separati permetterebbero a due richieste concorrenti
  // di superare entrambe il controllo max_uses prima che l'incremento avvenga.
  let verifiedDiscount = 0
  if (couponCode) {
    const couponRows = await sql`
      UPDATE shop_coupons SET used_count = used_count + 1
      WHERE code = ${couponCode}
        AND active = true
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
        AND (max_uses IS NULL OR used_count < max_uses)
      RETURNING *
    `
    if (couponRows.length > 0) {
      const c = couponRows[0]
      verifiedDiscount = c.type === 'percent'
        ? Math.round(subtotal * c.value / 100)
        : Math.min(c.value, subtotal)
    }
  }

  const safeTotal = Math.max(0, subtotal - verifiedDiscount)

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

  // Pagamento allo studio → conferma diretta + notifica immediata
  if (paymentMethod === 'studio') {
    await notifyNewOrder({ orderId, customerName: customer.name, customerEmail: customer.email, customerPhone: customer.phone, items, total: safeTotal, paymentMethod, couponCode: couponCode ?? undefined, discount: verifiedDiscount || undefined })
    return NextResponse.json({ orderId })
  }

  // Pagamento online → crea sessione Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe non configurato' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey)

  const safeCancelUrl = typeof cancelUrl === 'string' && cancelUrl.startsWith(APP_URL)
    ? cancelUrl
    : `${APP_URL}/shop/carrello`

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
    cancel_url: safeCancelUrl,
  })

  // Salva stripe_session_id
  await sql`
    UPDATE shop_orders SET stripe_session_id = ${session.id} WHERE id = ${orderId}
  `

  return NextResponse.json({ stripeUrl: session.url })
}

// GET — lista ordini (per la dashboard admin)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const orders = await sql`
    SELECT * FROM shop_orders ORDER BY created_at DESC LIMIT 100
  `
  return NextResponse.json(orders)
}

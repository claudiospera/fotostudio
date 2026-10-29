import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import Stripe from 'stripe'
import { notifyNewOrder } from '@/lib/notify-order'
import { PRODUCTS, getPriceForQuantity, resolveVariant } from '@/lib/shop/products'
import { getCalendarLineTotal, getLineTotal } from '@/lib/shop/calendar-pricing'
import { getShippingCost } from '@/lib/shop/shipping'
import { moveInR2 } from '@/lib/r2'
import type { CartItem, DeliveryMethod, ShippingAddress } from '@/lib/shop/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const ITALIAN_ZIP = /^\d{5}$/
const ITALIAN_PROVINCE = /^[A-Za-z]{2}$/

function isValidShippingAddress(addr: unknown): addr is ShippingAddress {
  if (!addr || typeof addr !== 'object') return false
  const a = addr as Partial<ShippingAddress>
  return (
    !!a.recipientName?.trim() &&
    !!a.address?.trim() &&
    !!a.zip && ITALIAN_ZIP.test(a.zip) &&
    !!a.city?.trim() &&
    !!a.province && ITALIAN_PROVINCE.test(a.province) &&
    !!a.phone?.trim()
  )
}

// POST — crea un ordine, ritorna { orderId } oppure { stripeUrl }
export async function POST(req: NextRequest) {
  const { customer, items, paymentMethod, couponCode, cancelUrl, deliveryMethod, shippingAddress } = await req.json() as {
    customer: { name: string; email: string; phone: string; notes?: string }
    items: CartItem[]
    paymentMethod: 'online' | 'studio'
    couponCode?: string | null
    cancelUrl?: string
    deliveryMethod?: DeliveryMethod
    shippingAddress?: ShippingAddress
  }

  if (!customer?.name || !customer?.email || !customer?.phone) {
    return NextResponse.json({ error: 'Dati cliente mancanti' }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 })
  }

  const safeDeliveryMethod: DeliveryMethod = deliveryMethod === 'shipping' ? 'shipping' : 'pickup'

  if (safeDeliveryMethod === 'shipping' && !isValidShippingAddress(shippingAddress)) {
    return NextResponse.json({ error: 'Indirizzo di spedizione non valido' }, { status: 400 })
  }
  // Il pagamento in studio è disponibile solo con il ritiro in studio.
  if (safeDeliveryMethod === 'shipping' && paymentMethod === 'studio') {
    return NextResponse.json({ error: 'Il pagamento in studio è disponibile solo con il ritiro' }, { status: 400 })
  }

  const calendarItems = items.filter(i => i.kind === 'calendar')
  const regularItems = items.filter(i => i.kind !== 'calendar')

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
  const resolved = regularItems.map((item) => {
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

  // Validazione righe calendario: modello attivo, numero foto corretto, lineTotal
  // non inferiore allo scaglione legittimo (1ª copia prezzo pieno, successive scontate).
  if (calendarItems.length > 0) {
    const codes = Array.from(new Set(calendarItems.map(i => i.modelCode).filter(Boolean))) as string[]
    const modelRows = codes.length > 0
      ? await sql`SELECT code, format, photo_slots, active FROM calendar_models WHERE code = ANY(${codes})`
      : []
    const modelByCode = new Map(modelRows.map(m => [m.code as string, m]))

    for (const item of calendarItems) {
      const model = item.modelCode ? modelByCode.get(item.modelCode) : undefined
      if (!model || !model.active) {
        return NextResponse.json({ error: 'Modello calendario non disponibile' }, { status: 400 })
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: 'Quantità non valida' }, { status: 400 })
      }
      if (!Array.isArray(item.photoKeys) || item.photoKeys.length !== model.photo_slots) {
        return NextResponse.json({ error: 'Numero di foto non valido per questo calendario' }, { status: 400 })
      }
      const minLineTotal = getCalendarLineTotal(model.format, item.quantity)
      if (typeof item.lineTotal !== 'number' || item.lineTotal < minLineTotal) {
        return NextResponse.json({ error: 'Prezzo calendario non valido' }, { status: 400 })
      }
    }
  }

  // Subtotale ricalcolato dai prezzi/lineTotal appena validati (mai dal `total` inviato dal client)
  const subtotal = items.reduce((sum, i) => sum + getLineTotal(i), 0)

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

  const subtotalAfterDiscount = Math.max(0, subtotal - verifiedDiscount)
  // Costo di spedizione ricalcolato lato server sul subtotale DOPO lo sconto — mai dal client.
  const shippingCost = getShippingCost(subtotalAfterDiscount, safeDeliveryMethod)
  const safeTotal = subtotalAfterDiscount + shippingCost

  // Salva l'ordine nel DB
  const rows = await sql`
    INSERT INTO shop_orders
      (status, payment_method, payment_status, customer_name, customer_email, customer_phone, notes, items, total, coupon_code, discount, delivery_method, shipping_cost, shipping_address)
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
      ${verifiedDiscount},
      ${safeDeliveryMethod},
      ${shippingCost},
      ${safeDeliveryMethod === 'shipping' ? JSON.stringify(shippingAddress) : null}
    )
    RETURNING id
  `
  const orderId = rows[0].id

  // Sposta le foto calendario da calendari/tmp/ a calendari/ordini/<id>/ ora che
  // l'ordine è confermato, e riscrive items con i nuovi URL/key.
  let finalItems = items
  if (calendarItems.length > 0) {
    finalItems = await Promise.all(items.map(async (item) => {
      if (item.kind !== 'calendar' || !item.photoKeys) return item
      const movedKeys: string[] = []
      const movedUrls: string[] = []
      for (const key of item.photoKeys) {
        const filename = key.split('/').pop()
        const toKey = `calendari/ordini/${orderId}/${filename}`
        const url = await moveInR2(key, toKey)
        movedKeys.push(toKey)
        movedUrls.push(url)
      }
      return { ...item, photoKeys: movedKeys, photoUrls: movedUrls }
    }))
    await sql`UPDATE shop_orders SET items = ${JSON.stringify(finalItems)} WHERE id = ${orderId}`
  }

  // Pagamento allo studio → conferma diretta + notifica immediata
  if (paymentMethod === 'studio') {
    await notifyNewOrder({
      orderId, customerName: customer.name, customerEmail: customer.email, customerPhone: customer.phone,
      items: finalItems, total: safeTotal, paymentMethod, couponCode: couponCode ?? undefined, discount: verifiedDiscount || undefined,
      deliveryMethod: safeDeliveryMethod, shippingCost, shippingAddress: safeDeliveryMethod === 'shipping' ? shippingAddress : undefined,
    })
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

  // Le righe calendario hanno un prezzo a scaglione (1ª copia prezzo pieno,
  // successive scontate): su Stripe diventano un'unica riga con quantity:1 e
  // unit_amount = lineTotal, perché price × quantity non è un multiplo esatto
  // per quantità dispari (es. 3 copie = 2600, non divisibile per 3).
  const lineItems = finalItems.map((item) => ({
    price_data: {
      currency: 'eur',
      unit_amount: item.kind === 'calendar' ? getLineTotal(item) : item.price,
      product_data: {
        name: `${item.productName} — ${item.variantLabel}`,
        images: item.image?.startsWith('https://') ? [item.image] : [],
      },
    },
    quantity: item.kind === 'calendar' ? 1 : item.quantity,
  }))

  // Spedizione come riga separata, così la somma delle righe Stripe corrisponde a shop_orders.total.
  if (shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: shippingCost,
        product_data: { name: 'Spedizione a domicilio', images: [] },
      },
      quantity: 1,
    })
  }

  // Lo sconto coupon va espresso a Stripe come discount a parte: le righe sopra sono
  // sempre a prezzo pieno, quindi senza questo il totale Stripe non corrisponderebbe
  // a shop_orders.total (che ha già il sconto sottratto).
  let discounts: { coupon: string }[] | undefined
  if (verifiedDiscount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: verifiedDiscount,
      currency: 'eur',
      duration: 'once',
      name: couponCode ? `Sconto ${couponCode}` : 'Sconto',
    })
    discounts = [{ coupon: coupon.id }]
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    discounts,
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

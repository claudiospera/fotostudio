import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

interface CartItemInput {
  productId: string
  price: number
  quantity: number
}

export async function POST(req: NextRequest) {
  const { code, total, items } = await req.json() as {
    code: string
    total: number
    items?: CartItemInput[]
  }

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Codice non valido' }, { status: 400 })
  }

  const rows = await sql`
    SELECT * FROM shop_coupons
    WHERE code = ${code.trim().toUpperCase()}
      AND active = true
      AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
      AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
      AND (max_uses IS NULL OR used_count < max_uses)
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Codice sconto non valido o scaduto' }, { status: 404 })
  }

  const coupon = rows[0]
  const productIds: string[] = coupon.product_ids ?? []

  // Calcola la base imponibile: tutti gli item se nessuna restrizione,
  // altrimenti solo gli item dei prodotti inclusi nel coupon
  let taxableTotal = total
  let hasMatchingItems = true

  if (productIds.length > 0 && Array.isArray(items) && items.length > 0) {
    const matchingItems = items.filter(i => productIds.includes(i.productId))
    if (matchingItems.length === 0) {
      return NextResponse.json(
        { error: 'Questo codice sconto non è valido per i prodotti nel carrello' },
        { status: 404 }
      )
    }
    taxableTotal = matchingItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    hasMatchingItems = matchingItems.length > 0
  }

  if (!hasMatchingItems) {
    return NextResponse.json(
      { error: 'Questo codice sconto non è valido per i prodotti nel carrello' },
      { status: 404 }
    )
  }

  let discount = 0
  let label = ''

  if (coupon.type === 'percent') {
    discount = Math.round(taxableTotal * coupon.value / 100)
    const scope = productIds.length > 0 ? ' (prodotti selezionati)' : ''
    label = `${coupon.code} — ${coupon.value}% di sconto${scope}`
  } else {
    discount = Math.min(coupon.value, taxableTotal)
    const euros = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(coupon.value / 100)
    const scope = productIds.length > 0 ? ' (prodotti selezionati)' : ''
    label = `${coupon.code} — ${euros} di sconto${scope}`
  }

  return NextResponse.json({ discount, label })
}

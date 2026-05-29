import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { code, total } = await req.json()

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
  let discount = 0

  if (coupon.type === 'percent') {
    discount = Math.round(total * coupon.value / 100)
    return NextResponse.json({
      discount,
      label: `${coupon.code} — ${coupon.value}% di sconto`,
    })
  }

  // fixed
  discount = Math.min(coupon.value, total)
  const euros = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(coupon.value / 100)
  return NextResponse.json({
    discount,
    label: `${coupon.code} — ${euros} di sconto`,
  })
}

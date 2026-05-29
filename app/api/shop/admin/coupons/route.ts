import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

// GET — lista coupon
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`
    SELECT * FROM shop_coupons ORDER BY created_at DESC
  `
  return NextResponse.json(rows)
}

// POST — crea coupon
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { code, type, value, valid_from, valid_until, max_uses, product_ids } = await req.json()

  if (!code || !type || !value) {
    return NextResponse.json({ error: 'Codice, tipo e valore sono obbligatori' }, { status: 400 })
  }
  if (!['percent', 'fixed'].includes(type)) {
    return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 })
  }
  if (type === 'percent' && (value < 1 || value > 100)) {
    return NextResponse.json({ error: 'La percentuale deve essere tra 1 e 100' }, { status: 400 })
  }

  const ids: string[] = Array.isArray(product_ids) ? product_ids : []

  const rows = await sql`
    INSERT INTO shop_coupons (code, type, value, valid_from, valid_until, max_uses, product_ids)
    VALUES (
      ${code.trim().toUpperCase()},
      ${type},
      ${value},
      ${valid_from || null},
      ${valid_until || null},
      ${max_uses || null},
      ${ids}
    )
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}

// PATCH — attiva/disattiva coupon
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id, active } = await req.json()
  await sql`UPDATE shop_coupons SET active = ${active} WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}

// DELETE — elimina coupon
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await req.json()
  await sql`DELETE FROM shop_coupons WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}

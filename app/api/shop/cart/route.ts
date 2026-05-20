// app/api/shop/cart/route.ts
// Salva / recupera il carrello per l'utente loggato

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

// GET — restituisce il carrello salvato dell'utente
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ items: [] })

  const rows = await sql`
    SELECT items FROM shop_carts WHERE user_id = ${userId}
  `
  return NextResponse.json({ items: rows[0]?.items ?? [] })
}

// PUT — salva (upsert) il carrello dell'utente
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { items } = await req.json()
  if (!Array.isArray(items)) return NextResponse.json({ error: 'Dati non validi' }, { status: 400 })

  await sql`
    INSERT INTO shop_carts (user_id, items, updated_at)
    VALUES (${userId}, ${JSON.stringify(items)}, now())
    ON CONFLICT (user_id)
    DO UPDATE SET items = ${JSON.stringify(items)}, updated_at = now()
  `

  return NextResponse.json({ ok: true })
}

// DELETE — svuota il carrello salvato dell'utente
export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`DELETE FROM shop_carts WHERE user_id = ${userId}`
  return NextResponse.json({ ok: true })
}

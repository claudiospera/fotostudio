import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

// GET pubblico — solo i campi necessari per la pagina conferma ordine
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await sql`
    SELECT id, customer_name, total, discount, coupon_code, items, payment_method, payment_status,
           delivery_method, shipping_cost, shipping_address
    FROM shop_orders
    WHERE id = ${id}
  `
  if (rows.length === 0) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await params
  const { status, trackingNumber } = await req.json() as { status?: string; trackingNumber?: string }

  const validStatuses = ['pending', 'confirmed', 'ready', 'shipped', 'delivered', 'cancelled']
  if (status !== undefined && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })
  }
  if (status === undefined && trackingNumber === undefined) {
    return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 })
  }

  if (status !== undefined && trackingNumber !== undefined) {
    await sql`UPDATE shop_orders SET status = ${status}, tracking_number = ${trackingNumber}, updated_at = now() WHERE id = ${id}`
  } else if (status !== undefined) {
    await sql`UPDATE shop_orders SET status = ${status}, updated_at = now() WHERE id = ${id}`
  } else {
    await sql`UPDATE shop_orders SET tracking_number = ${trackingNumber}, updated_at = now() WHERE id = ${id}`
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM shop_orders WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}

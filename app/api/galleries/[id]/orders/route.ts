import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const gallery = await sql`SELECT id FROM galleries WHERE id = ${id} AND user_id = ${userId}`
  if (!gallery.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const data = await sql`SELECT * FROM print_orders WHERE gallery_id = ${id} ORDER BY created_at DESC`
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { order_id, status } = await req.json()

  const updated = await sql.query(
    'UPDATE print_orders SET status = $1 WHERE id = $2 AND gallery_id = $3 RETURNING *',
    [status, order_id, id]
  )
  const rows = (updated as unknown as { rows: unknown[] }).rows ?? updated
  return NextResponse.json((rows as unknown[])[0])
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const gallery = await sql`SELECT id FROM galleries WHERE id = ${id} AND user_id = ${userId}`
  if (!gallery.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const { order_id } = await req.json()
  await sql`DELETE FROM print_orders WHERE id = ${order_id} AND gallery_id = ${id}`
  return NextResponse.json({ ok: true })
}

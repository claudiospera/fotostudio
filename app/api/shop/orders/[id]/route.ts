import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()

  const validStatuses = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })
  }

  await sql`
    UPDATE shop_orders
    SET status = ${status}, updated_at = now()
    WHERE id = ${id}
  `

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

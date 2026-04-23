import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`SELECT * FROM calendari_appuntamenti WHERE id = ${id} AND user_id = ${userId}`
  if (!rows.length) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const cols = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at' && k !== 'user_id')
  const vals = cols.map(k => body[k])
  const setClauses = cols.map((k, i) => `${k} = $${i + 3}`).join(', ')

  const updated = await sql.query(
    `UPDATE calendari_appuntamenti SET ${setClauses}, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, ...vals]
  )
  const rows = (updated as unknown as { rows: unknown[] }).rows ?? updated
  if (!(rows as unknown[]).length) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  return NextResponse.json((rows as unknown[])[0])
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`DELETE FROM calendari_appuntamenti WHERE id = ${id} AND user_id = ${userId}`
  return NextResponse.json({ ok: true })
}

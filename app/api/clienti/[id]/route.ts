import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const cols = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at' && k !== 'user_id')
  const vals = cols.map(k => body[k])
  const setClauses = cols.map((k, i) => `${k} = $${i + 3}`).join(', ')

  const updated = await sql.query(
    `UPDATE clienti SET ${setClauses}, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, ...vals]
  )
  const rows = (updated as unknown as { rows: Record<string, unknown>[] }).rows ?? updated
  if (!(rows as unknown[]).length) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  const NUMERIC_FIELDS = ['importo_totale', 'acconto', 'saldo', 'album_pagine']
  const row = { ...(rows as Record<string, unknown>[])[0] }
  for (const f of NUMERIC_FIELDS) {
    if (row[f] !== null && row[f] !== undefined) row[f] = Number(row[f])
  }
  return NextResponse.json(row)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`DELETE FROM clienti WHERE id = ${id} AND user_id = ${userId}`
  return new NextResponse(null, { status: 204 })
}

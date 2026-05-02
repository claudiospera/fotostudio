import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

const JSONB_FIELDS = ['pacchetti', 'extra']

function serializeForQuery(cols: string[], vals: unknown[]): unknown[] {
  return vals.map((v, i) => {
    if (JSONB_FIELDS.includes(cols[i]) && v !== null && v !== undefined && typeof v !== 'string') {
      return JSON.stringify(v)
    }
    return v
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const cols = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at' && k !== 'user_id')
  const rawVals = cols.map(k => body[k])
  const vals = serializeForQuery(cols, rawVals)
  const setClauses = cols.map((k, i) => `${k} = $${i + 3}`).join(', ')

  const updated = await sql.query(
    `UPDATE clienti SET ${setClauses}, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, ...vals]
  )
  const rows = (updated as unknown as { rows: Record<string, unknown>[] }).rows ?? updated
  if (!(rows as unknown[]).length) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  const NUMERIC_FIELDS = ['importo_totale', 'acconto', 'saldo', 'album_pagine']
  const DATE_FIELDS = ['data_evento', 'data_acconto', 'data_saldo']
  const row = { ...(rows as Record<string, unknown>[])[0] }
  for (const f of NUMERIC_FIELDS) {
    if (row[f] !== null && row[f] !== undefined) row[f] = Number(row[f])
  }
  for (const f of DATE_FIELDS) {
    if (row[f] instanceof Date) {
      row[f] = (row[f] as Date).toISOString().slice(0, 10)
    } else if (typeof row[f] === 'string' && row[f]) {
      row[f] = (row[f] as string).slice(0, 10)
    }
  }
  if (!Array.isArray(row['pacchetti'])) row['pacchetti'] = []
  return NextResponse.json(row)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`DELETE FROM clienti WHERE id = ${id} AND user_id = ${userId}`
  return new NextResponse(null, { status: 204 })
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

const NUMERIC_FIELDS = ['importo_totale', 'acconto', 'saldo', 'album_pagine']

function normalizeCliente(row: Record<string, unknown>) {
  const out = { ...row }
  for (const f of NUMERIC_FIELDS) {
    if (out[f] !== null && out[f] !== undefined) out[f] = Number(out[f])
  }
  return out
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await sql`
    SELECT * FROM clienti WHERE user_id = ${userId}
    ORDER BY data_evento ASC NULLS LAST
  `
  return NextResponse.json((data as Record<string, unknown>[]).map(normalizeCliente))
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const body = await req.json()
  const cols = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at')
  const vals = cols.map(k => body[k])
  const colList = ['user_id', ...cols].join(', ')
  const placeholders = ['$1', ...cols.map((_, i) => `$${i + 2}`)].join(', ')

  const updated = await sql.query(
    `INSERT INTO clienti (${colList}) VALUES (${placeholders}) RETURNING *`,
    [userId, ...vals]
  )
  const rows = (updated as unknown as { rows: Record<string, unknown>[] }).rows ?? updated
  return NextResponse.json(normalizeCliente((rows as Record<string, unknown>[])[0]), { status: 201 })
}

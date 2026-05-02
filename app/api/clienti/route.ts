import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

const NUMERIC_FIELDS = ['importo_totale', 'acconto', 'saldo', 'album_pagine']
const JSONB_FIELDS = ['pacchetti', 'extra']
const DATE_FIELDS = ['data_evento', 'data_acconto', 'data_saldo']

function normalizeCliente(row: Record<string, unknown>) {
  const out = { ...row }
  for (const f of NUMERIC_FIELDS) {
    if (out[f] !== null && out[f] !== undefined) out[f] = Number(out[f])
  }
  for (const f of DATE_FIELDS) {
    if (out[f] instanceof Date) {
      out[f] = (out[f] as Date).toISOString().slice(0, 10)
    } else if (typeof out[f] === 'string' && out[f]) {
      out[f] = (out[f] as string).slice(0, 10)
    }
  }
  // Garantisce che pacchetti sia sempre un array
  if (!Array.isArray(out['pacchetti'])) out['pacchetti'] = []
  return out
}

function serializeForQuery(cols: string[], vals: unknown[]): unknown[] {
  return vals.map((v, i) => {
    if (JSONB_FIELDS.includes(cols[i]) && v !== null && v !== undefined && typeof v !== 'string') {
      return JSON.stringify(v)
    }
    return v
  })
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
  const rawVals = cols.map(k => body[k])
  const vals = serializeForQuery(cols, rawVals)
  const colList = ['user_id', ...cols].join(', ')
  const placeholders = ['$1', ...cols.map((_, i) => `$${i + 2}`)].join(', ')

  try {
    const updated = await sql.query(
      `INSERT INTO clienti (${colList}) VALUES (${placeholders}) RETURNING *`,
      [userId, ...vals]
    )
    const rows = (updated as unknown as { rows: Record<string, unknown>[] }).rows ?? updated
    return NextResponse.json(normalizeCliente((rows as Record<string, unknown>[])[0]), { status: 201 })
  } catch (err) {
    console.error('Errore inserimento cliente:', err)
    return NextResponse.json({ error: 'Errore durante il salvataggio' }, { status: 500 })
  }
}

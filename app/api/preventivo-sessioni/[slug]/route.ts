import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// GET — pubblica, legge la sessione (senza auth — per il cliente)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rows = await sql`
    SELECT * FROM preventivo_sessioni WHERE slug = ${slug} AND expires_at > now()
  `
  if (rows.length === 0) return NextResponse.json({ error: 'Non trovato o scaduto' }, { status: 404 })

  const row = rows[0]
  return NextResponse.json({
    ...row,
    voci: row.voci,
    selected: row.selected,
  })
}

// PATCH — pubblica, aggiorna le selezioni del cliente
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { selected } = await req.json()

  if (!Array.isArray(selected)) {
    return NextResponse.json({ error: 'selected deve essere un array' }, { status: 400 })
  }

  const rows = await sql`
    UPDATE preventivo_sessioni
    SET selected = ${JSON.stringify(selected)}
    WHERE slug = ${slug} AND expires_at > now()
    RETURNING *
  `
  if (rows.length === 0) return NextResponse.json({ error: 'Non trovato o scaduto' }, { status: 404 })
  return NextResponse.json({ ok: true, selected })
}

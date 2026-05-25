import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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

// PATCH — pubblica, aggiorna le selezioni e/o la firma del cliente
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await req.json()
  const { selected, firma, firmato_at } = body

  if (selected !== undefined && !Array.isArray(selected)) {
    return NextResponse.json({ error: 'selected deve essere un array' }, { status: 400 })
  }

  // Aggiorna solo i campi presenti nel body
  if (firma !== undefined && firmato_at !== undefined) {
    const rows = await sql`
      UPDATE preventivo_sessioni
      SET
        selected   = COALESCE(${selected !== undefined ? JSON.stringify(selected) : null}::jsonb, selected),
        firma      = ${firma},
        firmato_at = ${firmato_at}
      WHERE slug = ${slug} AND expires_at > now()
      RETURNING *
    `
    if (rows.length === 0) return NextResponse.json({ error: 'Non trovato o scaduto' }, { status: 404 })
    return NextResponse.json({ ok: true, firma: rows[0].firma, firmato_at: rows[0].firmato_at })
  }

  if (selected !== undefined) {
    const rows = await sql`
      UPDATE preventivo_sessioni
      SET selected = ${JSON.stringify(selected)}
      WHERE slug = ${slug} AND expires_at > now()
      RETURNING *
    `
    if (rows.length === 0) return NextResponse.json({ error: 'Non trovato o scaduto' }, { status: 404 })
    return NextResponse.json({ ok: true, selected })
  }

  return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 })
}

// DELETE — rimuove la sessione (richiede auth)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { slug } = await params
  const rows = await sql`
    DELETE FROM preventivo_sessioni
    WHERE slug = ${slug} AND user_id = ${userId}
    RETURNING id
  `
  if (rows.length === 0) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

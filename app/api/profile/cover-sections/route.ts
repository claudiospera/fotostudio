import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

// GET/PATCH /api/profile/cover-sections — libreria "Crea Copertina" del
// fotografo: colori/decori per occasione (cover_sections) e rivestimenti
// disponibili (cover_materials, es. Tela/Similpelle) — entrambi globali,
// condivisi da tutte le gallerie. Salvati su profiles.

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`SELECT cover_sections, cover_materials FROM profiles WHERE id = ${userId}`
  return NextResponse.json({
    cover_sections: rows[0]?.cover_sections ?? {},
    cover_materials: rows[0]?.cover_materials ?? ['Tela', 'Similpelle'],
  })
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { cover_sections, cover_materials } = await request.json()
  if (cover_sections !== undefined && typeof cover_sections !== 'object') {
    return NextResponse.json({ error: 'Dati sezioni non validi' }, { status: 400 })
  }
  if (cover_materials !== undefined && !Array.isArray(cover_materials)) {
    return NextResponse.json({ error: 'Dati rivestimenti non validi' }, { status: 400 })
  }

  const updates: string[] = []
  const vals: unknown[] = []
  if (cover_sections !== undefined) { updates.push(`cover_sections = $${vals.length + 2}::jsonb`); vals.push(JSON.stringify(cover_sections)) }
  if (cover_materials !== undefined) { updates.push(`cover_materials = $${vals.length + 2}::jsonb`); vals.push(JSON.stringify(cover_materials)) }
  if (updates.length === 0) return NextResponse.json({ error: 'Nessun campo' }, { status: 400 })

  await sql.query(`UPDATE profiles SET ${updates.join(', ')} WHERE id = $1`, [userId, ...vals])
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

// GET/PATCH /api/profile/cover-sections — libreria "Crea Copertina" del
// fotografo: colori globali (cover_colors), categorie di decori
// (cover_decor_categories, es. Animali/Piante e fiori/Altro) e rivestimenti
// disponibili (cover_materials, es. Tela/Similpelle) — tutti globali,
// condivisi da tutte le gallerie. Salvati su profiles.

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`SELECT cover_colors, cover_decor_categories, cover_materials FROM profiles WHERE id = ${userId}`
  return NextResponse.json({
    cover_colors: rows[0]?.cover_colors ?? [],
    cover_decor_categories: rows[0]?.cover_decor_categories ?? [],
    cover_materials: rows[0]?.cover_materials ?? ['Tela', 'Similpelle'],
  })
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { cover_colors, cover_decor_categories, cover_materials } = await request.json()
  if (cover_colors !== undefined && !Array.isArray(cover_colors)) {
    return NextResponse.json({ error: 'Dati colori non validi' }, { status: 400 })
  }
  if (cover_decor_categories !== undefined && !Array.isArray(cover_decor_categories)) {
    return NextResponse.json({ error: 'Dati categorie decori non validi' }, { status: 400 })
  }
  if (cover_materials !== undefined && !Array.isArray(cover_materials)) {
    return NextResponse.json({ error: 'Dati rivestimenti non validi' }, { status: 400 })
  }

  const updates: string[] = []
  const vals: unknown[] = []
  if (cover_colors !== undefined) { updates.push(`cover_colors = $${vals.length + 2}::jsonb`); vals.push(JSON.stringify(cover_colors)) }
  if (cover_decor_categories !== undefined) { updates.push(`cover_decor_categories = $${vals.length + 2}::jsonb`); vals.push(JSON.stringify(cover_decor_categories)) }
  if (cover_materials !== undefined) { updates.push(`cover_materials = $${vals.length + 2}::jsonb`); vals.push(JSON.stringify(cover_materials)) }
  if (updates.length === 0) return NextResponse.json({ error: 'Nessun campo' }, { status: 400 })

  await sql.query(`UPDATE profiles SET ${updates.join(', ')} WHERE id = $1`, [userId, ...vals])
  return NextResponse.json({ ok: true })
}

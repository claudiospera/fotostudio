import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

// GET/PATCH /api/profile/cover-sections — libreria colori/decori "Crea Copertina"
// per occasione (battesimo/comunione/matrimonio/generico), condivisa da tutte le
// gallerie del fotografo. Salvata su profiles.cover_sections.

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`SELECT cover_sections FROM profiles WHERE id = ${userId}`
  return NextResponse.json(rows[0]?.cover_sections ?? {})
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { cover_sections } = await request.json()
  if (!cover_sections || typeof cover_sections !== 'object') {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 })
  }

  await sql`
    UPDATE profiles SET cover_sections = ${JSON.stringify(cover_sections)}::jsonb
    WHERE id = ${userId}
  `
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!.trim()

// GET — lista completa modelli (anche non attivi), per l'admin
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`
    SELECT id, code, title, format, category, photo_slots, thumb_key, active, sort_order
    FROM calendar_models
    ORDER BY sort_order ASC, code ASC
  `
  const items = rows.map(m => ({
    id: m.id as string,
    code: m.code as string,
    title: (m.title as string) || (m.code as string),
    format: m.format as string,
    category: m.category as string,
    photoSlots: m.photo_slots as number,
    thumbUrl: `${publicUrl}/${m.thumb_key}`,
    active: m.active as boolean,
    sortOrder: m.sort_order as number,
  }))
  return NextResponse.json(items)
}

// PATCH — aggiorna un singolo modello (categoria, numero foto, attivo)
// oppure, se il body contiene `reorder`, aggiorna in blocco il sort_order
// di più modelli (drag & drop).
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()

  if (Array.isArray(body.reorder)) {
    for (const { id, sortOrder } of body.reorder as { id: string; sortOrder: number }[]) {
      await sql`UPDATE calendar_models SET sort_order = ${sortOrder}, updated_at = now() WHERE id = ${id}`
    }
    return NextResponse.json({ ok: true })
  }

  const { id, category, photoSlots, active } = body
  if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })

  if (category !== undefined) {
    await sql`UPDATE calendar_models SET category = ${category}, updated_at = now() WHERE id = ${id}`
  }
  if (photoSlots !== undefined) {
    if (!Number.isInteger(photoSlots) || photoSlots < 1) {
      return NextResponse.json({ error: 'Numero foto non valido' }, { status: 400 })
    }
    await sql`UPDATE calendar_models SET photo_slots = ${photoSlots}, updated_at = now() WHERE id = ${id}`
  }
  if (active !== undefined) {
    await sql`UPDATE calendar_models SET active = ${active}, updated_at = now() WHERE id = ${id}`
  }

  return NextResponse.json({ ok: true })
}

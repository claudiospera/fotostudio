import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!.trim()

// GET /api/shop/calendari/models/[code] — pubblica. Dettaglio di un modello attivo.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const rows = await sql`
    SELECT code, title, format, category, photo_slots, image_key, thumb_key
    FROM calendar_models
    WHERE code = ${code} AND active = true
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Modello non trovato' }, { status: 404 })
  }
  const m = rows[0]
  return NextResponse.json({
    code: m.code as string,
    title: (m.title as string) || (m.code as string),
    format: m.format as string,
    category: m.category as string,
    photoSlots: m.photo_slots as number,
    imageUrl: `${publicUrl}/${m.image_key}`,
    thumbUrl: `${publicUrl}/${m.thumb_key}`,
  })
}

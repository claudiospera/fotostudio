import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!.trim()

// GET /api/shop/calendari/models — pubblica. Ritorna i modelli attivi + il banner
// scadenza ordini impostato da admin.
export async function GET() {
  const [models, settingsRows] = await Promise.all([
    sql`
      SELECT code, title, format, category, photo_slots, image_key, thumb_key
      FROM calendar_models
      WHERE active = true
      ORDER BY sort_order ASC, code ASC
    `,
    sql`SELECT banner_text, banner_date FROM calendar_settings WHERE id = 1`,
  ])

  const items = models.map(m => ({
    code: m.code as string,
    title: (m.title as string) || (m.code as string),
    format: m.format as string,
    category: m.category as string,
    photoSlots: m.photo_slots as number,
    imageUrl: `${publicUrl}/${m.image_key}`,
    thumbUrl: `${publicUrl}/${m.thumb_key}`,
  }))

  const settings = settingsRows[0]
    ? { bannerText: settingsRows[0].banner_text as string | null, bannerDate: settingsRows[0].banner_date as string | null }
    : { bannerText: null, bannerDate: null }

  return NextResponse.json({ items, settings })
}

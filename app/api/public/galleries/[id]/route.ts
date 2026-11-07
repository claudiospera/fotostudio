import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { CoverSections } from '@/lib/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const rows = await sql`
    SELECT
      g.id, g.name, g.subtitle, g.type, g.date, g.status,
      g.cover_color, g.cover_url, g.settings,
      COALESCE(
        (SELECT json_agg(
          json_build_object('id', p.id, 'url', p.url, 'filename', p.filename,
            'size_bytes', p.size_bytes, 'order_index', p.order_index, 'created_at', p.created_at)
          ORDER BY p.filename)
         FROM photos p WHERE p.gallery_id = g.id),
        '[]'::json
      ) AS photos,
      (SELECT json_build_object('name', pr.name, 'studio_name', pr.studio_name)
       FROM profiles pr WHERE pr.id = g.user_id) AS profiles,
      (SELECT pr.cover_sections FROM profiles pr WHERE pr.id = g.user_id) AS cover_sections
    FROM galleries g
    WHERE g.id = ${id} AND g.status = 'active'
  `

  if (!rows.length) return NextResponse.json({ error: 'Galleria non trovata o non disponibile' }, { status: 404 })
  const gallery = rows[0]

  // Risolve la sezione "Crea Copertina" (libreria colori/decori condivisa per
  // occasione, su profiles.cover_sections) in colors/decorations pronti per il
  // cliente — il client-side continua a leggere settings.cover_builder.colors/
  // decorations esattamente come prima, senza sapere nulla delle sezioni.
  const cb = gallery.settings?.cover_builder
  if (cb?.enabled && cb.section) {
    const sections = (gallery.cover_sections ?? {}) as Partial<CoverSections>
    const assets = sections[cb.section as keyof CoverSections]
    gallery.settings = {
      ...gallery.settings,
      cover_builder: {
        ...cb,
        colors: assets?.colors ?? [],
        decorations: assets?.decorations ?? [],
      },
    }
  }
  delete gallery.cover_sections

  return NextResponse.json(gallery)
}

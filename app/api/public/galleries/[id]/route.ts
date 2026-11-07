import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { CoverColor, CoverDecorCategory, CoverMaterial } from '@/lib/types'

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
      (SELECT pr.cover_colors FROM profiles pr WHERE pr.id = g.user_id) AS cover_colors,
      (SELECT pr.cover_decor_categories FROM profiles pr WHERE pr.id = g.user_id) AS cover_decor_categories,
      (SELECT pr.cover_materials FROM profiles pr WHERE pr.id = g.user_id) AS cover_materials
    FROM galleries g
    WHERE g.id = ${id} AND g.status = 'active'
  `

  if (!rows.length) return NextResponse.json({ error: 'Galleria non trovata o non disponibile' }, { status: 404 })
  const gallery = rows[0]

  // La libreria "Crea Copertina" (colori, categorie di decori, rivestimenti) è
  // globale, condivisa da tutte le gallerie — niente più sezione per occasione.
  const cb = gallery.settings?.cover_builder
  if (cb?.enabled) {
    gallery.settings = {
      ...gallery.settings,
      cover_builder: {
        ...cb,
        colors: (gallery.cover_colors as CoverColor[] | null) ?? [],
        decorCategories: (gallery.cover_decor_categories as CoverDecorCategory[] | null) ?? [],
        materials: (gallery.cover_materials as CoverMaterial[] | null) ?? [],
      },
    }
  }
  delete gallery.cover_colors
  delete gallery.cover_decor_categories
  delete gallery.cover_materials

  return NextResponse.json(gallery)
}

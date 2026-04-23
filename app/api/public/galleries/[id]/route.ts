import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

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
       FROM profiles pr WHERE pr.id = g.user_id) AS profiles
    FROM galleries g
    WHERE g.id = ${id} AND g.status = 'active'
  `

  if (!rows.length) return NextResponse.json({ error: 'Galleria non trovata o non disponibile' }, { status: 404 })
  return NextResponse.json(rows[0])
}

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function checkAuth(req: NextRequest): boolean {
  const token = req.headers.get('x-albumstudio-token')
  return !!token && token === process.env.ALBUMSTUDIO_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const rows = await sql`
    SELECT
      g.id,
      g.name,
      g.date,
      g.cover_url   AS cover,
      COUNT(DISTINCT pf.photo_id)::int AS "photoCount"
    FROM galleries g
    LEFT JOIN photo_favorites pf ON pf.gallery_id = g.id
    WHERE g.status = 'active'
    GROUP BY g.id, g.name, g.date, g.cover_url
    ORDER BY g.date DESC NULLS LAST, g.created_at DESC
  `

  return NextResponse.json(rows)
}

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function checkAuth(req: NextRequest): boolean {
  const token = req.headers.get('x-albumstudio-token')
  return !!token && token === process.env.ALBUMSTUDIO_SECRET
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { id } = await params

  const rows = await sql`
    SELECT DISTINCT ON (p.id)
      p.id,
      p.url,
      p.filename,
      p.width,
      p.height
    FROM photos p
    INNER JOIN photo_favorites pf ON pf.photo_id = p.id
    WHERE pf.gallery_id = ${id}
    ORDER BY p.id, pf.created_at DESC
  `

  return NextResponse.json(rows)
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`SELECT id FROM galleries WHERE id = ${id} AND user_id = ${userId}`
  if (!rows.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const [favData, comData] = await Promise.all([
    sql`SELECT photo_id FROM photo_favorites WHERE gallery_id = ${id}`,
    sql`
      SELECT pc.id, pc.photo_id, pc.author_name, pc.body, pc.created_at,
        json_build_object('url', p.url, 'filename', p.filename) AS photos
      FROM photo_comments pc
      JOIN photos p ON p.id = pc.photo_id
      WHERE pc.gallery_id = ${id}
      ORDER BY pc.created_at DESC
    `,
  ])

  const favCount: Record<string, number> = {}
  for (const f of favData) {
    favCount[f.photo_id] = (favCount[f.photo_id] ?? 0) + 1
  }

  return NextResponse.json({
    favorites: favCount,
    comments: comData,
    total_favorites: favData.length,
    total_comments: comData.length,
  })
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`SELECT id FROM galleries WHERE id = ${id} AND user_id = ${userId}`
  if (!rows.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const [favData, comData, nameData] = await Promise.all([
    sql`SELECT photo_id, session_id, created_at FROM photo_favorites WHERE gallery_id = ${id} ORDER BY created_at ASC`,
    sql`
      SELECT pc.id, pc.photo_id, pc.author_name, pc.body, pc.created_at,
        json_build_object('url', p.url, 'filename', p.filename) AS photos
      FROM photo_comments pc
      JOIN photos p ON p.id = pc.photo_id
      WHERE pc.gallery_id = ${id}
      ORDER BY pc.created_at DESC
    `,
    sql`SELECT session_id, name FROM gallery_visitor_names WHERE gallery_id = ${id}`,
  ])

  const namesBySession: Record<string, string> = {}
  for (const n of nameData as { session_id: string; name: string }[]) {
    namesBySession[n.session_id] = n.name
  }

  const favCount: Record<string, number> = {}
  const favoritesBySession: Record<string, string[]> = {}
  const firstSeenBySession: Record<string, string> = {}
  for (const f of favData as { photo_id: string; session_id: string; created_at: string }[]) {
    favCount[f.photo_id] = (favCount[f.photo_id] ?? 0) + 1
    ;(favoritesBySession[f.session_id] ??= []).push(f.photo_id)
    if (!firstSeenBySession[f.session_id]) firstSeenBySession[f.session_id] = f.created_at
  }

  const favoriteSessions = Object.keys(favoritesBySession)
    .sort((a, b) => new Date(firstSeenBySession[a]).getTime() - new Date(firstSeenBySession[b]).getTime())
    .map((session_id, i) => ({
      session_id,
      label: namesBySession[session_id] ?? `Visitatore ${i + 1}`,
      count: favoritesBySession[session_id].length,
    }))

  return NextResponse.json({
    favorites: favCount,
    comments: comData,
    total_favorites: favData.length,
    total_comments: comData.length,
    favoriteSessions,
    favoritesBySession,
  })
}

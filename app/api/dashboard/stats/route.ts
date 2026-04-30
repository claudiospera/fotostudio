import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const [stats] = await sql`
    SELECT
      (SELECT COUNT(*) FROM galleries WHERE user_id = ${userId} AND status = 'active')::int AS "gallerieAttive",
      (SELECT COUNT(*) FROM preventivi WHERE user_id = ${userId} AND stato IN ('bozza', 'inviato'))::int AS "preventiviAperti",
      (SELECT COALESCE(SUM(uploads), 0) FROM upload_links WHERE user_id = ${userId} AND active = true)::int AS "uploadRicevuti",
      (SELECT COUNT(*) FROM photos p JOIN galleries g ON g.id = p.gallery_id WHERE g.user_id = ${userId})::int AS "fotoTotali"
  `

  return NextResponse.json(stats)
}

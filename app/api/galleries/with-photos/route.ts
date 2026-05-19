import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Gallerie con foto dell'utente, ordinate per upload più recente
  const galleries = await sql`
    SELECT
      g.id, g.name, g.type,
      COUNT(p.id)::int AS photo_count,
      MAX(p.created_at) AS last_upload
    FROM galleries g
    JOIN photos p ON p.gallery_id = g.id
    WHERE g.user_id = ${userId}
    GROUP BY g.id, g.name, g.type
    ORDER BY last_upload DESC
  `

  // Per ogni galleria carica le prime 50 foto (anteprime)
  const result = await Promise.all(galleries.map(async (g) => {
    const photos = await sql`
      SELECT id, url, filename, size_bytes
      FROM photos
      WHERE gallery_id = ${g.id}
      ORDER BY created_at ASC
      LIMIT 50
    `
    return { ...g, photos }
  }))

  return NextResponse.json(result)
}

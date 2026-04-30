import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

// Rimuove \n e spazi spurii dalle URL e storage_path delle foto
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const result = await sql`
    UPDATE photos
    SET
      url          = TRIM(url),
      storage_path = TRIM(storage_path)
    FROM galleries g
    WHERE photos.gallery_id = g.id
      AND g.user_id = ${userId}
      AND (url != TRIM(url) OR storage_path != TRIM(storage_path))
    RETURNING photos.id
  `

  return NextResponse.json({ fixed: result.length })
}

// Elimina dal DB le foto con URL Supabase (file non più esistenti)
export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Prima conta quante sono per galleria (per il report)
  const preview = await sql`
    SELECT g.name AS gallery, COUNT(p.id)::int AS count
    FROM photos p
    JOIN galleries g ON g.id = p.gallery_id
    WHERE g.user_id = ${userId}
      AND p.url LIKE '%supabase.co%'
    GROUP BY g.name
    ORDER BY g.name
  `

  const deleted = await sql`
    DELETE FROM photos
    USING galleries g
    WHERE photos.gallery_id = g.id
      AND g.user_id = ${userId}
      AND photos.url LIKE '%supabase.co%'
    RETURNING photos.id
  `

  return NextResponse.json({
    deleted: deleted.length,
    per_galleria: preview,
  })
}

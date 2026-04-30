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

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const photos = await sql`
    SELECT p.id, p.url, p.storage_path, p.filename
    FROM photos p
    JOIN galleries g ON g.id = p.gallery_id
    WHERE g.user_id = ${userId}
    LIMIT 3
  `
  return NextResponse.json(photos)
}

import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const gallery_id = searchParams.get('gallery_id')

  if (!gallery_id) return NextResponse.json({ error: 'gallery_id obbligatorio' }, { status: 400 })

  const data = await sql`SELECT photo_id FROM photo_comments WHERE gallery_id = ${gallery_id}`

  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.photo_id] = (counts[row.photo_id] ?? 0) + 1
  }
  return NextResponse.json(counts)
}

export async function POST(req: Request) {
  const { photo_id, gallery_id, session_id, author_name, body } = await req.json()

  if (!photo_id || !gallery_id || !session_id || !body?.trim()) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
  }

  const [row] = await sql`
    INSERT INTO photo_comments (photo_id, gallery_id, session_id, author_name, body)
    VALUES (${photo_id}, ${gallery_id}, ${session_id}, ${author_name?.trim() || 'Anonimo'}, ${body.trim()})
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}

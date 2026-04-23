import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const gallery_id = searchParams.get('gallery_id')
  const session_id = searchParams.get('session_id')

  if (!gallery_id || !session_id) {
    return NextResponse.json({ error: 'gallery_id e session_id obbligatori' }, { status: 400 })
  }

  const data = await sql`
    SELECT photo_id FROM photo_favorites
    WHERE gallery_id = ${gallery_id} AND session_id = ${session_id}
  `
  return NextResponse.json((data as { photo_id: string }[]).map(r => r.photo_id))
}

export async function POST(req: Request) {
  const { photo_id, gallery_id, session_id } = await req.json()

  if (!photo_id || !gallery_id || !session_id) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
  }

  const existing = await sql`
    SELECT id FROM photo_favorites WHERE photo_id = ${photo_id} AND session_id = ${session_id}
  `

  if (existing.length) {
    await sql`DELETE FROM photo_favorites WHERE photo_id = ${photo_id} AND session_id = ${session_id}`
    return NextResponse.json({ favorited: false })
  }

  await sql`INSERT INTO photo_favorites (photo_id, gallery_id, session_id) VALUES (${photo_id}, ${gallery_id}, ${session_id})`
  return NextResponse.json({ favorited: true })
}

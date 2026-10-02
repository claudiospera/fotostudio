import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: Request) {
  const { gallery_id, session_id, name } = await req.json()

  if (!gallery_id || !session_id || !name?.trim()) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
  }

  await sql`
    INSERT INTO gallery_visitor_names (gallery_id, session_id, name)
    VALUES (${gallery_id}, ${session_id}, ${name.trim().slice(0, 100)})
    ON CONFLICT (gallery_id, session_id)
    DO UPDATE SET name = EXCLUDED.name, updated_at = now()
  `

  return NextResponse.json({ ok: true })
}

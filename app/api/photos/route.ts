import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { gallery_id, url, storage_path, filename, size_bytes, folder } = await request.json()
  if (!gallery_id || !url || !storage_path) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  }

  // Verify ownership
  const rows = await sql`SELECT id FROM galleries WHERE id = ${gallery_id} AND user_id = ${userId}`
  if (!rows.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const [photo] = await sql`
    INSERT INTO photos (gallery_id, url, storage_path, filename, size_bytes, folder)
    VALUES (${gallery_id}, ${url}, ${storage_path}, ${filename ?? null}, ${size_bytes ?? null}, ${folder ?? null})
    RETURNING *
  `

  return NextResponse.json(photo, { status: 201 })
}

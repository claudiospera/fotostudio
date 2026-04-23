import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`
    SELECT p.id, p.storage_path
    FROM photos p
    JOIN galleries g ON g.id = p.gallery_id
    WHERE p.id = ${id} AND g.user_id = ${userId}
  `
  if (!rows.length) return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 })

  await sql`DELETE FROM photos WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}

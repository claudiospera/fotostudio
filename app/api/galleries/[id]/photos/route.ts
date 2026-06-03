import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const gallery = await sql`SELECT id FROM galleries WHERE id = ${id} AND user_id = ${userId} LIMIT 1`
  if (!gallery.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const photos = await sql`SELECT * FROM photos WHERE gallery_id = ${id} ORDER BY filename`
  return NextResponse.json(photos)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const galleryRows = await sql`SELECT id FROM galleries WHERE id = ${id} AND user_id = ${userId}`
  if (!galleryRows.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const photosList = await sql`SELECT id FROM photos WHERE gallery_id = ${id}`
  if (!photosList.length) return NextResponse.json({ deleted: 0 })

  await sql`DELETE FROM photos WHERE gallery_id = ${id}`
  return NextResponse.json({ deleted: photosList.length })
}

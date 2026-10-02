import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

// GET /api/galleries/[id]/export-selection — elenco .txt delle foto preferite dal cliente
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id: galleryId } = await params
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  const visitorLabel = searchParams.get('label')

  const galleries = await sql`
    SELECT id, name FROM galleries WHERE id = ${galleryId} AND user_id = ${userId}
  `
  if (!galleries.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })
  const gallery = galleries[0]

  const photos = sessionId
    ? await sql`
        SELECT DISTINCT p.filename
        FROM photos p
        INNER JOIN photo_favorites pf ON pf.photo_id = p.id
        WHERE pf.gallery_id = ${galleryId} AND pf.session_id = ${sessionId} AND p.filename IS NOT NULL
      `
    : await sql`
        SELECT DISTINCT p.filename
        FROM photos p
        INNER JOIN photo_favorites pf ON pf.photo_id = p.id
        WHERE pf.gallery_id = ${galleryId} AND p.filename IS NOT NULL
      `
  if (!photos.length) {
    return NextResponse.json({
      error: sessionId ? 'Nessuna foto preferita da questo visitatore' : 'Nessuna foto preferita per questa galleria',
    }, { status: 404 })
  }

  const filenames = (photos as { filename: string }[])
    .map(p => p.filename)
    .sort((a, b) => a.localeCompare(b, 'it', { numeric: true, sensitivity: 'base' }))

  const exportDate = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  const lines = [
    `# Galleria: ${gallery.name}`,
    ...(visitorLabel ? [`# Visitatore: ${visitorLabel}`] : []),
    `# Esportato il: ${exportDate}`,
    ...filenames,
  ]
  const content = lines.join('\n') + '\n'

  const safeName = gallery.name.trim().replace(/\s+/g, '_').replace(/["\\]/g, '')
  const safeVisitor = visitorLabel ? `_${visitorLabel.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}` : ''
  const fileDate = new Date().toISOString().slice(0, 10)

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="selezione_${safeName}${safeVisitor}_${fileDate}.txt"`,
    },
  })
}

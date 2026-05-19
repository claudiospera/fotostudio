import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import JSZip from 'jszip'

// POST /api/galleries/download  { galleryId }
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { galleryId } = await req.json()
  if (!galleryId) return NextResponse.json({ error: 'galleryId mancante' }, { status: 400 })

  // Verifica che la galleria appartenga all'utente
  const galleries = await sql`
    SELECT id, name FROM galleries WHERE id = ${galleryId} AND user_id = ${userId}
  `
  if (galleries.length === 0) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  const gallery = galleries[0]

  // Leggi tutte le foto della galleria
  const photos = await sql`
    SELECT url, filename FROM photos WHERE gallery_id = ${galleryId} ORDER BY created_at ASC
  `
  if (photos.length === 0) return NextResponse.json({ error: 'Nessuna foto' }, { status: 404 })

  const zip = new JSZip()

  // Scarica ogni foto e aggiungila allo zip
  await Promise.all(photos.map(async (photo, i) => {
    try {
      const res = await fetch(photo.url)
      if (!res.ok) return
      const buffer = await res.arrayBuffer()
      const ext = photo.url.split('.').pop()?.split('?')[0] || 'jpg'
      const name = photo.filename || `foto-${String(i + 1).padStart(3, '0')}.${ext}`
      zip.file(name, buffer)
    } catch { /* skip failed */ }
  }))

  const zipBuffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
  const safeName = gallery.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}.zip"`,
    },
  })
}

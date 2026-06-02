import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cropImage, parseFormatRatio } from '@/lib/cropImage'

// GET /api/shop/download-photo?url=...&filename=...
//   optional: &cropX=30&cropY=50&formatLabel=10x15+cm&zoom=1
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const p = req.nextUrl.searchParams
  const url         = p.get('url')
  const filename    = p.get('filename') || 'foto.jpg'
  const cropXStr    = p.get('cropX')
  const cropYStr    = p.get('cropY')
  const formatLabel = p.get('formatLabel') || ''
  const zoomStr     = p.get('zoom')

  if (!url || !url.startsWith('https://')) {
    return NextResponse.json({ error: 'URL non valido' }, { status: 400 })
  }

  const res = await fetch(url)
  if (!res.ok) return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 })

  const buffer = await res.arrayBuffer()

  // Apply crop only when position data AND parseable aspect ratio are available
  const ratio = parseFormatRatio(formatLabel)
  const hasCrop = cropXStr != null && cropYStr != null && ratio != null

  if (hasCrop && ratio) {
    const cropX = parseFloat(cropXStr!)
    const cropY = parseFloat(cropYStr!)
    const zoom  = zoomStr ? parseFloat(zoomStr) : 1.0

    try {
      const cropped = await cropImage(buffer, ratio.w, ratio.h, cropX, cropY, zoom)
      const ext = filename.replace(/\.[^.]+$/, '') + '_crop.jpg'
      return new Response(cropped.buffer as ArrayBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(ext)}"`,
        },
      })
    } catch (err) {
      console.error('[download-photo] Crop failed, falling back to original:', err)
    }
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}

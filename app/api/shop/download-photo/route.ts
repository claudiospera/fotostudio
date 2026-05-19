import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// GET /api/shop/download-photo?url=...&filename=... — proxied download (admin only)
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  const filename = req.nextUrl.searchParams.get('filename') || 'foto.jpg'

  if (!url || !url.startsWith('https://')) {
    return NextResponse.json({ error: 'URL non valido' }, { status: 400 })
  }

  const res = await fetch(url)
  if (!res.ok) return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 })

  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || 'image/jpeg'

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}

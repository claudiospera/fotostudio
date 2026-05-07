import { NextRequest, NextResponse } from 'next/server'

const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() ?? ''

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url mancante' }, { status: 400 })

  // Accetta solo URL del nostro bucket R2
  if (!url.startsWith(R2_PUBLIC_URL)) {
    return NextResponse.json({ error: 'URL non consentito' }, { status: 403 })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Foto non trovata' }, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const filename = decodeURIComponent(url.split('/').pop() ?? 'foto.jpg')

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, max-age=60',
    },
  })
}

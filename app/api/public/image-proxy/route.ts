import { NextRequest, NextResponse } from 'next/server'

const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() ?? ''

// GET /api/public/image-proxy — proxy stesso-origine per immagini R2 usate in
// composizioni canvas lato cliente (es. "Crea Copertina"): caricarle con
// crossOrigin="anonymous" fallisce perché R2 non invia header CORS, e senza
// crossOrigin il canvas risulta "tainted" e non esportabile con toBlob().
// A differenza di /api/download, questa route è pubblica (vedi proxy.ts,
// /api/public(.*) non richiede login Clerk) — necessario per i clienti anonimi.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url mancante' }, { status: 400 })

  if (!url.startsWith(R2_PUBLIC_URL)) {
    return NextResponse.json({ error: 'URL non consentito' }, { status: 403 })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Immagine non trovata' }, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

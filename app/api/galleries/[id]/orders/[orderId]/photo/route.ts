import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { cropImage, buildInstaxCard, parseFormatRatio } from '@/lib/cropImage'
import { PRODUCTS } from '@/lib/shop/products'

interface OrderItem {
  photo_url?: string
  filename?: string
  product_id?: string
  variant_id?: string
  format_label?: string
  frame_label?: string | null
  crop_x?: number | null
  crop_y?: number | null
  zoom?: number | null
  instax_text?: string | null
}

// GET /api/galleries/[id]/orders/[orderId]/photo?idx=0
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id: galleryId, orderId } = await params
  const idx = parseInt(req.nextUrl.searchParams.get('idx') ?? '0', 10)

  const gallery = await sql`SELECT name FROM galleries WHERE id = ${galleryId} AND user_id = ${userId} LIMIT 1`
  if (!gallery.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const rows = await sql`SELECT items FROM print_orders WHERE id = ${orderId} AND gallery_id = ${galleryId} LIMIT 1`
  if (!rows.length) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })

  const items: OrderItem[] = rows[0].items ?? []
  const photoItems = items.filter(i => i.photo_url?.startsWith('https://'))

  const item = photoItems[idx]
  if (!item) return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 })

  const res = await fetch(item.photo_url!)
  if (!res.ok) return NextResponse.json({ error: 'Impossibile scaricare la foto' }, { status: 502 })

  const originalBuffer = await res.arrayBuffer()
  const ext  = (item.filename ?? item.photo_url!).split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg'
  const base = item.filename || `foto-${String(idx + 1).padStart(3, '0')}.${ext}`
  const cropX = item.crop_x ?? 50
  const cropY = item.crop_y ?? 50
  const zoom  = item.zoom  ?? 1.0

  // ── Instax: produce full card image ───────────────────────────────────────
  if (item.product_id === 'stampe-instax' && item.variant_id) {
    const product = PRODUCTS.find(p => p.id === 'stampe-instax')
    const variant = product?.variants.find(v => v.id === item.variant_id)

    if (variant?.outerW && variant?.outerH && variant?.pad && variant.widthCm && variant.heightCm) {
      const frame      = product?.options?.frames?.find(f => f.label === item.frame_label)
      const frameColor = frame?.color ?? 'transparent'

      try {
        const card    = await buildInstaxCard(originalBuffer, variant.outerW, variant.outerH, variant.pad, variant.widthCm, variant.heightCm, cropX, cropY, zoom, frameColor, item.instax_text)
        const outName = base.replace(/\.[^.]+$/, '') + '_instax.jpg'
        return new Response(card.buffer as ArrayBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(outName)}"`,
          },
        })
      } catch (err) {
        console.error('[photo] Instax card failed:', err)
      }
    }
  }

  // ── Generic crop ──────────────────────────────────────────────────────────
  const ratio   = parseFormatRatio(item.format_label ?? '')
  const hasCrop = item.crop_x != null && item.crop_y != null && ratio != null

  if (hasCrop && ratio) {
    try {
      const cropped = await cropImage(originalBuffer, ratio.w, ratio.h, cropX, cropY, zoom)
      const outName = base.replace(/\.[^.]+$/, '') + '_crop.jpg'
      return new Response(cropped.buffer as ArrayBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(outName)}"`,
        },
      })
    } catch (err) {
      console.error('[photo] Crop failed:', err)
    }
  }

  // Fallback: original
  return new Response(originalBuffer, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(base)}"`,
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import JSZip from 'jszip'
import { cropImage, buildInstaxCard, parseFormatRatio } from '@/lib/cropImage'
import { PRODUCTS } from '@/lib/shop/products'

interface OrderItem {
  photo_url?: string
  filename?: string
  product_id?: string
  variant_id?: string
  product_name?: string
  format_label?: string
  frame_label?: string | null
  crop_x?: number | null
  crop_y?: number | null
  zoom?: number | null
  instax_text?: string | null
}

// GET /api/galleries/[id]/orders/[orderId]/download — ZIP con foto tagliate
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id: galleryId, orderId } = await params

  const gallery = await sql`SELECT name FROM galleries WHERE id = ${galleryId} AND user_id = ${userId} LIMIT 1`
  if (!gallery.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const rows = await sql`SELECT items, client_name FROM print_orders WHERE id = ${orderId} AND gallery_id = ${galleryId} LIMIT 1`
  if (!rows.length) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })

  const items: OrderItem[] = rows[0].items ?? []
  const clientName: string = rows[0].client_name ?? 'cliente'

  const photoItems = items.filter(i => i.photo_url?.startsWith('https://'))
  if (!photoItems.length) return NextResponse.json({ error: 'Nessuna foto disponibile' }, { status: 404 })

  const zip = new JSZip()

  await Promise.all(photoItems.map(async (item, idx) => {
    try {
      const res = await fetch(item.photo_url!)
      if (!res.ok) return

      const originalBuffer = await res.arrayBuffer()
      const ext     = (item.filename ?? item.photo_url!).split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg'
      const base    = item.filename || `foto-${String(idx + 1).padStart(3, '0')}.${ext}`
      const cropX   = item.crop_x  ?? 50
      const cropY   = item.crop_y  ?? 50
      const zoom    = item.zoom    ?? 1.0

      // ── Instax: produce full card image ────────────────────────────────
      if (item.product_id === 'stampe-instax' && item.variant_id) {
        const product = PRODUCTS.find(p => p.id === 'stampe-instax')
        const variant = product?.variants.find(v => v.id === item.variant_id)

        if (variant?.outerW && variant?.outerH && variant?.pad && variant.widthCm && variant.heightCm) {
          // Resolve frame color from label
          const frame = product?.options?.frames?.find(f => f.label === item.frame_label)
          const frameColor = frame?.color ?? 'transparent'

          try {
            const card = await buildInstaxCard(
              originalBuffer,
              variant.outerW, variant.outerH,
              variant.pad,
              variant.widthCm, variant.heightCm,
              cropX, cropY, zoom,
              frameColor,
              item.instax_text
            )
            zip.file(base.replace(/\.[^.]+$/, '') + '_instax.jpg', card)
            return
          } catch (err) {
            console.error('[download] Instax card failed for', base, err)
          }
        }
      }

      // ── Generic crop ────────────────────────────────────────────────────
      const ratio    = parseFormatRatio(item.format_label ?? '')
      const hasCrop  = item.crop_x != null && item.crop_y != null && ratio != null

      if (hasCrop && ratio) {
        try {
          const cropped = await cropImage(originalBuffer, ratio.w, ratio.h, cropX, cropY, zoom)
          zip.file(base.replace(/\.[^.]+$/, '') + '_crop.jpg', cropped)
          return
        } catch (err) {
          console.error('[download] Crop failed for', base, err)
        }
      }

      // Fallback: original
      zip.file(base, Buffer.from(originalBuffer))
    } catch (err) {
      console.error('[download] Failed to fetch photo:', item.photo_url, err)
    }
  }))

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
  const safeName  = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="ordine_${safeName}.zip"`,
    },
  })
}

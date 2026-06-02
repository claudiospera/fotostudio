import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import JSZip from 'jszip'
import { cropImage, parseFormatRatio } from '@/lib/cropImage'

interface OrderItem {
  photo_url?: string
  filename?: string
  product_name?: string
  format_label?: string
  crop_x?: number | null
  crop_y?: number | null
  zoom?: number | null
}

// GET /api/galleries/[id]/orders/[orderId]/download — ZIP con foto tagliate
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id: galleryId, orderId } = await params

  // Verify gallery belongs to the user
  const gallery = await sql`SELECT name FROM galleries WHERE id = ${galleryId} AND user_id = ${userId} LIMIT 1`
  if (!gallery.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const rows = await sql`SELECT items, client_name FROM print_orders WHERE id = ${orderId} AND gallery_id = ${galleryId} LIMIT 1`
  if (!rows.length) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })

  const items: OrderItem[] = rows[0].items ?? []
  const clientName: string = rows[0].client_name ?? 'cliente'

  const photoItems = items.filter(i => i.photo_url?.startsWith('https://'))
  if (!photoItems.length) {
    return NextResponse.json({ error: 'Nessuna foto disponibile' }, { status: 404 })
  }

  const zip = new JSZip()

  await Promise.all(photoItems.map(async (item, idx) => {
    try {
      const res = await fetch(item.photo_url!)
      if (!res.ok) return

      const originalBuffer = await res.arrayBuffer()
      const ext = (item.filename ?? item.photo_url!).split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg'
      const baseName = item.filename || `foto-${String(idx + 1).padStart(3, '0')}.${ext}`

      // Apply crop if we have position data and a parseable aspect ratio
      const ratio = parseFormatRatio(item.format_label ?? '')
      const hasCrop = item.crop_x != null && item.crop_y != null && ratio != null

      if (hasCrop && ratio) {
        try {
          const cropped = await cropImage(
            originalBuffer,
            ratio.w,
            ratio.h,
            item.crop_x!,
            item.crop_y!,
            item.zoom ?? 1.0
          )
          const croppedName = baseName.replace(/\.[^.]+$/, '') + '_crop.jpg'
          zip.file(croppedName, cropped)
          return
        } catch (err) {
          console.error('[download] Crop failed for', baseName, err)
        }
      }

      // Fallback: add original
      zip.file(baseName, Buffer.from(originalBuffer))
    } catch (err) {
      console.error('[download] Failed to fetch photo:', item.photo_url, err)
    }
  }))

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
  const safeName = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="ordine_${safeName}.zip"`,
    },
  })
}

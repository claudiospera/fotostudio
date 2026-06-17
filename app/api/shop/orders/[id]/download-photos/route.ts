import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import JSZip from 'jszip'
import { cropImage, buildInstaxCard, parseFormatRatio } from '@/lib/cropImage'
import { PRODUCTS } from '@/lib/shop/products'

interface OrderItem {
  image?: string
  filename?: string
  productName?: string
  variantLabel?: string
  productId?: string
  variantId?: string
  cropX?: number
  cropY?: number
  cropZoom?: number
  formatLabel?: string
  frameLabel?: string
  instaxText?: string
  instaxLabelColor?: string
}

// GET /api/shop/orders/[id]/download-photos — ZIP di tutte le foto dell'ordine
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await params

  const rows = await sql`SELECT items, customer_name FROM shop_orders WHERE id = ${id} LIMIT 1`
  if (rows.length === 0) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })

  const items: OrderItem[] = rows[0].items
  const customerName: string = rows[0].customer_name ?? 'cliente'

  const photoItems = items.filter(item => item.image?.startsWith('https://'))
  if (photoItems.length === 0) {
    return NextResponse.json({ error: 'Nessuna foto disponibile per questo ordine' }, { status: 404 })
  }

  const zip = new JSZip()

  await Promise.all(photoItems.map(async (item, i) => {
    try {
      const res = await fetch(item.image!)
      if (!res.ok) return
      const rawBuffer = await res.arrayBuffer()
      const ext = (item.filename ?? item.image!).split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg'
      const name = item.filename || `foto-${String(i + 1).padStart(3, '0')}.${ext}`

      const cropX = item.cropX ?? 50
      const cropY = item.cropY ?? 50
      const zoom  = item.cropZoom ?? 1.0
      let fileData: ArrayBuffer | Buffer = rawBuffer
      let outName = name

      // Instax: build full card with frame + text
      if (item.productId === 'stampe-instax' && item.variantId) {
        const product = PRODUCTS.find(p => p.id === 'stampe-instax')
        // variantId format: "pol-square__white--kmh" → base is "pol-square"
        // variantId in DB: "square__white--xxx" or "pol-square__white--xxx"
        const baseFormatId = item.variantId.split('__')[0]
        const variant = product?.variants.find(v => v.id === item.variantId)
                     ?? product?.variants.find(v => v.id === baseFormatId)
                     ?? product?.variants.find(v => v.id === `pol-${baseFormatId}`)
        console.log('[download-photos] instax item:', { variantId: item.variantId, baseFormatId, variantFound: !!variant, frameLabel: item.frameLabel })
        if (variant?.outerW && variant?.outerH && variant?.pad && variant.widthCm && variant.heightCm) {
          const frame      = product?.options?.frames?.find(f => f.label === item.frameLabel)
          const frameColor = frame?.color ?? 'transparent'
          console.log('[download-photos] building card:', { outerW: variant.outerW, outerH: variant.outerH, frameColor, instaxText: item.instaxText })
          try {
            fileData = await buildInstaxCard(rawBuffer, variant.outerW, variant.outerH, variant.pad, variant.widthCm, variant.heightCm, cropX, cropY, zoom, frameColor, item.instaxText, item.instaxLabelColor)
            outName  = outName.replace(/\.[^.]+$/, '') + '_instax.jpg'
          } catch (err) {
            console.error('[download-photos] buildInstaxCard failed:', err)
          }
        } else {
          console.warn('[download-photos] variant missing fields:', { outerW: variant?.outerW, outerH: variant?.outerH, pad: variant?.pad, widthCm: variant?.widthCm, heightCm: variant?.heightCm })
        }
      }

      // Generic crop (non-Instax or Instax fallback)
      if (fileData === rawBuffer) {
        const ratio = parseFormatRatio(item.formatLabel ?? '')
        if (item.cropX != null && item.cropY != null && ratio) {
          try {
            fileData = await cropImage(rawBuffer, ratio.w, ratio.h, cropX, cropY, zoom)
          } catch { /* skip crop, use original */ }
        }
      }

      zip.file(outName, fileData)
    } catch { /* skip */ }
  }))

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
  const safeName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="ordine_${safeName}.zip"`,
    },
  })
}

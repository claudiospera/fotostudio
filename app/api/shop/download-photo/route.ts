import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cropImage, buildInstaxCard, parseFormatRatio } from '@/lib/cropImage'
import { PRODUCTS } from '@/lib/shop/products'

// GET /api/shop/download-photo
//   required: url, filename
//   optional crop: cropX, cropY, formatLabel, zoom
//   optional instax: productId, variantId, frameLabel, instaxText
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const p           = req.nextUrl.searchParams
  const url         = p.get('url')
  const filename    = p.get('filename') || 'foto.jpg'
  const cropXStr    = p.get('cropX')
  const cropYStr    = p.get('cropY')
  const zoomStr     = p.get('zoom')
  const formatLabel = p.get('formatLabel') || ''
  const productId   = p.get('productId')
  const variantId   = p.get('variantId')
  const frameLabel  = p.get('frameLabel')
  const instaxText  = p.get('instaxText')

  if (!url || !url.startsWith('https://')) {
    return NextResponse.json({ error: 'URL non valido' }, { status: 400 })
  }

  const res = await fetch(url)
  if (!res.ok) return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 })

  const buffer = await res.arrayBuffer()
  const cropX  = cropXStr ? parseFloat(cropXStr) : 50
  const cropY  = cropYStr ? parseFloat(cropYStr) : 50
  const zoom   = zoomStr  ? parseFloat(zoomStr)  : 1.0

  // ── Instax: full card composite ─────────────────────────────────────────
  if (productId === 'stampe-instax' && variantId) {
    const product = PRODUCTS.find(p => p.id === 'stampe-instax')
    const variant = product?.variants.find(v => v.id === variantId)

    if (variant?.outerW && variant?.outerH && variant?.pad && variant.widthCm && variant.heightCm) {
      const frame      = product?.options?.frames?.find(f => f.label === frameLabel)
      const frameColor = frame?.color ?? 'transparent'

      try {
        const card    = await buildInstaxCard(buffer, variant.outerW, variant.outerH, variant.pad, variant.widthCm, variant.heightCm, cropX, cropY, zoom, frameColor, instaxText)
        const outName = filename.replace(/\.[^.]+$/, '') + '_instax.jpg'
        return new Response(card.buffer as ArrayBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(outName)}"`,
          },
        })
      } catch (err) {
        console.error('[download-photo] Instax card failed, falling back:', err)
      }
    }
  }

  // ── Generic crop ────────────────────────────────────────────────────────
  const ratio   = parseFormatRatio(formatLabel)
  const hasCrop = cropXStr != null && cropYStr != null && ratio != null

  if (hasCrop && ratio) {
    try {
      const cropped = await cropImage(buffer, ratio.w, ratio.h, cropX, cropY, zoom)
      const outName = filename.replace(/\.[^.]+$/, '') + '_crop.jpg'
      return new Response(cropped.buffer as ArrayBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(outName)}"`,
        },
      })
    } catch (err) {
      console.error('[download-photo] Crop failed, falling back:', err)
    }
  }

  // Fallback: original
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import JSZip from 'jszip'

interface OrderItem {
  image?: string
  filename?: string
  productName?: string
  variantLabel?: string
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
      const buffer = await res.arrayBuffer()
      const ext = (item.filename ?? item.image!).split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg'
      const name = item.filename || `foto-${String(i + 1).padStart(3, '0')}.${ext}`
      zip.file(name, buffer)
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

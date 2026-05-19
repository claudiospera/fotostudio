import { NextResponse } from 'next/server'
import { getPresignedUploadUrl } from '@/lib/r2'

// POST /api/shop/presign-photo — public (no auth), for shop order photo uploads
export async function POST(request: Request) {
  const { filename, contentType } = await request.json()

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'filename mancante' }, { status: 400 })
  }
  if (!contentType || !contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Solo immagini consentite' }, { status: 400 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const key = `shop-orders/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key)
  return NextResponse.json({ uploadUrl, publicUrl })
}

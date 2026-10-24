import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2 } from '@/lib/r2'
import { normalizeToJpeg } from '@/lib/cropImage'

const bucket = process.env.CLOUDFLARE_R2_BUCKET!.trim()
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!.trim()

// POST /api/shop/calendari/normalize-photo — pubblica (no auth), come presign-photo.
// Dopo l'upload diretto su R2, converte HEIC/HEIF/AVIF in JPEG (sovrascrivendo lo
// stesso key) e ritorna le dimensioni, usate dal client per l'avviso "poco nitida".
export async function POST(request: NextRequest) {
  const { key } = await request.json()
  if (!key || typeof key !== 'string' || !key.startsWith('calendari/tmp/')) {
    return NextResponse.json({ error: 'key non valida' }, { status: 400 })
  }

  const res = await fetch(`${publicUrl}/${key}`)
  if (!res.ok) {
    return NextResponse.json({ error: 'Foto non trovata su R2' }, { status: 404 })
  }
  const rawBuffer = Buffer.from(await res.arrayBuffer())

  const meta = await sharp(rawBuffer).metadata()
  const wasConverted = ['heif', 'heic', 'avif'].includes(meta.format as string)

  const finalBuffer = wasConverted ? await normalizeToJpeg(rawBuffer) : rawBuffer
  if (wasConverted) {
    await r2.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: finalBuffer,
      ContentType: 'image/jpeg',
    }))
  }

  const finalMeta = await sharp(finalBuffer).rotate().metadata()

  return NextResponse.json({
    url: `${publicUrl}/${key}`,
    width: finalMeta.width ?? null,
    height: finalMeta.height ?? null,
  })
}

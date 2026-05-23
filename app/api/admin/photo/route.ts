// app/api/admin/photo/route.ts
// DELETE: rimuove una o più foto da R2 e da _data.ts

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!
const BUCKET     = process.env.CLOUDFLARE_R2_BUCKET!
const ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY!
const SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_KEY!
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!.replace(/\/$/, '')

const DATA_PATH  = join(process.cwd(), 'app/(public)/galleria/matrimoni/real-weddings/_data.ts')
const PREFIX     = '/images/galleria/matrimoni/real-weddings/'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
})

export async function DELETE(req: NextRequest) {
  const { photoUrls } = await req.json() as { photoUrls: string[] }
  if (!photoUrls?.length) return NextResponse.json({ error: 'photoUrls mancanti' }, { status: 400 })

  // ── 1. Cancella da R2 in parallelo ────────────────────────────────────────
  const r2Results = await Promise.allSettled(
    photoUrls.map(url =>
      s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: url.replace(PUBLIC_URL + '/', '') }))
    )
  )
  const r2Errors = r2Results.filter(r => r.status === 'rejected').length

  // ── 2. Rimuovi le righe da _data.ts ───────────────────────────────────────
  let src = readFileSync(DATA_PATH, 'utf8')
  for (const url of photoUrls) {
    const relPath = url.replace(PUBLIC_URL + PREFIX, '')
    const escaped = relPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const lineRe  = new RegExp('[ \\t]*`[^`]*' + escaped + '`[,]?\\n', 'g')
    src = src.replace(lineRe, '')
  }
  writeFileSync(DATA_PATH, src, 'utf8')

  return NextResponse.json({ ok: true, deleted: photoUrls.length, r2Errors })
}

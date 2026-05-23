// app/api/admin/photo/route.ts
// DELETE: rimuove una foto da R2 e da _data.ts
// Solo per uso locale — nessun controllo auth (non deployare in produzione)

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

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
})

export async function DELETE(req: NextRequest) {
  const { photoUrl } = await req.json() as { photoUrl: string }
  if (!photoUrl) return NextResponse.json({ error: 'photoUrl mancante' }, { status: 400 })

  // ── 1. Cancella da R2 ──────────────────────────────────────────────────────
  const r2Key = photoUrl.replace(PUBLIC_URL + '/', '')
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: r2Key }))
  } catch (err) {
    return NextResponse.json({ error: `Errore R2: ${err}` }, { status: 500 })
  }

  // ── 2. Rimuovi la riga da _data.ts ─────────────────────────────────────────
  // Cerca il percorso relativo dopo il prefisso B (es. "cesare%20e%20maria/DSC.jpg")
  const prefix = '/images/galleria/matrimoni/real-weddings/'
  const relPath = photoUrl.replace(PUBLIC_URL + prefix, '')

  let src = readFileSync(DATA_PATH, 'utf8')
  // Rimuove la riga che contiene questo path (backtick o stringa)
  const escaped = relPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const lineRe  = new RegExp('[ \\t]*`[^`]*' + escaped + '`[,]?\\n', 'g')
  src = src.replace(lineRe, '')
  writeFileSync(DATA_PATH, src, 'utf8')

  return NextResponse.json({ ok: true, removed: relPath })
}

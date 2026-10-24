// scripts/import-calendari.ts
// Importa i modelli di calendario 2027 (JPEG) in calendar_models + Cloudflare R2.
//
// Uso:
//   node --env-file=.env.local --import tsx scripts/import-calendari.ts "<cartella>"
//
// - Legge tutti i .jpg/.jpeg (case-insensitive) nella cartella data.
// - Il codice modello è il nome file senza estensione (C2830.jpeg → C2830).
// - Genera anteprima WebP 1200px e miniatura WebP 400px, entrambe con watermark
//   "Storie da Raccontare" tassellato a bassa opacità, e le carica su R2.
// - Gli originali JPEG non vengono MAI caricati — restano solo in locale.
// - Rieseguibile: confronta l'hash SHA-1 del file per saltare i modelli invariati,
//   e non tocca mai category/photo_slots/active/sort_order se il modello esiste già
//   (campi impostati manualmente da admin).

import { readdirSync, readFileSync } from 'fs'
import { createHash } from 'crypto'
import { basename, extname, join } from 'path'
import sharp from 'sharp'
import postgres from 'postgres'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const WATERMARK_TEXT = 'Storie da Raccontare'
const PREVIEW_MAX_SIDE = 1200
const THUMB_MAX_SIDE = 400

async function main() {
  const folder = process.argv[2]
  if (!folder) {
    console.error('Uso: npx tsx scripts/import-calendari.ts "<cartella con i .jpg>"')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL non impostata. Lancia con: npx tsx --env-file=.env.local scripts/import-calendari.ts "<cartella>"')
    process.exit(1)
  }
  const r2 = requireR2Env()

  const sql = postgres(process.env.DATABASE_URL)
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
  })

  const files = readdirSync(folder).filter(f => /\.jpe?g$/i.test(f))
  if (files.length === 0) {
    console.log('Nessun file .jpg/.jpeg trovato in', folder)
    await sql.end()
    return
  }

  const existingRows = await sql`SELECT code, source_hash FROM calendar_models`
  const existingByCode = new Map(existingRows.map(r => [r.code as string, r.source_hash as string | null]))

  let nuovi = 0, aggiornati = 0, saltati = 0
  const errori: { file: string; error: string }[] = []

  for (const file of files) {
    const code = basename(file, extname(file))
    const fullPath = join(folder, file)
    try {
      const buf = readFileSync(fullPath)
      const hash = createHash('sha1').update(buf).digest('hex')

      if (existingByCode.has(code) && existingByCode.get(code) === hash) {
        saltati++
        continue
      }

      const previewBuf = await makeWatermarkedWebp(buf, PREVIEW_MAX_SIDE)
      const thumbBuf = await makeWatermarkedWebp(buf, THUMB_MAX_SIDE)

      const imageKey = `calendari/modelli/${code}/preview.webp`
      const thumbKey = `calendari/modelli/${code}/thumb.webp`

      await uploadToR2(s3, r2.bucket, imageKey, previewBuf, 'image/webp')
      await uploadToR2(s3, r2.bucket, thumbKey, thumbBuf, 'image/webp')

      const isNew = !existingByCode.has(code)

      await sql`
        INSERT INTO calendar_models (code, title, image_key, thumb_key, source_hash)
        VALUES (${code}, ${code}, ${imageKey}, ${thumbKey}, ${hash})
        ON CONFLICT (code) DO UPDATE SET
          image_key  = EXCLUDED.image_key,
          thumb_key  = EXCLUDED.thumb_key,
          source_hash = EXCLUDED.source_hash,
          updated_at = now()
      `

      if (isNew) nuovi++
      else aggiornati++
    } catch (e) {
      errori.push({ file, error: e instanceof Error ? e.message : String(e) })
    }
  }

  await sql.end()

  console.log('')
  console.log('── Riepilogo import calendari ──────────────────────')
  console.log(`Nuovi:      ${nuovi}`)
  console.log(`Aggiornati: ${aggiornati}`)
  console.log(`Saltati:    ${saltati}`)
  console.log(`Errori:     ${errori.length}`)
  if (errori.length > 0) {
    console.log('')
    for (const e of errori) console.log(`  ✗ ${e.file}: ${e.error}`)
  }
}

// ── Watermark ────────────────────────────────────────────────────────────────

function buildWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(14, Math.round(width / 16))
  const tileW = fontSize * 11
  const tileH = fontSize * 6
  let tiles = ''
  for (let y = -tileH; y < height + tileH; y += tileH) {
    for (let x = -tileW; x < width + tileW; x += tileW) {
      tiles += `<text x="${x}" y="${y}" transform="rotate(-28 ${x} ${y})" font-family="sans-serif" font-size="${fontSize}" font-weight="600" fill="#ffffff" fill-opacity="0.22">${WATERMARK_TEXT}</text>`
    }
  }
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${tiles}</svg>`)
}

async function makeWatermarkedWebp(buf: Buffer, maxSide: number): Promise<Buffer> {
  // Resize prima, in un buffer separato: leggere le dimensioni finali da un
  // pipeline con operazioni ancora "in coda" (rotate+resize) può riportare
  // misure leggermente diverse da quelle effettive del buffer risultante,
  // causando un mismatch nel composite dell'SVG sovrapposto.
  const resizedBuf = await sharp(buf)
    .rotate() // applica orientamento EXIF
    .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
    .toBuffer()
  const meta = await sharp(resizedBuf).metadata()
  const width = meta.width ?? maxSide
  const height = meta.height ?? maxSide
  const svg = buildWatermarkSvg(width, height)
  return sharp(resizedBuf).composite([{ input: svg }]).webp({ quality: 86 }).toBuffer()
}

// ── R2 ─────────────────────────────────────────────────────────────────────

function requireR2Env() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY?.trim()
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY?.trim()
  const bucket = process.env.CLOUDFLARE_R2_BUCKET?.trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    console.error('Credenziali Cloudflare R2 mancanti in .env.local')
    process.exit(1)
  }
  return { accountId, accessKeyId, secretAccessKey, bucket }
}

async function uploadToR2(s3: S3Client, bucket: string, key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }))
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

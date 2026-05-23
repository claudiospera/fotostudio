// scripts/upload-galleria.mjs
// Carica tutte le foto di public/images/galleria/ su Cloudflare R2
//
// Uso: node scripts/upload-galleria.mjs
//
// Legge le credenziali R2 da .env.local automaticamente.

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, relative } from 'path'
import { fileURLToPath } from 'url'
import { createReadStream } from 'fs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT      = join(__dirname, '..')

// ── Leggi .env.local ────────────────────────────────────────────────────────
function loadEnv() {
  const env = {}
  try {
    const content = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) env[m[1].trim()] = m[2].trim()
    }
  } catch { /* no .env.local */ }
  return env
}

const env = loadEnv()

const ACCOUNT_ID  = env.CLOUDFLARE_R2_ACCOUNT_ID
const BUCKET      = env.CLOUDFLARE_R2_BUCKET
const ACCESS_KEY  = env.CLOUDFLARE_R2_ACCESS_KEY
const SECRET_KEY  = env.CLOUDFLARE_R2_SECRET_KEY
const PUBLIC_URL  = env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, '')

if (!ACCOUNT_ID || !BUCKET || !ACCESS_KEY || !SECRET_KEY) {
  console.error('❌ Credenziali R2 mancanti in .env.local')
  process.exit(1)
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
})

// ── MIME types ───────────────────────────────────────────────────────────────
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.JPG': 'image/jpeg', '.JPEG': 'image/jpeg',
  '.png': 'image/png',  '.PNG': 'image/png',
  '.webp': 'image/webp',
}

// ── Raccoglie tutti i file ricorsivamente ────────────────────────────────────
function collectFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      files.push(...collectFiles(full))
    } else if (MIME[extname(entry)]) {
      files.push(full)
    }
  }
  return files
}

// ── Controlla se il file esiste già su R2 ────────────────────────────────────
async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const SOURCE_DIR = join(ROOT, 'public', 'images', 'galleria')
const files      = collectFiles(SOURCE_DIR)

console.log(`\n📂 Trovati ${files.length} file in public/images/galleria/\n`)

let uploaded = 0
let skipped  = 0
let errors   = 0

for (const filePath of files) {
  // Chiave R2: images/galleria/...
  const relPath = relative(join(ROOT, 'public'), filePath)
  const key     = relPath.replace(/\\/g, '/') // Windows compat

  if (await exists(key)) {
    process.stdout.write(`⏭  skip  ${key}\n`)
    skipped++
    continue
  }

  try {
    await s3.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        createReadStream(filePath),
      ContentType: MIME[extname(filePath)] ?? 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }))
    process.stdout.write(`✅ ${key}\n`)
    uploaded++
  } catch (err) {
    process.stdout.write(`❌ ERRORE ${key}: ${err.message}\n`)
    errors++
  }
}

console.log(`
────────────────────────────────
✅ Caricati:  ${uploaded}
⏭  Saltati:   ${skipped}
❌ Errori:    ${errors}
────────────────────────────────`)

if (uploaded > 0) {
  console.log(`\n🌐 URL base: ${PUBLIC_URL}/images/galleria/`)
  console.log(`   Esempio:  ${PUBLIC_URL}/images/galleria/matrimoni/portfolio/DSCF0087.jpg\n`)
}

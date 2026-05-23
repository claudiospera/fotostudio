// app/api/admin/weddings/route.ts
// GET: restituisce tutti i matrimoni con le loro foto
// Legge _data.ts come testo per evitare la cache del modulo Node.js

import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const DATA_PATH = join(process.cwd(), 'app/(public)/galleria/matrimoni/real-weddings/_data.ts')

// Parsing leggero del file _data.ts — estrae slug, title, location, date, cover, photos
function parseWeddings() {
  const src = readFileSync(DATA_PATH, 'utf8')

  // Risolvi le costanti R2 e B
  const r2Match  = src.match(/const R2\s*=\s*'([^']+)'/)
  const bMatch   = src.match(/const B\s*=\s*`\$\{R2\}([^`]+)`/)
  const R2_VAL   = r2Match?.[1] ?? ''
  const B_VAL    = R2_VAL + (bMatch?.[1] ?? '')

  // Estrai i blocchi dei singoli matrimoni
  // [^}]* — permette commenti e spazi tra { e slug:
  const blockRe = /\{[^}]*?slug:\s*'([^']+)'[^}]*?title:\s*'([^']+)'[^}]*?(?:location:\s*'([^']+)'[^}]*?)?(?:date:\s*'([^']+)'[^}]*?)?cover:\s*`([^`]+)`[^}]*?photos:\s*\[([\s\S]*?)\]\s*,?\s*\}/g

  const weddings = []
  let m
  while ((m = blockRe.exec(src)) !== null) {
    const [, slug, title, location, date, coverTpl, photosBlock] = m

    const resolve = (tpl: string) =>
      tpl.replace(/\$\{B\}/g, B_VAL).replace(/\$\{R2\}/g, R2_VAL)

    const cover = resolve(coverTpl)

    const photos: string[] = []
    const photoRe = /`([^`]+)`/g
    let pm
    while ((pm = photoRe.exec(photosBlock)) !== null) {
      photos.push(resolve(pm[1]))
    }

    weddings.push({ slug, title, location: location ?? null, date: date ?? null, cover, photos })
  }

  return weddings
}

export async function GET() {
  try {
    const weddings = parseWeddings()
    return NextResponse.json(weddings)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

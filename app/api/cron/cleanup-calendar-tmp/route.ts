import { NextRequest, NextResponse } from 'next/server'
import { listR2Keys, deleteFromR2 } from '@/lib/r2'

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 giorni

// GET /api/cron/cleanup-calendar-tmp — chiamata dal cron Vercel (vercel.json).
// Elimina le foto caricate dai clienti per i calendari che non sono mai state
// confermate in un ordine (restate in calendari/tmp/ oltre 7 giorni).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
  }

  const keys = await listR2Keys('calendari/tmp/')
  const cutoff = Date.now() - MAX_AGE_MS
  const toDelete = keys.filter(k => (k.lastModified?.getTime() ?? 0) < cutoff)

  await Promise.allSettled(toDelete.map(k => deleteFromR2(k.key)))

  return NextResponse.json({ checked: keys.length, deleted: toDelete.length })
}

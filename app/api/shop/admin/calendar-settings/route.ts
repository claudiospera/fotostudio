import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

// GET — banner scadenza ordini (admin)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`SELECT banner_text, banner_date FROM calendar_settings WHERE id = 1`
  return NextResponse.json({
    bannerText: rows[0]?.banner_text ?? '',
    bannerDate: rows[0]?.banner_date ?? '',
  })
}

// PUT — imposta banner scadenza ordini
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { bannerText, bannerDate } = await req.json()

  await sql`
    INSERT INTO calendar_settings (id, banner_text, banner_date, updated_at)
    VALUES (1, ${bannerText || null}, ${bannerDate || null}, now())
    ON CONFLICT (id) DO UPDATE SET
      banner_text = ${bannerText || null},
      banner_date = ${bannerDate || null},
      updated_at = now()
  `
  return NextResponse.json({ ok: true })
}

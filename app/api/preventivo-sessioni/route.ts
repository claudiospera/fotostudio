import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

function randomSlug() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

// POST — crea una nuova sessione (richiede auth)
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const { template_id, template_nome, colore, voci } = body

  if (!template_id || !template_nome || !Array.isArray(voci)) {
    return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
  }

  const slug = randomSlug()

  await sql`
    INSERT INTO preventivo_sessioni (slug, user_id, template_id, template_nome, colore, voci, selected)
    VALUES (${slug}, ${userId}, ${template_id}, ${template_nome}, ${colore ?? '#8ec9b0'}, ${JSON.stringify(voci)}, ${JSON.stringify([])})
  `

  return NextResponse.json({ slug })
}

// GET — lista sessioni dell'utente (richiede auth)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`
    SELECT * FROM preventivo_sessioni
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 20
  `
  return NextResponse.json(rows)
}

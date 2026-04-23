import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await sql`
    SELECT c.*,
      (SELECT COUNT(*) FROM prenotazioni_appuntamenti p WHERE p.calendario_id = c.id) AS prenotazioni_count
    FROM calendari_appuntamenti c
    WHERE c.user_id = ${userId}
    ORDER BY c.created_at DESC
  `
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const body = await req.json()
  const { nome, colore, descrizione, mostra_descrizione, inizia_settimana, data_inizio, data_fine } = body

  const [row] = await sql`
    INSERT INTO calendari_appuntamenti (user_id, nome, colore, descrizione, mostra_descrizione, inizia_settimana, data_inizio, data_fine)
    VALUES (${userId}, ${nome}, ${colore ?? '#3dba8a'}, ${descrizione ?? null},
            ${mostra_descrizione ?? false}, ${inizia_settimana ?? 'lunedi'},
            ${data_inizio ?? null}, ${data_fine ?? null})
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}

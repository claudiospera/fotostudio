import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await sql`
    SELECT p.*,
      json_build_object('id', c.id, 'nome', c.nome, 'colore', c.colore) AS calendario
    FROM prenotazioni_appuntamenti p
    JOIN calendari_appuntamenti c ON c.id = p.calendario_id
    WHERE p.user_id = ${userId}
    ORDER BY p.data ASC, p.ora_inizio ASC
  `
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const body = await req.json()
  const { calendario_id, cliente_nome, cliente_email, cliente_tel, data, ora_inizio, ora_fine, note, stato } = body

  const [row] = await sql`
    INSERT INTO prenotazioni_appuntamenti
      (user_id, calendario_id, cliente_nome, cliente_email, cliente_tel, data, ora_inizio, ora_fine, note, stato)
    VALUES (${userId}, ${calendario_id}, ${cliente_nome}, ${cliente_email ?? null},
            ${cliente_tel ?? null}, ${data}, ${ora_inizio}, ${ora_fine},
            ${note ?? null}, ${stato ?? 'confermata'})
    RETURNING *
  `

  const [withCal] = await sql`
    SELECT p.*, json_build_object('id', c.id, 'nome', c.nome, 'colore', c.colore) AS calendario
    FROM prenotazioni_appuntamenti p
    JOIN calendari_appuntamenti c ON c.id = p.calendario_id
    WHERE p.id = ${row.id}
  `
  return NextResponse.json(withCal, { status: 201 })
}

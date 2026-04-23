import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await sql`SELECT * FROM preventivi WHERE user_id = ${userId} ORDER BY created_at DESC`
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const body = await request.json()
  const { cliente, email, servizio, data_evento, gallery_id, voci, totale, stato, note } = body

  const [row] = await sql`
    INSERT INTO preventivi (user_id, cliente, email, servizio, data_evento, gallery_id, voci, totale, stato, note)
    VALUES (${userId}, ${cliente}, ${email ?? null}, ${servizio ?? null}, ${data_evento ?? null},
            ${gallery_id ?? null}, ${JSON.stringify(voci ?? [])}, ${totale ?? 0},
            ${stato ?? 'bozza'}, ${note ?? null})
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}

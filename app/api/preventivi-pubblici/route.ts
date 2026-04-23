import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await sql`SELECT * FROM preventivi_pubblici WHERE user_id = ${userId} ORDER BY created_at DESC`
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const body = await req.json()
  const { token, cliente, email, servizio, data_evento, voci, totale, stato, note, expires_at } = body

  const [row] = await sql`
    INSERT INTO preventivi_pubblici (user_id, token, cliente, email, servizio, data_evento, voci, totale, stato, note, expires_at)
    VALUES (${userId}, ${token}, ${cliente ?? null}, ${email ?? null}, ${servizio ?? null},
            ${data_evento ?? null}, ${JSON.stringify(voci ?? [])}, ${totale ?? 0},
            ${stato ?? 'bozza'}, ${note ?? null}, ${expires_at ?? null})
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}

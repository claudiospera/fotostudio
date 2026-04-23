import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Upsert profile on first access
  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const [profile] = await sql`
    SELECT id, name, studio_name, plan, telefono, email, iban
    FROM profiles WHERE id = ${userId}
  `
  return NextResponse.json(profile ?? {})
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json()
  const allowed = ['name', 'studio_name', 'telefono', 'email', 'iban']
  const patch = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nessun campo' }, { status: 400 })

  const keys = Object.keys(patch)
  const vals = Object.values(patch)
  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')

  const updated = await sql.query(
    `UPDATE profiles SET ${setClauses} WHERE id = $1 RETURNING *`,
    [userId, ...vals]
  )
  const rows = (updated as unknown as { rows: unknown[] }).rows ?? updated
  return NextResponse.json((rows as unknown[])[0])
}

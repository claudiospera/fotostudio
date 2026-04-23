import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get('categoria')

  if (categoria) {
    const rows = await sql`SELECT * FROM preventivo_templates WHERE user_id = ${userId} AND categoria = ${categoria}`
    return NextResponse.json(rows[0] ?? null)
  }

  const data = await sql`SELECT * FROM preventivo_templates WHERE user_id = ${userId}`
  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const body = await req.json()
  const { categoria, sezioni } = body

  const [row] = await sql`
    INSERT INTO preventivo_templates (user_id, categoria, sezioni)
    VALUES (${userId}, ${categoria}, ${JSON.stringify(sezioni)})
    ON CONFLICT (user_id, categoria) DO UPDATE SET sezioni = EXCLUDED.sezioni, updated_at = now()
    RETURNING *
  `
  return NextResponse.json(row)
}

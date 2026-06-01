import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const data = await sql`
      SELECT o.id, o.gallery_id, o.session_id, o.client_name, o.client_email,
             o.items, o.total::float8 AS total, o.status, o.notes, o.created_at,
             json_build_object('id', g.id, 'name', g.name) AS galleries
      FROM print_orders o
      JOIN galleries g ON g.id = o.gallery_id
      WHERE g.user_id = ${userId}
      ORDER BY o.created_at DESC
    `
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/orders] SQL error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

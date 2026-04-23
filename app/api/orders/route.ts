import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await sql`
    SELECT o.*, json_build_object('id', g.id, 'name', g.name) AS galleries
    FROM print_orders o
    JOIN galleries g ON g.id = o.gallery_id
    WHERE g.user_id = ${userId}
    ORDER BY o.created_at DESC
  `
  return NextResponse.json(data)
}

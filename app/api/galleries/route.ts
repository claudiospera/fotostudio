import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await sql`
    SELECT g.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', p.id, 'url', p.url, 'order_index', p.order_index) ORDER BY p.order_index)
         FROM photos p WHERE p.gallery_id = g.id),
        '[]'::json
      ) AS photos
    FROM galleries g
    WHERE g.user_id = ${userId}
    ORDER BY g.created_at DESC
  `

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Ensure profile exists
  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const body = await request.json()
  const { name, subtitle, type, date, status, cover_color, settings } = body

  const [row] = await sql`
    INSERT INTO galleries (user_id, name, subtitle, type, date, status, cover_color, settings)
    VALUES (${userId}, ${name}, ${subtitle ?? null}, ${type ?? null}, ${date ?? null},
            ${status ?? 'draft'}, ${cover_color ?? '#2a3830'}, ${settings ? JSON.stringify(settings) : null})
    RETURNING *
  `

  return NextResponse.json(row, { status: 201 })
}

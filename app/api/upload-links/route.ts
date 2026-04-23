import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await sql`
    SELECT ul.*, json_build_object('id', g.id, 'name', g.name) AS gallery
    FROM upload_links ul
    LEFT JOIN galleries g ON g.id = ul.gallery_id
    WHERE ul.user_id = ${userId}
    ORDER BY ul.created_at DESC
  `
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  const body = await request.json()
  const { nome, slug, gallery_id, expires_at, max_photos } = body

  const [row] = await sql`
    INSERT INTO upload_links (user_id, nome, slug, gallery_id, expires_at, max_photos)
    VALUES (${userId}, ${nome}, ${slug}, ${gallery_id ?? null}, ${expires_at ?? null}, ${max_photos ?? null})
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}

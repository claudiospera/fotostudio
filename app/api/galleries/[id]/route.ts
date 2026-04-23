import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`
    SELECT g.*,
      COALESCE(
        (SELECT json_agg(p.* ORDER BY p.filename)
         FROM photos p WHERE p.gallery_id = g.id),
        '[]'::json
      ) AS photos,
      COALESCE(
        (SELECT json_agg(c.*)
         FROM gallery_clients c WHERE c.gallery_id = g.id),
        '[]'::json
      ) AS clients
    FROM galleries g
    WHERE g.id = ${id} AND g.user_id = ${userId}
  `

  if (!rows.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`SELECT id FROM galleries WHERE id = ${id} AND user_id = ${userId}`
  if (!rows.length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  try {
    const listed = await r2.send(new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Prefix: `${userId}/${id}/`,
    }))
    const keys = (listed.Contents ?? []).map(o => ({ Key: o.Key! }))
    if (keys.length > 0) {
      await r2.send(new DeleteObjectsCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Delete: { Objects: keys },
      }))
    }
  } catch { /* se R2 fallisce, prosegui comunque */ }

  await sql`DELETE FROM galleries WHERE id = ${id} AND user_id = ${userId}`
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json()
  const allowed = ['name','subtitle','type','date','status','cover_color','cover_url','settings']
  const patch = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nessun campo' }, { status: 400 })

  // Dynamic PATCH: build positional params
  const keys = Object.keys(patch)
  const vals = Object.values(patch)
  const setClauses = keys.map((k, i) => `${k} = $${i + 3}`).join(', ')

  const updated = await sql.query(
    `UPDATE galleries SET ${setClauses}, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, ...vals]
  )

  const rows = (updated as unknown as { rows: unknown[] }).rows ?? updated
  if (!(rows as unknown[]).length) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })
  return NextResponse.json((rows as unknown[])[0])
}

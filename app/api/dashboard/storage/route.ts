import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const rows = await sql`
    SELECT
      g.id, g.name, g.status,
      COALESCE(SUM(p.size_bytes), 0)::bigint AS bytes
    FROM galleries g
    LEFT JOIN photos p ON p.gallery_id = g.id
    WHERE g.user_id = ${userId}
    GROUP BY g.id, g.name, g.status
    ORDER BY bytes DESC
  `

  const totalBytes = (rows as { bytes: number }[]).reduce((acc, r) => acc + Number(r.bytes), 0)

  return NextResponse.json({
    totalBytes,
    limitBytes: 10 * 1024 * 1024 * 1024,
    galleries: rows,
  })
}

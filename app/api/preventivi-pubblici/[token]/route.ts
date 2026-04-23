import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const rows = await sql`SELECT * FROM preventivi_pubblici WHERE token = ${token}`
  if (!rows.length) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`DELETE FROM preventivi_pubblici WHERE token = ${token} AND user_id = ${userId}`
  return new NextResponse(null, { status: 204 })
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { normalizeCliente, buildHtmlPrint } from '@/lib/scheda-html'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return new NextResponse('Non autorizzato', { status: 401 })

  const rows = await sql`SELECT * FROM clienti WHERE id = ${id} AND user_id = ${userId}`
  const arr  = rows as Record<string, unknown>[]
  if (!arr.length) return new NextResponse('Cliente non trovato', { status: 404 })

  const html = buildHtmlPrint(normalizeCliente(arr[0]))
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { normalizeCliente, buildHtmlShare } from '@/lib/scheda-html'
import type { Cliente } from '@/lib/types'

// Route pubblica — accessibile senza auth tramite UUID (128-bit, non indovinabile)
// Usata per condivisione via WhatsApp/email con il cliente

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // Valida formato UUID per evitare injection
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse('Non trovato', { status: 404 })
  }

  const rows = await sql`SELECT * FROM clienti WHERE id = ${id}`
  const arr  = rows as Record<string, unknown>[]
  if (!arr.length) return new NextResponse('Non trovato', { status: 404 })

  const c: Cliente = normalizeCliente(arr[0])
  const email      = c.email1 ?? c.email2 ?? ''
  const telefono   = c.whatsapp1 ?? c.tel1 ?? c.genitore1_tel ?? ''

  const html = buildHtmlShare(c, email, telefono)
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Nessun header di cache — la scheda potrebbe essere aggiornata
      'Cache-Control': 'no-store',
    },
  })
}

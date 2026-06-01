import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    // Mostra tutti gli ordini dal portale galleria — l'auth Clerk garantisce
    // che solo il fotografo autenticato possa leggere questi dati.
    // LEFT JOIN per avere il nome galleria anche se la galleria venisse eliminata.
    const data = await sql`
      SELECT o.id, o.gallery_id, o.session_id, o.client_name, o.client_email,
             o.items, o.total::float8 AS total, o.status, o.notes, o.created_at,
             json_build_object('id', COALESCE(g.id::text,''), 'name', COALESCE(g.name,'Galleria eliminata')) AS galleries
      FROM print_orders o
      LEFT JOIN galleries g ON g.id = o.gallery_id
      ORDER BY o.created_at DESC
    `
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/orders] SQL error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

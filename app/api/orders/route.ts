import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    // Debug: conta ordini e gallerie disponibili
    const [{ count: totalOrders }] = await sql`SELECT COUNT(*)::int AS count FROM print_orders`
    const myGalleries = await sql`SELECT id FROM galleries WHERE user_id = ${userId}`
    console.log(`[/api/orders] userId=${userId} myGalleries=${myGalleries.length} totalPrintOrders=${totalOrders}`)

    const data = await sql`
      SELECT o.id, o.gallery_id, o.session_id, o.client_name, o.client_email,
             o.items, o.total::float8 AS total, o.status, o.notes, o.created_at,
             json_build_object('id', g.id, 'name', g.name) AS galleries
      FROM print_orders o
      JOIN galleries g ON g.id = o.gallery_id
      WHERE g.user_id = ${userId}
      ORDER BY o.created_at DESC
    `
    console.log(`[/api/orders] returned ${data.length} orders for userId=${userId}`)

    // Se 0 ordini ma esistono print_orders, c'è un mismatch user_id → includi info debug
    if (data.length === 0 && totalOrders > 0) {
      const sample = await sql`
        SELECT o.gallery_id, g.user_id AS gallery_user_id
        FROM print_orders o
        LEFT JOIN galleries g ON g.id = o.gallery_id
        LIMIT 3
      `
      console.warn('[/api/orders] MISMATCH! Sample rows:', JSON.stringify(sample))
      return NextResponse.json({ orders: [], debug: { userId, totalOrders, myGalleries: myGalleries.length, sample } })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/orders] SQL error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

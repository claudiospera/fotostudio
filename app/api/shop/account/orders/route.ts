// app/api/shop/account/orders/route.ts
// Restituisce gli ordini dell'utente loggato (per email o userId)

import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress

  if (!email) return NextResponse.json({ orders: [] })

  // Cerca per email (include ordini fatti prima della registrazione)
  const orders = await sql`
    SELECT
      id, status, payment_method, payment_status,
      customer_name, customer_email,
      items, total, created_at
    FROM shop_orders
    WHERE customer_email = ${email}
    ORDER BY created_at DESC
    LIMIT 50
  `

  return NextResponse.json({ orders })
}

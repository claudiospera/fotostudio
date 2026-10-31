import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { notifyOrderShipped } from '@/lib/notify-order'

// Invia (o reinvia) manualmente l'email di spedizione al cliente,
// indipendentemente da un cambio di stato — utile per ordini già segnati
// come "Spedito" prima che il tracking fosse disponibile o salvato.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await params
  const rows = await sql`
    SELECT customer_name, customer_email, tracking_number, carrier FROM shop_orders WHERE id = ${id}
  ` as { customer_name: string; customer_email: string; tracking_number: string | null; carrier: string | null }[]
  const order = rows[0]
  if (!order) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })
  if (!order.customer_email) return NextResponse.json({ error: 'Cliente senza email' }, { status: 400 })

  try {
    await notifyOrderShipped({
      orderId: id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      trackingNumber: order.tracking_number,
      carrier: order.carrier,
    })
  } catch (err) {
    console.error('notify-shipped: invio email fallito', err)
    return NextResponse.json({ error: 'Invio email fallito' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

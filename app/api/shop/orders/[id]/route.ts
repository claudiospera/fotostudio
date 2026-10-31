import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { notifyOrderShipped } from '@/lib/notify-order'

// GET pubblico — solo i campi necessari per la pagina conferma ordine
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await sql`
    SELECT id, customer_name, total, discount, coupon_code, items, payment_method, payment_status,
           delivery_method, shipping_cost, shipping_address
    FROM shop_orders
    WHERE id = ${id}
  `
  if (rows.length === 0) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await params
  const { status, trackingNumber, carrier } = await req.json() as { status?: string; trackingNumber?: string; carrier?: string | null }

  const validStatuses = ['pending', 'confirmed', 'ready', 'shipped', 'delivered', 'cancelled']
  if (status !== undefined && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })
  }
  if (status === undefined && trackingNumber === undefined && carrier === undefined) {
    return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 })
  }

  const beforeRows = await sql`
    SELECT status, customer_name, customer_email, tracking_number, carrier FROM shop_orders WHERE id = ${id}
  ` as { status: string; customer_name: string; customer_email: string; tracking_number: string | null; carrier: string | null }[]
  const [before] = beforeRows
  if (!before) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })

  const newStatus = status !== undefined ? status : before.status
  const newTracking = trackingNumber !== undefined ? trackingNumber : before.tracking_number
  const newCarrier = carrier !== undefined ? carrier : before.carrier

  await sql`UPDATE shop_orders SET status = ${newStatus}, tracking_number = ${newTracking}, carrier = ${newCarrier}, updated_at = now() WHERE id = ${id}`

  if (newStatus === 'shipped' && before.status !== 'shipped' && before.customer_email) {
    try {
      await notifyOrderShipped({
        orderId: id,
        customerName: before.customer_name,
        customerEmail: before.customer_email,
        trackingNumber: newTracking,
        carrier: newCarrier,
      })
    } catch (err) {
      // non bloccare l'aggiornamento dello stato se l'email fallisce
      console.error('shop_orders PATCH: email spedizione fallita', err)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM shop_orders WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}

'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Suspense } from 'react'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

interface OrderSummary {
  id: string
  customer_name: string
  total: number
  discount: number
  coupon_code: string | null
  items: { productName: string; variantLabel: string; quantity: number; price: number }[]
  payment_method: string
  payment_status: string
}

function OrdineConfermatoInner() {
  const params = useSearchParams()
  const orderId = params.get('orderId')
  const paid = params.get('paid') === '1'
  const [order, setOrder] = useState<OrderSummary | null>(null)

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/shop/orders/${orderId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setOrder(data) })
      .catch(() => {})
  }, [orderId])

  const subtotal = order ? order.total + (order.discount ?? 0) : 0

  return (
    <div style={{
      fontFamily: 'Montserrat, sans-serif',
      textAlign: 'center',
      padding: 'clamp(80px, 12vw, 140px) 24px',
      maxWidth: 560, margin: '0 auto',
    }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>{paid ? '💳' : '✅'}</div>

      <h1 style={{
        fontFamily: 'Poppins, sans-serif', fontWeight: 800,
        fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--n-tx)',
        letterSpacing: '-0.02em', marginBottom: 16,
      }}>
        {paid ? 'Pagamento ricevuto!' : 'Ordine confermato!'}
      </h1>

      <p style={{ color: 'var(--n-t2)', fontSize: 15, lineHeight: 1.7, marginBottom: 12 }}>
        {paid
          ? 'Il tuo pagamento è andato a buon fine. Riceverai una email di conferma a breve.'
          : 'Il tuo ordine è stato ricevuto. Ti contatteremo per organizzare il ritiro in studio.'}
      </p>

      {orderId && (
        <p style={{ fontSize: 12, color: 'var(--n-t3)', marginBottom: 24, fontFamily: 'monospace' }}>
          N° ordine: {orderId}
        </p>
      )}

      {/* Riepilogo ordine */}
      {order && (
        <div style={{
          background: 'var(--n-surface)', border: '1px solid var(--n-border)',
          borderRadius: 'var(--n-r)', padding: '20px 24px', marginBottom: 28, textAlign: 'left',
        }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--n-tx)', margin: '0 0 14px', fontFamily: 'Poppins, sans-serif' }}>
            Riepilogo ordine
          </p>

          {/* Prodotti */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--n-tx)' }}>{item.productName}</span>
                  <span style={{ color: 'var(--n-t2)', marginLeft: 6 }}>
                    {item.variantLabel} × {item.quantity}
                  </span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--n-tx)', flexShrink: 0, marginLeft: 12 }}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totali */}
          <div style={{ borderTop: '1px solid var(--n-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {order.coupon_code && order.discount > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--n-t2)' }}>Subtotale</span>
                  <span style={{ color: 'var(--n-t2)' }}>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                    Sconto ({order.coupon_code})
                  </span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                    −{formatPrice(order.discount)}
                  </span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, fontFamily: 'Poppins, sans-serif', marginTop: 4 }}>
              <span style={{ color: 'var(--n-tx)' }}>Totale pagato</span>
              <span style={{ color: 'var(--n-ac)' }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      )}

      {!paid && (
        <div style={{
          background: 'var(--n-surface)', border: '1px solid var(--n-border)',
          borderRadius: 'var(--n-r)', padding: '20px 24px', marginBottom: 36, textAlign: 'left',
        }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--n-tx)', margin: '0 0 8px' }}>📍 Come funziona il ritiro</p>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: 'var(--n-t2)', lineHeight: 1.8 }}>
            <li>Ti contatteremo per confermare la data di ritiro</li>
            <li>Pagamento in contanti o POS al momento del ritiro</li>
          </ul>
        </div>
      )}

      <Link href="/shop" style={{
        display: 'inline-block',
        background: 'var(--n-ac)', color: '#fff',
        borderRadius: 'var(--n-r2)', padding: '13px 28px',
        fontSize: 14, fontWeight: 700, textDecoration: 'none',
      }}>
        Continua lo shopping
      </Link>
    </div>
  )
}

export default function OrdineConfermatoPage() {
  return (
    <Suspense>
      <OrdineConfermatoInner />
    </Suspense>
  )
}

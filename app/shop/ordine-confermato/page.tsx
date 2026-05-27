'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function OrdineConfermatoInner() {
  const params = useSearchParams()
  const orderId = params.get('orderId')
  const paid = params.get('paid') === '1'

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
        <p style={{ fontSize: 12, color: 'var(--n-t3)', marginBottom: 36, fontFamily: 'monospace' }}>
          N° ordine: {orderId}
        </p>
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

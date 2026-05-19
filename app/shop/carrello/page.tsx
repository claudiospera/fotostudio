'use client'

// app/shop/carrello/page.tsx

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default function CartPage() {
  const { cart, total, removeItem, updateQuantity, clearCart } = useCart()
  const router = useRouter()

  if (cart.items.length === 0) {
    return (
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        textAlign: 'center',
        padding: 'clamp(80px, 12vw, 140px) 24px',
      }}>
        <div style={{ fontSize: '56px', marginBottom: 24 }}>🛒</div>
        <h1 style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 800,
          fontSize: 'clamp(22px, 3vw, 32px)', color: 'var(--n-tx)',
          marginBottom: 12,
        }}>
          Il carrello è vuoto
        </h1>
        <p style={{ color: 'var(--n-t2)', fontSize: '15px', marginBottom: 36 }}>
          Esplora il catalogo e scegli i tuoi prodotti preferiti.
        </p>
        <Link href="/shop" style={{
          display: 'inline-block',
          background: 'var(--n-ac)', color: '#fff',
          borderRadius: 'var(--n-r2)', padding: '13px 28px',
          fontSize: '13px', fontWeight: 700, textDecoration: 'none',
        }}>
          Vai allo shop
        </Link>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', maxWidth: 800, margin: '0 auto', padding: 'clamp(32px, 5vw, 64px) clamp(24px, 5vw, 40px)' }}>
      <h1 style={{
        fontFamily: 'Poppins, sans-serif', fontWeight: 800,
        fontSize: 'clamp(22px, 3vw, 32px)', color: 'var(--n-tx)',
        marginBottom: 36, letterSpacing: '-0.02em',
      }}>
        Carrello
      </h1>

      {/* Lista prodotti */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {cart.items.map((item, i) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 0',
              borderTop: i === 0 ? '1px solid var(--n-border)' : undefined,
              borderBottom: '1px solid var(--n-border)',
            }}
          >
            {/* Immagine */}
            <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: 'var(--n-surface)' }}>
              {item.image && (
                <Image src={item.image} alt={item.productName} fill style={{ objectFit: 'cover' }} />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--n-tx)', marginBottom: 2, fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.productName}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--n-t2)' }}>{item.variantLabel}</p>
            </div>

            {/* Quantità */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                style={{ width: 30, height: 30, border: '1px solid var(--n-border)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--n-tx)' }}
              >−</button>
              <span style={{ width: 28, textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                style={{ width: 30, height: 30, border: '1px solid var(--n-border)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--n-tx)' }}
              >+</button>
            </div>

            {/* Prezzo */}
            <p style={{ width: 80, textAlign: 'right', fontWeight: 700, fontSize: '14px', color: 'var(--n-ac)', flexShrink: 0 }}>
              {formatPrice(item.price * item.quantity)}
            </p>

            {/* Rimuovi */}
            <button
              onClick={() => removeItem(item.productId, item.variantId)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--n-t3)', transition: 'color .15s' }}
              aria-label="Rimuovi prodotto"
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e53e3e')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--n-t3)')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Totale */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--n-tx)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'var(--n-tx)' }}>Totale</span>
          <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: 'var(--n-ac)' }}>{formatPrice(total)}</span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--n-t3)', marginBottom: 28 }}>
          Ritiro in studio · nessuna spedizione
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            style={{
              flex: 1, minWidth: 180,
              background: 'var(--n-ac)', color: '#fff',
              border: 'none', borderRadius: 'var(--n-r2)',
              padding: '14px 24px', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '.02em',
            }}
            onClick={() => router.push('/shop/checkout')}
          >
            Procedi all&apos;ordine →
          </button>
          <button
            onClick={clearCart}
            style={{
              background: '#fff', color: 'var(--n-t2)',
              border: '1px solid var(--n-border)',
              borderRadius: 'var(--n-r2)', padding: '14px 20px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Svuota carrello
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

// app/shop/carrello/page.tsx

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default function CartPage() {
  const { cart, total, finalTotal, coupon, removeItem, updateQuantity, clearCart, applyCoupon, removeCoupon } = useCart()
  const router = useRouter()
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

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

      <style>{`
        .cart-row { display: flex; align-items: center; gap: 16px; padding: 18px 0; }
        .cart-info { flex: 1; min-width: 0; }
        .cart-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .cart-price { width: 72px; text-align: right; font-weight: 700; font-size: 14px; color: var(--n-ac); flex-shrink: 0; }
        @media (max-width: 480px) {
          .cart-row { flex-wrap: wrap; gap: 10px; }
          .cart-info { flex-basis: calc(100% - 88px); }
          .cart-controls { margin-left: 88px; }
          .cart-price { width: auto; margin-left: auto; }
        }
      `}</style>

      {/* Lista prodotti */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {cart.items.map((item, i) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="cart-row"
            style={{
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
            <div className="cart-info">
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--n-tx)', marginBottom: 2, fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.productName}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--n-t2)' }}>{item.variantLabel}</p>
            </div>

            {/* Quantità */}
            <div className="cart-controls">
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
            <p className="cart-price">
              {formatPrice(item.price * item.quantity)}
            </p>

            {/* Rimuovi */}
            <button
              onClick={() => removeItem(item.productId, item.variantId)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--n-t3)', transition: 'color .15s', flexShrink: 0 }}
              aria-label="Rimuovi prodotto"
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e53e3e')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--n-t3)')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Codice sconto */}
      <div style={{ marginTop: 28, padding: '20px 0', borderTop: '1px solid var(--n-border)' }}>
        {coupon ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--n-r2)', padding: '12px 16px',
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', margin: 0 }}>
                ✓ {coupon.label}
              </p>
              <p style={{ fontSize: 11, color: 'var(--n-t2)', margin: '2px 0 0' }}>
                Sconto applicato: −{formatPrice(coupon.discount)}
              </p>
            </div>
            <button
              onClick={removeCoupon}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--n-t3)', textDecoration: 'underline' }}
            >
              Rimuovi
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--n-t2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Codice sconto
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={couponInput}
                onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                placeholder="Es. ESTATE25"
                style={{
                  flex: 1, padding: '10px 14px', fontSize: 13,
                  border: `1px solid ${couponError ? '#e53e3e' : 'var(--n-border)'}`,
                  borderRadius: 'var(--n-r2)', background: '#fff',
                  color: 'var(--n-tx)', outline: 'none',
                  letterSpacing: '.06em', fontWeight: 600,
                }}
                onKeyDown={async e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (!couponInput.trim()) return
                    setCouponLoading(true)
                    const res = await applyCoupon(couponInput)
                    setCouponLoading(false)
                    if (!res.ok) setCouponError(res.error || 'Codice non valido')
                    else setCouponInput('')
                  }
                }}
              />
              <button
                disabled={couponLoading || !couponInput.trim()}
                onClick={async () => {
                  if (!couponInput.trim()) return
                  setCouponLoading(true)
                  const res = await applyCoupon(couponInput)
                  setCouponLoading(false)
                  if (!res.ok) setCouponError(res.error || 'Codice non valido')
                  else setCouponInput('')
                }}
                style={{
                  padding: '10px 18px', fontSize: 13, fontWeight: 700,
                  background: couponLoading || !couponInput.trim() ? 'var(--n-t3)' : 'var(--n-tx)',
                  color: '#fff', border: 'none', borderRadius: 'var(--n-r2)',
                  cursor: couponLoading || !couponInput.trim() ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {couponLoading ? '…' : 'Applica'}
              </button>
            </div>
            {couponError && (
              <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{couponError}</p>
            )}
          </div>
        )}
      </div>

      {/* Totale */}
      <div style={{ marginTop: 16, paddingTop: 20, borderTop: '2px solid var(--n-tx)' }}>
        {coupon && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--n-t2)' }}>Subtotale</span>
            <span style={{ fontSize: 14, color: 'var(--n-t2)' }}>{formatPrice(total)}</span>
          </div>
        )}
        {coupon && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600 }}>Sconto ({coupon.code})</span>
            <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600 }}>−{formatPrice(coupon.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'var(--n-tx)' }}>Totale</span>
          <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: 'var(--n-ac)' }}>{formatPrice(finalTotal)}</span>
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
          <Link href="/shop" style={{
            background: '#fff', color: 'var(--n-t2)',
            border: '1px solid var(--n-border)',
            borderRadius: 'var(--n-r2)', padding: '14px 20px',
            fontSize: '13px', fontWeight: 500, textDecoration: 'none',
            display: 'flex', alignItems: 'center',
          }}>
            ← Continua gli acquisti
          </Link>
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

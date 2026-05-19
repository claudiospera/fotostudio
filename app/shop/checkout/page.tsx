'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/components/shop/CartProvider'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'studio'>('online')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (cart.items.length === 0) {
    return (
      <div style={{ fontFamily: 'Montserrat, sans-serif', textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🛒</p>
        <p style={{ color: 'var(--n-t2)', fontSize: 16, marginBottom: 24 }}>Il carrello è vuoto.</p>
        <Link href="/shop" style={{
          background: 'var(--n-ac)', color: '#fff',
          padding: '12px 24px', borderRadius: 'var(--n-r2)',
          fontWeight: 700, textDecoration: 'none', fontSize: 14,
        }}>Vai allo shop</Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Compila tutti i campi obbligatori.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name, email, phone, notes },
          items: cart.items,
          total,
          paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Errore'); return }

      clearCart()

      if (data.stripeUrl) {
        // Pagamento online → redirect a Stripe
        window.location.href = data.stripeUrl
      } else {
        // Pagamento in studio → pagina conferma
        router.push(`/shop/ordine-confermato?orderId=${data.orderId}`)
      }
    } catch {
      setError('Errore di connessione. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    border: '1px solid var(--n-border)', borderRadius: 'var(--n-r2)',
    background: '#fff', color: 'var(--n-tx)',
    outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: 'var(--n-t2)',
    letterSpacing: '.06em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', maxWidth: 880, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,4vw,40px)' }}>
      <h1 style={{
        fontFamily: 'Poppins, sans-serif', fontWeight: 800,
        fontSize: 'clamp(22px,3vw,30px)', color: 'var(--n-tx)',
        letterSpacing: '-0.02em', marginBottom: 36,
      }}>
        Completa l&apos;ordine
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>

        {/* ── FORM SINISTRA ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Dati cliente */}
          <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-border)', borderRadius: 'var(--n-r)', padding: 24 }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 20, color: 'var(--n-tx)' }}>
              I tuoi dati
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nome e Cognome *</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Es. Mario Rossi" required />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mario@email.it" required />
              </div>
              <div>
                <label style={labelStyle}>Telefono *</label>
                <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 333 000 0000" required />
              </div>
              <div>
                <label style={labelStyle}>Note (opzionale)</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Indicazioni particolari, preferenze di carta, ecc."
                />
              </div>
            </div>
          </div>

          {/* Ritiro */}
          <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-border)', borderRadius: 'var(--n-r)', padding: 24 }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--n-tx)' }}>
              Ritiro
            </h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              background: 'var(--n-acd)', border: '1px solid var(--n-ac)',
              borderRadius: 'var(--n-r2)',
            }}>
              <span style={{ fontSize: 22 }}>📍</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--n-tx)', margin: 0 }}>Ritiro in studio</p>
                <p style={{ fontSize: 12, color: 'var(--n-t2)', margin: '2px 0 0' }}>
                  Riceverai una mail di conferma per il ritiro. Nessuna spedizione.
                </p>
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-border)', borderRadius: 'var(--n-r)', padding: 24 }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--n-tx)' }}>
              Metodo di pagamento
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { value: 'online', label: 'Paga ora online', sublabel: 'Carta di credito / debito tramite Stripe', icon: '💳' },
                { value: 'studio', label: 'Paga al ritiro in studio', sublabel: 'Contanti o POS al momento del ritiro', icon: '🏠' },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 'var(--n-r2)', cursor: 'pointer',
                    border: paymentMethod === opt.value ? '2px solid var(--n-ac)' : '1px solid var(--n-border)',
                    background: paymentMethod === opt.value ? 'var(--n-acd)' : '#fff',
                    transition: 'all .15s',
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    style={{ accentColor: 'var(--n-ac)' }}
                  />
                  <span style={{ fontSize: 20 }}>{opt.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--n-tx)', margin: 0 }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--n-t2)', margin: '2px 0 0' }}>{opt.sublabel}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ color: '#e53e3e', fontSize: 13, background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'var(--n-t3)' : 'var(--n-ac)',
              color: '#fff', border: 'none',
              borderRadius: 'var(--n-r2)', padding: '15px 28px',
              fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              letterSpacing: '.02em', transition: 'background .15s',
            }}
          >
            {loading
              ? 'Elaborazione…'
              : paymentMethod === 'online'
                ? '💳 Vai al pagamento →'
                : '✅ Conferma ordine →'}
          </button>
        </form>

        {/* ── RIEPILOGO DESTRA ── */}
        <div style={{
          background: 'var(--n-surface)', border: '1px solid var(--n-border)',
          borderRadius: 'var(--n-r)', padding: 24, position: 'sticky', top: 24,
        }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--n-tx)' }}>
            Riepilogo ordine
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {cart.items.map(item => (
              <div key={`${item.productId}-${item.variantId}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f5f5f5' }}>
                  {item.image && <Image src={item.image} alt={item.productName} fill style={{ objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--n-tx)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.productName}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--n-t2)', margin: '2px 0 0' }}>{item.variantLabel} × {item.quantity}</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--n-tx)', flexShrink: 0 }}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--n-border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--n-t2)' }}>Spedizione</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--n-ac)' }}>Gratis (ritiro)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '2px solid var(--n-tx)' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--n-tx)' }}>Totale</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--n-ac)' }}>{formatPrice(total)}</span>
            </div>
          </div>

          <Link href="/shop/carrello" style={{
            display: 'block', textAlign: 'center', marginTop: 16,
            fontSize: 12, color: 'var(--n-t3)', textDecoration: 'none',
          }}>
            ← Modifica carrello
          </Link>
        </div>
      </div>
    </div>
  )
}

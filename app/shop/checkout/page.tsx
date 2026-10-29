'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/components/shop/CartProvider'
import { getLineTotal } from '@/lib/shop/calendar-pricing'
import { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, getShippingCost } from '@/lib/shop/shipping'
import type { DeliveryMethod, ShippingAddress } from '@/lib/shop/types'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const ITALIAN_ZIP = /^\d{5}$/
const ITALIAN_PROVINCE = /^[A-Za-z]{2}$/

const PAYMENT_OPTIONS: { value: 'online' | 'studio'; label: string; sublabel: string; icon: string }[] = [
  { value: 'online', label: 'Paga ora online', sublabel: 'Carta di credito / debito tramite Stripe', icon: '💳' },
  { value: 'studio', label: 'Paga al ritiro in studio', sublabel: 'Contanti o POS al momento del ritiro', icon: '🏠' },
]

export default function CheckoutPage() {
  const { cart, total, finalTotal, coupon, clearCart } = useCart()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
  const [address, setAddress] = useState<ShippingAddress>({
    recipientName: '', address: '', zip: '', city: '', province: '', phone: '', intercomNote: '',
  })
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({})
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'studio'>('online')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const shippingCost = getShippingCost(finalTotal, deliveryMethod)
  const grandTotal = finalTotal + shippingCost
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - finalTotal)

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

  function selectDelivery(method: DeliveryMethod) {
    setDeliveryMethod(method)
    if (method === 'shipping' && paymentMethod === 'studio') {
      setPaymentMethod('online')
    }
  }

  function validateAddress(): boolean {
    const errors: Partial<Record<keyof ShippingAddress, string>> = {}
    if (!address.recipientName.trim()) errors.recipientName = 'Campo obbligatorio'
    if (!address.address.trim()) errors.address = 'Campo obbligatorio'
    if (!ITALIAN_ZIP.test(address.zip.trim())) errors.zip = 'CAP non valido (5 cifre)'
    if (!address.city.trim()) errors.city = 'Campo obbligatorio'
    if (!ITALIAN_PROVINCE.test(address.province.trim())) errors.province = 'Sigla provincia non valida (2 lettere)'
    if (!address.phone.trim()) errors.phone = 'Campo obbligatorio'
    setAddressErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Compila tutti i campi obbligatori.')
      return
    }
    if (deliveryMethod === 'shipping' && !validateAddress()) {
      setError('Controlla i dati dell\'indirizzo di spedizione.')
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
          total: grandTotal,
          paymentMethod,
          couponCode: coupon?.code ?? null,
          discount: coupon?.discount ?? 0,
          deliveryMethod,
          shippingAddress: deliveryMethod === 'shipping'
            ? { ...address, zip: address.zip.trim(), province: address.province.trim().toUpperCase() }
            : undefined,
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

  const errorInputStyle = { ...inputStyle, border: '1px solid #e53e3e' }

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: 'var(--n-t2)',
    letterSpacing: '.06em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 6,
  }

  const fieldErrorStyle = { fontSize: 11, color: '#e53e3e', marginTop: 4 }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', maxWidth: 880, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,4vw,40px)' }}>
      <h1 style={{
        fontFamily: 'Poppins, sans-serif', fontWeight: 800,
        fontSize: 'clamp(22px,3vw,30px)', color: 'var(--n-tx)',
        letterSpacing: '-0.02em', marginBottom: 36,
      }}>
        Completa l&apos;ordine
      </h1>

      <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>
        <style>{`
          @media (max-width: 680px) {
            .checkout-grid {
              grid-template-columns: 1fr !important;
            }
            .checkout-summary {
              order: -1;
              position: static !important;
            }
          }
        `}</style>

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

          {/* Consegna */}
          <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-border)', borderRadius: 'var(--n-r)', padding: 24 }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--n-tx)' }}>
              Consegna
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: deliveryMethod === 'shipping' ? 20 : 0 }}>
              {([
                { value: 'pickup', label: 'Ritiro in studio', sublabel: 'Gratuito. Ti contatteremo per organizzare il ritiro.', icon: '📍' },
                { value: 'shipping', label: 'Spedizione a domicilio', sublabel: `Corriere espresso — ${formatPrice(SHIPPING_FEE)}, gratuita sopra ${formatPrice(FREE_SHIPPING_THRESHOLD)}`, icon: '📦' },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 'var(--n-r2)', cursor: 'pointer',
                    border: deliveryMethod === opt.value ? '2px solid var(--n-ac)' : '1px solid var(--n-border)',
                    background: deliveryMethod === opt.value ? 'var(--n-acd)' : '#fff',
                    transition: 'all .15s',
                  }}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={opt.value}
                    checked={deliveryMethod === opt.value}
                    onChange={() => selectDelivery(opt.value)}
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

            {deliveryMethod === 'shipping' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 20, borderTop: '1px solid var(--n-border)' }}>
                <div>
                  <label style={labelStyle}>Nome destinatario *</label>
                  <input
                    style={addressErrors.recipientName ? errorInputStyle : inputStyle}
                    value={address.recipientName}
                    onChange={e => setAddress(a => ({ ...a, recipientName: e.target.value }))}
                    placeholder="Es. Mario Rossi"
                  />
                  {addressErrors.recipientName && <p style={fieldErrorStyle}>{addressErrors.recipientName}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Indirizzo *</label>
                  <input
                    style={addressErrors.address ? errorInputStyle : inputStyle}
                    value={address.address}
                    onChange={e => setAddress(a => ({ ...a, address: e.target.value }))}
                    placeholder="Via, numero civico"
                  />
                  {addressErrors.address && <p style={fieldErrorStyle}>{addressErrors.address}</p>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>CAP *</label>
                    <input
                      style={addressErrors.zip ? errorInputStyle : inputStyle}
                      value={address.zip}
                      onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))}
                      placeholder="83036"
                      maxLength={5}
                    />
                    {addressErrors.zip && <p style={fieldErrorStyle}>{addressErrors.zip}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Città *</label>
                    <input
                      style={addressErrors.city ? errorInputStyle : inputStyle}
                      value={address.city}
                      onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                      placeholder="Napoli"
                    />
                    {addressErrors.city && <p style={fieldErrorStyle}>{addressErrors.city}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Prov. *</label>
                    <input
                      style={addressErrors.province ? errorInputStyle : inputStyle}
                      value={address.province}
                      onChange={e => setAddress(a => ({ ...a, province: e.target.value.toUpperCase() }))}
                      placeholder="NA"
                      maxLength={2}
                    />
                    {addressErrors.province && <p style={fieldErrorStyle}>{addressErrors.province}</p>}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Telefono per il corriere *</label>
                  <input
                    style={addressErrors.phone ? errorInputStyle : inputStyle}
                    type="tel"
                    value={address.phone}
                    onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                    placeholder="+39 333 000 0000"
                  />
                  {addressErrors.phone && <p style={fieldErrorStyle}>{addressErrors.phone}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Note citofono (opzionale)</label>
                  <input
                    style={inputStyle}
                    value={address.intercomNote}
                    onChange={e => setAddress(a => ({ ...a, intercomNote: e.target.value }))}
                    placeholder="Es. Cognome sul citofono, piano, ecc."
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--n-t3)', margin: 0 }}>
                  Spediamo solo in Italia.
                </p>
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-border)', borderRadius: 'var(--n-r)', padding: 24 }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--n-tx)' }}>
              Metodo di pagamento
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(PAYMENT_OPTIONS.filter(opt => opt.value === 'online' || deliveryMethod === 'pickup')).map(opt => (
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
            {deliveryMethod === 'shipping' && (
              <p style={{ fontSize: 11, color: 'var(--n-t3)', marginTop: 10 }}>
                Con la spedizione a domicilio è disponibile solo il pagamento online.
              </p>
            )}
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
        <div className="checkout-summary" style={{
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
                  {formatPrice(getLineTotal(item))}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--n-border)', paddingTop: 16 }}>
            {coupon && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--n-t2)' }}>Subtotale</span>
                  <span style={{ fontSize: 13, color: 'var(--n-t2)' }}>{formatPrice(total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Sconto ({coupon.code})</span>
                  <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>−{formatPrice(coupon.discount)}</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--n-t2)' }}>Spedizione</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--n-ac)' }}>
                {deliveryMethod === 'pickup' ? 'Gratis (ritiro)' : shippingCost > 0 ? formatPrice(shippingCost) : 'Gratis'}
              </span>
            </div>
            {deliveryMethod === 'shipping' && shippingCost > 0 && (
              <p style={{ fontSize: 11, color: 'var(--n-t3)', margin: '0 0 6px' }}>
                Ti mancano {formatPrice(missingForFreeShipping)} per la spedizione gratuita.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '2px solid var(--n-tx)' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--n-tx)' }}>Totale</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--n-ac)' }}>{formatPrice(grandTotal)}</span>
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

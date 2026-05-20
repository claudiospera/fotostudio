'use client'

// app/shop/account/page.tsx
// Area personale cliente: storico ordini + carrello salvato

import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Package, LogOut, ChevronRight } from 'lucide-react'

type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled'

interface ShopOrder {
  id: string
  status: OrderStatus
  payment_method: string
  payment_status: string
  customer_name: string
  customer_email: string
  items: { productName: string; variantLabel: string; quantity: number; price: number }[]
  total: number
  created_at: string
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

const STATUS_LABEL: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'In attesa',      color: '#b45309', bg: '#fef3c7' },
  confirmed: { label: 'Confermato',     color: '#0369a1', bg: '#e0f2fe' },
  ready:     { label: 'Pronto',         color: '#15803d', bg: '#dcfce7' },
  delivered: { label: 'Consegnato',     color: '#6b7280', bg: '#f3f4f6' },
  cancelled: { label: 'Annullato',      color: '#dc2626', bg: '#fee2e2' },
}

export default function AccountPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.replace('/shop/accedi'); return }

    fetch('/api/shop/account/orders')
      .then(r => r.json())
      .then(data => setOrders(data.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoaded, user, router])

  if (!isLoaded || !user) return null

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) clamp(20px, 5vw, 40px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
          <div>
            <nav style={{ fontSize: '12px', color: '#999', marginBottom: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
              <Link href="/shop" style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
              <span>/</span>
              <span style={{ color: '#0a0a0a' }}>Il mio account</span>
            </nav>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.02em' }}>
              Ciao, {user.firstName || user.emailAddresses[0]?.emailAddress} 👋
            </h1>
            <p style={{ fontSize: '13px', color: '#888', marginTop: 4 }}>
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/shop/carrello" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              border: '1.5px solid #00c1de', borderRadius: 10, color: '#00c1de',
              fontWeight: 700, fontSize: '13px', textDecoration: 'none',
              fontFamily: 'Poppins, sans-serif',
            }}>
              <ShoppingCart size={14} /> Carrello
            </Link>
            <button
              onClick={() => signOut(() => router.push('/shop'))}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                border: '1.5px solid #e0e0e0', borderRadius: 10, color: '#888',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                background: '#fff', fontFamily: 'Poppins, sans-serif',
              }}
            >
              <LogOut size={14} /> Esci
            </button>
          </div>
        </div>

        {/* Ordini */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Package size={18} color="#00c1de" />
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '17px', color: '#0a0a0a' }}>
              I tuoi ordini
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb', fontSize: '14px' }}>
              Caricamento ordini…
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16,
              padding: '48px 24px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '40px', marginBottom: 16 }}>📦</p>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0a0a0a', marginBottom: 8 }}>
                Nessun ordine ancora
              </p>
              <p style={{ fontSize: '13px', color: '#aaa', marginBottom: 24 }}>
                I tuoi ordini appariranno qui dopo il primo acquisto.
              </p>
              <Link href="/shop" style={{
                display: 'inline-block', padding: '11px 24px', borderRadius: 10,
                background: '#00c1de', color: '#fff', fontFamily: 'Poppins, sans-serif',
                fontWeight: 700, fontSize: '13px', textDecoration: 'none',
              }}>
                Vai allo shop
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map(order => {
                const st = STATUS_LABEL[order.status] ?? STATUS_LABEL.pending
                return (
                  <div key={order.id} style={{
                    background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14,
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 16,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0a0a0a' }}>
                          Ordine #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: '11px', fontWeight: 700,
                          color: st.color, background: st.bg,
                        }}>
                          {st.label}
                        </span>
                        {order.payment_status === 'paid' && (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '11px', fontWeight: 700, color: '#15803d', background: '#dcfce7' }}>
                            Pagato
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: '#aaa' }}>
                        {formatDate(order.created_at)} · {order.items.length} {order.items.length === 1 ? 'prodotto' : 'prodotti'}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                        {order.items.slice(0, 3).map((item, i) => (
                          <span key={i} style={{ fontSize: '12px', color: '#666', background: '#f5f5f5', borderRadius: 6, padding: '3px 8px' }}>
                            {item.quantity}× {item.productName}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span style={{ fontSize: '12px', color: '#aaa', background: '#f5f5f5', borderRadius: 6, padding: '3px 8px' }}>
                            +{order.items.length - 3} altri
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '18px', color: '#00c1de' }}>
                        {formatPrice(order.total)}
                      </p>
                      <ChevronRight size={18} color="#ccc" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Info */}
        <div style={{ marginTop: 40, padding: '20px 24px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, fontSize: '13px', color: '#888', lineHeight: 1.7 }}>
          Per assistenza sugli ordini scrivi a{' '}
          <a href="mailto:info@claudiospera.com" style={{ color: '#00c1de' }}>info@claudiospera.com</a>
          {' '}o chiama il{' '}
          <a href="tel:+393897855581" style={{ color: '#00c1de' }}>+39 389 785 5581</a>.
        </div>

      </div>
    </div>
  )
}

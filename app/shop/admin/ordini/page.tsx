'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface OrderItem {
  productName: string
  variantLabel: string
  quantity: number
  price: number
  image?: string
  filename?: string
}

interface ShopOrder {
  id: string
  status: 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled'
  payment_method: 'online' | 'studio'
  payment_status: 'unpaid' | 'paid'
  customer_name: string
  customer_email: string
  customer_phone: string
  notes: string | null
  items: OrderItem[]
  total: number
  created_at: string
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const STATUS_LABEL: Record<ShopOrder['status'], string> = {
  pending:   'In attesa',
  confirmed: 'Confermato',
  ready:     'Pronto al ritiro',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
}

const STATUS_COLOR: Record<ShopOrder['status'], { bg: string; color: string }> = {
  pending:   { bg: '#fff8e1', color: '#b45309' },
  confirmed: { bg: '#e0f2fe', color: '#0369a1' },
  ready:     { bg: '#d1fae5', color: '#065f46' },
  delivered: { bg: '#f0fdf4', color: '#166534' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
}

export default function AdminOrdiniPage() {
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/shop/orders')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data) })
      .finally(() => setLoading(false))
  }, [])

  async function deleteOrder(orderId: string) {
    if (!confirm('Eliminare questo ordine? L\'operazione non è reversibile.')) return
    setDeleting(orderId)
    await fetch(`/api/shop/orders/${orderId}`, { method: 'DELETE' })
    setOrders(prev => prev.filter(o => o.id !== orderId))
    setExpanded(null)
    setDeleting(null)
  }

  async function updateStatus(orderId: string, status: ShopOrder['status']) {
    setUpdating(orderId)
    await fetch(`/api/shop/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    setUpdating(null)
  }

  const pending = orders.filter(o => o.status === 'pending').length

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', minHeight: '100vh', background: '#f5f5f5' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 500, color: '#555',
              textDecoration: 'none', padding: '6px 12px',
              borderRadius: 8, border: '1px solid #e8e8e8', background: '#fff',
            }}>
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>
              Ordini stampe
            </h1>
            {pending > 0 && (
              <span style={{
                background: '#ef4444', color: '#fff',
                borderRadius: 20, padding: '2px 8px',
                fontSize: 12, fontWeight: 700,
              }}>
                {pending} nuovi
              </span>
            )}
          </div>
          <span style={{ fontSize: 13, color: '#999' }}>{orders.length} ordini totali</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(20px,4vw,48px)' }}>

        {loading && <p style={{ color: '#999', fontSize: 14 }}>Caricamento…</p>}

        {!loading && orders.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
            <p style={{ color: '#999', fontSize: 15 }}>Nessun ordine ricevuto.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => {
            const sc = STATUS_COLOR[order.status]
            const isOpen = expanded === order.id
            return (
              <div key={order.id} style={{
                background: '#fff', border: '1px solid #e8e8e8',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Riga principale */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  {/* Stato badge */}
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: sc.bg, color: sc.color, flexShrink: 0,
                  }}>
                    {STATUS_LABEL[order.status]}
                  </span>

                  {/* Cliente */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>
                      {order.customer_name}
                    </p>
                    <p style={{ fontSize: 12, color: '#777', margin: '2px 0 0' }}>
                      {order.customer_email} · {order.customer_phone}
                    </p>
                  </div>

                  {/* Pagamento */}
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#999', margin: 0 }}>
                      {order.payment_method === 'online' ? '💳 Online' : '🏠 Studio'}
                    </p>
                    <p style={{
                      fontSize: 11, fontWeight: 700, margin: '2px 0 0',
                      color: order.payment_status === 'paid' ? '#16a34a' : '#b45309',
                    }}>
                      {order.payment_status === 'paid' ? 'Pagato' : 'Non pagato'}
                    </p>
                  </div>

                  {/* Totale */}
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#111', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                    {formatPrice(order.total)}
                  </span>

                  {/* Data */}
                  <span style={{ fontSize: 12, color: '#999', flexShrink: 0 }}>
                    {new Date(order.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>

                  <span style={{ color: '#ccc', fontSize: 14 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Dettaglio espanso */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f0f0f0', padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                      {/* Articoli + foto cliente */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                          Articoli
                        </p>
                        {order.items.map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '8px 0', borderBottom: '1px solid #f5f5f5',
                          }}>
                            {/* Anteprima foto cliente */}
                            {item.image?.startsWith('https://') ? (
                              <a href={item.image} download target="_blank" rel="noreferrer" title="Scarica foto" style={{ flexShrink: 0 }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.image}
                                  alt="foto cliente"
                                  style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e8e8', display: 'block' }}
                                />
                              </a>
                            ) : (
                              <div style={{ width: 52, height: 52, borderRadius: 6, background: '#f5f5f5', border: '1px solid #eee', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                🖼️
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, color: '#333', margin: 0 }}>
                                {item.productName} — {item.variantLabel}
                                <span style={{ color: '#999' }}> ×{item.quantity}</span>
                              </p>
                              {item.image?.startsWith('https://') && (
                                <a
                                  href={`/api/shop/download-photo?url=${encodeURIComponent(item.image)}&filename=${encodeURIComponent(item.filename || 'foto.jpg')}`}
                                  style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
                                >
                                  ↓ Scarica foto originale
                                </a>
                              )}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#111', flexShrink: 0 }}>
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontWeight: 800, fontSize: 15 }}>
                          <span>Totale</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>

                        {order.notes && (
                          <div style={{ marginTop: 16, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                            <p style={{ fontSize: 12, color: '#78350f', margin: 0 }}>📝 {order.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Gestione stato */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                            Aggiorna stato
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(['pending', 'confirmed', 'ready', 'delivered', 'cancelled'] as const).map(s => {
                              const c = STATUS_COLOR[s]
                              const isActive = order.status === s
                              return (
                                <button
                                  key={s}
                                  disabled={isActive || updating === order.id}
                                  onClick={() => updateStatus(order.id, s)}
                                  style={{
                                    padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                    cursor: isActive || updating === order.id ? 'default' : 'pointer',
                                    border: isActive ? `2px solid ${c.color}` : '1px solid #e8e8e8',
                                    background: isActive ? c.bg : '#fff',
                                    color: isActive ? c.color : '#555',
                                    textAlign: 'left',
                                    transition: 'all .15s',
                                  }}
                                >
                                  {isActive ? '✓ ' : ''}{STATUS_LABEL[s]}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <button
                          disabled={deleting === order.id}
                          onClick={() => deleteOrder(order.id)}
                          style={{
                            padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            cursor: deleting === order.id ? 'not-allowed' : 'pointer',
                            border: '1px solid #fca5a5',
                            background: '#fff', color: '#dc2626',
                            textAlign: 'left', transition: 'all .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                        >
                          {deleting === order.id ? 'Eliminando…' : '🗑 Elimina ordine'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

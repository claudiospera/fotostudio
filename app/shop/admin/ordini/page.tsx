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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: '.08em', textTransform: 'uppercase', margin: 0 }}>
                            Articoli
                          </p>
                          {order.items.some(i => i.image?.startsWith('https://')) && (
                            <a
                              href={`/api/shop/orders/${order.id}/download-photos`}
                              style={{
                                fontSize: 12, fontWeight: 700, color: '#fff',
                                background: '#6366f1', borderRadius: 8,
                                padding: '5px 12px', textDecoration: 'none',
                                display: 'flex', alignItems: 'center', gap: 5,
                              }}
                            >
                              ⬇ Scarica tutte le foto
                            </a>
                          )}
                        </div>
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

                        {/* Notifiche cliente */}
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                            Avvisa il cliente
                          </p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <a
                              href={`https://wa.me/39${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Ciao ${order.customer_name}! 👋\n\nIl tuo ordine da Storie da Raccontare è in lavorazione. 🖨️\n\nTi avviseremo non appena sarà pronto per il ritiro in studio.\n\nGrazie per aver scelto noi! 😊`)}`}
                              target="_blank" rel="noreferrer"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                background: '#25D366', color: '#fff', textDecoration: 'none',
                              }}
                            >
                              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              WhatsApp
                            </a>
                            <a
                              href={`mailto:${order.customer_email}?subject=Il tuo ordine è in lavorazione — Storie da Raccontare&body=Ciao ${order.customer_name}!%0D%0A%0D%0AIl tuo ordine è in lavorazione presso il nostro studio.%0D%0ATi contatteremo non appena sarà pronto per il ritiro.%0D%0A%0D%0AGrazie per aver scelto Storie da Raccontare!%0D%0A%0D%0AClaudio Spera Fotografo`}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                background: '#6366f1', color: '#fff', textDecoration: 'none',
                              }}
                            >
                              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                              Email
                            </a>
                            <a
                              href={`https://wa.me/39${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Ciao ${order.customer_name}!\n\nIl tuo ordine da Storie da Raccontare e' PRONTO!\n\nPuoi ritirarlo in studio quando vuoi.\n\nTi aspettiamo!`)}`}
                              target="_blank" rel="noreferrer"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                background: '#fff', color: '#25D366', textDecoration: 'none',
                                border: '1.5px solid #25D366',
                              }}
                            >
                              <svg viewBox="0 0 24 24" width={15} height={15} fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              Pronto al ritiro
                            </a>
                          </div>
                        </div>

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

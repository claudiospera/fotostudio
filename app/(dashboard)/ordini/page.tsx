'use client'

import { useEffect, useState, useCallback } from 'react'

// ── types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  photo_id: string
  photo_url: string
  filename: string
  type: 'carta' | 'tela'
  format: string
  format_label: string
  qty: number
  unit_price: number
  total: number
}

interface PrintOrder {
  id: string
  gallery_id: string
  session_id: string
  client_name: string | null
  client_email: string | null
  items: OrderItem[]
  total: number
  status: 'nuovo' | 'visto' | 'completato'
  notes: string | null
  created_at: string
  galleries?: { id: string; name: string; user_id: string }
}

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  nuovo:      { label: 'Nuovo',      color: '#d97070', bg: 'rgba(217,112,112,.12)' },
  visto:      { label: 'Visto',      color: '#c9a05a', bg: 'rgba(201,160,90,.12)'  },
  completato: { label: 'Completato', color: '#8ec9b0', bg: 'rgba(142,201,176,.12)' },
}

// ── OrderDetail modal ──────────────────────────────────────────────────────

interface OrderDetailProps {
  order: PrintOrder
  onClose: () => void
  onStatusChange: (id: string, status: PrintOrder['status']) => void
  onDelete: (id: string) => void
}

function OrderDetail({ order, onClose, onStatusChange, onDelete }: OrderDetailProps) {
  const [updating, setUpdating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const updateStatus = async (status: PrintOrder['status']) => {
    setUpdating(true)
    await fetch(`/api/galleries/${order.gallery_id}/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id, status }),
    })
    setUpdating(false)
    onStatusChange(order.id, status)
  }

  const deleteOrder = async () => {
    setDeleting(true)
    await fetch(`/api/galleries/${order.gallery_id}/orders`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id }),
    })
    setDeleting(false)
    onDelete(order.id)
    onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.nuovo

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .2s ease' }}
    >
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'slideUp .25s ease', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--tx)' }}>
              Ordine #{order.id.slice(-8).toUpperCase()}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 2 }}>
              {order.galleries?.name ?? 'Galleria'} · {formatDate(order.created_at)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, borderRadius: 6, padding: '3px 8px' }}>{st.label}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6 }}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Cliente */}
          <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Dati cliente</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '13px', color: 'var(--tx)', fontWeight: 500 }}>{order.client_name ?? '—'}</span>
              {order.client_email && (
                <a href={`mailto:${order.client_email}`} style={{ fontSize: '12px', color: 'var(--ac)', textDecoration: 'none' }}>{order.client_email}</a>
              )}
            </div>
          </div>

          {/* Prodotti */}
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>Prodotti ordinati</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', color: 'var(--tx)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
                    <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 2 }}>
                      {item.type === 'carta' ? '📄 Stampa carta' : '🖼️ Stampa tela'} · {item.format_label}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--t2)', marginTop: 3 }}>
                      {item.qty} × {fmt(item.unit_price)}
                    </p>
                  </div>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--tx)', flexShrink: 0 }}>
                    {fmt(item.qty * item.unit_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {order.notes && (
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Note</p>
              <p style={{ fontSize: '12px', color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.6 }}>{order.notes}</p>
            </div>
          )}

          {/* Totale */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--acd)', border: '1px solid rgba(142,201,176,.2)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
            <span style={{ fontSize: '13px', color: 'var(--t2)', fontWeight: 500 }}>Totale ordine</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--ac)' }}>{fmt(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Elimina ordine"
              style={{ background: 'none', border: '1px solid rgba(217,112,112,.25)', borderRadius: 'var(--r2)', padding: '9px 12px', cursor: 'pointer', color: 'var(--red)', opacity: .7, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '.7')}
            >
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Elimina
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 500 }}>Sicuro?</span>
              <button
                onClick={deleteOrder}
                disabled={deleting}
                style={{ background: 'var(--red)', border: 'none', borderRadius: 'var(--r2)', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: deleting ? 'default' : 'pointer', color: '#fff', opacity: deleting ? .6 : 1 }}
              >
                {deleting ? '…' : 'Sì, elimina'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', color: 'var(--t2)' }}
              >
                Annulla
              </button>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {order.status !== 'visto' && (
            <button
              onClick={() => updateStatus('visto')}
              disabled={updating}
              style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '9px 16px', fontSize: '12px', fontWeight: 500, cursor: updating ? 'default' : 'pointer', color: 'var(--t2)', opacity: updating ? .6 : 1, transition: 'all .15s' }}
            >
              Segna come visto
            </button>
          )}
          {order.status !== 'completato' && (
            <button
              onClick={() => updateStatus('completato')}
              disabled={updating}
              style={{ background: 'var(--ac)', border: 'none', borderRadius: 'var(--r2)', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: updating ? 'default' : 'pointer', color: '#111', opacity: updating ? .6 : 1, transition: 'all .15s' }}
            >
              Segna come completato
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function OrdiniPage() {
  const [orders, setOrders]         = useState<PrintOrder[]>([])
  const [loading, setLoading]       = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(null)
  const [filter, setFilter]         = useState<'tutti' | PrintOrder['status']>('tutti')

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.ok ? r.json() : [])
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = useCallback((id: string, status: PrintOrder['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    setSelectedOrder(prev => prev?.id === id ? { ...prev, status } : prev)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id))
  }, [])

  const nuovi    = orders.filter(o => o.status === 'nuovo').length
  const filtered = filter === 'tutti' ? orders : orders.filter(o => o.status === filter)

  const FILTERS: { key: 'tutti' | PrintOrder['status']; label: string }[] = [
    { key: 'tutti',      label: 'Tutti' },
    { key: 'nuovo',      label: 'Nuovi' },
    { key: 'visto',      label: 'Visti' },
    { key: 'completato', label: 'Completati' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>

      {/* Topbar */}
      <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--tx)', letterSpacing: '-0.02em' }}>
            Ordini stampe
            {nuovi > 0 && (
              <span style={{ marginLeft: 10, background: 'var(--red)', color: '#fff', fontSize: '11px', fontWeight: 700, borderRadius: 20, padding: '2px 8px', verticalAlign: 'middle' }}>
                {nuovi} {nuovi === 1 ? 'nuovo' : 'nuovi'}
              </span>
            )}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--t3)', marginTop: 2 }}>Ordini ricevuti dai tuoi portali clienti</p>
        </div>
      </div>

      {/* Filtri */}
      <div style={{ padding: '0 28px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{ background: filter === f.key ? 'var(--acd)' : 'var(--s1)', border: `1px solid ${filter === f.key ? 'rgba(142,201,176,.25)' : 'var(--b1)'}`, borderRadius: 'var(--r2)', padding: '5px 14px', fontSize: '12px', fontWeight: filter === f.key ? 600 : 400, color: filter === f.key ? 'var(--ac)' : 'var(--t2)', cursor: 'pointer', transition: 'all .15s' }}
          >
            {f.label}
            {f.key === 'nuovo' && nuovi > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--red)', color: '#fff', fontSize: '9px', fontWeight: 700, borderRadius: 10, padding: '1px 5px' }}>{nuovi}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 28px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--t3)' }}>
            <div style={{ width: 28, height: 28, border: '2px solid var(--ac)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px' }}>Caricamento ordini…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: 52, height: 52, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="var(--t3)" strokeWidth={1.5} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--t2)', fontWeight: 500 }}>
              {filter === 'tutti' ? 'Nessun ordine ricevuto' : `Nessun ordine "${FILTERS.find(f => f.key === filter)?.label.toLowerCase()}"`}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: 6 }}>Gli ordini appariranno qui quando i clienti acquistano stampe</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px 90px 100px', gap: 12, padding: '6px 14px', fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>
              <span>Cliente</span>
              <span>Galleria</span>
              <span>Data</span>
              <span style={{ textAlign: 'right' }}>Totale</span>
              <span style={{ textAlign: 'center' }}>Stato</span>
            </div>

            {filtered.map(order => {
              const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.nuovo
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px 90px 100px', gap: 12, padding: '12px 14px', background: 'var(--s1)', border: `1px solid ${order.status === 'nuovo' ? 'rgba(217,112,112,.2)' : 'var(--b1)'}`, borderRadius: 'var(--r2)', cursor: 'pointer', transition: 'all .15s', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--s1)')}
                >
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--tx)', fontWeight: 500 }}>{order.client_name ?? '—'}</p>
                    {order.client_email && <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 1 }}>{order.client_email}</p>}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.galleries?.name ?? '—'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
                    {new Date(order.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontSize: '13px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--tx)', textAlign: 'right' }}>
                    {fmt(order.total)}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: st.color, background: st.bg, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes slideUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  )
}

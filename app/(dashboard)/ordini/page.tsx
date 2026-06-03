'use client'

import { useEffect, useState, useCallback } from 'react'

// ── types ──────────────────────────────────────────────────────────────────

interface GalleryOrderItem {
  photo_id: string
  photo_url: string
  filename: string
  product_id?: string
  variant_id?: string
  product_name?: string
  type?: 'carta' | 'tela'
  format?: string
  format_label: string
  qty: number
  unit_price: number
  total: number
  frame_label?: string | null
  passepartout_label?: string | null
  print_type_label?: string | null
  crop_x?: number | null
  crop_y?: number | null
  zoom?: number | null
  instax_text?: string | null
}

interface GalleryOrder {
  id: string
  gallery_id: string
  session_id: string
  client_name: string | null
  client_email: string | null
  items: GalleryOrderItem[]
  total: number
  status: 'nuovo' | 'visto' | 'completato'
  notes: string | null
  created_at: string
  galleries?: { id: string; name: string }
}

interface ShopOrderItem {
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
  items: ShopOrderItem[]
  total: number
  created_at: string
}

// ── helpers ────────────────────────────────────────────────────────────────

function fmtEur(n: number | string) { return Number(n).toFixed(2).replace('.', ',') + ' €' }
function fmtCents(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

const GALLERY_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  nuovo:      { label: 'Nuovo',      color: '#d97070', bg: 'rgba(217,112,112,.12)' },
  visto:      { label: 'Visto',      color: '#c9a05a', bg: 'rgba(201,160,90,.12)'  },
  completato: { label: 'Completato', color: '#8ec9b0', bg: 'rgba(142,201,176,.12)' },
}

const SHOP_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'In attesa',      color: '#c9a05a', bg: 'rgba(201,160,90,.12)'  },
  confirmed: { label: 'Confermato',     color: '#7ec8e3', bg: 'rgba(126,200,227,.12)' },
  ready:     { label: 'Pronto',         color: '#8ec9b0', bg: 'rgba(142,201,176,.12)' },
  delivered: { label: 'Consegnato',     color: '#8ec9b0', bg: 'rgba(142,201,176,.12)' },
  cancelled: { label: 'Annullato',      color: '#d97070', bg: 'rgba(217,112,112,.12)' },
}

// ── GalleryOrderDetail modal ───────────────────────────────────────────────

function GalleryOrderDetail({
  order, onClose, onStatusChange, onDelete,
}: {
  order: GalleryOrder
  onClose: () => void
  onStatusChange: (id: string, status: GalleryOrder['status']) => void
  onDelete: (id: string) => void
}) {
  const [updating, setUpdating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const updateStatus = async (status: GalleryOrder['status']) => {
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

  const st = GALLERY_STATUS[order.status] ?? GALLERY_STATUS.nuovo

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
          <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Dati cliente</p>
            <span style={{ fontSize: '13px', color: 'var(--tx)', fontWeight: 500, display: 'block' }}>{order.client_name ?? '—'}</span>
            {order.client_email && <a href={`mailto:${order.client_email}`} style={{ fontSize: '12px', color: 'var(--ac)', textDecoration: 'none', display: 'block', marginTop: 4 }}>{order.client_email}</a>}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>Prodotti ordinati</p>
              {order.items.some(i => i.photo_url) && (
                <a
                  href={`/api/galleries/${order.gallery_id}/orders/${order.id}/download`}
                  style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ac)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Scarica tutte le foto
                </a>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {order.items.map((item, i) => {
                // Dettagli produzione
                const details = [
                  item.frame_label && `Cornice: ${item.frame_label}`,
                  item.passepartout_label && `Passepartout: ${item.passepartout_label}`,
                  item.print_type_label && `Carta: ${item.print_type_label}`,
                  (item.crop_x != null && item.crop_y != null) && `Inquadratura: ${Math.round(item.crop_x ?? 50)}% H · ${Math.round(item.crop_y ?? 50)}% V`,
                  item.instax_text && `Testo: "${item.instax_text}"`,
                ].filter(Boolean)
                return (
                  <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {/* Foto con link download — card Instax o crop generico (via DB) */}
                    <a href={`/api/galleries/${order.gallery_id}/orders/${order.id}/photo?idx=${i}`} style={{ flexShrink: 0 }} title="Scarica foto">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: 6, objectFit: 'cover', display: 'block' }} />
                    </a>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', color: 'var(--tx)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
                      <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 2 }}>
                        {item.product_name ?? (item.type === 'carta' ? 'Stampa carta' : 'Stampa tela')} · {item.format_label}
                      </p>
                      {details.length > 0 && (
                        <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: '3px 8px' }}>
                          {details.map((d, j) => (
                            <span key={j} style={{ fontSize: '10px', color: 'var(--ac)', background: 'var(--acd)', borderRadius: 4, padding: '2px 6px', fontWeight: 500 }}>{d as string}</span>
                          ))}
                        </div>
                      )}
                      <p style={{ fontSize: '11px', color: 'var(--t2)', marginTop: 4 }}>{item.qty} × {fmtEur(item.unit_price)}</p>
                    </div>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--tx)', flexShrink: 0 }}>
                      {fmtEur(item.qty * item.unit_price)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {order.notes && (
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Note</p>
              <p style={{ fontSize: '12px', color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.6 }}>{order.notes}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--acd)', border: '1px solid rgba(142,201,176,.2)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
            <span style={{ fontSize: '13px', color: 'var(--t2)', fontWeight: 500 }}>Totale ordine</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--ac)' }}>{fmtEur(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ background: 'none', border: '1px solid rgba(217,112,112,.25)', borderRadius: 'var(--r2)', padding: '9px 12px', cursor: 'pointer', color: 'var(--red)', opacity: .7, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px' }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '.7')}>
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Elimina
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 500 }}>Sicuro?</span>
              <button onClick={deleteOrder} disabled={deleting} style={{ background: 'var(--red)', border: 'none', borderRadius: 'var(--r2)', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: deleting ? 'default' : 'pointer', color: '#fff', opacity: deleting ? .6 : 1 }}>{deleting ? '…' : 'Sì, elimina'}</button>
              <button onClick={() => setConfirmDelete(false)} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', color: 'var(--t2)' }}>Annulla</button>
            </div>
          )}
          <div style={{ flex: 1 }} />
          {order.status !== 'visto' && (
            <button onClick={() => updateStatus('visto')} disabled={updating} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '9px 16px', fontSize: '12px', fontWeight: 500, cursor: updating ? 'default' : 'pointer', color: 'var(--t2)', opacity: updating ? .6 : 1 }}>
              Segna visto
            </button>
          )}
          {order.status !== 'completato' && (
            <button onClick={() => updateStatus('completato')} disabled={updating} style={{ background: 'var(--ac)', border: 'none', borderRadius: 'var(--r2)', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: updating ? 'default' : 'pointer', color: '#111', opacity: updating ? .6 : 1 }}>
              Completato
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── ShopOrderDetail modal ──────────────────────────────────────────────────

function ShopOrderDetail({
  order, onClose, onStatusChange, onDelete,
}: {
  order: ShopOrder
  onClose: () => void
  onStatusChange: (id: string, status: ShopOrder['status']) => void
  onDelete: (id: string) => void
}) {
  const [updating, setUpdating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const updateStatus = async (status: ShopOrder['status']) => {
    setUpdating(true)
    await fetch(`/api/shop/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdating(false)
    onStatusChange(order.id, status)
  }

  const deleteOrder = async () => {
    setDeleting(true)
    await fetch(`/api/shop/orders/${order.id}`, { method: 'DELETE' })
    setDeleting(false)
    onDelete(order.id)
    onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const st = SHOP_STATUS[order.status] ?? SHOP_STATUS.pending
  const SHOP_STATUS_KEYS: ShopOrder['status'][] = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled']
  const waPhone = (() => {
    const digits = order.customer_phone.replace(/\D/g, '')
    // If already has Italian country code (39XXXXXXXXXX), use as-is; otherwise prepend 39
    return digits.startsWith('39') && digits.length >= 11 ? digits : `39${digits}`
  })()
  const waMsg = (msg: string) => `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .2s ease' }}
    >
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'slideUp .25s ease', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--tx)' }}>
              Ordine #{order.id.slice(-8).toUpperCase()}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 2 }}>
              Shop online · {formatDate(order.created_at)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: order.payment_status === 'paid' ? '#8ec9b0' : '#c9a05a', background: order.payment_status === 'paid' ? 'rgba(142,201,176,.12)' : 'rgba(201,160,90,.12)', borderRadius: 6, padding: '3px 8px' }}>
              {order.payment_method === 'online' ? '💳' : '🏠'} {order.payment_status === 'paid' ? 'Pagato' : 'Non pagato'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, borderRadius: 6, padding: '3px 8px' }}>{st.label}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6 }}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Body — 2 colonne */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16 }}>

          {/* Sinistra: cliente + prodotti + note + totale */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Dati cliente</p>
              <span style={{ fontSize: '13px', color: 'var(--tx)', fontWeight: 500, display: 'block' }}>{order.customer_name}</span>
              <a href={`mailto:${order.customer_email}`} style={{ fontSize: '12px', color: 'var(--ac)', textDecoration: 'none', display: 'block', marginTop: 3 }}>{order.customer_email}</a>
              {order.customer_phone && <span style={{ fontSize: '12px', color: 'var(--t2)', display: 'block', marginTop: 3 }}>{order.customer_phone}</span>}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>Prodotti</p>
                {order.items.some(i => i.image?.startsWith('https://')) && (
                  <a href={`/api/shop/orders/${order.id}/download-photos`} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ac)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Scarica foto
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    {item.image?.startsWith('https://') ? (
                      <a href={`/api/shop/download-photo?url=${encodeURIComponent(item.image)}&filename=${encodeURIComponent(item.filename || 'foto.jpg')}`} style={{ flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', display: 'block' }} />
                      </a>
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--s3)', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 18 }}>🖼️</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', color: 'var(--tx)', fontWeight: 500 }}>{item.productName} — {item.variantLabel} <span style={{ color: 'var(--t3)' }}>×{item.quantity}</span></p>
                    </div>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--tx)', flexShrink: 0 }}>{fmtCents(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {order.notes && (
              <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
                <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Note</p>
                <p style={{ fontSize: '12px', color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.6 }}>{order.notes}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--acd)', border: '1px solid rgba(142,201,176,.2)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
              <span style={{ fontSize: '13px', color: 'var(--t2)', fontWeight: 500 }}>Totale ordine</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--ac)' }}>{fmtCents(order.total)}</span>
            </div>
          </div>

          {/* Destra: stato + avvisa cliente */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Stato ordine</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SHOP_STATUS_KEYS.map(s => {
                  const sc = SHOP_STATUS[s]
                  const isActive = order.status === s
                  return (
                    <button
                      key={s}
                      disabled={isActive || updating}
                      onClick={() => updateStatus(s)}
                      style={{ padding: '8px 12px', borderRadius: 'var(--r2)', fontSize: '12px', fontWeight: 600, cursor: isActive || updating ? 'default' : 'pointer', border: isActive ? `1.5px solid ${sc.color}` : '1px solid var(--b2)', background: isActive ? sc.bg : 'var(--s2)', color: isActive ? sc.color : 'var(--t2)', textAlign: 'left', transition: 'all .15s', opacity: updating && !isActive ? .5 : 1 }}
                    >
                      {isActive ? '✓ ' : ''}{sc.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {order.customer_phone && (
              <div>
                <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>Avvisa cliente</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <a
                    href={waMsg(`Ciao ${order.customer_name}! 👋\n\nIl tuo ordine è in lavorazione. Ti avviseremo appena pronto.\n\nGrazie! 😊`)}
                    target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--r2)', fontSize: '12px', fontWeight: 600, background: '#25D366', color: '#fff', textDecoration: 'none' }}
                  >
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    In lavorazione
                  </a>
                  <a
                    href={waMsg(`Ciao ${order.customer_name}!\n\nIl tuo ordine è PRONTO! 🎉\n\nPuoi ritirarlo in studio quando vuoi. Ti aspettiamo!`)}
                    target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--r2)', fontSize: '12px', fontWeight: 600, border: '1px solid #25D366', color: '#25D366', textDecoration: 'none', background: 'transparent' }}
                  >
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Pronto al ritiro
                  </a>
                  <a
                    href={`mailto:${order.customer_email}?subject=Il tuo ordine è in lavorazione&body=Ciao ${order.customer_name}!%0D%0A%0D%0AIl tuo ordine è in lavorazione.%0D%0ATi contatteremo appena pronto per il ritiro.%0D%0A%0D%0AGrazie!`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--r2)', fontSize: '12px', fontWeight: 600, background: 'var(--ac)', color: '#111', textDecoration: 'none' }}
                  >
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Email
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ background: 'none', border: '1px solid rgba(217,112,112,.25)', borderRadius: 'var(--r2)', padding: '9px 12px', cursor: 'pointer', color: 'var(--red)', opacity: .7, fontSize: '12px', display: 'flex', alignItems: 'center', gap: 5 }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '.7')}>
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Elimina
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 500 }}>Sicuro?</span>
              <button onClick={deleteOrder} disabled={deleting} style={{ background: 'var(--red)', border: 'none', borderRadius: 'var(--r2)', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: deleting ? 'default' : 'pointer', color: '#fff', opacity: deleting ? .6 : 1 }}>{deleting ? '…' : 'Sì, elimina'}</button>
              <button onClick={() => setConfirmDelete(false)} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', color: 'var(--t2)' }}>Annulla</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function OrdiniPage() {
  const [tab, setTab] = useState<'gallerie' | 'shop'>('gallerie')

  // Gallery portal orders
  const [galleryOrders, setGalleryOrders] = useState<GalleryOrder[]>([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const [selectedGalleryOrder, setSelectedGalleryOrder] = useState<GalleryOrder | null>(null)
  const [galleryFilter, setGalleryFilter] = useState<'tutti' | GalleryOrder['status']>('tutti')

  // Shop orders
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([])
  const [shopLoading, setShopLoading] = useState(true)
  const [shopError, setShopError] = useState<string | null>(null)
  const [selectedShopOrder, setSelectedShopOrder] = useState<ShopOrder | null>(null)
  const [shopFilter, setShopFilter] = useState<'tutti' | ShopOrder['status']>('tutti')

  useEffect(() => {
    fetch('/api/orders')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`)
        return Array.isArray(data) ? data : (data.orders ?? data)
      })
      .then(setGalleryOrders)
      .catch(err => setGalleryError(String(err)))
      .finally(() => setGalleryLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/shop/orders')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`)
        return Array.isArray(data) ? data : []
      })
      .then(setShopOrders)
      .catch(err => setShopError(String(err)))
      .finally(() => setShopLoading(false))
  }, [])

  const handleGalleryStatusChange = useCallback((id: string, status: GalleryOrder['status']) => {
    setGalleryOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    setSelectedGalleryOrder(prev => prev?.id === id ? { ...prev, status } : prev)
  }, [])
  const handleGalleryDelete = useCallback((id: string) => {
    setGalleryOrders(prev => prev.filter(o => o.id !== id))
  }, [])

  const handleShopStatusChange = useCallback((id: string, status: ShopOrder['status']) => {
    setShopOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    setSelectedShopOrder(prev => prev?.id === id ? { ...prev, status } : prev)
  }, [])
  const handleShopDelete = useCallback((id: string) => {
    setShopOrders(prev => prev.filter(o => o.id !== id))
  }, [])

  const nuoviGalleria = galleryOrders.filter(o => o.status === 'nuovo').length
  const nuoviShop     = shopOrders.filter(o => o.status === 'pending').length
  const totaleNuovi   = nuoviGalleria + nuoviShop

  const filteredGallery = galleryFilter === 'tutti' ? galleryOrders : galleryOrders.filter(o => o.status === galleryFilter)
  const filteredShop    = shopFilter    === 'tutti' ? shopOrders    : shopOrders.filter(o => o.status === shopFilter)

  const GALLERY_FILTERS: { key: 'tutti' | GalleryOrder['status']; label: string }[] = [
    { key: 'tutti', label: 'Tutti' }, { key: 'nuovo', label: 'Nuovi' }, { key: 'visto', label: 'Visti' }, { key: 'completato', label: 'Completati' },
  ]
  const SHOP_FILTERS: { key: 'tutti' | ShopOrder['status']; label: string }[] = [
    { key: 'tutti', label: 'Tutti' }, { key: 'pending', label: 'In attesa' }, { key: 'confirmed', label: 'Confermati' }, { key: 'ready', label: 'Pronti' }, { key: 'delivered', label: 'Consegnati' }, { key: 'cancelled', label: 'Annullati' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>

      {/* Topbar */}
      <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--tx)', letterSpacing: '-0.02em' }}>
            Ordini stampe
            {totaleNuovi > 0 && (
              <span style={{ marginLeft: 10, background: 'var(--red)', color: '#fff', fontSize: '11px', fontWeight: 700, borderRadius: 20, padding: '2px 8px', verticalAlign: 'middle' }}>
                {totaleNuovi} {totaleNuovi === 1 ? 'nuovo' : 'nuovi'}
              </span>
            )}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--t3)', marginTop: 2 }}>Ordini dai portali galleria e dallo shop online</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: '0 28px', marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--b1)' }}>
          {([
            { key: 'gallerie', label: 'Portale gallerie', count: nuoviGalleria },
            { key: 'shop',     label: 'Shop online',      count: nuoviShop     },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 18px', fontSize: '13px', fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? 'var(--ac)' : 'var(--t2)',
                borderBottom: `2px solid ${tab === t.key ? 'var(--ac)' : 'transparent'}`,
                marginBottom: -1, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span style={{ background: 'var(--red)', color: '#fff', fontSize: '9px', fontWeight: 700, borderRadius: 10, padding: '1px 5px', lineHeight: 1.4 }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB GALLERIE ── */}
      {tab === 'gallerie' && (
        <>
          <div style={{ padding: '14px 28px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {GALLERY_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setGalleryFilter(f.key)}
                style={{ background: galleryFilter === f.key ? 'var(--acd)' : 'var(--s1)', border: `1px solid ${galleryFilter === f.key ? 'rgba(142,201,176,.25)' : 'var(--b1)'}`, borderRadius: 'var(--r2)', padding: '5px 14px', fontSize: '12px', fontWeight: galleryFilter === f.key ? 600 : 400, color: galleryFilter === f.key ? 'var(--ac)' : 'var(--t2)', cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {f.label}
                {f.key === 'nuovo' && nuoviGalleria > 0 && <span style={{ background: 'var(--red)', color: '#fff', fontSize: '9px', fontWeight: 700, borderRadius: 10, padding: '1px 5px' }}>{nuoviGalleria}</span>}
              </button>
            ))}
          </div>

          <div style={{ padding: '0 28px 40px' }}>
            {galleryError ? (
              <div style={{ background: 'rgba(217,112,112,.1)', border: '1px solid rgba(217,112,112,.3)', borderRadius: 'var(--r2)', padding: '16px 20px', color: 'var(--red)', fontSize: '13px' }}>
                Errore: {galleryError}
              </div>
            ) : galleryLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--t3)' }}>
                <div style={{ width: 28, height: 28, border: '2px solid var(--ac)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px' }}>Caricamento ordini…</p>
              </div>
            ) : filteredGallery.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ width: 52, height: 52, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="var(--t3)" strokeWidth={1.5} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--t2)', fontWeight: 500 }}>
                  {galleryFilter === 'tutti' ? 'Nessun ordine dal portale galleria' : `Nessun ordine "${GALLERY_FILTERS.find(f => f.key === galleryFilter)?.label.toLowerCase()}"`}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: 6 }}>Gli ordini appariranno qui quando i clienti acquistano dal portale</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px 90px 100px 36px', gap: 12, padding: '6px 14px', fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>
                  <span>Cliente</span><span>Galleria</span><span>Data</span><span style={{ textAlign: 'right' }}>Totale</span><span style={{ textAlign: 'center' }}>Stato</span><span />
                </div>
                {filteredGallery.map(order => {
                  const st = GALLERY_STATUS[order.status] ?? GALLERY_STATUS.nuovo
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedGalleryOrder(order)}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px 90px 100px 36px', gap: 12, padding: '12px 14px', background: 'var(--s1)', border: `1px solid ${order.status === 'nuovo' ? 'rgba(217,112,112,.2)' : 'var(--b1)'}`, borderRadius: 'var(--r2)', cursor: 'pointer', transition: 'all .15s', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--s1)')}
                    >
                      <div>
                        <p style={{ fontSize: '13px', color: 'var(--tx)', fontWeight: 500 }}>{order.client_name ?? '—'}</p>
                        {order.client_email && <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 1 }}>{order.client_email}</p>}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.galleries?.name ?? '—'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--t3)' }}>{formatDateShort(order.created_at)}</span>
                      <span style={{ fontSize: '13px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--tx)', textAlign: 'right' }}>{fmtEur(order.total)}</span>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: st.color, background: st.bg, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>{st.label}</span>
                      </div>
                      <button
                        onClick={async e => {
                          e.stopPropagation()
                          if (!confirm('Eliminare questo ordine?')) return
                          await fetch(`/api/galleries/${order.gallery_id}/orders`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order_id: order.id }),
                          })
                          handleGalleryDelete(order.id)
                        }}
                        title="Elimina ordine"
                        style={{ width: 28, height: 28, background: 'none', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', color: 'var(--t3)', display: 'grid', placeItems: 'center', transition: 'all .15s', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(217,112,112,.3)'; e.currentTarget.style.background = 'rgba(217,112,112,.07)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'none' }}
                      >
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB SHOP ── */}
      {tab === 'shop' && (
        <>
          <div style={{ padding: '14px 28px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SHOP_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setShopFilter(f.key)}
                style={{ background: shopFilter === f.key ? 'var(--acd)' : 'var(--s1)', border: `1px solid ${shopFilter === f.key ? 'rgba(142,201,176,.25)' : 'var(--b1)'}`, borderRadius: 'var(--r2)', padding: '5px 14px', fontSize: '12px', fontWeight: shopFilter === f.key ? 600 : 400, color: shopFilter === f.key ? 'var(--ac)' : 'var(--t2)', cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {f.label}
                {f.key === 'pending' && nuoviShop > 0 && <span style={{ background: 'var(--red)', color: '#fff', fontSize: '9px', fontWeight: 700, borderRadius: 10, padding: '1px 5px' }}>{nuoviShop}</span>}
              </button>
            ))}
          </div>

          <div style={{ padding: '0 28px 40px' }}>
            {shopError ? (
              <div style={{ background: 'rgba(217,112,112,.1)', border: '1px solid rgba(217,112,112,.3)', borderRadius: 'var(--r2)', padding: '16px 20px', color: 'var(--red)', fontSize: '13px' }}>
                Errore: {shopError}
              </div>
            ) : shopLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--t3)' }}>
                <div style={{ width: 28, height: 28, border: '2px solid var(--ac)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px' }}>Caricamento ordini…</p>
              </div>
            ) : filteredShop.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ width: 52, height: 52, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="var(--t3)" strokeWidth={1.5} strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--t2)', fontWeight: 500 }}>
                  {shopFilter === 'tutti' ? 'Nessun ordine dallo shop' : `Nessun ordine "${SHOP_FILTERS.find(f => f.key === shopFilter)?.label.toLowerCase()}"`}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: 6 }}>Gli ordini appariranno qui quando i clienti acquistano dallo shop online</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px 110px 36px', gap: 12, padding: '6px 14px', fontSize: '10px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>
                  <span>Cliente</span><span>Pagamento</span><span>Data</span><span style={{ textAlign: 'right' }}>Totale</span><span style={{ textAlign: 'center' }}>Stato</span><span />
                </div>
                {filteredShop.map(order => {
                  const st = SHOP_STATUS[order.status] ?? SHOP_STATUS.pending
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedShopOrder(order)}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px 110px 36px', gap: 12, padding: '12px 14px', background: 'var(--s1)', border: `1px solid ${order.status === 'pending' ? 'rgba(201,160,90,.2)' : 'var(--b1)'}`, borderRadius: 'var(--r2)', cursor: 'pointer', transition: 'all .15s', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--s1)')}
                    >
                      <div>
                        <p style={{ fontSize: '13px', color: 'var(--tx)', fontWeight: 500 }}>{order.customer_name}</p>
                        {order.customer_email && <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 1 }}>{order.customer_email}</p>}
                      </div>
                      <span style={{ fontSize: '11px', color: order.payment_status === 'paid' ? '#8ec9b0' : '#c9a05a', fontWeight: 600 }}>
                        {order.payment_method === 'online' ? '💳' : '🏠'} {order.payment_status === 'paid' ? 'Pagato' : 'Non pag.'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--t3)' }}>{formatDateShort(order.created_at)}</span>
                      <span style={{ fontSize: '13px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--tx)', textAlign: 'right' }}>{fmtCents(order.total)}</span>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: st.color, background: st.bg, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>{st.label}</span>
                      </div>
                      <button
                        onClick={async e => {
                          e.stopPropagation()
                          if (!confirm('Eliminare questo ordine?')) return
                          await fetch(`/api/shop/orders/${order.id}`, { method: 'DELETE' })
                          handleShopDelete(order.id)
                        }}
                        title="Elimina ordine"
                        style={{ width: 28, height: 28, background: 'none', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', color: 'var(--t3)', display: 'grid', placeItems: 'center', transition: 'all .15s', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(217,112,112,.3)'; e.currentTarget.style.background = 'rgba(217,112,112,.07)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'none' }}
                      >
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {selectedGalleryOrder && (
        <GalleryOrderDetail
          order={selectedGalleryOrder}
          onClose={() => setSelectedGalleryOrder(null)}
          onStatusChange={handleGalleryStatusChange}
          onDelete={handleGalleryDelete}
        />
      )}
      {selectedShopOrder && (
        <ShopOrderDetail
          order={selectedShopOrder}
          onClose={() => setSelectedShopOrder(null)}
          onStatusChange={handleShopStatusChange}
          onDelete={handleShopDelete}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

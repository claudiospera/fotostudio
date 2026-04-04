'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import type { Photo } from '@/lib/types'
import { Lightbox } from '@/components/ui/Lightbox'
import JSZip from 'jszip'

// ── types ──────────────────────────────────────────────────────────────────

interface PublicGallery {
  id: string
  name: string
  subtitle?: string
  type?: string
  date?: string
  cover_color?: string
  cover_url?: string | null
  settings?: { watermark?: boolean; download_singolo?: boolean; download_zip?: boolean }
  photos: Photo[]
  profiles?: { name?: string; studio_name?: string }
}

interface CartItem {
  id: string          // `${photoId}::${type}::${format}`
  photoId: string
  photoUrl: string
  filename: string
  type: 'carta' | 'tela'
  format: string
  formatLabel: string
  qty: number
  unitPrice: number
  total: number
}

// ── price data ─────────────────────────────────────────────────────────────

const CARTA_FORMATS: { key: string; label: string; tiers: [number, number][] }[] = [
  { key: '10x15',  label: '10×15 cm',  tiers: [[1,2.00],[2,1.50],[6,0.90],[11,0.80],[21,0.70],[31,0.60],[51,0.50],[71,0.35],[91,0.30],[100,0.20]] },
  { key: '13x18',  label: '13×18 cm',  tiers: [[1,2.50],[2,2.00],[6,1.50],[11,1.20],[21,1.10],[31,0.90],[51,0.80],[71,0.70],[91,0.50],[200,0.40],[500,0.30]] },
  { key: '13x19',  label: '13×19 cm',  tiers: [[1,2.50],[2,2.00],[6,1.50],[11,1.20],[21,1.10],[31,0.90],[51,0.80],[71,0.70],[91,0.50],[200,0.40],[500,0.30]] },
  { key: '15x20',  label: '15×20 cm',  tiers: [[1,3.00],[2,2.50],[11,2.20],[31,2.00],[51,1.80],[100,1.50],[300,1.00]] },
  { key: '20x30',  label: '20×30 cm',  tiers: [[1,6.00]] },
  { key: '30x40',  label: '30×40 cm',  tiers: [[1,10.00]] },
  { key: '30x45',  label: '30×45 cm',  tiers: [[1,12.00]] },
  { key: '40x50',  label: '40×50 cm',  tiers: [[1,17.00]] },
  { key: '40x60',  label: '40×60 cm',  tiers: [[1,19.00]] },
  { key: '50x60',  label: '50×60 cm',  tiers: [[1,23.00]] },
  { key: '50x70',  label: '50×70 cm',  tiers: [[1,25.00]] },
  { key: '70x100', label: '70×100 cm', tiers: [[1,50.00]] },
]

const TELA_FORMATS: { key: string; label: string; price: number }[] = [
  { key: '30x30',  label: '30×30 cm',  price: 30 },
  { key: '30x40',  label: '30×40 cm',  price: 35 },
  { key: '30x50',  label: '30×50 cm',  price: 40 },
  { key: '40x40',  label: '40×40 cm',  price: 40 },
  { key: '40x50',  label: '40×50 cm',  price: 45 },
  { key: '40x60',  label: '40×60 cm',  price: 47 },
  { key: '50x70',  label: '50×70 cm',  price: 60 },
  { key: '70x100', label: '70×100 cm', price: 100 },
]

function getCartaUnitPrice(tiers: [number, number][], qty: number): number {
  let price = tiers[0][1]
  for (const [min, p] of tiers) { if (qty >= min) price = p }
  return price
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return null
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('fs_session')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('fs_session', id) }
  return id
}

async function downloadPhoto(photo: Photo) {
  const res = await fetch(photo.url)
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = photo.filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── OrderModal ─────────────────────────────────────────────────────────────

interface OrderModalProps {
  photo: Photo
  onClose: () => void
  onAdd: (item: CartItem) => void
}

function OrderModal({ photo, onClose, onAdd }: OrderModalProps) {
  const [tab, setTab] = useState<'carta' | 'tela'>('carta')
  const [selectedCarta, setSelectedCarta] = useState(CARTA_FORMATS[0].key)
  const [selectedTela, setSelectedTela]   = useState(TELA_FORMATS[0].key)
  const [qty, setQty] = useState(1)

  useEffect(() => { setQty(1) }, [tab, selectedCarta, selectedTela])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const cartaFmt  = CARTA_FORMATS.find(f => f.key === selectedCarta)!
  const telaFmt   = TELA_FORMATS.find(f => f.key === selectedTela)!
  const unitPrice = tab === 'carta' ? getCartaUnitPrice(cartaFmt.tiers, qty) : telaFmt.price
  const total     = unitPrice * qty
  const nextTier  = tab === 'carta'
    ? cartaFmt.tiers.find(([min]) => min > qty)
    : null

  const handleAdd = () => {
    const format      = tab === 'carta' ? selectedCarta : selectedTela
    const formatLabel = tab === 'carta' ? cartaFmt.label : telaFmt.label
    const key = `${photo.id}::${tab}::${format}`
    onAdd({ id: key, photoId: photo.id, photoUrl: photo.url, filename: photo.filename, type: tab, format, formatLabel, qty, unitPrice, total })
    onClose()
  }

  const btnTab: React.CSSProperties = { flex: 1, padding: '8px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all .15s' }
  const inputStyle: React.CSSProperties = { background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, padding: '5px 10px', color: 'var(--tx)', fontSize: '12px', outline: 'none', cursor: 'pointer', transition: 'border-color .15s' }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .2s ease' }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', width: '100%', maxWidth: 480, animation: 'slideUp .25s ease', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>Ordina stampa</p>
              <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 1 }}>{photo.filename}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6 }}>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--b1)' }}>
          <button onClick={() => setTab('carta')} style={{ ...btnTab, background: tab === 'carta' ? 'var(--acd)' : 'transparent', color: tab === 'carta' ? 'var(--ac)' : 'var(--t3)', borderBottom: `2px solid ${tab === 'carta' ? 'var(--ac)' : 'transparent'}` }}>
            📄 Stampe fotografiche
          </button>
          <button onClick={() => setTab('tela')} style={{ ...btnTab, background: tab === 'tela' ? 'var(--acd)' : 'transparent', color: tab === 'tela' ? 'var(--ac)' : 'var(--t3)', borderBottom: `2px solid ${tab === 'tela' ? 'var(--ac)' : 'transparent'}` }}>
            🖼️ Stampa su tela
          </button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Formato */}
          <div>
            <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 500, marginBottom: 8 }}>Formato</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tab === 'carta'
                ? CARTA_FORMATS.map(f => (
                    <button key={f.key} onClick={() => setSelectedCarta(f.key)} style={{ ...inputStyle, borderColor: selectedCarta === f.key ? 'var(--ac)' : 'var(--b1)', color: selectedCarta === f.key ? 'var(--ac)' : 'var(--t2)', background: selectedCarta === f.key ? 'var(--acd)' : 'var(--s2)' }}>
                      {f.label}
                    </button>
                  ))
                : TELA_FORMATS.map(f => (
                    <button key={f.key} onClick={() => setSelectedTela(f.key)} style={{ ...inputStyle, borderColor: selectedTela === f.key ? 'var(--ac)' : 'var(--b1)', color: selectedTela === f.key ? 'var(--ac)' : 'var(--t2)', background: selectedTela === f.key ? 'var(--acd)' : 'var(--s2)' }}>
                      {f.label}
                    </button>
                  ))
              }
            </div>
          </div>

          {/* Quantità */}
          <div>
            <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 500, marginBottom: 8 }}>Quantità</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', fontSize: '16px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>−</button>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--tx)', minWidth: 40, textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', fontSize: '16px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>+</button>
              {tab === 'carta' && (
                <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: 4 }}>
                  {fmt(unitPrice)} / copia
                </span>
              )}
            </div>

            {/* Info scaglione successivo */}
            {nextTier && tab === 'carta' && (
              <p style={{ fontSize: '10px', color: 'var(--amber)', marginTop: 6 }}>
                💡 Da {nextTier[0]} copie → {fmt(nextTier[1])} / copia
              </p>
            )}
          </div>

          {/* Totale + scaglioni carta */}
          {tab === 'carta' && cartaFmt.tiers.length > 1 && (
            <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '8px 12px' }}>
              <p style={{ fontSize: '10px', color: 'var(--t3)', marginBottom: 5, fontWeight: 500 }}>Scaglioni di prezzo</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                {cartaFmt.tiers.map(([min, price], i) => {
                  const isActive = qty >= min && (i === cartaFmt.tiers.length - 1 || qty < cartaFmt.tiers[i + 1][0])
                  return (
                    <span key={min} style={{ fontSize: '10px', color: isActive ? 'var(--ac)' : 'var(--t3)', fontWeight: isActive ? 600 : 400 }}>
                      {min}+ → {fmt(price)}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Totale e CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--t3)' }}>Totale</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--tx)' }}>{fmt(total)}</p>
            </div>
            <button onClick={handleAdd} style={{ background: 'var(--ac)', color: '#111', border: 'none', borderRadius: 'var(--r2)', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Aggiungi al carrello
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── OrderHistoryDrawer ─────────────────────────────────────────────────────

interface PastOrder {
  id: string
  client_name: string | null
  client_email: string | null
  items: CartItem[]
  total: number
  status: 'nuovo' | 'visto' | 'completato'
  notes: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  nuovo:      { label: 'In attesa',   color: 'var(--amber)' },
  visto:      { label: 'Ricevuto',    color: 'var(--ac)'    },
  completato: { label: 'Completato',  color: 'var(--ac)'    },
}

interface OrderHistoryDrawerProps {
  orders: PastOrder[]
  onClose: () => void
}

function OrderHistoryDrawer({ orders, onClose }: OrderHistoryDrawerProps) {
  const ICON_X = <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 450, background: 'rgba(0,0,0,.6)' }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 460, width: '100%', maxWidth: 440, background: 'var(--s1)', borderLeft: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight .25s ease' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--tx)', flex: 1 }}>I miei ordini</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6 }}>{ICON_X}</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: '13px', padding: 40 }}>
              Nessun ordine effettuato
            </div>
          ) : orders.map(order => {
            const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.nuovo
            const date = new Date(order.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
            return (
              <div key={order.id} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden' }}>
                {/* Order header */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--t3)' }}>{date}</p>
                    <p style={{ fontSize: '12px', color: 'var(--tx)', fontWeight: 500, marginTop: 2 }}>
                      {order.items.reduce((s, i) => s + i.qty, 0)} prodotti
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: st.color, border: `1px solid ${st.color}`, borderRadius: 5, padding: '2px 7px', opacity: .9 }}>
                      {st.label}
                    </span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--tx)' }}>
                      {fmt(order.total)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.photoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '11px', color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
                        <p style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 2 }}>
                          {item.type === 'carta' ? '📄' : '🖼️'} {item.formatLabel} × {item.qty}
                        </p>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--t2)', flexShrink: 0 }}>{fmt(item.total)}</span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {order.notes && (
                  <div style={{ padding: '0 12px 10px' }}>
                    <p style={{ fontSize: '10px', color: 'var(--t3)', fontStyle: 'italic' }}>{order.notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ── CartDrawer ─────────────────────────────────────────────────────────────

interface CartDrawerProps {
  cart: Map<string, CartItem>
  galleryId: string
  onClose: () => void
  onRemove: (itemId: string) => void
  onUpdateQty: (itemId: string, qty: number) => void
  onClear: () => void
  onOrderPlaced: () => void
}

const PHOTOGRAPHER_WA = '393897855581'

function buildWaLink(items: CartItem[], total: number, clientName: string, galleryId: string): string {
  const lines = items.map(i => `• ${i.qty}x ${i.type === 'carta' ? 'Carta' : 'Tela'} ${i.formatLabel} — ${fmt(i.unitPrice * i.qty)}`).join('\n')
  const msg = [
    `Ciao Claudio! Ho appena effettuato un ordine di stampe 🖼️`,
    ``,
    `📋 *Riepilogo:*`,
    lines,
    ``,
    `💶 *Totale: ${fmt(total)}*`,
    clientName ? `👤 Nome: ${clientName}` : '',
  ].filter(Boolean).join('\n')
  return `https://wa.me/${PHOTOGRAPHER_WA}?text=${encodeURIComponent(msg)}`
}

function CartDrawer({ cart, galleryId, onClose, onRemove, onUpdateQty, onClear, onOrderPlaced }: CartDrawerProps) {
  const [step, setStep]       = useState<'cart' | 'checkout' | 'success'>('cart')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [notes, setNotes]     = useState('')
  const [sending, setSending] = useState(false)
  const [waLink, setWaLink]   = useState('')

  const items     = Array.from(cart.values())
  const cartTotal = items.reduce((s, i) => s + i.total, 0)
  const inputSt: React.CSSProperties = { width: '100%', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 8, padding: '9px 12px', color: 'var(--tx)', fontSize: '13px', outline: 'none' }

  const submit = async () => {
    if (!items.length) return
    setSending(true)
    // Salva il link WA prima di svuotare il carrello
    setWaLink(buildWaLink(items, cartTotal, name.trim(), galleryId))
    await fetch('/api/public/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gallery_id: galleryId,
        session_id: getSessionId(),
        client_name: name.trim() || null,
        client_email: email.trim() || null,
        items: items.map(i => ({
          photo_id: i.photoId, photo_url: i.photoUrl, filename: i.filename,
          type: i.type, format: i.format, format_label: i.formatLabel,
          qty: i.qty, unit_price: i.unitPrice, total: i.total,
        })),
        total: cartTotal,
        notes: notes.trim() || null,
      }),
    })
    setSending(false)
    setStep('success')
    onClear()
    onOrderPlaced()
  }

  const ICON_CART = <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
  const ICON_X    = <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 450, background: 'rgba(0,0,0,.6)' }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 460, width: '100%', maxWidth: 440, background: 'var(--s1)', borderLeft: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight .25s ease' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {step === 'checkout' && (
            <button onClick={() => setStep('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6, flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            {ICON_CART}
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--tx)' }}>
              {step === 'cart' ? 'Il tuo carrello' : step === 'checkout' ? 'Conferma ordine' : 'Ordine confermato'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6 }}>
            {ICON_X}
          </button>
        </div>

        {/* ── STEP: SUCCESS ─────────────────────────────────────────────── */}
        {step === 'success' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(142,201,176,.15)', border: '2px solid rgba(142,201,176,.3)', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--tx)', marginBottom: 8 }}>Ordine inviato!</p>
              <p style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.6 }}>
                Il fotografo ha ricevuto il tuo ordine. Clicca il pulsante qui sotto per confermare su WhatsApp.
              </p>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', border: 'none', borderRadius: 'var(--r2)', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', width: '100%', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Conferma su WhatsApp
            </a>
            <button onClick={onClose} style={{ background: 'transparent', color: 'var(--t3)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '9px 24px', fontSize: '13px', cursor: 'pointer', width: '100%' }}>
              Chiudi
            </button>
          </div>
        )}

        {/* ── STEP: EMPTY ───────────────────────────────────────────────── */}
        {step === 'cart' && items.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--t3)' }}>
            <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" style={{ opacity: .4 }}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <p style={{ fontSize: '13px' }}>Il carrello è vuoto</p>
            <p style={{ fontSize: '11px' }}>Clicca 🛒 su una foto per aggiungere stampe</p>
          </div>
        )}

        {/* ── STEP: CART ────────────────────────────────────────────────── */}
        {step === 'cart' && items.length > 0 && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(item => {
                const cartaFmt   = item.type === 'carta' ? CARTA_FORMATS.find(f => f.key === item.format) : null
                const unitPrice  = (qty: number) => cartaFmt ? getCartaUnitPrice(cartaFmt.tiers, qty) : item.unitPrice
                return (
                  <div key={item.id} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.photoUrl} alt="" style={{ width: 50, height: 50, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '11px', color: 'var(--tx)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
                      <p style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 2 }}>{item.type === 'carta' ? '📄' : '🖼️'} {item.formatLabel}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
                        <button onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))} style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--s3)', border: 'none', color: 'var(--tx)', fontSize: '14px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>−</button>
                        <span style={{ fontSize: '12px', color: 'var(--tx)', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--s3)', border: 'none', color: 'var(--tx)', fontSize: '14px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>+</button>
                        <span style={{ fontSize: '10px', color: 'var(--t3)', marginLeft: 2 }}>{fmt(unitPrice(item.qty))} / copia</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--tx)' }}>{fmt(unitPrice(item.qty) * item.qty)}</span>
                      <button onClick={() => onRemove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 2 }}>
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--b1)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '13px', color: 'var(--t2)' }}>Totale ordine</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--tx)' }}>{fmt(cartTotal)}</span>
              </div>
              <button onClick={() => setStep('checkout')} style={{ width: '100%', background: 'var(--ac)', color: '#111', border: 'none', borderRadius: 'var(--r2)', padding: '11px 0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                Conferma ordine →
              </button>
            </div>
          </>
        )}

        {/* ── STEP: CHECKOUT ────────────────────────────────────────────── */}
        {step === 'checkout' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>
              {/* Riepilogo */}
              <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 8, fontWeight: 500 }}>{items.length} prodott{items.length === 1 ? 'o' : 'i'} nel carrello</p>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--t2)', marginBottom: 4 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.filename} · {item.formatLabel} × {item.qty}</span>
                    <span style={{ flexShrink: 0, marginLeft: 8, fontWeight: 600, color: 'var(--tx)' }}>{fmt(item.total)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--b1)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>Totale</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--tx)' }}>{fmt(cartTotal)}</span>
                </div>
              </div>

              {/* Form cliente */}
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>I tuoi dati</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome e cognome" style={inputSt} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (per ricevere conferma)" type="email" style={inputSt} />
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note aggiuntive (opzionale)…" rows={3} style={{ ...inputSt, resize: 'none', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }} />
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--b1)', flexShrink: 0 }}>
              <button onClick={submit} disabled={sending} style={{ width: '100%', background: sending ? 'var(--s3)' : 'var(--ac)', color: sending ? 'var(--t3)' : '#111', border: 'none', borderRadius: 'var(--r2)', padding: '12px 0', fontSize: '13px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {sending
                  ? <><div style={{ width: 14, height: 14, border: '2px solid var(--t3)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> Invio in corso…</>
                  : <><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Invia ordine al fotografo</>
                }
              </button>
              <p style={{ fontSize: '10px', color: 'var(--t3)', textAlign: 'center', marginTop: 8 }}>Il fotografo riceverà subito una notifica via email</p>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── comment modal ──────────────────────────────────────────────────────────

interface CommentModalProps {
  photo: Photo
  galleryId: string
  onClose: () => void
  onSaved: (photoId: string) => void
}

function CommentModal({ photo, galleryId, onClose, onSaved }: CommentModalProps) {
  const [name, setName]     = useState('')
  const [body, setBody]     = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const textareaRef         = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    await fetch('/api/public/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photo.id, gallery_id: galleryId, session_id: getSessionId(), author_name: name.trim(), body: body.trim() }),
    })
    setSaving(false)
    setDone(true)
    onSaved(photo.id)
    setTimeout(onClose, 1200)
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn .2s ease' }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', width: '100%', maxWidth: 420, animation: 'slideUp .25s ease', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>Lascia un commento</p>
              <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 1 }}>{photo.filename}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6 }}>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {done ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round" style={{ margin: '0 auto 10px', display: 'block' }}><polyline points="20 6 9 17 4 12"/></svg>
            <p style={{ color: 'var(--ac)', fontSize: '13px', fontWeight: 500 }}>Commento salvato!</p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: 5, fontWeight: 500 }}>Il tuo nome (opzionale)</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Es. Marco Rossi" style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '8px 10px', color: 'var(--tx)', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: 5, fontWeight: 500 }}>Commento *</label>
              <textarea ref={textareaRef} value={body} onChange={e => setBody(e.target.value)} placeholder="Scrivi qui il tuo commento…" required rows={4} maxLength={1000} style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '8px 10px', color: 'var(--tx)', fontSize: '13px', outline: 'none', resize: 'none', lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }} />
              <p style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 3, textAlign: 'right' }}>{body.length}/1000</p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '7px 14px', fontSize: '12px', color: 'var(--t2)', cursor: 'pointer' }}>Annulla</button>
              <button type="submit" disabled={saving || !body.trim()} style={{ background: saving || !body.trim() ? 'var(--s3)' : 'var(--ac)', color: saving || !body.trim() ? 'var(--t3)' : '#111210', border: 'none', borderRadius: 'var(--r2)', padding: '7px 16px', fontSize: '12px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Salvataggio…' : 'Invia commento'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── photo item ─────────────────────────────────────────────────────────────

interface PhotoItemProps {
  photo: Photo
  index: number
  galleryId: string
  isFavorited: boolean
  commentCount: number
  inCart: boolean
  showWatermark: boolean
  showDownloadSingle: boolean
  onOpenLightbox: (i: number) => void
  onToggleFavorite: (photoId: string) => void
  onOpenComment: (photo: Photo) => void
  onOpenOrder: (photo: Photo) => void
}

function PhotoItem({ photo, index, galleryId, isFavorited, commentCount, inCart, showWatermark, showDownloadSingle, onOpenLightbox, onToggleFavorite, onOpenComment, onOpenOrder }: PhotoItemProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDownloading(true)
    await downloadPhoto(photo)
    setDownloading(false)
  }

  return (
    <div style={{ aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', background: '#e8e8e6', position: 'relative', animation: `slideUp .3s ease ${Math.min(index * 0.02, 0.4)}s both` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.filename} loading="lazy" onClick={() => onOpenLightbox(index)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }} />

      {/* Watermark overlay */}
      {showWatermark && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <span style={{
            fontSize: 'clamp(8px, 2.5vw, 13px)', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
            fontFamily: 'Syne, sans-serif', letterSpacing: '.12em', textTransform: 'uppercase',
            transform: 'rotate(-35deg)', whiteSpace: 'nowrap', userSelect: 'none',
            textShadow: '0 1px 3px rgba(0,0,0,.4)',
          }}>
            Storie da Raccontare
          </span>
        </div>
      )}

      <div className="photo-actions-overlay" onClick={() => onOpenLightbox(index)} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 55%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '8px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>

          {/* ♡ Preferita */}
          <button onClick={e => { e.stopPropagation(); onToggleFavorite(photo.id) }} title={isFavorited ? 'Rimuovi dai preferite' : 'Aggiungi alle preferite'} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', background: 'none', display: 'grid', placeItems: 'center', transition: 'all .15s' }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill={isFavorited ? '#8ec9b0' : 'none'} stroke="#8ec9b0" strokeWidth={2} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>

          {/* 💬 Commento */}
          <button onClick={e => { e.stopPropagation(); onOpenComment(photo) }} title="Lascia un commento" style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'all .15s' }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#8ec9b0" strokeWidth={2} strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {commentCount > 0 && <span style={{ fontSize: '9px', color: '#8ec9b0', fontWeight: 700 }}>{commentCount}</span>}
          </button>

          {/* ↓ Download singolo */}
          {showDownloadSingle && (
            <button onClick={handleDownload} title="Scarica foto" style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', background: 'none', display: 'grid', placeItems: 'center', transition: 'all .15s', opacity: downloading ? .5 : 1 }}>
              {downloading ? <div style={{ width: 10, height: 10, border: '1.5px solid #8ec9b0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> : <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#8ec9b0" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
            </button>
          )}

          {/* 🛒 Ordina */}
          <button onClick={e => { e.stopPropagation(); onOpenOrder(photo) }} title="Ordina stampa" style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', background: 'none', display: 'grid', placeItems: 'center', transition: 'all .15s' }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={inCart ? '#fff' : '#8ec9b0'} strokeWidth={2} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </button>

        </div>
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────

export default function ClientePortalPage() {
  const { token } = useParams<{ token: string }>()

  const [gallery, setGallery]   = useState<PublicGallery | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lbIndex, setLbIndex]   = useState<number | null>(null)

  // interactions
  const [favorites, setFavorites]         = useState<Set<string>>(new Set())
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [commentPhoto, setCommentPhoto]   = useState<Photo | null>(null)

  // cart
  const [cart, setCart]             = useState<Map<string, CartItem>>(new Map())
  const [orderPhoto, setOrderPhoto] = useState<Photo | null>(null)
  const [cartOpen, setCartOpen]     = useState(false)

  // past orders
  const [pastOrders, setPastOrders]   = useState<PastOrder[]>([])
  const [ordersOpen, setOrdersOpen]   = useState(false)

  // zip download
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const sessionId  = useRef<string>('')
  const galleryRef = useRef<PublicGallery | null>(null)

  const fetchPastOrders = useCallback(async (galleryId: string) => {
    const res = await fetch(`/api/public/orders?gallery_id=${galleryId}&session_id=${sessionId.current}`)
    if (res.ok) {
      const data = await res.json()
      // mappa i campi dal formato DB al formato CartItem
      const mapped = data.map((o: {
        id: string; client_name: string | null; client_email: string | null;
        items: { photo_id: string; photo_url: string; filename: string; type: 'carta' | 'tela'; format: string; format_label: string; qty: number; unit_price: number; total: number }[];
        total: number; status: 'nuovo' | 'visto' | 'completato'; notes: string | null; created_at: string
      }) => ({
        id: o.id,
        client_name: o.client_name,
        client_email: o.client_email,
        items: o.items.map(i => ({
          id: `${i.photo_id}::${i.type}::${i.format}`,
          photoId: i.photo_id,
          photoUrl: i.photo_url,
          filename: i.filename,
          type: i.type,
          format: i.format,
          formatLabel: i.format_label,
          qty: i.qty,
          unitPrice: i.unit_price,
          total: i.total,
        })),
        total: o.total,
        status: o.status,
        notes: o.notes,
        created_at: o.created_at,
      }))
      setPastOrders(mapped)
    }
  }, [])

  // ── fetch gallery ────────────────────────────────────────────────────────
  useEffect(() => {
    sessionId.current = getSessionId()
    fetch(`/api/public/galleries/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((g: PublicGallery) => {
        setGallery(g)
        galleryRef.current = g
        return Promise.all([
          fetch(`/api/public/favorites?gallery_id=${g.id}&session_id=${sessionId.current}`).then(r => r.json()).then((ids: string[]) => setFavorites(new Set(ids))),
          fetch(`/api/public/comments?gallery_id=${g.id}`).then(r => r.json()).then((counts: Record<string, number>) => setCommentCounts(counts)),
          fetchPastOrders(g.id),
        ])
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token, fetchPastOrders])

  // ── favorites ────────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (photoId: string) => {
    if (!gallery) return
    setFavorites(prev => { const n = new Set(prev); n.has(photoId) ? n.delete(photoId) : n.add(photoId); return n })
    await fetch('/api/public/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_id: photoId, gallery_id: gallery.id, session_id: sessionId.current }) })
  }, [gallery])

  const handleCommentSaved = useCallback((photoId: string) => {
    setCommentCounts(prev => ({ ...prev, [photoId]: (prev[photoId] ?? 0) + 1 }))
  }, [])

  // ── download all as ZIP ───────────────────────────────────────────────────
  const downloadAll = useCallback(async () => {
    if (!gallery || downloading) return
    setDownloading(true)
    setDownloadProgress(0)
    try {
      const zip = new JSZip()
      const photos = gallery.photos
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const res = await fetch(photo.url)
        const blob = await res.blob()
        zip.file(photo.filename || `foto-${i + 1}.jpg`, blob)
        setDownloadProgress(Math.round(((i + 1) / photos.length) * 100))
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(content)
      a.download = `${gallery.name.replace(/[^a-z0-9]/gi, '-')}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setDownloading(false)
      setDownloadProgress(0)
    }
  }, [gallery, downloading])

  // ── cart ──────────────────────────────────────────────────────────────────
  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const next = new Map(prev)
      const existing = next.get(item.id)
      if (existing) {
        const newQty = existing.qty + item.qty
        const cartaFmt = item.type === 'carta' ? CARTA_FORMATS.find(f => f.key === item.format) : null
        const newUnit = cartaFmt ? getCartaUnitPrice(cartaFmt.tiers, newQty) : item.unitPrice
        next.set(item.id, { ...existing, qty: newQty, unitPrice: newUnit, total: newUnit * newQty })
      } else {
        next.set(item.id, item)
      }
      return next
    })
  }, [])

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => { const n = new Map(prev); n.delete(itemId); return n })
  }, [])

  const updateCartQty = useCallback((itemId: string, qty: number) => {
    setCart(prev => {
      const n = new Map(prev)
      const item = n.get(itemId)
      if (!item) return prev
      const cartaFmt = item.type === 'carta' ? CARTA_FORMATS.find(f => f.key === item.format) : null
      const newUnit = cartaFmt ? getCartaUnitPrice(cartaFmt.tiers, qty) : item.unitPrice
      n.set(itemId, { ...item, qty, unitPrice: newUnit, total: newUnit * qty })
      return n
    })
  }, [])

  const clearCart = useCallback(() => setCart(new Map()), [])

  const cartCount = Array.from(cart.values()).reduce((s, i) => s + i.qty, 0)
  const cartPhotos = new Set(Array.from(cart.values()).map(i => i.photoId))

  const closeLb    = useCallback(() => setLbIndex(null), [])
  const navigateLb = useCallback((i: number) => setLbIndex(i), [])

  // ── loading / not found ──────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #8ec9b0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#aaa', fontSize: '13px', letterSpacing: '.03em' }}>Caricamento galleria…</p>
      </div>
    </div>
  )

  if (notFound || !gallery) return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.06)', borderRadius: 16, padding: '40px 32px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 2px 20px rgba(0,0,0,.04)' }}>
        <div style={{ width: 52, height: 52, background: '#f5f5f3', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="#bbb" strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: '18px', color: '#222', marginBottom: 8 }}>Galleria non disponibile</h2>
        <p style={{ color: '#999', fontSize: '13px', lineHeight: 1.6 }}>Il link potrebbe essere scaduto o la galleria non è ancora attiva. Contatta il fotografo.</p>
      </div>
    </div>
  )

  const photos      = gallery.photos ?? []
  const photographer = gallery.profiles?.studio_name ?? gallery.profiles?.name ?? 'Storie da Raccontare'
  const coverBg     = gallery.cover_color ?? '#2a3830'

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#f8f8f6', fontFamily: 'Inter, DM Sans, sans-serif' }}>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', height: '75vh', minHeight: 420, overflow: 'hidden' }}>

          {/* Cover image: usa cover_url se impostata, altrimenti prima foto, altrimenti colore */}
          {(() => {
            const heroUrl = gallery.cover_url || (photos.length > 0 ? photos[0].url : null)
            return heroUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroUrl} alt={gallery.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${coverBg} 0%, color-mix(in srgb, ${coverBg} 60%, #0a0a0a) 100%)` }} />
            )
          })()}

          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.25) 100%)' }} />

          {/* Navbar */}
          <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 36px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, gap: 8 }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '5px 10px', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={photographer} style={{ height: 28, width: 'auto', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              {pastOrders.length > 0 && (
                <button
                  onClick={() => setOrdersOpen(true)}
                  style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#fff', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  <span className="portal-btn-label">I miei ordini ({pastOrders.length})</span>
                  <span style={{ display: 'none' }} className="portal-btn-count">{pastOrders.length > 0 ? pastOrders.length : ''}</span>
                </button>
              )}
              <button
                onClick={() => setCartOpen(true)}
                style={{ background: cartCount > 0 ? '#fff' : 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: cartCount > 0 ? '#111' : '#fff', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}
              >
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span className="portal-btn-label">{cartCount > 0 ? `Carrello (${cartCount})` : 'Carrello'}</span>
                {cartCount > 0 && <span className="portal-btn-mobile-count" style={{ fontWeight: 700, fontSize: '13px' }}>{cartCount}</span>}
              </button>
            </div>
          </nav>

          {/* Hero content — bottom left */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 40px)' }}>
            {gallery.type && (
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 10 }}>{gallery.type}</div>
            )}
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 'clamp(28px, 5vw, 54px)', color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.05, marginBottom: 12 }}>{gallery.name}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              {gallery.subtitle && (
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', fontStyle: 'italic', fontFamily: 'Playfair Display, serif' }}>{gallery.subtitle}</span>
              )}
              {gallery.date && (
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)', display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '.02em' }}>
                  <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {formatDate(gallery.date)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS BAR ──────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)', padding: 'clamp(10px, 2vw, 12px) clamp(16px, 4vw, 40px)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '.01em' }}>
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="#8ec9b0" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <strong style={{ color: '#444', fontWeight: 500 }}>{photos.length}</strong>&nbsp;foto
          </span>
          {/* Contatore preferiti — sempre visibile */}
          <span style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s' }}>
            <svg viewBox="0 0 24 24" width={12} height={12} fill={favorites.size > 0 ? '#d97070' : 'none'} stroke={favorites.size > 0 ? '#d97070' : '#ccc'} strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <strong style={{ color: favorites.size > 0 ? '#d97070' : '#bbb', fontWeight: 600, transition: 'color .2s' }}>{favorites.size}</strong>&nbsp;<span style={{ color: favorites.size > 0 ? '#888' : '#ccc', transition: 'color .2s' }}>preferiti</span>
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Download tutte */}
            {gallery.settings?.download_zip !== false && <button
              onClick={downloadAll}
              disabled={downloading || photos.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: downloading ? '#e8f5f0' : '#f0faf6', color: '#2d8c6e', border: '1px solid #b2ddc8', borderRadius: 6, padding: '7px 14px', fontSize: '11px', fontWeight: 600, letterSpacing: '.04em', cursor: downloading ? 'not-allowed' : 'pointer', transition: 'all .15s', textTransform: 'uppercase' }}
            >
              {downloading ? (
                <>
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: 'spin .8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  {downloadProgress}%
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Scarica tutte
                </>
              )}
            </button>}
            {/* CTA Scorri */}
            <a
              href="#photos"
              style={{ background: '#111', color: '#fff', borderRadius: 6, padding: '7px 18px', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textDecoration: 'none', textTransform: 'uppercase', transition: 'background .15s' }}
            >
              Scorri ↓
            </a>
          </div>
        </div>

        {/* ── PHOTO GRID ─────────────────────────────────────────────────── */}
        <div id="photos" style={{ padding: 'clamp(16px, 3vw, 28px) clamp(16px, 4vw, 40px) 48px' }}>
          {photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#bbb' }}>
              <p style={{ fontSize: '14px' }}>Le foto sono in arrivo…</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))', gap: 5 }}>
              {photos.map((photo, i) => (
                <PhotoItem
                  key={photo.id}
                  photo={photo}
                  index={i}
                  galleryId={gallery.id}
                  isFavorited={favorites.has(photo.id)}
                  commentCount={commentCounts[photo.id] ?? 0}
                  inCart={cartPhotos.has(photo.id)}
                  showWatermark={!!gallery.settings?.watermark}
                  showDownloadSingle={gallery.settings?.download_singolo !== false}
                  onOpenLightbox={setLbIndex}
                  onToggleFavorite={toggleFavorite}
                  onOpenComment={setCommentPhoto}
                  onOpenOrder={setOrderPhoto}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── BANNER STAMPA ──────────────────────────────────────────────── */}
        {photos.length > 0 && (
          <div style={{ margin: `0 clamp(16px, 4vw, 40px) 40px`, background: '#8ec9b0', borderRadius: 14, padding: 'clamp(20px, 3vw, 28px) clamp(20px, 3vw, 32px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '18px', color: '#111', marginBottom: 4 }}>Vuoi stampare le tue foto?</p>
              <p style={{ fontSize: '13px', color: 'rgba(0,0,0,.55)', fontWeight: 400 }}>Stampe professionali su carta fotografica e tela</p>
              <p style={{ fontSize: '12px', color: 'rgba(0,0,0,.65)', fontWeight: 600, marginTop: 6 }}>Hai già scaricato le foto? Puoi usare questo link per ordinarle in stampa.</p>
            </div>
            <a
              href="https://dilandweb2.fiteng.net/fitengdilandhomeweb/stampaClaudioSpera"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#111', color: '#8ec9b0', border: 'none', borderRadius: 8, padding: '11px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '.03em' }}
            >
              Vai alla stampa →
            </a>
          </div>
        )}

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,.07)', background: '#fff', padding: 'clamp(16px, 2vw, 22px) clamp(16px, 4vw, 40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '4px 8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Storie da Raccontare" style={{ height: 36, width: 'auto', display: 'block' }} />
          </div>
          <span style={{ fontSize: '11px', color: '#bbb', letterSpacing: '.03em' }}>Galleria privata · {photographer}</span>
        </div>
      </div>

      {/* Lightbox */}
      {lbIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lbIndex}
          onClose={closeLb}
          onNavigate={navigateLb}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onOpenComment={setCommentPhoto}
          onDownload={gallery?.settings?.download_singolo !== false ? downloadPhoto : undefined}
          showDownload={gallery?.settings?.download_singolo !== false}
          onOpenOrder={setOrderPhoto}
          showOrder={true}
        />
      )}

      {/* Comment modal */}
      {commentPhoto && <CommentModal photo={commentPhoto} galleryId={gallery.id} onClose={() => setCommentPhoto(null)} onSaved={handleCommentSaved} />}

      {/* Order modal */}
      {orderPhoto && <OrderModal photo={orderPhoto} onClose={() => setOrderPhoto(null)} onAdd={addToCart} />}

      {/* Cart drawer */}
      {cartOpen && <CartDrawer cart={cart} galleryId={gallery.id} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onUpdateQty={updateCartQty} onClear={clearCart} onOrderPlaced={() => fetchPastOrders(gallery.id)} />}

      {/* Orders history drawer */}
      {ordersOpen && <OrderHistoryDrawer orders={pastOrders} onClose={() => setOrdersOpen(false)} />}

    </>
  )
}

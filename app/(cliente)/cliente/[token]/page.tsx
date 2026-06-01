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
  settings?: {
    watermark?: boolean
    download_singolo?: boolean
    download_zip?: boolean
    show_title?: boolean
    show_subtitle?: boolean
    show_date?: boolean
    theme_palette?: string
    theme_font?: string
    theme_grid?: string
    theme_template?: string
  }
  photos: Photo[]
  profiles?: { name?: string; studio_name?: string }
}

interface CartItem {
  id: string           // `${photoId}::${productId}::${variantId}`
  photoId: string
  photoUrl: string
  filename: string
  productId: string    // e.g. 'stampe-classiche'
  productName: string  // e.g. 'Stampe Classiche'
  variantId: string    // e.g. 'sc-10x15'
  formatLabel: string  // e.g. '10×15 cm'
  priceBreaks?: { minQty: number; price: number }[]  // in euros, for qty recalc
  qty: number
  unitPrice: number    // in euros
  total: number        // in euros
}

// ── shop product types (minimal — matches /api/shop-products response) ──────

interface ShopVariant {
  id: string
  label: string
  price: number           // in centesimi
  priceBreaks?: { minQty: number; price: number }[]  // in centesimi
}

interface ShopProduct {
  id: string
  name: string
  shortDescription: string
  category: 'stampe' | 'decorazioni' | 'gadget'
  images: string[]
  variants: ShopVariant[]
}

// ── helpers ─────────────────────────────────────────────────────────────────

function getPriceForBreaks(
  breaks: { minQty: number; price: number }[] | undefined,
  qty: number,
  fallback: number
): number {
  if (!breaks?.length) return fallback
  const sorted = [...breaks].sort((a, b) => b.minQty - a.minQty)
  const match = sorted.find(b => qty >= b.minQty)
  return match ? match.price : fallback
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return null
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── theme maps ─────────────────────────────────────────────────────────────

const PALETTE_MAP: Record<string, {
  heroOverlay: string; navBg: string; navText: string; navBorder: string; navSub: string
  accent: string; gridBg: string; heroTextColor: string
}> = {
  agave:  { heroOverlay: 'linear-gradient(to top, rgba(10,30,20,.78) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.25) 100%)',    navBg: '#fff',     navText: '#111',    navBorder: 'rgba(0,0,0,.08)',         navSub: '#999',    accent: '#8ec9b0', gridBg: '#f8f8f6', heroTextColor: '#fff' },
  black:  { heroOverlay: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.2) 50%, rgba(0,0,0,.3) 100%)',         navBg: '#fff',     navText: '#111',    navBorder: 'rgba(0,0,0,.08)',         navSub: '#999',    accent: '#111',    gridBg: '#f4f4f4', heroTextColor: '#fff' },
  warm:   { heroOverlay: 'linear-gradient(to top, rgba(25,12,0,.80) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.2) 100%)',       navBg: '#faf8f3', navText: '#2a1a00', navBorder: 'rgba(0,0,0,.07)',         navSub: '#a0886a', accent: '#c9a05a', gridBg: '#faf7f1', heroTextColor: '#fff' },
  white:  { heroOverlay: 'linear-gradient(to top, rgba(0,0,0,.65) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.2) 100%)',         navBg: '#f8f7f5', navText: '#1a1a1a', navBorder: 'rgba(0,0,0,.06)',         navSub: '#aaa',    accent: '#333',    gridBg: '#ffffff', heroTextColor: '#fff' },
  dark:   { heroOverlay: 'linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.3) 50%, rgba(0,0,0,.45) 100%)',        navBg: '#111',     navText: '#ccc',    navBorder: 'rgba(255,255,255,.08)',   navSub: '#555',    accent: '#888',    gridBg: '#0d0d0d', heroTextColor: '#e0e0e0' },
  cool:   { heroOverlay: 'linear-gradient(to top, rgba(5,15,35,.82) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.25) 100%)',     navBg: '#fff',     navText: '#111',    navBorder: 'rgba(0,0,0,.08)',         navSub: '#999',    accent: '#7ab0dc', gridBg: '#f5f7fa', heroTextColor: '#fff' },
}

const FONT_MAP: Record<string, { family: string; googleId: string; weight: string }> = {
  syne:     { family: "'Syne', sans-serif",         googleId: 'Syne:wght@700;800',              weight: '800' },
  playfair: { family: "'Playfair Display', serif",  googleId: 'Playfair+Display:wght@400;700',  weight: '700' },
  bodoni:   { family: "'Bodoni Moda', serif",       googleId: 'Bodoni+Moda:ital,wght@0,400;0,700', weight: '700' },
  inter:    { family: "'Inter', sans-serif",        googleId: 'Inter:wght@300;400;600',          weight: '400' },
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('fs_session')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('fs_session', id) }
  return id
}

async function downloadPhoto(photo: Photo) {
  const res = await fetch(`/api/download?url=${encodeURIComponent(photo.url)}`)
  if (!res.ok) throw new Error('Download fallito')
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

const CATEGORY_TABS: { id: 'stampe' | 'decorazioni' | 'gadget'; label: string; emoji: string }[] = [
  { id: 'stampe',      label: 'Stampe',      emoji: '📄' },
  { id: 'decorazioni', label: 'Decorazioni', emoji: '🖼️' },
  { id: 'gadget',      label: 'Gadget',      emoji: '🎁' },
]

function OrderModal({ photo, onClose, onAdd }: OrderModalProps) {
  const [products, setProducts]           = useState<ShopProduct[] | null>(null)
  const [category, setCategory]           = useState<'stampe' | 'decorazioni' | 'gadget'>('stampe')
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [qty, setQty]                     = useState(1)

  useEffect(() => {
    fetch('/api/shop-products')
      .then(r => r.ok ? r.json() : [])
      .then(setProducts)
  }, [])

  useEffect(() => {
    if (selectedProduct) setSelectedVariantId(selectedProduct.variants[0]?.id ?? '')
    setQty(1)
  }, [selectedProduct])

  useEffect(() => { setQty(1) }, [selectedVariantId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (selectedProduct) setSelectedProduct(null); else onClose() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, selectedProduct])

  const variant   = selectedProduct?.variants.find(v => v.id === selectedVariantId)
  const unitCents = variant ? getPriceForBreaks(
    variant.priceBreaks?.map(b => ({ minQty: b.minQty, price: b.price })),
    qty,
    variant.price
  ) : 0
  const unitPrice = unitCents / 100
  const total     = unitPrice * qty
  const nextTier  = variant?.priceBreaks
    ? [...variant.priceBreaks].sort((a, b) => a.minQty - b.minQty).find(b => b.minQty > qty)
    : null

  const handleAdd = () => {
    if (!selectedProduct || !variant) return
    const priceBreaks = variant.priceBreaks?.map(b => ({ minQty: b.minQty, price: b.price / 100 }))
    onAdd({
      id: `${photo.id}::${selectedProduct.id}::${variant.id}`,
      photoId: photo.id,
      photoUrl: photo.url,
      filename: photo.filename,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      variantId: variant.id,
      formatLabel: variant.label,
      priceBreaks,
      qty,
      unitPrice,
      total,
    })
    onClose()
  }

  const filtered = products?.filter(p => p.category === category) ?? []

  const ICON_CLOSE = <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
  const ICON_BACK  = <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
  const ICON_CART  = <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>

  const variantBtnStyle = (selected: boolean): React.CSSProperties => ({
    background: selected ? 'var(--acd)' : 'var(--s2)',
    border: `1px solid ${selected ? 'var(--ac)' : 'var(--b1)'}`,
    borderRadius: 6,
    padding: '5px 10px',
    color: selected ? 'var(--ac)' : 'var(--t2)',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all .15s',
  })

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .2s ease' }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'slideUp .25s ease', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selectedProduct && (
              <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6, flexShrink: 0 }}>{ICON_BACK}</button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>
                {selectedProduct ? selectedProduct.name : 'Ordina prodotto'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 1 }}>{photo.filename}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6, flexShrink: 0 }}>{ICON_CLOSE}</button>
        </div>

        {/* ── STEP 1: product selection ── */}
        {!selectedProduct && (
          <>
            {/* Category tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
              {CATEGORY_TABS.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: category === cat.id ? 600 : 400, border: 'none', cursor: 'pointer', background: category === cat.id ? 'var(--acd)' : 'transparent', color: category === cat.id ? 'var(--ac)' : 'var(--t3)', borderBottom: `2px solid ${category === cat.id ? 'var(--ac)' : 'transparent'}`, transition: 'all .15s' }}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Product list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {products === null ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div style={{ width: 22, height: 22, border: '2px solid var(--ac)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                </div>
              ) : filtered.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--t3)', textAlign: 'center', padding: 32 }}>Nessun prodotto disponibile</p>
              ) : filtered.map(p => {
                const minPrice = Math.min(...p.variants.map(v => v.price)) / 100
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', width: '100%' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(142,201,176,.3)'; e.currentTarget.style.background = 'var(--s3)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.background = 'var(--s2)' }}
                  >
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>{p.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.shortDescription}</p>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', color: 'var(--t3)' }}>da</p>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--ac)' }}>{fmt(minPrice)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── STEP 2: product configuration ── */}
        {selectedProduct && variant && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Variante */}
            <div>
              <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 500, marginBottom: 8 }}>
                {selectedProduct.variants.length > 1 ? 'Formato / Variante' : 'Variante'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedProduct.variants.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariantId(v.id)} style={variantBtnStyle(v.id === selectedVariantId)}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantità */}
            <div>
              <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 500, marginBottom: 8 }}>Quantità</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', fontSize: '16px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>−</button>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--tx)', minWidth: 40, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', fontSize: '16px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>+</button>
                <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: 4 }}>{fmt(unitPrice)} / pz</span>
              </div>
              {nextTier && (
                <p style={{ fontSize: '10px', color: 'var(--amber)', marginTop: 6 }}>
                  💡 Da {nextTier.minQty} pz → {fmt(nextTier.price / 100)} / pz
                </p>
              )}
            </div>

            {/* Scaglioni prezzo */}
            {variant.priceBreaks && variant.priceBreaks.length > 1 && (
              <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '8px 12px' }}>
                <p style={{ fontSize: '10px', color: 'var(--t3)', marginBottom: 5, fontWeight: 500 }}>Scaglioni di prezzo</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                  {[...variant.priceBreaks].sort((a, b) => a.minQty - b.minQty).map((b, i, arr) => {
                    const isActive = qty >= b.minQty && (i === arr.length - 1 || qty < arr[i + 1].minQty)
                    return (
                      <span key={b.minQty} style={{ fontSize: '10px', color: isActive ? 'var(--ac)' : 'var(--t3)', fontWeight: isActive ? 600 : 400 }}>
                        {b.minQty}+ → {fmt(b.price / 100)}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Totale + CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--t3)' }}>Totale</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--tx)' }}>{fmt(total)}</p>
              </div>
              <button onClick={handleAdd} style={{ background: 'var(--ac)', color: '#111', border: 'none', borderRadius: 'var(--r2)', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {ICON_CART} Aggiungi al carrello
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── OrderHistoryDrawer ─────────────────────────────────────────────────────

// Items come back from DB in snake_case (as stored)
interface HistoryItem {
  photo_url: string
  filename: string
  product_name?: string   // new format
  format_label: string
  qty: number
  unit_price: number
  total: number
}

interface PastOrder {
  id: string
  client_name: string | null
  client_email: string | null
  items: HistoryItem[]
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
                      <img src={item.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '11px', color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
                        <p style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 2 }}>
                          {item.product_name ?? '📦'} · {item.format_label} × {item.qty}
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
  const lines = items.map(i => `• ${i.qty}x ${i.productName} ${i.formatLabel} — ${fmt(i.unitPrice * i.qty)}`).join('\n')
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
          product_id: i.productId, product_name: i.productName,
          variant_id: i.variantId, format_label: i.formatLabel,
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
                const curUnitPrice = getPriceForBreaks(item.priceBreaks, item.qty, item.unitPrice)
                return (
                  <div key={item.id} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.photoUrl} alt="" style={{ width: 50, height: 50, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '11px', color: 'var(--tx)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
                      <p style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 2 }}>{item.productName} · {item.formatLabel}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
                        <button onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))} style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--s3)', border: 'none', color: 'var(--tx)', fontSize: '14px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>−</button>
                        <span style={{ fontSize: '12px', color: 'var(--tx)', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--s3)', border: 'none', color: 'var(--tx)', fontSize: '14px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>+</button>
                        <span style={{ fontSize: '10px', color: 'var(--t3)', marginLeft: 2 }}>{fmt(curUnitPrice)} / pz</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--tx)' }}>{fmt(curUnitPrice * item.qty)}</span>
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
  gridMode?: boolean
}

function PhotoItem({ photo, index, galleryId, isFavorited, commentCount, inCart, showWatermark, showDownloadSingle, onOpenLightbox, onToggleFavorite, onOpenComment, onOpenOrder, gridMode }: PhotoItemProps) {
  const [downloading, setDownloading] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDownloading(true)
    await downloadPhoto(photo)
    setDownloading(false)
  }

  return (
    <div
      style={{ borderRadius: '3px', overflow: 'hidden', background: '#e8e8e6', position: 'relative', breakInside: 'avoid', marginBottom: gridMode ? 0 : 6, cursor: 'pointer', ...(gridMode ? { aspectRatio: '3/2' } : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenLightbox(index)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.filename} loading="lazy" style={{ width: '100%', height: gridMode ? '100%' : 'auto', objectFit: gridMode ? 'cover' : undefined, display: 'block' }} />

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

      {/* Hover overlay — gradiente + icone bianche */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.05) 45%, transparent 100%)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s ease',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px 12px',
        pointerEvents: hovered ? 'auto' : 'none',
      }}>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', alignItems: 'center' }}>

          {/* ♡ Preferita */}
          <button onClick={e => { e.stopPropagation(); onToggleFavorite(photo.id) }} title={isFavorited ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center', transition: 'transform .15s' }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill={isFavorited ? '#fff' : 'none'} stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>

          {/* ↓ Download singolo */}
          {showDownloadSingle && (
            <button onClick={handleDownload} title="Scarica foto" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center', opacity: downloading ? .5 : 1, transition: 'transform .15s' }}>
              {downloading
                ? <div style={{ width: 12, height: 12, border: '1.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                : <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              }
            </button>
          )}

          {/* 💬 Commento */}
          <button onClick={e => { e.stopPropagation(); onOpenComment(photo) }} title="Lascia un commento" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3, transition: 'transform .15s' }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {commentCount > 0 && <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{commentCount}</span>}
          </button>

          {/* 🛒 Ordina */}
          <button onClick={e => { e.stopPropagation(); onOpenOrder(photo) }} title="Ordina stampa" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center', transition: 'transform .15s' }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={inCart ? '#8ec9b0' : '#fff'} strokeWidth={1.8} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </button>

        </div>
      </div>
    </div>
  )
}

// ── Slideshow ──────────────────────────────────────────────────────────────

function SlideshowModal({ photos, onClose }: { photos: Photo[]; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const next = useCallback(() => setIndex(i => (i + 1) % photos.length), [photos.length])
  const prev = useCallback(() => setIndex(i => (i - 1 + photos.length) % photos.length), [photos.length])

  useEffect(() => {
    if (playing) {
      timerRef.current = setTimeout(next, 4000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [playing, index, next])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') { next(); setPlaying(false) }
      if (e.key === 'ArrowLeft')  { prev(); setPlaying(false) }
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, next, prev])

  const photo = photos[index]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Foto */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={photo.id}
        src={photo.url}
        alt={photo.filename}
        style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain', display: 'block', animation: 'fadeIn .4s ease' }}
      />

      {/* Barra superiore */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,.6), transparent)' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', fontFamily: 'Syne, sans-serif', fontWeight: 600, letterSpacing: '.05em' }}>
          {index + 1} / {photos.length}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}>
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Freccia sinistra */}
      <button
        onClick={() => { prev(); setPlaying(false) }}
        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff', transition: 'background .15s' }}
      >
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      {/* Freccia destra */}
      <button
        onClick={() => { next(); setPlaying(false) }}
        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff', transition: 'background .15s' }}
      >
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {/* Barra inferiore: play/pause + barra progresso */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: 'linear-gradient(to top, rgba(0,0,0,.5), transparent)' }}>
        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,.2)', borderRadius: 2 }}>
          <div style={{ height: '100%', background: '#fff', borderRadius: 2, width: `${((index + 1) / photos.length) * 100}%`, transition: 'width .3s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setPlaying(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 20, padding: '7px 18px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '.06em' }}
          >
            {playing
              ? <><svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausa</>
              : <><svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</>
            }
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

  // slideshow
  const [slideshowOpen, setSlideshowOpen] = useState(false)

  // past orders
  const [pastOrders, setPastOrders]   = useState<PastOrder[]>([])
  const [ordersOpen, setOrdersOpen]   = useState(false)

  // zip download
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // istruzioni modal
  const [showIstruzioni, setShowIstruzioni] = useState(false)

  const sessionId  = useRef<string>('')
  const galleryRef = useRef<PublicGallery | null>(null)

  const fetchPastOrders = useCallback(async (galleryId: string) => {
    const res = await fetch(`/api/public/orders?gallery_id=${galleryId}&session_id=${sessionId.current}`)
    if (res.ok) {
      const data = await res.json()
      // items arrivano già in snake_case dal DB — compatibile con HistoryItem
      setPastOrders(data)
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
  const cancelDownload = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const downloadAll = useCallback(async () => {
    if (!gallery || downloading) return
    const abort = new AbortController()
    abortRef.current = abort
    setDownloading(true)
    setDownloadProgress(0)
    try {
      const zip = new JSZip()
      const photos = gallery.photos
      for (let i = 0; i < photos.length; i++) {
        if (abort.signal.aborted) break
        const photo = photos[i]
        const res = await fetch(`/api/download?url=${encodeURIComponent(photo.url)}`, { signal: abort.signal })
        const blob = await res.blob()
        zip.file(photo.filename || `foto-${i + 1}.jpg`, blob)
        setDownloadProgress(Math.round(((i + 1) / photos.length) * 100))
      }
      if (!abort.signal.aborted) {
        const content = await zip.generateAsync({ type: 'blob' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(content)
        a.download = `${gallery.name.replace(/[^a-z0-9]/gi, '-')}.zip`
        a.click()
        URL.revokeObjectURL(a.href)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') throw e
    } finally {
      abortRef.current = null
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
        const newUnit = getPriceForBreaks(existing.priceBreaks, newQty, existing.unitPrice)
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
      const newUnit = getPriceForBreaks(item.priceBreaks, qty, item.unitPrice)
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

  // ── theme derivation ──────────────────────────────────────────────────────
  const paletteId = gallery.settings?.theme_palette ?? 'agave'
  const fontId    = gallery.settings?.theme_font    ?? 'syne'
  const gridId    = gallery.settings?.theme_grid    ?? 'masonry'
  const theme     = PALETTE_MAP[paletteId] ?? PALETTE_MAP['agave']
  const fontDef   = FONT_MAP[fontId] ?? FONT_MAP['syne']

  const showTitle    = gallery.settings?.show_title    !== false
  const showSubtitle = gallery.settings?.show_subtitle !== false
  const showDate     = gallery.settings?.show_date     !== false

  return (
    <>
      {/* Dynamic font link */}
      {fontId !== 'syne' && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${fontDef.googleId}&display=swap`}
        />
      )}
      <div style={{ minHeight: '100vh', background: theme.gridBg, fontFamily: 'Inter, DM Sans, sans-serif' }}>

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
          <div style={{ position: 'absolute', inset: 0, background: theme.heroOverlay }} />

          {/* Navbar — solo logo */}
          <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'clamp(16px, 3vw, 24px) clamp(16px, 4vw, 36px)', display: 'flex', alignItems: 'center', zIndex: 10 }}>
            <div style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '5px 10px', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={photographer} style={{ height: 26, width: 'auto', display: 'block' }} />
            </div>
          </nav>

          {/* Hero content — centrato */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px clamp(20px, 6vw, 80px) 20px', textAlign: 'center' }}>
            {gallery.type && (
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', color: `${theme.heroTextColor}88`, marginBottom: 20 }}>{gallery.type}</div>
            )}
            {showTitle && (
              <h1 style={{ fontFamily: fontDef.family, fontWeight: fontDef.weight as React.CSSProperties['fontWeight'], fontSize: 'clamp(32px, 7vw, 96px)', color: theme.heroTextColor, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8, textTransform: 'uppercase' }}>{gallery.name}</h1>
            )}
            {(showSubtitle || showDate) && (gallery.subtitle || gallery.date) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
                {showSubtitle && gallery.subtitle && <span style={{ fontSize: '15px', color: `${theme.heroTextColor}88`, fontStyle: 'italic' }}>{gallery.subtitle}</span>}
                {showDate && gallery.date && <span style={{ fontSize: '13px', color: `${theme.heroTextColor}66`, letterSpacing: '.04em' }}>{formatDate(gallery.date)}</span>}
              </div>
            )}
            {!(showSubtitle && gallery.subtitle) && !(showDate && gallery.date) && <div style={{ marginBottom: 36 }} />}
            <a href="#photos" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: `${theme.heroTextColor}e0`, textDecoration: 'none', borderBottom: `1px solid ${theme.heroTextColor}77`, paddingBottom: 4, transition: 'color .15s' }}>
              View Gallery
            </a>
          </div>
        </div>

        {/* ── STICKY NAV BAR ─────────────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: theme.navBg, borderBottom: `1px solid ${theme.navBorder}`, padding: '0 clamp(16px, 4vw, 40px)', display: 'flex', alignItems: 'center', gap: 16, height: 56, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          {/* Sinistra: nome galleria + fotografo */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1 }}>
            <p style={{ fontFamily: fontDef.family, fontWeight: 700, fontSize: '13px', color: theme.navText, letterSpacing: '.01em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gallery.name}</p>
            <p style={{ fontSize: '10px', color: theme.navSub, letterSpacing: '.05em', textTransform: 'uppercase', lineHeight: 1.2, marginTop: 2 }}>{photographer}</p>
          </div>

          {/* Destra: azioni con testo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

            {/* Favorites */}
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: 'none', cursor: 'default', color: favorites.size > 0 ? theme.navText : theme.navSub, fontSize: '12px', fontWeight: 500, letterSpacing: '.01em' }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill={favorites.size > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span className="nav-label">Favorites{favorites.size > 0 ? ` (${favorites.size})` : ''}</span>
            </button>

            {/* Download */}
            {gallery.settings?.download_zip !== false && (
              <button onClick={downloading ? cancelDownload : downloadAll} disabled={!downloading && photos.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: 'none', cursor: photos.length === 0 ? 'default' : 'pointer', color: downloading ? '#c0392b' : theme.navSub, fontSize: '12px', fontWeight: 500, letterSpacing: '.01em', transition: 'color .15s' }}>
                {downloading
                  ? <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                }
                <span className="nav-label">{downloading ? `Annulla (${downloadProgress}%)` : 'Download'}</span>
              </button>
            )}

            {/* Carrello / Share */}
            <button onClick={() => setCartOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', color: cartCount > 0 ? theme.navText : theme.navSub, fontSize: '12px', fontWeight: cartCount > 0 ? 600 : 500, letterSpacing: '.01em', transition: 'color .15s' }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              <span className="nav-label">{cartCount > 0 ? `Carrello (${cartCount})` : 'Share'}</span>
            </button>

            {/* Slideshow */}
            <button onClick={() => setSlideshowOpen(true)} disabled={photos.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: 'none', cursor: photos.length === 0 ? 'default' : 'pointer', color: theme.navSub, fontSize: '12px', fontWeight: 500, letterSpacing: '.01em', transition: 'color .15s' }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span className="nav-label">Slideshow</span>
            </button>

            {/* I miei ordini */}
            {pastOrders.length > 0 && (
              <button onClick={() => setOrdersOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', color: theme.navSub, fontSize: '12px', fontWeight: 500, letterSpacing: '.01em' }}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span className="nav-label">Ordini</span>
              </button>
            )}
          </div>
        </div>

        {/* ── PHOTO GRID ─────────────────────────────────────────────────── */}
        <div id="photos" style={{ padding: 'clamp(12px, 2vw, 20px) clamp(12px, 3vw, 24px) 60px' }}>
          {photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#bbb' }}>
              <p style={{ fontSize: '14px' }}>Le foto sono in arrivo…</p>
            </div>
          ) : gridId === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
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
                  gridMode
                />
              ))}
            </div>
          ) : (
            <div style={{ columns: 4, columnGap: 6 }}>
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

        {/* ── BOTTOM ACTIONS ─────────────────────────────────────────────── */}
        {photos.length > 0 && (
          <div style={{ padding: '0 clamp(16px, 4vw, 40px) 48px', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {gallery.settings?.download_zip !== false && <button
                onClick={downloadAll}
                disabled={downloading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: downloading ? '#e8f5f0' : '#111', color: downloading ? '#2d8c6e' : '#fff',
                  border: 'none', borderRadius: 10, padding: '14px 28px',
                  fontSize: '14px', fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer',
                  letterSpacing: '.03em', transition: 'all .15s', minWidth: 220, justifyContent: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,.15)',
                }}
              >
                {downloading ? (
                  <>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: 'spin .8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Download in corso… {downloadProgress}%
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Scarica tutte le foto
                  </>
                )}
              </button>}
            {downloading && (
              <button
                onClick={cancelDownload}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fff0f0', color: '#c0392b',
                  border: '1px solid #f5c6c6', borderRadius: 10, padding: '14px 24px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  letterSpacing: '.03em', transition: 'all .15s', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                }}
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Annulla
              </button>
            )}
            <button
              onClick={() => setShowIstruzioni(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#fff', color: '#444',
                border: '1px solid rgba(0,0,0,.15)', borderRadius: 10, padding: '14px 28px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                letterSpacing: '.03em', transition: 'all .15s', minWidth: 160, justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,.06)',
              }}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Istruzioni
            </button>
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

      {/* Istruzioni modal */}
      {showIstruzioni && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowIstruzioni(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,.25)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 20, color: '#111' }}>Istruzioni</h2>
              <button
                onClick={() => setShowIstruzioni(false)}
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,.1)', background: '#f5f5f5', cursor: 'pointer', fontSize: 16, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            </div>
            {/* Body */}
            <div style={{ padding: '20px 24px 28px', fontSize: 14, color: '#333', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 12px' }}>Ciao</p>
              <p style={{ margin: '0 0 12px' }}>in questo link trovi tutte le foto, a volte divise in varie cartelle.<br />Il link resterà attivo per <strong>30 giorni</strong>.</p>
              <p style={{ margin: '0 0 12px' }}>Puoi scaricarle singolarmente cliccando sulla freccia in basso sotto la foto, oppure tutte insieme cliccando sul relativo pulsante alla fine della galleria.</p>
              <p style={{ margin: '0 0 12px' }}>Puoi condividere il link con chi desideri: ognuno potrà scaricare solo le foto che preferisce.</p>
              <p style={{ margin: '0 0 12px' }}>Se deciderete di fare l&apos;album, vi basterà scegliere la quantità di foto concordata con il fotografo (c&apos;è anche un contatore all&apos;inizio della galleria), mettendo il &quot;like&quot; a quelle che vi emozionano di più (clic sul cuore).</p>
              <p style={{ margin: '0 0 12px' }}>In questo modo l&apos;album racconterà la vostra giornata attraverso gli scatti che sentite più vicini al cuore.</p>
              <p style={{ margin: '0 0 12px' }}>Se invece dovete modificare un fotolibro, utilizzate il tasto commenti sotto le foto e suggerite al fotografo le modifiche da effettuare a quella pagina.</p>
              <p style={{ margin: '0 0 16px' }}>In ogni caso, vi chiedo di avvisarmi.</p>
              <p style={{ margin: '0 0 16px', fontStyle: 'italic', color: '#555' }}>PS: Se pubblichi qualcosa sui social, mi farebbe super piacere se mi taggassi!</p>
              <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="#8ec9b0" strokeWidth={2} strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>@Claudiosperafotografo</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
      {slideshowOpen && photos.length > 0 && <SlideshowModal photos={photos} onClose={() => setSlideshowOpen(false)} />}

    </>
  )
}

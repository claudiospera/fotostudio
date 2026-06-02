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
    text_color?: string
    text_position?: string
    photo_position?: string
    hero_layout?: string
    hero_bg?: string       // 'photo' | 'solid'
    hero_bg_color?: string // colore esadecimale quando hero_bg === 'solid'
    hero_fit?: string      // 'cover' | 'contain'
  }
  photos: Photo[]
  profiles?: { name?: string; studio_name?: string }
}

interface CartItem {
  id: string           // `${photoId}::${productId}::${variantId}::${frameId}::${ppId}::${ptId}`
  photoId: string
  photoUrl: string
  filename: string
  productId: string
  productName: string
  variantId: string
  formatLabel: string
  priceBreaks?: { minQty: number; price: number }[]  // in euros
  qty: number
  unitPrice: number    // in euros (incl. extras opzioni)
  total: number        // in euros
  // opzioni prodotto
  frameId?: string
  frameLabel?: string
  passepartoutId?: string
  passepartoutLabel?: string
  printTypeId?: string
  printTypeLabel?: string
  cropX?: number   // 0-100 (posizione orizzontale, default 50 = centro)
  cropY?: number   // 0-100 (posizione verticale, default 50 = centro)
}

// ── shop product types (minimal — matches /api/shop-products response) ──────

interface ShopVariant {
  id: string
  label: string
  price: number           // in centesimi
  priceBreaks?: { minQty: number; price: number }[]  // in centesimi
  widthCm?: number
  heightCm?: number
}

interface ShopProductOptions {
  frames?: { id: string; label: string; color: string; border: string }[]
  printTypes?: { id: string; label: string; description: string; extraPrice: number }[]
  passepartout?: { id: string; label: string; color?: string; extraPrice: number }[]
}

interface ShopProduct {
  id: string
  name: string
  shortDescription: string
  category: 'stampe' | 'decorazioni' | 'gadget'
  images: string[]
  variants: ShopVariant[]
  options?: ShopProductOptions
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

function fmt(n: number | string) { return Number(n).toFixed(2).replace('.', ',') + ' €' }

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

const TEXT_POSITION_STYLES: Record<string, { jc: string; ai: string; ta: 'left' | 'center' | 'right' }> = {
  'top-left':     { jc: 'flex-start', ai: 'flex-start', ta: 'left'   },
  'top-center':   { jc: 'flex-start', ai: 'center',     ta: 'center' },
  'top-right':    { jc: 'flex-start', ai: 'flex-end',   ta: 'right'  },
  'center-left':  { jc: 'center',     ai: 'flex-start', ta: 'left'   },
  'center-center':{ jc: 'center',     ai: 'center',     ta: 'center' },
  'center-right': { jc: 'center',     ai: 'flex-end',   ta: 'right'  },
  'bottom-left':  { jc: 'flex-end',   ai: 'flex-start', ta: 'left'   },
  'bottom-center':{ jc: 'flex-end',   ai: 'center',     ta: 'center' },
  'bottom-right': { jc: 'flex-end',   ai: 'flex-end',   ta: 'right'  },
}

const PHOTO_POSITION_CSS: Record<string, string> = {
  'top-left':     'left top',    'top-center':    'center top',    'top-right':    'right top',
  'center-left':  'left center', 'center-center': 'center center', 'center-right': 'right center',
  'bottom-left':  'left bottom', 'bottom-center': 'center bottom', 'bottom-right': 'right bottom',
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('fs_session')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('fs_session', id) }
  return id
}

function downloadPhoto(photo: Photo) {
  const a = document.createElement('a')
  a.href = `/api/download?url=${encodeURIComponent(photo.url)}`
  a.download = photo.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── OrderModal ─────────────────────────────────────────────────────────────

interface OrderModalProps {
  photos: Photo[]
  onClose: () => void
  onAdd: (item: CartItem) => void
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  stampe:      <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  decorazioni: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M2 7h20M7 2v5M17 2v5"/></svg>,
  gadget:      <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
}

const CATEGORY_TABS: { id: 'stampe' | 'decorazioni' | 'gadget'; label: string }[] = [
  { id: 'stampe',      label: 'Stampe'      },
  { id: 'decorazioni', label: 'Decorazioni' },
  { id: 'gadget',      label: 'Gadget'      },
]

function OrderModal({ photos, onClose, onAdd }: OrderModalProps) {
  const [products, setProducts]           = useState<ShopProduct[] | null>(null)
  const [category, setCategory]           = useState<'stampe' | 'decorazioni' | 'gadget'>('stampe')
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [qty, setQty]                     = useState(1)
  // options
  const [frameId, setFrameId]             = useState('')
  const [passepartoutId, setPassepartoutId] = useState('none')
  const [printTypeId, setPrintTypeId]     = useState('')
  // crop/position (percentuali 0-100, default centro)
  const [cropX, setCropX] = useState(50)
  const [cropY, setCropY] = useState(50)
  // zoom (1.0 = nessuno zoom, max 4.0)
  const [zoom, setZoom] = useState(1)
  // orientamento anteprima (scambia larghezza/altezza)
  const [rotated, setRotated] = useState(false)

  const isBatch = photos.length > 1
  const photo   = photos[0]  // preview foto: prima selezionata

  useEffect(() => {
    fetch('/api/shop-products')
      .then(r => r.ok ? r.json() : [])
      .then(setProducts)
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      setSelectedVariantId(selectedProduct.variants[0]?.id ?? '')
      // inizializza opzioni con i default
      setFrameId(selectedProduct.options?.frames?.[0]?.id ?? '')
      setPassepartoutId(selectedProduct.options?.passepartout?.[0]?.id ?? 'none')
      setPrintTypeId(selectedProduct.options?.printTypes?.[0]?.id ?? '')
    }
    setQty(1)
  }, [selectedProduct])

  useEffect(() => { setQty(1); setCropX(50); setCropY(50); setZoom(1); setRotated(false) }, [selectedVariantId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (selectedProduct) setSelectedProduct(null); else onClose() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, selectedProduct])

  // Fallback al primo variant per evitare il frame vuoto tra setSelectedProduct e l'useEffect che aggiorna selectedVariantId
  const variant           = selectedProduct?.variants.find(v => v.id === selectedVariantId) ?? selectedProduct?.variants[0]
  const printTypeExtra    = selectedProduct?.options?.printTypes?.find(pt => pt.id === printTypeId)?.extraPrice ?? 0
  const passepartoutExtra = selectedProduct?.options?.passepartout?.find(pp => pp.id === passepartoutId)?.extraPrice ?? 0
  const extraCents        = printTypeExtra + passepartoutExtra
  // In batch, gli scaglioni si basano sul totale stampe (N foto × qty ciascuna)
  const effectiveQty = qty * (isBatch ? photos.length : 1)
  const baseCents    = variant ? getPriceForBreaks(
    variant.priceBreaks?.map(b => ({ minQty: b.minQty, price: b.price })),
    effectiveQty,
    variant.price
  ) : 0
  const unitCents    = baseCents + extraCents
  const unitPrice    = unitCents / 100
  const grandTotal   = unitPrice * effectiveQty
  const nextTier     = variant?.priceBreaks
    ? [...variant.priceBreaks].sort((a, b) => a.minQty - b.minQty).find(b => b.minQty > effectiveQty)
    : null

  const frameLabel        = selectedProduct?.options?.frames?.find(f => f.id === frameId)?.label
  const passepartoutLabel = selectedProduct?.options?.passepartout?.find(pp => pp.id === passepartoutId)?.label
  const printTypeLabel    = selectedProduct?.options?.printTypes?.find(pt => pt.id === printTypeId)?.label

  const handleAdd = () => {
    if (!selectedProduct || !variant) return
    const priceBreaks = variant.priceBreaks?.map(b => ({ minQty: b.minQty, price: b.price / 100 }))
    const optionsSuffix = `${frameId}::${passepartoutId}::${printTypeId}`
    const photosToAdd = isBatch ? photos : [photo]
    photosToAdd.forEach(p => {
      onAdd({
        id: `${p.id}::${selectedProduct.id}::${variant.id}::${optionsSuffix}`,
        photoId: p.id,
        photoUrl: p.url,
        filename: p.filename,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        variantId: variant.id,
        formatLabel: variant.label,
        priceBreaks,
        qty,
        unitPrice,
        total: unitPrice * qty,
        frameId: frameId || undefined,
        frameLabel: frameLabel || undefined,
        passepartoutId: passepartoutId !== 'none' ? passepartoutId : undefined,
        passepartoutLabel: passepartoutId !== 'none' ? passepartoutLabel : undefined,
        printTypeId: printTypeId || undefined,
        printTypeLabel: printTypeLabel || undefined,
        cropX,
        cropY,
      })
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

  // ── pannello laterale destro (stile Pixieset) ──
  return (
    <>
      {/* Overlay cliccabile */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.45)', animation: 'fadeIn .2s ease' }} />

      {/* Pannello */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 401, width: '100%', maxWidth: 580, background: 'var(--s1)', borderLeft: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight .25s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {selectedProduct && (
              <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 8, flexShrink: 0 }}>{ICON_BACK}</button>
            )}
            {/* Anteprima foto: singola o strip di thumbnails */}
            {isBatch ? (
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                {photos.slice(0, 5).map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', opacity: i < 4 ? 1 : 0.5 }} />
                ))}
                {photos.length > 5 && <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--s3)', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--t2)', flexShrink: 0 }}>+{photos.length - 5}</div>}
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.url} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '15px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--tx)' }}>
                {selectedProduct ? selectedProduct.name : 'Tutti i prodotti'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 1 }}>
                {isBatch ? `${photos.length} foto selezionate` : photo.filename}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 8, flexShrink: 0 }}>{ICON_CLOSE}</button>
        </div>

        {/* ── STEP 1: selezione prodotto ── */}
        {!selectedProduct && (
          <>
            {/* Category tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--b1)', flexShrink: 0, padding: '0 20px' }}>
              {CATEGORY_TABS.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', fontSize: '13px', fontWeight: category === cat.id ? 600 : 400, border: 'none', cursor: 'pointer', background: 'transparent', color: category === cat.id ? 'var(--ac)' : 'var(--t3)', borderBottom: `2px solid ${category === cat.id ? 'var(--ac)' : 'transparent'}`, transition: 'all .15s', whiteSpace: 'nowrap' }}>
                  {CATEGORY_ICONS[cat.id]} {cat.label}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start' }}>
              {products === null ? (
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: 60 }}>
                  <div style={{ width: 24, height: 24, border: '2px solid var(--ac)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                </div>
              ) : filtered.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', fontSize: '13px', color: 'var(--t3)', textAlign: 'center', padding: 40 }}>Nessun prodotto disponibile</p>
              ) : filtered.map(p => {
                const minPrice = Math.min(...p.variants.map(v => v.price)) / 100
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    style={{ display: 'flex', flexDirection: 'column', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', overflow: 'hidden', padding: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(142,201,176,.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.transform = 'none' }}
                  >
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: 130, background: 'var(--s3)', display: 'grid', placeItems: 'center', fontSize: 32 }}>📦</div>
                    )}
                    <div style={{ padding: '10px 12px 12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--tx)', marginBottom: 3 }}>{p.name}</p>
                      <p style={{ fontSize: '10px', color: 'var(--t3)', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.shortDescription}</p>
                      <p style={{ fontSize: '11px', color: 'var(--t3)', margin: 0 }}>da <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--ac)' }}>{fmt(minPrice)}</span></p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── STEP 2: configurazione prodotto ── */}
        {selectedProduct && variant && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

              {/* ── Anteprima inquadratura (drag per riposizionare) ── */}
              {(() => {
                const wRaw = variant.widthCm
                const hRaw = variant.heightCm
                if (!wRaw || !hRaw) {
                  // Nessun formato fisico → mostra immagine prodotto normale
                  return selectedProduct.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedProduct.images[0]} alt={selectedProduct.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--r2)', marginBottom: 20 }} />
                  ) : null
                }
                const canRotate = wRaw !== hRaw
                const w = rotated ? hRaw : wRaw
                const h = rotated ? wRaw : hRaw
                const aspectRatio = h / w  // paddingBottom trick
                // Drag + pinch handler
                const handlePointerStart = (e: React.MouseEvent | React.TouchEvent) => {
                  e.preventDefault()
                  const el = (e.currentTarget as HTMLElement)
                  const rect = el.getBoundingClientRect()
                  const isTouch = 'touches' in e

                  // pinch-to-zoom (2 dita)
                  if (isTouch && e.touches.length === 2) {
                    const t = e.touches
                    let initDist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
                    let initZoom = zoom
                    const onPinchMove = (ev: TouchEvent) => {
                      if (ev.touches.length < 2) return
                      ev.preventDefault()
                      const d = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY)
                      setZoom(Math.max(1, Math.min(4, initZoom * d / initDist)))
                    }
                    const onPinchEnd = () => {
                      window.removeEventListener('touchmove', onPinchMove)
                      window.removeEventListener('touchend', onPinchEnd)
                    }
                    window.addEventListener('touchmove', onPinchMove, { passive: false })
                    window.addEventListener('touchend', onPinchEnd)
                    return
                  }

                  // drag singolo (mouse o 1 dito)
                  const startX = isTouch ? e.touches[0].clientX : (e as React.MouseEvent).clientX
                  const startY = isTouch ? e.touches[0].clientY : (e as React.MouseEvent).clientY
                  const startCropX = cropX
                  const startCropY = cropY
                  const onMove = (ev: MouseEvent | TouchEvent) => {
                    const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX
                    const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY
                    // sensibilità drag inversamente proporzionale allo zoom
                    const dx = ((startX - cx) / rect.width) * 100 / zoom
                    const dy = ((startY - cy) / rect.height) * 100 / zoom
                    setCropX(Math.max(0, Math.min(100, startCropX + dx)))
                    setCropY(Math.max(0, Math.min(100, startCropY + dy)))
                  }
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove)
                    window.removeEventListener('mouseup', onUp)
                    window.removeEventListener('touchmove', onMove)
                    window.removeEventListener('touchend', onUp)
                  }
                  window.addEventListener('mousemove', onMove)
                  window.addEventListener('mouseup', onUp)
                  window.addEventListener('touchmove', onMove, { passive: false })
                  window.addEventListener('touchend', onUp)
                }

                // scroll wheel zoom (desktop)
                const handleWheel = (e: React.WheelEvent) => {
                  e.preventDefault()
                  setZoom(z => Math.max(1, Math.min(4, z - e.deltaY * 0.005)))
                }

                return (
                  <div style={{ marginBottom: 20 }}>
                    {/* Riga header: label + ruota + zoom controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
                      <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', flex: 1 }}>
                        Anteprima {w}×{h} cm — trascina · pizzica
                      </p>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {canRotate && (
                          <button
                            onClick={() => { setRotated(r => !r); setCropX(50); setCropY(50); setZoom(1) }}
                            title="Ruota orientamento"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, padding: '4px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--t2)', cursor: 'pointer' }}
                          >
                            <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.9"/></svg>
                            {rotated ? 'Vert.' : 'Oriz.'}
                          </button>
                        )}
                        {/* Zoom controls */}
                        <button onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))} style={{ width: 28, height: 28, background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, color: 'var(--t2)', fontSize: '16px', cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}>−</button>
                        <span style={{ fontSize: '11px', color: 'var(--t3)', minWidth: 32, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))} style={{ width: 28, height: 28, background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, color: 'var(--t2)', fontSize: '16px', cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}>+</button>
                      </div>
                    </div>
                    <div
                      onWheel={handleWheel}
                      style={{ position: 'relative', width: '100%', paddingBottom: `${aspectRatio * 100}%`, borderRadius: 'var(--r2)', overflow: 'hidden', background: 'var(--s3)', border: '1px solid var(--b1)', cursor: zoom > 1 ? 'move' : 'grab', userSelect: 'none', touchAction: 'none' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt=""
                        draggable={false}
                        onMouseDown={handlePointerStart}
                        onTouchStart={handlePointerStart}
                        style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%',
                          objectFit: 'cover', objectPosition: `${cropX}% ${cropY}%`,
                          transform: `scale(${zoom})`, transformOrigin: `${cropX}% ${cropY}%`,
                          userSelect: 'none', pointerEvents: 'auto',
                        }}
                      />
                      {/* Guida griglia */}
                      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)', backgroundSize: '33.33% 33.33%' }} />
                      {/* Reset button */}
                      {(cropX !== 50 || cropY !== 50 || zoom !== 1) && (
                        <button
                          onClick={e => { e.stopPropagation(); setCropX(50); setCropY(50); setZoom(1) }}
                          style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: '10px', cursor: 'pointer', fontWeight: 600, letterSpacing: '.04em' }}
                        >
                          Centra
                        </button>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Variante */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  {selectedProduct.variants.length > 1 ? 'Formato / Variante' : 'Variante'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {selectedProduct.variants.map(v => (
                    <button key={v.id} onClick={() => setSelectedVariantId(v.id)} style={variantBtnStyle(v.id === selectedVariantId)}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantità */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Quantità</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', fontSize: '18px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>−</button>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--tx)', minWidth: 48, textAlign: 'center' }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', fontSize: '18px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>+</button>
                  <span style={{ fontSize: '12px', color: 'var(--t3)' }}>{fmt(unitPrice)} / pz</span>
                </div>
                {nextTier && (
                  <p style={{ fontSize: '11px', color: 'var(--amber)', marginTop: 8 }}>
                    💡 Da {nextTier.minQty} stampe totali → {fmt(nextTier.price / 100)} / pz
                    {isBatch && nextTier.minQty > effectiveQty ? ` (ora ${effectiveQty})` : ''}
                  </p>
                )}
              </div>

              {/* Scaglioni prezzo */}
              {variant.priceBreaks && variant.priceBreaks.length > 1 && (
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
                  <p style={{ fontSize: '10px', color: 'var(--t3)', marginBottom: 7, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>Scaglioni di prezzo</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px' }}>
                    {[...variant.priceBreaks].sort((a, b) => a.minQty - b.minQty).map((b, i, arr) => {
                      const isActive = effectiveQty >= b.minQty && (i === arr.length - 1 || effectiveQty < arr[i + 1].minQty)
                      return (
                        <span key={b.minQty} style={{ fontSize: '11px', color: isActive ? 'var(--ac)' : 'var(--t3)', fontWeight: isActive ? 700 : 400 }}>
                          {b.minQty}+ → {fmt(b.price / 100)}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── OPZIONI CORNICE ── */}
              {selectedProduct.options?.frames && selectedProduct.options.frames.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>{selectedProduct.id === 'stampe-instax' ? 'Grafica bordo' : 'Colore cornice'}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedProduct.options.frames.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFrameId(f.id)}
                        title={f.label}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: f.color, border: `3px solid ${frameId === f.id ? 'var(--ac)' : f.border}`, cursor: 'pointer', boxShadow: frameId === f.id ? '0 0 0 2px var(--ac)' : 'none', transition: 'all .15s', outline: 'none', flexShrink: 0 }}
                      />
                    ))}
                    {frameId && <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--t2)', marginLeft: 4 }}>{selectedProduct.options.frames.find(f => f.id === frameId)?.label}</span>}
                  </div>
                </div>
              )}

              {/* ── TIPO CARTA ── */}
              {selectedProduct.options?.printTypes && selectedProduct.options.printTypes.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Tipo carta</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {selectedProduct.options.printTypes.map(pt => (
                      <label key={pt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, border: `1px solid ${printTypeId === pt.id ? 'var(--ac)' : 'var(--b1)'}`, background: printTypeId === pt.id ? 'var(--acd)' : 'var(--s2)', cursor: 'pointer', transition: 'all .15s' }}>
                        <input type="radio" name="printType" value={pt.id} checked={printTypeId === pt.id} onChange={() => setPrintTypeId(pt.id)} style={{ marginTop: 2, accentColor: 'var(--ac)' }} />
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)', margin: 0 }}>{pt.label}</p>
                          <p style={{ fontSize: '10px', color: 'var(--t3)', margin: '2px 0 0' }}>
                            {pt.description}{pt.extraPrice > 0 ? ` · +${fmt(pt.extraPrice / 100)}` : ' · Incluso'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PASSEPARTOUT ── */}
              {selectedProduct.options?.passepartout && selectedProduct.options.passepartout.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Passepartout</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {selectedProduct.options.passepartout.map(pp => (
                      <button key={pp.id} onClick={() => setPassepartoutId(pp.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: `1px solid ${passepartoutId === pp.id ? 'var(--ac)' : 'var(--b1)'}`, background: passepartoutId === pp.id ? 'var(--acd)' : 'var(--s2)', cursor: 'pointer', fontSize: '12px', color: passepartoutId === pp.id ? 'var(--ac)' : 'var(--t2)', fontWeight: passepartoutId === pp.id ? 600 : 400, transition: 'all .15s' }}>
                        {pp.color && <span style={{ width: 14, height: 14, borderRadius: '50%', background: pp.color, border: '1px solid var(--b2)', flexShrink: 0 }} />}
                        {pp.label}{pp.extraPrice > 0 ? ` (+${fmt(pp.extraPrice / 100)})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra costi opzioni */}
              {extraCents > 0 && (
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 14px', marginBottom: 6, fontSize: '11px', color: 'var(--t3)' }}>
                  Prezzo base {fmt(baseCents / 100)} + opzioni {fmt(extraCents / 100)} = {fmt(unitCents / 100)} / pz
                </div>
              )}
            </div>

            {/* Footer fisso */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--b1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--t3)', margin: 0 }}>
                  {isBatch ? `Totale (${photos.length} foto × ${qty} pz = ${effectiveQty} stampe)` : 'Totale'}
                </p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '26px', color: 'var(--tx)', margin: 0 }}>{fmt(grandTotal)}</p>
              </div>
              <button onClick={handleAdd} style={{ background: 'var(--ac)', color: '#111', border: 'none', borderRadius: 'var(--r2)', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {ICON_CART} {isBatch ? `Aggiungi ${photos.length} foto` : 'Aggiungi al carrello'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
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
  const [step, setStep]             = useState<'cart' | 'checkout' | 'success'>('cart')
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [notesValue, setNotesValue] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'studio'>('studio')
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon]         = useState<{ label: string; discount: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError]     = useState('')
  const [sending, setSending]       = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [waLink, setWaLink]         = useState('')

  const items = Array.from(cart.values())

  // Aggrega qty totale per formato — permette di applicare gli scaglioni
  // sul totale stampe dello stesso prodotto+variante nel carrello
  const qtyByVariant = new Map<string, number>()
  for (const item of items) {
    const key = `${item.productId}::${item.variantId}`
    qtyByVariant.set(key, (qtyByVariant.get(key) ?? 0) + item.qty)
  }
  const effectiveUnitPrice = (item: CartItem) => {
    const totalQty = qtyByVariant.get(`${item.productId}::${item.variantId}`) ?? item.qty
    return getPriceForBreaks(item.priceBreaks, totalQty, item.unitPrice)
  }

  const cartTotal  = items.reduce((s, i) => s + effectiveUnitPrice(i) * i.qty, 0)
  const discount   = coupon ? coupon.discount / 100 : 0
  const finalTotal = Math.max(0, cartTotal - discount)

  const inputSt: React.CSSProperties = { width: '100%', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 8, padding: '10px 12px', color: 'var(--tx)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setCoupon(null)
    try {
      const res = await fetch('/api/shop/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          total: Math.round(cartTotal * 100),
          items: items.map(i => ({ productId: i.productId, price: Math.round(i.unitPrice * 100), quantity: i.qty })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error || 'Codice non valido'); return }
      setCoupon({ label: data.label, discount: data.discount })
    } finally {
      setCouponLoading(false)
    }
  }

  const submit = async () => {
    if (!items.length) return
    setSending(true)
    setSubmitError('')
    try {
      setWaLink(buildWaLink(items, finalTotal, name.trim(), galleryId))
      const res = await fetch('/api/public/orders', {
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
            qty: i.qty, unit_price: effectiveUnitPrice(i), total: effectiveUnitPrice(i) * i.qty,
            frame_label: i.frameLabel ?? null,
            passepartout_label: i.passepartoutLabel ?? null,
            print_type_label: i.printTypeLabel ?? null,
            crop_x: i.cropX ?? null,
            crop_y: i.cropY ?? null,
          })),
          total: finalTotal,
          payment_method: paymentMethod,
          coupon_code: coupon ? couponCode.trim().toUpperCase() : null,
          discount: coupon?.discount ?? 0,
          notes: [
            phone.trim() ? `Tel: ${phone.trim()}` : '',
            notesValue.trim(),
          ].filter(Boolean).join('\n') || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSubmitError(err.error || 'Errore durante l\'invio. Riprova.')
        return
      }
      setStep('success')
      onClear()
      onOrderPlaced()
    } catch {
      setSubmitError('Errore di connessione. Riprova.')
    } finally {
      setSending(false)
    }
  }

  const ICON_CART = <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
  const ICON_X    = <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>

  const sectionLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--t3)', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 10, display: 'block' }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 450, background: 'rgba(0,0,0,.6)' }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 460, width: '100%', maxWidth: 460, background: 'var(--s1)', borderLeft: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight .25s ease' }}>

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
              {step === 'cart' ? 'Il tuo carrello' : step === 'checkout' ? 'Completa l\'ordine' : 'Ordine confermato'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6 }}>{ICON_X}</button>
        </div>

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(142,201,176,.15)', border: '2px solid rgba(142,201,176,.3)', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--tx)', marginBottom: 8 }}>Ordine inviato!</p>
              <p style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.6 }}>
                {paymentMethod === 'online'
                  ? 'Il fotografo ha ricevuto il tuo ordine. Ti contatterà per i dettagli del pagamento.'
                  : 'Il fotografo ha ricevuto il tuo ordine. Potrai pagare al momento del ritiro in studio.'
                }
              </p>
            </div>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', border: 'none', borderRadius: 'var(--r2)', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', width: '100%', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Conferma su WhatsApp
            </a>
            <button onClick={onClose} style={{ background: 'transparent', color: 'var(--t3)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '9px 24px', fontSize: '13px', cursor: 'pointer', width: '100%' }}>
              Chiudi
            </button>
          </div>
        )}

        {/* ── EMPTY ── */}
        {step === 'cart' && items.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--t3)' }}>
            <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" style={{ opacity: .4 }}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <p style={{ fontSize: '13px' }}>Il carrello è vuoto</p>
            <p style={{ fontSize: '11px' }}>Clicca 🛒 su una foto per aggiungere prodotti</p>
          </div>
        )}

        {/* ── CART ── */}
        {step === 'cart' && items.length > 0 && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(item => {
                const curUnitPrice = effectiveUnitPrice(item)
                return (
                  <div key={item.id} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.photoUrl} alt="" style={{ width: 52, height: 52, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', color: 'var(--tx)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                      <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 1 }}>
                        {item.formatLabel}
                        {item.frameLabel ? ` · ${item.frameLabel}` : ''}
                        {item.passepartoutLabel ? ` · ${item.passepartoutLabel}` : ''}
                        {item.printTypeLabel ? ` · ${item.printTypeLabel}` : ''}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: .7 }}>{item.filename}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <button onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))} style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--s3)', border: 'none', color: 'var(--tx)', fontSize: '15px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>−</button>
                        <span style={{ fontSize: '13px', color: 'var(--tx)', minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--s3)', border: 'none', color: 'var(--tx)', fontSize: '15px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>+</button>
                        <span style={{ fontSize: '10px', color: 'var(--t3)' }}>{fmt(curUnitPrice)} / pz</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--tx)' }}>{fmt(curUnitPrice * item.qty)}</span>
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
                <span style={{ fontSize: '13px', color: 'var(--t2)' }}>Totale</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--tx)' }}>{fmt(cartTotal)}</span>
              </div>
              <button onClick={() => setStep('checkout')} style={{ width: '100%', background: 'var(--ac)', color: '#111', border: 'none', borderRadius: 'var(--r2)', padding: '12px 0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                Procedi all&apos;ordine →
              </button>
            </div>
          </>
        )}

        {/* ── CHECKOUT ── */}
        {step === 'checkout' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Riepilogo */}
              <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: '14px 16px' }}>
                <span style={sectionLabel}>Riepilogo ordine</span>
                {items.map(item => {
                  const u = effectiveUnitPrice(item)
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.photoUrl} alt="" style={{ width: 38, height: 38, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName} · {item.formatLabel}</p>
                        <p style={{ fontSize: '11px', color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename} × {item.qty}</p>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--tx)', flexShrink: 0 }}>{fmt(u * item.qty)}</span>
                    </div>
                  )
                })}
                <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--t3)' }}>
                    <span>Ritiro in studio</span><span style={{ color: 'var(--ac)', fontWeight: 600 }}>Gratis</span>
                  </div>
                  {coupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#4ade80', fontWeight: 600 }}>{coupon.label}</span>
                      <span style={{ color: '#4ade80', fontWeight: 600 }}>−{fmt(coupon.discount / 100)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--b1)', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--tx)' }}>Totale</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--tx)' }}>{fmt(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div>
                <span style={sectionLabel}>Codice sconto</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); setCoupon(null) }}
                    placeholder="Es. FOTO10"
                    style={{ ...inputSt, flex: 1, textTransform: 'uppercase', letterSpacing: '.05em' }}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 8, padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--ac)', cursor: couponLoading ? 'wait' : 'pointer', flexShrink: 0 }}
                  >
                    {couponLoading ? '…' : 'Applica'}
                  </button>
                </div>
                {couponError && <p style={{ fontSize: '11px', color: 'var(--red)', marginTop: 5 }}>{couponError}</p>}
                {coupon && <p style={{ fontSize: '11px', color: '#4ade80', marginTop: 5 }}>✓ {coupon.label}</p>}
              </div>

              {/* Ritiro */}
              <div>
                <span style={sectionLabel}>Ritiro</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--acd)', border: '1px solid rgba(142,201,176,.25)', borderRadius: 'var(--r2)' }}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--tx)', margin: 0 }}>Ritiro in studio</p>
                    <p style={{ fontSize: '11px', color: 'var(--t3)', margin: '2px 0 0' }}>Riceverai una mail di conferma. Nessuna spedizione.</p>
                  </div>
                </div>
              </div>

              {/* Pagamento */}
              <div>
                <span style={sectionLabel}>Metodo di pagamento</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { value: 'online', label: 'Paga ora online', sub: 'Carta di credito / debito', icon: '💳' },
                    { value: 'studio', label: 'Paga al ritiro', sub: 'Contanti o POS in studio', icon: '🏠' },
                  ] as const).map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--r2)', cursor: 'pointer', border: paymentMethod === opt.value ? '2px solid var(--ac)' : '1px solid var(--b1)', background: paymentMethod === opt.value ? 'var(--acd)' : 'var(--s2)', transition: 'all .15s' }}>
                      <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} style={{ accentColor: 'var(--ac)' }} />
                      <span style={{ fontSize: 18 }}>{opt.icon}</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--tx)', margin: 0 }}>{opt.label}</p>
                        <p style={{ fontSize: '11px', color: 'var(--t3)', margin: '2px 0 0' }}>{opt.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dati cliente */}
              <div>
                <span style={sectionLabel}>I tuoi dati</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome e cognome" style={inputSt} />
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (per ricevere conferma)" type="email" style={inputSt} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefono" type="tel" style={inputSt} />
                  <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} placeholder="Note aggiuntive (opzionale)…" rows={3} style={{ ...inputSt, resize: 'none', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--b1)', flexShrink: 0 }}>
              {submitError && (
                <p style={{ fontSize: '12px', color: 'var(--red)', background: 'rgba(217,112,112,.1)', border: '1px solid rgba(217,112,112,.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                  {submitError}
                </p>
              )}
              <button onClick={submit} disabled={sending} style={{ width: '100%', background: sending ? 'var(--s3)' : 'var(--ac)', color: sending ? 'var(--t3)' : '#111', border: 'none', borderRadius: 'var(--r2)', padding: '13px 0', fontSize: '14px', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {sending
                  ? <><div style={{ width: 14, height: 14, border: '2px solid var(--t3)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> Invio…</>
                  : paymentMethod === 'online'
                    ? <><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Procedi al pagamento →</>
                    : <><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Conferma ordine →</>
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
  selectMode?: boolean
  isSelected?: boolean
  onSelect?: (photoId: string) => void
}

function PhotoItem({ photo, index, galleryId, isFavorited, commentCount, inCart, showWatermark, showDownloadSingle, onOpenLightbox, onToggleFavorite, onOpenComment, onOpenOrder, gridMode, selectMode, isSelected, onSelect }: PhotoItemProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    downloadPhoto(photo)
  }

  const handleClick = () => {
    if (selectMode) { onSelect?.(photo.id) }
    else onOpenLightbox(index)
  }

  return (
    <div
      style={{ borderRadius: '3px', overflow: 'hidden', background: '#e8e8e6', position: 'relative', breakInside: 'avoid', marginBottom: gridMode ? 0 : 6, cursor: 'pointer', ...(gridMode ? { aspectRatio: '3/2' } : {}), outline: isSelected ? '3px solid #8ec9b0' : 'none', outlineOffset: -3 }}
      onClick={handleClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.filename} loading="lazy" style={{ width: '100%', height: gridMode ? '100%' : 'auto', objectFit: gridMode ? 'cover' : undefined, display: 'block', transition: 'opacity .15s', opacity: selectMode && !isSelected ? 0.7 : 1 }} />

      {/* Watermark overlay */}
      {showWatermark && !selectMode && (
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

      {/* Select mode overlay */}
      {selectMode && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 8, background: isSelected ? 'rgba(142,201,176,.2)' : 'transparent' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2.5px solid ${isSelected ? '#8ec9b0' : 'rgba(255,255,255,.8)'}`, background: isSelected ? '#8ec9b0' : 'rgba(0,0,0,.25)', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'all .15s' }}>
            {isSelected && <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="#111" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
        </div>
      )}

      {/* Hover overlay — gradiente + icone bianche — hidden in selectMode */}
      {!selectMode && (
        <div className="photo-actions-overlay" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.05) 45%, transparent 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px 12px',
        }}>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', alignItems: 'center' }}>

            {/* ♡ Preferita */}
            <button onClick={e => { e.stopPropagation(); onToggleFavorite(photo.id) }} title={isFavorited ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center', transition: 'transform .15s' }}>
              <svg viewBox="0 0 24 24" width={20} height={20} fill={isFavorited ? '#fff' : 'none'} stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>

            {/* ↓ Download singolo */}
            {showDownloadSingle && (
              <button onClick={handleDownload} title="Scarica foto" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center', transition: 'transform .15s' }}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
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
      )}
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
  const [cart, setCart]               = useState<Map<string, CartItem>>(new Map())
  const [orderPhotos, setOrderPhotos] = useState<Photo[] | null>(null)
  const [cartOpen, setCartOpen]       = useState(false)

  // select mode
  const [selectMode, setSelectMode]         = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())

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

  const cartCount  = Array.from(cart.values()).reduce((s, i) => s + i.qty, 0)
  const cartPhotos = new Set(Array.from(cart.values()).map(i => i.photoId))

  // ── select mode ───────────────────────────────────────────────────────────
  const toggleSelectPhoto = useCallback((photoId: string) => {
    setSelectMode(true)  // attiva select mode se non già attivo
    setSelectedPhotos(prev => { const n = new Set(prev); n.has(photoId) ? n.delete(photoId) : n.add(photoId); return n })
  }, [])

  const exitSelectMode = useCallback(() => { setSelectMode(false); setSelectedPhotos(new Set()) }, [])

  const openOrderForSelected = useCallback(() => {
    if (!gallery || selectedPhotos.size === 0) return
    const photosToOrder = Array.from(selectedPhotos)
      .map(id => gallery.photos.find(p => p.id === id))
      .filter(Boolean) as Photo[]
    setOrderPhotos(photosToOrder)
  }, [selectedPhotos, gallery])

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

  const heroTextColor  = gallery.settings?.text_color || theme.heroTextColor
  const textPos        = TEXT_POSITION_STYLES[gallery.settings?.text_position ?? 'center-center'] ?? TEXT_POSITION_STYLES['center-center']
  const photoObjPos    = PHOTO_POSITION_CSS[gallery.settings?.photo_position ?? 'center-center'] ?? 'center center'
  const heroLayout      = gallery.settings?.hero_layout ?? 'full'
  const splitTitleColor = gallery.settings?.text_color || theme.navText
  const heroBgSolid     = gallery.settings?.hero_bg === 'solid'
  const heroBgColor     = gallery.settings?.hero_bg_color || coverBg
  const heroFit         = (gallery.settings?.hero_fit ?? 'cover') as 'cover' | 'contain'

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
        {heroLayout === 'split' ? (

          /* ── SPLIT: foto sx, info dx (mobile: foto sopra, info sotto) ─── */
          <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '85vh' }}>

            {/* Lato foto */}
            <div style={{ flex: '1 1 300px', position: 'relative', overflow: 'hidden', minHeight: '55vh', background: heroFit === 'contain' ? (coverBg ?? '#111') : undefined }}>
              {(() => {
                if (heroBgSolid) return <div style={{ width: '100%', height: '100%', background: heroBgColor }} />
                const heroUrl = gallery.cover_url || (photos.length > 0 ? photos[0].url : null)
                return heroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroUrl} alt={gallery.name} style={{ width: '100%', height: '100%', objectFit: heroFit, objectPosition: heroFit === 'cover' ? photoObjPos : 'center', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${coverBg} 0%, color-mix(in srgb, ${coverBg} 60%, #0a0a0a) 100%)` }} />
                )
              })()}
              {/* Navbar logo sul lato foto */}
              <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'clamp(16px, 3vw, 24px)', display: 'flex', alignItems: 'center', zIndex: 10 }}>
                <div style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '5px 10px', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt={photographer} style={{ height: 26, width: 'auto', display: 'block' }} />
                </div>
              </nav>
            </div>

            {/* Lato info */}
            <div style={{ flex: '1 1 300px', background: theme.navBg, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(40px, 6vw, 88px)' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: theme.navSub, margin: '0 0 32px' }}>{photographer}</p>
              {showTitle && (
                <h1 style={{ fontFamily: fontDef.family, fontWeight: fontDef.weight as React.CSSProperties['fontWeight'], fontSize: 'clamp(28px, 4vw, 64px)', color: splitTitleColor, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '0 0 20px' }}>{gallery.name}</h1>
              )}
              <div style={{ width: 40, height: 2, background: theme.accent, margin: '0 0 20px' }} />
              {(showSubtitle || showDate) && (gallery.subtitle || gallery.date) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 40 }}>
                  {showSubtitle && gallery.subtitle && <span style={{ fontSize: '15px', color: `${theme.navText}99`, fontStyle: 'italic' }}>{gallery.subtitle}</span>}
                  {showDate && gallery.date && <span style={{ fontSize: '13px', color: theme.navSub, letterSpacing: '.04em' }}>{formatDate(gallery.date)}</span>}
                </div>
              )}
              {!(showSubtitle && gallery.subtitle) && !(showDate && gallery.date) && <div style={{ marginBottom: 40 }} />}
              <a href="#photos" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: theme.navText, textDecoration: 'none', borderBottom: `1px solid ${theme.navText}44`, paddingBottom: 4, alignSelf: 'flex-start', transition: 'opacity .15s' }}>
                View Gallery
              </a>
            </div>
          </div>

        ) : (

          /* ── FULL BLEED ──────────────────────────────────────────────── */
          <div style={{ position: 'relative', height: '75vh', minHeight: 420, overflow: 'hidden' }}>

            {/* Cover image / solid bg */}
            {(() => {
              if (heroBgSolid) return <div style={{ width: '100%', height: '100%', background: heroBgColor }} />
              const heroUrl = gallery.cover_url || (photos.length > 0 ? photos[0].url : null)
              return heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroUrl} alt={gallery.name} style={{ width: '100%', height: '100%', objectFit: heroFit, objectPosition: heroFit === 'cover' ? photoObjPos : 'center', display: 'block' }} />
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

            {/* Hero content */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: textPos.ai, justifyContent: textPos.jc, padding: '80px clamp(20px, 6vw, 80px) 32px', textAlign: textPos.ta }}>
              {showTitle && (
                <h1 style={{ fontFamily: fontDef.family, fontWeight: fontDef.weight as React.CSSProperties['fontWeight'], fontSize: 'clamp(32px, 7vw, 96px)', color: heroTextColor, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8, textTransform: 'uppercase' }}>{gallery.name}</h1>
              )}
              {(showSubtitle || showDate) && (gallery.subtitle || gallery.date) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: textPos.ai, marginBottom: 36 }}>
                  {showSubtitle && gallery.subtitle && <span style={{ fontSize: '15px', color: `${heroTextColor}88`, fontStyle: 'italic' }}>{gallery.subtitle}</span>}
                  {showDate && gallery.date && <span style={{ fontSize: '13px', color: `${heroTextColor}66`, letterSpacing: '.04em' }}>{formatDate(gallery.date)}</span>}
                </div>
              )}
              {!(showSubtitle && gallery.subtitle) && !(showDate && gallery.date) && <div style={{ marginBottom: 36 }} />}
              <a href="#photos" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: `${heroTextColor}e0`, textDecoration: 'none', borderBottom: `1px solid ${heroTextColor}77`, paddingBottom: 4, transition: 'color .15s' }}>
                View Gallery
              </a>
            </div>
          </div>

        )}

        {/* ── STICKY NAV BAR ─────────────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: theme.navBg, borderBottom: `1px solid ${theme.navBorder}`, padding: '0 clamp(16px, 4vw, 40px)', display: 'flex', alignItems: 'center', gap: 16, height: 56, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          {/* Sinistra: nome galleria + fotografo */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1 }}>
            <p style={{ fontFamily: fontDef.family, fontWeight: 700, fontSize: '13px', color: theme.navText, letterSpacing: '.01em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gallery.name}</p>
            <p style={{ fontSize: '10px', color: theme.navSub, letterSpacing: '.05em', textTransform: 'uppercase', lineHeight: 1.2, marginTop: 2 }}>{photographer}</p>
          </div>

          {/* Destra: azioni con testo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

            {/* Favorites + badge */}
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: 'none', cursor: 'default', color: favorites.size > 0 ? theme.navText : theme.navSub, fontSize: '12px', fontWeight: 500, letterSpacing: '.01em' }}>
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill={favorites.size > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {favorites.size > 0 && (
                  <span style={{ position: 'absolute', top: -5, right: -7, background: theme.navText, color: theme.navBg, borderRadius: '50%', fontSize: '9px', fontWeight: 800, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, pointerEvents: 'none' }}>{favorites.size}</span>
                )}
              </span>
              <span className="nav-label">Preferiti{favorites.size > 0 ? ` (${favorites.size})` : ''}</span>
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
              {cartCount > 0 ? (
                <>
                  {/* Icona carrello + badge sempre visibile */}
                  <span style={{ position: 'relative', display: 'inline-flex' }}>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <span style={{ position: 'absolute', top: -6, right: -8, background: theme.navText, color: theme.navBg, borderRadius: '50%', fontSize: '9px', fontWeight: 800, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, pointerEvents: 'none' }}>{cartCount}</span>
                  </span>
                  <span className="nav-label">Carrello ({cartCount})</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  <span className="nav-label">Share</span>
                </>
              )}
            </button>

            {/* Slideshow */}
            <button onClick={() => setSlideshowOpen(true)} disabled={photos.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: 'none', cursor: photos.length === 0 ? 'default' : 'pointer', color: theme.navSub, fontSize: '12px', fontWeight: 500, letterSpacing: '.01em', transition: 'color .15s' }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span className="nav-label">Slideshow</span>
            </button>

            {/* Seleziona / Esci selezione */}
            {photos.length > 0 && (
              <button
                onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: selectMode ? theme.navText : 'none', border: 'none', cursor: 'pointer', color: selectMode ? theme.navBg : theme.navSub, fontSize: '12px', fontWeight: selectMode ? 700 : 500, letterSpacing: '.01em', borderRadius: 6, transition: 'all .15s' }}
              >
                {selectMode
                  ? <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  : <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="3" width="8" height="8" rx="1.5"/><polyline points="17 9 19 11 23 7"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><line x1="17" y1="17" x2="23" y2="17"/><line x1="20" y1="14" x2="20" y2="20"/></svg>
                }
                <span className="nav-label">{selectMode ? `Chiudi (${selectedPhotos.size})` : 'Seleziona'}</span>
              </button>
            )}

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, calc(50% - 3px)), 1fr))', gap: 6 }}>
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
                  onOpenOrder={p => setOrderPhotos([p])}
                  gridMode
                  selectMode={selectMode}
                  isSelected={selectedPhotos.has(photo.id)}
                  onSelect={toggleSelectPhoto}
                />
              ))}
            </div>
          ) : (
            <div className="gallery-masonry" style={{ columns: 4, columnGap: 6 }}>
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
                  onOpenOrder={p => setOrderPhotos([p])}
                  selectMode={selectMode}
                  isSelected={selectedPhotos.has(photo.id)}
                  onSelect={toggleSelectPhoto}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── SELECTION ACTION BAR ───────────────────────────────────────── */}
        {selectMode && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(20,20,20,.97)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(255,255,255,.1)', padding: '12px clamp(16px, 4vw, 40px)', display: 'flex', alignItems: 'center', gap: 12, animation: 'slideUp .2s ease' }}>
            {/* Thumbnails preview */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {Array.from(selectedPhotos).slice(0, 4).map(id => {
                const p = gallery.photos.find(ph => ph.id === id)
                if (!p) return null
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={id} src={p.url} alt="" style={{ width: 34, height: 34, borderRadius: 5, objectFit: 'cover', border: '2px solid #8ec9b0' }} />
                )
              })}
              {selectedPhotos.size > 4 && <div style={{ width: 34, height: 34, borderRadius: 5, background: 'rgba(255,255,255,.1)', display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 700, color: '#8ec9b0', border: '2px solid rgba(142,201,176,.3)' }}>+{selectedPhotos.size - 4}</div>}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: '#fff', margin: 0 }}>
                {selectedPhotos.size === 0 ? 'Tocca le foto per selezionarle' : `${selectedPhotos.size} ${selectedPhotos.size === 1 ? 'foto selezionata' : 'foto selezionate'}`}
              </p>
              {selectedPhotos.size > 0 && (
                <button onClick={() => setSelectedPhotos(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: '10px', padding: 0, letterSpacing: '.03em' }}>
                  Deseleziona tutto
                </button>
              )}
            </div>

            <button
              onClick={openOrderForSelected}
              disabled={selectedPhotos.size === 0}
              style={{ background: selectedPhotos.size > 0 ? '#8ec9b0' : 'rgba(255,255,255,.1)', color: selectedPhotos.size > 0 ? '#111' : 'rgba(255,255,255,.3)', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: selectedPhotos.size > 0 ? 'pointer' : 'default', transition: 'all .2s', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Ordina {selectedPhotos.size > 0 ? `(${selectedPhotos.size})` : ''}
            </button>
          </div>
        )}

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
            style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '88vh', boxShadow: '0 24px 80px rgba(0,0,0,.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 20, color: '#111' }}>Istruzioni</h2>
              <button
                onClick={() => setShowIstruzioni(false)}
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,.1)', background: '#f5f5f5', cursor: 'pointer', fontSize: 16, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            </div>
            {/* Body */}
            <div style={{ padding: '20px 24px 28px', fontSize: 14, color: '#333', lineHeight: 1.7, overflowY: 'auto', flex: 1 }}>
              <p style={{ margin: '0 0 12px' }}>Ciao</p>
              <p style={{ margin: '0 0 12px' }}>in questo link trovi tutte le foto, a volte divise in varie cartelle.<br />Il link resterà attivo per <strong>30 giorni</strong>.</p>
              <p style={{ margin: '0 0 12px' }}>Puoi scaricarle singolarmente cliccando sulla freccia in basso sotto la foto, oppure tutte insieme cliccando sul relativo pulsante alla fine della galleria.</p>
              <p style={{ margin: '0 0 12px' }}>Puoi condividere il link con chi desideri: ognuno potrà scaricare solo le foto che preferisce.</p>
              <p style={{ margin: '0 0 12px' }}>Se deciderete di fare l&apos;album, vi basterà scegliere la quantità di foto concordata con il fotografo (c&apos;è anche un contatore all&apos;inizio della galleria), mettendo il &quot;like&quot; a quelle che vi emozionano di più (clic sul cuore).</p>
              <p style={{ margin: '0 0 12px' }}>In questo modo l&apos;album racconterà la vostra giornata attraverso gli scatti che sentite più vicini al cuore.</p>
              <p style={{ margin: '0 0 12px' }}>Se invece dovete modificare un fotolibro, utilizzate il tasto commenti sotto le foto e suggerite al fotografo le modifiche da effettuare a quella pagina.</p>
              <p style={{ margin: '0 0 12px' }}>Puoi anche ordinare stampe direttamente dalla galleria. Ogni foto ha un&apos;icona 🛒 (carrello): cliccala per scegliere il formato di stampa dal nostro shop — stampa classica, foto incorniciata, stampa su tela, stampa su forex e altro ancora.</p>
              <p style={{ margin: '0 0 16px' }}>Se vuoi ordinare più foto insieme, usa il pulsante <strong>Sel.</strong> in alto a destra per entrare in modalità selezione: spunta tutte le foto che ti interessano, poi tocca il carrello che compare in basso per aggiungere tutto in un colpo solo e scegliere il formato per ciascuna. Una volta completato il carrello, procedi con l&apos;ordine: riceverai una conferma direttamente da me.</p>
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
          onOpenOrder={p => setOrderPhotos([p])}
          showOrder={true}
          selectedPhotos={selectedPhotos}
          onToggleSelect={toggleSelectPhoto}
        />
      )}

      {/* Comment modal */}
      {commentPhoto && <CommentModal photo={commentPhoto} galleryId={gallery.id} onClose={() => setCommentPhoto(null)} onSaved={handleCommentSaved} />}

      {/* Order modal */}
      {orderPhotos && <OrderModal photos={orderPhotos} onClose={() => { setOrderPhotos(null); if (selectMode) exitSelectMode() }} onAdd={addToCart} />}

      {/* Cart drawer */}
      {cartOpen && <CartDrawer cart={cart} galleryId={gallery.id} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onUpdateQty={updateCartQty} onClear={clearCart} onOrderPlaced={() => fetchPastOrders(gallery.id)} />}

      {/* Orders history drawer */}
      {ordersOpen && <OrderHistoryDrawer orders={pastOrders} onClose={() => setOrdersOpen(false)} />}
      {slideshowOpen && photos.length > 0 && <SlideshowModal photos={photos} onClose={() => setSlideshowOpen(false)} />}

    </>
  )
}

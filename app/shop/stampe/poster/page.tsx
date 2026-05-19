'use client'

// app/shop/stampe/poster/page.tsx
// Configuratore Poster — upload foto, centratura, formato, finitura

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Upload, X, ZoomIn } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

// ─── Dati ────────────────────────────────────────────────────────────────────

interface Variant {
  id: string
  label: string
  wCm: number
  hCm: number
  price: number
}

const VARIANTS: Variant[] = [
  { id: 'pos-20x30', label: '20×30 cm', wCm: 20, hCm: 30, price:  600 },
  { id: 'pos-24x30', label: '24×30 cm', wCm: 24, hCm: 30, price:  700 },
  { id: 'pos-30x30', label: '30×30 cm', wCm: 30, hCm: 30, price:  800 },
  { id: 'pos-30x40', label: '30×40 cm', wCm: 30, hCm: 40, price: 1000 },
  { id: 'pos-30x45', label: '30×45 cm', wCm: 30, hCm: 45, price: 1200 },
  { id: 'pos-36x42', label: '36×42 cm', wCm: 36, hCm: 42, price: 1200 },
  { id: 'pos-40x40', label: '40×40 cm', wCm: 40, hCm: 40, price: 1600 },
  { id: 'pos-35x50', label: '35×50 cm', wCm: 35, hCm: 50, price: 1600 },
  { id: 'pos-40x50', label: '40×50 cm', wCm: 40, hCm: 50, price: 1700 },
  { id: 'pos-40x60', label: '40×60 cm', wCm: 40, hCm: 60, price: 1900 },
  { id: 'pos-50x50', label: '50×50 cm', wCm: 50, hCm: 50, price: 2000 },
  { id: 'pos-50x60', label: '50×60 cm', wCm: 50, hCm: 60, price: 2300 },
  { id: 'pos-50x70', label: '50×70 cm', wCm: 50, hCm: 70, price: 2500 },
]

// Stampiamo esclusivamente su carta fotografica satinata
const FINISH_LABEL = 'Carta fotografica satinata'

// ─── Tipi ────────────────────────────────────────────────────────────────────

interface PhotoItem {
  id: string
  url: string
  name: string
  natW: number; natH: number
  orientation: 'portrait' | 'landscape' | 'square'
  zoom: number
  offsetX: number; offsetY: number
  copies: number
  fitMode: 'cover' | 'contain'
  variantId: string
  slotOrientation: 'portrait' | 'landscape'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) }
function formatPrice(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
function getCoverBounds(natW: number, natH: number, cW: number, cH: number, zoom: number) {
  const s = Math.max(cW / natW, cH / natH)
  return { maxX: Math.max(0, (natW * s * zoom - cW) / 2), maxY: Math.max(0, (natH * s * zoom - cH) / 2) }
}
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

function getSlotDims(variant: Variant, maxPx: number, slotOrientation?: 'portrait' | 'landscape') {
  let wCm = variant.wCm, hCm = variant.hCm
  if (slotOrientation === 'landscape' && wCm < hCm) { const t = wCm; wCm = hCm; hCm = t }
  if (slotOrientation === 'portrait'  && wCm > hCm) { const t = wCm; wCm = hCm; hCm = t }
  const w = wCm >= hCm ? maxPx : Math.round(maxPx * wCm / hCm)
  const h = hCm >= wCm ? maxPx : Math.round(maxPx * hCm / wCm)
  return { w, h }
}

// ─── PhotoSlot ───────────────────────────────────────────────────────────────

function PhotoSlot({
  photo, slotW, slotH, interactive = false, onOffsetChange,
}: {
  photo: PhotoItem; slotW: number; slotH: number
  interactive?: boolean; onOffsetChange?: (x: number, y: number) => void
}) {
  const [offset, setOffset] = useState({ x: photo.offsetX, y: photo.offsetY })
  const [isDragging, setIsDragging] = useState(false)
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(null)
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const stateRef = useRef({ offset: { x: 0, y: 0 }, zoom: photo.zoom, natW: 0, natH: 0 })

  useEffect(() => {
    stateRef.current = { offset, zoom: photo.zoom, natW: natSize?.w ?? 0, natH: natSize?.h ?? 0 }
  }, [offset, photo.zoom, natSize])

  useEffect(() => {
    if (!isDragging) setOffset({ x: photo.offsetX, y: photo.offsetY })
  }, [photo.offsetX, photo.offsetY, isDragging])

  useEffect(() => {
    if (!natSize || photo.fitMode === 'contain') return
    const { maxX, maxY } = getCoverBounds(natSize.w, natSize.h, slotW, slotH, photo.zoom)
    setOffset(prev => ({ x: clamp(prev.x, -maxX, maxX), y: clamp(prev.y, -maxY, maxY) }))
  }, [photo.zoom, slotW, slotH, natSize, photo.fitMode])

  useEffect(() => {
    if (!interactive || photo.fitMode === 'contain') return
    const onMove = (cx: number, cy: number) => {
      if (!dragRef.current) return
      const { natW, natH, zoom: cz } = stateRef.current
      if (!natW || !natH) return
      const { maxX, maxY } = getCoverBounds(natW, natH, slotW, slotH, cz)
      const nx = clamp(dragRef.current.ox + cx - dragRef.current.sx, -maxX, maxX)
      const ny = clamp(dragRef.current.oy + cy - dragRef.current.sy, -maxY, maxY)
      setOffset({ x: nx, y: ny })
      onOffsetChange?.(nx, ny)
    }
    const onEnd = () => { dragRef.current = null; setIsDragging(false) }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', mm)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', tm, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', tm)
      window.removeEventListener('touchend', onEnd)
    }
  }, [interactive, photo.fitMode, slotW, slotH, onOffsetChange])

  const zoom = photo.zoom
  const fitMode = photo.fitMode
  const coverScale = natSize ? Math.max(slotW / natSize.w, slotH / natSize.h) : 1
  const imgW = natSize ? natSize.w * coverScale * zoom : slotW
  const imgH = natSize ? natSize.h * coverScale * zoom : slotH
  const posX = (slotW - imgW) / 2 + offset.x
  const posY = (slotH - imgH) / 2 + offset.y

  const canDrag = interactive && fitMode !== 'contain' && natSize != null && (() => {
    const { maxX, maxY } = getCoverBounds(natSize.w, natSize.h, slotW, slotH, zoom)
    return maxX > 0.5 || maxY > 0.5
  })()

  return (
    <div
      style={{
        width: slotW, height: slotH, overflow: 'hidden', flexShrink: 0,
        backgroundImage: `url(${photo.url})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: fitMode === 'contain' ? 'contain' : (natSize ? `${imgW}px ${imgH}px` : 'cover'),
        backgroundPosition: fitMode === 'contain' ? 'center' : (natSize ? `${posX}px ${posY}px` : 'center'),
        backgroundColor: '#e8e8e8',
        cursor: !canDrag ? 'default' : isDragging ? 'grabbing' : 'grab',
        userSelect: 'none', touchAction: canDrag ? 'none' : 'auto',
      }}
      onMouseDown={e => {
        if (!canDrag) return
        e.preventDefault()
        dragRef.current = { sx: e.clientX, sy: e.clientY, ox: stateRef.current.offset.x, oy: stateRef.current.offset.y }
        setIsDragging(true)
      }}
      onTouchStart={e => {
        if (!canDrag) return
        dragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, ox: stateRef.current.offset.x, oy: stateRef.current.offset.y }
        setIsDragging(true)
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="" style={{ display: 'none' }}
        onLoad={e => setNatSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      />
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function PosterPage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step,    setStep]    = useState<1 | 2 | 3>(1)
  const [variant, setVariant] = useState<Variant>(VARIANTS[0])
  const [photos,  setPhotos]  = useState<PhotoItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [added, setAdded] = useState(false)

  const activePhoto = photos.find(p => p.id === activeId) ?? null
  const totalPrints = photos.reduce((s, p) => s + p.copies, 0)
  const totalPrice  = photos.reduce((s, p) => {
    const pv = VARIANTS.find(v => v.id === p.variantId) ?? VARIANTS[0]
    return s + p.copies * pv.price
  }, 0)

  const PREVIEW_BIG = 260
  const THUMB_MAX   = 120

  useEffect(() => { return () => photos.forEach(p => URL.revokeObjectURL(p.url)) }, []) // eslint-disable-line

  const loadFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(file => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const nW = img.naturalWidth, nH = img.naturalHeight
        const orientation: PhotoItem['orientation'] = nW > nH ? 'landscape' : nW < nH ? 'portrait' : 'square'
        const p: PhotoItem = {
          id: uid(), url, name: file.name,
          natW: nW, natH: nH, orientation,
          zoom: 1, offsetX: 0, offsetY: 0, copies: 1, fitMode: 'cover',
          variantId: variant.id,
          slotOrientation: nW >= nH ? 'landscape' : 'portrait',
        }
        setPhotos(prev => {
          const next = [...prev, p]
          if (prev.length === 0) setActiveId(p.id)
          return next
        })
      }
      img.src = url
    })
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) loadFiles(e.target.files)
    e.target.value = ''
  }, [loadFiles])

  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const onDragLeave = useCallback(() => setIsDragOver(false), [])
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    if (e.dataTransfer.files) loadFiles(e.dataTransfer.files)
  }, [loadFiles])

  function updatePhoto(id: string, patch: Partial<PhotoItem>) {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  function removePhoto(id: string) {
    setPhotos(prev => {
      const p = prev.find(x => x.id === id)
      if (p) URL.revokeObjectURL(p.url)
      const next = prev.filter(x => x.id !== id)
      if (activeId === id) setActiveId(next[0]?.id ?? null)
      return next
    })
  }

  function handleAddToCart() {
    photos.forEach(p => {
      const pv = VARIANTS.find(v => v.id === p.variantId) ?? VARIANTS[0]
      addItem({
        productId: 'poster',
        variantId: `${pv.id}__satinata`,
        quantity: p.copies,
        productName: 'Poster',
        variantLabel: `${pv.label} · ${FINISH_LABEL}`,
        price: pv.price,
        image: p.url,
      })
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileInput} />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '12px clamp(20px, 5vw, 60px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#999', maxWidth: 1140, margin: '0 auto' }}>
          <Link href="/shop"        style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <Link href="/shop/stampe" style={{ color: '#777', textDecoration: 'none' }}>Stampe</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Poster</span>
        </nav>
      </div>

      {/* Step bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)', display: 'flex', alignItems: 'center' }}>
          {[
            { n: 1 as const, label: 'Formato' },
            { n: 2 as const, label: 'Carica foto' },
            { n: 3 as const, label: 'Il tuo ordine' },
          ].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: 32, height: 1, background: step > i ? '#00c1de' : '#e0e0e0', margin: '0 6px' }} />}
              <button
                onClick={() => {
                  if (s.n < step) setStep(s.n)
                  else if (s.n === 2) setStep(2)
                  else if (s.n === 3 && photos.length > 0) setStep(3)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 4px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: step >= s.n ? '#00c1de' : '#e0e0e0',
                  color: step >= s.n ? '#fff' : '#aaa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, flexShrink: 0,
                }}>
                  {step > s.n ? <Check size={13} strokeWidth={3} /> : s.n}
                </div>
                <span style={{ fontSize: '12px', fontWeight: step === s.n ? 700 : 400, color: step >= s.n ? '#0a0a0a' : '#bbb' }}>
                  {s.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)' }}>

        {/* ══ STEP 1: Formato e finitura ══════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 700, margin: '0 auto' }}>
            <div>
              <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
                Poster
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
                Scegli il formato, poi carica le tue foto.<br />
                <span style={{ fontSize: '13px', color: '#00c1de', fontWeight: 600 }}>Stampiamo esclusivamente su carta fotografica satinata.</span>
              </p>
            </div>

            {/* Formato */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 16 }}>Formato</p>
              <div className="shop-format-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {VARIANTS.map(v => {
                  const active = variant.id === v.id
                  const prevW = v.wCm >= v.hCm ? 60 : Math.round(60 * v.wCm / v.hCm)
                  const prevH = v.hCm >= v.wCm ? 60 : Math.round(60 * v.hCm / v.wCm)
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVariant(v)}
                      style={{
                        border: `2px solid ${active ? '#00c1de' : '#e0e0e0'}`,
                        borderRadius: 12, background: active ? 'rgba(0,193,222,0.04)' : '#fff',
                        padding: '12px 8px', cursor: 'pointer', transition: 'all .15s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        position: 'relative',
                      }}
                    >
                      <div style={{
                        width: prevW, height: prevH,
                        background: active ? 'rgba(0,193,222,0.15)' : '#f0f0f0',
                        border: `1px solid ${active ? '#00c1de' : '#ddd'}`,
                        borderRadius: 2, boxShadow: '1px 2px 6px rgba(0,0,0,0.1)',
                      }} />
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: active ? '#00c1de' : '#0a0a0a', marginBottom: 2 }}>{v.label}</p>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#00c1de' }}>{formatPrice(v.price)}</p>
                      </div>
                      {active && (
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={10} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setStep(2)}
                style={{ background: '#00c1de', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                Avanti <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Carica foto ══════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 740, margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(20px, 3vw, 28px)', color: '#0a0a0a', marginBottom: 6 }}>
                Carica le tue foto
              </h2>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Formato: <b>{variant.label}</b> · <b>{FINISH_LABEL}</b>
              </p>
            </div>

            <div
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragOver ? '#00c1de' : '#c8c8c8'}`,
                borderRadius: 16, background: isDragOver ? 'rgba(0,193,222,0.04)' : '#fff',
                padding: 'clamp(32px, 6vw, 52px) 32px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: 12 }}>📁</div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0a0a0a', marginBottom: 6 }}>
                {photos.length === 0 ? 'Trascina le foto qui' : `${photos.length} foto caricate`}
              </p>
              <p style={{ fontSize: '12px', color: '#aaa', marginBottom: 20 }}>JPG, PNG, HEIC — qualsiasi dimensione</p>
              <span style={{ border: '1.5px solid #00c1de', borderRadius: 100, padding: '8px 22px', fontSize: '12px', fontWeight: 600, color: '#00c1de' }}>
                Sfoglia file...
              </span>
            </div>

            {photos.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700 }}>{photos.length} foto</p>
                  <button onClick={() => fileInputRef.current?.click()} style={{ fontSize: '12px', fontWeight: 600, color: '#00c1de', background: 'none', border: 'none', cursor: 'pointer' }}>
                    + Aggiungi altre
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                  {photos.map(p => (
                    <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#e0e0e0' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={e => { e.stopPropagation(); removePhoto(p.id) }}
                        style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: '2px solid #e0e0e0', borderRadius: 12, padding: '12px 22px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={16} /> Indietro
              </button>
              <button
                onClick={() => { if (photos.length > 0) { setActiveId(photos[0].id); setStep(3) } }}
                disabled={photos.length === 0}
                style={{ background: photos.length > 0 ? '#00c1de' : '#d0d0d0', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', cursor: photos.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                Avanti <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Il tuo ordine ════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="shop-cfg-grid" style={{ display: 'grid', gridTemplateColumns: '1fr minmax(280px, 360px)', gap: 32, alignItems: 'start' }}>

            {/* Sinistra: griglia foto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '20px', color: '#0a0a0a', marginBottom: 2 }}>
                    Il tuo ordine
                  </h2>
                  <p style={{ fontSize: '12px', color: '#aaa' }}>{photos.length} foto · {totalPrints} stampe totali</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ border: '1.5px solid #00c1de', borderRadius: 100, padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: '#00c1de', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Upload size={12} /> Aggiungi foto
                  </button>
                </div>
              </div>

              <div className="shop-thumb-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {photos.map(p => {
                  const isActive = activeId === p.id
                  const pv = VARIANTS.find(v => v.id === p.variantId) ?? VARIANTS[0]
                  const isSquare = pv.wCm === pv.hCm
                  const { w: tW, h: tH } = getSlotDims(pv, THUMB_MAX, p.slotOrientation)
                  return (
                    <div key={p.id} onClick={() => setActiveId(p.id)}
                      style={{
                        cursor: 'pointer', padding: 10, borderRadius: 12,
                        border: `2px solid ${isActive ? '#00c1de' : 'transparent'}`,
                        background: isActive ? 'rgba(0,193,222,0.04)' : '#fff',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        transition: 'all .15s',
                      }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ borderRadius: 4, overflow: 'hidden', boxShadow: '2px 3px 10px rgba(0,0,0,0.12)' }}>
                          <PhotoSlot photo={p} slotW={tW} slotH={tH} />
                        </div>
                        {p.copies > 1 && (
                          <div style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#00c1de', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.copies}
                          </div>
                        )}
                      </div>

                      {/* Selettore formato per questa foto */}
                      <select
                        value={p.variantId}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updatePhoto(p.id, { variantId: e.target.value, zoom: 1, offsetX: 0, offsetY: 0 }) }}
                        style={{ width: '100%', fontSize: '11px', fontWeight: 600, color: '#0a0a0a', border: '1px solid #e0e0e0', borderRadius: 7, padding: '4px 6px', background: '#fff', cursor: 'pointer' }}
                      >
                        {VARIANTS.map(v => (
                          <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                      </select>

                      {/* Toggle orientamento */}
                      {!isSquare && (
                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', width: '100%', border: '1px solid #e0e0e0', borderRadius: 7, overflow: 'hidden' }}>
                          {(['portrait', 'landscape'] as const).map(ori => (
                            <button
                              key={ori}
                              onClick={e => { e.stopPropagation(); updatePhoto(p.id, { slotOrientation: ori, zoom: 1, offsetX: 0, offsetY: 0 }) }}
                              style={{
                                flex: 1, border: 'none', padding: '4px 0', cursor: 'pointer', fontSize: '14px',
                                background: p.slotOrientation === ori ? '#00c1de' : '#f7f7f7',
                                color: p.slotOrientation === ori ? '#fff' : '#888',
                                transition: 'all .15s',
                              }}
                              title={ori === 'portrait' ? 'Verticale' : 'Orizzontale'}
                            >
                              {ori === 'portrait' ? '↕' : '↔'}
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
                          <button onClick={e => { e.stopPropagation(); updatePhoto(p.id, { copies: Math.max(1, p.copies - 1) }) }}
                            style={{ width: 26, height: 26, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus size={10} color="#555" />
                          </button>
                          <span style={{ width: 26, textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>{p.copies}</span>
                          <button onClick={e => { e.stopPropagation(); updatePhoto(p.id, { copies: p.copies + 1 }) }}
                            style={{ width: 26, height: 26, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={10} color="#555" />
                          </button>
                        </div>
                        <button onClick={e => { e.stopPropagation(); removePhoto(p.id) }}
                          style={{ width: 26, height: 26, border: 'none', background: '#fee', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={11} color="#e55" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Destra: pannello modifica + riepilogo */}
            <div className="shop-sticky shop-first-mobile" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {activePhoto ? (() => {
                const apv = VARIANTS.find(v => v.id === activePhoto.variantId) ?? VARIANTS[0]
                const apvIsSquare = apv.wCm === apv.hCm
                const { w: sW, h: sH } = getSlotDims(apv, PREVIEW_BIG, activePhoto.slotOrientation)
                return (
                  <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em' }}>
                        Modifica foto
                      </p>
                      <select
                        value={activePhoto.variantId}
                        onChange={e => updatePhoto(activePhoto.id, { variantId: e.target.value, zoom: 1, offsetX: 0, offsetY: 0 })}
                        style={{ fontSize: '12px', fontWeight: 700, color: '#00c1de', border: '1.5px solid #00c1de', borderRadius: 8, padding: '4px 8px', background: '#fff', cursor: 'pointer' }}
                      >
                        {VARIANTS.map(v => (
                          <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Toggle orientamento nel pannello */}
                    {!apvIsSquare && (
                      <div style={{ display: 'flex', width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 9, overflow: 'hidden' }}>
                        {(['portrait', 'landscape'] as const).map(ori => (
                          <button
                            key={ori}
                            onClick={() => updatePhoto(activePhoto.id, { slotOrientation: ori, zoom: 1, offsetX: 0, offsetY: 0 })}
                            style={{
                              flex: 1, border: 'none', padding: '8px 0', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                              background: activePhoto.slotOrientation === ori ? '#00c1de' : '#f7f7f7',
                              color: activePhoto.slotOrientation === ori ? '#fff' : '#888',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              transition: 'all .15s',
                            }}
                          >
                            <span style={{ fontSize: '16px' }}>{ori === 'portrait' ? '↕' : '↔'}</span>
                            {ori === 'portrait' ? 'Verticale' : 'Orizzontale'}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ boxShadow: '4px 6px 24px rgba(0,0,0,0.14)', borderRadius: 4 }}>
                      <PhotoSlot photo={activePhoto} slotW={sW} slotH={sH} interactive
                        onOffsetChange={(x, y) => updatePhoto(activePhoto.id, { offsetX: x, offsetY: y })} />
                    </div>

                    {/* Zoom */}
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ZoomIn size={13} color="#888" />
                      <input type="range" min={1} max={3} step={0.01}
                        value={activePhoto.zoom}
                        onChange={e => updatePhoto(activePhoto.id, { zoom: Number(e.target.value) })}
                        style={{ flex: 1, accentColor: '#00c1de', cursor: 'pointer', height: 4 }} />
                      <span style={{ fontSize: '11px', color: '#aaa', minWidth: 34, textAlign: 'right' }}>
                        {Math.round(activePhoto.zoom * 100)}%
                      </span>
                    </div>

                    {/* Stampa intera toggle */}
                    <button
                      onClick={() => updatePhoto(activePhoto.id, { fitMode: activePhoto.fitMode === 'contain' ? 'cover' : 'contain', zoom: 1, offsetX: 0, offsetY: 0 })}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 9, cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        border: `1.5px solid ${activePhoto.fitMode === 'contain' ? '#00c1de' : '#e0e0e0'}`,
                        background: activePhoto.fitMode === 'contain' ? 'rgba(0,193,222,0.08)' : '#fff',
                        color: activePhoto.fitMode === 'contain' ? '#00c1de' : '#666',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s',
                      }}
                    >
                      Stampa intera senza ritaglio
                      {activePhoto.fitMode === 'contain' && <Check size={12} strokeWidth={3} />}
                    </button>

                    <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', margin: '-4px 0 0' }}>
                      Trascina la foto per centrare il soggetto
                    </p>

                    {/* Copie */}
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Copie di questa foto</span>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
                        <button onClick={() => updatePhoto(activePhoto.id, { copies: Math.max(1, activePhoto.copies - 1) })} style={{ width: 32, height: 32, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={11} color="#555" />
                        </button>
                        <span style={{ width: 36, textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>{activePhoto.copies}</span>
                        <button onClick={() => updatePhoto(activePhoto.id, { copies: activePhoto.copies + 1 })} style={{ width: 32, height: 32, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={11} color="#555" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })() : (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20, textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
                  Clicca una foto per modificarla
                </div>
              )}

              {/* Riepilogo + CTA */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Totale ordine</p>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '26px', color: '#00c1de', lineHeight: 1, marginBottom: 12 }}>
                    {formatPrice(totalPrice)}
                  </p>
                  <div style={{ fontSize: '11px', color: '#888', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {photos.map(p => {
                      const pv = VARIANTS.find(v => v.id === p.variantId) ?? VARIANTS[0]
                      return (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#777' }}>{pv.label} × {p.copies}</span>
                          <span style={{ fontWeight: 700, color: '#555' }}>{formatPrice(pv.price * p.copies)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#888', padding: '8px 10px', background: '#f9f9f9', borderRadius: 8, lineHeight: 1.7 }}>
                  {FINISH_LABEL} · {totalPrints} stampe
                </div>

                <button onClick={handleAddToCart}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: added ? '#22c55e' : '#00c1de',
                    color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                    fontSize: '14px', cursor: 'pointer', transition: 'background .2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {added ? <><Check size={17} strokeWidth={3} /> Aggiunto!</> : <><ShoppingCart size={17} /> Aggiungi al carrello</>}
                </button>

                <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
                  Spedizione calcolata al checkout · Stampa professionale
                </p>
              </div>

              <button onClick={() => setStep(2)}
                style={{ background: 'none', border: '2px solid #e0e0e0', borderRadius: 12, padding: '11px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ChevronLeft size={15} /> Indietro
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

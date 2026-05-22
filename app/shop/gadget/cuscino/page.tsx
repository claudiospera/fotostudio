'use client'

// app/shop/gadget/cuscino/page.tsx
// Cuscino personalizzato 40×40 cm — upload foto, colore retro, zoom, spostamento

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Minus, Plus, ShoppingCart, Upload, RotateCcw, ZoomIn } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const PRICE = 2500

const BACK_COLORS = [
  { id: 'rosso',   label: 'Rosso',   hex: '#c0272d' },
  { id: 'rosa',    label: 'Rosa',    hex: '#e8799a' },
  { id: 'celeste', label: 'Celeste', hex: '#6ab4d8' },
]

const GALLERY = [
  '/images/shop/gadget/cuscino.png',
  '/images/shop/gadget/cuscino-rosso.png',
  '/images/shop/gadget/cuscino-ambientata.jpg',
]

// ─── Drag helpers ─────────────────────────────────────────────────────────────

function getCoverBounds(natW: number, natH: number, contW: number, contH: number, zoom: number) {
  const cs = Math.max(contW / natW, contH / natH)
  return {
    maxX: Math.max(0, (natW * cs * zoom - contW) / 2),
    maxY: Math.max(0, (natH * cs * zoom - contH) / 2),
  }
}

function clampVal(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// ─── PhotoSlot ────────────────────────────────────────────────────────────────

function PhotoSlot({
  size, photoUrl, zoom,
  onUploadClick, onOffsetChange, onNatSize,
}: {
  size: number
  photoUrl: string | null
  zoom: number
  onUploadClick: () => void
  onOffsetChange?: (x: number, y: number) => void
  onNatSize?: (nw: number, nh: number) => void
}) {
  const [offset,      setOffset]      = useState({ x: 0, y: 0 })
  const [isDragging,  setIsDragging]  = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const dragRef  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const stateRef = useRef({ offset: { x: 0, y: 0 }, size, zoom, natW: 0, natH: 0 })

  useEffect(() => {
    stateRef.current = { offset, size, zoom, natW: naturalSize?.w ?? 0, natH: naturalSize?.h ?? 0 }
  }, [offset, size, zoom, naturalSize])

  useEffect(() => {
    setOffset({ x: 0, y: 0 }); setNaturalSize(null); setIsDragging(false); dragRef.current = null
  }, [photoUrl])

  useEffect(() => {
    if (!naturalSize) return
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, size, size, zoom)
    setOffset(prev => ({ x: clampVal(prev.x, -maxX, maxX), y: clampVal(prev.y, -maxY, maxY) }))
  }, [zoom, size, naturalSize])

  useEffect(() => {
    if (!photoUrl) return
    const onMove = (cx: number, cy: number) => {
      if (!dragRef.current) return
      const { size: s, zoom: cz, natW, natH } = stateRef.current
      if (!natW || !natH) return
      const { maxX, maxY } = getCoverBounds(natW, natH, s, s, cz)
      const nx = clampVal(dragRef.current.ox + cx - dragRef.current.sx, -maxX, maxX)
      const ny = clampVal(dragRef.current.oy + cy - dragRef.current.sy, -maxY, maxY)
      setOffset({ x: nx, y: ny })
      onOffsetChange?.(nx / s, ny / s)
    }
    const onEnd = () => { dragRef.current = null; setIsDragging(false) }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { if (!dragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', mm)
    window.addEventListener('mouseup',   onEnd)
    window.addEventListener('touchmove', tm, { passive: false })
    window.addEventListener('touchend',  onEnd)
    return () => {
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('mouseup',   onEnd)
      window.removeEventListener('touchmove', tm)
      window.removeEventListener('touchend',  onEnd)
    }
  }, [photoUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const canDrag = naturalSize != null && (() => {
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, size, size, zoom)
    return maxX > 0.5 || maxY > 0.5
  })()

  function startDrag(cx: number, cy: number) {
    dragRef.current = { sx: cx, sy: cy, ox: stateRef.current.offset.x, oy: stateRef.current.offset.y }
    setIsDragging(true)
  }

  if (photoUrl) {
    const cs = naturalSize ? Math.max(size / naturalSize.w, size / naturalSize.h) : 1
    const imgW = naturalSize ? naturalSize.w * cs * zoom : size
    const imgH = naturalSize ? naturalSize.h * cs * zoom : size
    const posX = (size - imgW) / 2 + offset.x
    const posY = (size - imgH) / 2 + offset.y

    return (
      <div
        style={{
          width: size, height: size, overflow: 'hidden', position: 'relative',
          cursor: !canDrag ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none', touchAction: 'none',
          backgroundImage: `url(${photoUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: naturalSize ? `${imgW}px ${imgH}px` : 'cover',
          backgroundPosition: naturalSize ? `${posX}px ${posY}px` : 'center',
          transition: isDragging ? 'none' : 'background-size .08s, background-position .08s',
        }}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt="" style={{ display: 'none' }}
          onLoad={e => {
            const img = e.currentTarget
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
            onNatSize?.(img.naturalWidth, img.naturalHeight)
          }}
        />
      </div>
    )
  }

  return (
    <button
      onClick={onUploadClick}
      style={{
        width: size, height: size, border: '2px dashed #c0c0c0',
        background: '#f5f5f5', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', padding: 0, transition: 'all .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c1de'; e.currentTarget.style.background = '#e8f9fc' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#c0c0c0'; e.currentTarget.style.background = '#f5f5f5' }}
      aria-label="Carica la tua foto"
    >
      <Upload size={24} color="#aaa" strokeWidth={1.5} />
      <span style={{ fontSize: '11px', color: '#bbb', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Carica foto</span>
    </button>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function CuscinoPage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [backColor,     setBackColor]     = useState(BACK_COLORS[0])
  const [galleryIdx,    setGalleryIdx]    = useState(0)
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null)
  const [uploadedUrl,   setUploadedUrl]   = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [isRendering,   setIsRendering]   = useState(false)
  const [photoFilename, setPhotoFilename] = useState<string | undefined>(undefined)
  const [zoom,          setZoom]          = useState(1)
  const [photoOffset,   setPhotoOffset]   = useState({ x: 0, y: 0 })
  const [photoNatSize,  setPhotoNatSize]  = useState<{ w: number; h: number } | null>(null)
  const [qty,           setQty]           = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)

  // Dimensioni preview quadrate
  const PREVIEW_SIZE = 320

  useEffect(() => { return () => { if (photoUrl) URL.revokeObjectURL(photoUrl) } }, [photoUrl])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(URL.createObjectURL(file))
    setUploadedUrl(null)
    setPhotoFilename(file.name)
    setUploading(true)
    setZoom(1)
    setPhotoOffset({ x: 0, y: 0 })
    e.target.value = ''
    try {
      const res = await fetch('/api/shop/presign-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (res.ok) {
        const { uploadUrl, publicUrl } = await res.json()
        await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
        setUploadedUrl(publicUrl)
      }
    } catch { /* blob fallback */ }
    setUploading(false)
  }, [photoUrl])

  const handleRemovePhoto = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null); setUploadedUrl(null); setPhotoFilename(undefined)
    setZoom(1); setPhotoOffset({ x: 0, y: 0 }); setPhotoNatSize(null)
  }, [photoUrl])

  async function handleAddToCart() {
    if (uploading || isRendering) return
    let imageUrl = uploadedUrl ?? photoUrl ?? '/images/shop/gadget/cuscino.png'

    addItem({
      productId:    'cuscino',
      variantId:    `cus-40x40__${backColor.id}`,
      quantity:     qty,
      productName:  'Cuscino 40×40',
      variantLabel: `40×40 cm — Retro ${backColor.label}`,
      price:        PRICE,
      image:        imageUrl,
      filename:     photoFilename,
      notes:        `retro_colore:${backColor.label}`,
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2200)
  }

  const total = PRICE * qty

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '12px clamp(20px, 5vw, 60px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#999', maxWidth: 1140, margin: '0 auto' }}>
          <Link href="/shop"        style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <Link href="/shop/gadget" style={{ color: '#777', textDecoration: 'none' }}>Gadget</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Cuscino 40×40</span>
        </nav>
      </div>

      {/* Layout */}
      <div className="shop-cfg-grid" style={{
        maxWidth: 1140, margin: '0 auto',
        padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 440px) 1fr',
        gap: 'clamp(24px, 4vw, 64px)',
        alignItems: 'start',
      }}>

        {/* SINISTRA: Gallery + Anteprima */}
        <div className="shop-sticky" style={{ position: 'sticky', top: 88 }}>

          {/* Gallery prodotto */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#f0f0f0', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
              <Image
                src={GALLERY[galleryIdx]}
                alt="Cuscino personalizzato"
                width={400} height={400}
                style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {GALLERY.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIdx(i)}
                  style={{
                    flex: 1, padding: 0,
                    border: `2.5px solid ${galleryIdx === i ? '#00c1de' : '#e0e0e0'}`,
                    borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    background: '#f0f0f0', transition: 'border-color .15s',
                  }}
                >
                  <Image src={img} alt="" width={80} height={80} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 16 }}>
            Anteprima personalizzata
          </p>

          {/* Preview cuscino quadrato con foto */}
          <div style={{
            background: '#e8e8e8', borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 28,
          }}>
            {/* Simulazione fronte cuscino */}
            <div style={{
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 6px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.12)',
              border: '3px solid rgba(255,255,255,0.8)',
              display: 'inline-block',
            }}>
              <PhotoSlot
                size={PREVIEW_SIZE}
                photoUrl={photoUrl}
                zoom={zoom}
                onUploadClick={() => fileInputRef.current?.click()}
                onOffsetChange={(x, y) => setPhotoOffset({ x, y })}
                onNatSize={(nw, nh) => setPhotoNatSize({ w: nw, h: nh })}
              />
            </div>
          </div>

          {/* Indicatore colore retro */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: backColor.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
            <span style={{ fontSize: '12px', color: '#666' }}>Retro {backColor.label}</span>
          </div>

          {/* Controlli foto */}
          {photoUrl && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ZoomIn size={14} color="#888" />
                <input
                  type="range" min={1} max={2} step={0.01} value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#00c1de', cursor: 'pointer', height: 4 }}
                  aria-label="Zoom foto"
                />
                <span style={{ fontSize: '11px', color: '#aaa', minWidth: 32, textAlign: 'right' }}>
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center' }}>Trascina per riposizionare</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: '12px', fontWeight: 600, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Upload size={12} /> Cambia foto
                </button>
                <button
                  onClick={handleRemovePhoto}
                  title="Rimuovi foto"
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: '12px', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Tag */}
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>40×40 cm</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>Raso opaco</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', background: backColor.hex, borderRadius: 100, padding: '4px 10px' }}>Retro {backColor.label}</span>
          </div>
        </div>

        {/* DESTRA: Configuratore */}
        <div className="shop-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Cuscino 40×40
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Federa quadrata con lato stampabile in raso opaco e retro in cotone colorato. Include imbottitura.
            </p>
          </div>

          {/* Upload foto */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>La tua foto</p>
            {!photoUrl ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', padding: '20px',
                  border: '2px dashed #c0c0c0', borderRadius: 12,
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontSize: '13px', fontWeight: 600, color: '#888', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c1de'; e.currentTarget.style.color = '#00c1de' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#c0c0c0'; e.currentTarget.style.color = '#888' }}
              >
                <Upload size={16} /> Carica la tua foto
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,193,222,0.07)', borderRadius: 10, border: '1px solid rgba(0,193,222,0.2)' }}>
                <Check size={16} color="#00c1de" />
                <span style={{ fontSize: '12px', color: '#444', flex: 1 }}>
                  {uploading ? 'Caricamento in corso…' : (photoFilename ?? 'Foto caricata')}
                </span>
                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00c1de', fontSize: '11px', fontWeight: 600, padding: 4 }}>
                  Cambia
                </button>
                <button onClick={handleRemovePhoto} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                  <RotateCcw size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Colore retro */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>
              Colore retro
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {BACK_COLORS.map(c => {
                const active = backColor.id === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setBackColor(c)}
                    style={{
                      flex: 1, padding: '14px 12px', borderRadius: 12,
                      border: `2px solid ${active ? '#00c1de' : '#e0e0e0'}`,
                      background: active ? 'rgba(0,193,222,0.06)' : '#fff',
                      cursor: 'pointer', transition: 'all .15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: c.hex,
                      border: `3px solid ${active ? '#00c1de' : 'rgba(0,0,0,0.08)'}`,
                      boxShadow: active ? '0 0 0 2px rgba(0,193,222,0.3)' : 'none',
                      transition: 'all .15s',
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: active ? 700 : 500, color: active ? '#00c1de' : '#555' }}>
                      {c.label}
                    </span>
                    {active && (
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={9} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantità */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Quantità</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 44, height: 44, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus size={14} color="#333" />
                </button>
                <span style={{ width: 48, textAlign: 'center', fontWeight: 700, fontSize: '16px', color: '#0a0a0a' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: 44, height: 44, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={14} color="#333" />
                </button>
              </div>
              <span style={{ fontSize: '12px', color: '#aaa' }}>{formatPrice(PRICE)} × {qty} pz</span>
            </div>
          </div>

          {/* Prezzo + CTA */}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Totale</p>
                <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '28px', color: '#00c1de', lineHeight: 1 }}>
                  {formatPrice(total)}
                </p>
              </div>
              {qty > 1 && <p style={{ fontSize: '12px', color: '#aaa' }}>{formatPrice(PRICE)} cad.</p>}
            </div>

            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>40×40 cm — Raso opaco</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: backColor.hex, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                <span>Retro {backColor.label}</span>
              </div>
              {!photoUrl && <span style={{ color: '#f59e0b', fontWeight: 600 }}>Foto non caricata</span>}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={uploading || isRendering}
              style={{
                width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                background: addedFeedback ? '#22c55e' : (uploading || isRendering) ? '#b0e6f0' : '#00c1de',
                color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                fontSize: '15px', cursor: (uploading || isRendering) ? 'not-allowed' : 'pointer',
                transition: 'background .2s', opacity: (uploading || isRendering) ? 0.75 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {addedFeedback ? (
                <><Check size={18} strokeWidth={3} /> Aggiunto al carrello!</>
              ) : uploading ? (
                <>Caricamento foto…</>
              ) : isRendering ? (
                <>Composizione immagine…</>
              ) : (
                <><ShoppingCart size={18} /> Aggiungi al carrello</>
              )}
            </button>

            <Link href="/shop/carrello" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '12px', borderRadius: 12,
              border: '2px solid #00c1de', color: '#00c1de',
              background: '#fff', fontFamily: 'Poppins, sans-serif',
              fontWeight: 700, fontSize: '13px', textDecoration: 'none',
            }}>
              Vai al carrello
            </Link>

            <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
              Raso opaco + cotone colorato · Include imbottitura · Ritiro in studio
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

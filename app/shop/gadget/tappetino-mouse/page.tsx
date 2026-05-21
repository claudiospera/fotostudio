'use client'

// app/shop/gadget/tappetino-mouse/page.tsx
// Tappetino Mouse Rettangolare 19×23 cm — upload foto, orientamento, zoom, spostamento

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Check, Minus, Plus, ShoppingCart, Upload, RotateCcw, ZoomIn } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const PRICE    = 1300
const WIDTH_CM = 19
const HEIGHT_CM = 23

// ─── Drag helpers ─────────────────────────────────────────────────────────────

function getCoverBounds(natW: number, natH: number, contW: number, contH: number, zoom: number) {
  const cs = Math.max(contW / natW, contH / natH)
  const rW = natW * cs * zoom
  const rH = natH * cs * zoom
  return {
    maxX: Math.max(0, (rW - contW) / 2),
    maxY: Math.max(0, (rH - contH) / 2),
  }
}

function clampVal(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// ─── PhotoSlot ────────────────────────────────────────────────────────────────

function PhotoSlot({
  w, h, photoUrl, zoom,
  onUploadClick, onOffsetChange, onNatSize,
}: {
  w: number; h: number
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
  const stateRef = useRef({ offset: { x: 0, y: 0 }, w, h, zoom, natW: 0, natH: 0 })

  useEffect(() => {
    stateRef.current = { offset, w, h, zoom, natW: naturalSize?.w ?? 0, natH: naturalSize?.h ?? 0 }
  }, [offset, w, h, zoom, naturalSize])

  useEffect(() => {
    setOffset({ x: 0, y: 0 })
    setNaturalSize(null)
    setIsDragging(false)
    dragRef.current = null
  }, [photoUrl])

  useEffect(() => {
    if (!naturalSize) return
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, w, h, zoom)
    setOffset(prev => ({
      x: clampVal(prev.x, -maxX, maxX),
      y: clampVal(prev.y, -maxY, maxY),
    }))
  }, [zoom, w, h, naturalSize])

  useEffect(() => {
    if (!photoUrl) return
    const onMove = (cx: number, cy: number) => {
      if (!dragRef.current) return
      const { w: cw, h: ch, zoom: cz, natW, natH } = stateRef.current
      if (!natW || !natH) return
      const { maxX, maxY } = getCoverBounds(natW, natH, cw, ch, cz)
      const nx = clampVal(dragRef.current.ox + cx - dragRef.current.sx, -maxX, maxX)
      const ny = clampVal(dragRef.current.oy + cy - dragRef.current.sy, -maxY, maxY)
      setOffset({ x: nx, y: ny })
      onOffsetChange?.(nx / cw, ny / ch)
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
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, w, h, zoom)
    return maxX > 0.5 || maxY > 0.5
  })()

  function startDrag(cx: number, cy: number) {
    dragRef.current = { sx: cx, sy: cy, ox: stateRef.current.offset.x, oy: stateRef.current.offset.y }
    setIsDragging(true)
  }

  if (photoUrl) {
    const cs = naturalSize ? Math.max(w / naturalSize.w, h / naturalSize.h) : 1
    const imgW = naturalSize ? naturalSize.w * cs * zoom : w
    const imgH = naturalSize ? naturalSize.h * cs * zoom : h
    const posX = (w - imgW) / 2 + offset.x
    const posY = (h - imgH) / 2 + offset.y

    return (
      <div
        style={{
          width: w, height: h, overflow: 'hidden', position: 'relative',
          cursor: !canDrag ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none', touchAction: 'none',
          backgroundImage: `url(${photoUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: naturalSize ? `${imgW}px ${imgH}px` : 'cover',
          backgroundPosition: naturalSize ? `${posX}px ${posY}px` : 'center',
          transition: isDragging ? 'none' : 'background-size .08s, background-position .08s',
          borderRadius: 8,
        }}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        {/* img nascosta per leggere dimensioni naturali */}
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
        width: w, height: h, border: '2px dashed #c0c0c0', borderRadius: 8,
        background: '#f5f5f5', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', padding: 0, transition: 'all .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c1de'; e.currentTarget.style.background = '#e8f9fc' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#c0c0c0'; e.currentTarget.style.background = '#f5f5f5' }}
      aria-label="Carica la tua foto"
    >
      <Upload size={22} color="#aaa" strokeWidth={1.5} />
      <span style={{ fontSize: '11px', color: '#bbb', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        Carica foto
      </span>
    </button>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function TappetinoMousePage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rotated,       setRotated]       = useState(false)
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

  // Reset orientamento quando cambia la foto
  useEffect(() => { setRotated(false) }, [photoUrl])

  const effW = rotated ? HEIGHT_CM : WIDTH_CM
  const effH = rotated ? WIDTH_CM  : HEIGHT_CM

  // Dimensioni preview — la larghezza massima è 340px
  const PREVIEW_W = 340
  const previewW = rotated ? PREVIEW_W : Math.round(PREVIEW_W * (effW / effH))
  const previewH = rotated ? Math.round(PREVIEW_W * (effH / effW)) : PREVIEW_W

  useEffect(() => { URL.revokeObjectURL; return () => { if (photoUrl) URL.revokeObjectURL(photoUrl) } }, [photoUrl])

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
    } catch { /* usa blob url come fallback */ }
    setUploading(false)
  }, [photoUrl])

  const handleRemovePhoto = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
    setUploadedUrl(null)
    setPhotoFilename(undefined)
    setZoom(1)
    setPhotoOffset({ x: 0, y: 0 })
    setPhotoNatSize(null)
  }, [photoUrl])

  async function handleAddToCart() {
    if (uploading || isRendering) return
    let imageUrl = uploadedUrl ?? photoUrl ?? '/images/shop/gadget/tappetino-mouse.png'
    const orientLabel = rotated ? ' — Orizzontale' : ''

    if (photoUrl && photoNatSize) {
      setIsRendering(true)
      try {
        const cW = Math.round(effW * 100), cH = Math.round(effH * 100)
        const canvas = document.createElement('canvas')
        canvas.width = cW; canvas.height = cH
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cW, cH)
          const img = await new Promise<HTMLImageElement>((res, rej) => {
            const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = photoUrl
          })
          const cs = Math.max(cW / photoNatSize.w, cH / photoNatSize.h)
          const iW = photoNatSize.w * cs * zoom
          const iH = photoNatSize.h * cs * zoom
          const offX = photoOffset.x * cW, offY = photoOffset.y * cH
          ctx.save(); ctx.rect(0, 0, cW, cH); ctx.clip()
          ctx.drawImage(img, (cW - iW) / 2 + offX, (cH - iH) / 2 + offY, iW, iH)
          ctx.restore()
          const blob = await new Promise<Blob | null>(r => canvas.toBlob(b => r(b), 'image/jpeg', 0.93))
          if (blob) {
            const res = await fetch('/api/shop/presign-photo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: photoFilename ?? 'tappetino.jpg', contentType: 'image/jpeg' }),
            })
            if (res.ok) {
              const { uploadUrl, publicUrl } = await res.json()
              await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } })
              imageUrl = publicUrl
            }
          }
        }
      } catch { /* fallback */ }
      setIsRendering(false)
    }

    addItem({
      productId:    'tappetino-mouse',
      variantId:    `tap-rett${rotated ? '__h' : '__v'}`,
      quantity:     qty,
      productName:  'Tappetino Mouse Rettangolare',
      variantLabel: `19×23 cm${orientLabel}`,
      price:        PRICE,
      image:        imageUrl,
      filename:     photoFilename,
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
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Tappetino Mouse Rettangolare</span>
        </nav>
      </div>

      {/* Configuratore */}
      <div className="shop-cfg-grid" style={{
        maxWidth: 1140, margin: '0 auto',
        padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 460px) 1fr',
        gap: 'clamp(24px, 4vw, 64px)',
        alignItems: 'start',
      }}>

        {/* SINISTRA: Anteprima */}
        <div className="shop-sticky" style={{ position: 'sticky', top: 88 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 16 }}>
            Anteprima
          </p>

          {/* Stage tappetino */}
          <div style={{
            background: '#e8e8e8', borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 32, minHeight: 300,
          }}>
            {/* Simulazione tappetino con angoli arrotondati */}
            <div style={{
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)',
              transition: 'all .3s ease',
              display: 'inline-block',
            }}>
              <PhotoSlot
                w={previewW}
                h={previewH}
                photoUrl={photoUrl}
                zoom={zoom}
                onUploadClick={() => fileInputRef.current?.click()}
                onOffsetChange={(x, y) => setPhotoOffset({ x, y })}
                onNatSize={(nw, nh) => setPhotoNatSize({ w: nw, h: nh })}
              />
            </div>
          </div>

          {/* Controlli foto */}
          {photoUrl ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
                Trascina la foto per riposizionarla
              </p>
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
          ) : null}

          {/* Tag */}
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>
              {rotated ? `${HEIGHT_CM}×${WIDTH_CM} cm` : `${WIDTH_CM}×${HEIGHT_CM} cm`}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>
              {rotated ? 'Orizzontale' : 'Verticale'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>
              Spessore 3 mm
            </span>
          </div>
        </div>

        {/* DESTRA: Configuratore */}
        <div className="shop-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Tappetino Mouse Rettangolare
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Mousepad rettangolare con superficie in poliestere e supporto in gomma. Dimensioni 19×23 cm, spessore 3 mm.
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

          {/* Orientamento */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Orientamento</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setRotated(false)}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  border: `2px solid ${!rotated ? '#00c1de' : '#e0e0e0'}`,
                  background: !rotated ? 'rgba(0,193,222,0.06)' : '#fff',
                  cursor: 'pointer', transition: 'all .15s',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                <div style={{ width: 14, height: 20, border: `2px solid ${!rotated ? '#00c1de' : '#ccc'}`, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: !rotated ? '#00c1de' : '#0a0a0a', marginBottom: 1 }}>Verticale</p>
                  <p style={{ fontSize: '11px', color: '#888' }}>{WIDTH_CM}×{HEIGHT_CM} cm</p>
                </div>
                {!rotated && <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#fff" strokeWidth={3} /></div>}
              </button>
              <button
                onClick={() => setRotated(true)}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  border: `2px solid ${rotated ? '#00c1de' : '#e0e0e0'}`,
                  background: rotated ? 'rgba(0,193,222,0.06)' : '#fff',
                  cursor: 'pointer', transition: 'all .15s',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                <div style={{ width: 20, height: 14, border: `2px solid ${rotated ? '#00c1de' : '#ccc'}`, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: rotated ? '#00c1de' : '#0a0a0a', marginBottom: 1 }}>Orizzontale</p>
                  <p style={{ fontSize: '11px', color: '#888' }}>{HEIGHT_CM}×{WIDTH_CM} cm</p>
                </div>
                {rotated && <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#fff" strokeWidth={3} /></div>}
              </button>
            </div>
          </div>

          {/* Quantità */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Quantità</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: 44, height: 44, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={14} color="#333" />
                </button>
                <span style={{ width: 48, textAlign: 'center', fontWeight: 700, fontSize: '16px', color: '#0a0a0a' }}>{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  style={{ width: 44, height: 44, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
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

            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8 }}>
              <b style={{ color: '#555' }}>{rotated ? `${HEIGHT_CM}×${WIDTH_CM} cm` : `${WIDTH_CM}×${HEIGHT_CM} cm`}</b>
              {` — ${rotated ? 'Orizzontale' : 'Verticale'} — spessore 3 mm`}
              {!photoUrl && <span style={{ color: '#f59e0b', fontWeight: 600 }}> · Foto non caricata</span>}
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
              Poliestere + gomma antiscivolo · Stampa ad alta risoluzione · Ritiro in studio
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

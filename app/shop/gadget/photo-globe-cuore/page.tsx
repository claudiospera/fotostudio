'use client'

// app/shop/gadget/photo-globe-cuore/page.tsx
// Photo Globe Cuore — canvas preview con maschera cuore in tempo reale

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Minus, Plus, ShoppingCart, Upload, RotateCcw, ZoomIn } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

function fmt(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const PRICE   = 1300
// Proporzioni reali del PNG maschera (3413×2761)
const MASK_W  = 3413
const MASK_H  = 2761
const PREV_W  = 340
const PREV_H  = Math.round(PREV_W * MASK_H / MASK_W)   // ≈ 275
const OUT_W   = 900
const OUT_H   = Math.round(OUT_W * MASK_H / MASK_W)    // ≈ 728
const SCALE_X = OUT_W / PREV_W
const SCALE_Y = OUT_H / PREV_H
const MASK_SRC = '/images/shop/gadget/cuore.png'

// ─── Componente principale ────────────────────────────────────────────────────

export default function PhotoGlobeCuorePage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const maskImgRef   = useRef<HTMLImageElement | null>(null)
  const photoImgRef  = useRef<HTMLImageElement | null>(null)

  // ── Foto ──
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null)
  const [uploadedUrl,   setUploadedUrl]   = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [isRendering,   setIsRendering]   = useState(false)
  const [photoFilename, setPhotoFilename] = useState<string | undefined>(undefined)
  const [photoZoom,     setPhotoZoom]     = useState(1)
  const [photoOffset,   setPhotoOffset]   = useState({ x: 0, y: 0 })
  const [photoNatSize,  setPhotoNatSize]  = useState<{ w: number; h: number } | null>(null)

  // ── UI ──
  const [qty,           setQty]           = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)

  // ─── Pre-carica la maschera una volta sola ───────────────────────────────
  useEffect(() => {
    const m = new window.Image()
    m.src = MASK_SRC
    m.onload = () => { maskImgRef.current = m }
  }, [])

  // ─── Ridisegna il canvas ogni volta che cambia foto / zoom / offset ───────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, PREV_W, PREV_H)

    const photo = photoImgRef.current
    const mask  = maskImgRef.current

    if (!photo || !mask || !photoNatSize) return

    const containScale = Math.min(PREV_W / photoNatSize.w, PREV_H / photoNatSize.h)
    const w = photoNatSize.w * containScale * photoZoom
    const h = photoNatSize.h * containScale * photoZoom
    const x = (PREV_W - w) / 2 + photoOffset.x
    const y = (PREV_H - h) / 2 + photoOffset.y

    ctx.drawImage(photo, x, y, w, h)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(mask, 0, 0, PREV_W, PREV_H)
    ctx.globalCompositeOperation = 'source-over'
  }, [photoNatSize, photoZoom, photoOffset])

  // Cleanup blob
  useEffect(() => {
    return () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }
  }, [photoUrl])

  // ─── Drag foto ────────────────────────────────────────────────────────────
  const photoDragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    if (!photoUrl) return
    const onMove = (cx: number, cy: number) => {
      if (!photoDragRef.current) return
      setPhotoOffset({
        x: photoDragRef.current.ox + cx - photoDragRef.current.sx,
        y: photoDragRef.current.oy + cy - photoDragRef.current.sy,
      })
    }
    const onEnd = () => { photoDragRef.current = null }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => {
      if (!photoDragRef.current) return
      e.preventDefault()
      onMove(e.touches[0].clientX, e.touches[0].clientY)
    }
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
  }, [photoUrl])

  // ─── Upload foto ──────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)

    const localUrl = URL.createObjectURL(file)
    setPhotoUrl(localUrl)
    setUploadedUrl(null)
    setPhotoFilename(file.name)
    setUploading(true)
    setPhotoZoom(1)
    setPhotoOffset({ x: 0, y: 0 })
    setPhotoNatSize(null)
    photoImgRef.current = null
    e.target.value = ''

    // Carica l'immagine nel ref per il canvas
    const img = new window.Image()
    img.src = localUrl
    img.onload = () => {
      photoImgRef.current = img
      setPhotoNatSize({ w: img.naturalWidth, h: img.naturalHeight })
    }

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

  const removePhoto = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    photoImgRef.current = null
    setPhotoUrl(null); setUploadedUrl(null); setPhotoFilename(undefined)
    setPhotoZoom(1); setPhotoOffset({ x: 0, y: 0 }); setPhotoNatSize(null)
    // Pulisci canvas
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, PREV_W, PREV_H)
  }, [photoUrl])

  // ─── Add to cart con canvas render ad alta risoluzione ────────────────────
  async function handleAddToCart() {
    if (uploading || isRendering) return
    let imageUrl = uploadedUrl ?? photoUrl ?? '/images/shop/gadget/PHOTO-GLOBE-CUORE-P9008_HIGH.jpg'

    if (photoImgRef.current && photoNatSize) {
      setIsRendering(true)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = OUT_W; canvas.height = OUT_H
        const ctx = canvas.getContext('2d')
        if (ctx && maskImgRef.current) {
          const containScale = Math.min(PREV_W / photoNatSize.w, PREV_H / photoNatSize.h)
          const w = photoNatSize.w * containScale * photoZoom
          const h = photoNatSize.h * containScale * photoZoom
          const x = (PREV_W - w) / 2 + photoOffset.x
          const y = (PREV_H - h) / 2 + photoOffset.y
          ctx.drawImage(photoImgRef.current, x * SCALE_X, y * SCALE_Y, w * SCALE_X, h * SCALE_Y)
          ctx.globalCompositeOperation = 'destination-out'
          ctx.drawImage(maskImgRef.current, 0, 0, OUT_W, OUT_H)
          ctx.globalCompositeOperation = 'source-over'

          const blob = await new Promise<Blob | null>(r => canvas.toBlob(b => r(b), 'image/png'))
          if (blob) {
            const res = await fetch('/api/shop/presign-photo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: photoFilename ?? 'cuore.png', contentType: 'image/png' }),
            })
            if (res.ok) {
              const { uploadUrl, publicUrl } = await res.json()
              await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/png' } })
              imageUrl = publicUrl
            }
          }
        }
      } catch { /* fallback */ }
      setIsRendering(false)
    }

    addItem({
      productId:    'photo-globe-cuore',
      variantId:    'pgc-9x9',
      quantity:     qty,
      productName:  'Photo Globe Cuore',
      variantLabel: '9×9 cm',
      price:        PRICE,
      image:        imageUrl,
      filename:     photoFilename,
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2200)
  }

  const total = PRICE * qty

  // ─── Render ───────────────────────────────────────────────────────────────
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
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Photo Globe Cuore</span>
        </nav>
      </div>

      <div className="shop-cfg-grid" style={{
        maxWidth: 1140, margin: '0 auto',
        padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 500px) 1fr',
        gap: 'clamp(24px, 4vw, 64px)',
        alignItems: 'start',
      }}>

        {/* ── SINISTRA ──────────────────────────────────────────────────── */}
        <div className="shop-sticky" style={{ position: 'sticky', top: 88 }}>

          {/* Foto prodotto */}
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#f0f0f0', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
            <Image
              src="/images/shop/gadget/PHOTO-GLOBE-CUORE-P9008_HIGH.jpg"
              alt="Photo Globe Cuore"
              width={400} height={400}
              style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }}
            />
          </div>

          {/* Etichetta preview */}
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>
            Anteprima foto nel cuore
          </p>

          {/* Canvas preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: PREV_W, height: PREV_H }}>
              <canvas
                ref={canvasRef}
                width={PREV_W}
                height={PREV_H}
                style={{
                  display: 'block',
                  cursor: photoUrl ? 'grab' : 'default',
                  userSelect: 'none',
                  touchAction: 'none',
                  borderRadius: 4,
                }}
                onMouseDown={e => {
                  if (!photoUrl) return
                  e.preventDefault()
                  photoDragRef.current = { sx: e.clientX, sy: e.clientY, ox: photoOffset.x, oy: photoOffset.y }
                }}
                onTouchStart={e => {
                  if (!photoUrl) return
                  photoDragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, ox: photoOffset.x, oy: photoOffset.y }
                }}
              />

              {/* Placeholder quando non c'è foto */}
              {!photoUrl && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    border: '2px dashed #d0d0d0', borderRadius: 4,
                    background: '#f5f5f5', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {/* Sagoma cuore come guida visiva */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={MASK_SRC} alt="" style={{ width: 120, height: 120, opacity: 0.15, pointerEvents: 'none' }} />
                  <span style={{ fontSize: '11px', color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Carica foto</span>
                </button>
              )}
            </div>
          </div>

          {/* Zoom foto */}
          {photoUrl && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 600 }}>PICCOLO</span>
                <input
                  type="range" min={0.2} max={3} step={0.01} value={photoZoom}
                  onChange={e => setPhotoZoom(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#00c1de', height: 4, cursor: 'pointer' }}
                  aria-label="Zoom foto"
                />
                <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 600 }}>GRANDE</span>
                <span style={{ fontSize: '11px', color: '#888', minWidth: 38, textAlign: 'right' }}>
                  {Math.round(photoZoom * 100)}%
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
                <ZoomIn size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Trascina per riposizionare dentro al cuore
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: '12px', fontWeight: 600, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Upload size={12} /> Cambia foto
                </button>
                <button onClick={removePhoto} title="Rimuovi"
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── DESTRA ────────────────────────────────────────────────────── */}
        <div className="shop-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Photo Globe Cuore
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Cuore in acrilico effetto trasparente con la tua foto personalizzata. Al suo interno acqua e cuoricini colorati che fluttuano. La foto viene ritagliata nella forma a cuore. Dimensioni 9×9 cm.
            </p>
          </div>

          {/* Sezione foto */}
          <div>
            <p style={labelStyle}>La tua foto</p>
            {!photoUrl ? (
              <button onClick={() => fileInputRef.current?.click()} style={uploadBtnStyle}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c1de'; e.currentTarget.style.color = '#00c1de' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#c0c0c0'; e.currentTarget.style.color = '#888' }}>
                <Upload size={16} /> Carica la tua foto
              </button>
            ) : (
              <div style={uploadedStyle}>
                <Check size={16} color="#00c1de" />
                <span style={{ fontSize: '12px', color: '#444', flex: 1 }}>
                  {uploading ? 'Caricamento…' : (photoFilename ?? 'Foto caricata')}
                </span>
                <button onClick={() => fileInputRef.current?.click()} style={linkBtnStyle}>Cambia</button>
                <button onClick={removePhoto} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                  <RotateCcw size={13} />
                </button>
              </div>
            )}
          </div>

          {photoUrl && (
            <div style={{ padding: '14px 16px', background: '#fff0f3', borderRadius: 12, border: '1px solid #ffc8d5', fontSize: '12px', color: '#555', lineHeight: 1.7 }}>
              <b>💡 Suggerimento:</b> regola lo zoom e trascina la foto per centrare il viso nel cuore.
            </div>
          )}

          {/* Caratteristiche */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '❤️', label: 'Forma cuore', desc: 'Sagoma ritagliata' },
              { icon: '💧', label: 'Effetto snow globe', desc: 'Acqua + cuoricini' },
              { icon: '🔮', label: 'Acrilico trasparente', desc: 'Effetto cristallo' },
              { icon: '📐', label: '9×9 cm', desc: 'Dimensioni prodotto' },
            ].map(f => (
              <div key={f.label} style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '20px' }}>{f.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#333' }}>{f.label}</span>
                <span style={{ fontSize: '11px', color: '#999' }}>{f.desc}</span>
              </div>
            ))}
          </div>

          {/* Quantità */}
          <div>
            <p style={labelStyle}>Quantità</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: 44, height: 44, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus size={14} color="#333" />
                </button>
                <span style={{ width: 48, textAlign: 'center', fontWeight: 700, fontSize: '16px', color: '#0a0a0a' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  style={{ width: 44, height: 44, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={14} color="#333" />
                </button>
              </div>
              <span style={{ fontSize: '12px', color: '#aaa' }}>{fmt(PRICE)} × {qty} pz</span>
            </div>
          </div>

          {/* Prezzo + CTA */}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Totale</p>
                <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '28px', color: '#00c1de', lineHeight: 1 }}>
                  {fmt(total)}
                </p>
              </div>
              {qty > 1 && <p style={{ fontSize: '12px', color: '#aaa' }}>{fmt(PRICE)} cad.</p>}
            </div>

            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8 }}>
              <b style={{ color: '#555' }}>Photo Globe Cuore</b> — 9×9 cm · Acrilico trasparente
              {!photoUrl && <div style={{ color: '#f59e0b', fontWeight: 600 }}>Nessuna foto caricata</div>}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={uploading || isRendering}
              style={{
                width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                background: addedFeedback ? '#22c55e' : (uploading || isRendering) ? '#b0e6f0' : '#00c1de',
                color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                fontSize: '15px', cursor: (uploading || isRendering) ? 'not-allowed' : 'pointer',
                transition: 'background .25s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {addedFeedback
                ? <><Check size={18} /> Aggiunto al carrello!</>
                : isRendering
                  ? 'Elaborazione immagine…'
                  : <><ShoppingCart size={18} /> Aggiungi al carrello</>
              }
            </button>

            <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center', lineHeight: 1.5 }}>
              Spedizione in 3–5 giorni lavorativi · Reso entro 14 giorni
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .shop-cfg-grid { grid-template-columns: 1fr !important; }
          .shop-sticky { position: static !important; }
          .shop-first-mobile { order: -1; }
        }
      `}</style>
    </div>
  )
}

// ─── Stili ────────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10,
}

const uploadBtnStyle: React.CSSProperties = {
  width: '100%', padding: '16px', borderRadius: 12,
  border: '2px dashed #c0c0c0', background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  fontSize: '13px', fontWeight: 700, color: '#888', cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif', transition: 'all .15s',
}

const uploadedStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
  border: '2px solid #00c1de', borderRadius: 12, background: 'rgba(0,193,222,0.04)',
}

const linkBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#00c1de', fontSize: '12px', fontWeight: 700, padding: 4,
}

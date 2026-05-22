'use client'

// app/shop/gadget/photo-globe-cuore/page.tsx
// Photo Globe Cuore — foto ritagliata a forma di cuore in acrilico

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Minus, Plus, ShoppingCart, Upload, RotateCcw, ZoomIn } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

function fmt(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const PRICE = 1300

// ─── Dimensioni area stampa (9×9 cm, quadrato) ────────────────────────────────
const PREV_SIZE = 340          // preview px (quadrato)
const OUT_SIZE  = 900          // canvas output (100px/cm × 9cm)
const SCALE     = OUT_SIZE / PREV_SIZE

const MASK_SRC = '/images/shop/gadget/cuore.png'

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// ─── Componente principale ────────────────────────────────────────────────────

export default function PhotoGlobeCuorePage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Cleanup blob
  useEffect(() => {
    return () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }
  }, [photoUrl])

  // ─── Drag foto ────────────────────────────────────────────────────────────
  const photoDragRef  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    if (!photoUrl) return
    const onMove = (cx: number, cy: number) => {
      if (!photoDragRef.current) return
      const dx = cx - photoDragRef.current.sx
      const dy = cy - photoDragRef.current.sy
      setPhotoOffset({ x: photoDragRef.current.ox + dx, y: photoDragRef.current.oy + dy })
    }
    const onEnd = () => { photoDragRef.current = null }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { if (!photoDragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
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
  }, [photoUrl])

  // ─── Upload foto ──────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(URL.createObjectURL(file))
    setUploadedUrl(null)
    setPhotoFilename(file.name)
    setUploading(true)
    setPhotoZoom(1)
    setPhotoOffset({ x: 0, y: 0 })
    setPhotoNatSize(null)
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

  const removePhoto = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null); setUploadedUrl(null); setPhotoFilename(undefined)
    setPhotoZoom(1); setPhotoOffset({ x: 0, y: 0 }); setPhotoNatSize(null)
  }, [photoUrl])

  // ─── Calcolo dimensioni foto in preview ───────────────────────────────────
  const photoPreview = (() => {
    if (!photoNatSize) return null
    const containScale = Math.min(PREV_SIZE / photoNatSize.w, PREV_SIZE / photoNatSize.h)
    const w = photoNatSize.w * containScale * photoZoom
    const h = photoNatSize.h * containScale * photoZoom
    const x = (PREV_SIZE - w) / 2 + photoOffset.x
    const y = (PREV_SIZE - h) / 2 + photoOffset.y
    return { w, h, x, y }
  })()

  // ─── Add to cart con canvas render a cuore ────────────────────────────────
  async function handleAddToCart() {
    if (uploading || isRendering) return
    let imageUrl = uploadedUrl ?? photoUrl ?? '/images/shop/gadget/photo-globe-cuore.jpg'

    if (photoUrl && photoNatSize && photoPreview) {
      setIsRendering(true)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = OUT_SIZE; canvas.height = OUT_SIZE
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // 1. Sfondo trasparente — disegna foto
          const img = await new Promise<HTMLImageElement>((res, rej) => {
            const i = document.createElement('img')
            i.crossOrigin = 'anonymous'
            i.onload = () => res(i); i.onerror = rej; i.src = photoUrl
          })
          ctx.drawImage(img,
            photoPreview.x * SCALE, photoPreview.y * SCALE,
            photoPreview.w * SCALE, photoPreview.h * SCALE
          )

          // 2. Applica maschera cuore (destination-in = tieni solo dove la maschera è opaca)
          ctx.globalCompositeOperation = 'destination-in'
          const mask = await new Promise<HTMLImageElement>((res, rej) => {
            const m = document.createElement('img')
            m.onload = () => res(m); m.onerror = rej; m.src = MASK_SRC
          })
          ctx.drawImage(mask, 0, 0, OUT_SIZE, OUT_SIZE)
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

        {/* ── SINISTRA: Gallery + Preview ───────────────────────────────── */}
        <div className="shop-sticky" style={{ position: 'sticky', top: 88 }}>

          {/* Foto prodotto */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#f0f0f0', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
              <Image
                src="/images/shop/gadget/PHOTO-GLOBE-CUORE-P9008_HIGH.jpg"
                alt="Photo Globe Cuore"
                width={400} height={400}
                style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Etichetta preview */}
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>
            Anteprima foto (forma cuore)
          </p>

          {/* Preview a cuore */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: PREV_SIZE,
              height: PREV_SIZE,
              position: 'relative',
              overflow: 'hidden',
              // maschera CSS cuore per la preview
              WebkitMaskImage: `url('${MASK_SRC}')`,
              maskImage: `url('${MASK_SRC}')`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              background: '#e8e8e8',
              cursor: photoUrl ? 'grab' : 'default',
              userSelect: 'none',
            }}>
              {/* Foto */}
              {photoUrl && photoPreview && (
                <div
                  style={{
                    position: 'absolute',
                    left: photoPreview.x,
                    top:  photoPreview.y,
                    width: photoPreview.w,
                    height: photoPreview.h,
                    touchAction: 'none',
                  }}
                  onMouseDown={e => { e.preventDefault(); photoDragRef.current = { sx: e.clientX, sy: e.clientY, ox: photoOffset.x, oy: photoOffset.y } }}
                  onTouchStart={e => { photoDragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, ox: photoOffset.x, oy: photoOffset.y } }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none' }}
                    onLoad={e => {
                      const img = e.currentTarget
                      setPhotoNatSize({ w: img.naturalWidth, h: img.naturalHeight })
                    }}
                  />
                </div>
              )}

              {/* Placeholder upload */}
              {!photoUrl && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Upload size={24} color="#bbb" />
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
                Trascina la foto per riposizionarla nel cuore
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

        {/* ── DESTRA: Configuratore ─────────────────────────────────────── */}
        <div className="shop-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Photo Globe Cuore
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Cuore in acrilico effetto trasparente con la tua foto personalizzata. Al suo interno acqua e cuoricini colorati che fluttuano. La foto viene ritagliata automaticamente nella forma a cuore. Dimensioni 9×9 cm.
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
              <b>💡 Suggerimento:</b> regola lo zoom e trascina la foto per centrare il viso o il soggetto nel cuore.
            </div>
          )}

          {/* Caratteristiche prodotto */}
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

// ─── Stili condivisi ──────────────────────────────────────────────────────────

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

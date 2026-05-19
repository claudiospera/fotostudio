'use client'

// app/shop/decorazioni/forex/page.tsx
// Configuratore Stampa su Forex con scena ambiente proporzionale al formato

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Camera, Check, Minus, Plus, ShoppingCart, Upload, ZoomIn, RotateCcw } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

// ─── Dati prodotto ────────────────────────────────────────────────────────────

interface ForexVariant {
  id: string
  label: string
  price: number
  widthCm: number
  heightCm: number
}

const VARIANTS: ForexVariant[] = [
  { id: 'fx-15x20', label: '15×20 cm', price: 1000, widthCm: 15, heightCm: 20 },
  { id: 'fx-20x30', label: '20×30 cm', price: 2000, widthCm: 20, heightCm: 30 },
  { id: 'fx-30x30', label: '30×30 cm', price: 2500, widthCm: 30, heightCm: 30 },
  { id: 'fx-30x40', label: '30×40 cm', price: 3000, widthCm: 30, heightCm: 40 },
  { id: 'fx-30x50', label: '30×50 cm', price: 3500, widthCm: 30, heightCm: 50 },
  { id: 'fx-40x40', label: '40×40 cm', price: 3500, widthCm: 40, heightCm: 40 },
  { id: 'fx-40x50', label: '40×50 cm', price: 4000, widthCm: 40, heightCm: 50 },
  { id: 'fx-40x60', label: '40×60 cm', price: 4200, widthCm: 40, heightCm: 60 },
  { id: 'fx-50x50', label: '50×50 cm', price: 4500, widthCm: 50, heightCm: 50 },
  { id: 'fx-50x60', label: '50×60 cm', price: 4700, widthCm: 50, heightCm: 60 },
  { id: 'fx-50x70', label: '50×70 cm', price: 5000, widthCm: 50, heightCm: 70 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function getCoverBounds(natW: number, natH: number, contW: number, contH: number, zoom: number) {
  const coverScale = Math.max(contW / natW, contH / natH)
  const renderedW = natW * coverScale * zoom
  const renderedH = natH * coverScale * zoom
  return {
    maxX: Math.max(0, (renderedW - contW) / 2),
    maxY: Math.max(0, (renderedH - contH) / 2),
  }
}

function clampOffset(ox: number, oy: number, maxX: number, maxY: number) {
  return {
    x: Math.max(-maxX, Math.min(maxX, ox)),
    y: Math.max(-maxY, Math.min(maxY, oy)),
  }
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function ForexPage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [variant,       setVariant]       = useState(VARIANTS[3])  // 30×40 default
  const [rotated,       setRotated]       = useState(false)        // orizzontale/verticale
  const [qty,           setQty]           = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null)
  const [uploadedUrl,   setUploadedUrl]   = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [zoom,          setZoom]          = useState(1)

  // Dimensioni effettive con rotazione
  const panelW = rotated ? Math.max(variant.widthCm, variant.heightCm) : variant.widthCm
  const panelH = rotated ? Math.min(variant.widthCm, variant.heightCm) : variant.heightCm
  const isSquare = variant.widthCm === variant.heightCm

  useEffect(() => {
    return () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }
  }, [photoUrl])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(URL.createObjectURL(file))
    setUploadedUrl(null)
    setUploading(true)
    setZoom(1)
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
    setZoom(1)
  }, [photoUrl])

  const total = variant.price * qty

  function handleAddToCart() {
    if (uploading) return
    const orientLabel = isSquare ? '' : (rotated ? ' — Orizzontale' : ' — Verticale')
    addItem({
      productId:    'forex',
      variantId:    `${variant.id}${isSquare ? '' : rotated ? '__h' : '__v'}`,
      quantity:     qty,
      productName:  'Stampa su Forex',
      variantLabel: `${panelW}×${panelH} cm${orientLabel}`,
      price:        variant.price,
      image:        uploadedUrl ?? photoUrl ?? '/images/shop/forex/ambientata.png',
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2200)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '12px clamp(20px, 5vw, 60px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#999', maxWidth: 1140, margin: '0 auto' }}>
          <Link href="/shop"             style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <Link href="/shop/decorazioni" style={{ color: '#777', textDecoration: 'none' }}>Decorazioni</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Stampa su Forex</span>
        </nav>
      </div>

      {/* Layout a due colonne */}
      <div className="shop-cfg-grid" style={{
        maxWidth: 1140,
        margin: '0 auto',
        padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 460px) 1fr',
        gap: 'clamp(24px, 4vw, 64px)',
        alignItems: 'start',
      }}>

        {/* ── SINISTRA: Scena ambiente ─────────────────────────────────────── */}
        <div className="shop-sticky" style={{ position: 'sticky', top: 88 }}>

          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 20 }}>
            Anteprima in ambiente
          </p>

          <RoomScene
            widthCm={panelW}
            heightCm={panelH}
            photoUrl={photoUrl}
            zoom={zoom}
            onUploadClick={() => fileInputRef.current?.click()}
          />

          {/* Controlli foto */}
          {photoUrl ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8,
                    border: '1px solid #e0e0e0', background: '#fff',
                    fontSize: '12px', fontWeight: 600, color: '#555',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Upload size={12} /> Cambia foto
                </button>
                <button
                  onClick={handleRemovePhoto}
                  title="Rimuovi foto"
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #e0e0e0', background: '#fff',
                    fontSize: '12px', color: '#aaa', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '10px 22px', borderRadius: 10,
                  border: '1.5px dashed #c0c0c0', background: 'transparent',
                  fontSize: '12px', fontWeight: 600, color: '#888',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c1de'; e.currentTarget.style.color = '#00c1de' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#c0c0c0'; e.currentTarget.style.color = '#888' }}
              >
                <Upload size={13} /> Carica la tua foto
              </button>
            </div>
          )}

          {/* Tag riepilogo */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Tag>{panelW}×{panelH} cm</Tag>
            {!isSquare && <Tag>{rotated ? 'Orizzontale' : 'Verticale'}</Tag>}
            <Tag>Forex 5mm</Tag>
          </div>
        </div>

        {/* ── DESTRA: Configuratore ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Titolo */}
          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(24px, 3vw, 34px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Stampa su Forex
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Pannello in PVC espanso da 5mm con stampa fotografica diretta UV.<br />
              Effetto moderno e minimalista, leggerissimo e pronto da appendere.
            </p>
          </div>

          {/* Feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Pannello 5mm',        'PVC espanso rigido'],
              ['Stampa UV diretta',   'Alta risoluzione'],
              ['Bordi netti',         'Finitura professionale'],
              ['Pronto da appendere', 'Leggerissimo'],
            ].map(([title, sub]) => (
              <div key={title} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>{title}</p>
                <p style={{ fontSize: '11px', color: '#aaa' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Formato */}
          <Section title="Formato">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariant(v)}
                  style={{
                    padding: '9px 18px', borderRadius: 10,
                    border: `2px solid ${variant.id === v.id ? '#00c1de' : '#e0e0e0'}`,
                    background: variant.id === v.id ? 'rgba(0,193,222,0.07)' : '#fff',
                    color: variant.id === v.id ? '#00c1de' : '#333',
                    fontWeight: variant.id === v.id ? 700 : 500,
                    fontSize: '13px', cursor: 'pointer',
                    transition: 'all .15s', fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Orientamento — nascosto per formati quadrati */}
          {!isSquare && (
            <Section title="Orientamento">
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Verticale */}
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
                  {/* Icona verticale */}
                  <div style={{
                    width: 18, height: 24, border: `2px solid ${!rotated ? '#00c1de' : '#ccc'}`,
                    borderRadius: 3, flexShrink: 0, transition: 'border-color .15s',
                  }} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: !rotated ? '#00c1de' : '#0a0a0a', marginBottom: 2 }}>Verticale</p>
                    <p style={{ fontSize: '11px', color: '#888' }}>
                      {Math.min(variant.widthCm, variant.heightCm)}×{Math.max(variant.widthCm, variant.heightCm)} cm
                    </p>
                  </div>
                  {!rotated && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>

                {/* Orizzontale */}
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
                  {/* Icona orizzontale */}
                  <div style={{
                    width: 24, height: 18, border: `2px solid ${rotated ? '#00c1de' : '#ccc'}`,
                    borderRadius: 3, flexShrink: 0, transition: 'border-color .15s',
                  }} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: rotated ? '#00c1de' : '#0a0a0a', marginBottom: 2 }}>Orizzontale</p>
                    <p style={{ fontSize: '11px', color: '#888' }}>
                      {Math.max(variant.widthCm, variant.heightCm)}×{Math.min(variant.widthCm, variant.heightCm)} cm
                    </p>
                  </div>
                  {rotated && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              </div>
            </Section>
          )}

          {/* Quantità */}
          <Section title="Quantità">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
                <QtyBtn onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={14} color="#333" /></QtyBtn>
                <span style={{ width: 48, textAlign: 'center', fontWeight: 700, fontSize: '16px', color: '#0a0a0a' }}>{qty}</span>
                <QtyBtn onClick={() => setQty(q => q + 1)}><Plus size={14} color="#333" /></QtyBtn>
              </div>
              <span style={{ fontSize: '12px', color: '#aaa' }}>{formatPrice(variant.price)} × {qty} pz</span>
            </div>
          </Section>

          {/* Prezzo + CTA */}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Totale</p>
                <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '28px', color: '#00c1de', lineHeight: 1 }}>
                  {formatPrice(total)}
                </p>
              </div>
              {qty > 1 && <p style={{ fontSize: '12px', color: '#aaa' }}>{formatPrice(variant.price)} cad.</p>}
            </div>

            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8 }}>
              <b style={{ color: '#555' }}>{variant.label}</b>
              {' '}— Forex 5mm
              {!photoUrl && (
                <span style={{ color: '#f59e0b', fontWeight: 600 }}> · Foto non caricata</span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={uploading}
              style={{
                width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                background: addedFeedback ? '#22c55e' : uploading ? '#b0e6f0' : '#00c1de',
                color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                fontSize: '15px', cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'background .2s', opacity: uploading ? 0.75 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {addedFeedback ? (
                <><Check size={18} strokeWidth={3} /> Aggiunto al carrello!</>
              ) : uploading ? (
                <>Caricamento foto…</>
              ) : (
                <><ShoppingCart size={18} /> Aggiungi al carrello</>
              )}
            </button>

            <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
              Spedizione calcolata al checkout · Stampa UV professionale
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── RoomScene ────────────────────────────────────────────────────────────────
// Scena ambiente CSS con il pannello forex posizionato proporzionalmente

function RoomScene({
  widthCm, heightCm, photoUrl, zoom, onUploadClick,
}: {
  widthCm: number
  heightCm: number
  photoUrl: string | null
  zoom: number
  onUploadClick: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(400)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(Math.round(entry.contentRect.width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Dimensioni sala (px)
  const ROOM_W  = containerW
  const ROOM_H  = Math.round(containerW * (360 / 420))
  const FLOOR_H = Math.round(ROOM_H * 0.22)
  const WALL_H  = ROOM_H - FLOOR_H

  // Scala proporzionale base: a 420px di larghezza, 3.6px per cm
  // Con minimo garantito: il lato più corto non scende mai sotto 80px
  const CM_SCALE_BASE = (containerW / 420) * 3.6
  const minSidePx     = Math.round(containerW * 0.20)  // 20% del container = ~80px a 400px
  const shortSideCm   = Math.min(widthCm, heightCm)
  const CM_SCALE      = Math.max(CM_SCALE_BASE, minSidePx / shortSideCm)
  const panelW    = Math.round(widthCm  * CM_SCALE)
  const panelH    = Math.round(heightCm * CM_SCALE)

  // Posizione pannello: centrato orizzontalmente, a 42% dall'alto del muro
  const panelLeft = Math.round((ROOM_W - panelW) / 2)
  const panelTop  = Math.round(WALL_H * 0.42 - panelH / 2)

  // Chiodo
  const nailTop  = Math.max(4, panelTop - 5)
  const nailLeft = Math.round(ROOM_W / 2)

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: ROOM_H,
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Muro */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: WALL_H,
        background: 'linear-gradient(180deg, #ede5d8 0%, #e4dcd0 50%, #dbd2c5 100%)',
      }} />
      {/* Texture muro — righe orizzontali sottili */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: WALL_H,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(0,0,0,0.018) 47px, rgba(0,0,0,0.018) 48px)',
        pointerEvents: 'none',
      }} />

      {/* Pavimento */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: FLOOR_H,
        background: 'linear-gradient(180deg, #c4a07a 0%, #b08866 100%)',
      }} />
      {/* Texture legno */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0, height: FLOOR_H,
        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px)',
        pointerEvents: 'none',
      }} />

      {/* Battiscopa */}
      <div style={{
        position: 'absolute',
        bottom: FLOOR_H,
        left: 0, right: 0,
        height: Math.max(8, Math.round(containerW * 0.022)),
        background: 'linear-gradient(180deg, #f5ede0 0%, #e8dfd2 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
      }} />

      {/* Ombra ambiente sul pavimento (angolo in basso a sinistra/destra) */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0,
        width: '30%', height: FLOOR_H,
        background: 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0, right: 0,
        width: '30%', height: FLOOR_H,
        background: 'linear-gradient(270deg, rgba(0,0,0,0.10) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Chiodo */}
      <div style={{
        position: 'absolute',
        top: nailTop,
        left: nailLeft,
        transform: 'translateX(-50%)',
        width: 5, height: 5,
        borderRadius: '50%',
        background: '#8a7060',
        boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
        zIndex: 3,
      }} />

      {/* Pannello forex */}
      <div
        style={{
          position: 'absolute',
          top: panelTop,
          left: panelLeft,
          width: panelW,
          height: panelH,
          boxShadow: `
            ${Math.round(containerW * 0.005)}px ${Math.round(containerW * 0.016)}px ${Math.round(containerW * 0.055)}px rgba(0,0,0,0.28),
            0 2px 6px rgba(0,0,0,0.14)
          `,
          transition: 'top .35s ease, left .35s ease, width .35s ease, height .35s ease',
          zIndex: 2,
        }}
      >
        <PhotoSlot
          w={panelW} h={panelH}
          photoUrl={photoUrl} zoom={zoom}
          onUploadClick={onUploadClick}
        />
      </div>

      {/* Luce ambiente radiale */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 35% 15%, rgba(255,240,200,0.14) 0%, transparent 65%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Vignetta ai bordi */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse at 0% 50%, rgba(0,0,0,0.10) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 50%, rgba(0,0,0,0.10) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.06) 0%, transparent 40%)
        `,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
    </div>
  )
}

// ─── PhotoSlot ────────────────────────────────────────────────────────────────
// Upload + zoom + drag — stesso pattern di cornici e tela

function PhotoSlot({
  w, h, photoUrl, zoom, onUploadClick,
}: {
  w: number; h: number
  photoUrl: string | null
  zoom: number
  onUploadClick: () => void
}) {
  const [offset,      setOffset]      = useState({ x: 0, y: 0 })
  const [isDragging,  setIsDragging]  = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const dragRef  = useRef<{ startMouseX: number; startMouseY: number; startOffsetX: number; startOffsetY: number } | null>(null)
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

  // Ri-clamp al cambio di zoom o dimensioni pannello
  useEffect(() => {
    if (!naturalSize) return
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, w, h, zoom)
    setOffset(prev => clampOffset(prev.x, prev.y, maxX, maxY))
  }, [zoom, w, h, naturalSize])

  // Listener sempre attivi — evita race condition su isDragging
  useEffect(() => {
    if (!photoUrl) return
    const onMove = (clientX: number, clientY: number) => {
      if (!dragRef.current) return
      const { w: cw, h: ch, zoom: cz, natW, natH } = stateRef.current
      if (!natW || !natH) return
      const { maxX, maxY } = getCoverBounds(natW, natH, cw, ch, cz)
      const dx = clientX - dragRef.current.startMouseX
      const dy = clientY - dragRef.current.startMouseY
      setOffset(clampOffset(dragRef.current.startOffsetX + dx, dragRef.current.startOffsetY + dy, maxX, maxY))
    }
    const onEnd = () => { if (!dragRef.current) return; dragRef.current = null; setIsDragging(false) }
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove',  onMouseMove)
    window.addEventListener('mouseup',    onEnd)
    window.addEventListener('touchmove',  onTouchMove, { passive: false })
    window.addEventListener('touchend',   onEnd)
    return () => {
      window.removeEventListener('mousemove',  onMouseMove)
      window.removeEventListener('mouseup',    onEnd)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onEnd)
    }
  }, [photoUrl])

  const canDrag = naturalSize != null && (() => {
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, w, h, zoom)
    return maxX > 0.5 || maxY > 0.5
  })()

  function startDrag(clientX: number, clientY: number) {
    if (!canDrag) return
    dragRef.current = {
      startMouseX: clientX, startMouseY: clientY,
      startOffsetX: stateRef.current.offset.x, startOffsetY: stateRef.current.offset.y,
    }
    setIsDragging(true)
  }

  if (photoUrl) {
    const coverScale = naturalSize ? Math.max(w / naturalSize.w, h / naturalSize.h) : 1
    const imgW = naturalSize ? naturalSize.w * coverScale * zoom : w
    const imgH = naturalSize ? naturalSize.h * coverScale * zoom : h
    const posX = (w - imgW) / 2 + offset.x
    const posY = (h - imgH) / 2 + offset.y

    return (
      <div
        style={{
          width: w, height: h,
          overflow: 'hidden', position: 'relative',
          cursor: !canDrag ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: canDrag ? 'none' : 'auto',
          backgroundImage: `url(${photoUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: naturalSize ? `${imgW}px ${imgH}px` : 'cover',
          backgroundPosition: naturalSize ? `${posX}px ${posY}px` : 'center',
          transition: isDragging ? 'none' : 'background-size .08s linear, background-position .08s linear',
        }}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl} alt="" style={{ display: 'none' }}
          onLoad={e => {
            const img = e.currentTarget
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
          }}
        />
      </div>
    )
  }

  // Placeholder upload
  return (
    <button
      onClick={onUploadClick}
      style={{
        width: w, height: h,
        border: '2px dashed #c8c8c8',
        background: 'linear-gradient(135deg, #efefef 0%, #e4e4e4 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 6, cursor: 'pointer', padding: 0,
        transition: 'border-color .15s, background .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c1de'; e.currentTarget.style.background = 'linear-gradient(135deg, #e8f9fc 0%, #d8f4f9 100%)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#c8c8c8'; e.currentTarget.style.background = 'linear-gradient(135deg, #efefef 0%, #e4e4e4 100%)' }}
      aria-label="Carica la tua foto"
    >
      <Camera size={Math.max(14, Math.min(22, w / 8))} color="#aaa" strokeWidth={1.5} />
      {w > 60 && (
        <span style={{ fontSize: '9px', color: '#bbb', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Carica foto
        </span>
      )}
    </button>
  )
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px', lineHeight: 1 }}>
      {children}
    </span>
  )
}

function QtyBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ width: 44, height: 44, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#ebebeb')}
      onMouseLeave={e => (e.currentTarget.style.background = '#f7f7f7')}
    >
      {children}
    </button>
  )
}

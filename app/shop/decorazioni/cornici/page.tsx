'use client'

// app/shop/decorazioni/cornici/page.tsx
// Configuratore cornici con upload foto e zoom live

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Camera, Minus, Plus, ShoppingCart, Check, Upload, ZoomIn, RotateCcw } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'
import type { FrameOption, PrintTypeOption, PassepartoutOption, ProductVariant } from '@/lib/shop/types'

// ─── Dati prodotto ────────────────────────────────────────────────────────────

const VARIANTS: (ProductVariant & { widthCm: number; heightCm: number })[] = [
  { id: '10x15', label: '10×15 cm', price:  800, widthCm: 10, heightCm: 15 },
  { id: '13x18', label: '13×18 cm', price: 1000, widthCm: 13, heightCm: 18 },
  { id: '15x20', label: '15×20 cm', price: 1200, widthCm: 15, heightCm: 20 },
  { id: '20x30', label: '20×30 cm', price: 1400, widthCm: 20, heightCm: 30 },
  { id: '30x40', label: '30×40 cm', price: 2000, widthCm: 30, heightCm: 40 },
  { id: '30x60', label: '30×60 cm', price: 2600, widthCm: 30, heightCm: 60 },
  { id: '40x50', label: '40×50 cm', price: 2500, widthCm: 40, heightCm: 50 },
  { id: '40x60', label: '40×60 cm', price: 2800, widthCm: 40, heightCm: 60 },
  { id: '50x60', label: '50×60 cm', price: 3000, widthCm: 50, heightCm: 60 },
  { id: '50x70', label: '50×70 cm', price: 3200, widthCm: 50, heightCm: 70 },
]

const FRAMES: (FrameOption & { image: string; gallery: string[] })[] = [
  { id: 'nero',       label: 'Legno nera grafite', color: '#1a1a1a', border: '#000000', image: '/images/shop/cornici/angolo-nero.webp',
    gallery: ['/images/shop/cornici/preview-nero-1.jpg', '/images/shop/cornici/angolo-nero.webp', '/images/shop/cornici/schema-20x.png'] },
  { id: 'bianco',     label: 'Legno bianca',       color: '#FFFFFF', border: '#d0d0d0', image: '/images/shop/cornici/angolo-bianco.webp',
    gallery: ['/images/shop/cornici/preview-bianco-1.jpg', '/images/shop/cornici/angolo-bianco.webp', '/images/shop/cornici/schema-20x.png'] },
  { id: 'naturale',   label: 'Legno naturale',     color: '#C19A6B', border: '#A0784A', image: '/images/shop/cornici/angolo-naturale.webp',
    gallery: ['/images/shop/cornici/preview-naturale-1.jpg', '/images/shop/cornici/angolo-naturale.webp', '/images/shop/cornici/schema-20x.png'] },
  { id: 'argentato',  label: 'Legno argento',      color: '#C0C0C0', border: '#A8A8A8', image: '/images/shop/cornici/angolo-argento.png',
    gallery: ['/images/shop/cornici/preview-argento-1.png', '/images/shop/cornici/angolo-argento.png', '/images/shop/cornici/schema-20x15.png'] },
  { id: 'oro-antico', label: 'Legno oro antico',   color: '#D4AF37', border: '#B8960C', image: '/images/shop/cornici/angolo-oro.png',
    gallery: ['/images/shop/cornici/preview-oro-1.png', '/images/shop/cornici/angolo-oro.png', '/images/shop/cornici/schema-20x15.png'] },
  { id: 'noce-oro',   label: 'Noce bordo dorato',  color: '#5C3318', border: '#C8A040', image: '/images/shop/cornici/angolo-noce-oro.png',
    gallery: ['/images/shop/cornici/preview-noce-oro-1.png', '/images/shop/cornici/angolo-noce-oro.png', '/images/shop/cornici/schema-25x15.png'] },
]

const PRINT_TYPES: PrintTypeOption[] = [
  { id: 'foto',       label: 'Carta Fotografica',     description: 'Lucida, colori brillanti',  extraPrice: 0 },
  { id: 'hahnemuhle', label: 'Hahnemühle Matt Fibre', description: 'Fine art, opaca, premium',  extraPrice: 0 },
]

// Prezzo stampa (in centesimi) per formato e tipo di carta
// Carta fotografica: prezzi Stampe Classiche / Poster (1 pz)
// Hahnemühle Matte FineArt 200 g/m²: prezzo listino 1 pz
const PRINT_PRICES: Record<string, { foto: number; hahnemuhle: number }> = {
  '10x15': { foto:  200, hahnemuhle:  400 },
  '13x18': { foto:  250, hahnemuhle:  600 },
  '15x20': { foto:  300, hahnemuhle:  700 },
  '20x30': { foto:  600, hahnemuhle: 1200 },
  '30x40': { foto: 1000, hahnemuhle: 1800 },
  '30x60': { foto: 1500, hahnemuhle: 2600 },
  '40x50': { foto: 1700, hahnemuhle: 2700 },
  '40x60': { foto: 1900, hahnemuhle: 2900 },
  '50x60': { foto: 2300, hahnemuhle: 3400 },
  '50x70': { foto: 2500, hahnemuhle: 3800 },
}

const PASSEPARTOUT_OPTIONS: PassepartoutOption[] = [
  { id: 'bianco', label: 'Bianco', color: '#FFFFFF', extraPrice: 500 },
  { id: 'nero',   label: 'Nero',   color: '#1a1a1a', extraPrice: 500 },
]

// Formati che supportano schienale (solo fino a 20×30)
const SCHIENALE_VARIANTS = new Set(['10x15', '13x18', '15x20', '20x30'])
const SCHIENALE_PRICE = 0 // gratuito

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function loadImgCornici(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src })
}
async function renderSingleCanvasCornici(
  photoUrl: string, natW: number, natH: number, zoom: number,
  offsetXNorm: number, offsetYNorm: number,
  canvasW: number, canvasH: number,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas'); canvas.width = canvasW; canvas.height = canvasH
  const ctx = canvas.getContext('2d'); if (!ctx) return null
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvasW, canvasH)
  let img: HTMLImageElement
  try { img = await loadImgCornici(photoUrl) } catch { return null }
  const cs = Math.max(canvasW / natW, canvasH / natH)
  const iW = natW * cs * zoom, iH = natH * cs * zoom
  const offX = offsetXNorm * canvasW, offY = offsetYNorm * canvasH
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, canvasW, canvasH); ctx.clip()
  ctx.drawImage(img, (canvasW - iW) / 2 + offX, (canvasH - iH) / 2 + offY, iW, iH)
  ctx.restore()
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.93))
}

const FRAME_PX = 20  // spessore cornice in px
const PASSE_PX = 28  // spessore passepartout in px
const PHOTO_W  = 180 // larghezza foto nell'anteprima in px

// ─── Componente principale ────────────────────────────────────────────────────

export default function CorniciPage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Configuratore
  const [variant,       setVariant]       = useState(VARIANTS[0])
  const [frame,         setFrame]         = useState(FRAMES[1])
  const [printType,     setPrintType]     = useState(PRINT_TYPES[0])
  const [passeEnabled,      setPasseEnabled]      = useState(false)
  const [passe,             setPasse]             = useState(PASSEPARTOUT_OPTIONS[0])
  const [schienaleEnabled,  setSchienaleEnabled]  = useState(false)
  const [qty,           setQty]           = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [galleryIdx,    setGalleryIdx]    = useState(0)
  const [rotated,       setRotated]       = useState(false)

  // Reset gallery index quando cambia la cornice
  const handleFrameChange = useCallback((f: typeof FRAMES[number]) => {
    setFrame(f)
    setGalleryIdx(0)
  }, [])

  // Upload foto
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null)
  const [uploadedUrl,   setUploadedUrl]   = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [photoFilename, setPhotoFilename] = useState<string | undefined>(undefined)
  const [zoom,          setZoom]          = useState(1)
  const [photoOffset,   setPhotoOffset]   = useState({ x: 0, y: 0 })
  const [photoNatSize,  setPhotoNatSize]  = useState<{ w: number; h: number } | null>(null)
  const [isRendering,   setIsRendering]   = useState(false)

  // Cleanup object URL quando cambia o al unmount
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(URL.createObjectURL(file))
    setUploadedUrl(null)
    setPhotoFilename(file.name)
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
    setPhotoFilename(undefined)
    setZoom(1)
    setPhotoOffset({ x: 0, y: 0 })
    setPhotoNatSize(null)
  }, [photoUrl])

  // Prezzi
  const printPrice = useMemo(
    () => PRINT_PRICES[variant.id]?.[printType.id as 'foto' | 'hahnemuhle'] ?? 0,
    [variant, printType]
  )
  const schienaleAvailable = SCHIENALE_VARIANTS.has(variant.id)
  const unitPrice = useMemo(
    () => variant.price + printPrice + (passeEnabled ? passe.extraPrice : 0) + (schienaleEnabled && schienaleAvailable ? SCHIENALE_PRICE : 0),
    [variant, printPrice, passeEnabled, passe, schienaleEnabled, schienaleAvailable]
  )
  const total = unitPrice * qty

  // Reset orientamento e schienale quando cambia il formato
  useEffect(() => {
    setRotated(false)
    if (!SCHIENALE_VARIANTS.has(variant.id)) setSchienaleEnabled(false)
  }, [variant.id])

  // Dimensioni effettive con orientamento
  const effW = rotated ? variant.heightCm : variant.widthCm
  const effH = rotated ? variant.widthCm  : variant.heightCm
  const photoH = Math.round(PHOTO_W * (effH / effW))

  async function handleAddToCart() {
    if (uploading || isRendering) return
    const label = [
      variant.label + (rotated ? ' — Orizzontale' : ''),
      printType.label,
      `Cornice ${frame.label}`,
      passeEnabled ? `Passepartout ${passe.label}` : null,
      schienaleEnabled && schienaleAvailable ? 'Con schienale' : null,
    ].filter(Boolean).join(' — ')

    let imageUrl = uploadedUrl ?? photoUrl ?? 'https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=800&q=80'
    const filename = photoFilename

    addItem({
      productId:    'cornici',
      variantId:    `${variant.id}__${frame.id}__${printType.id}__${passeEnabled ? passe.id : 'no-passe'}__${schienaleEnabled && schienaleAvailable ? 'schienale' : 'no-schienale'}`,
      quantity:     qty,
      productName:  'Foto in Cornice',
      variantLabel: label,
      price:        unitPrice,
      image:        imageUrl,
      filename,
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2200)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>

      {/* Input file nascosto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '12px clamp(20px, 5vw, 60px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#999' }}>
          <Link href="/shop"             style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <Link href="/shop/decorazioni" style={{ color: '#777', textDecoration: 'none' }}>Decorazioni</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Foto in Cornice</span>
        </nav>
      </div>

      {/* Layout a due colonne */}
      <div className="shop-cfg-grid" style={{
        maxWidth: 1140,
        margin: '0 auto',
        padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 420px) 1fr',
        gap: 'clamp(24px, 4vw, 64px)',
        alignItems: 'start',
      }}>

        {/* ── COLONNA SINISTRA: Gallery + Anteprima ───────────────────────── */}
        <div className="shop-sticky" style={{ position: 'sticky', top: 88 }}>

          {/* Gallery cornice selezionata */}
          <div style={{ marginBottom: 20 }}>
            {/* Immagine principale */}
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#f0f0f0', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frame.gallery[galleryIdx]}
                alt={frame.label}
                style={{ width: '100%', maxHeight: 380, objectFit: 'contain', display: 'block', transition: 'opacity .2s' }}
              />
            </div>
            {/* Thumbnails — visibili solo se ci sono più immagini */}
            {frame.gallery.length > 1 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {frame.gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIdx(i)}
                    style={{
                      flex: 1, padding: 0, border: `2.5px solid ${galleryIdx === i ? '#00c1de' : '#e0e0e0'}`,
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      boxShadow: galleryIdx === i ? '0 0 0 2px rgba(0,193,222,0.18)' : 'none',
                      transition: 'border-color .15s', background: '#f0f0f0',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 20 }}>
            Anteprima personalizzata
          </p>

          {/* Stage */}
          <div style={{
            background: '#ececec',
            borderRadius: 20,
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}>
            {/* Cornice */}
            <div style={{
              display: 'inline-flex',
              borderRadius: 3,
              boxShadow: `
                0 2px 8px rgba(0,0,0,0.18),
                0 12px 40px rgba(0,0,0,0.14),
                inset 0 0 0 2px ${frame.border}
              `,
              transition: 'box-shadow .25s',
            }}>
              <div style={{
                padding: FRAME_PX,
                background: frame.color,
                borderRadius: 3,
                transition: 'background .2s',
              }}>
                {/* Passepartout */}
                {passeEnabled ? (
                  <div style={{
                    padding: PASSE_PX,
                    background: passe.color,
                    transition: 'background .2s',
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                  }}>
                    <PhotoSlot
                      w={PHOTO_W} h={photoH}
                      photoUrl={photoUrl} zoom={zoom}
                      onUploadClick={() => fileInputRef.current?.click()}
                      onOffsetChange={(xNorm, yNorm) => setPhotoOffset({ x: xNorm, y: yNorm })}
                      onNatSize={(nw, nh) => setPhotoNatSize({ w: nw, h: nh })}
                    />
                  </div>
                ) : (
                  <PhotoSlot
                    w={PHOTO_W} h={photoH}
                    photoUrl={photoUrl} zoom={zoom}
                    onUploadClick={() => fileInputRef.current?.click()}
                    onOffsetChange={(xNorm, yNorm) => setPhotoOffset({ x: xNorm, y: yNorm })}
                    onNatSize={(nw, nh) => setPhotoNatSize({ w: nw, h: nh })}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Controlli foto */}
          {photoUrl ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Slider zoom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ZoomIn size={14} color="#888" />
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="range"
                    min={1} max={2} step={0.01}
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: '#00c1de',
                      cursor: 'pointer',
                      height: 4,
                    }}
                    aria-label="Zoom foto"
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#aaa', minWidth: 32, textAlign: 'right' }}>
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Azioni foto */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8,
                    border: '1px solid #e0e0e0', background: '#fff',
                    fontSize: '12px', fontWeight: 600, color: '#555',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                  }}
                >
                  <Upload size={12} />
                  Cambia foto
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
            /* Suggerimento upload */
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
                <Upload size={13} />
                Carica la tua foto
              </button>
            </div>
          )}

          {/* Tag riepilogo */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Tag>{variant.label}</Tag>
            <Tag>{frame.label}</Tag>
            {passeEnabled && <Tag>Passepartout {passe.label}</Tag>}
          </div>
        </div>

        {/* ── COLONNA DESTRA: Configuratore ───────────────────────────────── */}
        <div className="shop-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Titolo */}
          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(24px, 3vw, 34px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Foto in Cornice
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              La tua foto stampata e incorniciata, pronta da appendere.<br />
              Scegli la cornice, il tipo di carta e il passepartout.
            </p>
          </div>

          {/* Upload foto */}
          <Section title="La tua foto">
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
          </Section>

          {/* Orientamento — visibile solo quando c'è una foto */}
          {photoUrl && (
            <Section title="Orientamento">
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
                    <p style={{ fontSize: '11px', color: '#888' }}>{variant.widthCm}×{variant.heightCm} cm</p>
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
                    <p style={{ fontSize: '11px', color: '#888' }}>{variant.heightCm}×{variant.widthCm} cm</p>
                  </div>
                  {rotated && <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#fff" strokeWidth={3} /></div>}
                </button>
              </div>
            </Section>
          )}

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

          {/* Tipo di stampa */}
          <Section title="Tipo di stampa">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {PRINT_TYPES.map((pt) => {
                const active = printType.id === pt.id
                return (
                  <button
                    key={pt.id}
                    onClick={() => setPrintType(pt)}
                    style={{
                      padding: '14px 16px', borderRadius: 12,
                      border: `2px solid ${active ? '#00c1de' : '#e0e0e0'}`,
                      background: active ? 'rgba(0,193,222,0.06)' : '#fff',
                      textAlign: 'left', cursor: 'pointer',
                      transition: 'all .15s', fontFamily: 'Montserrat, sans-serif',
                      position: 'relative',
                    }}
                  >
                    {active && (
                      <span style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#00c1de',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                    <p style={{ fontSize: '13px', fontWeight: 700, color: active ? '#00c1de' : '#0a0a0a', marginBottom: 3 }}>
                      {pt.label}
                    </p>
                    <p style={{ fontSize: '11px', color: '#888' }}>{pt.description}</p>
                    {pt.extraPrice > 0 && (
                      <p style={{ fontSize: '11px', color: '#00c1de', fontWeight: 700, marginTop: 4 }}>
                        +{formatPrice(pt.extraPrice)}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Cornice */}
          <Section title={`Cornice — ${frame.label}`}>
            <div className="shop-format-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
              {FRAMES.map((f) => {
                const active = frame.id === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => handleFrameChange(f)}
                    title={f.label}
                    style={{
                      padding: 0, border: `2.5px solid ${active ? '#00c1de' : '#e0e0e0'}`,
                      borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      background: '#fff', position: 'relative',
                      boxShadow: active ? '0 0 0 3px rgba(0,193,222,0.18)' : 'none',
                      transition: 'all .15s',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.image} alt={f.label}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{
                      padding: '5px 6px',
                      fontSize: '10px', fontWeight: active ? 700 : 500,
                      color: active ? '#00c1de' : '#555',
                      textAlign: 'center', lineHeight: 1.25,
                      background: active ? 'rgba(0,193,222,0.06)' : '#fafafa',
                    }}>
                      {f.label}
                    </div>
                    {active && (
                      <div style={{
                        position: 'absolute', top: 5, right: 5,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#00c1de',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Passepartout */}
          <Section title="Passepartout">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: passeEnabled ? 16 : 0 }}>
              <button
                onClick={() => setPasseEnabled(!passeEnabled)}
                style={{
                  width: 50, height: 28, borderRadius: 14,
                  background: passeEnabled ? '#00c1de' : '#d0d0d0',
                  position: 'relative', border: 'none', cursor: 'pointer',
                  transition: 'background .2s', padding: 0, flexShrink: 0,
                }}
                aria-label="Attiva/disattiva passepartout"
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, left: passeEnabled ? 25 : 3,
                  transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
              <span style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>
                {passeEnabled ? `Attivo (+${formatPrice(passe.extraPrice)})` : 'Non attivo'}
              </span>
            </div>
            {passeEnabled && (
              <div style={{ display: 'flex', gap: 10 }}>
                {PASSEPARTOUT_OPTIONS.map((p) => {
                  const active = passe.id === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPasse(p)}
                      style={{
                        padding: '9px 20px', borderRadius: 10,
                        border: `2px solid ${active ? '#00c1de' : '#e0e0e0'}`,
                        background: active ? 'rgba(0,193,222,0.07)' : '#fff',
                        color: active ? '#00c1de' : '#333',
                        fontWeight: active ? 700 : 500, fontSize: '13px',
                        cursor: 'pointer', transition: 'all .15s',
                        fontFamily: 'Montserrat, sans-serif',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: p.color, border: '1px solid #ccc', flexShrink: 0 }} />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            )}
          </Section>

          {/* Schienale */}
          {schienaleAvailable && (
            <Section title="Schienale">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setSchienaleEnabled(!schienaleEnabled)}
                  style={{
                    width: 50, height: 28, borderRadius: 14,
                    background: schienaleEnabled ? '#00c1de' : '#d0d0d0',
                    position: 'relative', border: 'none', cursor: 'pointer',
                    transition: 'background .2s', padding: 0, flexShrink: 0,
                  }}
                  aria-label="Attiva/disattiva schienale"
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: schienaleEnabled ? 25 : 3,
                    transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
                <span style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>
                  {schienaleEnabled ? 'Attivo (gratuito)' : 'Non attivo'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#aaa', marginTop: 8 }}>
                Pannello rigido posteriore — mantiene la stampa piatta e protetta (disponibile fino a 20×30 cm)
              </p>
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
              <span style={{ fontSize: '12px', color: '#aaa' }}>{formatPrice(unitPrice)} × {qty} pz</span>
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
              {qty > 1 && <p style={{ fontSize: '12px', color: '#aaa' }}>{formatPrice(unitPrice)} cad.</p>}
            </div>

            {/* Riepilogo voci */}
            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.8, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cornice {frame.label} · {variant.label}</span>
                <span style={{ fontWeight: 600, color: '#555' }}>{formatPrice(variant.price)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Stampa {printType.label}</span>
                <span style={{ fontWeight: 600, color: '#555' }}>{formatPrice(printPrice)}</span>
              </div>
              {passeEnabled && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Passepartout {passe.label}</span>
                  <span style={{ fontWeight: 600, color: '#555' }}>+{formatPrice(passe.extraPrice)}</span>
                </div>
              )}
              {schienaleEnabled && schienaleAvailable && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Schienale</span>
                  <span style={{ fontWeight: 600, color: '#22c55e' }}>Gratuito</span>
                </div>
              )}
              {qty > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: 4, marginTop: 2 }}>
                  <span>× {qty} copie</span>
                  <span style={{ fontWeight: 600, color: '#555' }}>{formatPrice(unitPrice)} cad.</span>
                </div>
              )}
              {!photoUrl && (
                <div style={{ color: '#f59e0b', fontWeight: 600, marginTop: 2 }}>Foto non ancora caricata</div>
              )}
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
              transition: 'all .15s',
            }}>
              🛒 Vai al carrello
            </Link>

            <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
              Spedizione calcolata al checkout · Produzione artigianale
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componenti ───────────────────────────────────────────────────────────

/** Bounds di drag considerando l'overflow reale di object-fit:cover + zoom */
function getCoverBounds(natW: number, natH: number, contW: number, contH: number, zoom: number) {
  // Fattore di scala applicato da object-fit:cover
  const coverScale = Math.max(contW / natW, contH / natH)
  // Dimensioni effettive dell'immagine dopo cover e scale(zoom)
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

/** Foto nella cornice: se caricata mostra l'immagine con zoom + drag, altrimenti placeholder cliccabile */
function PhotoSlot({
  w, h, photoUrl, zoom, onUploadClick, onOffsetChange, onNatSize,
}: {
  w: number; h: number
  photoUrl: string | null
  zoom: number
  onUploadClick: () => void
  onOffsetChange?: (xNorm: number, yNorm: number) => void
  onNatSize?: (nw: number, nh: number) => void
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  // Dimensioni naturali della foto (lette onLoad)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const dragRef = useRef<{
    startMouseX: number
    startMouseY: number
    startOffsetX: number
    startOffsetY: number
  } | null>(null)
  // Ref per leggere i valori aggiornati dentro i listener (no stale closure)
  const stateRef = useRef({ offset: { x: 0, y: 0 }, w, h, zoom, natW: 0, natH: 0 })
  useEffect(() => {
    stateRef.current = {
      offset, w, h, zoom,
      natW: naturalSize?.w ?? 0,
      natH: naturalSize?.h ?? 0,
    }
  }, [offset, w, h, zoom, naturalSize])

  // Reset posizione e dimensioni naturali quando cambia la foto
  useEffect(() => {
    setOffset({ x: 0, y: 0 })
    setNaturalSize(null)
    setIsDragging(false)
    dragRef.current = null
  }, [photoUrl])

  // Ri-clamp quando cambiano zoom o dimensioni variante
  useEffect(() => {
    if (!naturalSize) return
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, w, h, zoom)
    setOffset(prev => clampOffset(prev.x, prev.y, maxX, maxY))
  }, [zoom, w, h, naturalSize])

  // Listener SEMPRE attivi quando c'è una foto — non condizionati a isDragging
  // per evitare la race condition tra setIsDragging e useEffect
  useEffect(() => {
    if (!photoUrl) return

    const onMove = (clientX: number, clientY: number) => {
      if (!dragRef.current) return
      const { w: cw, h: ch, zoom: cz, natW, natH } = stateRef.current
      if (!natW || !natH) return
      const { maxX, maxY } = getCoverBounds(natW, natH, cw, ch, cz)
      const dx = clientX - dragRef.current.startMouseX
      const dy = clientY - dragRef.current.startMouseY
      const clamped = clampOffset(dragRef.current.startOffsetX + dx, dragRef.current.startOffsetY + dy, maxX, maxY)
      setOffset(clamped)
      onOffsetChange?.(clamped.x / w, clamped.y / h)
    }
    const onEnd = () => {
      if (!dragRef.current) return
      dragRef.current = null
      setIsDragging(false)
    }
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (!dragRef.current) return  // non bloccare lo scroll se non si sta trascinando
      e.preventDefault()
      onMove(e.touches[0].clientX, e.touches[0].clientY)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend',  onEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend',  onEnd)
    }
  }, [photoUrl]) // ← dipende solo da photoUrl, non da isDragging

  // Può trascinare se c'è overflow reale (da cover o da zoom)
  const canDrag = naturalSize != null && (() => {
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, w, h, zoom)
    return maxX > 0.5 || maxY > 0.5
  })()

  function startDrag(clientX: number, clientY: number) {
    if (!canDrag) return
    dragRef.current = {
      startMouseX:  clientX,
      startMouseY:  clientY,
      startOffsetX: stateRef.current.offset.x,
      startOffsetY: stateRef.current.offset.y,
    }
    setIsDragging(true)
  }

  if (photoUrl) {
    // background-image con size esplicito: zoom è incorporato nel calcolo
    const coverScale = naturalSize ? Math.max(w / naturalSize.w, h / naturalSize.h) : 1
    const imgW = naturalSize ? naturalSize.w * coverScale * zoom : w
    const imgH = naturalSize ? naturalSize.h * coverScale * zoom : h
    const posX = (w - imgW) / 2 + offset.x
    const posY = (h - imgH) / 2 + offset.y

    return (
      <div
        style={{
          width: w, height: h,
          overflow: 'hidden',
          position: 'relative',
          cursor: !canDrag ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          backgroundImage: `url(${photoUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: naturalSize ? `${imgW}px ${imgH}px` : 'cover',
          backgroundPosition: naturalSize ? `${posX}px ${posY}px` : 'center',
          transition: isDragging ? 'none' : 'background-size .08s linear, background-position .08s linear',
        }}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onTouchStart={e => { startDrag(e.touches[0].clientX, e.touches[0].clientY) }}
      >
        {/* img nascosta solo per leggere naturalWidth/naturalHeight */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl} alt=""
          style={{ display: 'none' }}
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
        width: w, height: h,
        border: '2px dashed #c8c8c8',
        background: 'linear-gradient(135deg, #efefef 0%, #e4e4e4 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 8, cursor: 'pointer', padding: 0,
        transition: 'border-color .15s, background .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#00c1de'
        e.currentTarget.style.background = 'linear-gradient(135deg, #e8f9fc 0%, #d8f4f9 100%)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#c8c8c8'
        e.currentTarget.style.background = 'linear-gradient(135deg, #efefef 0%, #e4e4e4 100%)'
      }}
      aria-label="Carica la tua foto"
    >
      <Camera size={22} color="#aaa" strokeWidth={1.5} />
      <span style={{ fontSize: '9px', color: '#bbb', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        Carica foto
      </span>
    </button>
  )
}

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

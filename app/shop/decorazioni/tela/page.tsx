'use client'

// app/shop/decorazioni/tela/page.tsx
// Configuratore Stampa su Tela — scena ambiente + orientamento + bordo

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Camera, Check, Minus, Plus, ShoppingCart, Upload, ZoomIn, RotateCcw } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

// ─── Dati prodotto ────────────────────────────────────────────────────────────

interface TelaVariant {
  id: string
  label: string
  price: number
  widthCm: number
  heightCm: number
}

interface BorderType {
  id: string
  label: string
  description: string
  borderColor: string | null
}

const VARIANTS: TelaVariant[] = [
  { id: 'tel-30x30',  label: '30×30 cm',  price:  3000, widthCm: 30,  heightCm: 30  },
  { id: 'tel-30x40',  label: '30×40 cm',  price:  3500, widthCm: 30,  heightCm: 40  },
  { id: 'tel-30x50',  label: '30×50 cm',  price:  4000, widthCm: 30,  heightCm: 50  },
  { id: 'tel-40x40',  label: '40×40 cm',  price:  4000, widthCm: 40,  heightCm: 40  },
  { id: 'tel-40x50',  label: '40×50 cm',  price:  4500, widthCm: 40,  heightCm: 50  },
  { id: 'tel-40x60',  label: '40×60 cm',  price:  4700, widthCm: 40,  heightCm: 60  },
  { id: 'tel-50x70',  label: '50×70 cm',  price:  6000, widthCm: 50,  heightCm: 70  },
  { id: 'tel-70x100', label: '70×100 cm', price: 10000, widthCm: 70,  heightCm: 100 },
]

const BORDER_TYPES: BorderType[] = [
  { id: 'ripiegato',  label: 'Ripiegato',  description: "L'immagine si estende sui bordi laterali",        borderColor: null      },
  { id: 'specchiato', label: 'Specchiato', description: "Il bordo riflette l'immagine in modo simmetrico",  borderColor: null      },
  { id: 'allungato',  label: 'Allungato',  description: 'I pixel del bordo vengono allungati sui lati',    borderColor: null      },
  { id: 'bianco',     label: 'Bianco',     description: 'Bordo bianco sui lati, immagine solo sul fronte', borderColor: '#FFFFFF' },
  { id: 'nero',       label: 'Nero',       description: 'Bordo nero sui lati, immagine solo sul fronte',   borderColor: '#1a1a1a' },
]

const BORDER_INFO: Record<string, { title: string; body: string }> = {
  ripiegato:  { title: 'Bordo Ripiegato',  body: "Il bordo ripiegato è la soluzione più diffusa per le stampe su tela. L'immagine si estende naturalmente sui bordi laterali, mantenendo una continuità visiva tra il fronte e i lati della tela. Il risultato è un effetto avvolgente ed elegante, perfetto per fotografie con sfondi sfumati o paesaggi." },
  specchiato: { title: 'Bordo Specchiato', body: "Con il bordo specchiato, i pixel del bordo dell'immagine vengono riflessi simmetricamente sui lati della tela. Questo crea un effetto di continuità molto gradevole, soprattutto per le fotografie con soggetti centrati. Ideale quando non si vuole perdere nessuna parte dell'immagine principale." },
  allungato:  { title: 'Bordo Allungato',  body: "Il bordo allungato estende i pixel estremi dell'immagine sui lati della tela, creando un effetto di sfumatura morbida verso l'esterno. È particolarmente indicato per fotografie con sfondi uniformi o a tinta unita, dove l'allungamento risulta impercettibile e armonioso." },
  bianco:     { title: 'Bordo Bianco',     body: "Il bordo bianco lascia i lati della tela di colore bianco puro, concentrando tutta l'attenzione sull'immagine al centro. È la scelta classica e pulita, che si adatta a qualsiasi stile d'arredo e crea un effetto simile a quello di un dipinto su tela tradizionale." },
  nero:       { title: 'Bordo Nero',       body: "Il bordo nero conferisce alla stampa un aspetto moderno e di forte impatto visivo. I lati scuri creano un contrasto deciso che valorizza l'immagine al centro, rendendola protagonista assoluta. Ideale per fotografie in bianco e nero o con palette cromatiche scure e raffinate." },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function loadImgTela(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src })
}
async function renderSingleCanvas(
  photoUrl: string, natW: number, natH: number, zoom: number,
  offsetXNorm: number, offsetYNorm: number,
  canvasW: number, canvasH: number,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas'); canvas.width = canvasW; canvas.height = canvasH
  const ctx = canvas.getContext('2d'); if (!ctx) return null
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvasW, canvasH)
  let img: HTMLImageElement
  try { img = await loadImgTela(photoUrl) } catch { return null }
  const cs = Math.max(canvasW / natW, canvasH / natH)
  const iW = natW * cs * zoom, iH = natH * cs * zoom
  const offX = offsetXNorm * canvasW, offY = offsetYNorm * canvasH
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, canvasW, canvasH); ctx.clip()
  ctx.drawImage(img, (canvasW - iW) / 2 + offX, (canvasH - iH) / 2 + offY, iW, iH)
  ctx.restore()
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.93))
}

function getCoverBounds(natW: number, natH: number, contW: number, contH: number, zoom: number) {
  const coverScale = Math.max(contW / natW, contH / natH)
  return {
    maxX: Math.max(0, (natW * coverScale * zoom - contW) / 2),
    maxY: Math.max(0, (natH * coverScale * zoom - contH) / 2),
  }
}

function clampOffset(ox: number, oy: number, maxX: number, maxY: number) {
  return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) }
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function TelaPage() {
  const { addItem } = useCart()
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const heroUploadRef = useRef<HTMLInputElement>(null)

  const [variant,       setVariant]       = useState(VARIANTS[1])      // 30×40 default
  const [rotated,       setRotated]       = useState(false)
  const [borderType,    setBorderType]    = useState(BORDER_TYPES[0])
  const [qty,           setQty]           = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null)
  const [uploadedUrl,   setUploadedUrl]   = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [photoFilename, setPhotoFilename] = useState<string | undefined>(undefined)
  const [zoom,          setZoom]          = useState(1)
  const [photoOffset,   setPhotoOffset]   = useState({ x: 0, y: 0 })
  const [photoNatSize,  setPhotoNatSize]  = useState<{ w: number; h: number } | null>(null)
  const [isRendering,   setIsRendering]   = useState(false)

  // Dimensioni effettive con rotazione
  const canvasW   = rotated ? Math.max(variant.widthCm, variant.heightCm) : variant.widthCm
  const canvasH   = rotated ? Math.min(variant.widthCm, variant.heightCm) : variant.heightCm
  const isSquare  = variant.widthCm === variant.heightCm

  useEffect(() => {
    return () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }
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

  const total = variant.price * qty

  async function handleAddToCart() {
    if (uploading || isRendering) return
    const orientLabel = isSquare ? '' : (rotated ? ' — Orizzontale' : ' — Verticale')
    let imageUrl = uploadedUrl ?? photoUrl ?? '/images/shop/tela/catalogo.jpg'
    const filename = photoFilename

    if (photoUrl && photoNatSize) {
      setIsRendering(true)
      try {
        const cW = Math.round(canvasW * 100), cH = Math.round(canvasH * 100)
        const blob = await renderSingleCanvas(photoUrl, photoNatSize.w, photoNatSize.h, zoom, photoOffset.x, photoOffset.y, cW, cH)
        if (blob) {
          const res = await fetch('/api/shop/presign-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: filename ?? 'tela.jpg', contentType: 'image/jpeg' }),
          })
          if (res.ok) {
            const { uploadUrl, publicUrl } = await res.json()
            await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } })
            imageUrl = publicUrl
          }
        }
      } catch { /* fallback */ }
      setIsRendering(false)
    }

    addItem({
      productId:    'tela',
      variantId:    `${variant.id}__${borderType.id}${isSquare ? '' : rotated ? '__h' : '__v'}`,
      quantity:     qty,
      productName:  'Stampa su Tela',
      variantLabel: `${canvasW}×${canvasH} cm${orientLabel} — Bordo ${borderType.label}`,
      price:        variant.price,
      image:        imageUrl,
      filename,
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2200)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>

      <input ref={fileInputRef}  type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      <input ref={heroUploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: 'clamp(40px, 6vw, 80px) clamp(20px, 5vw, 60px)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#00c1de', textTransform: 'uppercase', letterSpacing: '.18em', marginBottom: 12 }}>
              Decorazioni
            </p>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', color: '#0a0a0a', letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1.1 }}>
              Stampa su Tela
            </h1>
            <p style={{ fontSize: '16px', color: '#555', lineHeight: 1.65, marginBottom: 24, maxWidth: 520 }}>
              La tua foto stampata su tela con telaio in legno di pino, pronta da appendere.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Tela stesa su telaio in legno di pino di alta qualità',
                'Stampa in alta risoluzione con colori brillanti',
                'Inchiostri resistenti agli UV, privi di solventi',
                'Pronta da appendere, gancio incluso',
              ].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '14px', color: '#333' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,193,222,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#00c1de" strokeWidth={3} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => heroUploadRef.current?.click()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: '#00c1de', color: '#fff', border: 'none', borderRadius: 12,
                padding: '14px 28px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px',
                cursor: 'pointer', transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#009ab3')}
              onMouseLeave={e => (e.currentTarget.style.background = '#00c1de')}
            >
              <Upload size={18} /> Carica la tua foto
            </button>
          </div>

          {/* Mini-preview decorativa */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', opacity: 0.85 }}>
            {[{ h: 140, w: 100 }, { h: 180, w: 130 }, { h: 120, w: 90 }].map((s, i) => (
              <div key={i} style={{
                width: s.w, height: s.h, borderRadius: 4,
                background: i === 1
                  ? 'linear-gradient(135deg, #d0e8f0 0%, #b8d4e8 100%)'
                  : 'linear-gradient(135deg, #e8e4dc 0%, #d8cfc4 100%)',
                boxShadow: '4px 6px 20px rgba(0,0,0,0.14), 2px 3px 8px rgba(0,0,0,0.10)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '12px clamp(20px, 5vw, 60px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#999', maxWidth: 1140, margin: '0 auto' }}>
          <Link href="/shop"             style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <Link href="/shop/decorazioni" style={{ color: '#777', textDecoration: 'none' }}>Decorazioni</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Stampa su Tela</span>
        </nav>
      </div>

      {/* ── CONFIGURATORE ───────────────────────────────────────────────────── */}
      <div className="shop-cfg-grid" style={{
        maxWidth: 1140, margin: '0 auto',
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
            widthCm={canvasW}
            heightCm={canvasH}
            borderType={borderType}
            photoUrl={photoUrl}
            zoom={zoom}
            onUploadClick={() => fileInputRef.current?.click()}
            onOffsetChange={(xNorm, yNorm) => setPhotoOffset({ x: xNorm, y: yNorm })}
            onNatSize={(nw, nh) => setPhotoNatSize({ w: nw, h: nh })}
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
            <Tag>{canvasW}×{canvasH} cm</Tag>
            {!isSquare && <Tag>{rotated ? 'Orizzontale' : 'Verticale'}</Tag>}
            <Tag>Bordo {borderType.label}</Tag>
          </div>
        </div>

        {/* ── DESTRA: Configuratore ───────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          <div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Stampa su Tela
            </h2>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Scegli il formato, il bordo e l'orientamento. Carica la tua foto per vedere l'anteprima in ambiente.
            </p>
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

          {/* Orientamento */}
          {!isSquare && (
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
                  <div style={{ width: 18, height: 24, border: `2px solid ${!rotated ? '#00c1de' : '#ccc'}`, borderRadius: 3, flexShrink: 0, transition: 'border-color .15s' }} />
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
                  <div style={{ width: 24, height: 18, border: `2px solid ${rotated ? '#00c1de' : '#ccc'}`, borderRadius: 3, flexShrink: 0, transition: 'border-color .15s' }} />
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

          {/* Tipo di bordo */}
          <Section title="Tipo di bordo">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BORDER_TYPES.map((bt) => {
                const active = borderType.id === bt.id
                return (
                  <button
                    key={bt.id}
                    onClick={() => setBorderType(bt)}
                    style={{
                      padding: '12px 16px', borderRadius: 10,
                      border: `2px solid ${active ? '#00c1de' : '#e0e0e0'}`,
                      background: active ? 'rgba(0,193,222,0.06)' : '#fff',
                      textAlign: 'left', cursor: 'pointer',
                      transition: 'all .15s', fontFamily: 'Montserrat, sans-serif',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <BorderSwatch type={bt.id} active={active} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: active ? '#00c1de' : '#0a0a0a', marginBottom: 2 }}>{bt.label}</p>
                      <p style={{ fontSize: '11px', color: '#888' }}>{bt.description}</p>
                    </div>
                    {active && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Section>

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
              <b style={{ color: '#555' }}>{canvasW}×{canvasH} cm</b>
              {!isSquare && ` — ${rotated ? 'Orizzontale' : 'Verticale'}`}
              {` — Bordo ${borderType.label}`}
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
              transition: 'all .15s',
            }}>
              🛒 Vai al carrello
            </Link>

            <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
              Spedizione calcolata al checkout · Telaio in legno incluso · Gancio incluso
            </p>
          </div>
        </div>
      </div>

      {/* ── SEZIONE INFORMATIVA BORDI ──────────────────────────────────────── */}
      <div style={{ background: '#fff', borderTop: '1px solid #e8e8e8', padding: 'clamp(40px, 6vw, 72px) clamp(20px, 5vw, 60px)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(20px, 3vw, 28px)', color: '#0a0a0a', letterSpacing: '-0.02em', marginBottom: 40, textAlign: 'center' }}>
            Bordi Personalizzabili per le Tue Fotografie su Tela
          </h2>
          <div className="shop-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {BORDER_TYPES.map((bt) => (
              <div
                key={bt.id}
                onClick={() => setBorderType(bt)}
                style={{
                  padding: '24px 20px',
                  border: `2px solid ${borderType.id === bt.id ? '#00c1de' : '#e8e8e8'}`,
                  borderRadius: 14,
                  background: borderType.id === bt.id ? 'rgba(0,193,222,0.04)' : '#fafafa',
                  cursor: 'pointer', transition: 'all .2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <BorderSwatch type={bt.id} active={borderType.id === bt.id} />
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: borderType.id === bt.id ? '#00c1de' : '#0a0a0a' }}>
                    {BORDER_INFO[bt.id].title}
                  </p>
                </div>
                <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.7 }}>
                  {BORDER_INFO[bt.id].body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── RoomScene ────────────────────────────────────────────────────────────────
// Stessa scena del forex ma con effetto tela (bordo laterale + ombra inset)

function RoomScene({
  widthCm, heightCm, borderType, photoUrl, zoom, onUploadClick, onOffsetChange, onNatSize,
}: {
  widthCm: number; heightCm: number
  borderType: BorderType
  photoUrl: string | null
  zoom: number
  onUploadClick: () => void
  onOffsetChange?: (xNorm: number, yNorm: number) => void
  onNatSize?: (nw: number, nh: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(400)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setContainerW(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ROOM_W  = containerW
  const ROOM_H  = Math.round(containerW * (360 / 420))
  const FLOOR_H = Math.round(ROOM_H * 0.22)
  const WALL_H  = ROOM_H - FLOOR_H

  const CM_SCALE_BASE = (containerW / 420) * 3.6
  const minSidePx     = Math.round(containerW * 0.20)
  const shortSideCm   = Math.min(widthCm, heightCm)
  const CM_SCALE      = Math.max(CM_SCALE_BASE, minSidePx / shortSideCm)
  const panelW = Math.round(widthCm  * CM_SCALE)
  const panelH = Math.round(heightCm * CM_SCALE)

  const panelLeft = Math.round((ROOM_W - panelW) / 2)
  const panelTop  = Math.round(WALL_H * 0.42 - panelH / 2)
  const nailTop   = Math.max(4, panelTop - 5)

  // Bordo tela: spessore laterale simulato
  const TELA_BORDER = Math.max(6, Math.round(panelW * 0.04))
  const hasColoredBorder = borderType.borderColor !== null
  const telaEdgeColor = hasColoredBorder ? borderType.borderColor! : 'rgba(0,0,0,0.18)'

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: ROOM_H, position: 'relative', borderRadius: 16, overflow: 'hidden', userSelect: 'none' }}
    >
      {/* Muro */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: WALL_H, background: 'linear-gradient(180deg, #ede5d8 0%, #e4dcd0 50%, #dbd2c5 100%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: WALL_H, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(0,0,0,0.018) 47px, rgba(0,0,0,0.018) 48px)', pointerEvents: 'none' }} />

      {/* Pavimento */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: FLOOR_H, background: 'linear-gradient(180deg, #c4a07a 0%, #b08866 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: FLOOR_H, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px)', pointerEvents: 'none' }} />

      {/* Battiscopa */}
      <div style={{ position: 'absolute', bottom: FLOOR_H, left: 0, right: 0, height: Math.max(8, Math.round(containerW * 0.022)), background: 'linear-gradient(180deg, #f5ede0 0%, #e8dfd2 100%)', boxShadow: '0 2px 4px rgba(0,0,0,0.12)' }} />

      {/* Ombre pavimento */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '30%', height: FLOOR_H, background: 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '30%', height: FLOOR_H, background: 'linear-gradient(270deg, rgba(0,0,0,0.10) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Chiodo */}
      <div style={{ position: 'absolute', top: nailTop, left: Math.round(ROOM_W / 2), transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#8a7060', boxShadow: '0 1px 2px rgba(0,0,0,0.35)', zIndex: 3 }} />

      {/* Tela con bordo laterale simulato */}
      <div
        style={{
          position: 'absolute',
          top: panelTop, left: panelLeft,
          width: panelW, height: panelH,
          zIndex: 2,
          transition: 'top .35s ease, left .35s ease, width .35s ease, height .35s ease',
        }}
      >
        {/* Bordo laterale destro (spessore tela) */}
        <div style={{
          position: 'absolute',
          top: TELA_BORDER, right: -TELA_BORDER,
          width: TELA_BORDER, height: panelH - TELA_BORDER,
          background: hasColoredBorder
            ? `linear-gradient(90deg, ${borderType.borderColor}cc, ${borderType.borderColor}88)`
            : 'linear-gradient(90deg, rgba(0,0,0,0.22), rgba(0,0,0,0.10))',
          borderRadius: '0 3px 3px 0',
        }} />
        {/* Bordo inferiore (spessore tela) */}
        <div style={{
          position: 'absolute',
          bottom: -TELA_BORDER, left: TELA_BORDER,
          width: panelW - TELA_BORDER, height: TELA_BORDER,
          background: hasColoredBorder
            ? `linear-gradient(180deg, ${borderType.borderColor}99, ${borderType.borderColor}55)`
            : 'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.08))',
          borderRadius: '0 0 3px 0',
        }} />

        {/* Fronte tela */}
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: `${Math.round(containerW * 0.005)}px ${Math.round(containerW * 0.014)}px ${Math.round(containerW * 0.05)}px rgba(0,0,0,0.26), 0 2px 5px rgba(0,0,0,0.12)`,
          overflow: 'hidden',
        }}>
          <PhotoSlot
            w={panelW} h={panelH}
            photoUrl={photoUrl} zoom={zoom}
            onUploadClick={onUploadClick}
            onOffsetChange={onOffsetChange}
            onNatSize={onNatSize}
          />
          {/* Inset ombra bordo tela */}
          {(borderType.id === 'ripiegato' || borderType.id === 'allungato') && photoUrl && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: `inset 0 0 0 ${Math.max(3, TELA_BORDER / 2)}px rgba(0,0,0,0.13), inset 0 0 12px rgba(0,0,0,0.07)` }} />
          )}
          {/* Bordo colorato solido */}
          {hasColoredBorder && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: `inset 0 0 0 ${Math.max(4, TELA_BORDER / 1.5)}px ${telaEdgeColor}` }} />
          )}
        </div>
      </div>

      {/* Luce ambiente */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 35% 15%, rgba(255,240,200,0.14) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 1 }} />
      {/* Vignetta */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 0% 50%, rgba(0,0,0,0.10) 0%, transparent 50%), radial-gradient(ellipse at 100% 50%, rgba(0,0,0,0.10) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 1 }} />
    </div>
  )
}

// ─── PhotoSlot ────────────────────────────────────────────────────────────────

function PhotoSlot({ w, h, photoUrl, zoom, onUploadClick, onOffsetChange, onNatSize }: {
  w: number; h: number; photoUrl: string | null; zoom: number; onUploadClick: () => void
  onOffsetChange?: (xNorm: number, yNorm: number) => void
  onNatSize?: (nw: number, nh: number) => void
}) {
  const [offset,      setOffset]      = useState({ x: 0, y: 0 })
  const [isDragging,  setIsDragging]  = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const dragRef  = useRef<{ startMouseX: number; startMouseY: number; startOffsetX: number; startOffsetY: number } | null>(null)
  const stateRef = useRef({ offset: { x: 0, y: 0 }, w, h, zoom, natW: 0, natH: 0 })

  useEffect(() => {
    stateRef.current = { offset, w, h, zoom, natW: naturalSize?.w ?? 0, natH: naturalSize?.h ?? 0 }
  }, [offset, w, h, zoom, naturalSize])

  useEffect(() => { setOffset({ x: 0, y: 0 }); setNaturalSize(null); setIsDragging(false); dragRef.current = null }, [photoUrl])

  useEffect(() => {
    if (!naturalSize) return
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, w, h, zoom)
    setOffset(prev => clampOffset(prev.x, prev.y, maxX, maxY))
  }, [zoom, w, h, naturalSize])

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
    const onEnd = () => { if (!dragRef.current) return; dragRef.current = null; setIsDragging(false) }
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [photoUrl])

  const canDrag = naturalSize != null && (() => {
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, w, h, zoom)
    return maxX > 0.5 || maxY > 0.5
  })()

  function startDrag(clientX: number, clientY: number) {
    if (!canDrag) return
    dragRef.current = { startMouseX: clientX, startMouseY: clientY, startOffsetX: stateRef.current.offset.x, startOffsetY: stateRef.current.offset.y }
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
          width: w, height: h, overflow: 'hidden', position: 'relative',
          cursor: !canDrag ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none', touchAction: canDrag ? 'none' : 'auto',
          backgroundImage: `url(${photoUrl})`, backgroundRepeat: 'no-repeat',
          backgroundSize: naturalSize ? `${imgW}px ${imgH}px` : 'cover',
          backgroundPosition: naturalSize ? `${posX}px ${posY}px` : 'center',
          transition: isDragging ? 'none' : 'background-size .08s linear, background-position .08s linear',
        }}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt="" style={{ display: 'none' }} onLoad={e => { const img = e.currentTarget; setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight }); onNatSize?.(img.naturalWidth, img.naturalHeight) }} />
      </div>
    )
  }

  return (
    <button
      onClick={onUploadClick}
      style={{
        width: w, height: h, border: '2px dashed #c8c8c8',
        background: 'linear-gradient(135deg, #efefef 0%, #e4e4e4 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, cursor: 'pointer', padding: 0, transition: 'border-color .15s, background .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c1de'; e.currentTarget.style.background = 'linear-gradient(135deg, #e8f9fc 0%, #d8f4f9 100%)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#c8c8c8'; e.currentTarget.style.background = 'linear-gradient(135deg, #efefef 0%, #e4e4e4 100%)' }}
      aria-label="Carica la tua foto"
    >
      <Camera size={Math.max(14, Math.min(22, w / 8))} color="#aaa" strokeWidth={1.5} />
      {w > 60 && <span style={{ fontSize: '9px', color: '#bbb', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Carica foto</span>}
    </button>
  )
}

// ─── BorderSwatch ─────────────────────────────────────────────────────────────

function BorderSwatch({ type, active }: { type: string; active: boolean }) {
  const outerColor = active ? '#00c1de' : '#d0d0d0'
  const innerBg: React.CSSProperties = (() => {
    switch (type) {
      case 'bianco':     return { background: '#f0f0f0', border: '2px solid #FFFFFF', outline: '1px solid #ccc' }
      case 'nero':       return { background: '#f0f0f0', border: '2px solid #1a1a1a' }
      case 'ripiegato':  return { background: 'linear-gradient(135deg, #a8c4d0 0%, #c8dce4 40%, #c8dce4 60%, #a8c4d0 100%)' }
      case 'specchiato': return { background: 'linear-gradient(90deg, #b0c8d4 0%, #c8dce4 40%, #c8dce4 60%, #b0c8d4 100%)' }
      case 'allungato':  return { background: 'linear-gradient(90deg, #a0b8c4 0%, #c8dce4 30%, #c8dce4 70%, #a0b8c4 100%)' }
      default:           return { background: '#e0e0e0' }
    }
  })()
  return (
    <div style={{ width: 36, height: 28, borderRadius: 4, flexShrink: 0, border: `2px solid ${outerColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...innerBg }} />
  )
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>{title}</p>
      {children}
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px', lineHeight: 1 }}>{children}</span>
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

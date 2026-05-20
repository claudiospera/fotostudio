'use client'

// app/shop/gadget/puzzle/page.tsx

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Minus, Plus, ShoppingCart, Upload, RotateCcw, ZoomIn } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

interface PuzzleVariant {
  id: string
  label: string
  tessera: 'tradizionale' | 'grande'
  size: string
  pieces: number
  price: number
}

const VARIANTS: PuzzleVariant[] = [
  { id: 'puz-trad-13x18', tessera: 'tradizionale', size: '13×18 cm', pieces: 48,  label: 'Tradizionale 13×18 cm — 48 pezzi',  price: 1200 },
  { id: 'puz-trad-20x30', tessera: 'tradizionale', size: '20×30 cm', pieces: 192, label: 'Tradizionale 20×30 cm — 192 pezzi', price: 2000 },
  { id: 'puz-trad-30x40', tessera: 'tradizionale', size: '30×40 cm', pieces: 384, label: 'Tradizionale 30×40 cm — 384 pezzi', price: 2800 },
  { id: 'puz-gran-20x30', tessera: 'grande',       size: '20×30 cm', pieces: 48,  label: 'Grande 20×30 cm — 48 pezzi',        price: 2000 },
  { id: 'puz-gran-30x40', tessera: 'grande',       size: '30×40 cm', pieces: 96,  label: 'Grande 30×40 cm — 96 pezzi',        price: 2800 },
]

export default function PuzzlePage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tessera,       setTessera]       = useState<'tradizionale' | 'grande'>('tradizionale')
  const [variant,       setVariant]       = useState<PuzzleVariant>(VARIANTS[0])
  const [qty,           setQty]           = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null)
  const [uploadedUrl,   setUploadedUrl]   = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [photoFilename, setPhotoFilename] = useState<string | undefined>(undefined)
  const [zoom,          setZoom]          = useState(1)

  // Quando cambia tessera, seleziona primo formato disponibile
  useEffect(() => {
    const first = VARIANTS.find(v => v.tessera === tessera)
    if (first) setVariant(first)
  }, [tessera])

  const variantsForTessera = VARIANTS.filter(v => v.tessera === tessera)

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
  }, [photoUrl])

  const total = variant.price * qty

  function handleAddToCart() {
    if (uploading) return
    const imageUrl = uploadedUrl ?? photoUrl ?? '/images/shop/gadget/puzzle.png'
    addItem({
      productId:    'puzzle',
      variantId:    variant.id,
      quantity:     qty,
      productName:  'Puzzle Fotografico',
      variantLabel: variant.label,
      price:        variant.price,
      image:        imageUrl,
      filename:     photoFilename,
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2200)
  }

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
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Puzzle Fotografico</span>
        </nav>
      </div>

      {/* Configuratore */}
      <div className="shop-cfg-grid" style={{
        maxWidth: 1140, margin: '0 auto',
        padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 420px) 1fr',
        gap: 'clamp(24px, 4vw, 64px)',
        alignItems: 'start',
      }}>

        {/* SINISTRA: Anteprima foto */}
        <div className="shop-sticky" style={{ position: 'sticky', top: 88 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 16 }}>
            Anteprima foto
          </p>

          {/* Preview puzzle */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/3',
            borderRadius: 14,
            overflow: 'hidden',
            background: '#efefef',
            border: '1px solid #e0e0e0',
          }}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Anteprima"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${zoom})`,
                  transition: 'transform .1s',
                }}
              />
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', height: '100%',
                  border: 'none', background: 'transparent',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 10, cursor: 'pointer',
                }}
              >
                <Image
                  src="/images/shop/gadget/puzzle.png"
                  alt="Puzzle"
                  fill
                  style={{ objectFit: 'cover', opacity: 0.5 }}
                />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'rgba(0,193,222,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}>
                    <Upload size={22} color="#00c1de" />
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>Carica la tua foto</p>
                  <p style={{ fontSize: '11px', color: '#888', marginTop: 4 }}>Clicca per selezionare</p>
                </div>
              </button>
            )}

            {/* Overlay griglia puzzle */}
            {photoUrl && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent calc(100%/6 - 1px), rgba(255,255,255,0.35) calc(100%/6 - 1px), rgba(255,255,255,0.35) calc(100%/6)),
                  repeating-linear-gradient(90deg, transparent, transparent calc(100%/8 - 1px), rgba(255,255,255,0.35) calc(100%/8 - 1px), rgba(255,255,255,0.35) calc(100%/8))
                `,
              }} />
            )}
          </div>

          {/* Controlli foto */}
          {photoUrl ? (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ZoomIn size={14} color="#888" />
                <input
                  type="range" min={1} max={1.5} step={0.01} value={zoom}
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
          ) : null}

          {/* Tag riepilogo */}
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>
              {variant.tessera === 'tradizionale' ? 'Tessera Tradizionale' : 'Tessera Grande'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>
              {variant.size}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>
              {variant.pieces} pezzi
            </span>
          </div>
        </div>

        {/* DESTRA: Configuratore */}
        <div className="shop-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Puzzle Fotografico
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Scegli il tipo di tessera e il formato. Carica la tua foto per personalizzarlo.
            </p>
          </div>

          {/* Tipo tessera */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Tipo di tessera</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['tradizionale', 'grande'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTessera(t)}
                  style={{
                    flex: 1, padding: '14px 16px', borderRadius: 10,
                    border: `2px solid ${tessera === t ? '#00c1de' : '#e0e0e0'}`,
                    background: tessera === t ? 'rgba(0,193,222,0.06)' : '#fff',
                    cursor: 'pointer', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: tessera === t ? '#00c1de' : '#0a0a0a', marginBottom: 2 }}>
                      {t === 'tradizionale' ? 'Tradizionale' : 'Grande'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#888' }}>
                      {t === 'tradizionale' ? 'Pezzi piccoli, alta difficoltà' : 'Pezzi grandi, per bambini'}
                    </p>
                  </div>
                  {tessera === t && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Formato e numero di pezzi</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variantsForTessera.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariant(v)}
                  style={{
                    padding: '12px 16px', borderRadius: 10,
                    border: `2px solid ${variant.id === v.id ? '#00c1de' : '#e0e0e0'}`,
                    background: variant.id === v.id ? 'rgba(0,193,222,0.06)' : '#fff',
                    textAlign: 'left', cursor: 'pointer',
                    transition: 'all .15s', fontFamily: 'Montserrat, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: variant.id === v.id ? '#00c1de' : '#0a0a0a' }}>
                      {v.size}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888', marginLeft: 10 }}>
                      {v.pieces} pezzi
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#00c1de' }}>{formatPrice(v.price)}</span>
                    {variant.id === v.id && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
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
                  fontSize: '13px', fontWeight: 600, color: '#888',
                  transition: 'all .15s',
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
                  {uploading ? 'Caricamento in corso…' : `Foto caricata${photoFilename ? `: ${photoFilename}` : ''}`}
                </span>
                <button onClick={handleRemovePhoto} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                  <RotateCcw size={13} />
                </button>
              </div>
            )}
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
              <span style={{ fontSize: '12px', color: '#aaa' }}>{formatPrice(variant.price)} × {qty} pz</span>
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
              {qty > 1 && <p style={{ fontSize: '12px', color: '#aaa' }}>{formatPrice(variant.price)} cad.</p>}
            </div>

            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8 }}>
              <b style={{ color: '#555' }}>Tessera {variant.tessera === 'tradizionale' ? 'Tradizionale' : 'Grande'}</b>
              {` — ${variant.size} — ${variant.pieces} pezzi`}
              {!photoUrl && <span style={{ color: '#f59e0b', fontWeight: 600 }}> · Foto non caricata</span>}
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

            <Link href="/shop/carrello" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '12px', borderRadius: 12,
              border: '2px solid #00c1de', color: '#00c1de',
              background: '#fff', fontFamily: 'Poppins, sans-serif',
              fontWeight: 700, fontSize: '13px', textDecoration: 'none',
            }}>
              🛒 Vai al carrello
            </Link>

            <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
              Cartone rigido · Stampa ad alta risoluzione · Ritiro in studio
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

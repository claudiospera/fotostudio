'use client'

// app/shop/gadget/portachiavi-ecopelle/page.tsx
// Portachiavi in Ecopelle 5×5 cm — 2 foto (fronte + retro)

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Minus, Plus, ShoppingCart, Upload, RotateCcw, ZoomIn } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const PRICE = 1000

interface PhotoSlot {
  blobUrl: string | null
  uploadedUrl: string | null
  filename: string | undefined
  uploading: boolean
  zoom: number
}

const emptySlot = (): PhotoSlot => ({
  blobUrl: null,
  uploadedUrl: null,
  filename: undefined,
  uploading: false,
  zoom: 1,
})

export default function PortachiavEcopellePage() {
  const { addItem } = useCart()
  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef  = useRef<HTMLInputElement>(null)

  const [front,        setFront]        = useState<PhotoSlot>(emptySlot())
  const [back,         setBack]         = useState<PhotoSlot>(emptySlot())
  const [samePhoto,    setSamePhoto]    = useState(false)
  const [qty,          setQty]          = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)

  async function uploadFile(file: File): Promise<string | null> {
    try {
      const res = await fetch('/api/shop/presign-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!res.ok) return null
      const { uploadUrl, publicUrl } = await res.json()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      return publicUrl
    } catch {
      return null
    }
  }

  const handleFrontChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (front.blobUrl) URL.revokeObjectURL(front.blobUrl)
    const blobUrl = URL.createObjectURL(file)
    setFront(prev => ({ ...prev, blobUrl, uploadedUrl: null, filename: file.name, uploading: true, zoom: 1 }))
    // Se "stessa foto" attiva, aggiorna anche il retro visivamente
    if (samePhoto) {
      if (back.blobUrl) URL.revokeObjectURL(back.blobUrl)
      setBack(prev => ({ ...prev, blobUrl, uploadedUrl: null, filename: file.name, uploading: true, zoom: 1 }))
    }
    e.target.value = ''
    const publicUrl = await uploadFile(file)
    setFront(prev => ({ ...prev, uploadedUrl: publicUrl, uploading: false }))
    if (samePhoto) {
      setBack(prev => ({ ...prev, uploadedUrl: publicUrl, uploading: false }))
    }
  }, [front.blobUrl, back.blobUrl, samePhoto])

  const handleBackChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (back.blobUrl) URL.revokeObjectURL(back.blobUrl)
    const blobUrl = URL.createObjectURL(file)
    setBack(prev => ({ ...prev, blobUrl, uploadedUrl: null, filename: file.name, uploading: true, zoom: 1 }))
    e.target.value = ''
    const publicUrl = await uploadFile(file)
    setBack(prev => ({ ...prev, uploadedUrl: publicUrl, uploading: false }))
  }, [back.blobUrl])

  function toggleSamePhoto(checked: boolean) {
    setSamePhoto(checked)
    if (checked && front.blobUrl) {
      // Copia il fronte nel retro
      if (back.blobUrl && back.blobUrl !== front.blobUrl) URL.revokeObjectURL(back.blobUrl)
      setBack({ ...front })
    }
  }

  function removeFront() {
    if (front.blobUrl) URL.revokeObjectURL(front.blobUrl)
    setFront(emptySlot())
    if (samePhoto) setBack(emptySlot())
  }

  function removeBack() {
    if (back.blobUrl) URL.revokeObjectURL(back.blobUrl)
    setBack(emptySlot())
  }

  const isUploading = front.uploading || (!samePhoto && back.uploading)
  const frontReady  = !!front.blobUrl
  const backReady   = samePhoto ? frontReady : !!back.blobUrl
  const total       = PRICE * qty

  function handleAddToCart() {
    if (isUploading) return
    const frontUrl = front.uploadedUrl ?? front.blobUrl ?? '/images/shop/gadget/portachiavi-ecopelle.jpg'
    const backUrl  = samePhoto
      ? frontUrl
      : (back.uploadedUrl ?? back.blobUrl ?? frontUrl)
    const retroLabel = samePhoto ? 'stessa foto fronte' : (back.filename ?? 'foto')
    addItem({
      productId:    'portachiavi-ecopelle',
      variantId:    'por-eco',
      quantity:     qty,
      productName:  'Portachiavi in Ecopelle',
      variantLabel: `Ecopelle 5×5 cm — Retro: ${retroLabel}`,
      price:        PRICE,
      image:        frontUrl,
      filename:     front.filename,
      notes:        `retro_url:${backUrl}`,
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2200)
  }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>

      <input ref={frontInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFrontChange} />
      <input ref={backInputRef}  type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBackChange} />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '12px clamp(20px, 5vw, 60px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#999', maxWidth: 1140, margin: '0 auto' }}>
          <Link href="/shop"        style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <Link href="/shop/gadget" style={{ color: '#777', textDecoration: 'none' }}>Gadget</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Portachiavi in Ecopelle</span>
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

        {/* SINISTRA: Anteprime fronte + retro */}
        <div className="shop-sticky" style={{ position: 'sticky', top: 88 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 16 }}>
            Anteprima
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Fronte */}
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8, textAlign: 'center' }}>
                Fronte
              </p>
              <div style={{
                position: 'relative', width: '100%', aspectRatio: '1 / 1',
                borderRadius: 14, overflow: 'hidden',
                background: '#efefef', border: '1px solid #e0e0e0',
              }}>
                {front.blobUrl ? (
                  <img
                    src={front.blobUrl}
                    alt="Fronte"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${front.zoom})`, transition: 'transform .1s', borderRadius: 14 }}
                  />
                ) : (
                  <button
                    onClick={() => frontInputRef.current?.click()}
                    style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <Image src="/images/shop/gadget/portachiavi-ecopelle.jpg" alt="" fill style={{ objectFit: 'cover', opacity: 0.35 }} />
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                      <Upload size={20} color="#00c1de" />
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#555', marginTop: 4 }}>Carica</p>
                    </div>
                  </button>
                )}
              </div>
              {front.blobUrl && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <input type="range" min={1} max={1.5} step={0.01} value={front.zoom}
                    onChange={e => setFront(prev => ({ ...prev, zoom: Number(e.target.value) }))}
                    style={{ flex: 1, accentColor: '#00c1de', height: 3 }} aria-label="Zoom fronte" />
                  <ZoomIn size={12} color="#aaa" />
                </div>
              )}
            </div>

            {/* Retro */}
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8, textAlign: 'center' }}>
                Retro
              </p>
              <div style={{
                position: 'relative', width: '100%', aspectRatio: '1 / 1',
                borderRadius: 14, overflow: 'hidden',
                background: '#efefef',
                border: samePhoto ? '1px dashed #00c1de' : '1px solid #e0e0e0',
              }}>
                {(samePhoto ? front.blobUrl : back.blobUrl) ? (
                  <img
                    src={(samePhoto ? front.blobUrl : back.blobUrl)!}
                    alt="Retro"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${samePhoto ? front.zoom : back.zoom})`, transition: 'transform .1s', borderRadius: 14 }}
                  />
                ) : (
                  <button
                    onClick={() => !samePhoto && backInputRef.current?.click()}
                    disabled={samePhoto}
                    style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: samePhoto ? 'default' : 'pointer' }}
                  >
                    <Image src="/images/shop/gadget/portachiavi-ecopelle.jpg" alt="" fill style={{ objectFit: 'cover', opacity: 0.35 }} />
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                      {samePhoto ? (
                        <p style={{ fontSize: '10px', color: '#00c1de', fontWeight: 700 }}>= Fronte</p>
                      ) : (
                        <>
                          <Upload size={20} color="#00c1de" />
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#555', marginTop: 4 }}>Carica</p>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>
              {!samePhoto && back.blobUrl && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <input type="range" min={1} max={1.5} step={0.01} value={back.zoom}
                    onChange={e => setBack(prev => ({ ...prev, zoom: Number(e.target.value) }))}
                    style={{ flex: 1, accentColor: '#00c1de', height: 3 }} aria-label="Zoom retro" />
                  <ZoomIn size={12} color="#aaa" />
                </div>
              )}
            </div>
          </div>

          {/* Tag info */}
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>
              Ecopelle
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>
              5×5 cm
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', background: '#ebebeb', borderRadius: 100, padding: '4px 10px' }}>
              Fronte + Retro
            </span>
          </div>
        </div>

        {/* DESTRA: Configuratore */}
        <div className="shop-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Portachiavi in Ecopelle
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Portachiavi in ecopelle di alta qualità, morbido al tatto con anello in acciaio inox. Stampa fronte e retro 5×5 cm.
            </p>
          </div>

          {/* Toggle stessa foto */}
          <div style={{
            padding: '16px 18px', borderRadius: 12,
            background: samePhoto ? 'rgba(0,193,222,0.06)' : '#f5f5f5',
            border: `1px solid ${samePhoto ? 'rgba(0,193,222,0.25)' : '#e8e8e8'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            cursor: 'pointer', transition: 'all .15s',
          }} onClick={() => toggleSamePhoto(!samePhoto)}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: samePhoto ? '#00c1de' : '#333', marginBottom: 2 }}>
                Usa la stessa foto fronte e retro
              </p>
              <p style={{ fontSize: '11px', color: '#888' }}>
                {samePhoto ? 'Carica una sola foto, sarà stampata su entrambi i lati' : 'Puoi caricare foto diverse per fronte e retro'}
              </p>
            </div>
            {/* Toggle switch */}
            <div style={{
              width: 44, height: 24, borderRadius: 100, flexShrink: 0,
              background: samePhoto ? '#00c1de' : '#ddd',
              position: 'relative', transition: 'background .2s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: samePhoto ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'left .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          {/* Upload foto fronte */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>
              {samePhoto ? 'La tua foto (fronte e retro)' : 'Foto fronte'}
            </p>
            {!front.blobUrl ? (
              <button
                onClick={() => frontInputRef.current?.click()}
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
                <Upload size={16} /> Carica foto fronte
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,193,222,0.07)', borderRadius: 10, border: '1px solid rgba(0,193,222,0.2)' }}>
                <Check size={16} color="#00c1de" />
                <span style={{ fontSize: '12px', color: '#444', flex: 1 }}>
                  {front.uploading ? 'Caricamento in corso…' : `Fronte: ${front.filename ?? 'foto caricata'}`}
                </span>
                <button onClick={() => frontInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00c1de', padding: 4, fontSize: '11px', fontWeight: 600 }}>
                  Cambia
                </button>
                <button onClick={removeFront} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                  <RotateCcw size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Upload foto retro (solo se non stessa foto) */}
          {!samePhoto && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>
                Foto retro
              </p>
              {!back.blobUrl ? (
                <button
                  onClick={() => backInputRef.current?.click()}
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
                  <Upload size={16} /> Carica foto retro
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,193,222,0.07)', borderRadius: 10, border: '1px solid rgba(0,193,222,0.2)' }}>
                  <Check size={16} color="#00c1de" />
                  <span style={{ fontSize: '12px', color: '#444', flex: 1 }}>
                    {back.uploading ? 'Caricamento in corso…' : `Retro: ${back.filename ?? 'foto caricata'}`}
                  </span>
                  <button onClick={() => backInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00c1de', padding: 4, fontSize: '11px', fontWeight: 600 }}>
                    Cambia
                  </button>
                  <button onClick={removeBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                    <RotateCcw size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

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
              <b style={{ color: '#555' }}>Ecopelle 5×5 cm</b> — Stampa fronte e retro
              {!frontReady && <span style={{ color: '#f59e0b', fontWeight: 600 }}> · Foto fronte mancante</span>}
              {frontReady && !backReady && <span style={{ color: '#f59e0b', fontWeight: 600 }}> · Foto retro mancante</span>}
              {frontReady && backReady && <span style={{ color: '#22c55e', fontWeight: 600 }}> · Pronto per l&apos;ordine</span>}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isUploading}
              style={{
                width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                background: addedFeedback ? '#22c55e' : isUploading ? '#b0e6f0' : '#00c1de',
                color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                fontSize: '15px', cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'background .2s', opacity: isUploading ? 0.75 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {addedFeedback ? (
                <><Check size={18} strokeWidth={3} /> Aggiunto al carrello!</>
              ) : isUploading ? (
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
              Vai al carrello
            </Link>

            <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
              Ecopelle di alta qualità · Anello in acciaio inox · Ritiro in studio
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

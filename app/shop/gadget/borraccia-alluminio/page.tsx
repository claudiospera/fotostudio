'use client'

// app/shop/gadget/borraccia-alluminio/page.tsx
// Borraccia Classica Alluminio — area stampa 22×11 cm — foto + testo overlay

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Minus, Plus, ShoppingCart, Upload, RotateCcw, ZoomIn, Type } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

function fmt(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const PRICE = 1500

// ─── Dimensioni ───────────────────────────────────────────────────────────────
const PREV_W = 400                                  // preview px larghezza
const PREV_H = Math.round(PREV_W * 11 / 22)        // 200px
const OUT_W  = 2200                                 // canvas output (100px/cm × 22cm)
const OUT_H  = 1100                                 // canvas output (100px/cm × 11cm)
const SCALE  = OUT_W / PREV_W                       // 5.5

// ─── Font ─────────────────────────────────────────────────────────────────────
const FONTS = [
  { id: 'montserrat',  label: 'Montserrat',      css: 'Montserrat, sans-serif' },
  { id: 'poppins',     label: 'Poppins',          css: 'Poppins, sans-serif' },
  { id: 'georgia',     label: 'Georgia',          css: 'Georgia, serif' },
  { id: 'impact',      label: 'Impact',           css: 'Impact, sans-serif' },
  { id: 'courier',     label: 'Courier New',      css: '"Courier New", monospace' },
  { id: 'pacifico',    label: 'Pacifico',         css: 'Pacifico, cursive' },
  { id: 'dancing',     label: 'Dancing Script',   css: '"Dancing Script", cursive' },
  { id: 'playfair',    label: 'Playfair Display', css: '"Playfair Display", serif' },
  { id: 'roboto-slab', label: 'Roboto Slab',      css: '"Roboto Slab", serif' },
  { id: 'anton',       label: 'Anton',            css: 'Anton, sans-serif' },
  { id: 'lobster',     label: 'Lobster',          css: 'Lobster, cursive' },
]

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Pacifico&family=Dancing+Script:wght@700&family=Playfair+Display:wght@700&family=Roboto+Slab:wght@700&family=Anton&family=Lobster&display=swap'

// ─── Palette colori ───────────────────────────────────────────────────────────
const PALETTE = [
  '#000000','#333333','#666666','#999999','#cccccc','#ffffff',
  '#c0272d','#e84848','#ff8080','#ff4400','#ff7733','#ffaa00',
  '#ffcc00','#dddd00','#99cc00','#2d8c27','#4caf50','#00aa66',
  '#006633','#00c1de','#0088cc','#003399','#2244aa','#4466ff',
  '#6600cc','#9933cc','#cc66ff','#ff00ff','#cc0088','#c05080',
]

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// ─── Componente principale ────────────────────────────────────────────────────

export default function BorracciaAlluminioPage() {
  const { addItem } = useCart()
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const previewRef    = useRef<HTMLDivElement>(null)

  // ── Foto ──
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null)
  const [uploadedUrl,   setUploadedUrl]   = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [isRendering,   setIsRendering]   = useState(false)
  const [photoFilename, setPhotoFilename] = useState<string | undefined>(undefined)
  const [photoZoom,     setPhotoZoom]     = useState(1)
  const [photoOffset,   setPhotoOffset]   = useState({ x: 0, y: 0 })
  const [photoNatSize,  setPhotoNatSize]  = useState<{ w: number; h: number } | null>(null)

  // ── Testo ──
  const [text,      setText]      = useState('')
  const [font,      setFont]      = useState(FONTS[0])
  const [textColor, setTextColor] = useState('#000000')
  const [textSize,  setTextSize]  = useState(22)
  const [textBold,  setTextBold]  = useState(false)
  const [textPos,   setTextPos]   = useState({ x: 0.5, y: 0.75 })

  // ── UI ──
  const [qty,           setQty]           = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [tab,           setTab]           = useState<'foto' | 'testo'>('foto')

  // Carica Google Fonts
  useEffect(() => {
    if (document.getElementById('gf-bor-alu')) return
    const link = document.createElement('link')
    link.id   = 'gf-bor-alu'
    link.rel  = 'stylesheet'
    link.href = GOOGLE_FONTS_URL
    document.head.appendChild(link)
  }, [])

  // Cleanup blob
  useEffect(() => {
    return () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }
  }, [photoUrl])

  // ─── Drag foto ────────────────────────────────────────────────────────────
  const photoDragRef  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const photoStateRef = useRef({ photoOffset: { x: 0, y: 0 } })
  useEffect(() => { photoStateRef.current.photoOffset = photoOffset }, [photoOffset])

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

  // ─── Drag testo ───────────────────────────────────────────────────────────
  const textDragRef  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const textStateRef = useRef({ textPos: { x: 0.5, y: 0.75 } })
  useEffect(() => { textStateRef.current.textPos = textPos }, [textPos])

  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      if (!textDragRef.current) return
      const rect = previewRef.current?.getBoundingClientRect()
      if (!rect) return
      const nx = clamp((cx - rect.left) / rect.width,  0.02, 0.98)
      const ny = clamp((cy - rect.top)  / rect.height, 0.02, 0.98)
      setTextPos({ x: nx, y: ny })
    }
    const onEnd = () => { textDragRef.current = null }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { if (!textDragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
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
  }, [])

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
    const containScale = Math.min(PREV_W / photoNatSize.w, PREV_H / photoNatSize.h)
    const w = photoNatSize.w * containScale * photoZoom
    const h = photoNatSize.h * containScale * photoZoom
    const x = (PREV_W - w) / 2 + photoOffset.x
    const y = (PREV_H - h) / 2 + photoOffset.y
    return { w, h, x, y }
  })()

  // ─── Add to cart con canvas render ────────────────────────────────────────
  async function handleAddToCart() {
    if (uploading || isRendering) return
    let imageUrl = uploadedUrl ?? photoUrl ?? '/images/shop/gadget/borraccia-alluminio.png'

    setIsRendering(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = OUT_W; canvas.height = OUT_H
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, OUT_W, OUT_H)

        if (photoUrl && photoNatSize && photoPreview) {
          const img = await new Promise<HTMLImageElement>((res, rej) => {
            const i = document.createElement('img')
            i.crossOrigin = 'anonymous'
            i.onload = () => res(i); i.onerror = rej; i.src = photoUrl
          })
          ctx.save()
          ctx.rect(0, 0, OUT_W, OUT_H)
          ctx.clip()
          ctx.drawImage(img,
            photoPreview.x * SCALE, photoPreview.y * SCALE,
            photoPreview.w * SCALE, photoPreview.h * SCALE
          )
          ctx.restore()
        }

        if (text.trim()) {
          await document.fonts.ready
          const scaledSize = textSize * SCALE
          const weight = textBold ? '700' : '400'
          ctx.font = `${weight} ${scaledSize}px ${font.css}`
          ctx.fillStyle = textColor
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.shadowColor = 'rgba(0,0,0,0.18)'
          ctx.shadowBlur = scaledSize * 0.08
          ctx.fillText(text, textPos.x * OUT_W, textPos.y * OUT_H)
          ctx.shadowColor = 'transparent'
        }

        const blob = await new Promise<Blob | null>(r => canvas.toBlob(b => r(b), 'image/jpeg', 1.0))
        if (blob) {
          const res = await fetch('/api/shop/presign-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: photoFilename ?? 'borraccia-alluminio.jpg', contentType: 'image/jpeg' }),
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

    addItem({
      productId:    'borraccia-alluminio',
      variantId:    'bor-alu-std',
      quantity:     qty,
      productName:  'Borraccia Classica Alluminio',
      variantLabel: `Standard — 22×11 cm${text.trim() ? ` · Testo: "${text.slice(0, 20)}"` : ''}`,
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
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Borraccia Classica Alluminio</span>
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

          {/* Gallery */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#f0f0f0', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
              <Image
                src="/images/shop/gadget/borraccia-alluminio.png"
                alt="Borraccia Classica Alluminio"
                width={400} height={300}
                style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Etichetta preview */}
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>
            Anteprima area di stampa (22×11 cm)
          </p>

          {/* Preview area stampa */}
          <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <div
              ref={previewRef}
              style={{
                width: PREV_W, maxWidth: '100%',
                height: PREV_H,
                background: '#ffffff',
                border: '1.5px solid #d0d0d0',
                borderRadius: 6,
                overflow: 'hidden',
                position: 'relative',
                cursor: photoUrl ? 'grab' : 'default',
                userSelect: 'none',
              }}
            >
              {/* Foto */}
              {photoUrl && (
                <div
                  style={{
                    position: 'absolute',
                    left:   photoPreview ? photoPreview.x : 0,
                    top:    photoPreview ? photoPreview.y : 0,
                    width:  photoPreview ? photoPreview.w : '100%',
                    height: photoPreview ? photoPreview.h : '100%',
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
                  <Upload size={20} color="#c0c0c0" />
                  <span style={{ fontSize: '11px', color: '#c0c0c0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Carica foto</span>
                </button>
              )}

              {/* Testo overlay */}
              {text.trim() && (
                <div
                  style={{
                    position: 'absolute',
                    left: textPos.x * PREV_W,
                    top:  textPos.y * PREV_H,
                    transform: 'translate(-50%, -50%)',
                    fontFamily: font.css,
                    fontSize: textSize,
                    fontWeight: textBold ? 700 : 400,
                    color: textColor,
                    whiteSpace: 'nowrap',
                    cursor: 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                    pointerEvents: 'auto',
                    textShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    zIndex: 10,
                  }}
                  onMouseDown={e => { e.stopPropagation(); textDragRef.current = { sx: e.clientX, sy: e.clientY, ox: textPos.x, oy: textPos.y } }}
                  onTouchStart={e => { e.stopPropagation(); textDragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, ox: textPos.x, oy: textPos.y } }}
                >
                  {text}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: '10px', color: '#bbb' }}>← 22 cm →</span>
              <span style={{ fontSize: '10px', color: '#bbb' }}>11 cm</span>
            </div>
          </div>

          {/* Zoom foto */}
          {photoUrl && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 600 }}>PICCOLO</span>
                <input
                  type="range" min={0.2} max={2} step={0.01} value={photoZoom}
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
                Trascina la foto per riposizionarla
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

          {text.trim() && (
            <p style={{ marginTop: 10, fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
              <Type size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Trascina il testo per riposizionarlo
            </p>
          )}
        </div>

        {/* ── DESTRA: Configuratore ─────────────────────────────────────── */}
        <div className="shop-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Borraccia Classica Alluminio
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Borraccia in alluminio con moschettone e stampa fotografica personalizzata. Area di stampa 22×11 cm. Leggera e robusta, ideale per escursioni e uso quotidiano.
            </p>
          </div>

          {/* Tab Foto / Testo */}
          <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 12, padding: 4, gap: 4 }}>
            {(['foto', 'testo'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none',
                background: tab === t ? '#fff' : 'transparent',
                fontWeight: tab === t ? 700 : 500, fontSize: '13px',
                color: tab === t ? '#00c1de' : '#666',
                cursor: 'pointer', transition: 'all .15s',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                fontFamily: 'Montserrat, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {t === 'foto' ? <><Upload size={13} /> Foto</> : <><Type size={13} /> Testo</>}
              </button>
            ))}
          </div>

          {/* ── TAB FOTO ── */}
          {tab === 'foto' && (
            <>
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
                <div style={{ padding: '14px 16px', background: '#f0f9ff', borderRadius: 12, border: '1px solid #c8e8f5', fontSize: '12px', color: '#555', lineHeight: 1.7 }}>
                  <b>💡 Suggerimento:</b> abbassa lo zoom per lasciare i bordi bianchi ai lati. Trascina la foto per centrarla a piacimento.
                </div>
              )}
            </>
          )}

          {/* ── TAB TESTO ── */}
          {tab === 'testo' && (
            <>
              <div>
                <p style={labelStyle}>Testo</p>
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Scrivi il tuo testo…"
                  maxLength={60}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: '2px solid #e0e0e0', fontSize: '14px', fontFamily: font.css,
                    outline: 'none', boxSizing: 'border-box', color: '#333',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#00c1de')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
                />
                <p style={{ fontSize: '11px', color: '#bbb', marginTop: 4, textAlign: 'right' }}>{text.length}/60</p>
              </div>

              <div>
                <p style={labelStyle}>Font</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                  {FONTS.map(f => (
                    <button key={f.id} onClick={() => setFont(f)} style={{
                      padding: '10px 12px', borderRadius: 10,
                      border: `2px solid ${font.id === f.id ? '#00c1de' : '#e0e0e0'}`,
                      background: font.id === f.id ? 'rgba(0,193,222,0.07)' : '#fff',
                      cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
                      fontFamily: f.css, fontSize: '14px',
                      color: font.id === f.id ? '#00c1de' : '#333',
                      fontWeight: font.id === f.id ? 700 : 400,
                    }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={labelStyle}>Colore testo</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => setTextColor(c)} style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: c,
                      border: textColor === c ? '3px solid #00c1de' : '2px solid rgba(0,0,0,0.12)',
                      cursor: 'pointer', padding: 0,
                      boxShadow: textColor === c ? '0 0 0 2px rgba(0,193,222,0.3)' : 'none',
                      transition: 'all .1s',
                    }} title={c} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>Colore personalizzato:</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={e => setTextColor(e.target.value)}
                    style={{ width: 44, height: 32, border: '1px solid #e0e0e0', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                  />
                  <span style={{ fontSize: '12px', color: '#aaa', fontFamily: 'monospace' }}>{textColor}</span>
                </div>
              </div>

              <div>
                <p style={labelStyle}>Dimensione testo — {textSize}px</p>
                <input
                  type="range" min={10} max={48} step={1} value={textSize}
                  onChange={e => setTextSize(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#00c1de', height: 4, cursor: 'pointer' }}
                  aria-label="Dimensione testo"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: '10px', color: '#bbb' }}>Piccolo</span>
                  <span style={{ fontSize: '10px', color: '#bbb' }}>Grande</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setTextBold(!textBold)}
                  style={{
                    width: 50, height: 28, borderRadius: 14,
                    background: textBold ? '#00c1de' : '#d0d0d0',
                    position: 'relative', border: 'none', cursor: 'pointer',
                    transition: 'background .2s', padding: 0, flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: textBold ? 25 : 3,
                    transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
                <span style={{ fontSize: '13px', color: '#555', fontWeight: textBold ? 700 : 400 }}>Grassetto</span>
              </div>

              {text.trim() && (
                <div style={{ padding: '14px 16px', background: '#f0f9ff', borderRadius: 12, border: '1px solid #c8e8f5', fontSize: '12px', color: '#555' }}>
                  <b>💡</b> Trascina il testo nell&apos;anteprima per riposizionarlo sulla borraccia.
                </div>
              )}
            </>
          )}

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
              <b style={{ color: '#555' }}>Borraccia Classica Alluminio</b> — area stampa 22×11 cm
              {!photoUrl && !text.trim() && <div style={{ color: '#f59e0b', fontWeight: 600 }}>Nessuna personalizzazione aggiunta</div>}
              {text.trim() && <div>Testo: <em>&ldquo;{text.slice(0, 30)}{text.length > 30 ? '…' : ''}&rdquo;</em> — {font.label}</div>}
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
              {addedFeedback ? <><Check size={18} strokeWidth={3} /> Aggiunto al carrello!</>
               : uploading ? <>Caricamento foto…</>
               : isRendering ? <>Composizione immagine…</>
               : <><ShoppingCart size={18} /> Aggiungi al carrello</>}
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
              Alluminio con moschettone · Ritiro in studio
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stili condivisi ──────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#999',
  textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12,
}

const uploadBtnStyle: React.CSSProperties = {
  width: '100%', padding: '20px',
  border: '2px dashed #c0c0c0', borderRadius: 12,
  background: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  fontSize: '13px', fontWeight: 600, color: '#888', transition: 'all .15s',
}

const uploadedStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 14px', background: 'rgba(0,193,222,0.07)',
  borderRadius: 10, border: '1px solid rgba(0,193,222,0.2)',
}

const linkBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#00c1de', fontSize: '11px', fontWeight: 600, padding: 4,
}

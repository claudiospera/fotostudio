'use client'

// app/shop/stampe/hahnemuhle/page.tsx
// Configuratore Stampa Fine Art Hahnemühle

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, Check, ChevronDown, RotateCcw, ShoppingCart, Upload, ZoomIn } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

// ─── Tipi ────────────────────────────────────────────────────────────────────

interface PaperType {
  id: string
  label: string
  gsm: number
  shortDesc: string
  description: string
  color: string
}

interface FormatPrice {
  fmt: string
  w: number; h: number
  pr: number; me: number; pmb: number; mf: number  // centesimi per carta
}

// ─── Dati ────────────────────────────────────────────────────────────────────

const PAPERS: PaperType[] = [
  {
    id: 'pr308',
    label: 'Photo Rag 308',
    gsm: 308,
    shortDesc: 'Opaca, vellutata, 100% cotone',
    description: '100% cotone · Grammatura 308 g/m² · Spessore 0,48 mm · Opaca, vellutata · Bianco naturale caldo 92,5% · Durabilità 200+ anni',
    color: '#2d6a4f',
  },
  {
    id: 'me350',
    label: 'Museum Etching 350',
    gsm: 350,
    shortDesc: 'Superficie strutturata effetto acquarello',
    description: '100% cotone · Grammatura 350 g/m² · Superficie finemente strutturata, effetto acquarello · Ideale per riproduzioni d\'arte',
    color: '#4a3728',
  },
  {
    id: 'pmb308',
    label: 'Photo Rag Matt Baryta 308',
    gsm: 308,
    shortDesc: 'Semi-lucida tipo FB, toni scuri profondi',
    description: '100% cotone · Grammatura 308 g/m² · Finitura semi-lucida tipo FB · Alta densità ottica · Toni scuri profondi',
    color: '#1a3a5c',
  },
  {
    id: 'mf200',
    label: 'Matte FineArt 200',
    gsm: 200,
    shortDesc: 'Leggerissima, ottimo rapporto qualità/prezzo',
    description: '100% cotone · Grammatura 200 g/m² · Superficie opaca naturale · Ottimo rapporto qualità/prezzo · Ideale per stampe in serie',
    color: '#6b4c8a',
  },
  {
    id: 'to285',
    label: 'Torchon 285',
    gsm: 285,
    shortDesc: 'Texture ruvida tipo acquarello, α-cellulosa',
    description: '100% α-cellulosa · Grammatura 285 g/m² · Superficie fortemente strutturata tipo acquarello · Bianco brillante · Disponibile fino a 30×40 cm',
    color: '#b5651d',
  },
]

// Formati disponibili per Torchon (max 30×40)
const TORCHON_MAX_SIDE = 40

// Consigli d'uso per ogni carta
const PAPER_DETAILS: { id: string; tags: string[]; tip: string }[] = [
  {
    id: 'pr308',
    tags: ['Ritratti', 'Matrimoni', 'Famiglia', 'Paesaggi', 'B&N morbido'],
    tip: 'La superficie opaca vellutata esalta le tonalità calde e i toni di pelle. Perfetta per i reportage di matrimonio: colori naturali, zero riflessi.',
  },
  {
    id: 'me350',
    tags: ['Arte', 'Paesaggi pittoreschi', 'Architettura', 'Riproduzioni'],
    tip: 'La texture acquarello aggiunge profondità e tridimensionalità. Ideale quando vuoi che la stampa sembri un\'opera d\'arte più che una foto.',
  },
  {
    id: 'pmb308',
    tags: ['B&N contrastato', 'Street', 'Moda', 'Ritratti drammatici'],
    tip: 'La finitura semi-lucida baryta richiama la camera oscura analogica. Neri profondi e altissima densità ottica: la scelta dei fotogiornalisti e dei puristi del B&N.',
  },
  {
    id: 'mf200',
    tags: ['Stampe in serie', 'Decorazione', 'Regali', 'Portfolio'],
    tip: 'Più leggera delle altre carte cotone, è la scelta economica senza rinunciare alla qualità Fine Art. Ottima per stampe multiple o album da regalare.',
  },
  {
    id: 'to285',
    tags: ['Paesaggi naturali', 'Architettura', 'Texture', 'Macro', 'Reportage'],
    tip: 'La grana ruvida del Torchon accentua la tridimensionalità e dona un carattere pittorico unico. Disponibile fino a 30×40 cm.',
  },
]

const FORMATS: FormatPrice[] = [
  { fmt: '10×15',  w: 10, h: 15,  pr:  850, me: 1000, pmb: 1000, mf:  400 },
  { fmt: '15×15',  w: 15, h: 15,  pr: 1000, me: 1300, pmb: 1200, mf:  500 },
  { fmt: '13×18',  w: 13, h: 18,  pr: 1050, me: 1300, pmb: 1200, mf:  600 },
  { fmt: '15×20',  w: 15, h: 20,  pr: 1250, me: 1500, pmb: 1500, mf:  700 },
  { fmt: '15×22',  w: 15, h: 22,  pr: 1300, me: 1600, pmb: 1500, mf:  800 },
  { fmt: '16×24',  w: 16, h: 24,  pr: 1400, me: 1700, pmb: 1630, mf:  900 },
  { fmt: '20×20',  w: 20, h: 20,  pr: 1450, me: 1700, pmb: 1700, mf: 1000 },
  { fmt: '18×24',  w: 18, h: 24,  pr: 1500, me: 1800, pmb: 1700, mf: 1000 },
  { fmt: '20×25',  w: 20, h: 25,  pr: 1600, me: 2000, pmb: 1800, mf: 1100 },
  { fmt: '20×30',  w: 20, h: 30,  pr: 1700, me: 2200, pmb: 2000, mf: 1200 },
  { fmt: '24×30',  w: 24, h: 30,  pr: 1950, me: 2400, pmb: 2300, mf: 1300 },
  { fmt: '24×36',  w: 24, h: 36,  pr: 2300, me: 2800, pmb: 2700, mf: 1500 },
  { fmt: '30×30',  w: 30, h: 30,  pr: 2400, me: 2900, pmb: 2800, mf: 1500 },
  { fmt: '30×40',  w: 30, h: 40,  pr: 2800, me: 3200, pmb: 3000, mf: 1800 },
  { fmt: '30×45',  w: 30, h: 45,  pr: 3000, me: 3300, pmb: 3200, mf: 2000 },
  { fmt: '35×50',  w: 35, h: 50,  pr: 3000, me: 3700, pmb: 3500, mf: 2500 },
  { fmt: '30×60',  w: 30, h: 60,  pr: 3100, me: 3700, pmb: 3600, mf: 2600 },
  { fmt: '40×50',  w: 40, h: 50,  pr: 3200, me: 3900, pmb: 3700, mf: 2700 },
  { fmt: '40×60',  w: 40, h: 60,  pr: 3500, me: 4200, pmb: 4100, mf: 2900 },
  { fmt: '50×50',  w: 50, h: 50,  pr: 3800, me: 4600, pmb: 4400, mf: 3200 },
  { fmt: '50×60',  w: 50, h: 60,  pr: 4100, me: 5000, pmb: 4700, mf: 3400 },
  { fmt: '50×70',  w: 50, h: 70,  pr: 4400, me: 5300, pmb: 5000, mf: 3800 },
  { fmt: '60×60',  w: 60, h: 60,  pr: 5000, me: 6000, pmb: 5700, mf: 4200 },
  { fmt: '60×80',  w: 60, h: 80,  pr: 5800, me: 7000, pmb: 6700, mf: 5000 },
  { fmt: '60×90',  w: 60, h: 90,  pr: 6500, me: 7800, pmb: 7600, mf: 5500 },
]

function getPrice(f: FormatPrice, paperId: string): number {
  switch (paperId) {
    case 'pr308':  return f.pr
    case 'me350':  return f.me
    case 'pmb308': return f.pmb
    case 'mf200':  return f.mf
    case 'to285':  return f.me  // stesso prezzo del Museum Etching
    default: return f.pr
  }
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

// ─── Helpers drag/zoom ───────────────────────────────────────────────────────

function getCoverBounds(natW: number, natH: number, contW: number, contH: number, zoom: number) {
  const coverScale = Math.max(contW / natW, contH / natH)
  return {
    maxX: Math.max(0, (natW * coverScale * zoom - contW) / 2),
    maxY: Math.max(0, (natH * coverScale * zoom - contH) / 2),
  }
}

function clampVal(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function loadImgHahne(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new window.Image(); i.onload = () => res(i); i.onerror = rej; i.src = src })
}
async function renderSingleCanvasHahne(
  photoUrl: string, natW: number, natH: number, zoom: number,
  offsetXNorm: number, offsetYNorm: number,
  canvasW: number, canvasH: number,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas'); canvas.width = canvasW; canvas.height = canvasH
  const ctx = canvas.getContext('2d'); if (!ctx) return null
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvasW, canvasH)
  let img: HTMLImageElement
  try { img = await loadImgHahne(photoUrl) } catch { return null }
  const cs = Math.max(canvasW / natW, canvasH / natH)
  const iW = natW * cs * zoom, iH = natH * cs * zoom
  const offX = offsetXNorm * canvasW, offY = offsetYNorm * canvasH
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, canvasW, canvasH); ctx.clip()
  ctx.drawImage(img, (canvasW - iW) / 2 + offX, (canvasH - iH) / 2 + offY, iW, iH)
  ctx.restore()
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.93))
}

// ─── PhotoSlot ───────────────────────────────────────────────────────────────

function PhotoSlot({
  photoUrl, zoom, slotW, slotH, onUploadClick, accentColor, marginPxX = 0, marginPxY = 0,
  onOffsetChange, onNatSize,
}: {
  photoUrl: string | null
  zoom: number
  slotW: number
  slotH: number
  onUploadClick: () => void
  accentColor: string
  marginPxX?: number
  marginPxY?: number
  onOffsetChange?: (xNorm: number, yNorm: number) => void
  onNatSize?: (nw: number, nh: number) => void
}) {
  // Area foto effettiva (ridotta dei margini fisicamente corretti per lato)
  const photoAreaW = slotW - marginPxX * 2
  const photoAreaH = slotH - marginPxY * 2

  const [offset,      setOffset]      = useState({ x: 0, y: 0 })
  const [isDragging,  setIsDragging]  = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const dragRef  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const stateRef = useRef({ offset: { x: 0, y: 0 }, zoom, natW: 0, natH: 0 })

  useEffect(() => {
    stateRef.current = { offset, zoom, natW: naturalSize?.w ?? 0, natH: naturalSize?.h ?? 0 }
  }, [offset, zoom, naturalSize])

  useEffect(() => { setOffset({ x: 0, y: 0 }); setNaturalSize(null) }, [photoUrl, marginPxX, marginPxY])

  useEffect(() => {
    if (!naturalSize) return
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, photoAreaW, photoAreaH, zoom)
    setOffset(prev => ({
      x: clampVal(prev.x, -maxX, maxX),
      y: clampVal(prev.y, -maxY, maxY),
    }))
  }, [zoom, photoAreaW, photoAreaH, naturalSize])

  useEffect(() => {
    if (!photoUrl) return
    const onMove = (cx: number, cy: number) => {
      if (!dragRef.current) return
      const { natW, natH, zoom: cz } = stateRef.current
      if (!natW || !natH) return
      const { maxX, maxY } = getCoverBounds(natW, natH, photoAreaW, photoAreaH, cz)
      setOffset({
        x: clampVal(dragRef.current.ox + cx - dragRef.current.sx, -maxX, maxX),
        y: clampVal(dragRef.current.oy + cy - dragRef.current.sy, -maxY, maxY),
      })
      onOffsetChange?.(
        clampVal(dragRef.current.ox + cx - dragRef.current.sx, -maxX, maxX) / photoAreaW,
        clampVal(dragRef.current.oy + cy - dragRef.current.sy, -maxY, maxY) / photoAreaH,
      )
    }
    const onEnd = () => { dragRef.current = null; setIsDragging(false) }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { if (!dragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
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
  }, [photoUrl, photoAreaW, photoAreaH])

  const canDrag = naturalSize != null && (() => {
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, photoAreaW, photoAreaH, zoom)
    return maxX > 0.5 || maxY > 0.5
  })()

  if (!photoUrl) {
    return (
      <div
        onClick={onUploadClick}
        style={{
          width: slotW, height: slotH,
          border: `2px dashed ${accentColor}66`,
          borderRadius: 4, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, background: `${accentColor}08`,
        }}
      >
        <Camera size={28} color={accentColor} strokeWidth={1.5} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: accentColor }}>
          Carica la tua foto
        </span>
      </div>
    )
  }

  const coverScale = naturalSize ? Math.max(photoAreaW / naturalSize.w, photoAreaH / naturalSize.h) : 1
  const imgW = naturalSize ? naturalSize.w * coverScale * zoom : photoAreaW
  const imgH = naturalSize ? naturalSize.h * coverScale * zoom : photoAreaH
  const posX = (photoAreaW - imgW) / 2 + offset.x
  const posY = (photoAreaH - imgH) / 2 + offset.y

  // Contenitore esterno bianco (margine) + area foto interna
  return (
    <div
      style={{
        width: slotW, height: slotH,
        background: '#fff',
        borderRadius: 4, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingLeft: marginPxX, paddingRight: marginPxX,
        paddingTop: marginPxY, paddingBottom: marginPxY,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: photoAreaW, height: photoAreaH,
          overflow: 'hidden',
          backgroundImage: `url(${photoUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: naturalSize ? `${imgW}px ${imgH}px` : 'cover',
          backgroundPosition: naturalSize ? `${posX}px ${posY}px` : 'center',
          cursor: !canDrag ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none', touchAction: 'none',
          flexShrink: 0,
        }}
        onMouseDown={e => {
          if (!canDrag) return
          e.preventDefault()
          dragRef.current = { sx: e.clientX, sy: e.clientY, ox: stateRef.current.offset.x, oy: stateRef.current.offset.y }
          setIsDragging(true)
        }}
        onTouchStart={e => {
          if (!canDrag) return
          dragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, ox: stateRef.current.offset.x, oy: stateRef.current.offset.y }
          setIsDragging(true)
        }}
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
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function HahnemuhlePage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [paper,      setPaper]      = useState<PaperType>(PAPERS[0])
  const [format,     setFormat]     = useState<FormatPrice | null>(null)

  // Quando si seleziona Torchon, resetta il formato se fuori range
  const handleSetPaper = (p: PaperType) => {
    setPaper(p)
    if (p.id === 'to285' && format && (format.w > TORCHON_MAX_SIDE || format.h > TORCHON_MAX_SIDE)) {
      setFormat(null)
    }
  }
  const [qty,        setQty]        = useState(1)
  const [added,      setAdded]      = useState(false)
  const [showDesc,   setShowDesc]   = useState(false)
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null)
  const [uploadedUrl,   setUploadedUrl]   = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [photoFilename, setPhotoFilename] = useState<string | undefined>(undefined)
  const [zoom,          setZoom]          = useState(1)
  const [photoOffset,   setPhotoOffset]   = useState({ x: 0, y: 0 })
  const [photoNatSize,  setPhotoNatSize]  = useState<{ w: number; h: number } | null>(null)
  const [isRendering,   setIsRendering]   = useState(false)
  const [whiteBorder, setWhiteBorder] = useState(false)
  const [borderCm,    setBorderCm]    = useState<2.5 | 5>(2.5)
  const [rotated,     setRotated]     = useState(false)

  // Formato con rotazione applicata
  const fmtW       = format ? (rotated ? Math.max(format.w, format.h) : format.w) : null
  const fmtH       = format ? (rotated ? Math.min(format.w, format.h) : format.h) : null
  const isSquare   = format ? format.w === format.h : false

  // Formati fino a 24×36 → consigliato 2.5cm
  const isSmallFormat = format ? format.w * format.h <= 24 * 36 : true

  const price = format ? getPrice(format, paper.id) : null

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
    } catch { /* usa blob url come fallback */ }
    setUploading(false)
  }, [photoUrl])

  async function handleAddToCart() {
    if (!format || !price || uploading || isRendering) return
    let imageUrl = uploadedUrl ?? photoUrl ?? '/images/shop/hahnemuhle/catalogo.jpg'
    const filename = photoFilename

    addItem({
      productId:    'hahnemuhle',
      variantId:    `${paper.id}__${format.fmt.replace('×', 'x')}`,
      quantity:     qty,
      productName:  'Stampa Fine Art Hahnemühle',
      variantLabel: `${paper.label} — ${fmtW}×${fmtH} cm${isSquare ? '' : rotated ? ' (orizzontale)' : ' (verticale)'}`,
      price,
      image:        imageUrl,
      filename,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  // Dimensioni slot preview proporzionali al formato selezionato (con rotazione)
  const PREVIEW_MAX = 340
  const slotW = fmtW && fmtH
    ? Math.round(fmtW >= fmtH ? PREVIEW_MAX : PREVIEW_MAX * (fmtW / fmtH))
    : PREVIEW_MAX
  const slotH = fmtW && fmtH
    ? Math.round(fmtH >= fmtW ? PREVIEW_MAX : PREVIEW_MAX * (fmtH / fmtW))
    : Math.round(PREVIEW_MAX * 1.33)

  // Margini in pixel: usa le dimensioni reali del formato se disponibili,
  // altrimenti una referenza 30×40 cm (corrisponde al preview di default)
  const refW = fmtW ?? 30
  const refH = fmtH ?? 40
  const marginPxX = whiteBorder ? Math.round(slotW * borderCm / refW) : 0
  const marginPxY = whiteBorder ? Math.round(slotH * borderCm / refH) : 0

  const canDragMsg = photoUrl && format

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '12px clamp(20px, 5vw, 60px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#999', maxWidth: 1140, margin: '0 auto' }}>
          <Link href="/shop"        style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <Link href="/shop/stampe" style={{ color: '#777', textDecoration: 'none' }}>Stampe</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Stampa Fine Art Hahnemühle</span>
        </nav>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)' }}>
        <div className="shop-cfg-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(300px,420px)', gap: 48, alignItems: 'start' }}>

          {/* ── Sinistra: preview foto + schede tecniche ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Preview foto */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 20 }}>
                Anteprima stampa
              </p>

              {/* Slot foto centrato con proporzioni reali */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: PREVIEW_MAX + 20 }}>
                <div style={{
                  boxShadow: photoUrl
                    ? '4px 8px 32px rgba(0,0,0,0.18), 1px 2px 8px rgba(0,0,0,0.10)'
                    : 'none',
                  borderRadius: 4,
                  flexShrink: 0,
                }}>
                  <PhotoSlot
                    photoUrl={photoUrl}
                    zoom={zoom}
                    slotW={slotW}
                    slotH={slotH}
                    onUploadClick={() => fileInputRef.current?.click()}
                    accentColor={paper.color}
                    marginPxX={marginPxX}
                    marginPxY={marginPxY}
                    onOffsetChange={(xNorm, yNorm) => setPhotoOffset({ x: xNorm, y: yNorm })}
                    onNatSize={(nw, nh) => setPhotoNatSize({ w: nw, h: nh })}
                  />
                </div>
              </div>

              {/* Controlli zoom + cambio foto */}
              {photoUrl && (
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ZoomIn size={14} color="#888" />
                    <input
                      type="range" min={1} max={2} step={0.01} value={zoom}
                      onChange={e => setZoom(Number(e.target.value))}
                      style={{ flex: 1, accentColor: paper.color, cursor: 'pointer', height: 4 }}
                    />
                    <span style={{ fontSize: '11px', color: '#aaa', minWidth: 32, textAlign: 'right' }}>
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                  {canDragMsg && (
                    <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
                      Trascina la foto per centrare il soggetto
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${paper.color}`,
                        background: 'none', color: paper.color, fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <Upload size={13} /> Cambia foto
                    </button>
                    <button
                      onClick={() => { if (photoUrl) URL.revokeObjectURL(photoUrl); setPhotoUrl(null); setZoom(1) }}
                      style={{
                        padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0',
                        background: 'none', color: '#e55', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <RotateCcw size={13} /> Rimuovi
                    </button>
                  </div>
                </div>
              )}

              {!photoUrl && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      border: `1.5px solid ${paper.color}`, borderRadius: 10,
                      padding: '10px 20px', background: 'none', color: paper.color,
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Upload size={14} /> Carica la tua foto
                  </button>
                </div>
              )}
            </div>

            {/* ── Margine bianco ────────────────────────────────────── */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: whiteBorder ? 14 : 0 }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', marginBottom: 3 }}>
                    Margine bianco
                  </p>
                  <p style={{ fontSize: '11px', color: '#999', lineHeight: 1.5 }}>
                    Presentazione da galleria — bordo bianco intorno alla foto
                  </p>
                </div>
                <button
                  onClick={() => setWhiteBorder(v => !v)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none',
                    background: whiteBorder ? paper.color : '#d0d0d0',
                    cursor: 'pointer', position: 'relative', flexShrink: 0,
                    transition: 'background .2s',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: whiteBorder ? 23 : 3,
                    transition: 'left .2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

              {whiteBorder && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Scelta cm */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([2.5, 5] as const).map(cm => {
                      const active = borderCm === cm
                      const isRecommended = cm === 2.5 && isSmallFormat || cm === 5 && !isSmallFormat
                      return (
                        <button
                          key={cm}
                          onClick={() => setBorderCm(cm)}
                          style={{
                            flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                            border: `2px solid ${active ? paper.color : '#e8e8e8'}`,
                            background: active ? `${paper.color}0d` : '#fff',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            transition: 'all .15s', position: 'relative',
                          }}
                        >
                          <span style={{ fontSize: '15px', fontWeight: 800, color: active ? paper.color : '#0a0a0a' }}>
                            {cm} cm
                          </span>
                          <span style={{ fontSize: '10px', color: active ? paper.color : '#aaa' }}>
                            per lato
                          </span>
                          {isRecommended && (
                            <span style={{
                              position: 'absolute', top: -8,
                              background: paper.color, color: '#fff',
                              fontSize: '9px', fontWeight: 700, letterSpacing: '.05em',
                              padding: '2px 7px', borderRadius: 6,
                            }}>
                              CONSIGLIATO
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Info risultante */}
                  {format && fmtW && fmtH ? (
                    <div style={{
                      padding: '8px 12px', background: `${paper.color}0d`, borderRadius: 8,
                      fontSize: '11px', color: paper.color, fontWeight: 600, lineHeight: 1.6,
                    }}>
                      Formato carta: {fmtW}×{fmtH} cm<br />
                      Foto visibile: {(fmtW - borderCm * 2).toFixed(1)}×{(fmtH - borderCm * 2).toFixed(1)} cm
                    </div>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#bbb' }}>
                      Seleziona un formato per vedere l&apos;area foto risultante
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Immagine prodotto (quando non c'è foto) */}
            {!photoUrl && (
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '4/3', background: '#e8e8e8' }}>
                <Image
                  src="/images/shop/hahnemuhle/catalogo.jpg"
                  alt="Carta Fine Art Hahnemühle"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                />
              </div>
            )}

            {/* Schede tecniche carte */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em' }}>
                  Schede tecniche &amp; consigli d&apos;uso
                </p>
              </div>
              {PAPER_DETAILS.map(pd => {
                const p = PAPERS.find(x => x.id === pd.id)!
                const isActive = paper.id === pd.id
                return (
                  <div
                    key={pd.id}
                    onClick={() => handleSetPaper(p)}
                    style={{
                      padding: '16px 20px', borderBottom: '1px solid #f5f5f5',
                      cursor: 'pointer',
                      background: isActive ? `${p.color}08` : '#fff',
                      transition: 'background .15s',
                    }}
                  >
                    {/* Intestazione */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <p style={{ fontSize: '13px', fontWeight: 700, color: isActive ? p.color : '#0a0a0a', flex: 1 }}>
                        {p.label}
                      </p>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#fff', background: p.color, borderRadius: 6, padding: '2px 7px' }}>
                        {p.gsm} g/m²
                      </span>
                    </div>

                    {/* Dati tecnici */}
                    <p style={{ fontSize: '11px', color: '#888', paddingLeft: 20, lineHeight: 1.6, marginBottom: 10 }}>
                      {p.description}
                    </p>

                    {/* Consigli */}
                    <div style={{ paddingLeft: 20 }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                        Ideale per
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                        {pd.tags.map(tag => (
                          <span key={tag} style={{
                            fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                            background: `${p.color}14`, color: p.color, border: `1px solid ${p.color}30`,
                          }}>{tag}</span>
                        ))}
                      </div>
                      <p style={{ fontSize: '11px', color: '#666', lineHeight: 1.65, fontStyle: 'italic' }}>
                        💡 {pd.tip}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Matt FineArt 200 Duo su richiesta ───────────────────── */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ padding: '20px 24px 0' }}>
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.12)', color: '#c8d8ff',
                  fontSize: '9px', fontWeight: 700, letterSpacing: '.18em',
                  textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20,
                  marginBottom: 14,
                }}>
                  Su richiesta
                </span>
                <h3 style={{
                  fontFamily: 'Poppins, sans-serif', fontWeight: 800,
                  fontSize: '18px', color: '#ffffff', marginBottom: 6, lineHeight: 1.2,
                }}>
                  Hahnemühle Matt FineArt 200 Duo
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 20 }}>
                  La versione Duo della Matte FineArt 200: due superfici distinte sullo stesso foglio, per stampe fine art opache di qualità museum. Disponibile fino al formato A3.
                </p>
              </div>

              <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '◈', label: 'Doppia superficie', desc: 'Due lati utilizzabili con finitura opaca fine art' },
                  { icon: '⬡', label: '200 g/m² · α-cellulosa', desc: 'Leggera ma resistente, spessore ottimale per la stampa inkjet' },
                  { icon: '◎', label: 'Bianco ottico brillante', desc: 'Ottima resa cromatica, neri profondi e toni pastello delicati' },
                  { icon: '◻', label: 'Formato massimo A3', desc: '29,7×42 cm — ideale per stampe da parete e portfolio' },
                  { icon: '✦', label: 'Ideale per', desc: 'Portfolio · Stampe da parete · Ritratti · Decorazione · Regali' },
                ].map(f => (
                  <div key={f.label} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: '16px', flexShrink: 0, color: '#c8d8ff', lineHeight: 1.4 }}>{f.icon}</span>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: 2 }}>{f.label}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ margin: '0 24px 24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 14 }}>
                  La Matt FineArt 200 Duo non è disponibile nel configuratore standard. Scrivici per un preventivo personalizzato con formato, quantità e spedizione.
                </p>
                <a
                  href="mailto:info@claudiospera.com?subject=Richiesta%20stampa%20Hahnem%C3%BChle%20Matt%20FineArt%20200%20Duo&body=Ciao%20Claudio%2C%0A%0Avorrei%20richiedere%20un%20preventivo%20per%20la%20stampa%20su%20Hahnem%C3%BChle%20Matt%20FineArt%20200%20Duo.%0A%0AFormato%3A%20%0AQuantit%C3%A0%3A%20%0A%0AGrazie!"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#fff', color: '#1a1a2e',
                    borderRadius: 10, padding: '11px 22px',
                    fontSize: '13px', fontWeight: 700,
                    textDecoration: 'none', letterSpacing: '.01em',
                  }}
                >
                  ✉ Scrivici per la stampa
                </a>
              </div>
            </div>

          </div>

          {/* ── Destra: configuratore (sticky) ── */}
          <div className="shop-sticky shop-first-mobile" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>
                Stampa Fine Art
              </p>
              <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
                Hahnemühle
              </h1>
              <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.65 }}>
                Carta Fine Art 100% cotone, certificata archival. La scelta dei fotografi e degli artisti di tutto il mondo.
              </p>
            </div>

            {/* Selettore carta */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>
                Tipo di carta
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PAPERS.map(p => {
                  const active = paper.id === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSetPaper(p)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: `2px solid ${active ? p.color : '#e8e8e8'}`,
                        background: active ? `${p.color}0d` : '#fff',
                        textAlign: 'left', transition: 'all .15s', width: '100%',
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: active ? p.color : '#0a0a0a', marginBottom: 1 }}>
                          {p.label}
                        </p>
                        <p style={{ fontSize: '11px', color: '#999' }}>{p.shortDesc}</p>
                      </div>
                      {active && <Check size={14} color={p.color} strokeWidth={3} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selettore formato */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>
                Formato
              </p>
              {paper.id === 'to285' && (
                <p style={{ fontSize: '11px', color: '#b5651d', fontWeight: 600, marginBottom: 10 }}>
                  Disponibile fino a 30×40 cm
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {(paper.id === 'to285' ? FORMATS.filter(f => f.w <= TORCHON_MAX_SIDE && f.h <= TORCHON_MAX_SIDE) : FORMATS).map(f => {
                  const active = format?.fmt === f.fmt
                  const p = getPrice(f, paper.id)
                  return (
                    <button
                      key={f.fmt}
                      onClick={() => setFormat(f)}
                      style={{
                        padding: '9px 6px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${active ? paper.color : '#e8e8e8'}`,
                        background: active ? `${paper.color}0d` : '#fff',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        transition: 'all .15s',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: active ? paper.color : '#0a0a0a' }}>
                        {f.fmt}
                      </span>
                      <span style={{ fontSize: '10px', color: '#aaa' }}>cm</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: active ? paper.color : '#888', marginTop: 2 }}>
                        {formatPrice(p)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Orientamento — nascosto per formati quadrati */}
            {format && !isSquare && (
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>
                  Orientamento
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { label: 'Verticale',    icon: '▯', val: false },
                    { label: 'Orizzontale',  icon: '▭', val: true  },
                  ].map(o => {
                    const active = rotated === o.val
                    return (
                      <button
                        key={o.label}
                        onClick={() => setRotated(o.val)}
                        style={{
                          flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${active ? paper.color : '#e8e8e8'}`,
                          background: active ? `${paper.color}0d` : '#fff',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          transition: 'all .15s',
                        }}
                      >
                        <span style={{ fontSize: '22px', lineHeight: 1, color: active ? paper.color : '#aaa' }}>
                          {o.icon}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: active ? paper.color : '#555' }}>
                          {o.label}
                        </span>
                        <span style={{ fontSize: '10px', color: '#aaa' }}>
                          {o.val
                            ? `${Math.max(format.w, format.h)}×${Math.min(format.w, format.h)} cm`
                            : `${Math.min(format.w, format.h)}×${Math.max(format.w, format.h)} cm`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantità + CTA */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {price ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Prezzo unitario</p>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '28px', color: paper.color, lineHeight: 1 }}>
                      {formatPrice(price)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: '#aaa' }}>{paper.label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#555' }}>{format?.fmt} cm</p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#bbb', textAlign: 'center' }}>
                  Seleziona un formato per vedere il prezzo
                </p>
              )}

              {/* Quantità */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.1em' }}>Quantità</p>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e0e0e0', borderRadius: 10, overflow: 'hidden', marginLeft: 'auto' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, border: 'none', background: '#f7f7f7', cursor: 'pointer', fontSize: '18px', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ width: 44, textAlign: 'center', fontSize: '15px', fontWeight: 700, color: '#0a0a0a' }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, border: 'none', background: '#f7f7f7', cursor: 'pointer', fontSize: '18px', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>

              {price && qty > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f9f9f9', borderRadius: 10 }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Totale ({qty} stampe)</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>{formatPrice(price * qty)}</span>
                </div>
              )}

              {/* Upload + CTA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 10,
                    border: `1.5px dashed ${paper.color}`,
                    background: `${paper.color}08`, color: paper.color,
                    fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'background .15s',
                  }}
                >
                  <Upload size={14} />
                  {photoUrl ? 'Cambia foto' : 'Carica la tua foto'}
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={!format || uploading || isRendering}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: !format || uploading || isRendering ? '#d0d0d0' : added ? '#22c55e' : paper.color,
                    color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                    fontSize: '14px', cursor: (!format || uploading || isRendering) ? 'not-allowed' : 'pointer',
                    transition: 'background .2s', opacity: (uploading || isRendering) ? 0.75 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {added ? (
                    <><Check size={17} strokeWidth={3} /> Aggiunto al carrello!</>
                  ) : uploading ? (
                    <>Caricamento foto…</>
                  ) : isRendering ? (
                    <>Composizione immagine…</>
                  ) : (
                    <><ShoppingCart size={17} /> {!format ? 'Seleziona un formato' : 'Aggiungi al carrello'}</>
                  )}
                </button>
              </div>

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
                IVA inclusa · Spedizione calcolata al checkout · Carta 100% cotone certificata archival
              </p>
            </div>

            {/* Accordion info carta */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, overflow: 'hidden' }}>
              <button
                onClick={() => setShowDesc(!showDesc)}
                style={{
                  width: '100%', padding: '16px 20px', border: 'none', background: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>Carta {paper.label}</span>
                <ChevronDown size={16} color="#aaa" style={{ transform: showDesc ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </button>
              {showDesc && (
                <div style={{ padding: '0 20px 16px', borderTop: '1px solid #f0f0f0' }}>
                  <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.7, paddingTop: 14 }}>
                    {paper.description}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

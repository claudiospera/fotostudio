'use client'

// app/shop/stampe/instax/page.tsx
// Configuratore Stampa Instax / Polaroid
// Flusso: Formato + Grafica → Carica foto → Il tuo ordine

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Upload, X, ZoomIn, Maximize2, Bold, Italic } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

// ─── Tipi ────────────────────────────────────────────────────────────────────

interface InstaxFormat {
  id: string
  label: string
  desc: string
  price: number
  outerW: number; outerH: number   // cm
  photoW: number; photoH: number   // cm — area foto interna
  pad: [number, number, number, number]  // [top, right, bottom, left] in cm
}

interface FrameDesign {
  id: string
  label: string
  bg: string
  bgImg?: string
  bgColor?: string
}

interface UploadedPhoto {
  id: string
  url: string
  natW: number; natH: number
  zoom: number
  offsetX: number; offsetY: number
  copies: number
  fitMode: 'cover' | 'contain'
  label: string
  labelSize: number
  labelColor: string
  labelBold: boolean
  labelItalic: boolean
  labelAlign: 'left' | 'center' | 'right'
  labelFont: string
  labelOffsetX: number
  labelOffsetY: number
}

// ─── Dati ────────────────────────────────────────────────────────────────────

const FORMATS: InstaxFormat[] = [
  {
    // side = (6.2-5.2)/2 = 0.5 → top=0.5, bottom=10.1-8.1-0.5=1.5
    id: 'mini', label: 'Instax Mini', desc: '62×101 mm · foto 52×81 mm', price: 200,
    outerW: 6.2, outerH: 10.1, photoW: 5.2, photoH: 8.1,
    pad: [0.5, 0.5, 1.5, 0.5],
  },
  {
    // side = (8.5-7.5)/2 = 0.5 → top=0.5, bottom=10.1-7.5-0.5=2.1
    id: 'square', label: 'Instax Square', desc: '85×101 mm · foto 75×75 mm', price: 200,
    outerW: 8.5, outerH: 10.1, photoW: 7.5, photoH: 7.5,
    pad: [0.5, 0.5, 2.1, 0.5],
  },
  {
    // side = (10.1-9.5)/2 = 0.3 → top=0.3, bottom=7.7-5.8-0.3=1.6
    id: 'wide', label: 'Instax Wide', desc: '101×77 mm · foto 95×58 mm', price: 200,
    outerW: 10.1, outerH: 7.7, photoW: 9.5, photoH: 5.8,
    pad: [0.3, 0.3, 1.6, 0.3],
  },
]

const FRAMES: FrameDesign[] = [
  {
    id: 'holographic', label: 'Olografico',
    bg: 'linear-gradient(135deg, #ff9af5 0%, #ffe04b 20%, #4bf5ff 40%, #b44bff 60%, #4bffe0 80%, #ff9af5 100%)',
  },
  { id: 'teal',    label: 'Turchese',   bg: '#5bc8c8' },
  { id: 'black',   label: 'Nero',       bg: '#111111' },
  {
    id: 'polka', label: 'Pallini',
    bg: '#ffffff',
    bgImg: `radial-gradient(circle, #e74c3c 2px, transparent 2px) 0 0 / 12px 12px,
            radial-gradient(circle, #3498db 2px, transparent 2px) 6px 6px / 12px 12px,
            radial-gradient(circle, #2ecc71 2px, transparent 2px) 3px 9px / 12px 12px,
            radial-gradient(circle, #f39c12 2px, transparent 2px) 9px 3px / 12px 12px,
            radial-gradient(circle, #9b59b6 2px, transparent 2px) 1px 6px / 12px 12px`,
    bgColor: '#ffffff',
  },
  {
    id: 'popart', label: 'WOW!',
    bg: 'linear-gradient(135deg, #00b4c8 0%, #00d4a8 30%, #ff6b35 60%, #ffcc00 100%)',
  },
  {
    id: 'rose-glitter', label: 'Rose Gold',
    bg: 'repeating-linear-gradient(45deg, #f4a2a0 0px, #e88580 1px, #fac0b8 3px, #e89088 5px, #fad0c0 7px, #e89888 9px)',
  },
  {
    id: 'silver-glitter', label: 'Silver',
    bg: 'repeating-linear-gradient(45deg, #b0c4d8 0px, #d0e0ec 1px, #a8b8cc 3px, #c8d8e8 5px, #b8ccd8 7px, #d4e4f0 9px)',
  },
  {
    id: 'gradient', label: 'Gradiente',
    bg: 'linear-gradient(135deg, #ff69b4 0%, #ff4500 33%, #4169e1 66%, #40e0d0 100%)',
  },
  {
    id: 'marble', label: 'Marmo',
    bg: 'linear-gradient(135deg, #1a3a4c 0%, #2c5468 20%, #1a2e3a 40%, #234558 60%, #1a3040 80%, #2a4a5c 100%)',
  },
  { id: 'gray',    label: 'Grigio',     bg: '#9e9e9e' },
  { id: 'pink',    label: 'Rosa',       bg: '#ff91a4' },
  {
    id: 'rainbow', label: 'Arcobaleno',
    bg: 'linear-gradient(135deg, #ff9aa2 0%, #ffdac1 25%, #e2f0cb 50%, #b5ead7 75%, #c7ceea 100%)',
  },
  { id: 'white',   label: 'Bianco',     bg: '#f8f8f8' },
]

const LABEL_FONTS = [
  { id: 'Pacifico, cursive',            label: 'Pacifico' },
  { id: "'Dancing Script', cursive",    label: 'Dancing Script' },
  { id: "'Satisfy', cursive",           label: 'Satisfy' },
  { id: "'Poppins', sans-serif",        label: 'Poppins' },
  { id: "Georgia, serif",               label: 'Georgia' },
  { id: "Arial, sans-serif",            label: 'Arial' },
]

// ─── Prezzi per quantità ─────────────────────────────────────────────────────

const PRICE_BREAKS = [
  { minQty:   1, price: 200 },
  { minQty:   2, price: 150 },
  { minQty:  11, price:  80 },
  { minQty:  21, price:  70 },
  { minQty:  31, price:  60 },
  { minQty:  51, price:  50 },
  { minQty:  71, price:  35 },
  { minQty:  91, price:  30 },
  { minQty: 200, price:  25 },
  { minQty: 500, price:  20 },
]

function getPriceForQty(qty: number): number {
  const sorted = [...PRICE_BREAKS].sort((a, b) => b.minQty - a.minQty)
  return sorted.find(b => qty >= b.minQty)?.price ?? 200
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function getCoverBounds(natW: number, natH: number, contW: number, contH: number, zoom: number) {
  const scale = Math.max(contW / natW, contH / natH)
  return {
    maxX: Math.max(0, (natW * scale * zoom - contW) / 2),
    maxY: Math.max(0, (natH * scale * zoom - contH) / 2),
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// ─── Instax card renderer ─────────────────────────────────────────────────────

function InstaxCard({
  photo, format, frame, cardW,
  interactive = false,
  onLabelOffsetChange,
  onPhotoOffsetChange,
}: {
  photo: UploadedPhoto | null
  format: InstaxFormat
  frame: FrameDesign
  cardW: number
  interactive?: boolean
  onLabelOffsetChange?: (x: number, y: number) => void
  onPhotoOffsetChange?: (x: number, y: number) => void
}) {
  const cardH  = Math.round(cardW * (format.outerH / format.outerW))
  const scaleX = cardW / format.outerW
  const scaleY = cardH / format.outerH
  const photoW = Math.round(format.photoW * scaleX)
  const photoH = Math.round(format.photoH * scaleY)
  const padT   = Math.round(format.pad[0] * scaleY)
  const padR   = Math.round(format.pad[1] * scaleX)
  const padB   = Math.round(format.pad[2] * scaleY)
  const padL   = Math.round(format.pad[3] * scaleX)

  const [offset,     setOffset]     = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)

  const dragRef     = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const textDragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const stateRef    = useRef({
    offset: { x: 0, y: 0 }, zoom: photo?.zoom ?? 1,
    natW: 0, natH: 0, fitMode: photo?.fitMode ?? 'cover',
  })

  const zoom    = photo?.zoom ?? 1
  const fitMode = photo?.fitMode ?? 'cover'

  useEffect(() => {
    stateRef.current = {
      offset, zoom, fitMode,
      natW: naturalSize?.w ?? 0, natH: naturalSize?.h ?? 0,
    }
  }, [offset, zoom, fitMode, naturalSize])

  // Reset offset quando cambia foto; per non-interactive sync dall'esterno
  useEffect(() => { setOffset({ x: photo?.offsetX ?? 0, y: photo?.offsetY ?? 0 }); setNaturalSize(null) }, [photo?.url]) // eslint-disable-line

  // Thumbnail: aggiorna offset quando parent lo cambia (drag nell'anteprima grande)
  useEffect(() => {
    if (!interactive) setOffset({ x: photo?.offsetX ?? 0, y: photo?.offsetY ?? 0 })
  }, [photo?.offsetX, photo?.offsetY, interactive])

  useEffect(() => {
    if (!naturalSize || !interactive || fitMode === 'contain') return
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, photoW, photoH, zoom)
    setOffset(prev => ({ x: clamp(prev.x, -maxX, maxX), y: clamp(prev.y, -maxY, maxY) }))
  }, [zoom, photoW, photoH, naturalSize, interactive, fitMode])

  // Unified window drag listeners
  useEffect(() => {
    if (!interactive || !photo?.url) return

    const onMove = (cx: number, cy: number) => {
      // Photo drag
      if (dragRef.current && stateRef.current.fitMode !== 'contain') {
        const { natW, natH, zoom: cz } = stateRef.current
        if (!natW || !natH) return
        const { maxX, maxY } = getCoverBounds(natW, natH, photoW, photoH, cz)
        const newX = clamp(dragRef.current.ox + cx - dragRef.current.sx, -maxX, maxX)
        const newY = clamp(dragRef.current.oy + cy - dragRef.current.sy, -maxY, maxY)
        setOffset({ x: newX, y: newY })
        onPhotoOffsetChange?.(newX, newY)
      }
      // Text drag
      if (textDragRef.current) {
        const textAreaW = cardW - padL - padR
        const rawX = textDragRef.current.ox + cx - textDragRef.current.sx
        const rawY = textDragRef.current.oy + cy - textDragRef.current.sy
        const maxTX = Math.max(0, textAreaW / 2 - 6)
        const maxTY = Math.max(0, padB / 2 - 4)
        onLabelOffsetChange?.(clamp(rawX, -maxTX, maxTX), clamp(rawY, -maxTY, maxTY))
      }
    }

    const onEnd = () => {
      dragRef.current = null
      textDragRef.current = null
      setIsDragging(false)
    }

    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }

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
  }, [interactive, photo?.url, photoW, photoH, cardW, padL, padR, padB, onLabelOffsetChange, onPhotoOffsetChange])

  const canDrag = interactive && fitMode !== 'contain' && naturalSize != null && (() => {
    const { maxX, maxY } = getCoverBounds(naturalSize.w, naturalSize.h, photoW, photoH, zoom)
    return maxX > 0.5 || maxY > 0.5
  })()

  function startPhotoDrag(cx: number, cy: number) {
    if (!canDrag) return
    dragRef.current = { sx: cx, sy: cy, ox: stateRef.current.offset.x, oy: stateRef.current.offset.y }
    setIsDragging(true)
  }

  function startTextDrag(cx: number, cy: number) {
    if (!interactive || !photo) return
    textDragRef.current = { sx: cx, sy: cy, ox: photo.labelOffsetX, oy: photo.labelOffsetY }
    setIsDragging(true)
  }

  const cardBgStyle: React.CSSProperties = frame.bgImg
    ? { backgroundImage: frame.bgImg, backgroundColor: frame.bgColor ?? '#fff' }
    : { background: frame.bg }

  // Photo content
  let photoContent: React.ReactNode

  if (photo?.url) {
    if (fitMode === 'contain') {
      photoContent = (
        <div
          style={{
            width: photoW, height: photoH,
            overflow: 'hidden',
            backgroundImage: `url(${photo.url})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt="" style={{ display: 'none' }}
            onLoad={e => { const img = e.currentTarget; setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight }) }}
          />
        </div>
      )
    } else {
      const coverScale = naturalSize ? Math.max(photoW / naturalSize.w, photoH / naturalSize.h) : 1
      const imgW = naturalSize ? naturalSize.w * coverScale * zoom : photoW
      const imgH = naturalSize ? naturalSize.h * coverScale * zoom : photoH
      const posX = (photoW - imgW) / 2 + offset.x
      const posY = (photoH - imgH) / 2 + offset.y

      photoContent = (
        <div
          style={{
            width: photoW, height: photoH,
            overflow: 'hidden',
            cursor: !canDrag ? 'default' : isDragging ? 'grabbing' : (interactive ? 'grab' : 'default'),
            userSelect: 'none',
            touchAction: canDrag ? 'none' : 'auto',
            backgroundImage: `url(${photo.url})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: naturalSize ? `${imgW}px ${imgH}px` : 'cover',
            backgroundPosition: naturalSize ? `${posX}px ${posY}px` : 'center',
            transition: isDragging ? 'none' : 'background-size .08s, background-position .08s',
            flexShrink: 0,
          }}
          onMouseDown={e => { e.preventDefault(); startPhotoDrag(e.clientX, e.clientY) }}
          onTouchStart={e => startPhotoDrag(e.touches[0].clientX, e.touches[0].clientY)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt="" style={{ display: 'none' }}
            onLoad={e => { const img = e.currentTarget; setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight }) }}
          />
        </div>
      )
    }
  } else {
    photoContent = (
      <div style={{
        width: photoW, height: photoH,
        background: 'linear-gradient(135deg, #eeeeee 0%, #e0e0e0 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: Math.max(10, photoW / 6), color: '#ccc' }}>📷</div>
      </div>
    )
  }

  return (
    <div style={{
      width: cardW, height: cardH,
      ...cardBgStyle,
      borderRadius: 4,
      boxShadow: '3px 5px 18px rgba(0,0,0,0.18), 1px 2px 6px rgba(0,0,0,0.10)',
      display: 'flex',
      paddingTop: padT, paddingRight: padR, paddingBottom: padB, paddingLeft: padL,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      flexShrink: 0,
      position: 'relative',
      transition: 'width .3s ease, height .3s ease, padding .3s ease',
    }}>
      {photoContent}

      {/* Testo nel bordo inferiore */}
      {photo?.label && (
        <div style={{
          position: 'absolute',
          left: padL, right: padR,
          bottom: 0, height: padB,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <span
            style={{
              position: 'absolute',
              transform: `translate(${photo.labelOffsetX}px, ${photo.labelOffsetY}px)`,
              fontSize: photo.labelSize,
              fontWeight: photo.labelBold ? 700 : 400,
              fontStyle: photo.labelItalic ? 'italic' : 'normal',
              color: photo.labelColor,
              fontFamily: photo.labelFont,
              textAlign: photo.labelAlign,
              cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              maxWidth: cardW - padL - padR,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: interactive ? 'auto' : 'none',
              touchAction: 'none',
            }}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); startTextDrag(e.clientX, e.clientY) }}
            onTouchStart={e => { e.stopPropagation(); startTextDrag(e.touches[0].clientX, e.touches[0].clientY) }}
          >
            {photo.label}
          </span>
        </div>
      )}

      {/* Placeholder testo quando interactive e nessun testo */}
      {interactive && photo && !photo.label && padB > 14 && (
        <div style={{
          position: 'absolute',
          left: padL, right: padR,
          bottom: 0, height: padB,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: Math.min(10, padB * 0.35), color: 'rgba(0,0,0,0.2)', fontFamily: 'sans-serif' }}>
            Aggiungi testo ↓
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function InstaxPage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step,          setStep]          = useState<1 | 2 | 3>(1)
  const [format,        setFormat]        = useState(FORMATS[0])
  const [frame,         setFrame]         = useState(FRAMES[0])
  const [photos,        setPhotos]        = useState<UploadedPhoto[]>([])
  const [activeId,      setActiveId]      = useState<string | null>(null)
  const [isDragOver,    setIsDragOver]    = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(false)

  const activePhoto = photos.find(p => p.id === activeId) ?? null
  const totalPrints = photos.reduce((s, p) => s + p.copies, 0)
  const unitPrice   = getPriceForQty(totalPrints)
  const totalPrice  = totalPrints * unitPrice

  // Carica Google Fonts per il testo
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Pacifico&family=Dancing+Script:wght@700&family=Satisfy&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  useEffect(() => {
    return () => { photos.forEach(p => URL.revokeObjectURL(p.url)) }
  }, []) // eslint-disable-line

  const loadFiles = useCallback((files: FileList | File[]) => {
    Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .forEach(file => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
          const newPhoto: UploadedPhoto = {
            id: uid(), url,
            natW: img.naturalWidth, natH: img.naturalHeight,
            zoom: 1, offsetX: 0, offsetY: 0, copies: 1,
            fitMode: 'cover',
            label: '', labelSize: 12, labelColor: '#333333',
            labelBold: false, labelItalic: false, labelAlign: 'center',
            labelFont: 'Pacifico, cursive',
            labelOffsetX: 0, labelOffsetY: 0,
          }
          setPhotos(prev => {
            const updated = [...prev, newPhoto]
            if (prev.length === 0) setActiveId(newPhoto.id)
            return updated
          })
        }
        img.src = url
      })
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) loadFiles(e.target.files)
    e.target.value = ''
  }, [loadFiles])

  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const onDragLeave = useCallback(() => setIsDragOver(false), [])
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    if (e.dataTransfer.files) loadFiles(e.dataTransfer.files)
  }, [loadFiles])

  function removePhoto(id: string) {
    setPhotos(prev => {
      const p = prev.find(x => x.id === id)
      if (p) URL.revokeObjectURL(p.url)
      const next = prev.filter(x => x.id !== id)
      if (activeId === id) setActiveId(next[0]?.id ?? null)
      return next
    })
  }

  function updatePhoto(id: string, patch: Partial<UploadedPhoto>) {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  const handleLabelOffsetChange = useCallback((x: number, y: number) => {
    setPhotos(prev => prev.map(p => p.id === activeId ? { ...p, labelOffsetX: x, labelOffsetY: y } : p))
  }, [activeId])

  function handleAddToCart() {
    photos.forEach(p => {
      addItem({
        productId:    'stampe-instax',
        variantId:    `${format.id}__${frame.id}`,
        quantity:     p.copies,
        productName:  'Stampa Instax',
        variantLabel: `${format.label} — ${frame.label}`,
        price:        unitPrice,
        image:        p.url,
      })
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2500)
  }

  // Stile bottone controllo testo
  const txtBtn = (active: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 6, border: `1.5px solid ${active ? '#00c1de' : '#e0e0e0'}`,
    background: active ? '#00c1de' : '#fff', color: active ? '#fff' : '#555',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  })

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>

      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileInput} />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '12px clamp(20px, 5vw, 60px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#999', maxWidth: 1140, margin: '0 auto' }}>
          <Link href="/shop"         style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <Link href="/shop/stampe"  style={{ color: '#777', textDecoration: 'none' }}>Stampe</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Instax / Polaroid</span>
        </nav>
      </div>

      {/* Step bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)', display: 'flex', alignItems: 'center', gap: 0 }}>
          {[
            { n: 1 as const, label: 'Formato e grafica' },
            { n: 2 as const, label: 'Carica foto' },
            { n: 3 as const, label: 'Il tuo ordine' },
          ].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <div style={{ width: 32, height: 1, background: step > i ? '#00c1de' : '#e0e0e0', margin: '0 6px' }} />
              )}
              <button
                onClick={() => {
                  if (s.n < step) setStep(s.n)
                  else if (s.n === 2) setStep(2)
                  else if (s.n === 3 && photos.length > 0) setStep(3)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 4px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: step >= s.n ? '#00c1de' : '#e0e0e0',
                  color: step >= s.n ? '#fff' : '#aaa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, flexShrink: 0, transition: 'background .2s',
                }}>
                  {step > s.n ? <Check size={13} strokeWidth={3} /> : s.n}
                </div>
                <span style={{
                  fontSize: '12px', fontWeight: step === s.n ? 700 : 400,
                  color: step >= s.n ? '#0a0a0a' : '#bbb',
                }}>
                  {s.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)' }}>

        {/* ══ STEP 1: Formato + Grafica ══════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div>
              <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(24px, 3vw, 34px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
                Stampa Instax / Polaroid
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
                Scegli il formato, seleziona una grafica e carica le tue foto.
              </p>
            </div>

            {/* Formato */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 16 }}>Formato</p>
              <div className="shop-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {FORMATS.map(f => {
                  const active = format.id === f.id
                  const prevH = 110
                  const prevW = Math.round(prevH * f.outerW / f.outerH)
                  const scX = prevW / f.outerW; const scY = prevH / f.outerH
                  const phW = Math.round(f.photoW * scX); const phH = Math.round(f.photoH * scY)
                  const pT  = Math.round(f.pad[0] * scY);  const pL = Math.round(f.pad[3] * scX)

                  return (
                    <button key={f.id} onClick={() => setFormat(f)} style={{
                      border: `2px solid ${active ? '#00c1de' : '#e0e0e0'}`,
                      borderRadius: 14, background: active ? 'rgba(0,193,222,0.04)' : '#fff',
                      padding: '20px', cursor: 'pointer', transition: 'all .15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                      fontFamily: 'Montserrat, sans-serif', position: 'relative',
                    }}>
                      <div style={{
                        width: prevW, height: prevH,
                        background: active ? 'rgba(0,193,222,0.08)' : '#f0f0f0',
                        border: `1px solid ${active ? '#00c1de' : '#ddd'}`,
                        borderRadius: 3, position: 'relative',
                        boxShadow: '2px 3px 10px rgba(0,0,0,0.12)',
                        paddingTop: pT, paddingLeft: pL,
                        display: 'flex', alignItems: 'flex-start',
                      }}>
                        <div style={{ width: phW, height: phH, background: active ? 'rgba(0,193,222,0.2)' : '#d8d8d8', flexShrink: 0 }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: active ? '#00c1de' : '#0a0a0a', marginBottom: 3 }}>{f.label}</p>
                        <p style={{ fontSize: '11px', color: '#aaa', marginBottom: 4 }}>{f.desc}</p>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#00c1de' }}>{formatPrice(f.price)} / cad.</p>
                      </div>
                      {active && (
                        <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={11} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Grafica */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 16 }}>Scegli una grafica</p>
              <div className="shop-format-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {FRAMES.map(fr => {
                  const active = frame.id === fr.id
                  const prevW = 86
                  const prevH = Math.round(prevW * format.outerH / format.outerW)
                  const scX = prevW / format.outerW; const scY = prevH / format.outerH
                  const phW = Math.round(format.photoW * scX); const phH = Math.round(format.photoH * scY)
                  const pT  = Math.round(format.pad[0] * scY);  const pL = Math.round(format.pad[3] * scX)
                  const cardBgStyle: React.CSSProperties = fr.bgImg
                    ? { backgroundImage: fr.bgImg, backgroundColor: fr.bgColor ?? '#fff' }
                    : { background: fr.bg }

                  return (
                    <button key={fr.id} onClick={() => setFrame(fr)} style={{
                      border: `3px solid ${active ? '#00c1de' : 'transparent'}`,
                      borderRadius: 10, background: '#f0f0f0',
                      padding: '12px 8px', cursor: 'pointer', transition: 'all .15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      boxShadow: active ? '0 0 0 2px rgba(0,193,222,0.25)' : 'none',
                      position: 'relative', fontFamily: 'Montserrat, sans-serif',
                    }}>
                      <div style={{
                        width: prevW, height: prevH, ...cardBgStyle,
                        borderRadius: 3, boxShadow: '2px 3px 8px rgba(0,0,0,0.14)',
                        paddingTop: pT, paddingLeft: pL,
                        display: 'flex', alignItems: 'flex-start', flexShrink: 0,
                      }}>
                        <div style={{ width: phW, height: phH, background: '#fff', flexShrink: 0 }} />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: active ? '#00c1de' : '#666' }}>
                        {fr.label}
                      </span>
                      {active && (
                        <div style={{ position: 'absolute', top: 5, right: 5, width: 16, height: 16, borderRadius: '50%', background: '#00c1de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={9} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tabella prezzi per quantità */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: 20 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>
                Prezzi per quantità — tutti i formati
              </p>
              <div className="shop-format-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
                {PRICE_BREAKS.map((b, i) => {
                  const next = PRICE_BREAKS[i + 1]
                  const label = next ? `${b.minQty}–${next.minQty - 1}` : `${b.minQty}+`
                  return (
                    <div key={b.minQty} style={{
                      padding: '8px 10px', borderRadius: 8,
                      background: '#f9f9f9', border: '1px solid #f0f0f0',
                      display: 'flex', flexDirection: 'column', gap: 2,
                    }}>
                      <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 600 }}>{label} pz</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#00c1de' }}>{formatPrice(b.price)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  background: '#00c1de', color: '#fff', border: 'none', borderRadius: 12,
                  padding: '14px 32px', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                  fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#009ab3')}
                onMouseLeave={e => (e.currentTarget.style.background = '#00c1de')}
              >
                Avanti <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Carica foto ════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 740, margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
                Aggiunta foto
              </h2>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Aggiungi le foto che vuoi stampare in formato <b>{format.label}</b>
              </p>
            </div>

            <div
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragOver ? '#00c1de' : '#c8c8c8'}`,
                borderRadius: 16,
                background: isDragOver ? 'rgba(0,193,222,0.04)' : '#fff',
                padding: 'clamp(36px, 6vw, 56px) 32px',
                textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: '44px', marginBottom: 16 }}>📁</div>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '17px', color: '#0a0a0a', marginBottom: 8 }}>
                {photos.length === 0 ? 'Trascina le foto qui' : `${photos.length} foto aggiunte`}
              </p>
              <p style={{ fontSize: '13px', color: '#aaa', marginBottom: 24 }}>
                Puoi anche trascinare qui gli elementi da aggiungere
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <span style={{ border: '1.5px solid #00c1de', borderRadius: 100, padding: '8px 22px', fontSize: '13px', fontWeight: 600, color: '#00c1de' }}>
                  aggiungi file...
                </span>
              </div>
            </div>

            {photos.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>{photos.length} foto caricate</p>
                  <button onClick={() => fileInputRef.current?.click()} style={{ fontSize: '12px', fontWeight: 600, color: '#00c1de', background: 'none', border: 'none', cursor: 'pointer' }}>
                    + Aggiungi altre
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                  {photos.map(p => (
                    <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#e0e0e0' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={e => { e.stopPropagation(); removePhoto(p.id) }}
                        style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: '2px solid #e0e0e0', borderRadius: 12, padding: '12px 22px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={16} /> Indietro
              </button>
              <button
                onClick={() => { if (photos.length > 0) setStep(3) }}
                disabled={photos.length === 0}
                style={{
                  background: photos.length > 0 ? '#00c1de' : '#d0d0d0',
                  color: '#fff', border: 'none', borderRadius: 12,
                  padding: '14px 32px', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                  fontSize: '15px', cursor: photos.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                Avanti <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Il tuo ordine ══════════════════════════════════════════ */}
        {step === 3 && (
          <div className="shop-cfg-grid" style={{ display: 'grid', gridTemplateColumns: '1fr minmax(300px, 380px)', gap: 32, alignItems: 'start' }}>

            {/* Sinistra: griglia foto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '22px', color: '#0a0a0a', marginBottom: 4 }}>Il tuo ordine</h2>
                  <p style={{ fontSize: '12px', color: '#aaa' }}>{format.label} — {frame.label} · {totalPrints} stampe</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: '1.5px solid #00c1de', borderRadius: 100, padding: '7px 16px', fontSize: '12px', fontWeight: 600, color: '#00c1de', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Upload size={12} /> Aggiungi foto
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    style={{ border: '1.5px solid #e0e0e0', borderRadius: 100, padding: '7px 16px', fontSize: '12px', fontWeight: 600, color: '#666', background: 'none', cursor: 'pointer' }}
                  >
                    Cambia grafica
                  </button>
                </div>
              </div>

              <div className="shop-thumb-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {photos.map(p => {
                  const isActive = activeId === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveId(p.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                        cursor: 'pointer', padding: 12, borderRadius: 12,
                        border: `2px solid ${isActive ? '#00c1de' : 'transparent'}`,
                        background: isActive ? 'rgba(0,193,222,0.04)' : 'transparent',
                        transition: 'all .15s',
                      }}
                    >
                      <InstaxCard photo={p} format={format} frame={frame} cardW={150} interactive={false} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
                          <button
                            onClick={e => { e.stopPropagation(); updatePhoto(p.id, { copies: Math.max(1, p.copies - 1) }) }}
                            style={{ width: 28, height: 28, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Minus size={11} color="#555" />
                          </button>
                          <span style={{ width: 28, textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>
                            {p.copies}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); updatePhoto(p.id, { copies: p.copies + 1 }) }}
                            style={{ width: 28, height: 28, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Plus size={11} color="#555" />
                          </button>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); removePhoto(p.id) }}
                          style={{ width: 28, height: 28, border: 'none', background: '#fee', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={12} color="#e55" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Destra: pannello editing + cart (sticky) */}
            <div className="shop-sticky shop-first-mobile" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {activePhoto ? (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', alignSelf: 'flex-start' }}>
                    Modifica foto selezionata
                  </p>

                  <InstaxCard
                    photo={activePhoto} format={format} frame={frame}
                    cardW={220} interactive
                    onLabelOffsetChange={handleLabelOffsetChange}
                    onPhotoOffsetChange={(x, y) => updatePhoto(activePhoto.id, { offsetX: x, offsetY: y })}
                  />

                  {/* Stampa intera senza ritaglio */}
                  <button
                    onClick={() => updatePhoto(activePhoto.id, { fitMode: activePhoto.fitMode === 'contain' ? 'cover' : 'contain' })}
                    style={{
                      width: '100%', padding: '8px 14px', borderRadius: 10,
                      border: `1.5px solid ${activePhoto.fitMode === 'contain' ? '#00c1de' : '#e0e0e0'}`,
                      background: activePhoto.fitMode === 'contain' ? 'rgba(0,193,222,0.08)' : '#fff',
                      color: activePhoto.fitMode === 'contain' ? '#00c1de' : '#666',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      transition: 'all .15s',
                    }}
                  >
                    <Maximize2 size={13} />
                    Stampa intera senza ritaglio
                    {activePhoto.fitMode === 'contain' && <Check size={12} strokeWidth={3} />}
                  </button>

                  {/* Zoom slider (solo in modalità cover) */}
                  {activePhoto.fitMode !== 'contain' && (
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ZoomIn size={13} color="#888" />
                      <input
                        type="range" min={1} max={3} step={0.01} value={activePhoto.zoom}
                        onChange={e => updatePhoto(activePhoto.id, { zoom: Number(e.target.value) })}
                        style={{ flex: 1, accentColor: '#00c1de', cursor: 'pointer', height: 4 }}
                      />
                      <span style={{ fontSize: '11px', color: '#aaa', minWidth: 34, textAlign: 'right' }}>
                        {Math.round(activePhoto.zoom * 100)}%
                      </span>
                    </div>
                  )}

                  {activePhoto.fitMode !== 'contain' && (
                    <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', margin: '-8px 0 0' }}>
                      Trascina la foto per spostarla nella cornice
                    </p>
                  )}

                  {/* ── Testo ─────────────────────────────────────── */}
                  <div style={{ width: '100%', borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>
                      Testo nella cornice
                    </p>

                    {/* Riga controlli */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>

                      {/* Dimensione font */}
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
                        <button
                          onClick={() => updatePhoto(activePhoto.id, { labelSize: Math.max(8, activePhoto.labelSize - 1) })}
                          style={{ width: 26, height: 28, border: 'none', background: '#f7f7f7', cursor: 'pointer', fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={10} />
                        </button>
                        <span style={{ width: 28, textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                          {activePhoto.labelSize}
                        </span>
                        <button
                          onClick={() => updatePhoto(activePhoto.id, { labelSize: Math.min(40, activePhoto.labelSize + 1) })}
                          style={{ width: 26, height: 28, border: 'none', background: '#f7f7f7', cursor: 'pointer', fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Colore */}
                      <div style={{ position: 'relative', flexShrink: 0, width: 30, height: 30 }}>
                        <div style={{
                          width: 30, height: 30, background: activePhoto.labelColor,
                          border: '2px solid #e0e0e0', borderRadius: 6, pointerEvents: 'none',
                        }} />
                        <input
                          type="color" value={activePhoto.labelColor}
                          onChange={e => updatePhoto(activePhoto.id, { labelColor: e.target.value })}
                          style={{
                            position: 'absolute', inset: 0, opacity: 0,
                            width: '100%', height: '100%',
                            cursor: 'pointer', border: 'none', padding: 0,
                          }}
                        />
                      </div>

                      {/* Grassetto */}
                      <button
                        onClick={() => updatePhoto(activePhoto.id, { labelBold: !activePhoto.labelBold })}
                        style={txtBtn(activePhoto.labelBold)}
                      >
                        <Bold size={13} />
                      </button>

                      {/* Corsivo */}
                      <button
                        onClick={() => updatePhoto(activePhoto.id, { labelItalic: !activePhoto.labelItalic })}
                        style={txtBtn(activePhoto.labelItalic)}
                      >
                        <Italic size={13} />
                      </button>

                      {/* Allineamento */}
                      {([
                        { v: 'left'   as const, lines: [[2,10],[2,7],[2,9]] },
                        { v: 'center' as const, lines: [[3,10],[4,7],[3,9]] },
                        { v: 'right'  as const, lines: [[4,10],[5,7],[3,9]] },
                      ]).map(({ v, lines }) => (
                        <button key={v} onClick={() => updatePhoto(activePhoto.id, { labelAlign: v })} style={txtBtn(activePhoto.labelAlign === v)}>
                          <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                            {lines.map(([x, w], i) => (
                              <rect key={i} x={x} y={i * 4} width={w} height={2}
                                fill={activePhoto.labelAlign === v ? '#fff' : '#555'} rx={1} />
                            ))}
                          </svg>
                        </button>
                      ))}
                    </div>

                    {/* Font selector */}
                    <select
                      value={activePhoto.labelFont}
                      onChange={e => updatePhoto(activePhoto.id, { labelFont: e.target.value })}
                      style={{
                        width: '100%', marginBottom: 8, padding: '7px 10px',
                        border: '1.5px solid #e0e0e0', borderRadius: 8,
                        fontSize: '13px', fontFamily: activePhoto.labelFont, color: '#333',
                        background: '#fff', cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {LABEL_FONTS.map(f => (
                        <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>
                          {f.label}
                        </option>
                      ))}
                    </select>

                    {/* Input testo */}
                    <input
                      type="text"
                      placeholder="Scrivi qualcosa..."
                      value={activePhoto.label}
                      onChange={e => updatePhoto(activePhoto.id, { label: e.target.value, labelOffsetX: 0, labelOffsetY: 0 })}
                      style={{
                        width: '100%', padding: '8px 10px', boxSizing: 'border-box',
                        border: '1.5px solid #e0e0e0', borderRadius: 8,
                        fontSize: activePhoto.labelSize, fontFamily: activePhoto.labelFont,
                        fontWeight: activePhoto.labelBold ? 700 : 400,
                        fontStyle: activePhoto.labelItalic ? 'italic' : 'normal',
                        color: activePhoto.labelColor, outline: 'none',
                        textAlign: activePhoto.labelAlign,
                      }}
                    />

                    {activePhoto.label && (
                      <p style={{ fontSize: '11px', color: '#bbb', marginTop: 6, textAlign: 'center' }}>
                        Trascina il testo nell&apos;anteprima per spostarlo
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 20, textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
                  Seleziona una foto per modificarla
                </div>
              )}

              {/* Riepilogo + CTA */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Totale ordine</p>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '26px', color: '#00c1de', lineHeight: 1 }}>
                      {formatPrice(totalPrice)}
                    </p>
                  </div>
                  <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'right' }}>
                    {totalPrints} stampe<br />× {formatPrice(unitPrice)} cad.
                  </p>
                </div>

                <div style={{ fontSize: '12px', color: '#888', padding: '8px 10px', background: '#f9f9f9', borderRadius: 8, lineHeight: 1.6 }}>
                  <b style={{ color: '#555' }}>{format.label}</b> — {frame.label}
                </div>

                <button
                  onClick={handleAddToCart}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: addedFeedback ? '#22c55e' : '#00c1de',
                    color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                    fontSize: '14px', cursor: 'pointer', transition: 'background .2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {addedFeedback ? (
                    <><Check size={17} strokeWidth={3} /> Aggiunto al carrello!</>
                  ) : (
                    <><ShoppingCart size={17} /> Aggiungi al carrello</>
                  )}
                </button>

                <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
                  Spedizione calcolata al checkout · Carta fotografica originale
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                style={{ background: 'none', border: '2px solid #e0e0e0', borderRadius: 12, padding: '11px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <ChevronLeft size={15} /> Indietro
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

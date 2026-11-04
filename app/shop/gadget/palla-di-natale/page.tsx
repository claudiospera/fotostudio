'use client'

// app/shop/gadget/palla-di-natale/page.tsx
// Palla di Natale con foto — canvas preview con maschera circolare (per misura) + testo overlay

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Minus, Plus, ShoppingCart, Upload, RotateCcw, ZoomIn, Type } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'
import { normalizeImageOrientation } from '@/lib/shop/normalize-image'

function fmt(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

type SizeId = '8' | '10'

interface SizeConfig {
  id: SizeId
  label: string
  price: number
  maskSrc: string
  outLong: number  // lato lungo del file di stampa a 300dpi
}

const SIZES: SizeConfig[] = [
  { id: '8',  label: '8 cm',  price: 900,  maskSrc: '/images/shop/gadget/palla-natale/maschera-8.png',  outLong: 945 },
  { id: '10', label: '10 cm', price: 1100, maskSrc: '/images/shop/gadget/palla-natale/maschera-10.png', outLong: 1181 },
]

interface ColorConfig {
  id: string
  label: string
  image: string
  sizes: SizeId[]
  glitter: boolean
}

const COLORS: ColorConfig[] = [
  { id: 'rosso',          label: 'Rosso glitter',   image: '/images/shop/gadget/palla-natale/rosso.jpg',          sizes: ['8', '10'], glitter: true },
  { id: 'oro',            label: 'Oro glitter',     image: '/images/shop/gadget/palla-natale/oro.jpg',            sizes: ['8', '10'], glitter: true },
  { id: 'argento',        label: 'Argento glitter', image: '/images/shop/gadget/palla-natale/argento.jpg',        sizes: ['8', '10'], glitter: true },
  { id: 'caramel',        label: 'Caramel glitter', image: '/images/shop/gadget/palla-natale/caramel.jpg',        sizes: ['8', '10'], glitter: true },
  { id: 'rosa-glitter',   label: 'Rosa glitter',    image: '/images/shop/gadget/palla-natale/rosa-glitter.jpg',   sizes: ['8', '10'], glitter: true },
  { id: 'bianco-glitter', label: 'Bianco glitter',  image: '/images/shop/gadget/palla-natale/bianco-glitter.png', sizes: ['8'],       glitter: true },
  { id: 'verde',          label: 'Verde glitter',   image: '/images/shop/gadget/palla-natale/verde.jpg',          sizes: ['8'],       glitter: true },
  { id: 'bianco-rombi',   label: 'Bianco a rombi',  image: '/images/shop/gadget/palla-natale/bianco-rombi.jpg',   sizes: ['10'],      glitter: false },
  { id: 'rosa-satinato',  label: 'Rosa satinato',   image: '/images/shop/gadget/palla-natale/rosa-satinato.jpg',  sizes: ['10'],      glitter: false },
]

const DEFAULT_SIZE: SizeId = '10'
const DEFAULT_COLOR = 'rosso'

const BASE_PREVIEW_LONG = 320

function dimsForMask(maskW: number, maskH: number, targetLong: number) {
  if (maskW >= maskH) {
    const w = targetLong
    const h = Math.round((targetLong * maskH) / maskW)
    return { w, h }
  }
  const h = targetLong
  const w = Math.round((targetLong * maskW) / maskH)
  return { w, h }
}

const FONTS = [
  { id: 'montserrat',  label: 'Montserrat',      css: 'Montserrat, sans-serif' },
  { id: 'poppins',     label: 'Poppins',          css: 'Poppins, sans-serif' },
  { id: 'georgia',     label: 'Georgia',          css: 'Georgia, serif' },
  { id: 'pacifico',    label: 'Pacifico',         css: 'Pacifico, cursive' },
  { id: 'dancing',     label: 'Dancing Script',   css: '"Dancing Script", cursive' },
  { id: 'playfair',    label: 'Playfair Display', css: '"Playfair Display", serif' },
  { id: 'lobster',     label: 'Lobster',          css: 'Lobster, cursive' },
  { id: 'anton',       label: 'Anton',            css: 'Anton, sans-serif' },
]

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Pacifico&family=Dancing+Script:wght@700&family=Playfair+Display:wght@700&family=Roboto+Slab:wght@700&family=Anton&family=Lobster&display=swap'

const PALETTE = [
  '#000000','#333333','#666666','#999999','#cccccc','#ffffff',
  '#c0272d','#e84848','#ff8080','#ff4400','#ff7733','#ffaa00',
  '#ffcc00','#dddd00','#99cc00','#2d8c27','#4caf50','#00aa66',
  '#006633','#00c1de','#0088cc','#003399','#2244aa','#4466ff',
  '#6600cc','#9933cc','#cc66ff','#ff00ff','#cc0088','#c05080',
]

// ─── Bozza persistita (sessionStorage) ─────────────────────────────────────────
// Salviamo solo i metadati leggeri della foto già caricata su R2 (mai il blob/File),
// così se il cliente lascia la pagina senza cliccare "Aggiungi al carrello" la
// personalizzazione (inclusi misura e colore) non va persa.

const DRAFT_KEY = 'pn-draft-v1'

interface Draft {
  sizeId: SizeId
  colorId: string
  uploadedUrl: string
  filename?: string
  natW: number; natH: number
  zoom: number
  offsetX: number; offsetY: number
  text: string
  fontId: string
  textColor: string
  textSize: number
  textBold: boolean
  textPosX: number; textPosY: number
  qty: number
}

type MaskStatus = 'loading' | 'loaded' | 'error'

export default function PallaDiNatalePage() {
  const { addItem } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const previewRef   = useRef<HTMLDivElement>(null)
  const maskImgsRef  = useRef<Record<SizeId, HTMLImageElement | null>>({ '8': null, '10': null })
  const photoImgRef  = useRef<HTMLImageElement | null>(null)

  // ── Misura e colore ──
  const [sizeId,  setSizeId]  = useState<SizeId>(DEFAULT_SIZE)
  const [colorId, setColorId] = useState(DEFAULT_COLOR)
  const [colorSwitchMessage, setColorSwitchMessage] = useState<string | null>(null)

  const size  = useMemo(() => SIZES.find(s => s.id === sizeId)!, [sizeId])
  const color = useMemo(() => COLORS.find(c => c.id === colorId)!, [colorId])
  const availableColors = useMemo(() => COLORS.filter(c => c.sizes.includes(sizeId)), [sizeId])

  // ── Maschere (una per misura) ──
  const [maskNatSize, setMaskNatSize] = useState<Record<SizeId, { w: number; h: number } | null>>({ '8': null, '10': null })
  const [maskStatus,  setMaskStatus]  = useState<Record<SizeId, MaskStatus>>({ '8': 'loading', '10': 'loading' })

  // ── Foto ──
  const fileRef         = useRef<File | null>(null)
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null)
  const [uploadedUrl,   setUploadedUrl]   = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [uploadFailed,  setUploadFailed]  = useState(false)
  const [isRendering,   setIsRendering]   = useState(false)
  const [composeError,  setComposeError]  = useState(false)
  const [photoFilename, setPhotoFilename] = useState<string | undefined>(undefined)
  const [photoZoom,     setPhotoZoom]     = useState(1)
  const [photoOffset,   setPhotoOffset]   = useState({ x: 0, y: 0 })
  const [photoNatSize,  setPhotoNatSize]  = useState<{ w: number; h: number } | null>(null)

  // ── Testo ──
  const [text,      setText]      = useState('')
  const [font,      setFont]      = useState(FONTS[0])
  const [textColor, setTextColor] = useState('#ffffff')
  const [textSize,  setTextSize]  = useState(18)
  const [textBold,  setTextBold]  = useState(false)
  const [textPos,   setTextPos]   = useState({ x: 0.5, y: 0.82 })

  // ── UI ──
  const [qty,           setQty]           = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [tab,           setTab]           = useState<'foto' | 'testo'>('foto')

  // Dimensioni anteprima/output derivate dalle proporzioni reali della maschera —
  // mai assunte quadrate, anche se le maschere attuali lo sono.
  const currentMaskNat = maskNatSize[sizeId]
  const previewDims = useMemo(
    () => dimsForMask(currentMaskNat?.w ?? 1, currentMaskNat?.h ?? 1, BASE_PREVIEW_LONG),
    [currentMaskNat]
  )
  const outputDims = useMemo(
    () => dimsForMask(currentMaskNat?.w ?? 1, currentMaskNat?.h ?? 1, size.outLong),
    [currentMaskNat, size.outLong]
  )
  const scaleX = outputDims.w / previewDims.w
  const scaleY = outputDims.h / previewDims.h

  // Carica Google Fonts
  useEffect(() => {
    if (document.getElementById('gf-pn')) return
    const link = document.createElement('link')
    link.id = 'gf-pn'; link.rel = 'stylesheet'; link.href = GOOGLE_FONTS_URL
    document.head.appendChild(link)
  }, [])

  // Pre-carica entrambe le maschere (8 e 10 cm)
  useEffect(() => {
    SIZES.forEach(s => {
      const m = new window.Image()
      m.onload = () => {
        maskImgsRef.current[s.id] = m
        setMaskNatSize(prev => ({ ...prev, [s.id]: { w: m.naturalWidth, h: m.naturalHeight } }))
        setMaskStatus(prev => ({ ...prev, [s.id]: 'loaded' }))
      }
      m.onerror = () => setMaskStatus(prev => ({ ...prev, [s.id]: 'error' }))
      m.src = s.maskSrc
    })
  }, [])

  // ─── Ridisegna canvas ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, previewDims.w, previewDims.h)
    const photo = photoImgRef.current
    const mask  = maskImgsRef.current[sizeId]
    if (!photo || !mask || !photoNatSize || maskStatus[sizeId] !== 'loaded') return

    const containScale = Math.min(previewDims.w / photoNatSize.w, previewDims.h / photoNatSize.h)
    const w = photoNatSize.w * containScale * photoZoom
    const h = photoNatSize.h * containScale * photoZoom
    const x = (previewDims.w - w) / 2 + photoOffset.x
    const y = (previewDims.h - h) / 2 + photoOffset.y

    ctx.drawImage(photo, x, y, w, h)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(mask, 0, 0, previewDims.w, previewDims.h)
    ctx.globalCompositeOperation = 'source-over'
  }, [sizeId, maskStatus, photoNatSize, photoZoom, photoOffset, previewDims])

  // Cleanup blob
  useEffect(() => {
    return () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }
  }, [photoUrl])

  // Ripristina la bozza salvata (se presente) al primo caricamento della pagina
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft: Draft = JSON.parse(raw)
      if (!draft.uploadedUrl) return
      const restoredUrl = draft.uploadedUrl
      // Idratazione da sessionStorage al mount (sistema esterno) — non derivabile dal render
      setSizeId(draft.sizeId)
      setColorId(draft.colorId)
      setPhotoUrl(restoredUrl)
      setUploadedUrl(restoredUrl)
      setPhotoFilename(draft.filename)
      setPhotoZoom(draft.zoom)
      setPhotoOffset({ x: draft.offsetX, y: draft.offsetY })
      setText(draft.text)
      setFont(FONTS.find(f => f.id === draft.fontId) ?? FONTS[0])
      setTextColor(draft.textColor)
      setTextSize(draft.textSize)
      setTextBold(draft.textBold)
      setTextPos({ x: draft.textPosX, y: draft.textPosY })
      setQty(draft.qty)
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        photoImgRef.current = img
        setPhotoNatSize({ w: draft.natW, h: draft.natH })
      }
      img.src = draft.uploadedUrl
    } catch {
      sessionStorage.removeItem(DRAFT_KEY)
    }
  }, []) // eslint-disable-line

  // Salva la bozza (debounced) ad ogni modifica — solo se la foto è già stata caricata su R2
  useEffect(() => {
    if (!uploadedUrl || uploading) {
      sessionStorage.removeItem(DRAFT_KEY)
      return
    }
    const t = setTimeout(() => {
      const draft: Draft = {
        sizeId, colorId,
        uploadedUrl,
        filename: photoFilename,
        natW: photoNatSize?.w ?? 0,
        natH: photoNatSize?.h ?? 0,
        zoom: photoZoom,
        offsetX: photoOffset.x,
        offsetY: photoOffset.y,
        text,
        fontId: font.id,
        textColor,
        textSize,
        textBold,
        textPosX: textPos.x,
        textPosY: textPos.y,
        qty,
      }
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    }, 400)
    return () => clearTimeout(t)
  }, [sizeId, colorId, uploadedUrl, uploading, photoFilename, photoNatSize, photoZoom, photoOffset, text, font, textColor, textSize, textBold, textPos, qty])

  // ─── Cambio misura: se il colore scelto non è disponibile, passa al primo disponibile ──
  const handleSizeChange = useCallback((newSize: SizeId) => {
    setSizeId(newSize)
    setColorId(prevColorId => {
      const prevColor = COLORS.find(c => c.id === prevColorId)
      if (prevColor?.sizes.includes(newSize)) return prevColorId
      const fallback = COLORS.find(c => c.sizes.includes(newSize))
      if (fallback) {
        setColorSwitchMessage(`"${prevColor?.label ?? prevColorId}" non è disponibile in ${newSize} cm — selezionato "${fallback.label}".`)
        setTimeout(() => setColorSwitchMessage(null), 4500)
        return fallback.id
      }
      return prevColorId
    })
  }, [])

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
    const tm = (e: TouchEvent) => { if (!photoDragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
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

  // ─── Drag testo ───────────────────────────────────────────────────────────
  const textDragRef  = useRef<{ sx: number; sy: number } | null>(null)
  const textPosRef   = useRef(textPos)
  useEffect(() => { textPosRef.current = textPos }, [textPos])

  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      if (!textDragRef.current) return
      const rect = previewRef.current?.getBoundingClientRect()
      if (!rect) return
      setTextPos({
        x: Math.max(0.02, Math.min(0.98, (cx - rect.left) / rect.width)),
        y: Math.max(0.02, Math.min(0.98, (cy - rect.top)  / rect.height)),
      })
    }
    const onEnd = () => { textDragRef.current = null }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { if (!textDragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
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
  }, [])

  // ─── Upload foto ──────────────────────────────────────────────────────────
  const uploadToR2 = useCallback(async (file: File) => {
    try {
      const uploadFile = await normalizeImageOrientation(file)
      const res = await fetch('/api/shop/presign-photo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: uploadFile.name, contentType: uploadFile.type }),
      })
      if (res.ok) {
        const { uploadUrl, publicUrl } = await res.json()
        const putRes = await fetch(uploadUrl, { method: 'PUT', body: uploadFile, headers: { 'Content-Type': uploadFile.type || 'image/jpeg' } })
        if (putRes.ok || putRes.status === 200) {
          setUploadedUrl(publicUrl)
          setUploadFailed(false)
        } else {
          setUploadFailed(true)
        }
      } else {
        setUploadFailed(true)
      }
    } catch {
      setUploadFailed(true)
    }
    setUploading(false)
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    fileRef.current = file
    const localUrl = URL.createObjectURL(file)
    setPhotoUrl(localUrl); setUploadedUrl(null); setUploadFailed(false); setPhotoFilename(file.name)
    setComposeError(false)
    setUploading(true); setPhotoZoom(1); setPhotoOffset({ x: 0, y: 0 }); setPhotoNatSize(null)
    photoImgRef.current = null
    e.target.value = ''
    const img = new window.Image()
    img.src = localUrl
    img.onload = () => { photoImgRef.current = img; setPhotoNatSize({ w: img.naturalWidth, h: img.naturalHeight }) }
    await uploadToR2(file)
  }, [photoUrl, uploadToR2])

  const retryUpload = useCallback(async () => {
    if (!fileRef.current) return
    setUploading(true)
    setUploadFailed(false)
    await uploadToR2(fileRef.current)
  }, [uploadToR2])

  const removePhoto = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    photoImgRef.current = null
    setPhotoUrl(null); setUploadedUrl(null); setPhotoFilename(undefined)
    setPhotoZoom(1); setPhotoOffset({ x: 0, y: 0 }); setPhotoNatSize(null)
    setComposeError(false)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, previewDims.w, previewDims.h)
  }, [photoUrl, previewDims])

  // ─── Add to cart ──────────────────────────────────────────────────────────
  // La foto e la maschera applicata sono obbligatorie: non esiste un ripiego sulla
  // foto originale. Qualsiasi errore di composizione/upload blocca l'aggiunta.
  async function handleAddToCart() {
    if (!photoUrl || uploading || isRendering || uploadFailed) return
    const maskImg = maskImgsRef.current[sizeId]
    if (!photoImgRef.current || !photoNatSize || !maskImg || maskStatus[sizeId] !== 'loaded') {
      setComposeError(true)
      return
    }

    setIsRendering(true)
    setComposeError(false)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = outputDims.w; canvas.height = outputDims.h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no-canvas-context')

      const containScale = Math.min(previewDims.w / photoNatSize.w, previewDims.h / photoNatSize.h)
      const w = photoNatSize.w * containScale * photoZoom
      const h = photoNatSize.h * containScale * photoZoom
      const x = (previewDims.w - w) / 2 + photoOffset.x
      const y = (previewDims.h - h) / 2 + photoOffset.y
      ctx.drawImage(photoImgRef.current, x * scaleX, y * scaleY, w * scaleX, h * scaleY)

      // Testo sopra la foto (prima della maschera)
      if (text.trim()) {
        await document.fonts.ready
        const scaledSize = textSize * scaleX
        ctx.font = `${textBold ? 700 : 400} ${scaledSize}px ${font.css}`
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowBlur = scaledSize * 0.1
        ctx.fillText(text, textPos.x * outputDims.w, textPos.y * outputDims.h)
        ctx.shadowColor = 'transparent'
      }

      ctx.globalCompositeOperation = 'destination-out'
      ctx.drawImage(maskImg, 0, 0, outputDims.w, outputDims.h)
      ctx.globalCompositeOperation = 'source-over'

      const blob = await new Promise<Blob | null>(r => canvas.toBlob(b => r(b), 'image/png'))
      if (!blob) throw new Error('no-blob')

      const res = await fetch('/api/shop/presign-photo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: photoFilename ?? 'palla-di-natale.png', contentType: 'image/png' }),
      })
      if (!res.ok) throw new Error('presign-failed')
      const { uploadUrl, publicUrl } = await res.json()
      const putRes = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/png' } })
      if (!putRes.ok && putRes.status !== 200) throw new Error('upload-failed')

      addItem({
        productId: 'palla-di-natale',
        variantId: `pn-${sizeId}-${colorId}`,
        quantity: qty,
        productName: 'Palla di Natale con foto',
        variantLabel: `${size.label} · ${color.label}${text.trim() ? ` · "${text.trim()}"` : ''}`,
        price: size.price,
        image: publicUrl,
        filename: photoFilename,
      })
      sessionStorage.removeItem(DRAFT_KEY)
      setAddedFeedback(true)
      setTimeout(() => setAddedFeedback(false), 2200)
    } catch {
      setComposeError(true)
    } finally {
      setIsRendering(false)
    }
  }

  const total = size.price * qty
  const canSubmit = !!photoUrl && !uploading && !isRendering && !uploadFailed

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '12px clamp(20px, 5vw, 60px)' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#999', maxWidth: 1140, margin: '0 auto' }}>
          <Link href="/shop" style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <Link href="/shop/gadget" style={{ color: '#777', textDecoration: 'none' }}>Gadget</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Palla di Natale con foto</span>
        </nav>
      </div>

      <div className="shop-cfg-grid" style={{
        maxWidth: 1140, margin: '0 auto',
        padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)',
        display: 'grid', gridTemplateColumns: 'minmax(300px, 500px) 1fr',
        gap: 'clamp(24px, 4vw, 64px)', alignItems: 'start',
      }}>

        {/* ── SINISTRA ──────────────────────────────────────────────────── */}
        <div className="shop-sticky" style={{ position: 'sticky', top: 88 }}>

          {/* Foto prodotto — cambia con il colore selezionato */}
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#f0f0f0', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
            <Image src={color.image} alt={`Palla di Natale ${color.label}`}
              width={400} height={400} style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
          </div>

          <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>
            Anteprima foto nella pallina — {size.label}
          </p>

          {/* Canvas + overlay testo */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div ref={previewRef} style={{ position: 'relative', width: previewDims.w, height: previewDims.h }}>
              <canvas
                ref={canvasRef} width={previewDims.w} height={previewDims.h}
                style={{ display: 'block', cursor: photoUrl ? 'grab' : 'default', userSelect: 'none', touchAction: 'none', borderRadius: 4 }}
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

              {/* Testo overlay preview */}
              {text.trim() && (
                <div
                  style={{
                    position: 'absolute',
                    left: textPos.x * previewDims.w, top: textPos.y * previewDims.h,
                    transform: 'translate(-50%, -50%)',
                    fontFamily: font.css, fontSize: textSize,
                    fontWeight: textBold ? 700 : 400,
                    color: textColor, whiteSpace: 'nowrap',
                    cursor: 'grab', userSelect: 'none', touchAction: 'none',
                    textShadow: '0 1px 4px rgba(0,0,0,0.4)', zIndex: 10, pointerEvents: 'auto',
                  }}
                  onMouseDown={e => { e.stopPropagation(); textDragRef.current = { sx: e.clientX, sy: e.clientY } }}
                  onTouchStart={e => { e.stopPropagation(); textDragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY } }}
                >
                  {text}
                </div>
              )}

              {/* Placeholder senza foto */}
              {!photoUrl && (
                <button onClick={() => fileInputRef.current?.click()} style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  border: '2px dashed #d0d0d0', borderRadius: 4,
                  background: '#f5f5f5', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={size.maskSrc} alt="" style={{ width: 120, height: 120 * previewDims.h / previewDims.w, opacity: 0.15, pointerEvents: 'none' }} />
                  <span style={{ fontSize: '11px', color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Carica foto</span>
                </button>
              )}
            </div>
          </div>

          {maskStatus[sizeId] === 'error' && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: '#fde8e8', borderRadius: 10, border: '1px solid #f0b4b4', fontSize: '12px', color: '#a33', textAlign: 'center' }}>
              Impossibile caricare il modello per la misura {size.label}. Riprova più tardi o scegli l&apos;altra misura.
            </div>
          )}

          {/* Zoom + cambio foto */}
          {photoUrl && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 600 }}>PICCOLO</span>
                <input type="range" min={0.2} max={3} step={0.01} value={photoZoom}
                  onChange={e => setPhotoZoom(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#00c1de', height: 4, cursor: 'pointer' }} aria-label="Zoom foto" />
                <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 600 }}>GRANDE</span>
                <span style={{ fontSize: '11px', color: '#888', minWidth: 38, textAlign: 'right' }}>{Math.round(photoZoom * 100)}%</span>
              </div>
              <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
                <ZoomIn size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Trascina la foto per riposizionarla nella pallina
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

        {/* ── DESTRA ────────────────────────────────────────────────────── */}
        <div className="shop-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0a0a', letterSpacing: '-0.025em', marginBottom: 8 }}>
              Palla di Natale con foto
            </h1>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.65 }}>
              Palla di Natale in plastica, metà trasparente e metà colorata, personalizzabile con la tua foto e un testo.
              Da appendere all&apos;albero, è un&apos;idea regalo originale. Viene consegnata in scatola.
            </p>
            {color.glitter && (
              <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, marginTop: 8 }}>
                Nuovo sistema glitter stop per evitare che i brillantini si disperdano.
              </p>
            )}
          </div>

          {/* Misura */}
          <div>
            <p style={labelStyle}>Misura</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {SIZES.map(s => (
                <button key={s.id} onClick={() => handleSizeChange(s.id)} style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  border: `2px solid ${sizeId === s.id ? '#00c1de' : '#e0e0e0'}`,
                  background: sizeId === s.id ? 'rgba(0,193,222,0.07)' : '#fff',
                  cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
                  fontSize: '14px', fontWeight: sizeId === s.id ? 700 : 500,
                  color: sizeId === s.id ? '#00c1de' : '#333',
                  fontFamily: 'Montserrat, sans-serif',
                }}>
                  ø {s.label} — {fmt(s.price)}
                </button>
              ))}
            </div>
          </div>

          {/* Colore */}
          <div>
            <p style={labelStyle}>Colore</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8 }}>
              {availableColors.map(c => (
                <button key={c.id} onClick={() => setColorId(c.id)} style={{
                  padding: '8px', borderRadius: 10,
                  border: `2px solid ${colorId === c.id ? '#00c1de' : '#e0e0e0'}`,
                  background: colorId === c.id ? 'rgba(0,193,222,0.07)' : '#fff',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all .15s',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <Image src={c.image} alt={c.label} fill style={{ objectFit: 'cover' }} sizes="44px" />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: colorId === c.id ? 700 : 500, color: colorId === c.id ? '#00c1de' : '#555', textAlign: 'center', lineHeight: 1.3 }}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
            {colorSwitchMessage && (
              <p style={{ marginTop: 8, fontSize: '11px', color: '#c9a05a', background: '#fff8ec', border: '1px solid #f0ddb0', borderRadius: 8, padding: '8px 10px' }}>
                {colorSwitchMessage}
              </p>
            )}
          </div>

          {/* Tab Foto / Testo */}
          <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 12, padding: 4, gap: 4 }}>
            {(['foto', 'testo'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none',
                background: tab === t ? '#fff' : 'transparent',
                fontWeight: tab === t ? 700 : 500, fontSize: '13px',
                color: tab === t ? '#00c1de' : '#666', cursor: 'pointer',
                transition: 'all .15s', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
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
                <p style={labelStyle}>La tua foto <span style={{ color: '#d97070' }}>*</span></p>
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
                {!photoUrl && (
                  <p style={{ marginTop: 6, fontSize: '11px', color: '#d97070' }}>La foto è obbligatoria per aggiungere al carrello.</p>
                )}
                {uploadFailed && (
                  <div style={{ marginTop: 10, padding: '12px 14px', background: '#fff3cd', borderRadius: 10, border: '1px solid #ffc107', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '12px', color: '#856404', flex: 1 }}>Caricamento foto non riuscito. Riprova prima di aggiungere al carrello.</span>
                    <button onClick={retryUpload} style={{ background: 'none', border: '1px solid #856404', borderRadius: 6, cursor: 'pointer', color: '#856404', fontSize: '11px', fontWeight: 700, padding: '4px 10px', whiteSpace: 'nowrap' }}>Riprova</button>
                  </div>
                )}
              </div>
              {photoUrl && (
                <div style={{ padding: '14px 16px', background: '#fff0f3', borderRadius: 12, border: '1px solid #ffc8d5', fontSize: '12px', color: '#555', lineHeight: 1.7 }}>
                  <b>💡 Suggerimento:</b> regola lo zoom e trascina la foto per centrarla nella pallina.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { icon: '🔴', label: `Misura: ø ${size.label}`, desc: 'Diametro pallina' },
                  { icon: '🖼️', label: `Foto: ${sizeId}×${sizeId} cm`, desc: 'Area personalizzabile' },
                  { icon: '⚪', label: 'Forma immagine', desc: 'Cerchio' },
                  { icon: '🎄', label: 'Utilizzo', desc: 'Da appendere' },
                  { icon: '📦', label: 'Confezione', desc: 'Scatola' },
                ].map(f => (
                  <div key={f.label} style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '20px' }}>{f.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#333' }}>{f.label}</span>
                    <span style={{ fontSize: '11px', color: '#999' }}>{f.desc}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TAB TESTO ── */}
          {tab === 'testo' && (
            <>
              <div>
                <p style={labelStyle}>Testo</p>
                <input type="text" value={text} onChange={e => setText(e.target.value)}
                  placeholder="Es. Buon Natale ❤" maxLength={40}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #e0e0e0', fontSize: '14px', fontFamily: font.css, outline: 'none', boxSizing: 'border-box', color: '#333', transition: 'border-color .15s' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#00c1de')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
                />
                <p style={{ fontSize: '11px', color: '#bbb', marginTop: 4, textAlign: 'right' }}>{text.length}/40</p>
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
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <p style={labelStyle}>Colore testo</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => setTextColor(c)} style={{
                      width: 28, height: 28, borderRadius: 6, background: c, padding: 0,
                      border: textColor === c ? '3px solid #00c1de' : '2px solid rgba(0,0,0,0.12)',
                      cursor: 'pointer', boxShadow: textColor === c ? '0 0 0 2px rgba(0,193,222,0.3)' : 'none',
                      transition: 'all .1s',
                    }} title={c} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>Personalizzato:</label>
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                    style={{ width: 44, height: 32, border: '1px solid #e0e0e0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                  <span style={{ fontSize: '12px', color: '#aaa', fontFamily: 'monospace' }}>{textColor}</span>
                </div>
              </div>

              <div>
                <p style={labelStyle}>Dimensione — {textSize}px</p>
                <input type="range" min={10} max={36} step={1} value={textSize}
                  onChange={e => setTextSize(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#00c1de', height: 4, cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: '10px', color: '#bbb' }}>Piccolo</span>
                  <span style={{ fontSize: '10px', color: '#bbb' }}>Grande</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setTextBold(v => !v)} style={{
                  width: 50, height: 28, borderRadius: 14,
                  background: textBold ? '#00c1de' : '#d0d0d0',
                  position: 'relative', border: 'none', cursor: 'pointer', transition: 'background .2s', padding: 0, flexShrink: 0,
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: textBold ? 25 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
                <span style={{ fontSize: '13px', color: '#555', fontWeight: textBold ? 700 : 400 }}>Grassetto</span>
              </div>

              {text.trim() && (
                <div style={{ padding: '14px 16px', background: '#fff0f3', borderRadius: 12, border: '1px solid #ffc8d5', fontSize: '12px', color: '#555' }}>
                  <b>💡</b> Trascina il testo nell&apos;anteprima per riposizionarlo sulla pallina.
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
              <span style={{ fontSize: '12px', color: '#aaa' }}>{fmt(size.price)} × {qty} pz</span>
            </div>
          </div>

          {/* Prezzo + CTA */}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Totale</p>
                <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '28px', color: '#00c1de', lineHeight: 1 }}>{fmt(total)}</p>
              </div>
              {qty > 1 && <p style={{ fontSize: '12px', color: '#aaa' }}>{fmt(size.price)} cad.</p>}
            </div>
            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8 }}>
              <b style={{ color: '#555' }}>Palla di Natale con foto</b> — {size.label} · {color.label}
              {!photoUrl && <div style={{ color: '#f59e0b', fontWeight: 600 }}>Nessuna foto caricata</div>}
              {text.trim() && <div>Testo: <em>&ldquo;{text}&rdquo;</em> — {font.label}</div>}
            </div>
            {composeError && (
              <div style={{ padding: '12px 14px', background: '#fde8e8', borderRadius: 10, border: '1px solid #f0b4b4', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '12px', color: '#a33', flex: 1 }}>Non siamo riusciti a preparare il file di stampa. Riprova.</span>
              </div>
            )}
            <button onClick={handleAddToCart} disabled={!canSubmit} style={{
              width: '100%', padding: '15px', borderRadius: 12, border: 'none',
              background: addedFeedback ? '#22c55e' : !canSubmit ? '#b0e6f0' : '#00c1de',
              color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
              fontSize: '15px', cursor: !canSubmit ? 'not-allowed' : 'pointer',
              transition: 'background .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {addedFeedback ? <><Check size={18} /> Aggiunto al carrello!</>
                : isRendering ? 'Elaborazione immagine…'
                : !photoUrl ? 'Carica una foto per continuare'
                : <><ShoppingCart size={18} /> Aggiungi al carrello</>}
            </button>
            <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center', lineHeight: 1.5 }}>
              Prodotto personalizzato · Spedizione in 3–5 giorni lavorativi
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

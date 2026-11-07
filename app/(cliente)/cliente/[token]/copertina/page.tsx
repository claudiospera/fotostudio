'use client'

// app/(cliente)/cliente/[token]/copertina/page.tsx
// Configuratore "Crea Copertina" lato cliente — la misura è fissata dal fotografo,
// il cliente sceglie colore, decoro, carica la propria foto (zoom/trascinamento)
// e un testo opzionale.

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { CoverSize, CoverColor, CoverDecor } from '@/lib/types'
import { normalizeImageOrientation } from '@/lib/shop/normalize-image'

interface PublicGallerySettings {
  theme_palette?: string
  theme_font?: string
  cover_builder?: {
    enabled: boolean
    size: CoverSize | null
    colors: CoverColor[]
    decorations: CoverDecor[]
  }
}

interface PublicGallery {
  id: string
  name: string
  settings?: PublicGallerySettings
  profiles?: { name?: string; studio_name?: string }
}

const PALETTE_ACCENT: Record<string, string> = {
  agave: '#8ec9b0', black: '#111111', warm: '#c9a05a', white: '#333333', dark: '#999999', cool: '#7ab0dc',
}

const FONT_FAMILY: Record<string, string> = {
  syne: "'Syne', sans-serif", playfair: "'Playfair Display', serif", bodoni: "'Bodoni Moda', serif", inter: "'Inter', sans-serif",
}

const TEXT_FONTS = [
  { id: 'montserrat', label: 'Montserrat',      css: 'Montserrat, sans-serif' },
  { id: 'poppins',    label: 'Poppins',          css: 'Poppins, sans-serif' },
  { id: 'georgia',    label: 'Georgia',          css: 'Georgia, serif' },
  { id: 'pacifico',   label: 'Pacifico',         css: 'Pacifico, cursive' },
  { id: 'dancing',    label: 'Dancing Script',   css: '"Dancing Script", cursive' },
  { id: 'playfair2',  label: 'Playfair Display', css: '"Playfair Display", serif' },
]

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Pacifico&family=Dancing+Script:wght@700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&family=Montserrat:wght@400;700&display=swap'

const TEXT_PALETTE = [
  '#000000', '#333333', '#666666', '#ffffff',
  '#c0272d', '#e07a3f', '#d9a441', '#4caf50', '#2d8c6e', '#00aa66',
  '#0088cc', '#2244aa', '#7a5ea8', '#cc66ff', '#cc0088', '#c05080',
]

const BASE_PREVIEW_LONG = 340
const DPI = 300
const BORDER_FRACTION = 0.07   // bordo colore intorno alla foto, come frazione del lato minore
const DECOR_FRACTION  = 0.16   // dimensione decoro come frazione del lato minore
const DECOR_MARGIN_FRACTION = 0.035

function cmToPx(cm: number) { return Math.round((cm / 2.54) * DPI) }

function dimsForRatio(widthCm: number, heightCm: number, targetLong: number) {
  if (widthCm >= heightCm) {
    const w = targetLong
    const h = Math.round((targetLong * heightCm) / widthCm)
    return { w, h }
  }
  const h = targetLong
  const w = Math.round((targetLong * widthCm) / heightCm)
  return { w, h }
}

// Disegna un'immagine "a copertura" (object-fit: cover) in un rettangolo
function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, iw: number, ih: number, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / iw, h / ih)
  const dw = iw * scale, dh = ih * scale
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

// Le immagini colore/decoro sono su R2 (altra origine, senza header CORS):
// caricarle direttamente con crossOrigin="anonymous" fallisce, e senza crossOrigin
// il canvas finale risulta "tainted" e non esportabile. Le facciamo passare da un
// proxy pubblico stesso-origine (/api/download esiste già ma richiede login Clerk,
// inadatto qui dove il cliente della galleria è anonimo).
function proxied(url: string): string {
  return `/api/public/image-proxy?url=${encodeURIComponent(url)}`
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('fs_session')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('fs_session', id) }
  return id
}

const DRAFT_KEY = 'fs-cover-draft-v1'

interface Draft {
  colorId: string; decorId: string
  uploadedUrl: string; filename?: string; natW: number; natH: number
  zoom: number; offsetX: number; offsetY: number
  text: string; fontId: string; textColor: string; textSize: number
  textPosX: number; textPosY: number
  clientName: string; clientEmail: string
}

export default function CopertinaPage() {
  const { token } = useParams<{ token: string }>()
  const sessionId = useRef('')

  const [gallery, setGallery] = useState<PublicGallery | null>(null)
  const [loading, setLoading] = useState(true)
  const [notAvailable, setNotAvailable] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const colorImgRef = useRef<HTMLImageElement | null>(null)
  const decorImgRef = useRef<HTMLImageElement | null>(null)
  const photoImgRef = useRef<HTMLImageElement | null>(null)

  const [colorId, setColorId] = useState('')
  const [decorId, setDecorId] = useState('')

  const [photoUrl, setPhotoUrl]         = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl]   = useState<string | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [uploadFailed, setUploadFailed] = useState(false)
  const [isSending, setIsSending]       = useState(false)
  const [sendError, setSendError]       = useState(false)
  const [sent, setSent]                 = useState(false)
  const [photoFilename, setPhotoFilename] = useState<string | undefined>(undefined)
  const [photoZoom, setPhotoZoom]       = useState(1)
  const [photoOffset, setPhotoOffset]   = useState({ x: 0, y: 0 })
  const [photoNatSize, setPhotoNatSize] = useState<{ w: number; h: number } | null>(null)

  const [text, setText]           = useState('')
  const [fontId, setFontId]       = useState(TEXT_FONTS[0].id)
  const [textColor, setTextColor] = useState('#ffffff')
  const [textSize, setTextSize]   = useState(20)
  const [textPos, setTextPos]     = useState({ x: 0.5, y: 0.88 })

  const [clientName, setClientName]   = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [tab, setTab] = useState<'foto' | 'testo'>('foto')

  const font = TEXT_FONTS.find(f => f.id === fontId) ?? TEXT_FONTS[0]

  // ── fetch gallery ──────────────────────────────────────────────────────
  useEffect(() => {
    sessionId.current = getSessionId()
    fetch(`/api/public/galleries/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((g: PublicGallery) => {
        setGallery(g)
        const cb = g.settings?.cover_builder
        if (!cb?.enabled || !cb.size) { setNotAvailable(true); return }
        setColorId(cb.colors[0]?.id ?? '')
        setDecorId(cb.decorations[0]?.id ?? '')
      })
      .catch(() => setNotAvailable(true))
      .finally(() => setLoading(false))
  }, [token])

  const cb = gallery?.settings?.cover_builder
  const size = cb?.size ?? null
  const colors = cb?.colors ?? []
  const decorations = cb?.decorations ?? []
  const color = colors.find(c => c.id === colorId)
  const decor = decorations.find(d => d.id === decorId)

  const paletteId = gallery?.settings?.theme_palette ?? 'agave'
  const accent = PALETTE_ACCENT[paletteId] ?? PALETTE_ACCENT.agave
  const headingFont = FONT_FAMILY[gallery?.settings?.theme_font ?? 'syne'] ?? FONT_FAMILY.syne
  const photographer = gallery?.profiles?.studio_name ?? gallery?.profiles?.name ?? 'Storie da Raccontare'

  const previewDims = useMemo(
    () => size ? dimsForRatio(size.widthCm, size.heightCm, BASE_PREVIEW_LONG) : { w: BASE_PREVIEW_LONG, h: BASE_PREVIEW_LONG },
    [size]
  )
  const outputDims = useMemo(
    () => size ? { w: cmToPx(size.widthCm), h: cmToPx(size.heightCm) } : { w: 0, h: 0 },
    [size]
  )
  const scaleX = outputDims.w ? outputDims.w / previewDims.w : 1
  const scaleY = outputDims.h ? outputDims.h / previewDims.h : 1

  // Carica Google Fonts per il testo
  useEffect(() => {
    if (document.getElementById('gf-cover')) return
    const link = document.createElement('link')
    link.id = 'gf-cover'; link.rel = 'stylesheet'; link.href = GOOGLE_FONTS_URL
    document.head.appendChild(link)
  }, [])

  // Precarica immagine colore selezionata
  useEffect(() => {
    if (!color) { colorImgRef.current = null; return }
    const img = new window.Image()
    img.onload = () => { colorImgRef.current = img; redraw() }
    img.src = proxied(color.imageUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color?.imageUrl])

  // Precarica decoro selezionato
  useEffect(() => {
    if (!decor) { decorImgRef.current = null; redraw(); return }
    const img = new window.Image()
    img.onload = () => { decorImgRef.current = img; redraw() }
    img.src = proxied(decor.imageUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decor?.imageUrl])

  // ── ridisegna anteprima ────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { w: W, h: H } = previewDims
    ctx.clearRect(0, 0, W, H)

    const colorImg = colorImgRef.current
    if (colorImg) drawCover(ctx, colorImg, colorImg.naturalWidth, colorImg.naturalHeight, 0, 0, W, H)
    else { ctx.fillStyle = '#eee'; ctx.fillRect(0, 0, W, H) }

    const border = Math.round(Math.min(W, H) * BORDER_FRACTION)
    const innerX = border, innerY = border, innerW = W - border * 2, innerH = H - border * 2

    const photo = photoImgRef.current
    if (photo && photoNatSize) {
      ctx.save()
      ctx.beginPath(); ctx.rect(innerX, innerY, innerW, innerH); ctx.clip()
      const containScale = Math.min(innerW / photoNatSize.w, innerH / photoNatSize.h)
      const pw = photoNatSize.w * containScale * photoZoom
      const ph = photoNatSize.h * containScale * photoZoom
      const px = innerX + (innerW - pw) / 2 + photoOffset.x
      const py = innerY + (innerH - ph) / 2 + photoOffset.y
      ctx.drawImage(photo, px, py, pw, ph)
      ctx.restore()
    }

    const decorImg = decorImgRef.current
    if (decorImg) {
      const dSize = Math.min(W, H) * DECOR_FRACTION
      const dRatio = decorImg.naturalHeight / decorImg.naturalWidth
      const dw = dSize, dh = dSize * dRatio
      const m = Math.min(W, H) * DECOR_MARGIN_FRACTION
      const pos = decor?.position ?? 'bottom-right'
      const dx = pos.includes('right') ? W - m - dw : m
      const dy = pos.includes('bottom') ? H - m - dh : m
      ctx.drawImage(decorImg, dx, dy, dw, dh)
    }
  }, [previewDims, photoNatSize, photoZoom, photoOffset, decor])

  useEffect(() => { redraw() }, [redraw])

  // Ripristina bozza
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d: Draft = JSON.parse(raw)
      if (!d.uploadedUrl) return
      setColorId(d.colorId); setDecorId(d.decorId)
      setPhotoUrl(d.uploadedUrl); setUploadedUrl(d.uploadedUrl); setPhotoFilename(d.filename)
      setPhotoZoom(d.zoom); setPhotoOffset({ x: d.offsetX, y: d.offsetY })
      setText(d.text); setFontId(d.fontId); setTextColor(d.textColor); setTextSize(d.textSize)
      setTextPos({ x: d.textPosX, y: d.textPosY })
      setClientName(d.clientName); setClientEmail(d.clientEmail)
      const img = new window.Image()
      img.onload = () => { photoImgRef.current = img; setPhotoNatSize({ w: d.natW, h: d.natH }) }
      img.src = proxied(d.uploadedUrl)
    } catch { sessionStorage.removeItem(DRAFT_KEY) }
  }, []) // eslint-disable-line

  // Salva bozza
  useEffect(() => {
    if (!uploadedUrl || uploading) { sessionStorage.removeItem(DRAFT_KEY); return }
    const t = setTimeout(() => {
      const d: Draft = {
        colorId, decorId, uploadedUrl, filename: photoFilename,
        natW: photoNatSize?.w ?? 0, natH: photoNatSize?.h ?? 0,
        zoom: photoZoom, offsetX: photoOffset.x, offsetY: photoOffset.y,
        text, fontId, textColor, textSize, textPosX: textPos.x, textPosY: textPos.y,
        clientName, clientEmail,
      }
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    }, 400)
    return () => clearTimeout(t)
  }, [colorId, decorId, uploadedUrl, uploading, photoFilename, photoNatSize, photoZoom, photoOffset, text, fontId, textColor, textSize, textPos, clientName, clientEmail])

  // ── drag foto ──────────────────────────────────────────────────────────
  const photoDragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  useEffect(() => {
    if (!photoUrl) return
    const onMove = (cx: number, cy: number) => {
      if (!photoDragRef.current) return
      setPhotoOffset({ x: photoDragRef.current.ox + cx - photoDragRef.current.sx, y: photoDragRef.current.oy + cy - photoDragRef.current.sy })
    }
    const onEnd = () => { photoDragRef.current = null }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { if (!photoDragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', tm, { passive: false }); window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', onEnd)
    }
  }, [photoUrl])

  // ── drag testo ─────────────────────────────────────────────────────────
  const textDragRef = useRef<{ sx: number; sy: number } | null>(null)
  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      if (!textDragRef.current) return
      const rect = previewRef.current?.getBoundingClientRect()
      if (!rect) return
      setTextPos({ x: Math.max(0.02, Math.min(0.98, (cx - rect.left) / rect.width)), y: Math.max(0.02, Math.min(0.98, (cy - rect.top) / rect.height)) })
    }
    const onEnd = () => { textDragRef.current = null }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { if (!textDragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', tm, { passive: false }); window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', onEnd)
    }
  }, [])

  // ── upload foto ────────────────────────────────────────────────────────
  const uploadToR2 = useCallback(async (file: File) => {
    try {
      const uploadFile = await normalizeImageOrientation(file)
      const res = await fetch('/api/public/cover-photo-presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: uploadFile.name, contentType: uploadFile.type }),
      })
      if (res.ok) {
        const { uploadUrl, publicUrl } = await res.json()
        const putRes = await fetch(uploadUrl, { method: 'PUT', body: uploadFile, headers: { 'Content-Type': uploadFile.type || 'image/jpeg' } })
        if (putRes.ok || putRes.status === 200) { setUploadedUrl(publicUrl); setUploadFailed(false) }
        else setUploadFailed(true)
      } else setUploadFailed(true)
    } catch { setUploadFailed(true) }
    setUploading(false)
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    const localUrl = URL.createObjectURL(file)
    setPhotoUrl(localUrl); setUploadedUrl(null); setUploadFailed(false); setPhotoFilename(file.name)
    setSendError(false)
    setUploading(true); setPhotoZoom(1); setPhotoOffset({ x: 0, y: 0 }); setPhotoNatSize(null)
    photoImgRef.current = null
    e.target.value = ''
    const img = new window.Image()
    img.src = localUrl
    img.onload = () => { photoImgRef.current = img; setPhotoNatSize({ w: img.naturalWidth, h: img.naturalHeight }) }
    await uploadToR2(file)
  }, [photoUrl, uploadToR2])

  const removePhoto = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    photoImgRef.current = null
    setPhotoUrl(null); setUploadedUrl(null); setPhotoFilename(undefined)
    setPhotoZoom(1); setPhotoOffset({ x: 0, y: 0 }); setPhotoNatSize(null)
    setSendError(false)
  }, [photoUrl])

  // ── invio richiesta ────────────────────────────────────────────────────
  async function handleSend() {
    if (!photoUrl || uploading || isSending || uploadFailed || !size || !color || !gallery) return
    if (!photoImgRef.current || !photoNatSize) { setSendError(true); return }

    setIsSending(true)
    setSendError(false)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = outputDims.w; canvas.height = outputDims.h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no-canvas-context')

      const colorImg = colorImgRef.current
      if (colorImg) drawCover(ctx, colorImg, colorImg.naturalWidth, colorImg.naturalHeight, 0, 0, outputDims.w, outputDims.h)
      else throw new Error('no-color-image')

      const border = Math.round(Math.min(outputDims.w, outputDims.h) * BORDER_FRACTION)
      const innerX = border, innerY = border, innerW = outputDims.w - border * 2, innerH = outputDims.h - border * 2

      ctx.save()
      ctx.beginPath(); ctx.rect(innerX, innerY, innerW, innerH); ctx.clip()
      const innerContain = Math.min(innerW / photoNatSize.w, innerH / photoNatSize.h)
      const pw = photoNatSize.w * innerContain * photoZoom
      const ph = photoNatSize.h * innerContain * photoZoom
      const px = innerX + (innerW - pw) / 2 + photoOffset.x * scaleX
      const py = innerY + (innerH - ph) / 2 + photoOffset.y * scaleY
      ctx.drawImage(photoImgRef.current, px, py, pw, ph)
      ctx.restore()

      const decorImg = decorImgRef.current
      if (decorImg) {
        const dSize = Math.min(outputDims.w, outputDims.h) * DECOR_FRACTION
        const dRatio = decorImg.naturalHeight / decorImg.naturalWidth
        const dw = dSize, dh = dSize * dRatio
        const m = Math.min(outputDims.w, outputDims.h) * DECOR_MARGIN_FRACTION
        const pos = decor?.position ?? 'bottom-right'
        const dx = pos.includes('right') ? outputDims.w - m - dw : m
        const dy = pos.includes('bottom') ? outputDims.h - m - dh : m
        ctx.drawImage(decorImg, dx, dy, dw, dh)
      }

      if (text.trim()) {
        await document.fonts.ready
        const scaledSize = textSize * scaleX
        ctx.font = `700 ${scaledSize}px ${font.css}`
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = scaledSize * 0.12
        ctx.fillText(text, textPos.x * outputDims.w, textPos.y * outputDims.h)
        ctx.shadowColor = 'transparent'
      }

      const blob = await new Promise<Blob | null>(r => canvas.toBlob(b => r(b), 'image/png'))
      if (!blob) throw new Error('no-blob')

      const presignRes = await fetch('/api/public/cover-photo-presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'copertina.png', contentType: 'image/png' }),
      })
      if (!presignRes.ok) throw new Error('presign-failed')
      const { uploadUrl, publicUrl } = await presignRes.json()
      const putRes = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/png' } })
      if (!putRes.ok && putRes.status !== 200) throw new Error('upload-failed')

      const orderRes = await fetch('/api/public/cover-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_id: gallery.id,
          session_id: sessionId.current,
          client_name: clientName.trim() || null,
          client_email: clientEmail.trim() || null,
          size_label: size.label,
          color_label: color.label,
          decor_label: decor?.label ?? null,
          text_content: text.trim() || null,
          font_label: text.trim() ? font.label : null,
          text_color: text.trim() ? textColor : null,
          cover_image_url: publicUrl,
        }),
      })
      if (!orderRes.ok) throw new Error('order-failed')

      sessionStorage.removeItem(DRAFT_KEY)
      setSent(true)
    } catch {
      setSendError(true)
    } finally {
      setIsSending(false)
    }
  }

  // ── loading / stati ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ color: '#aaa', fontSize: '13px' }}>Caricamento…</p>
      </div>
    )
  }

  if (notAvailable || !gallery) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.06)', borderRadius: 16, padding: '40px 32px', maxWidth: 380, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: '18px', color: '#222', marginBottom: 8 }}>Sezione non disponibile</h2>
          <p style={{ color: '#999', fontSize: '13px', lineHeight: 1.6, marginBottom: 20 }}>La creazione copertina non è attiva per questa galleria.</p>
          <Link href={`/cliente/${token}`} style={{ fontSize: '12px', color: accent, fontWeight: 600, textDecoration: 'none' }}>← Torna alla galleria</Link>
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.06)', borderRadius: 16, padding: '40px 32px', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: `${accent}22`, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={accent} strokeWidth={2.2} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: '19px', color: '#222', marginBottom: 8 }}>Richiesta inviata!</h2>
          <p style={{ color: '#888', fontSize: '13px', lineHeight: 1.6, marginBottom: 20 }}>
            {photographer} ha ricevuto la tua copertina personalizzata e ti contatterà a breve.
          </p>
          <Link href={`/cliente/${token}`} style={{ fontSize: '12px', color: accent, fontWeight: 700, textDecoration: 'none' }}>← Torna alla galleria</Link>
        </div>
      </div>
    )
  }

  const canSend = !!photoUrl && !!size && !!color && !uploading && !isSending && !uploadFailed

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', fontFamily: 'Inter, sans-serif' }}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid rgba(0,0,0,.06)', padding: '0 clamp(16px,4vw,40px)', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href={`/cliente/${token}`} style={{ color: '#999', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          {gallery.name}
        </Link>
        <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: '13px', color: '#222' }}>Crea Copertina</span>
      </div>

      <div className="cover-cfg-grid" style={{
        maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,5vw,40px)',
        display: 'grid', gridTemplateColumns: 'minmax(280px, 440px) 1fr', gap: 'clamp(24px,4vw,56px)', alignItems: 'start',
      }}>
        {/* ── SINISTRA: anteprima ── */}
        <div className="cover-sticky" style={{ position: 'sticky', top: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div ref={previewRef} style={{ position: 'relative', width: previewDims.w, height: previewDims.h, borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,.12)' }}>
              <canvas
                ref={canvasRef} width={previewDims.w} height={previewDims.h}
                style={{ display: 'block', cursor: photoUrl ? 'grab' : 'default', userSelect: 'none', touchAction: 'none' }}
                onMouseDown={e => { if (!photoUrl) return; e.preventDefault(); photoDragRef.current = { sx: e.clientX, sy: e.clientY, ox: photoOffset.x, oy: photoOffset.y } }}
                onTouchStart={e => { if (!photoUrl) return; photoDragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, ox: photoOffset.x, oy: photoOffset.y } }}
              />
              {text.trim() && (
                <div
                  style={{
                    position: 'absolute', left: textPos.x * previewDims.w, top: textPos.y * previewDims.h, transform: 'translate(-50%, -50%)',
                    fontFamily: font.css, fontWeight: 700, fontSize: textSize, color: textColor, whiteSpace: 'nowrap',
                    cursor: 'grab', userSelect: 'none', touchAction: 'none', textShadow: '0 1px 5px rgba(0,0,0,.4)', pointerEvents: 'auto',
                  }}
                  onMouseDown={e => { e.stopPropagation(); textDragRef.current = { sx: e.clientX, sy: e.clientY } }}
                  onTouchStart={e => { e.stopPropagation(); textDragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY } }}
                >
                  {text}
                </div>
              )}
              {!photoUrl && (
                <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', inset: 0, border: 'none', background: 'rgba(0,0,0,.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="#999" strokeWidth={1.6}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span style={{ fontSize: '11px', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Carica la tua foto</span>
                </button>
              )}
            </div>
          </div>

          {photoUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              <input type="range" min={0.2} max={3} step={0.01} value={photoZoom} onChange={e => setPhotoZoom(Number(e.target.value))} style={{ width: '100%', accentColor: accent }} aria-label="Zoom foto" />
              <p style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>Trascina e zooma per posizionare la foto</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => fileInputRef.current?.click()} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: '#555', cursor: 'pointer' }}>Cambia foto</button>
                <button onClick={removePhoto} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '7px 12px', fontSize: '12px', color: '#aaa', cursor: 'pointer' }}>Rimuovi</button>
              </div>
            </div>
          )}
          {uploadFailed && (
            <div style={{ padding: '10px 14px', background: '#fff3cd', borderRadius: 8, border: '1px solid #ffc107', fontSize: '12px', color: '#856404', textAlign: 'center' }}>
              Caricamento non riuscito — riprova a cambiare foto.
            </div>
          )}
        </div>

        {/* ── DESTRA: controlli ── */}
        <div className="cover-first-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h1 style={{ fontFamily: headingFont, fontWeight: 800, fontSize: 'clamp(20px,2.6vw,28px)', color: '#111', marginBottom: 6 }}>Crea la tua copertina</h1>
            <p style={{ fontSize: '13px', color: '#777', lineHeight: 1.6 }}>Scegli colore e decoro, poi carica la tua foto preferita — misura {size?.label}.</p>
          </div>

          {colors.length > 0 && (
            <div>
              <p style={labelStyle}>Colore</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8 }}>
                {colors.map(c => (
                  <button key={c.id} onClick={() => setColorId(c.id)} style={{
                    padding: 6, borderRadius: 10, border: `2px solid ${colorId === c.id ? accent : '#e0e0e0'}`,
                    background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.imageUrl} alt={c.label} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontSize: '10px', fontWeight: colorId === c.id ? 700 : 500, color: colorId === c.id ? accent : '#555', textAlign: 'center' }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {decorations.length > 0 && (
            <div>
              <p style={labelStyle}>Decoro</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8 }}>
                {decorations.map(d => (
                  <button key={d.id} onClick={() => setDecorId(d.id)} style={{
                    padding: 6, borderRadius: 10, border: `2px solid ${decorId === d.id ? accent : '#e0e0e0'}`,
                    background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.imageUrl} alt={d.label} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    <span style={{ fontSize: '10px', fontWeight: decorId === d.id ? 700 : 500, color: decorId === d.id ? accent : '#555', textAlign: 'center' }}>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab foto/testo */}
          <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 12, padding: 4, gap: 4 }}>
            {(['foto', 'testo'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none',
                background: tab === t ? '#fff' : 'transparent', fontWeight: tab === t ? 700 : 500, fontSize: '13px',
                color: tab === t ? accent : '#666', cursor: 'pointer',
              }}>{t === 'foto' ? 'Foto' : 'Testo'}</button>
            ))}
          </div>

          {tab === 'foto' && !photoUrl && (
            <p style={{ fontSize: '12px', color: '#d97070' }}>La foto è obbligatoria — caricala nell&apos;anteprima a sinistra.</p>
          )}

          {tab === 'testo' && (
            <>
              <div>
                <p style={labelStyle}>Testo (facoltativo)</p>
                <input type="text" value={text} onChange={e => setText(e.target.value)} maxLength={40} placeholder="Es. La nostra famiglia"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #e0e0e0', fontSize: '14px', fontFamily: font.css, outline: 'none', boxSizing: 'border-box', color: '#333' }} />
                <p style={{ fontSize: '11px', color: '#bbb', marginTop: 4, textAlign: 'right' }}>{text.length}/40</p>
              </div>
              <div>
                <p style={labelStyle}>Font</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                  {TEXT_FONTS.map(f => (
                    <button key={f.id} onClick={() => setFontId(f.id)} style={{
                      padding: '10px 12px', borderRadius: 10, border: `2px solid ${fontId === f.id ? accent : '#e0e0e0'}`,
                      background: fontId === f.id ? `${accent}18` : '#fff', cursor: 'pointer', fontFamily: f.css, fontSize: '14px',
                      color: fontId === f.id ? accent : '#333', fontWeight: fontId === f.id ? 700 : 400,
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={labelStyle}>Colore testo</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TEXT_PALETTE.map(c => (
                    <button key={c} onClick={() => setTextColor(c)} style={{
                      width: 26, height: 26, borderRadius: 6, background: c, padding: 0,
                      border: textColor === c ? `3px solid ${accent}` : '2px solid rgba(0,0,0,.12)', cursor: 'pointer',
                    }} />
                  ))}
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} style={{ width: 32, height: 26, border: '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                </div>
              </div>
              <div>
                <p style={labelStyle}>Dimensione — {textSize}px</p>
                <input type="range" min={12} max={40} step={1} value={textSize} onChange={e => setTextSize(Number(e.target.value))} style={{ width: '100%', accentColor: accent }} />
              </div>
              {text.trim() && <p style={{ fontSize: '11px', color: '#aaa' }}>Trascina il testo nell&apos;anteprima per riposizionarlo.</p>}
            </>
          )}

          {/* Dati cliente (facoltativi) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={labelStyle}>I tuoi dati (facoltativi)</p>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome e cognome"
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: '13px', color: '#333' }} />
            <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email" type="email"
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: '13px', color: '#333' }} />
          </div>

          {sendError && (
            <div style={{ padding: '12px 14px', background: '#fde8e8', borderRadius: 10, border: '1px solid #f0b4b4', fontSize: '12px', color: '#a33' }}>
              Non siamo riusciti a inviare la richiesta. Riprova.
            </div>
          )}

          <button onClick={handleSend} disabled={!canSend} style={{
            width: '100%', padding: '15px', borderRadius: 12, border: 'none',
            background: !canSend ? '#ddd' : accent, color: '#fff', fontFamily: headingFont, fontWeight: 700,
            fontSize: '15px', cursor: !canSend ? 'not-allowed' : 'pointer',
          }}>
            {isSending ? 'Invio in corso…' : !photoUrl ? 'Carica una foto per continuare' : 'Invia la tua copertina'}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .cover-cfg-grid { grid-template-columns: 1fr !important; }
          .cover-sticky { position: static !important; }
          .cover-first-mobile { order: -1; }
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8,
}

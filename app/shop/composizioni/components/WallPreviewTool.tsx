'use client'

// app/shop/composizioni/components/WallPreviewTool.tsx
// Tool interattivo canvas: carica foto → anteprima composizione sulla parete

import { useState, useRef, useEffect, useCallback } from 'react'
import { COMPOSIZIONI, type Composizione } from '@/lib/composizioni-data'
import { Upload, Download, RefreshCw } from 'lucide-react'

const AC = '#7d9b76'

// ─── Canvas rendering ─────────────────────────────────────────────────────────

function renderSlotCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slotX: number, slotY: number, slotW: number, slotH: number,
  imgFraction: { startX: number; endX: number } | null = null, // per panoramica
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(slotX, slotY, slotW, slotH)
  ctx.clip()

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight

  if (imgFraction) {
    sx = img.naturalWidth * imgFraction.startX
    sw = img.naturalWidth * (imgFraction.endX - imgFraction.startX)
  }

  // object-fit: cover logic
  const scaleX = slotW / sw
  const scaleY = slotH / sh
  const scale  = Math.max(scaleX, scaleY)
  const dw = sw * scale
  const dh = sh * scale
  const dx = slotX + (slotW - dw) / 2
  const dy = slotY + (slotH - dh) / 2

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)

  // Ombra interna bordo
  ctx.restore()
  ctx.save()
  ctx.beginPath()
  ctx.rect(slotX, slotY, slotW, slotH)
  ctx.clip()
  const grd = ctx.createLinearGradient(slotX, slotY, slotX, slotY + slotH)
  grd.addColorStop(0, 'rgba(0,0,0,0.06)')
  grd.addColorStop(0.1, 'rgba(0,0,0,0)')
  grd.addColorStop(0.9, 'rgba(0,0,0,0)')
  grd.addColorStop(1, 'rgba(0,0,0,0.08)')
  ctx.fillStyle = grd
  ctx.fillRect(slotX, slotY, slotW, slotH)
  ctx.restore()
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  composizione: Composizione,
  roomImg: HTMLImageElement | null,
) {
  const CW = canvas.width
  const CH = canvas.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Draw room photo background (cover, align top)
  if (roomImg) {
    const coverScale = CW / roomImg.naturalWidth
    const drawH = roomImg.naturalHeight * coverScale
    ctx.drawImage(roomImg, 0, 0, CW, drawH)
    // Fill any remaining bottom gap if photo is shorter than canvas
    if (drawH < CH) {
      ctx.fillStyle = '#e4ddd4'
      ctx.fillRect(0, drawH, CW, CH - drawH)
    }
  } else {
    ctx.fillStyle = '#e8e3db'
    ctx.fillRect(0, 0, CW, CH)
  }

  const slots = composizione.slots

  // Wall zone: upper 56% of canvas (above sofa in photo)
  const WALL_ZONE_H = Math.round(CH * 0.56)
  const MARGIN_X = 0.08
  const MARGIN_Y = 0.06
  const availW = CW * (1 - MARGIN_X * 2)
  const availH = WALL_ZONE_H * (1 - MARGIN_Y * 2)

  const vbW = 100, vbH = 70
  const scale = Math.min(availW / vbW, availH / vbH)
  // Center horizontally at 40% of canvas (matches room photo focal point)
  const centerX = CW * 0.42
  const offsetX = centerX - (vbW * scale) / 2
  const offsetY = MARGIN_Y * WALL_ZONE_H + (availH - vbH * scale) / 2

  // Ombra proiettata sotto ogni pannello
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.32)'
  ctx.shadowBlur   = scale * 1.8
  ctx.shadowOffsetX = scale * 0.2
  ctx.shadowOffsetY = scale * 1.0
  slots.forEach(slot => {
    const x = offsetX + slot.x * scale
    const y = offsetY + slot.y * scale
    const w = slot.w * scale
    const h = slot.h * scale
    ctx.fillStyle = '#bbb'
    ctx.fillRect(x, y, w, h)
  })
  ctx.restore()

  // Disegna ogni slot con la foto
  slots.forEach((slot, i) => {
    const x = offsetX + slot.x * scale
    const y = offsetY + slot.y * scale
    const w = slot.w * scale
    const h = slot.h * scale

    let fraction: { startX: number; endX: number } | null = null
    if (composizione.panoramica) {
      const n = slots.length
      fraction = { startX: i / n, endX: (i + 1) / n }
    }

    renderSlotCover(ctx, img, x, y, w, h, fraction)
  })

  // Watermark
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#000000'
  ctx.font = `${Math.round(CW * 0.016)}px Montserrat, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('storiedaraccontare.it', CW - 12, CH - 10)
  ctx.restore()
}

// ─── Componente principale ────────────────────────────────────────────────────

export function WallPreviewTool() {
  const [selectedId, setSelectedId]   = useState(COMPOSIZIONI[0].id)
  const [photoImg,   setPhotoImg]     = useState<HTMLImageElement | null>(null)
  const [photoName,  setPhotoName]    = useState<string>('')
  const [isLoading,  setIsLoading]    = useState(false)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const roomImgRef   = useRef<HTMLImageElement | null>(null)

  const composizione = COMPOSIZIONI.find(c => c.id === selectedId) ?? COMPOSIZIONI[0]

  // Preload room photo
  useEffect(() => {
    const img = new window.Image()
    img.onload = () => { roomImgRef.current = img }
    img.src = '/images/shop/scene-ambiente.png'
  }, [])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !photoImg) return
    drawCanvas(canvas, photoImg, composizione, roomImgRef.current)
  }, [photoImg, composizione])

  useEffect(() => { redraw() }, [redraw])

  function handleFile(file: File) {
    if (!file.type.startsWith('image/') && !file.name.match(/\.(heic|heif)$/i)) return
    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new window.Image()
      img.onload = () => { setPhotoImg(img); setPhotoName(file.name); setIsLoading(false) }
      img.onerror = () => setIsLoading(false)
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `composizione-${selectedId}.png`
    a.click()
  }

  return (
    <section
      id="tool"
      style={{
        background: '#f7f4ef',
        borderTop: '1px solid #e8e4de',
        borderBottom: '1px solid #e8e4de',
        padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,40px)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: AC, marginBottom: 10 }}>
            Tool interattivo
          </p>
          <h2 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(26px,4vw,40px)',
            fontWeight: 700, color: '#1a1a1a',
            margin: '0 0 14px', lineHeight: 1.2,
          }}>
            La tua foto sulla parete
          </h2>
          <p style={{ fontSize: '15px', color: '#6b6660', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>
            Carica la tua foto e scegli la composizione: vedrai subito com'è sul tuo muro prima di ordinare.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(240px,35%,360px) 1fr',
          gap: 32,
          alignItems: 'start',
        }}
          className="shop-cfg-grid"
        >
          {/* ── Sinistra: controlli ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Upload foto */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${photoImg ? AC : '#c8c0b4'}`,
                borderRadius: 14,
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: photoImg ? `${AC}08` : '#fff',
                transition: 'all .2s',
              }}
            >
              {isLoading ? (
                <p style={{ color: AC, fontWeight: 600, fontSize: '14px', margin: 0 }}>Caricamento…</p>
              ) : photoImg ? (
                <>
                  <div style={{ fontSize: '24px', marginBottom: 6 }}>✅</div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px' }}>
                    {photoName.length > 28 ? photoName.slice(0, 28) + '…' : photoName}
                  </p>
                  <p style={{ fontSize: '12px', color: AC, margin: 0 }}>Clicca per cambiare foto</p>
                </>
              ) : (
                <>
                  <Upload size={28} color="#b0a89a" style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#555', margin: '0 0 4px' }}>
                    Carica la tua foto
                  </p>
                  <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>
                    JPG · PNG · HEIC — oppure trascina qui
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,image/heic,image/heif"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {/* Scegli composizione */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                Composizione
              </label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #ddd', background: '#fff',
                  fontSize: '14px', fontWeight: 600, color: '#1a1a1a',
                  cursor: 'pointer', appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' strokeWidth='1.5' fill='none'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  paddingRight: 36,
                }}
              >
                {COMPOSIZIONI.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <p style={{ fontSize: '12px', color: '#aaa', marginTop: 6 }}>
                {composizione.pezzi} {composizione.pezzi === 1 ? 'pannello' : 'pannelli'} · {composizione.materiale}
              </p>
            </div>

            {/* Azioni */}
            {photoImg && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={handleDownload}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px', borderRadius: 10,
                    background: AC, color: '#fff',
                    border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 700,
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'background .15s',
                  }}
                >
                  <Download size={15} /> Scarica anteprima
                </button>
                <button
                  onClick={() => { setPhotoImg(null); setPhotoName('') }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', borderRadius: 10,
                    background: 'transparent', color: '#888',
                    border: '1.5px solid #ddd', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 600,
                  }}
                >
                  <RefreshCw size={14} /> Cambia foto
                </button>
                <a
                  href="#preventivo"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '11px', borderRadius: 10,
                    background: '#1a1a1a', color: '#fff',
                    textDecoration: 'none', fontSize: '13px', fontWeight: 700,
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  Richiedi preventivo →
                </a>
              </div>
            )}
          </div>

          {/* ── Destra: canvas ── */}
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              width={900}
              height={560}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 16,
                display: 'block',
                background: '#e8e3db',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              }}
            />
            {!photoImg && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 16,
                background: 'rgba(232,227,219,0.82)',
                gap: 12,
              }}>
                <Upload size={40} color="rgba(0,0,0,0.2)" />
                <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'rgba(0,0,0,0.35)' }}>
                  Carica una foto per vedere l'anteprima
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

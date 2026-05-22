'use client'

// app/shop/composizioni/components/WallPreviewTool.tsx
// Tool interattivo canvas + impaginatore automatico

import { useState, useRef, useEffect, useCallback } from 'react'
import { COMPOSIZIONI, type Composizione } from '@/lib/composizioni-data'
import { Upload, Download, RefreshCw, X } from 'lucide-react'

const AC     = '#7d9b76'
const BORDER = '#e0dbd4'
const MATERIALI = ['Tela su telaio', 'Stampa su Forex', 'Stampa con cornice']

const SIZES_BY_PANELS: Record<number, string[]> = {
  1: ['40×50 cm', '50×70 cm', '70×100 cm', '100×140 cm'],
  2: ['2 × 30×40 cm', '2 × 40×50 cm', '2 × 50×70 cm', '2 × 70×100 cm'],
  3: ['3 × 20×60 cm', '3 × 30×60 cm', '3 × 40×60 cm', '3 × 50×70 cm'],
  4: ['4 × 30×40 cm', '4 × 40×50 cm', '4 × 30×60 cm'],
  5: ['5 × 20×30 cm', '5 × 30×40 cm', '5 × 20×60 cm'],
  6: ['6 × 20×30 cm', '6 × 30×40 cm'],
}

// ─── Canvas helpers ────────────────────────────────────────────────────────────

function addInnerShadow(
  ctx: CanvasRenderingContext2D,
  slotX: number, slotY: number, slotW: number, slotH: number,
) {
  ctx.save()
  ctx.beginPath(); ctx.rect(slotX, slotY, slotW, slotH); ctx.clip()
  const grd = ctx.createLinearGradient(slotX, slotY, slotX, slotY + slotH)
  grd.addColorStop(0,   'rgba(0,0,0,0.06)')
  grd.addColorStop(0.1, 'rgba(0,0,0,0)')
  grd.addColorStop(0.9, 'rgba(0,0,0,0)')
  grd.addColorStop(1,   'rgba(0,0,0,0.08)')
  ctx.fillStyle = grd
  ctx.fillRect(slotX, slotY, slotW, slotH)
  ctx.restore()
}

// Disegna un singolo slot ritagliando la porzione corrispondente del bounding-box
// dell'intera composizione (modalità immagine continua).
function renderSlotFromBbox(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slotX: number, slotY: number, slotW: number, slotH: number,
  bboxX: number, bboxY: number, bboxW: number, bboxH: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(slotX, slotY, slotW, slotH)
  ctx.clip()

  // Adatta l'immagine al bounding box con object-fit: cover
  const s  = Math.max(bboxW / img.naturalWidth, bboxH / img.naturalHeight)
  const dw = img.naturalWidth  * s
  const dh = img.naturalHeight * s
  const dx = bboxX + (bboxW - dw) / 2
  const dy = bboxY + (bboxH - dh) / 2
  ctx.drawImage(img, dx, dy, dw, dh)
  ctx.restore()

  addInnerShadow(ctx, slotX, slotY, slotW, slotH)
}

// Disegna un singolo slot con la propria immagine (modalità multi-foto).
function renderSlotCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  slotX: number, slotY: number, slotW: number, slotH: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(slotX, slotY, slotW, slotH)
  ctx.clip()

  if (!img) {
    ctx.fillStyle = 'rgba(180,170,160,0.30)'
    ctx.fillRect(slotX, slotY, slotW, slotH)
    ctx.restore()
    return
  }

  const scale = Math.max(slotW / img.naturalWidth, slotH / img.naturalHeight)
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale
  ctx.drawImage(img,
    slotX + (slotW - dw) / 2,
    slotY + (slotH - dh) / 2,
    dw, dh)
  ctx.restore()

  addInnerShadow(ctx, slotX, slotY, slotW, slotH)
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  imgs: (HTMLImageElement | null)[],
  composizione: Composizione,
  roomImg: HTMLImageElement | null,
  mode: 'single' | 'multi',
) {
  const CW = canvas.width, CH = canvas.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (roomImg) {
    const s = CW / roomImg.naturalWidth
    const dh = roomImg.naturalHeight * s
    ctx.drawImage(roomImg, 0, 0, CW, dh)
    if (dh < CH) { ctx.fillStyle = '#e4ddd4'; ctx.fillRect(0, dh, CW, CH - dh) }
  } else {
    ctx.fillStyle = '#e8e3db'; ctx.fillRect(0, 0, CW, CH)
  }

  const slots = composizione.slots
  const WALL_H = Math.round(CH * 0.56)
  const availW = CW * 0.84, availH = WALL_H * 0.88
  const scale  = Math.min(availW / 100, availH / 70)
  const centerX = CW * 0.42
  const offsetX = centerX - (100 * scale) / 2
  const offsetY = WALL_H * 0.06 + (availH - 70 * scale) / 2

  // Drop shadow pass
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.30)'; ctx.shadowBlur = scale * 1.8
  ctx.shadowOffsetX = scale * 0.2; ctx.shadowOffsetY = scale * 1.0
  slots.forEach(s => {
    ctx.fillStyle = '#bbb'
    ctx.fillRect(offsetX + s.x * scale, offsetY + s.y * scale, s.w * scale, s.h * scale)
  })
  ctx.restore()

  // Render slots
  const loadedImgs = imgs.filter(Boolean) as HTMLImageElement[]

  if (mode === 'single') {
    const img = imgs[0] ?? null
    if (img) {
      // Calcola il bounding box di tutti gli slot in coordinate canvas
      const bboxX = offsetX + Math.min(...slots.map(s => s.x)) * scale
      const bboxY = offsetY + Math.min(...slots.map(s => s.y)) * scale
      const bboxR = offsetX + Math.max(...slots.map(s => s.x + s.w)) * scale
      const bboxB = offsetY + Math.max(...slots.map(s => s.y + s.h)) * scale
      const bboxW = bboxR - bboxX, bboxH = bboxB - bboxY

      slots.forEach(slot => {
        const x = offsetX + slot.x * scale, y = offsetY + slot.y * scale
        const w = slot.w * scale,           h = slot.h * scale
        renderSlotFromBbox(ctx, img, x, y, w, h, bboxX, bboxY, bboxW, bboxH)
      })
    }
  } else {
    slots.forEach((slot, i) => {
      const x = offsetX + slot.x * scale, y = offsetY + slot.y * scale
      const w = slot.w * scale,           h = slot.h * scale
      // usa la foto assegnata allo slot, o cicla tra quelle disponibili
      const img = (imgs[i] ?? (loadedImgs.length > 0 ? loadedImgs[i % loadedImgs.length] : null))
      renderSlotCover(ctx, img, x, y, w, h)
    })
  }

  // Watermark
  ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#000'
  ctx.font = `${Math.round(CW * 0.015)}px Montserrat,sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('storiedaraccontare.it', CW - 12, CH - 10)
  ctx.restore()
}

// ─── pickSuggestions ───────────────────────────────────────────────────────────

function pickSuggestions(count: number): [Composizione, Composizione] {
  const exact = COMPOSIZIONI.filter(c => c.slots.length === count)
  const near  = COMPOSIZIONI.filter(c => c.slots.length === count - 1 || c.slots.length === count + 1)
  const pool  = exact.length >= 2 ? exact : [...exact, ...near]
  const first  = pool[0] ?? COMPOSIZIONI[0]
  const second = pool.find(c => c.id !== first.id) ?? COMPOSIZIONI[1]
  return [first, second]
}

// ─── SlotUpload ────────────────────────────────────────────────────────────────

function SlotUpload({ index, img, onFile }: {
  index: number
  img: HTMLImageElement | null
  onFile: (file: File, index: number) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div
      onClick={() => ref.current?.click()}
      style={{
        border: `1.5px dashed ${img ? AC : '#c8c0b4'}`,
        borderRadius: 10, cursor: 'pointer',
        background: img ? `${AC}12` : '#fafaf8',
        minHeight: 64, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 4,
        transition: 'all .15s', padding: '8px 4px',
      }}
    >
      {img
        ? <div style={{ fontSize: '20px' }}>✅</div>
        : <><Upload size={15} color="#b0a89a" /><p style={{ fontSize: '10px', color: '#bbb', margin: 0 }}>Foto {index + 1}</p></>
      }
      <input ref={ref} type="file" accept="image/*,image/heic,image/heif"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f, index) }} />
    </div>
  )
}

// ─── AdviceSlot ────────────────────────────────────────────────────────────────

function AdviceSlot({ index, img, onFile }: {
  index: number
  img: HTMLImageElement | null
  onFile: (file: File, index: number) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div
      onClick={() => ref.current?.click()}
      style={{
        border: `1.5px dashed ${img ? AC : '#c8c0b4'}`,
        borderRadius: 10, aspectRatio: '1/1',
        cursor: 'pointer', background: img ? 'transparent' : '#fafaf8',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 4, overflow: 'hidden', transition: 'all .15s',
      }}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <><Upload size={16} color="#b0a89a" /><p style={{ fontSize: '10px', color: '#bbb', margin: 0 }}>Foto {index + 1}</p></>
      )}
      <input ref={ref} type="file" accept="image/*,image/heic,image/heif"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f, index) }} />
    </div>
  )
}

// ─── SuggestionCard ────────────────────────────────────────────────────────────

function SuggestionCard({ composizione, imgs, roomImg, label }: {
  composizione: Composizione
  imgs: (HTMLImageElement | null)[]
  roomImg: HTMLImageElement | null
  label: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [materiale, setMateriale] = useState(MATERIALI[0])
  const [sizeIdx,   setSizeIdx]   = useState(0)
  const sizes = SIZES_BY_PANELS[Math.min(composizione.slots.length, 6)] ?? SIZES_BY_PANELS[3]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCanvas(canvas, imgs, composizione, roomImg, 'multi')
  }, [imgs, composizione, roomImg])

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
      <canvas ref={canvasRef} width={600} height={380}
        style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '.12em',
            textTransform: 'uppercase', color: AC,
            background: `${AC}18`, borderRadius: 6, padding: '2px 8px',
          }}>{label}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{composizione.nome}</span>
        </div>
        <p style={{ fontSize: '12px', color: '#999', margin: '0 0 14px' }}>
          {composizione.slots.length} {composizione.slots.length === 1 ? 'pannello' : 'pannelli'} · {composizione.gruppo}
        </p>

        <p style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>Materiale</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {MATERIALI.map(m => (
            <button key={m} onClick={() => setMateriale(m)} style={{
              padding: '5px 11px', borderRadius: 20, fontSize: '12px', fontWeight: 600,
              border: `1.5px solid ${materiale === m ? AC : BORDER}`,
              background: materiale === m ? `${AC}18` : '#fafaf8',
              color: materiale === m ? AC : '#666', cursor: 'pointer',
            }}>{m}</button>
          ))}
        </div>

        <p style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>Dimensioni</p>
        <select value={sizeIdx} onChange={e => setSizeIdx(Number(e.target.value))} style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          border: `1.5px solid ${BORDER}`, background: '#fff',
          fontSize: '13px', fontWeight: 600, color: '#1a1a1a',
          cursor: 'pointer', marginBottom: 16,
        }}>
          {sizes.map((s, i) => <option key={s} value={i}>{s}</option>)}
        </select>

        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 12px' }}>
          Materiale scelto: <strong>{materiale}</strong> · {sizes[sizeIdx]}
        </p>

        <a href="#preventivo" style={{
          display: 'block', textAlign: 'center',
          background: '#1a1a1a', color: '#fff',
          padding: '11px', borderRadius: 10,
          textDecoration: 'none', fontSize: '13px', fontWeight: 700,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          Richiedi questo preventivo →
        </a>
      </div>
    </div>
  )
}

// ─── WallPreviewTool (main) ────────────────────────────────────────────────────

export function WallPreviewTool() {
  const [mode,       setMode]       = useState<'single' | 'multi'>('single')
  const [selectedId, setSelectedId] = useState(COMPOSIZIONI[0].id)
  const [singleImg,  setSingleImg]  = useState<HTMLImageElement | null>(null)
  const [singleName, setSingleName] = useState('')
  const [multiImgs,  setMultiImgs]  = useState<(HTMLImageElement | null)[]>([])
  const [isLoading,  setIsLoading]  = useState(false)

  // Impaginatore automatico
  const [adviceImgs, setAdviceImgs]   = useState<(HTMLImageElement | null)[]>(Array(6).fill(null))
  const [suggestions, setSuggestions] = useState<[Composizione, Composizione] | null>(null)

  // Room photo
  const [roomImg, setRoomImg]   = useState<HTMLImageElement | null>(null)
  const roomImgRef              = useRef<HTMLImageElement | null>(null)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const composizione = COMPOSIZIONI.find(c => c.id === selectedId) ?? COMPOSIZIONI[0]
  const slotCount    = composizione.slots.length

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => { roomImgRef.current = img; setRoomImg(img) }
    img.src = '/images/shop/scene-ambiente.png'
  }, [])

  useEffect(() => {
    setMultiImgs(Array(slotCount).fill(null))
  }, [slotCount])

  const activeImgs: (HTMLImageElement | null)[] =
    mode === 'single'
      ? Array(slotCount).fill(singleImg)
      : Array.from({ length: slotCount }, (_, i) => multiImgs[i] ?? null)

  const hasAny = activeImgs.some(Boolean)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasAny) return
    drawCanvas(canvas, activeImgs, composizione, roomImgRef.current, mode)
  }, [activeImgs, composizione, mode, hasAny])

  useEffect(() => { redraw() }, [redraw])

  function loadImg(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        const img = new window.Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleSingleFile(file: File) {
    setIsLoading(true)
    try { const img = await loadImg(file); setSingleImg(img); setSingleName(file.name) }
    finally { setIsLoading(false) }
  }

  async function handleMultiFile(file: File, index: number) {
    const img = await loadImg(file)
    setMultiImgs(prev => { const n = [...prev]; n[index] = img; return n })
  }

  async function handleAdviceFile(file: File, index: number) {
    const img = await loadImg(file)
    setAdviceImgs(prev => {
      const next = [...prev]; next[index] = img
      const count = next.filter(Boolean).length
      if (count > 0) setSuggestions(pickSuggestions(count))
      return next
    })
  }

  function removeAdviceImg(index: number) {
    setAdviceImgs(prev => {
      const next = [...prev]; next[index] = null
      const count = next.filter(Boolean).length
      if (count === 0) setSuggestions(null)
      else setSuggestions(pickSuggestions(count))
      return next
    })
  }

  function handleDownload() {
    const canvas = canvasRef.current; if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `composizione-${selectedId}.png`
    a.click()
  }

  return (
    <>
      {/* ── Sezione 1: Tool interattivo ──────────────────────────────────── */}
      <section id="tool" style={{
        background: '#f7f4ef',
        borderTop: '1px solid #e8e4de',
        borderBottom: '1px solid #e8e4de',
        padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,40px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: AC, marginBottom: 10 }}>
              Tool interattivo
            </p>
            <h2 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: 'clamp(26px,4vw,40px)', fontWeight: 700, color: '#1a1a1a', margin: '0 0 14px', lineHeight: 1.2 }}>
              La tua foto sulla parete
            </h2>
            <p style={{ fontSize: '15px', color: '#6b6660', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>
              Carica la tua foto e scegli la composizione: vedrai subito com'e sul tuo muro prima di ordinare.
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
            <div style={{ display: 'inline-flex', border: `1.5px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              {([
                { key: 'single' as const, label: 'Una foto divisa tra i pannelli' },
                { key: 'multi'  as const, label: 'Foto diverse per ogni pannello' },
              ]).map(({ key, label }) => (
                <button key={key} onClick={() => setMode(key)} style={{
                  padding: '10px 22px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: mode === key ? 700 : 500,
                  background: mode === key ? AC : 'transparent',
                  color: mode === key ? '#fff' : '#666',
                  transition: 'all .18s', fontFamily: 'Montserrat,sans-serif',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'clamp(240px,35%,360px) 1fr', gap: 32, alignItems: 'start' }}
            className="shop-cfg-grid">

            {/* ── Controlli ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Single upload */}
              {mode === 'single' && (
                <>
                  <div
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleSingleFile(f) }}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${singleImg ? AC : '#c8c0b4'}`,
                      borderRadius: 14, padding: '24px 16px',
                      textAlign: 'center', cursor: 'pointer',
                      background: singleImg ? `${AC}08` : '#fff',
                      transition: 'all .2s',
                    }}
                  >
                    {isLoading ? (
                      <p style={{ color: AC, fontWeight: 600, fontSize: '14px', margin: 0 }}>Caricamento…</p>
                    ) : singleImg ? (
                      <>
                        <div style={{ fontSize: '24px', marginBottom: 6 }}>✅</div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px' }}>
                          {singleName.length > 28 ? singleName.slice(0, 28) + '…' : singleName}
                        </p>
                        <p style={{ fontSize: '12px', color: AC, margin: 0 }}>Clicca per cambiare foto</p>
                      </>
                    ) : (
                      <>
                        <Upload size={28} color="#b0a89a" style={{ marginBottom: 10 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#555', margin: '0 0 4px' }}>Carica la tua foto</p>
                        <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>JPG · PNG · HEIC — oppure trascina qui</p>
                        <p style={{ fontSize: '11px', color: '#b0a89a', margin: '8px 0 0', fontStyle: 'italic' }}>
                          La foto viene divisa tra i pannelli
                        </p>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*,image/heic,image/heif"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleSingleFile(f) }} />
                </>
              )}

              {/* Multi upload */}
              {mode === 'multi' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                    Foto per ogni pannello ({slotCount} pannelli)
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: slotCount <= 3 ? `repeat(${slotCount}, 1fr)` : 'repeat(3, 1fr)',
                    gap: 8,
                  }}>
                    {Array.from({ length: slotCount }).map((_, i) => (
                      <SlotUpload key={i} index={i} img={multiImgs[i] ?? null} onFile={handleMultiFile} />
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: '#aaa', marginTop: 8 }}>
                    Foto diverse per ogni riquadro
                  </p>
                </div>
              )}

              {/* Composizione selector */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                  Composizione
                </label>
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #ddd', background: '#fff',
                  fontSize: '14px', fontWeight: 600, color: '#1a1a1a',
                  cursor: 'pointer', appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' strokeWidth='1.5' fill='none'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36,
                }}>
                  {COMPOSIZIONI.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: 6 }}>
                  {slotCount} {slotCount === 1 ? 'pannello' : 'pannelli'} · {composizione.materiale}
                </p>
              </div>

              {/* Actions */}
              {hasAny && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={handleDownload} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px', borderRadius: 10, background: AC, color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                    fontFamily: 'Montserrat,sans-serif',
                  }}>
                    <Download size={15} /> Scarica anteprima
                  </button>
                  <button onClick={() => { setSingleImg(null); setSingleName(''); setMultiImgs(Array(slotCount).fill(null)) }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', borderRadius: 10, background: 'transparent', color: '#888',
                    border: '1.5px solid #ddd', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  }}>
                    <RefreshCw size={14} /> Ricomincia
                  </button>
                  <a href="#preventivo" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '11px', borderRadius: 10, background: '#1a1a1a', color: '#fff',
                    textDecoration: 'none', fontSize: '13px', fontWeight: 700, fontFamily: 'Montserrat,sans-serif',
                  }}>
                    Richiedi preventivo →
                  </a>
                </div>
              )}
            </div>

            {/* ── Canvas ── */}
            <div style={{ position: 'relative' }}>
              <canvas ref={canvasRef} width={900} height={560} style={{
                width: '100%', height: 'auto', borderRadius: 16, display: 'block',
                background: '#e8e3db', boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              }} />
              {!hasAny && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 16, background: 'rgba(232,227,219,0.82)', gap: 12,
                }}>
                  <Upload size={40} color="rgba(0,0,0,0.20)" />
                  <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'rgba(0,0,0,0.35)' }}>
                    {mode === 'single' ? "Carica una foto per vedere l'anteprima" : "Carica almeno una foto per vedere l'anteprima"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sezione 2: Impaginatore automatico ──────────────────────────────── */}
      <section id="consiglio" style={{
        background: '#fff',
        borderBottom: '1px solid #e8e4de',
        padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,40px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: '30px', marginBottom: 12 }}>✨</div>
            <h2 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px', lineHeight: 1.2 }}>
              Vuoi un consiglio?
            </h2>
            <p style={{ fontSize: '15px', color: '#6b6660', maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
              Carica le tue foto e componiamo noi per te. Ti proponiamo due soluzioni con stile e misure che puoi modificare a piacere.
            </p>
          </div>

          {/* 6 slot upload */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#888', letterSpacing: '.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>
              Carica da 1 a 6 foto
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, maxWidth: 680, margin: '0 auto' }}
              className="shop-format-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <AdviceSlot index={i} img={adviceImgs[i] ?? null} onFile={handleAdviceFile} />
                  {adviceImgs[i] && (
                    <button onClick={() => removeAdviceImg(i)} style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', border: 'none',
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}>
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Proposte */}
          {suggestions ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}
              className="shop-cfg-grid">
              <SuggestionCard composizione={suggestions[0]} imgs={adviceImgs} roomImg={roomImg} label="Soluzione A" />
              <SuggestionCard composizione={suggestions[1]} imgs={adviceImgs} roomImg={roomImg} label="Soluzione B" />
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '32px 20px',
              background: '#f7f4ef', borderRadius: 14,
              border: `1.5px dashed ${BORDER}`,
              maxWidth: 500, margin: '0 auto',
            }}>
              <p style={{ fontSize: '14px', color: '#aaa', margin: 0 }}>
                Carica almeno una foto per vedere le proposte di composizione
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

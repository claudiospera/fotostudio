'use client'

// app/shop/composizioni/components/WallPreviewTool.tsx

import { useState, useRef, useEffect, useCallback } from 'react'
import { COMPOSIZIONI, type Composizione } from '@/lib/composizioni-data'
import { Upload, Download, RefreshCw, X, ZoomIn, ZoomOut, Type, RotateCcw, ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'

const AC     = '#7d9b76'
const BORDER = '#e0dbd4'
const MATERIALI = ['Tela su telaio', 'Stampa su Forex', 'Stampa con cornice']

const SIZES_BY_PANELS: Record<number, string[]> = {
  1: ['30×60 cm', '40×50 cm', '50×70 cm', '70×100 cm', '100×140 cm'],
  2: ['2 × 30×40 cm', '2 × 30×60 cm', '2 × 40×50 cm', '2 × 50×70 cm', '2 × 70×100 cm'],
  3: ['3 × 20×60 cm', '3 × 30×60 cm', '3 × 40×60 cm', '3 × 50×70 cm'],
  4: ['4 × 30×40 cm', '4 × 30×60 cm', '4 × 40×50 cm'],
  5: ['5 × 20×30 cm', '5 × 30×40 cm', '5 × 30×60 cm', '5 × 20×60 cm'],
  6: ['6 × 20×30 cm', '6 × 30×40 cm', '6 × 30×60 cm'],
}

// Prezzo per singolo pannello (€) per materiale e formato
type MatCode = 'tela' | 'forex' | 'cornice'
const PP: Record<string, Partial<Record<MatCode, number>>> = {
  '20x20': { tela: 25, forex: 15, cornice: 18 },
  '20x30': { tela: 30, forex: 20, cornice: 28 },
  '20x50': { tela: 35, forex: 30 },
  '20x60': { tela: 40, forex: 35 },
  '30x30': { tela: 30, forex: 25, cornice: 25 },
  '30x40': { tela: 35, forex: 30, cornice: 38 },
  '30x50': { tela: 40, forex: 35 },
  '30x60': { tela: 45, forex: 40, cornice: 25 },
  '30x90': { tela: 65, forex: 55 },
  '35x50': { tela: 45, forex: 40 },
  '40x40': { tela: 40, forex: 35 },
  '40x50': { tela: 45, forex: 40 },
  '40x60': { tela: 47, forex: 42 },
  '40x80': { tela: 60, forex: 50 },
  '50x50': { tela: 55, forex: 45 },
  '50x70': { tela: 60, forex: 50 },
  '70x100': { tela: 100, forex: 80 },
}
const MAT_CODE: Record<string, MatCode> = {
  'Tela su telaio': 'tela',
  'Stampa su Forex': 'forex',
  'Stampa con cornice': 'cornice',
}
const MAT_SLUG: Record<string, string> = {
  'Tela su telaio': '/shop/decorazioni/tela',
  'Stampa su Forex': '/shop/decorazioni/forex',
  'Stampa con cornice': '/shop/decorazioni/cornici',
}
function getTotal(sizeLabel: string, material: string): number | null {
  const code = MAT_CODE[material]
  if (!code) return null
  // "N × W×H cm" or "W×H cm"
  const m = sizeLabel.match(/^(\d+)\s*[×x]\s*(\d+)[×x](\d+)/)
  if (m) {
    const count = parseInt(m[1])
    const [a, b] = [parseInt(m[2]), parseInt(m[3])]
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`
    const up = PP[key]?.[code]; if (!up) return null
    return up * count
  }
  const m2 = sizeLabel.match(/^(\d+)[×x](\d+)/)
  if (m2) {
    const [a, b] = [parseInt(m2[1]), parseInt(m2[2])]
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`
    return PP[key]?.[code] ?? null
  }
  return null
}

// Mappa (materiale, formato pannello "WxH") → (productId, variantId, priceCents)
const VARIANT_MAP: Record<string, Record<string, { productId: string; variantId: string; priceCents: number }>> = {
  'Tela su telaio': {
    '20x30':  { productId: 'tela', variantId: 'tel-30x40',  priceCents: 3500 }, // approssimato
    '30x30':  { productId: 'tela', variantId: 'tel-30x30',  priceCents: 3000 },
    '30x40':  { productId: 'tela', variantId: 'tel-30x40',  priceCents: 3500 },
    '30x50':  { productId: 'tela', variantId: 'tel-30x50',  priceCents: 4000 },
    '30x60':  { productId: 'tela', variantId: 'tel-30x60',  priceCents: 4500 },
    '40x40':  { productId: 'tela', variantId: 'tel-40x40',  priceCents: 4000 },
    '40x50':  { productId: 'tela', variantId: 'tel-40x50',  priceCents: 4500 },
    '40x60':  { productId: 'tela', variantId: 'tel-40x60',  priceCents: 4700 },
    '50x70':  { productId: 'tela', variantId: 'tel-50x70',  priceCents: 6000 },
    '70x100': { productId: 'tela', variantId: 'tel-70x100', priceCents: 10000 },
  },
  'Stampa su Forex': {
    '15x20': { productId: 'forex', variantId: 'fx-15x20', priceCents: 1000 },
    '20x30': { productId: 'forex', variantId: 'fx-20x30', priceCents: 2000 },
    '30x30': { productId: 'forex', variantId: 'fx-30x30', priceCents: 2500 },
    '30x40': { productId: 'forex', variantId: 'fx-30x40', priceCents: 3000 },
    '30x50': { productId: 'forex', variantId: 'fx-30x50', priceCents: 3500 },
    '30x60': { productId: 'forex', variantId: 'fx-30x60', priceCents: 4000 },
    '40x40': { productId: 'forex', variantId: 'fx-40x40', priceCents: 3500 },
    '40x50': { productId: 'forex', variantId: 'fx-40x50', priceCents: 4000 },
    '40x60': { productId: 'forex', variantId: 'fx-40x60', priceCents: 4200 },
    '50x50': { productId: 'forex', variantId: 'fx-50x50', priceCents: 4500 },
    '50x60': { productId: 'forex', variantId: 'fx-50x60', priceCents: 4700 },
    '50x70': { productId: 'forex', variantId: 'fx-50x70', priceCents: 5000 },
  },
  'Stampa con cornice': {
    '10x15': { productId: 'cornici', variantId: '10x15', priceCents: 1500 },
    '13x18': { productId: 'cornici', variantId: '13x18', priceCents: 1800 },
    '15x20': { productId: 'cornici', variantId: '15x20', priceCents: 2200 },
    '20x30': { productId: 'cornici', variantId: '20x30', priceCents: 2800 },
    '30x40': { productId: 'cornici', variantId: '30x40', priceCents: 3800 },
    '30x60': { productId: 'cornici', variantId: '30x60', priceCents: 2500 },
  },
}

// Ritorna productId, variantId, priceCents, quantity dal label della dimensione
function getVariantInfo(sizeLabel: string, material: string): { productId: string; variantId: string; priceCents: number; quantity: number } | null {
  const map = VARIANT_MAP[material]
  if (!map) return null
  const m = sizeLabel.match(/^(\d+)\s*[×x]\s*(\d+)[×x](\d+)/)
  if (m) {
    const count = parseInt(m[1])
    const [a, b] = [parseInt(m[2]), parseInt(m[3])]
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`
    const v = map[key]; if (!v) return null
    return { ...v, quantity: count }
  }
  const m2 = sizeLabel.match(/^(\d+)[×x](\d+)/)
  if (m2) {
    const [a, b] = [parseInt(m2[1]), parseInt(m2[2])]
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`
    const v = map[key]; if (!v) return null
    return { ...v, quantity: 1 }
  }
  return null
}

const MAT_IMAGE: Record<string, string> = {
  'Tela su telaio':    '/images/shop/tela/catalogo.jpg',
  'Stampa su Forex':   '/images/shop/forex/catalogo.png',
  'Stampa con cornice': '/images/shop/stampe/cornici.png',
}

const FONT_OPTIONS = [
  { label: 'Montserrat',          value: 'Montserrat, sans-serif',                    style: 'bold' },
  { label: 'Cormorant Garamond',  value: '"Cormorant Garamond", Georgia, serif',       style: 'italic' },
  { label: 'Playfair Display',    value: '"Playfair Display", Georgia, serif',         style: 'bold' },
  { label: 'Great Vibes',         value: '"Great Vibes", cursive',                     style: 'normal' },
  { label: 'Dancing Script',      value: '"Dancing Script", cursive',                  style: 'bold' },
  { label: 'Josefin Sans',        value: '"Josefin Sans", sans-serif',                 style: 'normal' },
  { label: 'Bebas Neue',          value: '"Bebas Neue", sans-serif',                   style: 'normal' },
  { label: 'Lora',                value: 'Lora, Georgia, serif',                       style: 'italic' },
  { label: 'Raleway',             value: 'Raleway, sans-serif',                        style: 'normal' },
  { label: 'Sacramento',          value: 'Sacramento, cursive',                        style: 'normal' },
] as const

type FontOption = typeof FONT_OPTIONS[number]

interface TextOverlay {
  x: number
  y: number
  content: string
  size: number
  color: string
  font: string   // value da FONT_OPTIONS
  style: string  // bold | italic | normal
}

// ─── Canvas helpers ────────────────────────────────────────────────────────────

function addInnerShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  const grd = ctx.createLinearGradient(x, y, x, y + h)
  grd.addColorStop(0,   'rgba(0,0,0,0.06)')
  grd.addColorStop(0.1, 'rgba(0,0,0,0)')
  grd.addColorStop(0.9, 'rgba(0,0,0,0)')
  grd.addColorStop(1,   'rgba(0,0,0,0.08)')
  ctx.fillStyle = grd
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

// Modalità singola: disegna l'immagine sul bbox dell'intera composizione con zoom/pan
function renderSlotFromBbox(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slotX: number, slotY: number, slotW: number, slotH: number,
  bboxX: number, bboxY: number, bboxW: number, bboxH: number,
  zoom: number, panX: number, panY: number,
) {
  ctx.save()
  ctx.beginPath(); ctx.rect(slotX, slotY, slotW, slotH); ctx.clip()
  const s  = Math.max(bboxW / img.naturalWidth, bboxH / img.naturalHeight) * zoom
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s
  ctx.drawImage(img,
    bboxX + (bboxW - dw) / 2 + panX,
    bboxY + (bboxH - dh) / 2 + panY,
    dw, dh)
  ctx.restore()
  addInnerShadow(ctx, slotX, slotY, slotW, slotH)
}

// Modalità multi: ogni slot ha la propria foto con zoom/pan
function renderSlotCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  slotX: number, slotY: number, slotW: number, slotH: number,
  zoom = 1, panX = 0, panY = 0,
) {
  ctx.save()
  ctx.beginPath(); ctx.rect(slotX, slotY, slotW, slotH); ctx.clip()
  if (!img) {
    ctx.fillStyle = 'rgba(180,170,160,0.30)'
    ctx.fillRect(slotX, slotY, slotW, slotH)
    ctx.restore(); return
  }
  const s  = Math.max(slotW / img.naturalWidth, slotH / img.naturalHeight) * zoom
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s
  ctx.drawImage(img,
    slotX + (slotW - dw) / 2 + panX,
    slotY + (slotH - dh) / 2 + panY,
    dw, dh)
  ctx.restore()
  addInnerShadow(ctx, slotX, slotY, slotW, slotH)
}

interface SlotState { zoom: number; panX: number; panY: number }
const defaultSlotState = (): SlotState => ({ zoom: 1, panX: 0, panY: 0 })

function drawCanvas(
  canvas: HTMLCanvasElement,
  imgs: (HTMLImageElement | null)[],
  composizione: Composizione,
  roomImg: HTMLImageElement | null,
  mode: 'single' | 'multi',
  singleState: SlotState,
  slotStates: SlotState[],
  texts: TextOverlay[] = [],
  highlightSlot: number | null = null,
) {
  const CW = canvas.width, CH = canvas.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Room background
  if (roomImg) {
    const s = CW / roomImg.naturalWidth
    const dh = roomImg.naturalHeight * s
    ctx.drawImage(roomImg, 0, 0, CW, dh)
    if (dh < CH) { ctx.fillStyle = '#e4ddd4'; ctx.fillRect(0, dh, CW, CH - dh) }
  } else {
    ctx.fillStyle = '#e8e3db'; ctx.fillRect(0, 0, CW, CH)
  }

  const slots  = composizione.slots
  const WALL_H = Math.round(CH * 0.70)
  const availW = CW * 0.88, availH = WALL_H * 0.88
  const scale  = Math.min(availW / 100, availH / 70)
  const offsetX = CW * 0.44 - (100 * scale) / 2
  const offsetY = WALL_H * 0.04 + (availH - 70 * scale) / 2

  // Drop shadows
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.30)'; ctx.shadowBlur = scale * 1.8
  ctx.shadowOffsetX = scale * 0.2; ctx.shadowOffsetY = scale * 1.0
  slots.forEach(s => {
    ctx.fillStyle = '#bbb'
    ctx.fillRect(offsetX + s.x * scale, offsetY + s.y * scale, s.w * scale, s.h * scale)
  })
  ctx.restore()

  // Render slots
  if (mode === 'single') {
    const img = imgs[0] ?? null
    if (img) {
      const { zoom, panX, panY } = singleState
      const bboxX = offsetX + Math.min(...slots.map(s => s.x)) * scale
      const bboxY = offsetY + Math.min(...slots.map(s => s.y)) * scale
      const bboxR = offsetX + Math.max(...slots.map(s => s.x + s.w)) * scale
      const bboxB = offsetY + Math.max(...slots.map(s => s.y + s.h)) * scale
      slots.forEach(slot => {
        renderSlotFromBbox(ctx, img,
          offsetX + slot.x * scale, offsetY + slot.y * scale, slot.w * scale, slot.h * scale,
          bboxX, bboxY, bboxR - bboxX, bboxB - bboxY, zoom, panX, panY)
      })
    }
  } else {
    slots.forEach((slot, i) => {
      const img   = imgs[i] ?? null
      const st    = slotStates[i] ?? defaultSlotState()
      const sx    = offsetX + slot.x * scale, sy = offsetY + slot.y * scale
      const sw    = slot.w * scale,           sh = slot.h * scale
      renderSlotCover(ctx, img, sx, sy, sw, sh, st.zoom, st.panX, st.panY)
      // Highlight del pannello selezionato
      if (highlightSlot === i) {
        ctx.save()
        ctx.strokeStyle = '#7d9b76'; ctx.lineWidth = 3
        ctx.strokeRect(sx + 1.5, sy + 1.5, sw - 3, sh - 3)
        ctx.restore()
      }
    })
  }

  // Text overlays
  texts.forEach(t => {
    ctx.save()
    ctx.font = `${t.style} ${t.size}px ${t.font}`
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2
    ctx.fillStyle = t.color
    ctx.fillText(t.content, t.x, t.y)
    ctx.restore()
  })

  // Watermark
  ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#000'
  ctx.font = `${Math.round(CW * 0.015)}px Montserrat,sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('storiedaraccontare.it', CW - 12, CH - 10)
  ctx.restore()
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function pickSuggestions(count: number): [Composizione, Composizione] {
  const exact = COMPOSIZIONI.filter(c => c.slots.length === count)
  const near  = COMPOSIZIONI.filter(c => c.slots.length === count - 1 || c.slots.length === count + 1)
  const pool  = exact.length >= 2 ? exact : [...exact, ...near]
  const first  = pool[0] ?? COMPOSIZIONI[0]
  const second = pool.find(c => c.id !== first.id) ?? COMPOSIZIONI[1]
  return [first, second]
}

function toCvCoords(canvas: HTMLCanvasElement, e: React.MouseEvent): { x: number; y: number } {
  const r = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - r.left) * (canvas.width  / r.width),
    y: (e.clientY - r.top)  * (canvas.height / r.height),
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SlotUpload({ index, img, onFile }: { index: number; img: HTMLImageElement | null; onFile: (f: File, i: number) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div onClick={() => ref.current?.click()} style={{
      border: `1.5px dashed ${img ? AC : '#c8c0b4'}`, borderRadius: 10, cursor: 'pointer',
      background: img ? `${AC}12` : '#fafaf8', minHeight: 64,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
      transition: 'all .15s', padding: '8px 4px',
    }}>
      {img ? <div style={{ fontSize: '20px' }}>✅</div>
           : <><Upload size={15} color="#b0a89a" /><p style={{ fontSize: '10px', color: '#bbb', margin: 0 }}>Foto {index + 1}</p></>}
      <input ref={ref} type="file" accept="image/*,image/heic,image/heif" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f, index) }} />
    </div>
  )
}

function AdviceSlot({ index, img, onFile }: { index: number; img: HTMLImageElement | null; onFile: (f: File, i: number) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div onClick={() => ref.current?.click()} style={{
      border: `1.5px dashed ${img ? AC : '#c8c0b4'}`, borderRadius: 10, aspectRatio: '1/1',
      cursor: 'pointer', background: img ? 'transparent' : '#fafaf8',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 4, overflow: 'hidden', transition: 'all .15s',
    }}>
      {img
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <><Upload size={16} color="#b0a89a" /><p style={{ fontSize: '10px', color: '#bbb', margin: 0 }}>Foto {index + 1}</p></>}
      <input ref={ref} type="file" accept="image/*,image/heic,image/heif" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f, index) }} />
    </div>
  )
}

function SuggestionCard({ composizione, imgs, roomImg, label }: {
  composizione: Composizione; imgs: (HTMLImageElement | null)[]; roomImg: HTMLImageElement | null; label: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [materiale, setMateriale] = useState(MATERIALI[0])
  const [sizeIdx,   setSizeIdx]   = useState(0)
  const [added,     setAdded]     = useState(false)
  const { addItem } = useCart()
  const sizes = composizione.dimensioni.map(d => d.label)
  const safeIdx2 = Math.min(sizeIdx, sizes.length - 1)
  const variantInfo2 = getVariantInfo(sizes[safeIdx2], materiale)

  function handleAdd() {
    if (!variantInfo2) return
    addItem({
      productId:    variantInfo2.productId,
      variantId:    variantInfo2.variantId,
      quantity:     variantInfo2.quantity,
      productName:  materiale,
      variantLabel: `${sizes[safeIdx2]} — ${composizione.nome}`,
      price:        variantInfo2.priceCents,
      image:        MAT_IMAGE[materiale] ?? '',
      notes:        `Composizione: ${composizione.nome} (${composizione.slots.length} pannell${composizione.slots.length === 1 ? 'o' : 'i'})`,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const slotCount = composizione.slots.length
    drawCanvas(c, imgs, composizione, roomImg, 'multi',
      defaultSlotState(),
      Array.from({ length: slotCount }, defaultSlotState),
    )
  }, [imgs, composizione, roomImg])
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
      <canvas ref={canvasRef} width={600} height={380} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: AC, background: `${AC}18`, borderRadius: 6, padding: '2px 8px' }}>{label}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{composizione.nome}</span>
        </div>
        <p style={{ fontSize: '12px', color: '#999', margin: '0 0 14px' }}>{composizione.slots.length} pannelli · {composizione.gruppo}</p>
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
          width: '100%', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}`,
          background: '#fff', fontSize: '13px', fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', marginBottom: 16,
        }}>
          {sizes.map((s, i) => <option key={s} value={i}>{s}</option>)}
        </select>
        {(() => {
          const total = getTotal(sizes[safeIdx2], materiale)
          return total !== null ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', fontFamily: 'Poppins,sans-serif' }}>€{total}</span>
                <span style={{ fontSize: '12px', color: '#aaa' }}>{composizione.slots.length} pannelli</span>
              </div>
              <p style={{ fontSize: '11px', color: '#aaa', margin: '2px 0 0' }}>{sizes[safeIdx2]} · {materiale}</p>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 12px' }}>{sizes[safeIdx2]} · {materiale}</p>
          )
        })()}
        {variantInfo2 ? (
          <>
            <button onClick={handleAdd} style={{
              width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: added ? '#22863a' : '#1a1a1a', color: '#fff',
              fontSize: '13px', fontWeight: 700, fontFamily: 'Montserrat,sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background .2s',
            }}>
              {added ? <><Check size={14} /> Aggiunto!</> : <><ShoppingCart size={14} /> Aggiungi al carrello</>}
            </button>
            {added && (
              <a href="/shop/carrello" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: '12px', color: AC, textDecoration: 'underline' }}>
                Vai al carrello →
              </a>
            )}
          </>
        ) : (
          <a href="/contatti" style={{
            display: 'block', textAlign: 'center', background: '#1a1a1a', color: '#fff',
            padding: '11px', borderRadius: 10, textDecoration: 'none', fontSize: '13px', fontWeight: 700,
            fontFamily: 'Montserrat,sans-serif',
          }}>Contattami per un preventivo →</a>
        )}
      </div>
    </div>
  )
}

// ─── PricePanel ───────────────────────────────────────────────────────────────

const PRINT_TYPES = [
  { id: 'foto',       label: 'Carta Fotografica', desc: 'Lucida, colori brillanti',   extraPerPanel: 0  },
  { id: 'hahnemuhle', label: 'Hahnemühle',         desc: 'Fine art, opaca, premium',   extraPerPanel: 8  },
]

function PricePanel({ composizione }: { composizione: Composizione }) {
  const sizes = composizione.dimensioni.map(d => d.label)
  const [materiale,   setMateriale]   = useState(MATERIALI[0])
  const [sizeIdx,     setSizeIdx]     = useState(0)
  const [printTypeId, setPrintTypeId] = useState('foto')
  const [added,       setAdded]       = useState(false)
  const { addItem } = useCart()

  const safeIdx   = Math.min(sizeIdx, sizes.length - 1)
  const baseTotal = getTotal(sizes[safeIdx], materiale)
  const variantInfo = getVariantInfo(sizes[safeIdx], materiale)
  const isCornice = materiale === 'Stampa con cornice'
  const printType = PRINT_TYPES.find(p => p.id === printTypeId) ?? PRINT_TYPES[0]
  const pannelli  = variantInfo?.quantity ?? composizione.slots.length
  const extraTotal = isCornice ? printType.extraPerPanel * pannelli : 0
  const total = baseTotal !== null ? baseTotal + extraTotal : null

  function handleAddToCart() {
    if (!variantInfo || total === null) return
    const pricePerItem = variantInfo.priceCents + (isCornice ? printType.extraPerPanel * 100 : 0)
    addItem({
      productId:    variantInfo.productId,
      variantId:    variantInfo.variantId,
      quantity:     variantInfo.quantity,
      productName:  materiale,
      variantLabel: `${sizes[safeIdx]} — ${composizione.nome}${isCornice ? ` · ${printType.label}` : ''}`,
      price:        pricePerItem,
      image:        MAT_IMAGE[materiale] ?? '',
      notes:        `Composizione: ${composizione.nome} (${pannelli} pannell${pannelli === 1 ? 'o' : 'i'})${isCornice ? ` · Stampa: ${printType.label}` : ''}`,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', margin: '0 0 12px' }}>
        Calcola il prezzo
      </p>

      {/* Materiale */}
      <p style={{ fontSize: '10px', color: '#888', margin: '0 0 6px', fontWeight: 700 }}>Materiale</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {MATERIALI.map(m => (
          <button key={m} onClick={() => setMateriale(m)} style={{
            padding: '5px 11px', borderRadius: 20, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${materiale === m ? AC : BORDER}`,
            background: materiale === m ? `${AC}18` : '#fafaf8',
            color: materiale === m ? AC : '#666', transition: 'all .12s',
          }}>{m}</button>
        ))}
      </div>

      {/* Tipo stampa (solo cornice) */}
      {isCornice && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: '10px', color: '#888', margin: '0 0 6px', fontWeight: 700 }}>Tipo di stampa</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {PRINT_TYPES.map(pt => (
              <button key={pt.id} onClick={() => setPrintTypeId(pt.id)} style={{
                flex: 1, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `1.5px solid ${printTypeId === pt.id ? AC : BORDER}`,
                background: printTypeId === pt.id ? `${AC}18` : '#fafaf8',
                transition: 'all .12s',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: printTypeId === pt.id ? AC : '#333', marginBottom: 2 }}>{pt.label}</div>
                <div style={{ fontSize: '10px', color: '#aaa' }}>{pt.desc}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: printTypeId === pt.id ? AC : '#666', marginTop: 2 }}>
                  {pt.extraPerPanel === 0 ? 'Inclusa' : `+€${pt.extraPerPanel}/pannello`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dimensioni */}
      <p style={{ fontSize: '10px', color: '#888', margin: '0 0 6px', fontWeight: 700 }}>Dimensioni</p>
      <select value={sizeIdx} onChange={e => setSizeIdx(Number(e.target.value))} style={{
        width: '100%', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}`,
        background: '#fff', fontSize: '13px', fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', marginBottom: 14,
      }}>
        {sizes.map((s, i) => <option key={s} value={i}>{s}</option>)}
      </select>

      {/* Nota parete */}
      {composizione.dimensioni[safeIdx] && (
        <p style={{ fontSize: '11px', color: AC, margin: '-8px 0 10px', fontWeight: 600 }}>
          📐 {composizione.dimensioni[safeIdx].pareteLabel}
        </p>
      )}

      {/* Totale */}
      {total !== null && variantInfo ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: isCornice && extraTotal > 0 ? 4 : 12 }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', fontFamily: 'Poppins,sans-serif' }}>€{total}</span>
            <span style={{ fontSize: '12px', color: '#aaa' }}>{pannelli} pannell{pannelli === 1 ? 'o' : 'i'}</span>
          </div>
          {isCornice && extraTotal > 0 && (
            <p style={{ fontSize: '11px', color: '#aaa', margin: '0 0 12px' }}>
              Cornice €{baseTotal} + Hahnemühle €{extraTotal}
            </p>
          )}
          <button
            onClick={handleAddToCart}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: added ? '#22863a' : '#1a1a1a', color: '#fff',
              fontSize: '13px', fontWeight: 700, fontFamily: 'Montserrat,sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background .2s',
            }}>
            {added
              ? <><Check size={15} /> Aggiunto al carrello!</>
              : <><ShoppingCart size={15} /> Aggiungi al carrello · €{total}</>}
          </button>
          {added && (
            <a href="/shop/carrello" style={{
              display: 'block', textAlign: 'center', marginTop: 8,
              fontSize: '12px', color: AC, textDecoration: 'underline',
            }}>
              Vai al carrello →
            </a>
          )}
        </>
      ) : (
        <p style={{ fontSize: '12px', color: '#aaa', margin: 0, fontStyle: 'italic' }}>
          Prezzo su richiesta per questa combinazione —{' '}
          <a href="/contatti" style={{ color: AC }}>contattami</a>
        </p>
      )}
    </div>
  )
}

// ─── WallPreviewTool ───────────────────────────────────────────────────────────

type ActiveLayer = 'foto' | 'testo'

export function WallPreviewTool() {
  const [mode,       setMode]       = useState<'single' | 'multi'>('single')
  const [selectedId, setSelectedId] = useState(COMPOSIZIONI[0].id)
  const [singleImg,  setSingleImg]  = useState<HTMLImageElement | null>(null)
  const [singleName, setSingleName] = useState('')
  const [multiImgs,  setMultiImgs]  = useState<(HTMLImageElement | null)[]>([])
  const [isLoading,  setIsLoading]  = useState(false)

  // Livello attivo: foto o testo
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('foto')

  // Zoom / pan — singola foto (mode=single) e per-slot (mode=multi)
  const [singleState, setSingleState] = useState<SlotState>(defaultSlotState())
  const [slotStates,  setSlotStates]  = useState<SlotState[]>([])
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null) // slot selezionato in multi

  // Drag generico (foto o testo)
  const isDragging      = useRef(false)
  const dragStart       = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const draggingTextIdx = useRef<number | null>(null)

  // Swap slot: drag thumbnail → altro thumbnail
  const dragSlotFrom = useRef<number | null>(null)

  // Testo
  const [texts,          setTexts]          = useState<TextOverlay[]>([])
  const [pendingText,    setPendingText]     = useState('')
  const [textSize,       setTextSize]        = useState(40)
  const [textColor,      setTextColor]       = useState('#ffffff')
  const [addingText,     setAddingText]      = useState(false)
  const [selectedTextIdx, setSelectedTextIdx] = useState<number | null>(null)
  const [textFont,       setTextFont]        = useState<FontOption>(FONT_OPTIONS[0])

  // Impaginatore
  const [adviceImgs,  setAdviceImgs]  = useState<(HTMLImageElement | null)[]>(Array(6).fill(null))
  const [suggestions, setSuggestions] = useState<[Composizione, Composizione] | null>(null)

  const [roomImg, setRoomImg] = useState<HTMLImageElement | null>(null)
  const roomImgRef            = useRef<HTMLImageElement | null>(null)
  const canvasRef             = useRef<HTMLCanvasElement>(null)
  const fileInputRef          = useRef<HTMLInputElement>(null)

  const composizione = COMPOSIZIONI.find(c => c.id === selectedId) ?? COMPOSIZIONI[0]
  const slotCount    = composizione.slots.length

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => { roomImgRef.current = img; setRoomImg(img) }
    img.src = '/images/shop/scene-ambiente.png'
  }, [])

  useEffect(() => {
    setMultiImgs(Array(slotCount).fill(null))
    setSlotStates(Array.from({ length: slotCount }, defaultSlotState))
    setSelectedSlot(null)
  }, [slotCount])

  // Wheel zoom sul canvas (solo livello foto)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const handler = (e: WheelEvent) => {
      if (activeLayer !== 'foto') return
      e.preventDefault()
      const delta = -e.deltaY * 0.001
      if (mode === 'single') {
        setSingleState(s => ({ ...s, zoom: Math.max(0.5, Math.min(4, s.zoom + delta)) }))
      } else if (selectedSlot !== null) {
        setSlotStates(prev => prev.map((s, i) => i === selectedSlot
          ? { ...s, zoom: Math.max(0.5, Math.min(4, s.zoom + delta)) } : s))
      }
    }
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [activeLayer, mode, selectedSlot])

  const activeImgs: (HTMLImageElement | null)[] =
    mode === 'single'
      ? Array(slotCount).fill(singleImg)
      : Array.from({ length: slotCount }, (_, i) => multiImgs[i] ?? null)
  const hasAny = activeImgs.some(Boolean)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasAny) return
    drawCanvas(canvas, activeImgs, composizione, roomImgRef.current, mode,
      singleState, slotStates, texts,
      mode === 'multi' && activeLayer === 'foto' ? selectedSlot : null)
  }, [activeImgs, composizione, mode, hasAny, singleState, slotStates, texts, selectedSlot, activeLayer])

  useEffect(() => { redraw() }, [redraw])

  function loadImg(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        const img = new window.Image()
        img.onload = () => resolve(img); img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject; reader.readAsDataURL(file)
    })
  }

  async function handleSingleFile(file: File) {
    setIsLoading(true)
    try { setSingleImg(await loadImg(file)); setSingleName(file.name) }
    finally { setIsLoading(false) }
  }

  async function handleMultiFile(file: File, index: number) {
    const img = await loadImg(file)
    setMultiImgs(prev => { const n = [...prev]; n[index] = img; return n })
    setSelectedSlot(index)
    setActiveLayer('foto')
  }

  function swapSlots(a: number, b: number) {
    setMultiImgs(prev => { const n = [...prev]; [n[a], n[b]] = [n[b], n[a]]; return n })
    setSlotStates(prev => { const n = [...prev]; [n[a], n[b]] = [n[b], n[a]]; return n })
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
      setSuggestions(count === 0 ? null : pickSuggestions(count))
      return next
    })
  }

  // ── Trova il testo più vicino al click (coordinate canvas) ──────────────────
  function findNearestText(cx: number, cy: number): number | null {
    const HIT = 60 // pixel canvas
    let best = -1, bestD = HIT
    texts.forEach((t, i) => {
      const d = Math.hypot(cx - t.x, cy - t.y)
      if (d < bestD) { bestD = d; best = i }
    })
    return best >= 0 ? best : null
  }

  // ── Canvas mouse handlers ──────────────────────────────────────────────────

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (addingText) return
    const canvas = canvasRef.current; if (!canvas) return
    const { x, y } = toCvCoords(canvas, e)

    if (activeLayer === 'testo') {
      const idx = findNearestText(x, y)
      if (idx !== null) {
        draggingTextIdx.current = idx; setSelectedTextIdx(idx)
        dragStart.current = { mx: e.clientX, my: e.clientY, px: texts[idx].x, py: texts[idx].y }
      } else { setSelectedTextIdx(null); draggingTextIdx.current = null }
    } else {
      // layer foto
      isDragging.current = true
      const st = mode === 'single' ? singleState : (slotStates[selectedSlot ?? -1] ?? defaultSlotState())
      dragStart.current = { mx: e.clientX, my: e.clientY, px: st.panX, py: st.panY }
    }
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current; if (!canvas || !dragStart.current) return
    const r = canvas.getBoundingClientRect()
    const s = canvas.width / r.width
    const dx = (e.clientX - dragStart.current.mx) * s
    const dy = (e.clientY - dragStart.current.my) * s

    if (activeLayer === 'testo' && draggingTextIdx.current !== null) {
      const i = draggingTextIdx.current
      setTexts(prev => prev.map((t, j) => j === i
        ? { ...t, x: dragStart.current!.px + dx, y: dragStart.current!.py + dy } : t))
    } else if (activeLayer === 'foto' && isDragging.current) {
      if (mode === 'single') {
        setSingleState(s2 => ({ ...s2, panX: dragStart.current!.px + dx, panY: dragStart.current!.py + dy }))
      } else if (selectedSlot !== null) {
        setSlotStates(prev => prev.map((s2, i) => i === selectedSlot
          ? { ...s2, panX: dragStart.current!.px + dx, panY: dragStart.current!.py + dy } : s2))
      }
    }
  }

  function onMouseUp() { isDragging.current = false; draggingTextIdx.current = null }

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!addingText || !pendingText.trim()) return
    const canvas = canvasRef.current; if (!canvas) return
    const { x, y } = toCvCoords(canvas, e)
    setTexts(prev => [...prev, { x, y, content: pendingText.trim(), size: textSize, color: textColor, font: textFont.value, style: textFont.style }])
    setAddingText(false)
    setActiveLayer('testo') // switcha al layer testo dopo aver piazzato
  }

  function handleDownload() {
    const canvas = canvasRef.current; if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `composizione-${selectedId}.png`
    a.click()
  }

  function resetView() {
    if (mode === 'single') setSingleState(defaultSlotState())
    else if (selectedSlot !== null) setSlotStates(prev => prev.map((s, i) => i === selectedSlot ? defaultSlotState() : s))
  }

  const currentZoom = mode === 'single' ? singleState.zoom : (slotStates[selectedSlot ?? -1]?.zoom ?? 1)
  const setCurrentZoom = (fn: (z: number) => number) => {
    if (mode === 'single') setSingleState(s => ({ ...s, zoom: fn(s.zoom) }))
    else if (selectedSlot !== null) setSlotStates(prev => prev.map((s, i) => i === selectedSlot ? { ...s, zoom: fn(s.zoom) } : s))
  }

  const canvasCursor = addingText ? 'crosshair'
    : activeLayer === 'testo' && texts.length > 0 ? 'move'
    : hasAny ? 'grab'
    : 'default'

  return (
    <>
      {/* ── Tool interattivo ──────────────────────────────────────────────── */}
      <section id="tool" style={{ background: '#f7f4ef', borderTop: '1px solid #e8e4de', borderBottom: '1px solid #e8e4de', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: AC, marginBottom: 10 }}>Tool interattivo</p>
            <h2 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: 'clamp(26px,4vw,40px)', fontWeight: 700, color: '#1a1a1a', margin: '0 0 14px', lineHeight: 1.2 }}>
              La tua foto sulla parete
            </h2>
            <p style={{ fontSize: '15px', color: '#6b6660', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>
              Carica la tua foto, regola l'inquadratura e aggiungi un testo personalizzato.
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
                }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'clamp(240px,35%,360px) 1fr', gap: 32, alignItems: 'start' }}
            className="shop-cfg-grid">

            {/* ── Pannello controlli ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Upload singola */}
              {mode === 'single' && (
                <>
                  <div
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleSingleFile(f) }}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: `2px dashed ${singleImg ? AC : '#c8c0b4'}`, borderRadius: 14, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: singleImg ? `${AC}08` : '#fff', transition: 'all .2s' }}
                  >
                    {isLoading ? (
                      <p style={{ color: AC, fontWeight: 600, fontSize: '14px', margin: 0 }}>Caricamento…</p>
                    ) : singleImg ? (
                      <><div style={{ fontSize: '24px', marginBottom: 6 }}>✅</div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px' }}>{singleName.length > 28 ? singleName.slice(0, 28) + '…' : singleName}</p>
                        <p style={{ fontSize: '12px', color: AC, margin: 0 }}>Clicca per cambiare foto</p></>
                    ) : (
                      <><Upload size={28} color="#b0a89a" style={{ marginBottom: 10 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#555', margin: '0 0 4px' }}>Carica la tua foto</p>
                        <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>JPG · PNG · HEIC — oppure trascina qui</p>
                        <p style={{ fontSize: '11px', color: '#b0a89a', margin: '8px 0 0', fontStyle: 'italic' }}>La foto viene divisa tra i pannelli</p></>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*,image/heic,image/heif" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleSingleFile(f) }} />
                </>
              )}

              {/* Upload multi */}
              {mode === 'multi' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                    Foto per ogni pannello ({slotCount} pannelli)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: slotCount <= 3 ? `repeat(${slotCount}, 1fr)` : 'repeat(3, 1fr)', gap: 8 }}>
                    {Array.from({ length: slotCount }).map((_, i) => (
                      <div key={i}
                        draggable={!!multiImgs[i]}
                        onDragStart={() => { dragSlotFrom.current = i }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault()
                          if (dragSlotFrom.current !== null && dragSlotFrom.current !== i) {
                            swapSlots(dragSlotFrom.current, i)
                            dragSlotFrom.current = null
                          }
                        }}
                        onClick={() => { setSelectedSlot(i); setActiveLayer('foto') }}
                        style={{
                          border: `2px solid ${selectedSlot === i ? AC : (multiImgs[i] ? `${AC}66` : '#c8c0b4')}`,
                          borderRadius: 10, cursor: 'pointer', overflow: 'hidden',
                          background: multiImgs[i] ? 'transparent' : '#fafaf8',
                          minHeight: 64, position: 'relative', transition: 'all .15s',
                          boxShadow: selectedSlot === i ? `0 0 0 2px ${AC}44` : 'none',
                        }}>
                        {multiImgs[i] ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={multiImgs[i]!.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 64 }} />
                            {selectedSlot === i && (
                              <div style={{ position: 'absolute', inset: 0, background: `${AC}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: AC, borderRadius: 4, padding: '2px 6px' }}>Selezionata</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 64, gap: 4 }}
                            onClick={e => { e.stopPropagation(); document.getElementById(`slot-input-${i}`)?.click() }}>
                            <Upload size={15} color="#b0a89a" />
                            <p style={{ fontSize: '10px', color: '#bbb', margin: 0 }}>Foto {i + 1}</p>
                          </div>
                        )}
                        <input id={`slot-input-${i}`} type="file" accept="image/*,image/heic,image/heif" style={{ display: 'none' }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleMultiFile(f, i) }} />
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: '#aaa', marginTop: 6 }}>
                    Clicca per selezionare · Trascina per scambiare posizione
                  </p>
                </div>
              )}

              {/* Composizione */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>Composizione</label>
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ddd', background: '#fff',
                  fontSize: '14px', fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' strokeWidth='1.5' fill='none'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36,
                }}>
                  {COMPOSIZIONI.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <p style={{ fontSize: '12px', color: '#aaa', marginTop: 6 }}>{slotCount} {slotCount === 1 ? 'pannello' : 'pannelli'} · {composizione.materiale}</p>
              </div>

              {/* ── Selettore livello + controlli ── */}
              {hasAny && (
                <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px' }}>

                  {/* Layer toggle */}
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', margin: '0 0 10px' }}>
                    Cosa vuoi modificare?
                  </p>
                  <div style={{ display: 'flex', border: `1.5px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                    {([
                      { key: 'foto'  as const, icon: '🖼️', label: 'Foto' },
                      { key: 'testo' as const, icon: '✏️', label: 'Testo' },
                    ]).map(({ key, icon, label }) => (
                      <button key={key} onClick={() => { setActiveLayer(key); setAddingText(false) }} style={{
                        flex: 1, padding: '8px 6px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: activeLayer === key ? 700 : 500,
                        background: activeLayer === key ? AC : 'transparent',
                        color: activeLayer === key ? '#fff' : '#666',
                        transition: 'all .15s', fontFamily: 'Montserrat,sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      }}>
                        <span>{icon}</span>{label}
                      </button>
                    ))}
                  </div>

                  {/* Livello FOTO */}
                  {activeLayer === 'foto' && (
                    <>
                      {mode === 'multi' && selectedSlot === null ? (
                        <p style={{ fontSize: '12px', color: '#aaa', margin: 0, fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
                          Seleziona un pannello sopra per regolarne l&apos;inquadratura
                        </p>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <button onClick={() => setCurrentZoom(z => Math.max(0.5, z - 0.1))} style={{ padding: '6px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fafaf8', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                              <ZoomOut size={14} color="#555" />
                            </button>
                            <input type="range" min="50" max="400" step="1" value={Math.round(currentZoom * 100)}
                              onChange={e => setCurrentZoom(() => Number(e.target.value) / 100)}
                              style={{ flex: 1, accentColor: AC, minWidth: 0 }} />
                            <button onClick={() => setCurrentZoom(z => Math.min(4, z + 0.1))} style={{ padding: '6px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fafaf8', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                              <ZoomIn size={14} color="#555" />
                            </button>
                            <span style={{ fontSize: '11px', color: '#999', minWidth: 36, textAlign: 'right', flexShrink: 0 }}>{Math.round(currentZoom * 100)}%</span>
                          </div>
                          <p style={{ fontSize: '11px', color: '#aaa', margin: '0 0 8px' }}>Trascina sulla preview per spostare · Rotella per zoomare</p>
                          <button onClick={resetView} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fafaf8', cursor: 'pointer', fontSize: '11px', color: '#666', fontFamily: 'Montserrat,sans-serif' }}>
                            <RotateCcw size={11} /> Reset
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* Livello TESTO */}
                  {activeLayer === 'testo' && (
                    <>
                      <input
                        value={pendingText}
                        onChange={e => setPendingText(e.target.value)}
                        placeholder="Es. Sempre insieme..."
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: '13px', color: '#1a1a1a', marginBottom: 10, boxSizing: 'border-box', display: 'block' }}
                      />

                      {/* Font */}
                      <div style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: '10px', color: '#888', margin: '0 0 6px', fontWeight: 700 }}>Font</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto', paddingRight: 2 }}>
                          {FONT_OPTIONS.map(fo => (
                            <button key={fo.value} onClick={() => {
                              setTextFont(fo)
                              if (selectedTextIdx !== null) {
                                setTexts(prev => prev.map((t, i) => i === selectedTextIdx ? { ...t, font: fo.value, style: fo.style } : t))
                              }
                            }} style={{
                              padding: '6px 10px', borderRadius: 7, border: `1.5px solid ${textFont.value === fo.value ? AC : BORDER}`,
                              background: textFont.value === fo.value ? `${AC}18` : '#fafaf8',
                              cursor: 'pointer', textAlign: 'left',
                              fontSize: 15, fontFamily: fo.value, fontStyle: fo.style === 'italic' ? 'italic' : 'normal',
                              fontWeight: fo.style === 'bold' ? 700 : 400,
                              color: textFont.value === fo.value ? '#1a1a1a' : '#555',
                              lineHeight: 1.2,
                              transition: 'all .12s',
                            }}>
                              {fo.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dimensione */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <p style={{ fontSize: '10px', color: '#888', margin: 0, fontWeight: 700 }}>Dimensione testo</p>
                          <span style={{ fontSize: '10px', color: AC, fontWeight: 700 }}>{textSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="120"
                          step="1"
                          value={textSize}
                          onChange={e => {
                            const v = Number(e.target.value)
                            setTextSize(v)
                            // aggiorna anche il testo selezionato se esiste
                            if (selectedTextIdx !== null) {
                              setTexts(prev => prev.map((t, i) => i === selectedTextIdx ? { ...t, size: v } : t))
                            }
                          }}
                          style={{ width: '100%', accentColor: AC, display: 'block' }}
                        />
                      </div>

                      {/* Colore */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <p style={{ fontSize: '10px', color: '#888', margin: 0, fontWeight: 700 }}>Colore</p>
                        <input type="color" value={textColor} onChange={e => {
                          setTextColor(e.target.value)
                          if (selectedTextIdx !== null) {
                            setTexts(prev => prev.map((t, i) => i === selectedTextIdx ? { ...t, color: e.target.value } : t))
                          }
                        }}
                          style={{ width: 40, height: 30, borderRadius: 6, border: `1px solid ${BORDER}`, cursor: 'pointer', padding: 2 }} />
                        <div style={{ display: 'flex', gap: 4 }}>
                          {['#ffffff', '#000000', '#C9A96E', '#7D9B76'].map(c => (
                            <button key={c} onClick={() => { setTextColor(c); if (selectedTextIdx !== null) setTexts(prev => prev.map((t, i) => i === selectedTextIdx ? { ...t, color: c } : t)) }}
                              style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: `2px solid ${textColor === c ? '#555' : BORDER}`, cursor: 'pointer', padding: 0 }} />
                          ))}
                        </div>
                      </div>

                      {addingText ? (
                        <div style={{ background: `${AC}18`, border: `1.5px solid ${AC}`, borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                          <p style={{ fontSize: '12px', color: AC, fontWeight: 700, margin: '0 0 6px' }}>Clicca sulla preview dove vuoi il testo</p>
                          <button onClick={() => setAddingText(false)} style={{ fontSize: '11px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Annulla</button>
                        </div>
                      ) : (
                        <button disabled={!pendingText.trim()} onClick={() => setAddingText(true)} style={{
                          width: '100%', padding: '9px', borderRadius: 8, border: 'none',
                          cursor: pendingText.trim() ? 'pointer' : 'default',
                          background: pendingText.trim() ? AC : '#ddd', color: '#fff',
                          fontSize: '12px', fontWeight: 700, fontFamily: 'Montserrat,sans-serif',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <Type size={13} /> Posiziona sul canvas
                        </button>
                      )}

                      {/* Lista testi */}
                      {texts.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <p style={{ fontSize: '10px', color: '#aaa', margin: '4px 0 4px', fontStyle: 'italic' }}>
                            Seleziona un testo e trascinalo per spostarlo
                          </p>
                          {texts.map((t, i) => (
                            <div key={i} onClick={() => { setSelectedTextIdx(i); setTextSize(t.size); setTextColor(t.color); const f = FONT_OPTIONS.find(fo => fo.value === t.font) ?? FONT_OPTIONS[0]; setTextFont(f) }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: selectedTextIdx === i ? `${AC}18` : '#f7f4ef', borderRadius: 6, cursor: 'pointer', border: `1.5px solid ${selectedTextIdx === i ? AC : 'transparent'}` }}>
                              <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, border: '1px solid #ccc', flexShrink: 0 }} />
                              <span style={{ fontSize: '11px', color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.content}</span>
                              <span style={{ fontSize: '10px', color: '#bbb', flexShrink: 0 }}>{t.size}px</span>
                              <button onClick={ev => { ev.stopPropagation(); setTexts(prev => prev.filter((_, j) => j !== i)); if (selectedTextIdx === i) setSelectedTextIdx(null) }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#bbb' }}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => { setTexts([]); setSelectedTextIdx(null) }} style={{ fontSize: '11px', color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '2px 0' }}>
                            Rimuovi tutti
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Calcolatore prezzo inline */}
              {hasAny && <PricePanel composizione={composizione} />}

              {/* Actions */}
              {hasAny && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, background: AC, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Montserrat,sans-serif' }}>
                    <Download size={15} /> Scarica anteprima
                  </button>
                  <button onClick={() => { setSingleImg(null); setSingleName(''); setMultiImgs(Array(slotCount).fill(null)); resetView(); setTexts([]) }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: 'transparent', color: '#888', border: '1.5px solid #ddd', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <RefreshCw size={14} /> Ricomincia
                  </button>
                </div>
              )}
            </div>

            {/* ── Canvas ── */}
            <div style={{ position: 'relative' }}>
              <canvas
                ref={canvasRef} width={900} height={560}
                style={{ width: '100%', height: 'auto', borderRadius: 16, display: 'block', background: '#e8e3db', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', cursor: canvasCursor, touchAction: 'none' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onClick={onCanvasClick}
              />
              {!hasAny && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, background: 'rgba(232,227,219,0.82)', gap: 12 }}>
                  <Upload size={40} color="rgba(0,0,0,0.20)" />
                  <p style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'rgba(0,0,0,0.35)' }}>
                    {mode === 'single' ? "Carica una foto per vedere l'anteprima" : "Carica almeno una foto per vedere l'anteprima"}
                  </p>
                </div>
              )}
              {addingText && hasAny && (
                <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.72)', color: '#fff', borderRadius: 20, padding: '6px 16px', fontSize: '12px', fontWeight: 600, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                  Clicca dove vuoi il testo
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Impaginatore automatico ───────────────────────────────────────── */}
      <section id="consiglio" style={{ background: '#fff', borderBottom: '1px solid #e8e4de', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: '30px', marginBottom: 12 }}>✨</div>
            <h2 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px', lineHeight: 1.2 }}>Vuoi un consiglio?</h2>
            <p style={{ fontSize: '15px', color: '#6b6660', maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
              Carica le tue foto e componiamo noi per te. Ti proponiamo due soluzioni con stile e misure che puoi modificare a piacere.
            </p>
          </div>

          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#888', letterSpacing: '.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>Carica da 1 a 6 foto</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, maxWidth: 680, margin: '0 auto' }} className="shop-format-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <AdviceSlot index={i} img={adviceImgs[i] ?? null} onFile={handleAdviceFile} />
                  {adviceImgs[i] && (
                    <button onClick={() => removeAdviceImg(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {suggestions ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }} className="shop-cfg-grid">
              <SuggestionCard composizione={suggestions[0]} imgs={adviceImgs} roomImg={roomImg} label="Soluzione A" />
              <SuggestionCard composizione={suggestions[1]} imgs={adviceImgs} roomImg={roomImg} label="Soluzione B" />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f7f4ef', borderRadius: 14, border: `1.5px dashed ${BORDER}`, maxWidth: 500, margin: '0 auto' }}>
              <p style={{ fontSize: '14px', color: '#aaa', margin: 0 }}>Carica almeno una foto per vedere le proposte di composizione</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

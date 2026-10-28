'use client'

// app/shop/calendari/[code]/page.tsx — Scheda prodotto calendario 2027

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Minus, Plus, ShoppingCart, Upload, X, AlertTriangle } from 'lucide-react'
import { useCart } from '@/components/shop/CartProvider'
import { normalizeImageOrientation } from '@/lib/shop/normalize-image'
import { getCalendarLineTotal, formatCalendarPriceBreakdown } from '@/lib/shop/calendar-pricing'

interface ModelData {
  code: string
  title: string
  format: string
  category: string
  photoSlots: number
  imageUrl: string
  thumbUrl: string
}

interface PhotoSlotState {
  key: string | null
  url: string | null
  uploading: boolean
  progress: number
  width: number | null
  height: number | null
  error: string | null
}

const MIN_SHORT_SIDE = 1500
const MAX_FILE_SIZE = 25 * 1024 * 1024

function emptySlot(): PhotoSlotState {
  return { key: null, url: null, uploading: false, progress: 0, width: null, height: null, error: null }
}

function fmtEuro(cents: number) {
  return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export default function CalendarModelPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editIndex = searchParams.get('edit')

  const { cart, addItem, removeItem } = useCart()

  const [model, setModel] = useState<ModelData | null>(null)
  const [notFoundError, setNotFoundError] = useState(false)
  const [slots, setSlots] = useState<PhotoSlotState[]>([])
  const [note, setNote] = useState('')
  const [rightsChecked, setRightsChecked] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    fetch(`/api/shop/calendari/models/${params.code}`)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then((m: ModelData) => {
        setModel(m)
        setSlots(Array.from({ length: m.photoSlots }, () => emptySlot()))
      })
      .catch(() => setNotFoundError(true))
  }, [params.code])

  // Precompila da una riga carrello esistente (link "Cambia foto")
  useEffect(() => {
    if (!model || editIndex == null) return
    const idx = parseInt(editIndex, 10)
    const item = cart.items[idx]
    if (!item || item.kind !== 'calendar' || item.modelCode !== model.code) return
    setQuantity(item.quantity)
    setNote(item.note ?? '')
    setRightsChecked(true)
    if (item.photoKeys && item.photoKeys.length === model.photoSlots) {
      setSlots(item.photoKeys.map((k, i) => ({
        key: k,
        url: item.photoUrls?.[i] ?? null,
        uploading: false, progress: 100, width: null, height: null, error: null,
      })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, editIndex])

  const uploadToSlot = useCallback(async (index: number, file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...emptySlot(), error: 'File troppo grande (max 25MB)' } : s))
      return
    }
    setSlots(prev => prev.map((s, i) => i === index ? { ...emptySlot(), uploading: true } : s))
    try {
      const uploadFile = await normalizeImageOrientation(file)

      const presignRes = await fetch('/api/shop/presign-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: uploadFile.name, contentType: uploadFile.type, folder: 'calendari/tmp' }),
      })
      if (!presignRes.ok) throw new Error('presign failed')
      const { uploadUrl, publicUrl } = await presignRes.json()

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', uploadFile.type)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setSlots(prev => prev.map((s, i) => i === index ? { ...s, progress: pct } : s))
          }
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error('upload failed'))
        xhr.onerror = () => reject(new Error('upload failed'))
        xhr.send(uploadFile)
      })

      const key = new URL(publicUrl).pathname.replace(/^\//, '')
      let finalUrl = publicUrl
      let width: number | null = null
      let height: number | null = null
      try {
        const normRes = await fetch('/api/shop/calendari/normalize-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
        if (normRes.ok) {
          const normData = await normRes.json()
          finalUrl = normData.url ?? publicUrl
          width = normData.width ?? null
          height = normData.height ?? null
        }
      } catch { /* HEIC non convertito: la foto resta comunque caricata */ }

      setSlots(prev => prev.map((s, i) => i === index
        ? { key, url: finalUrl, uploading: false, progress: 100, width, height, error: null }
        : s))
    } catch {
      setSlots(prev => prev.map((s, i) => i === index ? { ...emptySlot(), error: 'Caricamento fallito, riprova' } : s))
    }
  }, [])

  const allFilled = slots.length > 0 && slots.every(s => s.key && !s.uploading)
  const canSubmit = allFilled && rightsChecked && !!model

  const priceBreakdown = model ? formatCalendarPriceBreakdown(model.format, quantity) : ''
  const totalPrice = model ? getCalendarLineTotal(model.format, quantity) : 0

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !model) return
    const photoKeys = slots.map(s => s.key!)
    const photoUrls = slots.map(s => s.url!)
    const variantId = `${model.format}__${photoKeys.join('_')}`

    if (editIndex != null) {
      const idx = parseInt(editIndex, 10)
      const oldItem = cart.items[idx]
      if (oldItem) removeItem(oldItem.productId, oldItem.variantId)
    }

    addItem({
      productId: `calendario-${model.code}`,
      variantId,
      quantity,
      productName: `Calendario 2027 — ${model.code}`,
      variantLabel: 'Carta fotografica 30×45 cm',
      price: 0,
      image: model.thumbUrl,
      kind: 'calendar',
      modelCode: model.code,
      calendarFormat: model.format,
      photoKeys,
      photoUrls,
      note: note.trim() || undefined,
      lineTotal: totalPrice,
    })

    if (editIndex != null) {
      router.push('/shop/carrello')
    } else {
      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    }
  }, [canSubmit, model, slots, quantity, note, totalPrice, editIndex, cart.items, removeItem, addItem, router])

  if (notFoundError) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}>
        <p style={{ fontSize: '15px', color: 'var(--n-t2)', marginBottom: 16 }}>Modello non trovato.</p>
        <Link href="/shop/calendari" style={{ color: 'var(--n-ac)', fontWeight: 600, textDecoration: 'none' }}>
          ← Torna al catalogo
        </Link>
      </div>
    )
  }

  if (!model) {
    return <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--n-t3)' }}>Caricamento…</div>
  }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) clamp(20px, 5vw, 40px) 80px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '12px', color: 'var(--n-t3)' }}>
        <Link href="/shop" style={{ color: 'var(--n-t2)', textDecoration: 'none' }}>Shop</Link>
        <span>/</span>
        <Link href="/shop/calendari" style={{ color: 'var(--n-t2)', textDecoration: 'none' }}>Calendari 2027</Link>
        <span>/</span>
        <span style={{ color: 'var(--n-tx)', fontWeight: 600 }}>{model.code}</span>
      </div>

      <div className="calendar-pdp-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>

        {/* Galleria */}
        <div>
          <div style={{ position: 'relative', borderRadius: 'var(--n-r)', overflow: 'hidden', border: '1px solid var(--n-border)', aspectRatio: '30 / 45', background: 'var(--n-surface)' }}>
            <Image src={model.imageUrl} alt={model.code} fill style={{ objectFit: 'cover' }} sizes="(max-width: 900px) 100vw, 480px" priority />
          </div>
          <div style={{
            marginTop: 10, background: 'var(--n-ac)', color: '#fff', borderRadius: 'var(--n-r2)',
            fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            textAlign: 'center', padding: '8px 0',
          }}>
            Carta fotografica
          </div>
        </div>

        {/* Info + acquisto */}
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '26px', color: 'var(--n-tx)', letterSpacing: '-0.02em', marginBottom: 2 }}>
            Calendario 2027 · {model.code}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--n-t2)', marginBottom: 16 }}>su carta fotografica</p>

          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--n-tx)', fontFamily: 'Poppins, sans-serif' }}>10 €</span>
            <span style={{ fontSize: '13px', color: 'var(--n-t2)', marginLeft: 10 }}>dalla seconda copia 8 €</span>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Formato 30×45 cm',
              '1 foglio stampato su carta fotografica',
              'Fornito con astine e gancio per appenderlo',
              'Personalizzato con le tue foto',
              'Calendario annuale 2027',
              'Ritiro in studio',
            ].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: 'var(--n-t2)' }}>
                <Check size={14} color="var(--n-ac)" style={{ flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>

          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--n-t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            {model.photoSlots === 1 ? '1 foto richiesta' : `${model.photoSlots} foto richieste`}
          </p>

          {/* Box upload foto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            {slots.map((slot, i) => (
              <PhotoSlotBox key={i} index={i} slot={slot} onFile={(f) => uploadToSlot(i, f)} />
            ))}
          </div>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note facoltative (nome, dedica, indicazioni sul ritaglio…)"
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--n-r2)',
              border: '1px solid var(--n-border)', fontSize: '13px', fontFamily: 'Montserrat, sans-serif',
              color: 'var(--n-tx)', resize: 'vertical', marginBottom: 14, boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '12px', color: 'var(--n-t2)', marginBottom: 20, cursor: 'pointer' }}>
            <input type="checkbox" checked={rightsChecked} onChange={e => setRightsChecked(e.target.checked)} style={{ marginTop: 2 }} />
            Confermo di avere i diritti sulle foto caricate
          </label>

          {/* Quantità + prezzo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--n-border)', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <Minus size={14} />
              </button>
              <span style={{ fontSize: '15px', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--n-border)', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <Plus size={14} />
              </button>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: 'var(--n-t3)', margin: 0 }}>{priceBreakdown}</p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--n-ac)', fontFamily: 'Poppins, sans-serif', margin: 0 }}>{fmtEuro(totalPrice)}</p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 'var(--n-r2)',
              border: 'none', fontSize: '14px', fontWeight: 700,
              background: canSubmit ? 'var(--n-tx)' : 'var(--n-border)',
              color: canSubmit ? '#fff' : 'var(--n-t3)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {added ? <><Check size={16} /> Aggiunto al carrello</> : editIndex != null
              ? <>Salva modifiche</>
              : <><ShoppingCart size={16} /> Aggiungi al carrello</>}
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .calendar-pdp-layout { grid-template-columns: 440px 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ── Box upload foto ──────────────────────────────────────────────────────────

function PhotoSlotBox({ index, slot, onFile }: { index: number; slot: PhotoSlotState; onFile: (f: File) => void }) {
  const lowRes = slot.width != null && slot.height != null && Math.min(slot.width, slot.height) < MIN_SHORT_SIDE

  return (
    <div style={{ border: '1px solid var(--n-border)', borderRadius: 'var(--n-r2)', padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: 'var(--n-surface)', flexShrink: 0, position: 'relative', display: 'grid', placeItems: 'center' }}>
        {slot.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.url} alt={`Foto ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--n-t3)' }}>{index + 1}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--n-tx)', margin: 0 }}>
          Foto {index + 1}
        </p>
        {slot.uploading ? (
          <div style={{ marginTop: 6, height: 5, borderRadius: 3, background: 'var(--n-surface)', overflow: 'hidden' }}>
            <div style={{ width: `${slot.progress}%`, height: '100%', background: 'var(--n-ac)', transition: 'width .15s' }} />
          </div>
        ) : slot.error ? (
          <p style={{ fontSize: '11px', color: '#d97070', margin: '2px 0 0' }}>{slot.error}</p>
        ) : lowRes ? (
          <p style={{ fontSize: '11px', color: '#c9a05a', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={12} /> La foto potrebbe risultare poco nitida in stampa
          </p>
        ) : slot.key ? (
          <p style={{ fontSize: '11px', color: 'var(--n-t3)', margin: '2px 0 0' }}>Caricata</p>
        ) : (
          <p style={{ fontSize: '11px', color: 'var(--n-t3)', margin: '2px 0 0' }}>JPG, PNG, HEIC — max 25MB</p>
        )}
      </div>

      <label style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
        fontSize: '12px', fontWeight: 600, color: 'var(--n-ac-dark)',
        background: 'var(--n-ac-dim)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
      }}>
        {slot.key ? <X size={13} /> : <Upload size={13} />}
        {slot.key ? 'Sostituisci' : 'Carica'}
        <input
          type="file"
          accept="image/*,.heic,.heif"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
        />
      </label>
    </div>
  )
}

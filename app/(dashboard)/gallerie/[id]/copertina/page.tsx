'use client'

// app/(dashboard)/gallerie/[id]/copertina/page.tsx
// Configurazione "Crea Copertina" per singola galleria: misure, colori, decori.

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Gallery, CoverColor, CoverDecor, CoverDecorPosition } from '@/lib/types'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const POSITION_LABELS: Record<CoverDecorPosition, string> = {
  'top-left':     'Alto sinistra',
  'top-right':    'Alto destra',
  'bottom-left':  'Basso sinistra',
  'bottom-right': 'Basso destra',
}

async function uploadAsset(file: File, galleryId: string, folder: string): Promise<string> {
  const res = await fetch('/api/photos/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type, galleryId, folder }),
  })
  if (!res.ok) throw new Error('presign fallito')
  const { uploadUrl, publicUrl } = await res.json()
  const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'image/jpeg' } })
  if (!put.ok && put.status !== 200) throw new Error('upload fallito')
  return publicUrl
}

export default function CopertinaConfigPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)

  const [enabled,     setEnabled]     = useState(false)
  const [colors,      setColors]      = useState<CoverColor[]>([])
  const [decorations, setDecorations] = useState<CoverDecor[]>([])

  // La misura la decide il fotografo per questa galleria — non è una scelta del cliente.
  const [sizeLabel, setSizeLabel] = useState('')
  const [sizeW,     setSizeW]     = useState('')
  const [sizeH,     setSizeH]     = useState('')

  const [uploadingColor, setUploadingColor] = useState(false)
  const [uploadingDecor, setUploadingDecor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const colorInputRef = useRef<HTMLInputElement>(null)
  const decorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/galleries/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((g: Gallery) => {
        setGallery(g)
        const cb = g.settings?.cover_builder
        setEnabled(cb?.enabled ?? false)
        setSizeLabel(cb?.size?.label ?? '')
        setSizeW(cb?.size ? String(cb.size.widthCm) : '')
        setSizeH(cb?.size ? String(cb.size.heightCm) : '')
        setColors(cb?.colors ?? [])
        setDecorations(cb?.decorations ?? [])
      })
      .catch(() => router.push('/gallerie'))
      .finally(() => setLoading(false))
  }, [id, router])

  const handleColorUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !id) return
    setUploadingColor(true)
    setError(null)
    try {
      const imageUrl = await uploadAsset(file, id, 'cover-assets/colori')
      setColors(prev => [...prev, { id: uid(), label: file.name.replace(/\.[^.]+$/, ''), imageUrl }])
    } catch {
      setError('Caricamento colore non riuscito. Riprova.')
    }
    setUploadingColor(false)
  }, [id])

  const handleDecorUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !id) return
    setUploadingDecor(true)
    setError(null)
    try {
      const imageUrl = await uploadAsset(file, id, 'cover-assets/decori')
      setDecorations(prev => [...prev, { id: uid(), label: file.name.replace(/\.[^.]+$/, ''), imageUrl, position: 'bottom-right' }])
    } catch {
      setError('Caricamento decoro non riuscito. Riprova.')
    }
    setUploadingDecor(false)
  }, [id])

  const updateColorLabel = useCallback((cid: string, label: string) => {
    setColors(prev => prev.map(c => c.id === cid ? { ...c, label } : c))
  }, [])
  const removeColor = useCallback((cid: string) => {
    setColors(prev => prev.filter(c => c.id !== cid))
  }, [])

  const updateDecorLabel = useCallback((did: string, label: string) => {
    setDecorations(prev => prev.map(d => d.id === did ? { ...d, label } : d))
  }, [])
  const updateDecorPosition = useCallback((did: string, position: CoverDecorPosition) => {
    setDecorations(prev => prev.map(d => d.id === did ? { ...d, position } : d))
  }, [])
  const removeDecor = useCallback((did: string) => {
    setDecorations(prev => prev.filter(d => d.id !== did))
  }, [])

  const save = useCallback(async () => {
    if (!gallery) return
    const w = Number(sizeW)
    const h = Number(sizeH)
    if (enabled && (!sizeLabel.trim() || !w || !h)) {
      setError('Imposta la misura (etichetta, larghezza e altezza) prima di salvare.')
      return
    }
    setSaving(true)
    setError(null)
    const size = sizeLabel.trim() && w && h ? { id: 'size', label: sizeLabel.trim(), widthCm: w, heightCm: h } : null
    const newSettings = {
      ...(gallery.settings ?? {}),
      cover_builder: { enabled, size, colors, decorations },
    }
    const res = await fetch(`/api/galleries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: newSettings }),
    })
    if (res.ok) {
      const updated = await res.json()
      setGallery(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      setError('Salvataggio non riuscito. Riprova.')
    }
    setSaving(false)
  }, [gallery, id, enabled, sizeLabel, sizeW, sizeH, colors, decorations])

  if (loading || !gallery) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: '13px' }}>
        Caricamento…
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px', maxWidth: 820 }}>

        {/* ── HEADER ── */}
        <div className="flex flex-wrap items-start gap-[14px] pb-5 mb-5 border-b border-[var(--b1)]">
          <button
            onClick={() => router.push(`/gallerie/${id}`)}
            style={{
              width: 34, height: 34, flexShrink: 0, marginTop: 3,
              background: 'var(--s1)', border: '1px solid var(--b1)',
              borderRadius: 'var(--r2)', display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--t2)" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--tx)', marginBottom: 4 }}>
              Crea Copertina
            </div>
            <p style={{ fontSize: '12px', color: 'var(--t3)' }}>{gallery.name}</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            style={{
              background: saved ? 'rgba(142,201,176,.18)' : 'var(--ac)',
              color: saved ? 'var(--ac)' : '#0a0a0a',
              border: 'none', borderRadius: 'var(--r2)', padding: '0 18px', height: 36,
              fontSize: '12px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? .6 : 1, transition: 'all .15s',
            }}
          >
            {saved ? 'Salvato ✓' : saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(217,112,112,.12)', border: '1px solid rgba(217,112,112,.3)', color: 'var(--red)', borderRadius: 'var(--r2)', padding: '10px 14px', fontSize: '12px', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* ── TOGGLE ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', padding: '16px 18px', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)', marginBottom: 2 }}>Abilita &ldquo;Crea Copertina&rdquo; per questa galleria</p>
            <p style={{ fontSize: '11px', color: 'var(--t3)' }}>Se attivo, il cliente vedrà un pulsante per progettare la copertina del proprio album nel portale.</p>
          </div>
          <button
            onClick={() => setEnabled(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: enabled ? 'var(--ac)' : 'var(--s3)', position: 'relative', transition: 'background .2s',
            }}
          >
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: enabled ? 23 : 3, transition: 'left .2s' }} />
          </button>
        </div>

        {/* ── MISURA ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Misura</h2>
          <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 12 }}>La misura della copertina fisica per questa galleria. La decidi tu: il cliente non la sceglie, vede già impostata la sua.</p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={sizeLabel} onChange={e => setSizeLabel(e.target.value)} placeholder="Etichetta (es. 30×30 cm)"
              style={{ flex: '1 1 180px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '8px 12px', fontSize: '12px', color: 'var(--tx)' }} />
            <input value={sizeW} onChange={e => setSizeW(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Largh. cm"
              style={{ width: 90, background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '8px 12px', fontSize: '12px', color: 'var(--tx)' }} />
            <input value={sizeH} onChange={e => setSizeH(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Alt. cm"
              style={{ width: 90, background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '8px 12px', fontSize: '12px', color: 'var(--tx)' }} />
          </div>
        </section>

        {/* ── COLORI ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Colori</h2>
          <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 12 }}>Carica una foto per ogni colore/materiale reale disponibile.</p>

          <input ref={colorInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleColorUpload} />
          {colors.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
              {colors.map(c => (
                <div key={c.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl} alt={c.label} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input value={c.label} onChange={e => updateColorLabel(c.id, e.target.value)}
                      style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, padding: '5px 8px', fontSize: '11px', color: 'var(--tx)', width: '100%' }} />
                    <button onClick={() => removeColor(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '10px', padding: 0, textAlign: 'left' }}>Rimuovi</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => colorInputRef.current?.click()} disabled={uploadingColor}
            style={{ background: 'var(--s2)', border: '1px dashed var(--b2)', borderRadius: 'var(--r2)', padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--t2)', cursor: uploadingColor ? 'not-allowed' : 'pointer' }}>
            {uploadingColor ? 'Caricamento…' : '+ Carica colore'}
          </button>
        </section>

        {/* ── DECORI ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Decori</h2>
          <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 12 }}>Animaletti, fiori o altri motivi tra cui il cliente sceglierà. Scegli tu la posizione fissa di ciascuno sulla copertina.</p>

          <input ref={decorInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleDecorUpload} />
          {decorations.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
              {decorations.map(d => (
                <div key={d.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.imageUrl} alt={d.label} style={{ width: '100%', height: 90, objectFit: 'contain', background: 'var(--s2)', display: 'block' }} />
                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input value={d.label} onChange={e => updateDecorLabel(d.id, e.target.value)}
                      style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, padding: '5px 8px', fontSize: '11px', color: 'var(--tx)', width: '100%' }} />
                    <select value={d.position} onChange={e => updateDecorPosition(d.id, e.target.value as CoverDecorPosition)}
                      style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, padding: '5px 8px', fontSize: '11px', color: 'var(--tx)', width: '100%' }}>
                      {(Object.keys(POSITION_LABELS) as CoverDecorPosition[]).map(p => (
                        <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                      ))}
                    </select>
                    <button onClick={() => removeDecor(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '10px', padding: 0, textAlign: 'left' }}>Rimuovi</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => decorInputRef.current?.click()} disabled={uploadingDecor}
            style={{ background: 'var(--s2)', border: '1px dashed var(--b2)', borderRadius: 'var(--r2)', padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--t2)', cursor: uploadingDecor ? 'not-allowed' : 'pointer' }}>
            {uploadingDecor ? 'Caricamento…' : '+ Carica decoro'}
          </button>
        </section>

      </div>
    </div>
  )
}

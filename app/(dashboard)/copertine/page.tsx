'use client'

// app/(dashboard)/copertine/page.tsx
// Libreria globale "Crea Copertina": colori e decori per occasione (battesimo,
// comunione, matrimonio, generico), riusati da tutte le gallerie dello stesso tipo.

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { CoverColor, CoverDecor, CoverDecorPosition, CoverSectionKey, CoverSections } from '@/lib/types'
import { COVER_SECTION_LABELS } from '@/lib/types'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const SECTION_KEYS: CoverSectionKey[] = ['battesimo', 'comunione', 'matrimonio', 'generico']

const POSITION_LABELS: Record<CoverDecorPosition, string> = {
  'top-left':     'Alto sinistra',
  'top-right':    'Alto destra',
  'bottom-left':  'Basso sinistra',
  'bottom-right': 'Basso destra',
}

const EMPTY_SECTIONS: CoverSections = {
  battesimo:  { colors: [], decorations: [] },
  comunione:  { colors: [], decorations: [] },
  matrimonio: { colors: [], decorations: [] },
  generico:   { colors: [], decorations: [] },
}

async function uploadAsset(file: File, folder: string): Promise<string> {
  const res = await fetch('/api/photos/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type, galleryId: 'cover-sections', folder }),
  })
  if (!res.ok) throw new Error('presign fallito')
  const { uploadUrl, publicUrl } = await res.json()
  const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'image/jpeg' } })
  if (!put.ok && put.status !== 200) throw new Error('upload fallito')
  return publicUrl
}

export default function CopertineLibraryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<CoverSections>(EMPTY_SECTIONS)
  const [activeSection, setActiveSection] = useState<CoverSectionKey>('matrimonio')

  const [uploadingColor, setUploadingColor] = useState(false)
  const [uploadingDecor, setUploadingDecor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const colorInputRef = useRef<HTMLInputElement>(null)
  const decorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile/cover-sections')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Partial<CoverSections>) => {
        setSections({ ...EMPTY_SECTIONS, ...data })
      })
      .catch(() => setError('Impossibile caricare la libreria.'))
      .finally(() => setLoading(false))
  }, [])

  const current = sections[activeSection]

  const handleColorUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingColor(true)
    setError(null)
    try {
      const imageUrl = await uploadAsset(file, `${activeSection}/colori`)
      const newColor: CoverColor = { id: uid(), label: file.name.replace(/\.[^.]+$/, ''), imageUrl }
      setSections(prev => ({ ...prev, [activeSection]: { ...prev[activeSection], colors: [...prev[activeSection].colors, newColor] } }))
    } catch {
      setError('Caricamento colore non riuscito. Riprova.')
    }
    setUploadingColor(false)
  }, [activeSection])

  const handleDecorUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingDecor(true)
    setError(null)
    try {
      const imageUrl = await uploadAsset(file, `${activeSection}/decori`)
      const newDecor: CoverDecor = { id: uid(), label: file.name.replace(/\.[^.]+$/, ''), imageUrl, position: 'bottom-right' }
      setSections(prev => ({ ...prev, [activeSection]: { ...prev[activeSection], decorations: [...prev[activeSection].decorations, newDecor] } }))
    } catch {
      setError('Caricamento decoro non riuscito. Riprova.')
    }
    setUploadingDecor(false)
  }, [activeSection])

  const updateColor = useCallback((cid: string, label: string) => {
    setSections(prev => ({ ...prev, [activeSection]: { ...prev[activeSection], colors: prev[activeSection].colors.map(c => c.id === cid ? { ...c, label } : c) } }))
  }, [activeSection])
  const removeColor = useCallback((cid: string) => {
    setSections(prev => ({ ...prev, [activeSection]: { ...prev[activeSection], colors: prev[activeSection].colors.filter(c => c.id !== cid) } }))
  }, [activeSection])

  const updateDecorLabel = useCallback((did: string, label: string) => {
    setSections(prev => ({ ...prev, [activeSection]: { ...prev[activeSection], decorations: prev[activeSection].decorations.map(d => d.id === did ? { ...d, label } : d) } }))
  }, [activeSection])
  const updateDecorPosition = useCallback((did: string, position: CoverDecorPosition) => {
    setSections(prev => ({ ...prev, [activeSection]: { ...prev[activeSection], decorations: prev[activeSection].decorations.map(d => d.id === did ? { ...d, position } : d) } }))
  }, [activeSection])
  const removeDecor = useCallback((did: string) => {
    setSections(prev => ({ ...prev, [activeSection]: { ...prev[activeSection], decorations: prev[activeSection].decorations.filter(d => d.id !== did) } }))
  }, [activeSection])

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/profile/cover-sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_sections: sections }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      setError('Salvataggio non riuscito. Riprova.')
    }
    setSaving(false)
  }, [sections])

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: '13px' }}>
        Caricamento…
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px', maxWidth: 900 }}>

        {/* ── HEADER ── */}
        <div className="flex flex-wrap items-start gap-[14px] pb-5 mb-5 border-b border-[var(--b1)]">
          <button
            onClick={() => router.push('/gallerie')}
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
              Libreria Copertine
            </div>
            <p style={{ fontSize: '12px', color: 'var(--t3)' }}>Colori e decori per occasione — riusati da tutte le gallerie dello stesso tipo</p>
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

        {/* ── SEZIONI (tab) ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--b1)', marginBottom: 24, overflowX: 'auto' }}>
          {SECTION_KEYS.map(key => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              style={{
                padding: '10px 18px', fontSize: '13px', fontWeight: activeSection === key ? 700 : 400,
                color: activeSection === key ? 'var(--ac)' : 'var(--t3)',
                border: 'none', borderBottom: `2px solid ${activeSection === key ? 'var(--ac)' : 'transparent'}`,
                background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
              }}
            >
              {COVER_SECTION_LABELS[key]}
              {(sections[key].colors.length > 0 || sections[key].decorations.length > 0) && (
                <span style={{ marginLeft: 6, fontSize: '10px', color: 'var(--t3)' }}>
                  ({sections[key].colors.length + sections[key].decorations.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── COLORI ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>
            Colori — {COVER_SECTION_LABELS[activeSection]}
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 12 }}>Carica una foto per ogni colore/materiale reale disponibile per questa occasione.</p>

          <input ref={colorInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleColorUpload} />
          {current.colors.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
              {current.colors.map(c => (
                <div key={c.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl} alt={c.label} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input value={c.label} onChange={e => updateColor(c.id, e.target.value)}
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
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>
            Decori — {COVER_SECTION_LABELS[activeSection]}
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 12 }}>Animaletti, fiori o altri motivi tra cui il cliente sceglierà. Scegli tu la posizione fissa di ciascuno.</p>

          <input ref={decorInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleDecorUpload} />
          {current.decorations.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
              {current.decorations.map(d => (
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

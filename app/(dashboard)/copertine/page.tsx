'use client'

// app/(dashboard)/copertine/page.tsx
// Libreria globale "Crea Copertina": colori, categorie di decori (es. Animali,
// Piante e fiori, Altro) e rivestimenti — riusati da TUTTE le gallerie, senza
// distinzione di occasione/cerimonia.

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { CoverColor, CoverDecor, CoverDecorCategory, CoverDecorPosition, CoverMaterial, CoverMockupSet } from '@/lib/types'

const DEFAULT_MATERIALS: CoverMaterial[] = [
  { id: 'tela',       label: 'Tela',       customizable: true },
  { id: 'similpelle', label: 'Similpelle', customizable: false, samples: [] },
]

const MOCKUP_ORIENTATIONS: { key: keyof CoverMockupSet; label: string }[] = [
  { key: 'horizontal', label: 'Orizzontale' },
  { key: 'vertical',   label: 'Verticale' },
  { key: 'square',     label: 'Quadrato' },
]

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const POSITION_LABELS: Record<CoverDecorPosition, string> = {
  'center':       'Centro',
  'top-left':     'Alto sinistra',
  'top-right':    'Alto destra',
  'bottom-left':  'Basso sinistra',
  'bottom-right': 'Basso destra',
}

const DEFAULT_DECOR_SIZE_CM = 5

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
  const [colors, setColors] = useState<CoverColor[]>([])
  const [decorCategories, setDecorCategories] = useState<CoverDecorCategory[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [materials, setMaterials] = useState<CoverMaterial[]>([])
  const [newMaterial, setNewMaterial] = useState('')
  const [uploadingSampleFor, setUploadingSampleFor] = useState<string | null>(null)
  const [uploadingMockupKey, setUploadingMockupKey] = useState<string | null>(null)

  const [uploadingColor, setUploadingColor] = useState(false)
  const [uploadingDecorFor, setUploadingDecorFor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const colorInputRef = useRef<HTMLInputElement>(null)
  const decorInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const sampleInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const mockupInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch('/api/profile/cover-sections')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { cover_colors?: CoverColor[]; cover_decor_categories?: CoverDecorCategory[]; cover_materials?: CoverMaterial[] }) => {
        setColors(data.cover_colors ?? [])
        setDecorCategories(data.cover_decor_categories ?? [])
        setMaterials(data.cover_materials ?? DEFAULT_MATERIALS)
      })
      .catch(() => setError('Impossibile caricare la libreria.'))
      .finally(() => setLoading(false))
  }, [])

  // ── rivestimenti ──────────────────────────────────────────────────────────
  const addMaterial = useCallback(() => {
    const label = newMaterial.trim()
    if (!label || materials.some(m => m.label === label)) return
    setMaterials(prev => [...prev, { id: uid(), label, customizable: true }])
    setNewMaterial('')
  }, [newMaterial, materials])

  const removeMaterial = useCallback((id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id))
  }, [])

  const updateMaterialLabel = useCallback((id: string, label: string) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, label } : m))
  }, [])

  const toggleMaterialCustomizable = useCallback((id: string) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, customizable: !m.customizable } : m))
  }, [])

  const handleSampleUpload = useCallback(async (materialId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setUploadingSampleFor(materialId)
    setError(null)
    const results = await Promise.allSettled(files.map(file => uploadAsset(file, `rivestimenti/${materialId}`)))
    const newSamples: CoverColor[] = []
    let failed = 0
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') newSamples.push({ id: uid(), label: files[i].name.replace(/\.[^.]+$/, ''), imageUrl: r.value })
      else failed++
    })
    if (newSamples.length > 0) {
      setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, samples: [...(m.samples ?? []), ...newSamples] } : m))
    }
    if (failed > 0) setError(`${failed} campion${failed > 1 ? 'i' : 'e'} non caricat${failed > 1 ? 'i' : 'o'}. Riprova.`)
    setUploadingSampleFor(null)
  }, [])

  const removeSample = useCallback((materialId: string, sampleId: string) => {
    setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, samples: (m.samples ?? []).filter(s => s.id !== sampleId) } : m))
  }, [])

  const updateSampleLabel = useCallback((materialId: string, sampleId: string, label: string) => {
    setMaterials(prev => prev.map(m => m.id === materialId
      ? { ...m, samples: (m.samples ?? []).map(s => s.id === sampleId ? { ...s, label } : s) }
      : m))
  }, [])

  const handleMockupUpload = useCallback(async (materialId: string, sampleId: string, orientation: keyof CoverMockupSet, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const key = `${materialId}:${sampleId}:${orientation}`
    setUploadingMockupKey(key)
    setError(null)
    try {
      const url = await uploadAsset(file, `rivestimenti/${materialId}/mockup-${orientation}`)
      setMaterials(prev => prev.map(m => m.id === materialId
        ? { ...m, samples: (m.samples ?? []).map(s => s.id === sampleId ? { ...s, mockups: { ...s.mockups, [orientation]: url } } : s) }
        : m))
    } catch {
      setError('Caricamento mockup non riuscito. Riprova.')
    }
    setUploadingMockupKey(null)
  }, [])

  // ── colori (globali) ────────────────────────────────────────────────────
  const handleColorUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setUploadingColor(true)
    setError(null)
    const results = await Promise.allSettled(files.map(file => uploadAsset(file, 'colori')))
    const newColors: CoverColor[] = []
    let failed = 0
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') newColors.push({ id: uid(), label: files[i].name.replace(/\.[^.]+$/, ''), imageUrl: r.value })
      else failed++
    })
    if (newColors.length > 0) setColors(prev => [...prev, ...newColors])
    if (failed > 0) setError(`${failed} colore${failed > 1 ? 'i' : ''} non caricat${failed > 1 ? 'i' : 'o'}. Riprova.`)
    setUploadingColor(false)
  }, [])

  const updateColor = useCallback((cid: string, label: string) => {
    setColors(prev => prev.map(c => c.id === cid ? { ...c, label } : c))
  }, [])
  const removeColor = useCallback((cid: string) => {
    setColors(prev => prev.filter(c => c.id !== cid))
  }, [])

  // ── categorie di decori ─────────────────────────────────────────────────
  const addCategory = useCallback(() => {
    const label = newCategory.trim()
    if (!label || decorCategories.some(c => c.label === label)) return
    setDecorCategories(prev => [...prev, { id: uid(), label, decorations: [] }])
    setNewCategory('')
  }, [newCategory, decorCategories])

  const removeCategory = useCallback((id: string) => {
    setDecorCategories(prev => prev.filter(c => c.id !== id))
  }, [])

  const updateCategoryLabel = useCallback((id: string, label: string) => {
    setDecorCategories(prev => prev.map(c => c.id === id ? { ...c, label } : c))
  }, [])

  const handleDecorUpload = useCallback(async (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setUploadingDecorFor(categoryId)
    setError(null)
    const results = await Promise.allSettled(files.map(file => uploadAsset(file, `decori/${categoryId}`)))
    const newDecors: CoverDecor[] = []
    let failed = 0
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') newDecors.push({ id: uid(), label: files[i].name.replace(/\.[^.]+$/, ''), imageUrl: r.value, position: 'center', sizeCm: DEFAULT_DECOR_SIZE_CM })
      else failed++
    })
    if (newDecors.length > 0) {
      setDecorCategories(prev => prev.map(c => c.id === categoryId ? { ...c, decorations: [...c.decorations, ...newDecors] } : c))
    }
    if (failed > 0) setError(`${failed} decor${failed > 1 ? 'i' : 'o'} non caricat${failed > 1 ? 'i' : 'o'}. Riprova.`)
    setUploadingDecorFor(null)
  }, [])

  const updateDecorLabel = useCallback((categoryId: string, did: string, label: string) => {
    setDecorCategories(prev => prev.map(c => c.id === categoryId
      ? { ...c, decorations: c.decorations.map(d => d.id === did ? { ...d, label } : d) }
      : c))
  }, [])
  const updateDecorPosition = useCallback((categoryId: string, did: string, position: CoverDecorPosition) => {
    setDecorCategories(prev => prev.map(c => c.id === categoryId
      ? { ...c, decorations: c.decorations.map(d => d.id === did ? { ...d, position } : d) }
      : c))
  }, [])
  const updateDecorSize = useCallback((categoryId: string, did: string, sizeCm: number) => {
    setDecorCategories(prev => prev.map(c => c.id === categoryId
      ? { ...c, decorations: c.decorations.map(d => d.id === did ? { ...d, sizeCm } : d) }
      : c))
  }, [])
  const removeDecor = useCallback((categoryId: string, did: string) => {
    setDecorCategories(prev => prev.map(c => c.id === categoryId
      ? { ...c, decorations: c.decorations.filter(d => d.id !== did) }
      : c))
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/cover-sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_colors: colors, cover_decor_categories: decorCategories, cover_materials: materials }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError('Salvataggio non riuscito. Riprova.')
      }
    } catch {
      setError('Salvataggio non riuscito. Controlla la connessione e riprova.')
    }
    setSaving(false)
  }, [colors, decorCategories, materials])

  // ── salvataggio automatico ───────────────────────────────────────────────
  // Evita di perdere il lavoro (es. durante un caricamento massiccio di
  // campioni) se il browser si ricarica prima che il fotografo prema "Salva".
  const didLoadRef = useRef(false)
  useEffect(() => {
    if (!loading) didLoadRef.current = true
  }, [loading])

  useEffect(() => {
    if (!didLoadRef.current) return
    const t = setTimeout(() => { save() }, 2500)
    return () => clearTimeout(t)
  }, [colors, decorCategories, materials, save])

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
            <p style={{ fontSize: '12px', color: 'var(--t3)' }}>Rivestimenti, colori e decori — uguali per tutte le gallerie, qualunque sia la cerimonia</p>
            <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 2 }}>Salvataggio automatico attivo — non perdi il lavoro anche se non premi &ldquo;Salva&rdquo;</p>
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

        {/* ── RIVESTIMENTI ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Rivestimenti</h2>
          <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 12 }}>
            I materiali della copertina fisica — uguali per tutte le occasioni. Se <strong>personalizzabile</strong>, il cliente sceglie colore e decoro (dalle sezioni sotto); se no, carica uno o più <strong>campioni</strong> (es. colori diversi dello stesso materiale) tra cui il cliente sceglierà — senza scelta separata di colore/decoro. Per ogni campione puoi anche caricare 3 foto dell&apos;album vero già rilegato (orizzontale/verticale/quadrato): se presenti, verranno mostrate al cliente al posto del campione, nella versione giusta in base alla misura della galleria.
          </p>

          {materials.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {materials.map(m => (
                <div key={m.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <input value={m.label} onChange={e => updateMaterialLabel(m.id, e.target.value)}
                      style={{ flex: '0 1 160px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, padding: '6px 10px', fontSize: '12px', fontWeight: 600, color: 'var(--tx)' }} />

                    <button onClick={() => toggleMaterialCustomizable(m.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}>
                      <span style={{
                        width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
                        background: m.customizable ? 'var(--ac)' : 'var(--s3)', transition: 'background .2s',
                      }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: m.customizable ? 19 : 3, transition: 'left .2s' }} />
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--t2)', fontWeight: 500 }}>
                        {m.customizable ? 'Personalizzabile (colore + decoro)' : 'Aspetto fisso (campione)'}
                      </span>
                    </button>

                    <button onClick={() => removeMaterial(m.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4, display: 'flex' }}>
                      <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>

                  {!m.customizable && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input ref={el => { sampleInputRefs.current[m.id] = el }} type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={e => handleSampleUpload(m.id, e)} />

                      {(m.samples ?? []).length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                          {(m.samples ?? []).map(s => (
                            <div key={s.id} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 8, overflow: 'hidden' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={s.imageUrl} alt={s.label} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <input value={s.label} onChange={e => updateSampleLabel(m.id, s.id, e.target.value)}
                                  style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 6, padding: '5px 8px', fontSize: '11px', color: 'var(--tx)', width: '100%' }} />

                                <div style={{ display: 'flex', gap: 4 }}>
                                  {MOCKUP_ORIENTATIONS.map(o => {
                                    const mockupKey = `${m.id}:${s.id}:${o.key}`
                                    const mockupUrl = s.mockups?.[o.key]
                                    return (
                                      <div key={o.key} style={{ flex: 1 }}>
                                        <input ref={el => { mockupInputRefs.current[mockupKey] = el }} type="file" accept="image/*" style={{ display: 'none' }}
                                          onChange={e => handleMockupUpload(m.id, s.id, o.key, e)} />
                                        <button
                                          onClick={() => mockupInputRefs.current[mockupKey]?.click()}
                                          disabled={uploadingMockupKey === mockupKey}
                                          title={`Mockup ${o.label}`}
                                          style={{
                                            width: '100%', height: 36, borderRadius: 6, cursor: 'pointer',
                                            border: mockupUrl ? '1px solid var(--ac)' : '1px dashed var(--b2)',
                                            background: mockupUrl ? `url(${mockupUrl}) center/cover` : 'var(--s1)',
                                            position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                          }}
                                        >
                                          <span style={{
                                            fontSize: '8px', fontWeight: 700, color: mockupUrl ? '#fff' : 'var(--t3)',
                                            background: mockupUrl ? 'rgba(0,0,0,.45)' : 'transparent', width: '100%',
                                            padding: '2px 0', borderRadius: '0 0 5px 5px', textAlign: 'center',
                                          }}>
                                            {uploadingMockupKey === mockupKey ? '…' : o.label.slice(0, 4)}
                                          </span>
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>

                                <button onClick={() => removeSample(m.id, s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '10px', padding: 0, textAlign: 'left' }}>Rimuovi campione</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={() => sampleInputRefs.current[m.id]?.click()} disabled={uploadingSampleFor === m.id}
                        style={{
                          alignSelf: 'flex-start', background: 'var(--s2)', border: '1px dashed var(--b2)', borderRadius: 6, padding: '8px 14px',
                          fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          color: (m.samples ?? []).length === 0 ? 'var(--red)' : 'var(--t2)',
                        }}>
                        {uploadingSampleFor === m.id ? 'Caricamento…' : (m.samples ?? []).length === 0 ? '+ Carica campione (almeno uno obbligatorio)' : '+ Aggiungi campione'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newMaterial} onChange={e => setNewMaterial(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMaterial()}
              placeholder="Es. Velluto" style={{ flex: '0 1 220px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '8px 12px', fontSize: '12px', color: 'var(--tx)' }} />
            <button onClick={addMaterial} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--tx)', cursor: 'pointer' }}>
              Aggiungi
            </button>
          </div>
        </section>

        {/* ── COLORI (globali) ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Colori</h2>
          <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 12 }}>Carica una foto per ogni colore/materiale reale disponibile — vanno bene per qualsiasi cerimonia, non serve ricaricarli per occasione.</p>

          <input ref={colorInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleColorUpload} />
          {colors.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
              {colors.map(c => (
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

        {/* ── DECORI (per categoria) ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Decori</h2>
          <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 12 }}>
            Organizza i decori in categorie a tuo piacere (es. Animali, Piante e fiori, Altro) — sono le stesse per tutte le gallerie. Scegli tu la posizione fissa di ciascun decoro.
          </p>

          {decorCategories.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
              {decorCategories.map(cat => (
                <div key={cat.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input value={cat.label} onChange={e => updateCategoryLabel(cat.id, e.target.value)}
                      style={{ flex: '0 1 200px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, padding: '6px 10px', fontSize: '12px', fontWeight: 600, color: 'var(--tx)' }} />
                    <button onClick={() => removeCategory(cat.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4, display: 'flex' }}>
                      <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>

                  <input ref={el => { decorInputRefs.current[cat.id] = el }} type="file" accept="image/*" multiple style={{ display: 'none' }}
                    onChange={e => handleDecorUpload(cat.id, e)} />

                  {cat.decorations.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                      {cat.decorations.map(d => (
                        <div key={d.id} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 8, overflow: 'hidden' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={d.imageUrl} alt={d.label} style={{ width: '100%', height: 90, objectFit: 'contain', background: 'var(--s1)', display: 'block' }} />
                          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input value={d.label} onChange={e => updateDecorLabel(cat.id, d.id, e.target.value)}
                              style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 6, padding: '5px 8px', fontSize: '11px', color: 'var(--tx)', width: '100%' }} />
                            <select value={d.position} onChange={e => updateDecorPosition(cat.id, d.id, e.target.value as CoverDecorPosition)}
                              style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 6, padding: '5px 8px', fontSize: '11px', color: 'var(--tx)', width: '100%' }}>
                              {(Object.keys(POSITION_LABELS) as CoverDecorPosition[]).map(p => (
                                <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                              ))}
                            </select>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input type="number" min={1} max={30} step={0.5} value={d.sizeCm ?? DEFAULT_DECOR_SIZE_CM}
                                onChange={e => updateDecorSize(cat.id, d.id, Number(e.target.value) || DEFAULT_DECOR_SIZE_CM)}
                                style={{ width: 54, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 6, padding: '5px 8px', fontSize: '11px', color: 'var(--tx)' }} />
                              <span style={{ fontSize: '11px', color: 'var(--t3)' }}>cm</span>
                            </div>
                            <button onClick={() => removeDecor(cat.id, d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '10px', padding: 0, textAlign: 'left' }}>Rimuovi</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={() => decorInputRefs.current[cat.id]?.click()} disabled={uploadingDecorFor === cat.id}
                    style={{ alignSelf: 'flex-start', background: 'var(--s2)', border: '1px dashed var(--b2)', borderRadius: 6, padding: '8px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--t2)', cursor: 'pointer' }}>
                    {uploadingDecorFor === cat.id ? 'Caricamento…' : '+ Carica decoro'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()}
              placeholder="Es. Animali" style={{ flex: '0 1 220px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '8px 12px', fontSize: '12px', color: 'var(--tx)' }} />
            <button onClick={addCategory} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--tx)', cursor: 'pointer' }}>
              Aggiungi categoria
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}

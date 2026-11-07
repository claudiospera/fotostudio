'use client'

// app/(dashboard)/gallerie/[id]/copertina/page.tsx
// Configurazione "Crea Copertina" per singola galleria: misura e sezione
// (libreria colori/decori condivisa, gestita in /copertine).

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Gallery, CoverSectionKey } from '@/lib/types'
import { COVER_SECTION_KEYS, COVER_SECTION_LABELS } from '@/lib/types'

function defaultSectionForType(type?: string): CoverSectionKey {
  const t = (type ?? '').toLowerCase()
  if (t.includes('matrimonio') || t.includes('promessa')) return 'matrimonio'
  if (t.includes('battesimo')) return 'battesimo'
  if (t.includes('comunione')) return 'comunione'
  if (t.includes('newborn')) return 'nascita'
  if (t.includes('1 anno') || t.includes('18 anni')) return 'compleanno'
  if (t.includes('anniversario')) return 'anniversario'
  return 'generico'
}

export default function CopertinaConfigPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)

  const [enabled, setEnabled] = useState(false)
  const [section, setSection] = useState<CoverSectionKey>('generico')

  // La misura la decide il fotografo per questa galleria — non è una scelta del cliente.
  const [sizeLabel, setSizeLabel] = useState('')
  const [sizeW,     setSizeW]     = useState('')
  const [sizeH,     setSizeH]     = useState('')

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/galleries/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((g: Gallery) => {
        setGallery(g)
        const cb = g.settings?.cover_builder
        setEnabled(cb?.enabled ?? false)
        setSection(cb?.section ?? defaultSectionForType(g.type))
        setSizeLabel(cb?.size?.label ?? '')
        setSizeW(cb?.size ? String(cb.size.widthCm) : '')
        setSizeH(cb?.size ? String(cb.size.heightCm) : '')
      })
      .catch(() => router.push('/gallerie'))
      .finally(() => setLoading(false))
  }, [id, router])

  const suggestedSection = useMemo(() => defaultSectionForType(gallery?.type), [gallery?.type])

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
      cover_builder: { enabled, size, section },
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
  }, [gallery, id, enabled, sizeLabel, sizeW, sizeH, section])

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

        {/* ── SEZIONE (colori/decori) ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Colori e decori</h2>
          <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: 12 }}>
            Questa galleria usa la libreria colori/decori di una sezione. Le immagini si caricano una volta sola per occasione nella{' '}
            <Link href="/copertine" style={{ color: 'var(--ac)' }}>Libreria Copertine</Link>, non qui.
            {suggestedSection && section !== suggestedSection && (
              <> In base al tipo di galleria (&ldquo;{gallery.type}&rdquo;) suggeriamo &ldquo;{COVER_SECTION_LABELS[suggestedSection]}&rdquo;.</>
            )}
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COVER_SECTION_KEYS.map(key => (
              <button key={key} onClick={() => setSection(key)} style={{
                padding: '10px 16px', borderRadius: 'var(--r2)',
                border: `2px solid ${section === key ? 'var(--ac)' : 'var(--b1)'}`,
                background: section === key ? 'var(--acd)' : 'var(--s2)',
                color: section === key ? 'var(--ac)' : 'var(--tx)',
                fontSize: '12px', fontWeight: section === key ? 700 : 500, cursor: 'pointer',
              }}>
                {COVER_SECTION_LABELS[key]}
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

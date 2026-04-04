'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SERVICE_TYPES } from '@/lib/constants'
import type { Gallery, GalleryStatus, ServiceType } from '@/lib/types'

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'var(--s2)',
  border: '1px solid var(--b1)',
  borderRadius: 'var(--r2)',
  padding: '9px 12px',
  color: 'var(--tx)',
  fontSize: '14px',
  outline: 'none',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--t3)',
  fontWeight: 500,
  marginBottom: '6px',
}

const STATUS_LABELS: Record<GalleryStatus, string> = {
  active:   'Attiva',
  draft:    'Bozza',
  archived: 'Archiviata',
}

const STATUS_COLORS: Record<GalleryStatus, React.CSSProperties> = {
  active:   { background: 'rgba(142,201,176,.18)', color: 'var(--ac)',  border: '1px solid rgba(142,201,176,.28)' },
  draft:    { background: 'rgba(255,255,255,.07)', color: 'var(--t2)',  border: '1px solid var(--b1)' },
  archived: { background: 'rgba(217,112,112,.15)', color: 'var(--red)', border: '1px solid rgba(217,112,112,.25)' },
}

function formatDate(d?: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GalleriePage() {
  const router = useRouter()

  // gallery list
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loadingList, setLoadingList] = useState(true)

  // new gallery modal
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [type, setType] = useState<ServiceType | ''>('')
  const [date, setDate] = useState('')

  // ── fetch galleries ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/galleries')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGalleries(data) })
      .finally(() => setLoadingList(false))
  }, [])

  // ── modal helpers ────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setName(''); setSubtitle(''); setType(''); setDate(''); setError(null)
  }, [])

  const handleClose = useCallback(() => { setOpen(false); resetForm() }, [resetForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subtitle: subtitle.trim() || null,
          type: type || null,
          date: date || null,
          status: 'draft',
        }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? 'Errore nella creazione') }
      const gallery: Gallery = await res.json()
      handleClose()
      router.push(`/gallerie/${gallery.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Topbar
        title="Gallerie"
        actions={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            + Nuova galleria
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--b1)' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--tx)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Le tue gallerie
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--t3)' }}>
            {loadingList ? '…' : `${galleries.length} ${galleries.length === 1 ? 'galleria' : 'gallerie'}`}
          </p>
        </div>

        {loadingList ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--t3)', fontSize: '13px' }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--ac)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            Caricamento gallerie…
          </div>
        ) : galleries.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--t3)', fontSize: '14px', marginBottom: 12 }}>Nessuna galleria ancora. Crea la prima!</p>
              <Button variant="primary" size="sm" onClick={() => setOpen(true)}>+ Nuova galleria</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {galleries.map((g, i) => {
              const coverPhoto = g.cover_url
                ? { url: g.cover_url }
                : g.photos
                  ? [...g.photos].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))[0]
                  : null
              const coverColor = g.cover_color ?? '#2a3830'
              const photoCount = g.photos?.length ?? 0
              const status = g.status as GalleryStatus

              return (
                <div
                  key={g.id}
                  onClick={() => router.push(`/gallerie/${g.id}`)}
                  style={{
                    background: 'var(--s1)', border: '1px solid var(--b1)',
                    borderRadius: 'var(--r)', overflow: 'hidden',
                    cursor: 'pointer', transition: 'border-color .2s, transform .2s, box-shadow .2s',
                    animation: `slideUp .25s ease ${i * 0.04}s both`,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'var(--b3)'
                    el.style.transform = 'translateY(-2px)'
                    el.style.boxShadow = '0 8px 32px rgba(0,0,0,.25)'
                    const overlay = el.querySelector('.card-overlay') as HTMLElement
                    if (overlay) overlay.style.opacity = '1'
                    const btn = el.querySelector('.card-preview-btn') as HTMLElement
                    if (btn) btn.style.display = 'flex'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'var(--b1)'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                    const overlay = el.querySelector('.card-overlay') as HTMLElement
                    if (overlay) overlay.style.opacity = '0'
                    const btn = el.querySelector('.card-preview-btn') as HTMLElement
                    if (btn) btn.style.display = 'none'
                  }}
                >
                  {/* Cover */}
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                    {coverPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverPhoto.url}
                        alt={g.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .3s ease' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: `linear-gradient(135deg, ${coverColor} 0%, color-mix(in srgb, ${coverColor} 60%, #050505) 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '32px', color: 'rgba(255,255,255,.2)', letterSpacing: '-0.03em' }}>
                          {g.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Status badge */}
                    <div style={{ position: 'absolute', top: 10, left: 10 }}>
                      <span style={{
                        fontSize: '9px', fontWeight: 700, letterSpacing: '.08em',
                        textTransform: 'uppercase', padding: '3px 8px', borderRadius: 12,
                        backdropFilter: 'blur(6px)', ...STATUS_COLORS[status],
                      }}>
                        {STATUS_LABELS[status]}
                      </span>
                    </div>

                    {/* Photo count badge */}
                    {photoCount > 0 && (
                      <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.8)', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: 12 }}>
                          {photoCount} foto
                        </span>
                      </div>
                    )}

                    {/* Anteprima portale — in alto a destra sull'overlay */}
                    {status === 'active' && (
                      <a
                        href={`/cliente/${g.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        title="Anteprima portale cliente"
                        style={{
                          position: 'absolute', top: 10, right: 10,
                          background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(255,255,255,.15)',
                          borderRadius: 8, width: 28, height: 28,
                          display: 'none', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', textDecoration: 'none', zIndex: 2,
                        }}
                        className="card-preview-btn"
                      >
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </a>
                    )}

                    {/* Hover overlay */}
                    <div
                      className="card-overlay"
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity .2s',
                      }}
                    >
                      <span style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: '12px', fontWeight: 600, letterSpacing: '.04em' }}>
                        Apri galleria →
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px 16px' }}>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--tx)', margin: '0 0 6px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.name}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '11px', color: 'var(--t3)' }}>
                      {g.type && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg viewBox="0 0 24 24" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          {g.type}
                        </span>
                      )}
                      {g.date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg viewBox="0 0 24 24" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {formatDate(g.date)}
                        </span>
                      )}
                      {g.subtitle && (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, fontStyle: 'italic' }}>
                          {g.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal nuova galleria */}
      <Modal isOpen={open} onClose={handleClose} title="Nuova galleria" width="sm">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={LABEL_STYLE}>Nome galleria *</label>
            <input style={INPUT_STYLE} value={name} onChange={e => setName(e.target.value)} placeholder="es. Marco & Sofia" autoFocus required />
          </div>
          <div>
            <label style={LABEL_STYLE}>Sottotitolo</label>
            <input style={INPUT_STYLE} value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="es. Villa Rufolo, Ravello" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={LABEL_STYLE}>Tipo servizio</label>
              <select style={{ ...INPUT_STYLE, cursor: 'pointer' }} value={type} onChange={e => setType(e.target.value as ServiceType | '')}>
                <option value="">— Seleziona —</option>
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Data evento</label>
              <input type="date" style={INPUT_STYLE} value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          {error && (
            <p style={{ color: 'var(--red)', fontSize: '13px', padding: '8px 12px', background: 'rgba(217,112,112,0.1)', borderRadius: 'var(--r2)' }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="secondary" size="sm" onClick={handleClose}>Annulla</Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading || !name.trim()}>
              {loading ? 'Creazione…' : 'Crea galleria'}
            </Button>
          </div>
        </form>
      </Modal>

    </>
  )
}

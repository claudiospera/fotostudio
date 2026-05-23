'use client'
// app/admin/page.tsx — pannello admin locale Real Weddings

import { useEffect, useState, useCallback } from 'react'

interface Wedding {
  slug:      string
  title:     string
  location?: string | null
  date?:     string | null
  cover:     string
  photos:    string[]
}

const BG    = '#111210'
const S1    = '#1a1c1a'
const S2    = '#222422'
const S3    = '#2c2e2c'
const TX    = '#eeecea'
const T2    = '#9a9890'
const T3    = '#616460'
const AC    = '#8ec9b0'
const RED   = '#d97070'
const AMBER = '#c9a05a'

export default function AdminPage() {
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [status, setStatus]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [confirm, setConfirm]   = useState(false)

  const fetchWeddings = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/weddings', { cache: 'no-store' })
    const data = await res.json()
    setWeddings(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchWeddings() }, [fetchWeddings])

  const toggle = (url: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(url) ? next.delete(url) : next.add(url)
      return next
    })

  const toggleAll = (photos: string[]) =>
    setSelected(prev => {
      const next    = new Set(prev)
      const allSel  = photos.every(u => next.has(u))
      photos.forEach(u => allSel ? next.delete(u) : next.add(u))
      return next
    })

  const handleDelete = async () => {
    setConfirm(false)
    setDeleting(true)
    setStatus(null)
    try {
      const res  = await fetch('/api/admin/photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls: [...selected] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus({ msg: `✅ ${data.deleted} foto eliminate. Fai git push per aggiornare il sito.`, ok: true })
      setSelected(new Set())
      await fetchWeddings()
    } catch (err) {
      setStatus({ msg: `❌ Errore: ${err}`, ok: false })
    } finally {
      setDeleting(false)
    }
  }

  const totalPhotos = weddings.reduce((n, w) => n + w.photos.length, 0)
  const selCount    = selected.size

  return (
    <div suppressHydrationWarning style={{ background: BG, minHeight: '100vh', color: TX, fontFamily: "'DM Sans', sans-serif", paddingBottom: selCount ? 80 : 0 }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, margin: 0 }}>
            Admin — Real Weddings
          </h1>
          <p style={{ color: T3, fontSize: 12, margin: '3px 0 0' }}>
            {loading ? '...' : `${weddings.length} matrimoni · ${totalPhotos} foto`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: 'rgba(201,160,90,0.15)', color: AMBER, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, letterSpacing: '0.06em' }}>
            SOLO LOCALE
          </span>
          <a href="/" style={{ color: T2, fontSize: 12, textDecoration: 'none' }}>← Sito</a>
        </div>
      </div>

      {/* ── Status ── */}
      {status && (
        <div style={{
          margin: '12px 32px 0', padding: '10px 14px', borderRadius: 7,
          background: status.ok ? 'rgba(142,201,176,0.12)' : 'rgba(217,112,112,0.12)',
          color: status.ok ? AC : RED, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{status.msg}</span>
          {status.ok && <code style={{ background: S2, padding: '2px 7px', borderRadius: 4, fontSize: 11, color: T2 }}>git push</code>}
        </div>
      )}

      {/* ── Hint ── */}
      {!loading && selCount === 0 && (
        <p style={{ color: T3, fontSize: 11, margin: '10px 32px 0', letterSpacing: '0.04em' }}>
          Clicca le foto per selezionarle, poi premi "Elimina selezionate"
        </p>
      )}

      {/* ── Content ── */}
      <div style={{ padding: '20px 32px' }}>
        {loading ? (
          <p style={{ color: T3, fontSize: 13 }}>Caricamento...</p>
        ) : weddings.map(w => {
          const allSel = w.photos.length > 0 && w.photos.every(u => selected.has(u))
          const someSel = w.photos.some(u => selected.has(u))
          return (
            <section key={w.slug} style={{ marginBottom: 40 }}>
              {/* Wedding header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, margin: 0, color: TX }}>
                  {w.title}
                </h2>
                {w.location && <span style={{ color: T3, fontSize: 11 }}>{w.location}</span>}
                {w.date     && <span style={{ color: T3, fontSize: 11 }}>· {w.date}</span>}
                <span style={{ color: T3, fontSize: 11, marginLeft: 'auto' }}>{w.photos.length} foto</span>
                <button
                  onClick={() => toggleAll(w.photos)}
                  style={{
                    background: allSel ? 'rgba(217,112,112,0.15)' : someSel ? 'rgba(201,160,90,0.15)' : S2,
                    color: allSel ? RED : someSel ? AMBER : T2,
                    border: 'none', borderRadius: 5, padding: '4px 10px',
                    fontSize: 10, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em',
                  }}
                >
                  {allSel ? 'Deseleziona tutto' : 'Seleziona tutto'}
                </button>
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 4 }}>
                {w.photos.map(url => {
                  const isSel   = selected.has(url)
                  const isCover = url === w.cover
                  const name    = decodeURIComponent(url.split('/').pop() ?? '')
                  return (
                    <div
                      key={url}
                      onClick={() => toggle(url)}
                      title={name}
                      style={{
                        position: 'relative', aspectRatio: '2/3',
                        background: S2, borderRadius: 5, overflow: 'hidden', cursor: 'pointer',
                        outline: isSel ? `2px solid ${RED}` : 'none',
                        outlineOffset: '-2px',
                        opacity: isSel ? 0.7 : 1,
                        transition: 'opacity 0.15s, outline 0.15s',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={name}
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {isCover && (
                        <span style={{
                          position: 'absolute', top: 3, left: 3,
                          background: AMBER, color: '#1a1612',
                          fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                        }}>C</span>
                      )}
                      {isSel && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(217,112,112,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 20, color: '#fff', lineHeight: 1 }}>✕</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* ── Barra elimina fissa in basso ── */}
      {selCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: S1, borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: T2, fontSize: 13 }}>
            <strong style={{ color: RED }}>{selCount}</strong> foto selezionate
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setSelected(new Set())}
              style={{ background: S3, color: T2, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}
            >
              Annulla
            </button>
            <button
              disabled={deleting}
              onClick={() => setConfirm(true)}
              style={{
                background: RED, color: '#fff', border: 'none', borderRadius: 6,
                padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? 'Eliminando...' : `Elimina ${selCount} foto`}
            </button>
          </div>
        </div>
      )}

      {/* ── Dialog conferma ── */}
      {confirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setConfirm(false)}
        >
          <div
            style={{ background: S1, borderRadius: 12, padding: 28, width: 340, border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px', fontFamily: "'Syne', sans-serif", fontSize: 16 }}>Conferma eliminazione</h3>
            <p style={{ color: T2, fontSize: 14, marginBottom: 8 }}>
              Stai per eliminare <strong style={{ color: RED }}>{selCount} foto</strong> da R2 e da <code style={{ fontSize: 12 }}>_data.ts</code>.
            </p>
            <p style={{ color: T3, fontSize: 12, marginBottom: 24 }}>L&apos;operazione non è reversibile.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(false)} style={{ background: S3, color: T2, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={handleDelete} style={{ background: RED, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

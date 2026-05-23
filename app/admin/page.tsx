'use client'
// app/admin/page.tsx
// Pannello admin locale — gestione foto Real Weddings
// Accessibile solo su http://localhost:3000/admin

import { useEffect, useState, useCallback } from 'react'

interface Wedding {
  slug:      string
  title:     string
  location?: string
  date?:     string
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
  const [weddings, setWeddings]   = useState<Wedding[]>([])
  const [loading, setLoading]     = useState(true)
  const [status, setStatus]       = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [confirm, setConfirm]     = useState<{ url: string; wedding: string } | null>(null)

  const fetchWeddings = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/weddings', { cache: 'no-store' })
    const data = await res.json()
    setWeddings(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchWeddings() }, [fetchWeddings])

  const handleDelete = async (photoUrl: string) => {
    setConfirm(null)
    setDeleting(photoUrl)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus(`✅ Foto rimossa. Ora fai git push per aggiornare il sito.`)
      await fetchWeddings()
    } catch (err) {
      setStatus(`❌ Errore: ${err}`)
    } finally {
      setDeleting(null)
    }
  }

  const totalPhotos = weddings.reduce((n, w) => n + w.photos.length, 0)

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TX, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, margin: 0 }}>
            Admin — Real Weddings
          </h1>
          <p style={{ color: T3, fontSize: 13, margin: '4px 0 0' }}>
            {loading ? '...' : `${weddings.length} matrimoni · ${totalPhotos} foto`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: 'rgba(201,160,90,0.15)', color: AMBER,
            fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 6,
            letterSpacing: '0.06em',
          }}>
            SOLO LOCALE
          </span>
          <a href="/" style={{ color: T2, fontSize: 13, textDecoration: 'none' }}>← Sito</a>
        </div>
      </div>

      {/* Status bar */}
      {status && (
        <div style={{
          margin: '16px 40px 0',
          padding: '12px 16px',
          borderRadius: 8,
          background: status.startsWith('✅') ? 'rgba(142,201,176,0.12)' : 'rgba(217,112,112,0.12)',
          color: status.startsWith('✅') ? AC : RED,
          fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{status}</span>
          {status.startsWith('✅') && (
            <code style={{ background: S2, padding: '2px 8px', borderRadius: 4, fontSize: 12, color: T2 }}>
              git push
            </code>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '32px 40px' }}>
        {loading ? (
          <p style={{ color: T3, fontSize: 14 }}>Caricamento...</p>
        ) : (
          weddings.map(w => (
            <section key={w.slug} style={{ marginBottom: 48 }}>
              {/* Wedding header */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                <h2 style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: 16, margin: 0, color: TX,
                }}>
                  {w.title}
                </h2>
                {w.location && (
                  <span style={{ color: T3, fontSize: 12 }}>{w.location}</span>
                )}
                {w.date && (
                  <span style={{ color: T3, fontSize: 12 }}>· {w.date}</span>
                )}
                <span style={{
                  marginLeft: 'auto', color: T3, fontSize: 12,
                }}>
                  {w.photos.length} foto
                </span>
              </div>

              {/* Photo grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8,
              }}>
                {w.photos.map(url => {
                  const isCover  = url === w.cover
                  const isDeleting = deleting === url
                  const filename = decodeURIComponent(url.split('/').pop() ?? url)
                  return (
                    <div
                      key={url}
                      style={{
                        position: 'relative',
                        aspectRatio: '2/3',
                        background: S2,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: isCover ? `2px solid ${AMBER}` : '2px solid transparent',
                        opacity: isDeleting ? 0.4 : 1,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={filename}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />

                      {/* Cover badge */}
                      {isCover && (
                        <span style={{
                          position: 'absolute', top: 6, left: 6,
                          background: AMBER, color: '#1a1612',
                          fontSize: 9, fontWeight: 700, padding: '2px 6px',
                          borderRadius: 4, letterSpacing: '0.06em',
                        }}>
                          COVER
                        </span>
                      )}

                      {/* Hover overlay with delete */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(17,18,16,0.7)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 6, opacity: 0,
                        transition: 'opacity 0.18s',
                      }}
                        className="photo-overlay"
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                      >
                        <p style={{
                          color: T2, fontSize: 10, textAlign: 'center',
                          padding: '0 8px', wordBreak: 'break-all', lineHeight: 1.4,
                          maxHeight: 40, overflow: 'hidden',
                        }}>
                          {filename}
                        </p>
                        <button
                          disabled={isDeleting}
                          onClick={() => setConfirm({ url, wedding: w.title })}
                          style={{
                            background: RED, color: '#fff',
                            border: 'none', borderRadius: 6,
                            fontSize: 12, fontWeight: 500,
                            padding: '6px 14px', cursor: 'pointer',
                          }}
                        >
                          {isDeleting ? '...' : 'Elimina'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}
          onClick={() => setConfirm(null)}
        >
          <div
            style={{
              background: S1, borderRadius: 12, padding: 28,
              width: 360, border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontFamily: "'Syne', sans-serif", fontSize: 16 }}>
              Elimina foto
            </h3>
            <p style={{ color: T2, fontSize: 13, marginBottom: 6 }}>
              {confirm.wedding}
            </p>
            <p style={{
              color: T3, fontSize: 11, wordBreak: 'break-all',
              background: S2, padding: '8px 10px', borderRadius: 6, marginBottom: 20,
            }}>
              {decodeURIComponent(confirm.url.split('/').pop() ?? confirm.url)}
            </p>
            <p style={{ color: RED, fontSize: 12, marginBottom: 20 }}>
              La foto verrà cancellata da R2 e rimossa da _data.ts.
              L&apos;operazione non è reversibile.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirm(null)}
                style={{
                  background: S3, color: T2, border: 'none',
                  borderRadius: 6, padding: '8px 18px',
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(confirm.url)}
                style={{
                  background: RED, color: '#fff', border: 'none',
                  borderRadius: 6, padding: '8px 18px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

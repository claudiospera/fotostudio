'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'

interface GalleryWithPhotos {
  id: string
  name: string
  type: string
  photo_count: number
  last_upload: string
  photos: { id: string; url: string; filename: string; size_bytes: number }[]
}

export default function UploadPage() {
  const [galleries, setGalleries] = useState<GalleryWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/galleries/with-photos')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGalleries(data) })
      .finally(() => setLoading(false))
  }, [])

  async function downloadZip(gallery: GalleryWithPhotos) {
    setDownloading(gallery.id)
    try {
      const res = await fetch('/api/galleries/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId: gallery.id }),
      })
      if (!res.ok) { alert('Errore download'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${gallery.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }

  function downloadSingle(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    a.click()
  }

  function formatSize(bytes: number) {
    if (!bytes) return ''
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
    return `${(bytes / 1_000).toFixed(0)} KB`
  }

  return (
    <>
      <Topbar title="Foto clienti" />
      <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

        {loading && (
          <p style={{ color: 'var(--t3)', fontSize: 14 }}>Caricamento…</p>
        )}

        {!loading && galleries.length === 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 200, background: 'var(--s1)',
            border: '1px solid var(--b1)', borderRadius: 'var(--r)',
          }}>
            <p style={{ color: 'var(--t3)', fontSize: 14 }}>Nessuna foto ricevuta dai clienti.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {galleries.map(g => (
            <div key={g.id} style={{
              background: 'var(--s1)', border: '1px solid var(--b1)',
              borderRadius: 'var(--r)', overflow: 'hidden',
            }}>
              {/* Header galleria */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', gap: 16,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)' }}>
                      {g.name}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px',
                      background: 'var(--acd)', color: 'var(--ac)',
                      borderRadius: 20,
                    }}>
                      {g.type}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--t3)' }}>
                    {g.photo_count} foto · ultima ricezione{' '}
                    {new Date(g.last_upload).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {/* Espandi/comprimi anteprime */}
                  <button
                    onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                    style={{
                      padding: '8px 14px', fontSize: 12, fontWeight: 600,
                      background: 'var(--s2)', color: 'var(--t2)',
                      border: '1px solid var(--b1)', borderRadius: 'var(--r2)',
                      cursor: 'pointer',
                    }}
                  >
                    {expanded === g.id ? 'Chiudi' : 'Vedi foto'}
                  </button>

                  {/* Scarica tutto ZIP */}
                  <button
                    onClick={() => downloadZip(g)}
                    disabled={downloading === g.id}
                    style={{
                      padding: '8px 16px', fontSize: 12, fontWeight: 700,
                      background: downloading === g.id ? 'var(--s3)' : 'var(--ac)',
                      color: downloading === g.id ? 'var(--t3)' : '#fff',
                      border: 'none', borderRadius: 'var(--r2)',
                      cursor: downloading === g.id ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {downloading === g.id ? (
                      <>⏳ Preparazione…</>
                    ) : (
                      <>⬇ Scarica tutto ({g.photo_count})</>
                    )}
                  </button>
                </div>
              </div>

              {/* Griglia anteprime foto */}
              {expanded === g.id && (
                <div style={{
                  padding: '0 20px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 8,
                }}>
                  {g.photos.map((photo, i) => (
                    <div
                      key={photo.id}
                      style={{ position: 'relative', cursor: 'pointer' }}
                      title={photo.filename || `Foto ${i + 1}`}
                      onClick={() => downloadSingle(photo.url, photo.filename || `foto-${i + 1}.jpg`)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        style={{
                          width: '100%', aspectRatio: '1',
                          objectFit: 'cover', borderRadius: 8,
                          display: 'block',
                        }}
                        loading="lazy"
                      />
                      {/* Overlay download */}
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 8,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                      >
                        <span style={{ fontSize: 22 }}>⬇</span>
                      </div>
                      {photo.size_bytes > 0 && (
                        <p style={{
                          margin: '4px 0 0', fontSize: 10,
                          color: 'var(--t3)', textAlign: 'center',
                        }}>
                          {formatSize(photo.size_bytes)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

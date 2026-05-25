'use client'

import { useState } from 'react'

interface Props {
  photos: string[]
}

export default function GalleryLightbox({ photos }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const prev = () => setLightbox(i => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  const next = () => setLightbox(i => (i !== null ? (i + 1) % photos.length : null))

  if (photos.length === 0) return null

  return (
    <section style={{ padding: '0 clamp(24px,5vw,64px)' }}>
      <style>{`
        @media (max-width: 700px)                    { .srv-masonry { column-count: 1 !important; } }
        @media (max-width: 960px) and (min-width: 701px) { .srv-masonry { column-count: 2 !important; } }
        .srv-photo { break-inside: avoid; margin-bottom: 8px; border-radius: 10px; overflow: hidden; cursor: pointer; display: block; }
        .srv-photo img { width: 100%; display: block; transition: transform .5s ease; }
        .srv-photo:hover img { transform: scale(1.03); }
      `}</style>

      <div className="srv-masonry" style={{ columnCount: 3, columnGap: 8 }}>
        {photos.map((src, idx) => (
          <div key={idx} className="srv-photo" onClick={() => setLightbox(idx)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Foto ${idx + 1}`} loading="lazy" />
          </div>
        ))}
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(10,8,6,0.94)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button onClick={e => { e.stopPropagation(); prev() }} style={{
            position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#fff', fontSize: 32,
            cursor: 'pointer', opacity: 0.7, padding: '12px 16px',
          }}>‹</button>

          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '90vh' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightbox]}
              alt=""
              style={{ maxWidth: '88vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>

          <button onClick={e => { e.stopPropagation(); next() }} style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#fff', fontSize: 32,
            cursor: 'pointer', opacity: 0.7, padding: '12px 16px',
          }}>›</button>

          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 20, right: 28,
            background: 'none', border: 'none', color: '#fff', fontSize: 22,
            cursor: 'pointer', opacity: 0.6, lineHeight: 1,
          }}>✕</button>

          <p style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 10, letterSpacing: '0.2em', color: '#fff', opacity: 0.4,
          }}>
            {lightbox + 1} / {photos.length}
          </p>
        </div>
      )}
    </section>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PublicNavbar } from '@/components/public/PublicNavbar'

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const BORDER = 'rgba(26,22,18,0.12)'
const R2     = 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev'
const BASE   = `${R2}/images/servizi/battesimi/gallery`

const PHOTOS = [
  'DSCF1629-1.jpg',  'DSCF1821-2.jpg',  'DSCF1932-3.jpg',  'DSCF1976-4.jpg',
  'DSCF2286-5.jpg',  'DSCF2293-6.jpg',  'DSCF2326-7.jpg',  'DSCF3378-8.jpg',
  'DSCF3389-9.jpg',  'DSCF3392-10.jpg', 'DSCF3403-11.jpg', 'DSCF3428-12.jpg',
  'DSCF3453-13.jpg', 'DSCF3472-14.jpg', 'DSCF3485-15.jpg', 'DSCF3516-16.jpg',
  'DSCF3538-17.jpg', 'DSCF3612-18.jpg', 'DSCF3642-19.jpg', 'DSCF3661-20.jpg',
  'DSCF3618.jpg',    'DSCF4927.jpg',    'DSCF4863.jpg',    'DSCF3473.jpg',
  'DSCF3906.jpg',    'DSCF4967.jpg',    'DSCF4989.jpg',    'DSCF4994.jpg',
  'DSCF4071.jpg',    'DSCF4072.jpg',    'DSCF4074.jpg',
  'DSCF2289.jpg',    'DSCF2326.jpg',    'DSCF2349.jpg',    'DSCF2365.jpg',
  '_DSF3520.jpg',    '_DSF3494.jpg',    'DSCF8123.jpg',    '_DSF3382.jpg',
  '_DSF8873-Modifica.jpg',
].map(n => `${BASE}/${n}`)

export default function BattesimiPage() {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const prev = () => setLightbox(i => (i !== null ? (i - 1 + PHOTOS.length) % PHOTOS.length : null))
  const next = () => setLightbox(i => (i !== null ? (i + 1) % PHOTOS.length : null))

  return (
    <div style={{ background: BG, minHeight: '100vh', color: INK }}>

      {/* ── NAV ── */}
      <PublicNavbar />

      {/* ── HEADER ── */}
      <section style={{
        paddingTop: 'clamp(100px,12vw,160px)',
        paddingLeft: 'clamp(24px,7vw,96px)',
        paddingRight: 'clamp(24px,5vw,64px)',
        paddingBottom: 'clamp(32px,4vw,56px)',
      }}>
        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: INK, opacity: 0.45, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Link href="/servizi" style={{ color: 'inherit', textDecoration: 'none' }}>Servizi</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/servizi/battesimi-prima-infanzia" style={{ color: 'inherit', textDecoration: 'none' }}>Battesimi, Compleanni e Feste</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Battesimi</span>
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(40px,5.5vw,72px)',
          color: INK, lineHeight: 1.05, letterSpacing: '-0.01em',
          marginBottom: 'clamp(40px,5vw,72px)',
        }}>
          Battesimi
        </h1>

        <style>{`
          @media (max-width: 700px)                         { .batt-masonry { column-count: 1 !important; } }
          @media (max-width: 960px) and (min-width: 701px)  { .batt-masonry { column-count: 2 !important; } }
          .batt-photo { break-inside: avoid; margin-bottom: 12px; border-radius: 10px; overflow: hidden; cursor: pointer; display: block; }
          .batt-photo img { width: 100%; display: block; transition: transform .5s ease; }
          .batt-photo:hover img { transform: scale(1.03); }
        `}</style>

        <div className="batt-masonry" style={{ columnCount: 3, columnGap: 12 }}>
          {PHOTOS.map((src, idx) => (
            <div key={idx} className="batt-photo" onClick={() => setLightbox(idx)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Battesimo foto ${idx + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(10,8,6,0.94)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <button onClick={e => { e.stopPropagation(); prev() }} style={{
            position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#fff', fontSize: 32,
            cursor: 'pointer', opacity: 0.7, padding: '12px 16px',
          }}>‹</button>

          <div onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PHOTOS[lightbox]} alt="" style={{ maxWidth: '88vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          </div>

          <button onClick={e => { e.stopPropagation(); next() }} style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#fff', fontSize: 32,
            cursor: 'pointer', opacity: 0.7, padding: '12px 16px',
          }}>›</button>

          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 20, right: 28,
            background: 'none', border: 'none', color: '#fff', fontSize: 22,
            cursor: 'pointer', opacity: 0.6,
          }}>✕</button>

          <p style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 10, letterSpacing: '0.2em', color: '#fff', opacity: 0.4,
          }}>
            {lightbox + 1} / {PHOTOS.length}
          </p>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        padding: '24px clamp(24px,5vw,64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK, opacity: 0.4 }}>
          &copy; {new Date().getFullYear()} Claudio Spera &middot; Fotografo
        </span>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK, opacity: 0.4 }}>
          Mirabella Eclano, Avellino
        </span>
      </footer>
    </div>
  )
}

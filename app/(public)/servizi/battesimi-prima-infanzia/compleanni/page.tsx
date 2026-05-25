'use client'

import { useState } from 'react'
import Link from 'next/link'

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const BORDER = 'rgba(26,22,18,0.12)'
const R2     = 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev'

const PHOTOS = [
  '1 anno Ginevra_01', '1 anno Ginevra_02', '1 anno Ginevra_03', '1 anno Ginevra_04',
  '1 anno Ginevra_05', '1 anno Ginevra_06', '1 anno Ginevra_07', '1 anno Ginevra_08',
  '1 anno Ginevra_09', '1 anno Ginevra_10', '1 anno Ginevra_11', '1 anno Ginevra_12',
  '1 anno Ginevra_13', '1 anno Ginevra_14', '1 anno Ginevra_15', '1 anno Ginevra_16',
  '1 anno Ginevra_17', '1 anno Ginevra_19', '1 anno Ginevra_20', '1 anno Ginevra_21',
  '1 anno Ginevra_22', '1 anno Ginevra_23', '1 anno Ginevra_24', '1 anno Ginevra_25',
  '1 anno Ginevra_26', '1 anno Ginevra_27', '1 anno Ginevra_28', '1 anno Ginevra_32',
].map(n => `${R2}/images/servizi/battesimi/compleanni/${encodeURIComponent(n)}.jpg`)

export default function CompleannPage() {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const prev = () => setLightbox(i => (i !== null ? (i - 1 + PHOTOS.length) % PHOTOS.length : null))
  const next = () => setLightbox(i => (i !== null ? (i + 1) % PHOTOS.length : null))

  return (
    <div style={{ background: BG, minHeight: '100vh', color: INK }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '22px clamp(24px,5vw,64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: BG, borderBottom: `1px solid ${BORDER}`,
      }}>
        <Link href="/" style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(15px,1.6vw,18px)',
          color: INK, textDecoration: 'none',
        }}>
          Claudio Spera · Fotografo
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(20px,3vw,40px)' }}>
          {['Servizi', 'Chi sono', 'Contatti'].map(label => (
            <Link key={label} href={`/${label.toLowerCase().replace(' ', '-')}`} style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: INK, textDecoration: 'none', opacity: 0.7,
            }}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

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
          <span>Compleanni</span>
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(40px,5.5vw,72px)',
          color: INK, lineHeight: 1.05, letterSpacing: '-0.01em',
          marginBottom: 'clamp(40px,5vw,72px)',
        }}>
          Compleanni
        </h1>

        {/* ── MASONRY ── */}
        <style>{`
          @media (max-width: 700px)                         { .compl-masonry { column-count: 1 !important; } }
          @media (max-width: 960px) and (min-width: 701px)  { .compl-masonry { column-count: 2 !important; } }
          .compl-photo { break-inside: avoid; margin-bottom: 12px; border-radius: 10px; overflow: hidden; cursor: pointer; display: block; }
          .compl-photo img { width: 100%; display: block; transition: transform .5s ease; }
          .compl-photo:hover img { transform: scale(1.03); }
        `}</style>

        <div className="compl-masonry" style={{ columnCount: 3, columnGap: 12 }}>
          {PHOTOS.map((src, idx) => (
            <div key={idx} className="compl-photo" onClick={() => setLightbox(idx)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Compleanno foto ${idx + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

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
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>
          &copy; {new Date().getFullYear()} Claudio Spera &middot; Fotografo
        </span>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>
          Mirabella Eclano, Avellino
        </span>
      </footer>
    </div>
  )
}

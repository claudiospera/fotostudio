'use client'

// app/(public)/galleria/matrimoni/portfolio/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// PER AGGIUNGERE FOTO:
//   1. Metti le immagini in: public/images/galleria/matrimoni/portfolio/
//   2. Aggiungi i percorsi nell'array PHOTOS qui sotto (es. '/images/galleria/matrimoni/portfolio/foto-01.jpg')
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link from 'next/link'

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const GOLD   = '#C9A96E'
const BORDER = 'rgba(26,22,18,0.12)'

const NAV_LINKS = [
  { label: 'Servizi Fotografici', href: '/servizi' },
  { label: 'Galleria',            href: '/galleria' },
  { label: 'Chi sono',            href: '/chi-sono' },
  { label: 'Contatti',            href: '/contatti' },
]

// ── Aggiungi qui i percorsi delle tue foto ─────────────────────────────────
const PHOTOS: string[] = [
  // '/images/galleria/matrimoni/portfolio/foto-01.jpg',
  // '/images/galleria/matrimoni/portfolio/foto-02.jpg',
  // '/images/galleria/matrimoni/portfolio/foto-03.jpg',
  // ...
]

export default function PortfolioPage() {
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
          color: INK, textDecoration: 'none', letterSpacing: '0.01em',
        }}>
          Claudio Spera · Fotografo
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(20px,3vw,40px)' }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={href} href={href} style={{
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
          color: GOLD, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Link href="/galleria" style={{ color: GOLD, textDecoration: 'none' }}>Galleria</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/galleria/matrimoni" style={{ color: GOLD, textDecoration: 'none' }}>Matrimoni</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Portfolio</span>
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(40px,5.5vw,72px)',
          color: INK, lineHeight: 1.05, letterSpacing: '-0.01em',
          marginBottom: 'clamp(12px,2vw,20px)',
        }}>
          Portfolio
        </h1>
        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 'clamp(12px,1.1vw,14px)', color: INK, opacity: 0.5,
          lineHeight: 1.8, marginBottom: 'clamp(40px,5vw,72px)',
        }}>
          Una selezione di scatti tratti da diversi matrimoni.
          {PHOTOS.length > 0 && ` — ${PHOTOS.length} foto`}
        </p>

        {/* ── GRIGLIA ── */}
        {PHOTOS.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 'clamp(64px,10vw,120px) 0',
            borderTop: `1px solid ${BORDER}`,
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(22px,2.5vw,30px)', color: INK, opacity: 0.35,
              marginBottom: 14,
            }}>
              Prossimamente
            </p>
            <p style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 12, color: INK, opacity: 0.35, letterSpacing: '0.1em',
            }}>
              Le foto saranno presto disponibili
            </p>
          </div>
        ) : (
          /* Masonry a 3 colonne via CSS columns */
          <div style={{
            columnCount: 3,
            columnGap: 12,
          }}>
            <style>{`
              @media (max-width: 700px) { .portfolio-masonry { column-count: 1 !important; } }
              @media (max-width: 960px) and (min-width: 701px) { .portfolio-masonry { column-count: 2 !important; } }
              .portfolio-photo { break-inside: avoid; margin-bottom: 12px; border-radius: 10px; overflow: hidden; cursor: pointer; display: block; }
              .portfolio-photo img { width: 100%; display: block; transition: transform .5s ease; }
              .portfolio-photo:hover img { transform: scale(1.03); }
            `}</style>
            <div className="portfolio-masonry" style={{ columnCount: 3, columnGap: 12 }}>
              {PHOTOS.map((src, idx) => (
                <div key={idx} className="portfolio-photo" onClick={() => setLightbox(idx)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Foto matrimonio ${idx + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && PHOTOS.length > 0 && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(10,8,6,0.94)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Freccia sinistra */}
          <button onClick={e => { e.stopPropagation(); prev() }} style={{
            position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#fff', fontSize: 32,
            cursor: 'pointer', opacity: 0.7, padding: '12px 16px',
          }}>‹</button>

          {/* Foto */}
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '90vh' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTOS[lightbox]}
              alt=""
              style={{ maxWidth: '88vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>

          {/* Freccia destra */}
          <button onClick={e => { e.stopPropagation(); next() }} style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#fff', fontSize: 32,
            cursor: 'pointer', opacity: 0.7, padding: '12px 16px',
          }}>›</button>

          {/* Chiudi */}
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 20, right: 28,
            background: 'none', border: 'none', color: '#fff', fontSize: 22,
            cursor: 'pointer', opacity: 0.6, lineHeight: 1,
          }}>✕</button>

          {/* Contatore */}
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
        padding: 'clamp(48px,6vw,80px) clamp(24px,7vw,96px) clamp(32px,4vw,48px)',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: INK, opacity: 0.45 }}>
          © {new Date().getFullYear()} Claudio Spera Fotografo
        </span>
        <Link href="/galleria/matrimoni" style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: INK, opacity: 0.5, textDecoration: 'none',
        }}>
          ← Torna ai Matrimoni
        </Link>
      </footer>

    </div>
  )
}

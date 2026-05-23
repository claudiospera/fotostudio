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

const BASE = '/images/galleria/matrimoni/portfolio'

const PHOTOS: string[] = [
  `${BASE}/_DSF0254.jpg`,
  `${BASE}/_DSF0291.jpg`,
  `${BASE}/_DSF2348.jpg`,
  `${BASE}/_DSF2480.jpg`,
  `${BASE}/_DSF2554.jpg`,
  `${BASE}/_DSF3955.jpg`,
  `${BASE}/_DSF3961.jpg`,
  `${BASE}/_DSF4264.jpg`,
  `${BASE}/_DSF426l4.jpg`,
  `${BASE}/_DSF6241.JPG`,
  `${BASE}/_DSF6255-Modifica.JPG`,
  `${BASE}/_DSF6436.JPG`,
  `${BASE}/_DSF6505.JPG`,
  `${BASE}/_DSF6508.JPG`,
  `${BASE}/_DSF7055-1.jpg`,
  `${BASE}/_DSF7075-1%2022x29.jpg`,
  `${BASE}/_DSF8055.jpg`,
  `${BASE}/_DSF8070.jpg`,
  `${BASE}/_DSF8101.jpg`,
  `${BASE}/_DSF8154.jpg`,
  `${BASE}/_DSF8161.jpg`,
  `${BASE}/_DSF8171.jpg`,
  `${BASE}/_DSF8530.jpg`,
  `${BASE}/_DSF9326.jpg`,
  `${BASE}/_DSF9922.jpg`,
  `${BASE}/_DSF9949.jpg`,
  `${BASE}/copertina.jpg`,
  `${BASE}/DJI_0634.jpg`,
  `${BASE}/DSC_3823h.jpg`,
  `${BASE}/DSCF0087.jpg`,
  `${BASE}/DSCF0146.jpg`,
  `${BASE}/DSCF0189.jpg`,
  `${BASE}/DSCF0209.jpg`,
  `${BASE}/DSCF0301.jpg`,
  `${BASE}/DSCF0350.jpg`,
  `${BASE}/DSCF0352.jpg`,
  `${BASE}/DSCF0442.jpg`,
  `${BASE}/DSCF0459.jpg`,
  `${BASE}/DSCF0473.jpg`,
  `${BASE}/DSCF0519.jpg`,
  `${BASE}/DSCF0543.jpg`,
  `${BASE}/DSCF0551.jpg`,
  `${BASE}/DSCF0569.jpg`,
  `${BASE}/DSCF0583.jpg`,
  `${BASE}/DSCF0701.jpg`,
  `${BASE}/DSCF0803.jpg`,
  `${BASE}/DSCF0803l.jpg`,
  `${BASE}/DSCF0911%2010.jpg`,
  `${BASE}/DSCF0959.jpg`,
  `${BASE}/DSCF1030.jpg`,
  `${BASE}/DSCF1050.jpg`,
  `${BASE}/DSCF1062.jpg`,
  `${BASE}/DSCF1361.jpg`,
  `${BASE}/DSCF1442.jpg`,
  `${BASE}/DSCF1636.jpg`,
  `${BASE}/DSCF1798.jpg`,
  `${BASE}/DSCF2086.jpg`,
  `${BASE}/DSCF2342.jpg`,
  `${BASE}/DSCF2422-Migliorato-NR.jpg`,
  `${BASE}/DSCF2439.jpg`,
  `${BASE}/DSCF2456.jpg`,
  `${BASE}/DSCF2557.jpg`,
  `${BASE}/DSCF2617.jpg`,
  `${BASE}/DSCF2635.jpg`,
  `${BASE}/DSCF2659.jpg`,
  `${BASE}/DSCF2674.jpg`,
  `${BASE}/DSCF2709.jpg`,
  `${BASE}/DSCF2753.jpg`,
  `${BASE}/DSCF2796.jpg`,
  `${BASE}/DSCF2799.jpg`,
  `${BASE}/DSCF2801.jpg`,
  `${BASE}/DSCF2825-Migliorato-NR.jpg`,
  `${BASE}/DSCF2944.jpg`,
  `${BASE}/DSCF3019.jpg`,
  `${BASE}/DSCF3033.jpg`,
  `${BASE}/DSCF3037.jpg`,
  `${BASE}/DSCF3215.jpg`,
  `${BASE}/DSCF3226.jpg`,
  `${BASE}/DSCF3248.jpg`,
  `${BASE}/DSCF3254.jpg`,
  `${BASE}/DSCF3347.jpg`,
  `${BASE}/DSCF3581.jpg`,
  `${BASE}/DSCF3600.jpg`,
  `${BASE}/DSCF3607.jpg`,
  `${BASE}/DSCF3609.jpg`,
  `${BASE}/DSCF3670-Migliorato-NR.jpg`,
  `${BASE}/DSCF4181.jpg`,
  `${BASE}/DSCF4196.jpg`,
  `${BASE}/DSCF4215.jpg`,
  `${BASE}/DSCF4269.jpg`,
  `${BASE}/DSCF4287.jpg`,
  `${BASE}/DSCF4384.jpg`,
  `${BASE}/DSCF4386.jpg`,
  `${BASE}/DSCF4413.jpg`,
  `${BASE}/DSCF4500.jpg`,
  `${BASE}/DSCF4582.jpg`,
  `${BASE}/DSCF4647.jpg`,
  `${BASE}/DSCF4817.jpg`,
  `${BASE}/DSCF4916.jpg`,
  `${BASE}/DSCF5455.jpg`,
  `${BASE}/DSCF5520-Migliorato-NR.jpg`,
  `${BASE}/DSCF5596.jpg`,
  `${BASE}/DSCF5624.jpg`,
  `${BASE}/DSCF5873.jpg`,
  `${BASE}/DSCF5962.jpg`,
  `${BASE}/DSCF6057.jpg`,
  `${BASE}/DSCF6210.jpg`,
  `${BASE}/DSCF6511.jpg`,
  `${BASE}/DSCF6542.jpg`,
  `${BASE}/DSCF6554.jpg`,
  `${BASE}/DSCF6564.jpg`,
  `${BASE}/DSCF6721g.jpg`,
  `${BASE}/DSCF6721gj.jpg`,
  `${BASE}/DSCF7204.jpg`,
  `${BASE}/DSCF7483.jpg`,
  `${BASE}/DSCF7490.jpg`,
  `${BASE}/DSCF7590.jpg`,
  `${BASE}/DSCF7797.jpg`,
  `${BASE}/DSCF8378.jpg`,
  `${BASE}/DSCF8478.jpg`,
  `${BASE}/DSCF8497.jpg`,
  `${BASE}/DSCF8500.jpg`,
  `${BASE}/DSCF8510.jpg`,
  `${BASE}/DSCF8725.jpg`,
  `${BASE}/DSCF8732.jpg`,
  `${BASE}/DSCF8748-2.jpg`,
  `${BASE}/DSCF8761.jpg`,
  `${BASE}/DSCF8769.jpg`,
  `${BASE}/DSCF8799.jpg`,
  `${BASE}/DSCF8834.jpg`,
  `${BASE}/DSCF8908l.jpg`,
  `${BASE}/DSCF8921-Modifica.jpg`,
  `${BASE}/DSCF9267.jpg`,
  `${BASE}/DSCF9287.jpg`,
  `${BASE}/DSCF928l7.jpg`,
  `${BASE}/DSCF9513.jpg`,
  `${BASE}/DSCF9538.jpg`,
  `${BASE}/DSCF9540.jpg`,
  `${BASE}/DSCF9551.jpg`,
  `${BASE}/DSCF9567.jpg`,
  `${BASE}/DSCF9581.jpg`,
  `${BASE}/DSCF9639.jpg`,
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

'use client'

// app/(public)/galleria/matrimoni/real-weddings/[slug]/page.tsx
// Galleria di un singolo matrimonio con lightbox

import { useState, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WEDDINGS } from '../_data'

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const GOLD   = '#C9A96E'
const BORDER = 'rgba(26,22,18,0.12)'

const NAV_LINKS = [
  { label: 'Servizi Fotografici', href: '/servizi' },
  { label: 'Chi sono',            href: '/chi-sono' },
  { label: 'Contatti',            href: '/contatti' },
]

export default function WeddingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const wedding = WEDDINGS.find(w => w.slug === slug)
  if (!wedding) notFound()

  const [lightbox, setLightbox] = useState<number | null>(null)
  const photos = wedding.photos

  const prev = () => setLightbox(i => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  const next = () => setLightbox(i => (i !== null ? (i + 1) % photos.length : null))

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
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <Link href="/galleria" style={{ color: GOLD, textDecoration: 'none' }}>Galleria</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/galleria/matrimoni" style={{ color: GOLD, textDecoration: 'none' }}>Matrimoni</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/galleria/matrimoni/real-weddings" style={{ color: GOLD, textDecoration: 'none' }}>Real Weddings</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{wedding.title}</span>
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(36px,5vw,68px)',
          color: INK, lineHeight: 1.05, letterSpacing: '-0.01em',
          marginBottom: 12,
        }}>
          {wedding.title}
        </h1>

        {(wedding.location || wedding.date) && (
          <p style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 12, color: INK, opacity: 0.5, letterSpacing: '0.1em',
            marginBottom: 'clamp(40px,5vw,72px)',
          }}>
            {[wedding.location, wedding.date].filter(Boolean).join(' · ')}
            {photos.length > 0 && ` — ${photos.length} foto`}
          </p>
        )}

        {/* ── GRIGLIA FOTO ── */}
        {photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'clamp(64px,10vw,120px) 0', borderTop: `1px solid ${BORDER}` }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(22px,2.5vw,30px)', color: INK, opacity: 0.35,
            }}>
              Prossimamente
            </p>
          </div>
        ) : (
          <>
            <style>{`
              @media (max-width: 600px)  { .wd-grid { grid-template-columns: 1fr !important; } }
              @media (max-width: 900px) and (min-width: 601px) { .wd-grid { grid-template-columns: repeat(2,1fr) !important; } }
              .wd-photo { border-radius: 10px; overflow: hidden; cursor: pointer; position: relative; }
              .wd-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s ease; }
              .wd-photo:hover img { transform: scale(1.04); }
            `}</style>

            {/* Prima foto grande (hero) */}
            <div
              className="wd-photo"
              onClick={() => setLightbox(0)}
              style={{ aspectRatio: '16/9', marginBottom: 8 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0]} alt={`${wedding.title} — 1`} />
            </div>

            {/* Griglia restanti */}
            {photos.length > 1 && (
              <div className="wd-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginTop: 0,
              }}>
                {photos.slice(1).map((src, idx) => (
                  <div
                    key={idx}
                    className="wd-photo"
                    onClick={() => setLightbox(idx + 1)}
                    style={{ aspectRatio: '1/1' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${wedding.title} — ${idx + 2}`} loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && photos.length > 0 && (
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

      {/* ── FOOTER ── */}
      <footer style={{
        padding: 'clamp(48px,6vw,80px) clamp(24px,7vw,96px) clamp(32px,4vw,48px)',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: INK, opacity: 0.45 }}>
          © {new Date().getFullYear()} Claudio Spera Fotografo
        </span>
        <Link href="/galleria/matrimoni/real-weddings" style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: INK, opacity: 0.5, textDecoration: 'none',
        }}>
          ← Real Weddings
        </Link>
      </footer>

    </div>
  )
}

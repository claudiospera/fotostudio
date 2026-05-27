'use client'

import { useState } from 'react'
import Link from 'next/link'

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const BORDER = 'rgba(26,22,18,0.12)'
const R2     = 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev'
const BASE   = `${R2}/images/servizi/shooting-studio/gallery`

const PHOTOS: string[] = [
  // Le foto verranno aggiunte qui
].map(n => `${BASE}/${n}`)

const TEMI = [
  { emoji: '🎄', titolo: 'Shooting Natalizio', desc: 'Atmosfere calde, luci soffuse e decorazioni natalizie per immortalare la magia del Natale con i tuoi bambini o la tua famiglia.' },
  { emoji: '🎭', titolo: 'Carnevale in Studio', desc: 'Maschere, colori e sorrisi — lo studio si trasforma per catturare tutta la vivacità e la fantasia del Carnevale.' },
  { emoji: '👶', titolo: 'Bambini & Famiglie', desc: 'Sessioni dedicate ai più piccoli e alle famiglie: luci professionali, sfondi neutri o scenografici, momenti autentici.' },
]

export default function ShootingStudioPage() {
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
        paddingBottom: 'clamp(48px,6vw,80px)',
      }}>
        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: INK, opacity: 0.45, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Link href="/servizi" style={{ color: 'inherit', textDecoration: 'none' }}>Servizi</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Shooting Studio</span>
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(40px,5.5vw,72px)',
          color: INK, lineHeight: 1.05, letterSpacing: '-0.01em',
          marginBottom: 'clamp(24px,3vw,40px)',
        }}>
          Shooting Studio
        </h1>

        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 'clamp(14px,1.2vw,16px)', color: INK, opacity: 0.65,
          lineHeight: 1.8, maxWidth: 600, marginBottom: 'clamp(40px,5vw,64px)',
        }}>
          Lo studio è il posto dove la luce si piega come vuoi tu. Sessioni dedicate ai bambini,
          alle famiglie e ai momenti speciali dell'anno — dal Natale al Carnevale — in un ambiente
          curato, rilassato e completamente pensato per mettere a loro agio grandi e piccini.
          Ogni shooting è unico: scenografie, colori e atmosfere cambiano in base alla stagione
          e alla storia che vuoi raccontare.
        </p>

        {/* Temi disponibili */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'clamp(16px,2vw,28px)',
          marginBottom: 'clamp(56px,7vw,96px)',
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 'clamp(32px,4vw,48px)',
        }}>
          {TEMI.map(t => (
            <div key={t.titolo} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{t.emoji}</span>
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic', fontWeight: 400,
                fontSize: 'clamp(16px,1.4vw,19px)', color: INK, lineHeight: 1.2,
              }}>{t.titolo}</div>
              <p style={{
                fontFamily: "'Jost', sans-serif", fontWeight: 300,
                fontSize: 13, color: INK, opacity: 0.6, lineHeight: 1.7, margin: 0,
              }}>{t.desc}</p>
            </div>
          ))}
        </div>

        {/* Galleria masonry */}
        {PHOTOS.length > 0 ? (
          <>
            <style>{`
              @media (max-width: 700px)                         { .studio-masonry { column-count: 1 !important; } }
              @media (max-width: 960px) and (min-width: 701px)  { .studio-masonry { column-count: 2 !important; } }
              .studio-photo { break-inside: avoid; margin-bottom: 12px; border-radius: 10px; overflow: hidden; cursor: pointer; display: block; }
              .studio-photo img { width: 100%; display: block; transition: transform .5s ease; }
              .studio-photo:hover img { transform: scale(1.03); }
            `}</style>

            <div className="studio-masonry" style={{ columnCount: 3, columnGap: 12 }}>
              {PHOTOS.map((src, idx) => (
                <div key={idx} className="studio-photo" onClick={() => setLightbox(idx)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Shooting Studio foto ${idx + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{
            border: `1px dashed ${BORDER}`,
            borderRadius: 12, padding: 'clamp(40px,6vw,80px) clamp(24px,5vw,64px)',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(18px,2vw,24px)', color: INK, opacity: 0.45, margin: 0,
            }}>
              Le foto della galleria sono in arrivo…
            </p>
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      <section style={{
        borderTop: `1px solid ${BORDER}`,
        padding: 'clamp(64px,8vw,112px) clamp(24px,5vw,64px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: INK, opacity: 0.5,
        }}>Prenota il tuo shooting</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(28px,3.5vw,44px)', color: INK, lineHeight: 1.15,
        }}>
          Un'ora in studio,<br/>ricordi per sempre
        </div>
        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 13, color: INK, opacity: 0.6,
          lineHeight: 1.7, maxWidth: 480, margin: '4px 0 16px',
        }}>
          Scrivimi per scoprire disponibilità, temi stagionali e pacchetti dedicati.
          Ogni sessione dura circa 1 ora e include la selezione e il ritocco delle immagini migliori.
        </p>
        <Link href="/contatti" style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          background: INK, color: BG, padding: '13px 32px',
          textDecoration: 'none', display: 'inline-block',
        }}>
          Contattami
        </Link>
      </section>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && PHOTOS.length > 0 && (
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

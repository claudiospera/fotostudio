// app/(public)/galleria/matrimoni/real-weddings/page.tsx
// Griglia dei Real Weddings — ogni card apre il matrimonio singolo

import Link from 'next/link'
import type { Metadata } from 'next'
import { WEDDINGS } from './_data'

export const metadata: Metadata = {
  title: 'Real Weddings — Matrimoni Reali — Claudio Spera Fotografo',
  description: 'Matrimoni reali raccontati foto per foto. Sfoglia i Real Weddings di Claudio Spera: ogni storia è unica, ogni coppia è diversa.',
  alternates: { canonical: 'https://storiedaraccontare.it/galleria/matrimoni/real-weddings' },
}

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const GOLD   = '#C9A96E'
const BORDER = 'rgba(26,22,18,0.12)'

const NAV_LINKS = [
  { label: 'Servizi Fotografici', href: '/servizi' },
  { label: 'Chi sono',            href: '/chi-sono' },
  { label: 'Contatti',            href: '/contatti' },
]

export default function RealWeddingsPage() {
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
          <span>Real Weddings</span>
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(40px,5.5vw,72px)',
          color: INK, lineHeight: 1.05, letterSpacing: '-0.01em',
          marginBottom: 'clamp(12px,2vw,20px)',
        }}>
          Real Weddings
        </h1>
        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 'clamp(12px,1.1vw,14px)', color: INK, opacity: 0.5,
          lineHeight: 1.8, marginBottom: 'clamp(40px,5vw,72px)',
        }}>
          Ogni matrimonio è una storia a sé. Esplora i servizi completi, foto per foto.
          {WEDDINGS.length > 0 && ` — ${WEDDINGS.length} ${WEDDINGS.length === 1 ? 'matrimonio' : 'matrimoni'}`}
        </p>

        {/* ── GRIGLIA ── */}
        {WEDDINGS.length === 0 ? (
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
              I matrimoni saranno presto disponibili
            </p>
          </div>
        ) : (
          <>
            <style>{`
              @media (max-width: 600px)  { .rw-grid { grid-template-columns: 1fr !important; } }
              @media (max-width: 900px) and (min-width: 601px) { .rw-grid { grid-template-columns: repeat(2,1fr) !important; } }
              .rw-card img { transition: transform .6s ease; }
              .rw-card:hover img { transform: scale(1.04); }
            `}</style>
            <div className="rw-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'clamp(16px,2.5vw,32px)',
            }}>
              {WEDDINGS.map(w => (
                <Link key={w.slug} href={`/galleria/matrimoni/real-weddings/${w.slug}`}
                  className="rw-card"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  {/* Cover */}
                  <div style={{
                    aspectRatio: '3/4',
                    background: 'rgba(26,22,18,0.07)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 16,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={w.cover}
                      alt={w.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  {/* Testi */}
                  {(w.location || w.date) && (
                    <p style={{
                      fontFamily: "'Jost', sans-serif", fontWeight: 300,
                      fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                      color: GOLD, marginBottom: 6,
                    }}>
                      {[w.location, w.date].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontStyle: 'italic', fontWeight: 400,
                    fontSize: 'clamp(18px,1.8vw,24px)',
                    color: INK, lineHeight: 1.2,
                  }}>
                    {w.title}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

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

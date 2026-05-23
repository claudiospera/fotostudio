// app/(public)/galleria/page.tsx

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Galleria — Claudio Spera Fotografo',
  description: 'Sfoglia la galleria fotografica di Claudio Spera: matrimoni, ritratti, famiglie e molto altro.',
}

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

const CATEGORIES = [
  {
    slug:        'matrimoni',
    label:       'Matrimoni',
    sub:         'Portfolio · Real Weddings',
    description: 'Dal primo sguardo all\'ultimo ballo — storie d\'amore raccontate con luce naturale.',
    cover:       '/images/galleria/matrimoni/cover.jpg',
  },
  // Aggiungi altre categorie qui quando vuoi:
  // { slug: 'ritratti', label: 'Ritratti', sub: '…', description: '…', cover: '…' },
]

export default function GalleriaPage() {
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
              fontFamily: "'Jost', sans-serif", fontWeight: href === '/galleria' ? 500 : 300,
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: INK, textDecoration: 'none',
              opacity: href === '/galleria' ? 1 : 0.7,
              borderBottom: href === '/galleria' ? `1px solid ${INK}` : 'none',
              paddingBottom: 2,
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
        paddingBottom: 'clamp(40px,6vw,80px)',
      }}>
        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase',
          color: GOLD, marginBottom: 20,
        }}>
          Galleria
        </p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(44px,6vw,80px)',
          color: INK, lineHeight: 1.05, letterSpacing: '-0.01em',
          marginBottom: 'clamp(48px,6vw,96px)',
        }}>
          Ogni foto è una storia
        </h1>

        {/* Categorie */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 'clamp(24px,4vw,48px)',
        }}>
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/galleria/${cat.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article style={{ cursor: 'pointer' }}>
                {/* Immagine */}
                <div style={{
                  aspectRatio: '4/5',
                  background: 'rgba(26,22,18,0.06)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginBottom: 20,
                  position: 'relative',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.cover}
                    alt={cat.label}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      transition: 'transform .6s ease',
                    }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(26,22,18,0)',
                    transition: 'background .3s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontFamily: "'Jost', sans-serif", fontWeight: 300,
                      fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
                      color: '#fff', opacity: 0, transition: 'opacity .3s',
                    }}>
                      Scopri
                    </span>
                  </div>
                </div>

                {/* Testi */}
                <p style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300,
                  fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: GOLD, marginBottom: 8,
                }}>
                  {cat.sub}
                </p>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic', fontWeight: 400,
                  fontSize: 'clamp(26px,2.5vw,34px)', color: INK,
                  marginBottom: 10, lineHeight: 1.1,
                }}>
                  {cat.label}
                </h2>
                <p style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300,
                  fontSize: 13, color: INK, opacity: 0.6, lineHeight: 1.7,
                }}>
                  {cat.description}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: 'clamp(32px,5vw,64px) clamp(24px,7vw,96px)',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: INK, opacity: 0.45 }}>
          © {new Date().getFullYear()} Claudio Spera Fotografo
        </span>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: INK, opacity: 0.45 }}>
          Mirabella Eclano, Campania
        </span>
      </footer>

    </div>
  )
}

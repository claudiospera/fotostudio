// app/(public)/galleria/matrimoni/page.tsx
// Landing matrimoni — due sezioni: Portfolio + Real Weddings

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Matrimoni — Claudio Spera Fotografo',
  description: 'Galleria matrimoni: Portfolio di scatti da vari eventi e Real Weddings, i singoli matrimoni raccontati foto per foto.',
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

export default function MatrimoniPage() {
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
        paddingBottom: 'clamp(32px,5vw,64px)',
      }}>
        {/* Breadcrumb */}
        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Link href="/galleria" style={{ color: GOLD, textDecoration: 'none' }}>Galleria</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Matrimoni</span>
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(44px,6vw,80px)',
          color: INK, lineHeight: 1.05, letterSpacing: '-0.01em',
          marginBottom: 'clamp(16px,3vw,28px)',
        }}>
          Matrimoni
        </h1>
        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 'clamp(13px,1.2vw,15px)', color: INK, opacity: 0.55,
          lineHeight: 1.8, maxWidth: 500,
          marginBottom: 'clamp(48px,7vw,100px)',
        }}>
          Dal primo sguardo all&apos;ultimo ballo. Sfoglia il portfolio o esplora i singoli matrimoni raccontati foto per foto.
        </p>

        {/* ── DUE CARD ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'clamp(24px,4vw,56px)',
          alignItems: 'end',
        }}>

          {/* ── Card Portfolio ── */}
          <Link href="/galleria/matrimoni/portfolio" style={{ textDecoration: 'none', color: 'inherit' }}>
            <article>
              <div style={{
                aspectRatio: '3/4',
                background: 'rgba(26,22,18,0.07)',
                borderRadius: 14,
                overflow: 'hidden',
                marginBottom: 22,
                position: 'relative',
                marginTop: 'clamp(40px,8vw,120px)',  // stagger: la card sinistra è più bassa
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev/images/galleria/matrimoni/portfolio-cover.jpg"
                  alt="Portfolio"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s ease' }}
                />
                {/* overlay hover */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(26,22,18,0.0)',
                  display: 'flex', alignItems: 'flex-end',
                  padding: '28px 24px',
                }} />
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic', fontWeight: 400,
                fontSize: 'clamp(24px,2.4vw,32px)',
                color: INK, letterSpacing: '0.01em',
              }}>
                Portfolio
              </p>
            </article>
          </Link>

          {/* ── Card Real Weddings ── */}
          <Link href="/galleria/matrimoni/real-weddings" style={{ textDecoration: 'none', color: 'inherit' }}>
            <article>
              <div style={{
                aspectRatio: '3/4',
                background: 'rgba(26,22,18,0.07)',
                borderRadius: 14,
                overflow: 'hidden',
                marginBottom: 22,
                position: 'relative',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev/images/galleria/matrimoni/real-weddings/stefano%20e%20teodora/036b.jpg"
                  alt="Real Weddings"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s ease' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(26,22,18,0.0)',
                  display: 'flex', alignItems: 'flex-end',
                  padding: '28px 24px',
                }} />
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic', fontWeight: 400,
                fontSize: 'clamp(24px,2.4vw,32px)',
                color: INK, letterSpacing: '0.01em',
              }}>
                Real Weddings
              </p>
            </article>
          </Link>

        </div>
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
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: INK, opacity: 0.45 }}>
          Mirabella Eclano, Campania
        </span>
      </footer>

    </div>
  )
}

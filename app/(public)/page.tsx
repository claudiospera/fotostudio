// app/(public)/page.tsx
// Home pubblica — storiedaraccontare.it

import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicNavbar } from '@/components/public/PublicNavbar'

export const metadata: Metadata = {
  title: 'Claudio Spera Fotografo — Storie da Raccontare',
  description: 'Fotografo di matrimoni, battesimi, comunioni, maternità e ritratti. Mirabella Eclano, Campania.',
}

const BG   = '#F5F0E8'
const INK  = '#1a1612'
const GOLD = '#C9A96E'
const SAGE = '#7D9B76'
const BORDER = 'rgba(26,22,18,0.12)'

const R2 = 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev'

const SERVIZI = [
  { n: '01', nome: 'Matrimoni',                 loc: 'Campania · e dintorni',   href: '/galleria/matrimoni',             cover: `${R2}/images/galleria/matrimoni/real-weddings/stefano%20e%20teodora/036b.jpg` },
  { n: '02', nome: 'Battesimi, Compleanni e Feste', loc: 'Studio · Esterno',    href: '/servizi/battesimi-prima-infanzia', cover: `${R2}/images/servizi/battesimi/cover.jpg` },
  { n: '03', nome: 'Comunioni & Cresime',        loc: 'Chiesa · Ricevimento',    href: '/servizi/comunioni-cresime',       cover: null },
  { n: '04', nome: 'Maternità & Gravidanza',     loc: 'Studio · Natura',         href: '/servizi/maternita-gravidanza',    cover: null },
  { n: '05', nome: '18 Anni',                    loc: 'Location · Esterno',      href: '/servizi/compleanni-feste',        cover: null },
  { n: '06', nome: 'Ritratti & Famiglie',        loc: 'Studio · Esterno',        href: '/servizi/ritratti-famiglie',       cover: null },
]

export default function HomePage() {
  return (
    <div style={{ background: BG, minHeight: '100vh', color: INK }}>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <PublicNavbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 'clamp(80px,8vw,110px)',
        paddingBottom: 0,
        paddingLeft: 'clamp(24px,5vw,64px)',
        paddingRight: 'clamp(24px,5vw,64px)',
        minHeight: '90vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          {/* Titolo hero */}
          <div style={{ lineHeight: 1.05 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(60px,8vw,110px)',
              color: INK,
            }}>
              Storie
            </div>
            <div style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: 'clamp(64px,8.5vw,112px)',
              color: INK, opacity: 0.65,
              lineHeight: 1,
            }}>
              vere
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(60px,8vw,110px)',
              color: INK,
            }}>
              da raccontare
            </div>
          </div>
        </div>

        {/* Bordo inferiore hero */}
        <div style={{
          marginTop: 'clamp(40px,6vw,80px)',
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 18,
          paddingBottom: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <span style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: INK, opacity: 0.55,
          }}>
            Mirabella Eclano · Campania
          </span>
          <Link href="/contatti" style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
            background: INK, color: BG,
            padding: '13px 32px',
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'opacity .2s',
          }}>
            Inizia la tua storia
          </Link>
        </div>
      </section>

      {/* ── SERVIZI ──────────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,8vw,112px) clamp(24px,5vw,64px)',
      }}>
        {/* Label */}
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: INK, opacity: 0.5,
          marginBottom: 'clamp(32px,4vw,56px)',
        }}>
          I miei servizi
        </div>

        {/* Griglia 3×2 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          border: `1px solid ${BORDER}`,
        }}>
          {SERVIZI.map((s, i) => (
            <Link
              key={s.nome}
              href={s.href}
              style={{
                display: 'block',
                borderRight: (i + 1) % 3 !== 0 ? `1px solid ${BORDER}` : 'none',
                borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none',
                textDecoration: 'none', color: INK,
                transition: 'opacity .25s',
              }}
              className="pub-service-card"
            >
              <div style={{ padding: 'clamp(20px,2.5vw,32px)' }}>
                {/* Numero */}
                <div style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300,
                  fontSize: 10, letterSpacing: '0.12em', color: INK, opacity: 0.35,
                  marginBottom: 10,
                }}>
                  {s.n}
                </div>

                {/* Immagine / placeholder */}
                <div style={{
                  aspectRatio: '3/2',
                  background: `rgba(26,22,18,0.06)`,
                  marginBottom: 18,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {s.cover && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.cover} alt={s.nome}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>

                {/* Nome */}
                <div style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic', fontWeight: 400,
                  fontSize: 'clamp(17px,1.6vw,21px)',
                  color: INK, marginBottom: 8, lineHeight: 1.2,
                }}>
                  {s.nome}
                </div>

                {/* Luogo */}
                <div style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300,
                  fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: INK, opacity: 0.45,
                }}>
                  {s.loc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA FINALE ───────────────────────────────────────────────────────── */}
      <section style={{
        borderTop: `1px solid ${BORDER}`,
        padding: 'clamp(72px,10vw,128px) clamp(24px,5vw,64px)',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(36px,5vw,56px)',
          color: INK, lineHeight: 1.1,
        }}>
          La tua storia
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(20px,2.5vw,28px)',
          color: INK, opacity: 0.6,
        }}>
          merita di essere raccontata
        </div>
        <Link href="/contatti" style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          background: INK, color: BG,
          padding: '14px 36px', marginTop: 16,
          textDecoration: 'none',
          display: 'inline-block',
          transition: 'opacity .2s',
        }}>
          Scrivimi
        </Link>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
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
          © {new Date().getFullYear()} Claudio Spera · Fotografo
        </span>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>
          Mirabella Eclano, Avellino
        </span>
      </footer>

      <style>{`
        .pub-service-card:hover { opacity: 0.65; }
        @media (max-width: 700px) {
          div[style*='gridTemplateColumns: repeat(3'] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 960px) and (min-width: 701px) {
          div[style*='gridTemplateColumns: repeat(3'] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}

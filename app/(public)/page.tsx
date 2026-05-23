// app/(public)/page.tsx
// Home pubblica — storiedaraccontare.it

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Claudio Spera Fotografo — Storie da Raccontare',
  description: 'Fotografo di matrimoni, battesimi, comunioni, maternità e ritratti. Mirabella Eclano, Campania.',
}

const BG   = '#F5F0E8'
const INK  = '#1a1612'
const GOLD = '#C9A96E'
const SAGE = '#7D9B76'
const BORDER = 'rgba(26,22,18,0.12)'

const SERVIZI = [
  { n: '01', nome: 'Matrimoni',                 loc: 'Campania · e dintorni',   slug: 'matrimoni' },
  { n: '02', nome: 'Battesimi & Prima infanzia', loc: 'Studio · Esterno',        slug: 'battesimi-prima-infanzia' },
  { n: '03', nome: 'Comunioni & Cresime',        loc: 'Chiesa · Ricevimento',    slug: 'comunioni-cresime' },
  { n: '04', nome: 'Maternità & Gravidanza',     loc: 'Studio · Natura',         slug: 'maternita-gravidanza' },
  { n: '05', nome: 'Compleanni & Feste',         loc: 'Location · Esterno',      slug: 'compleanni-feste' },
  { n: '06', nome: 'Ritratti & Famiglie',        loc: 'Studio · Esterno',        slug: 'ritratti-famiglie' },
]

export default function HomePage() {
  return (
    <div style={{ background: BG, minHeight: '100vh', color: INK }}>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '22px clamp(24px,5vw,64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: BG,
        borderBottom: `1px solid ${BORDER}`,
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
          {['Servizi', 'Galleria', 'Chi sono', 'Contatti'].map(label => (
            <Link key={label} href={`/${label.toLowerCase().replace(' ', '-')}`} style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: INK, textDecoration: 'none', opacity: 0.7,
              transition: 'opacity .2s',
            }}
              onMouseEnter={undefined}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap');`}</style>
      <section style={{
        paddingTop: 'clamp(120px,14vw,180px)',
        paddingBottom: 0,
        paddingLeft: 'clamp(24px,7vw,96px)',
        paddingRight: 'clamp(24px,5vw,64px)',
        minHeight: '90vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div>
          {/* Titolo hero */}
          <div style={{ lineHeight: 1.05 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(68px,9vw,118px)',
              color: INK,
            }}>
              Storie
            </div>
            <div style={{
              fontFamily: "'Pinyon Script', cursive",
              fontSize: 'clamp(72px,10vw,128px)',
              color: INK, opacity: 0.75,
              lineHeight: 1,
              marginLeft: '4px',
            }}>
              vere
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(68px,9vw,118px)',
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
              key={s.slug}
              href={`/servizi/${s.slug}`}
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

                {/* Placeholder immagine */}
                <div style={{
                  aspectRatio: '3/2',
                  background: `rgba(26,22,18,0.06)`,
                  marginBottom: 18,
                }} />

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

// app/(public)/chi-sono/page.tsx
// Pagina /chi-sono — bio editoriale di Claudio Spera

import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chi sono — Claudio Spera Fotografo',
  description: 'Sono Claudio Spera, fotografo professionista di matrimoni, ritratti e famiglie a Mirabella Eclano, Campania. Racconto storie vere attraverso la fotografia.',
}

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const GOLD   = '#C9A96E'
const BORDER = 'rgba(26,22,18,0.12)'

export default function ChiSonoPage() {
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
          {[
            { label: 'Servizi Fotografici', href: '/servizi' },
            { label: 'Chi sono',            href: '/chi-sono' },
            { label: 'Contatti',            href: '/contatti' },
          ].map(({ label, href }) => (
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

      {/* ── HERO — foto grande + titolo ── */}
      <section style={{
        paddingTop: 'clamp(96px,12vw,160px)',
        paddingLeft: 'clamp(24px,7vw,96px)',
        paddingRight: 'clamp(24px,5vw,64px)',
        paddingBottom: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(32px,5vw,80px)',
        alignItems: 'end',
        minHeight: '85vh',
      }}
      className="chi-hero"
      >
        {/* colonna testo */}
        <div style={{ paddingBottom: 'clamp(32px,5vw,64px)' }}>
          <div style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: INK, opacity: 0.5, marginBottom: 'clamp(16px,2vw,28px)',
          }}>Fotografo</div>

          <div style={{ lineHeight: 1.05, marginBottom: 'clamp(28px,4vw,48px)' }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(52px,7vw,96px)', color: INK,
            }}>Claudio</div>
            <div style={{
              fontFamily: "'Wedding', cursive",
              fontSize: 'clamp(44px,6vw,82px)',
              color: INK, opacity: 0.8, lineHeight: 1,
            }}>Spera</div>
          </div>

          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontWeight: 400,
            fontSize: 'clamp(18px,2vw,24px)',
            color: INK, opacity: 0.65,
            lineHeight: 1.55,
            maxWidth: 420,
            margin: '0 0 clamp(32px,4vw,56px)',
          }}>
            Racconto storie vere attraverso la fotografia.<br />
            Mirabella Eclano, Campania.
          </p>

          <Link href="/contatti" style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
            background: INK, color: BG, padding: '13px 32px',
            textDecoration: 'none', display: 'inline-block',
          }}>Scrivimi</Link>
        </div>

        {/* colonna foto */}
        <div style={{
          position: 'relative',
          aspectRatio: '3/4',
          overflow: 'hidden',
          alignSelf: 'stretch',
          maxHeight: '75vh',
        }}>
          <Image
            src="/images/claudio/hf_20260507_143616_e5667b0b-64ac-4f5a-9147-2342e8199862.png"
            alt="Claudio Spera — Fotografo"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            priority
          />
        </div>
      </section>

      {/* ── BIO ── */}
      <section style={{
        padding: 'clamp(80px,10vw,128px) clamp(24px,7vw,96px)',
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: 'clamp(40px,6vw,96px)',
        borderTop: `1px solid ${BORDER}`,
      }}
      className="chi-bio"
      >
        {/* etichetta sinistra */}
        <div>
          <div style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: INK, opacity: 0.5,
          }}>La mia storia</div>
        </div>

        {/* testo bio */}
        <div>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontWeight: 400,
            fontSize: 'clamp(22px,2.4vw,30px)',
            color: INK,
            lineHeight: 1.55,
            margin: '0 0 clamp(24px,3vw,40px)',
          }}>
            Sono fotografo professionista specializzato in matrimoni, ritratti e
            fotografia di famiglia. Ogni servizio è per me un'opportunità di
            fermare nel tempo un'emozione autentica, un'espressione vera,
            un momento che non tornerà.
          </p>

          <p style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 'clamp(14px,1.3vw,16px)',
            color: INK, opacity: 0.7,
            lineHeight: 1.85,
            margin: '0 0 clamp(20px,2.5vw,32px)',
          }}>
            Lavoro principalmente in Campania — tra le colline dell'Irpinia,
            le location romantiche del Sannio e le coste del Cilento —
            ma sono sempre disponibile a seguire i miei sposi ovunque la loro
            storia li porti.
          </p>

          <p style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 'clamp(14px,1.3vw,16px)',
            color: INK, opacity: 0.7,
            lineHeight: 1.85,
            margin: '0 0 clamp(20px,2.5vw,32px)',
          }}>
            Il mio stile è documentaristico ed emozionale: cerco la luce
            naturale, i sorrisi spontanei, gli sguardi complici. Non costruisco
            scene, le accompagno. La mia fotocamera è discreta quanto basta
            per non disturbare il momento, presente quanto serve per non
            perderne nemmeno uno.
          </p>

          <p style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 'clamp(14px,1.3vw,16px)',
            color: INK, opacity: 0.7,
            lineHeight: 1.85,
            margin: 0,
          }}>
            Oltre agli album digitali consegno stampe fine-art su tela e
            carta Hahnemühle, composizioni da parete e gadget personalizzati
            — perché le storie belle meritano di stare fuori dal telefono.
          </p>
        </div>
      </section>

      {/* ── NUMERI ── */}
      <section style={{
        borderTop: `1px solid ${BORDER}`,
        padding: 'clamp(56px,7vw,96px) clamp(24px,7vw,96px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
        background: BORDER,
      }}
      className="chi-numeri"
      >
        {[
          { n: '10+',  label: 'anni di esperienza' },
          { n: '200+', label: 'matrimoni raccontati' },
          { n: '∞',    label: 'storie ancora da vivere' },
        ].map(({ n, label }) => (
          <div key={label} style={{
            background: BG,
            padding: 'clamp(32px,4vw,56px) clamp(24px,3vw,40px)',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(48px,5vw,72px)', color: INK, lineHeight: 1,
              marginBottom: 10,
            }}>{n}</div>
            <div style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: INK, opacity: 0.5,
            }}>{label}</div>
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section style={{
        borderTop: `1px solid ${BORDER}`,
        padding: 'clamp(72px,10vw,128px) clamp(24px,5vw,64px)',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: INK, opacity: 0.5,
        }}>Posso esserti d&apos;aiuto?</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(32px,4.5vw,52px)', color: INK, lineHeight: 1.1,
        }}>Raccontami la tua storia</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(16px,2vw,22px)', color: INK, opacity: 0.6,
        }}>Rispondo entro 24 ore</div>
        <Link href="/contatti" style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          background: INK, color: BG, padding: '14px 36px', marginTop: 16,
          textDecoration: 'none', display: 'inline-block',
        }}>Scrivimi</Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        padding: '28px clamp(24px,5vw,64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>© {new Date().getFullYear()} Claudio Spera · Fotografo</span>

        {/* social icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a
            href="https://www.facebook.com/claudiosperafotografo/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            style={{ color: INK, opacity: 0.45, display: 'flex', transition: 'opacity .2s' }}
            className="chi-social"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
          </a>
          <a
            href="https://www.instagram.com/claudiosperafotografo/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            style={{ color: INK, opacity: 0.45, display: 'flex', transition: 'opacity .2s' }}
            className="chi-social"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
        </div>

        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>Mirabella Eclano, Avellino</span>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .chi-hero { grid-template-columns: 1fr !important; }
          .chi-hero > div:last-child { max-height: 60vw !important; min-height: 280px; }
          .chi-bio { grid-template-columns: 1fr !important; }
          .chi-numeri { grid-template-columns: 1fr !important; }
        }
        .chi-social:hover { opacity: 0.85 !important; }
      `}</style>
    </div>
  )
}

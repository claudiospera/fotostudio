// app/link/page.tsx
// Biosite mobile-first per "Storie da Raccontare"

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Storie da Raccontare — Fotografo Mirabella Eclano',
  description: 'Matrimoni, ritratti e maternità a Mirabella Eclano. Raccontiamo la tua storia attraverso immagini che durano per sempre.',
}

const SAGE    = '#7d9b76'
const SAGE_DK = '#6a8763'
const BG      = '#f8f5f0'
const CARD_BG = '#ffffff'
const INK     = '#2c2825'
const MUTED   = '#7a726b'
const BORDER  = 'rgba(44,40,37,0.10)'

const LINKS = [
  {
    emoji: '🌐',
    label: 'Visita il sito',
    href: 'https://storiedaraccontare.it',
    external: true,
  },
  {
    emoji: '📸',
    label: 'Servizi fotografici',
    href: '/servizi',
    external: false,
  },
  {
    emoji: '🛍️',
    label: 'Shop',
    href: '/shop',
    external: false,
  },
  {
    emoji: '📅',
    label: 'Prenota una sessione',
    href: '/contatti',
    external: false,
  },
  {
    emoji: '💬',
    label: 'Scrivimi su WhatsApp',
    href: 'https://wa.me/393897855581',
    external: true,
  },
  {
    emoji: '✉️',
    label: 'Scrivimi una mail',
    href: 'mailto:info@claudiospera.com',
    external: true,
  },
]

export default function LinkPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: ${BG}; }

        .lk-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 16px 24px;
          background: ${CARD_BG};
          border: 1px solid ${BORDER};
          border-radius: 50px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: ${INK};
          text-decoration: none;
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
          cursor: pointer;
        }
        .lk-btn:hover {
          background: ${SAGE};
          border-color: ${SAGE};
          color: #ffffff;
          transform: translateY(-1px);
        }
        .lk-btn:active {
          transform: translateY(0);
        }
        .lk-btn-emoji {
          font-size: 18px;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
        }
      `}</style>

      <main style={{
        minHeight: '100dvh',
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 20px 32px',
        fontFamily: "'Inter', sans-serif",
      }}>

        {/* ── CARD ── */}
        <div style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}>

          {/* Avatar */}
          <div style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `3px solid ${SAGE}`,
            marginBottom: 20,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Storie da Raccontare"
              width={96}
              height={96}
              style={{ width: '90%', height: '90%', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Nome */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 600,
            fontSize: 'clamp(22px, 5vw, 26px)',
            color: INK,
            letterSpacing: '-0.01em',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Storie da Raccontare
          </h1>

          {/* Sottotitolo */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: 13,
            color: SAGE_DK,
            letterSpacing: '0.04em',
            textAlign: 'center',
            marginBottom: 14,
          }}>
            Fotografo Mirabella Eclano · Matrimoni · Ritratti · Maternità
          </p>

          {/* Bio */}
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            color: MUTED,
            textAlign: 'center',
            lineHeight: 1.65,
            marginBottom: 36,
            maxWidth: 340,
          }}>
            Raccontiamo la tua storia attraverso immagini che durano per sempre.
          </p>

          {/* Separatore */}
          <div style={{
            width: 40,
            height: 1,
            background: SAGE,
            opacity: 0.4,
            marginBottom: 32,
          }} />

          {/* Bottoni */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {LINKS.map(({ emoji, label, href, external }) => (
              <a
                key={href}
                href={href}
                className="lk-btn"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className="lk-btn-emoji">{emoji}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>

        </div>

        {/* ── FOOTER ── */}
        <footer style={{
          marginTop: 'auto',
          paddingTop: 48,
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: 11,
            color: MUTED,
            opacity: 0.6,
            letterSpacing: '0.05em',
          }}>
            © {new Date().getFullYear()} Storie da Raccontare · Claudio Spera
          </p>
        </footer>

      </main>
    </>
  )
}

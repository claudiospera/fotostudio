// app/(public)/servizi/page.tsx
// Pagina /servizi — lista editoriale dei servizi

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Servizi Fotografici — Claudio Spera Fotografo',
  description: 'Matrimoni, battesimi, comunioni, maternità, compleanni e ritratti. Scopri tutti i servizi fotografici di Claudio Spera a Mirabella Eclano, Campania.',
}

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const BORDER = 'rgba(26,22,18,0.12)'
const R2     = 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev'

const SERVIZI = [
  { n: '01', nome: 'Matrimoni',                 loc: 'Campania · e dintorni',   href: '/galleria/matrimoni',              cover: `${R2}/images/galleria/matrimoni/real-weddings/stefano%20e%20teodora/036b.jpg` },
  { n: '02', nome: 'Battesimi & Prima infanzia', loc: 'Studio · Esterno',        href: '/servizi/battesimi-prima-infanzia', cover: null },
  { n: '03', nome: 'Comunioni & Cresime',        loc: 'Chiesa · Ricevimento',    href: '/servizi/comunioni-cresime',        cover: null },
  { n: '04', nome: 'Maternita & Gravidanza',     loc: 'Studio · Natura',         href: '/servizi/maternita-gravidanza',     cover: null },
  { n: '05', nome: 'Compleanni & Feste',         loc: 'Location · Esterno',      href: '/servizi/compleanni-feste',         cover: null },
  { n: '06', nome: 'Ritratti & Famiglie',        loc: 'Studio · Esterno',        href: '/servizi/ritratti-famiglie',        cover: null },
]

export default function ServiziPage() {
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
            { label: 'Chi sono',  href: '/chi-sono' },
            { label: 'Contatti',  href: '/contatti' },
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

      {/* ── HERO ── */}
      <section style={{
        paddingTop: 'clamp(80px,8vw,110px)',
        paddingBottom: 0,
        paddingLeft: 'clamp(24px,5vw,64px)',
        paddingRight: 'clamp(24px,5vw,64px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ lineHeight: 1.05 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(60px,8vw,110px)', color: INK,
            }}>Storie</div>
            <div style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: 'clamp(64px,8.5vw,112px)',
              color: INK, opacity: 0.65, lineHeight: 1,
            }}>vere</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(60px,8vw,110px)', color: INK,
            }}>da raccontare</div>
          </div>
        </div>

        <div style={{
          marginTop: 'clamp(40px,6vw,80px)',
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 18, paddingBottom: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <span style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: INK, opacity: 0.55,
          }}>Mirabella Eclano · Campania</span>
          <Link href="/contatti" style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
            background: INK, color: BG, padding: '13px 32px',
            textDecoration: 'none', display: 'inline-block',
          }}>Inizia la tua storia</Link>
        </div>
      </section>

      {/* ── GRIGLIA SERVIZI ── */}
      <section style={{ padding: 'clamp(64px,8vw,112px) clamp(24px,5vw,64px)' }}>
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: INK, opacity: 0.5, marginBottom: 'clamp(32px,4vw,56px)',
        }}>I miei servizi</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1px solid ${BORDER}` }}>
          {SERVIZI.map((s, i) => (
            <Link key={s.nome} href={s.href}
              style={{
                display: 'block',
                borderRight: (i + 1) % 3 !== 0 ? `1px solid ${BORDER}` : 'none',
                borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none',
                textDecoration: 'none', color: INK, transition: 'opacity .25s',
              }}
              className="pub-service-card"
            >
              <div style={{ padding: 'clamp(20px,2.5vw,32px)' }}>
                <div style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300,
                  fontSize: 10, letterSpacing: '0.12em', color: INK, opacity: 0.35, marginBottom: 10,
                }}>{s.n}</div>
                <div style={{
                  aspectRatio: '3/2', background: 'rgba(26,22,18,0.06)', marginBottom: 18,
                  overflow: 'hidden', position: 'relative',
                }}>
                  {s.cover && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.cover} alt={s.nome}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: 'italic', fontWeight: 400,
                  fontSize: 'clamp(17px,1.6vw,21px)', color: INK, marginBottom: 8, lineHeight: 1.2,
                }}>{s.nome}</div>
                <div style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300,
                  fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: INK, opacity: 0.45,
                }}>{s.loc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── VIDEO YOUTUBE ── */}
      <section style={{
        borderTop: `1px solid ${BORDER}`,
        padding: 'clamp(64px,8vw,112px) clamp(24px,5vw,64px)',
      }}>
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: INK, opacity: 0.5, marginBottom: 8,
        }}>I miei video</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(32px,4vw,52px)', color: INK,
          marginBottom: 'clamp(32px,4vw,56px)', lineHeight: 1.1,
        }}>Storie in movimento</div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(12px,2vw,24px)',
        }} className="yt-grid">
          {[
            'bDfScTRhpF4',
            '7DqSmrzF_1Y',
            'OXJ7zhnbk3E',
            'LK8Jfbwlvoo',
            'zOSsRKT0e-I',
            '3ipNuTJeEDw',
            'SyZns9Hh2j8',
          ].map(id => (
            <div key={id} style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${id}`}
                title={`Video ${id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  border: 'none',
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'clamp(32px,4vw,48px)', textAlign: 'center' }}>
          <a
            href="https://www.claudiospera.com/video"
            target="_blank" rel="noopener noreferrer"
            style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
              background: INK, color: '#F5F0E8', padding: '13px 32px',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Vedi tutti i video
          </a>
        </div>
      </section>

      {/* ── REEL INSTAGRAM ── */}
      <section style={{
        borderTop: `1px solid ${BORDER}`,
        padding: 'clamp(64px,8vw,112px) clamp(24px,5vw,64px)',
        display: 'flex', flexDirection: 'column', gap: 'clamp(32px,4vw,56px)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: INK, opacity: 0.5, marginBottom: 8,
            }}>Reel &amp; Stories</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(32px,4vw,52px)', color: INK, lineHeight: 1.1,
            }}>Momenti in verticale</div>
          </div>
          <a
            href="https://www.instagram.com/claudiosperafotografo/"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: INK, textDecoration: 'none', opacity: 0.7,
              border: `1px solid ${BORDER}`, padding: '12px 24px',
              transition: 'opacity .2s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            @claudiosperafotografo
          </a>
        </div>

        {/* Griglia card verticali */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'clamp(10px,1.5vw,20px)',
        }} className="reel-grid">
          {[1,2,3,4].map(i => (
            <a
              key={i}
              href="https://www.instagram.com/claudiosperafotografo/reels/"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', textDecoration: 'none',
                aspectRatio: '9/16',
                background: 'rgba(26,22,18,0.06)',
                position: 'relative', overflow: 'hidden',
              }}
              className="reel-card"
            >
              {/* Overlay hover */}
              <div className="reel-overlay" style={{
                position: 'absolute', inset: 0,
                background: 'rgba(26,22,18,0.45)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: 0, transition: 'opacity .25s',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300,
                  fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: '#fff',
                }}>Vedi su Instagram</span>
              </div>
              {/* Icona play statica */}
              <div style={{
                position: 'absolute', bottom: 12, left: 12,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(26,22,18,0.4)" strokeWidth="1.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* CTA principale */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 12, color: INK, opacity: 0.55,
            marginBottom: 20, lineHeight: 1.7,
          }}>
            I miei reel raccontano momenti veri — dietro le quinte, atmosfere, emozioni.<br/>
            Seguimi su Instagram per non perderne nessuno.
          </p>
          <a
            href="https://www.instagram.com/claudiosperafotografo/reels/"
            target="_blank" rel="noopener noreferrer"
            style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
              background: INK, color: '#F5F0E8', padding: '13px 32px',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Guarda i Reel
          </a>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        borderTop: `1px solid ${BORDER}`,
        padding: 'clamp(72px,10vw,128px) clamp(24px,5vw,64px)',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(36px,5vw,56px)', color: INK, lineHeight: 1.1,
        }}>La tua storia</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(20px,2.5vw,28px)', color: INK, opacity: 0.6,
        }}>merita di essere raccontata</div>
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
        padding: '24px clamp(24px,5vw,64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>© {new Date().getFullYear()} Claudio Spera · Fotografo</span>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>Mirabella Eclano, Avellino</span>
      </footer>

      <style>{`
        .pub-service-card:hover { opacity: 0.65; }
        .reel-card:hover .reel-overlay { opacity: 1 !important; }
        @media (max-width: 700px) {
          div[style*='repeat(3, 1fr)'] { grid-template-columns: 1fr !important; }
          .yt-grid { grid-template-columns: 1fr !important; }
          .reel-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 960px) and (min-width: 701px) {
          div[style*='repeat(3, 1fr)'] { grid-template-columns: repeat(2, 1fr) !important; }
          .yt-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

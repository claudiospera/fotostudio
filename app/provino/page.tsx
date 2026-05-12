import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Provino — Selezione rapida foto RAW | Storie da Raccontare',
  description: 'Provino è l\'app desktop per Mac che ti permette di selezionare rapidamente le migliori foto RAW e JPEG del tuo set fotografico.',
}

export default function ProvinoPage() {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--tx)', background: '#0f0f0d', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 clamp(20px, 5vw, 60px)',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,15,13,.9)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 6, padding: '3px 8px' }}>
              <Image src="/logo.png" alt="Storie da Raccontare" width={80} height={36} style={{ objectFit: 'contain', display: 'block' }} />
            </div>
          </Link>
          <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 16 }}>/</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/provino-logo.png" alt="Provino" width={24} height={24} style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>Provino</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#funzionalita" style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none', padding: '6px 12px' }}>Funzionalità</a>
          <a href="#come-funziona" style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none', padding: '6px 12px' }}>Come funziona</a>
          <a href="#download" style={{
            fontSize: 12, fontWeight: 600, color: '#fff',
            background: '#7cb9a0', border: 'none',
            borderRadius: 40, padding: '8px 20px',
            textDecoration: 'none', marginLeft: 8,
          }}>Scarica gratis</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        gap: 48,
        padding: 'clamp(100px,12vw,140px) clamp(24px,7vw,80px) 60px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '30%',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(124,185,160,.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
            textTransform: 'uppercase',
            background: 'rgba(124,185,160,.12)',
            color: '#7cb9a0',
            padding: '6px 14px', borderRadius: 40,
            width: 'fit-content',
            border: '1px solid rgba(124,185,160,.2)',
          }}>
            ✦ App desktop per Mac · Gratis
          </div>

          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            Seleziona le tue<br />
            <span style={{ color: '#7cb9a0' }}>migliori foto</span><br />
            in pochi secondi.
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, maxWidth: 460 }}>
            Provino è il tool più rapido per fare il culling di un set fotografico —
            sfoglia, valuta e organizza file RAW e JPEG direttamente dal tuo Mac,
            senza rallentamenti.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#download" style={{
              padding: '14px 32px', borderRadius: 40,
              background: '#7cb9a0', color: '#fff',
              fontWeight: 700, fontSize: 14, textDecoration: 'none',
              transition: 'all .15s',
              boxShadow: '0 4px 20px rgba(124,185,160,.3)',
            }}>
              Scarica per Mac
            </a>
            <a href="#come-funziona" style={{
              padding: '14px 32px', borderRadius: 40,
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.12)',
              color: 'rgba(255,255,255,.7)',
              fontWeight: 500, fontSize: 14, textDecoration: 'none',
            }}>
              Come funziona ↓
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {['Spazio', 'X', '↑ ↓ ← →'].map(k => (
              <span key={k} style={{
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.12)',
                borderBottom: '2px solid rgba(255,255,255,.12)',
                borderRadius: 6, padding: '3px 9px',
                fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,.5)',
                fontFamily: 'monospace',
              }}>{k}</span>
            ))}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginLeft: 4 }}>
              seleziona · scarta · naviga
            </span>
          </div>
        </div>

        {/* Mockup */}
        <div style={{ position: 'relative' }}>
          <div style={{
            background: '#f0ede8',
            borderRadius: '14px 14px 0 0',
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06)',
            fontSize: 10,
          }}>
            {/* Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px',
              background: '#faf9f6',
              borderBottom: '1px solid #e4e0d8',
            }}>
              {['#ff5f57','#ffbd2e','#28c840'].map(c => (
                <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, display: 'block' }} />
              ))}
              <span style={{ marginLeft: 8, color: '#bbb', fontSize: 10 }}>Provino — Matrimonio Milano</span>
            </div>
            {/* Body */}
            <div style={{ display: 'flex', height: 200 }}>
              {/* Sidebar */}
              <div style={{
                width: 110, background: '#faf9f6',
                borderRight: '1px solid #e4e0d8',
                padding: '8px 6px',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                {['Desktop','Documenti','Immagini'].map((item, i) => (
                  <div key={item} style={{
                    padding: '5px 8px', borderRadius: 6, fontSize: 10,
                    background: i === 0 ? 'rgba(124,185,160,.15)' : 'transparent',
                    color: i === 0 ? '#4a9a80' : '#999',
                    fontWeight: i === 0 ? 600 : 400,
                  }}>{item}</div>
                ))}
                <div style={{ height: 1, background: '#e4e0d8', margin: '4px 8px' }} />
                {['▸ Cerimonia','▸ Ricevimento'].map(item => (
                  <div key={item} style={{ padding: '5px 8px', borderRadius: 6, fontSize: 10, color: '#999' }}>{item}</div>
                ))}
              </div>
              {/* Grid */}
              <div style={{
                flex: 1, display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6, padding: 8,
                background: '#f0ede8', overflow: 'hidden',
              }}>
                {[
                  { color: '#dde8e2', border: '#7cb9a0', badge: '✓', badgeBg: '#7cb9a0' },
                  { color: '#e8dcd8', border: '#e07060', badge: '✕', badgeBg: '#e07060' },
                  { color: '#e4e0da', border: 'transparent', badge: null },
                  { color: '#d8e2dc', border: '#7cb9a0', badge: '✓', badgeBg: '#7cb9a0' },
                  { color: '#dcdae6', border: 'transparent', badge: null },
                  { color: '#e8e0d4', border: 'rgba(0,0,0,.3)', badge: null },
                ].map((card, i) => (
                  <div key={i} style={{
                    borderRadius: 6, border: `2px solid ${card.border}`,
                    background: '#fff', overflow: 'hidden', position: 'relative',
                    boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                  }}>
                    <div style={{ background: card.color, aspectRatio: '3/2' }} />
                    {card.badge && (
                      <span style={{
                        position: 'absolute', top: 3, right: 3,
                        width: 14, height: 14, borderRadius: '50%',
                        background: card.badgeBg, color: '#fff',
                        fontSize: 8, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{card.badge}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Status */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 12px', background: '#faf9f6',
              borderTop: '1px solid #e4e0d8', fontSize: 9, color: '#aaa',
            }}>
              <span>218 totali · <span style={{ color: '#4a9a80', fontWeight: 600 }}>41 selezionate</span> · <span style={{ color: '#c05040', fontWeight: 600 }}>12 scartate</span></span>
              <span>Spazio · X · ← →</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funzionalita" style={{
        background: '#161614',
        padding: 'clamp(60px,8vw,100px) clamp(24px,7vw,80px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase',
            background: 'rgba(124,185,160,.1)', color: '#7cb9a0',
            padding: '5px 14px', borderRadius: 40, marginBottom: 20,
            border: '1px solid rgba(124,185,160,.15)',
          }}>Funzionalità</div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700,
            color: '#fff', marginBottom: 48, lineHeight: 1.2,
          }}>Tutto quello che serve.<br />Niente di superfluo.</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {[
              { icon: '⚡', title: 'Preview istantanea', desc: 'Estrae il JPEG embedded dal file RAW tramite exiftool — nessuna decodifica lenta, nessun plugin.', color: '#7cb9a0' },
              { icon: '⌨', title: 'Workflow da tastiera', desc: 'Spazio per selezionare, X per scartare, frecce per navigare. Zero click, massima velocità.', color: '#e8a598' },
              { icon: '🔍', title: 'Viewer con zoom', desc: 'Doppio click per aprire la vista dettaglio. Zoom con la rotella, pan con il drag, strip laterale.', color: '#a89fdd' },
              { icon: '▣', title: 'Filtri in tempo reale', desc: 'Visualizza solo le selezionate, solo le scartate o quelle non ancora revisionate.', color: '#7cb9a0' },
              { icon: '↗', title: 'Copia & Sposta', desc: 'Un click per copiare o spostare le foto selezionate in qualsiasi cartella del Mac.', color: '#e8c87a' },
              { icon: '☀', title: 'Interfaccia pulita', desc: 'Design minimal su toni caldi, pensato per non affaticare gli occhi nelle lunghe sessioni.', color: '#e8a598' },
            ].map(card => (
              <div key={card.title} style={{
                background: '#1e1e1c',
                borderRadius: 16,
                padding: '28px 24px',
                border: '1px solid rgba(255,255,255,.05)',
                borderTop: `3px solid ${card.color}`,
                transition: 'transform .2s',
              }}>
                <div style={{ fontSize: 26, marginBottom: 14 }}>{card.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{card.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.65 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COME FUNZIONA ── */}
      <section id="come-funziona" style={{
        background: '#0f0f0d',
        padding: 'clamp(60px,8vw,100px) clamp(24px,7vw,80px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase',
            background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.4)',
            padding: '5px 14px', borderRadius: 40, marginBottom: 20,
          }}>Come funziona</div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700,
            color: '#fff', marginBottom: 56, lineHeight: 1.2,
          }}>Da zero a selezione<br />in tre passi.</h2>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            {[
              { n: '01', title: 'Apri la cartella', desc: 'Naviga il filesystem dal pannello laterale. Provino riconosce automaticamente RAW (ARW, CR3, NEF, RAF…) e JPEG.' },
              { n: '02', title: 'Valuta ogni foto', desc: 'Usa le frecce per navigare, Spazio per selezionare (verde) e X per scartare (rosso). La griglia si aggiorna in tempo reale.' },
              { n: '03', title: 'Esporta le migliori', desc: 'Copia o sposta le foto selezionate nella cartella di destinazione con un singolo click.' },
            ].map((step, i) => (
              <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                <div style={{ flex: 1, padding: '0 24px' }}>
                  <div style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '3rem', fontWeight: 700,
                    color: '#7cb9a0', opacity: .5, lineHeight: 1, marginBottom: 16,
                  }}>{step.n}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.65 }}>{step.desc}</p>
                </div>
                {i < 2 && (
                  <div style={{
                    width: 40, flexShrink: 0,
                    height: 2, marginTop: 28,
                    background: 'linear-gradient(90deg, #7cb9a0, #e8a598)',
                    borderRadius: 1,
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATI ── */}
      <section style={{
        background: '#161614',
        padding: 'clamp(60px,8vw,100px) clamp(24px,7vw,80px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase',
            background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.4)',
            padding: '5px 14px', borderRadius: 40, marginBottom: 20,
          }}>Formati supportati</div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700,
            color: '#fff', marginBottom: 40, lineHeight: 1.2,
          }}>Funziona con la tua fotocamera.</h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {[
              { brand: 'Sony',        tags: ['.ARW', '.SRW'] },
              { brand: 'Canon',       tags: ['.CR2', '.CR3'] },
              { brand: 'Nikon',       tags: ['.NEF', '.NRW'] },
              { brand: 'Fujifilm',    tags: ['.RAF'] },
              { brand: 'Olympus',     tags: ['.ORF'] },
              { brand: 'Panasonic',   tags: ['.RW2'] },
              { brand: 'Universale',  tags: ['.DNG', '.JPEG', '.JPG'] },
            ].map(g => (
              <div key={g.brand} style={{
                background: '#1e1e1c',
                border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 12, padding: '16px 20px', minWidth: 130,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.3)', marginBottom: 10 }}>{g.brand}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {g.tags.map(t => (
                    <span key={t} style={{
                      background: 'rgba(124,185,160,.1)',
                      border: '1px solid rgba(124,185,160,.15)',
                      borderRadius: 6, padding: '3px 9px',
                      fontSize: 11, fontWeight: 600,
                      fontFamily: 'monospace', color: '#7cb9a0',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD ── */}
      <section id="download" style={{
        background: 'linear-gradient(135deg, #0f1a15 0%, #0f0f0d 60%)',
        padding: 'clamp(80px,10vw,120px) clamp(24px,7vw,80px)',
        textAlign: 'center',
        borderTop: '1px solid rgba(124,185,160,.1)',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Image src="/provino-logo.png" alt="Provino" width={80} height={80} style={{ margin: '0 auto 28px', display: 'block' }} />
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2rem,3.5vw,3rem)', fontWeight: 700,
            color: '#fff', marginBottom: 16, lineHeight: 1.2,
          }}>Inizia a usare Provino.</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', marginBottom: 36, lineHeight: 1.7 }}>
            Gratuito. Solo per macOS. Richiede exiftool.
          </p>
          <a href="#" style={{
            display: 'inline-block',
            padding: '16px 40px', borderRadius: 40,
            background: '#7cb9a0', color: '#fff',
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(124,185,160,.35)',
          }}>
            Scarica per Mac — Gratis
          </a>
          <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,.2)', lineHeight: 1.8 }}>
            macOS 11+ · Apple Silicon &amp; Intel<br />
            <code style={{
              background: 'rgba(255,255,255,.06)', padding: '2px 8px',
              borderRadius: 4, fontFamily: 'monospace', fontSize: 11,
            }}>brew install exiftool</code>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#0a0a08',
        padding: '24px clamp(24px,7vw,80px)',
        borderTop: '1px solid rgba(255,255,255,.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 4, padding: '2px 6px' }}>
              <Image src="/logo.png" alt="Storie da Raccontare" width={60} height={28} style={{ objectFit: 'contain', display: 'block' }} />
            </div>
          </Link>
          <span style={{ color: 'rgba(255,255,255,.15)', fontSize: 14 }}>·</span>
          <Image src="/provino-logo.png" alt="Provino" width={18} height={18} style={{ objectFit: 'contain', opacity: .4 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>Provino</span>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)' }}>© 2026 Storie da Raccontare · Tutti i diritti riservati</p>
      </footer>

    </div>
  )
}

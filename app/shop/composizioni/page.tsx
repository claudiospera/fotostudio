// app/shop/composizioni/page.tsx
// Pagina pubblica: Composizioni su Tela & Cornice

import type { Metadata } from 'next'
import { ComposizioniGallery } from './components/ComposizioniGallery'
import { WallPreviewTool }     from './components/WallPreviewTool'

export const metadata: Metadata = {
  title: 'Composizioni su Tela & Cornice — Storie da Raccontare',
  description:
    'Scopri 10 idee di composizioni multiple per le tue foto: trittico, gallery wall, griglia 2×2 e molto altro. Visualizza la tua foto sulla parete e richiedi un preventivo gratuito.',
}

const AC = '#7d9b76'

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{
      background: 'linear-gradient(160deg, #f7f4ef 0%, #ede9e2 100%)',
      padding: 'clamp(56px,8vw,96px) clamp(16px,4vw,40px) clamp(40px,6vw,64px)',
      textAlign: 'center',
      borderBottom: '1px solid #e8e4de',
    }}>
      <p style={{
        fontSize: '11px', fontWeight: 700, letterSpacing: '.2em',
        textTransform: 'uppercase', color: AC, marginBottom: 16,
      }}>
        Storie da Raccontare · Composizioni
      </p>

      <h1 style={{
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: 'clamp(32px,5vw,58px)',
        fontWeight: 700, color: '#1a1a1a',
        lineHeight: 1.15, margin: '0 auto 20px',
        maxWidth: 760,
        letterSpacing: '-0.02em',
      }}>
        Le tue foto,<br />
        <em style={{ fontStyle: 'italic', color: AC }}>una composizione unica</em>
      </h1>

      <p style={{
        fontSize: 'clamp(15px,1.8vw,18px)', color: '#6b6660',
        maxWidth: 580, margin: '0 auto 36px',
        lineHeight: 1.7,
      }}>
        Trittico verticale, gallery wall, griglia simmetrica o panoramica divisa:
        trasforma i tuoi ricordi in un&#39;installazione su tela, forex o con cornice.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a
          href="#composizioni"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 50,
            background: AC, color: '#fff',
            textDecoration: 'none', fontSize: '14px', fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 4px 14px rgba(125,155,118,0.4)',
          }}
        >
          Scopri le composizioni ↓
        </a>
        <a
          href="#tool"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 50,
            background: '#fff', color: '#1a1a1a',
            textDecoration: 'none', fontSize: '14px', fontWeight: 600,
            fontFamily: 'Montserrat, sans-serif',
            border: '1.5px solid #ddd',
          }}
        >
          Prova il visualizzatore
        </a>
      </div>

      {/* Stats pillole */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center',
        flexWrap: 'wrap', marginTop: 48,
      }}>
        {[
          { val: '30',  label: 'composizioni disponibili' },
          { val: '3',   label: 'materiali a scelta' },
          { val: '€',   label: 'prezzi trasparenti in tempo reale' },
          { val: '100%', label: 'handmade in Italia' },
        ].map(s => (
          <div key={s.val} style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid #e0dbd4',
            borderRadius: 50,
            padding: '8px 20px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: AC, fontFamily: 'Poppins, sans-serif' }}>{s.val}</span>
            <span style={{ fontSize: '12px', color: '#888' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Sezione heading galleria ─────────────────────────────────────────────────

function GalleriaHeader() {
  return (
    <div
      id="composizioni"
      style={{
        textAlign: 'center',
        padding: 'clamp(40px,6vw,64px) clamp(16px,4vw,40px) 32px',
        maxWidth: 1100, margin: '0 auto',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: AC, marginBottom: 10 }}>
        30 composizioni disponibili
      </p>
      <h2 style={{
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: 'clamp(24px,4vw,38px)',
        fontWeight: 700, color: '#1a1a1a',
        margin: '0 0 14px', lineHeight: 1.2,
      }}>
        Scegli il tuo layout preferito
      </h2>
      <p style={{ fontSize: '15px', color: '#6b6660', maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
        30 layout divisi in 6 gruppi tematici, dalle composizioni speciali 30×60 fino ai gallery wall da 6 pannelli.
        Clicca su "Visualizza con la tua foto" per provarla in live.
      </p>
    </div>
  )
}

// ─── Come funziona ────────────────────────────────────────────────────────────

function ComeFunziona() {
  const steps = [
    { n: '1', titolo: 'Scegli la composizione', testo: 'Sfoglia i 10 layout e scegli quello che si adatta meglio al tuo spazio e ai tuoi ricordi.' },
    { n: '2', titolo: 'Carica la tua foto',     testo: 'Usa il tool interattivo per vedere in anteprima come apparirà la tua foto sulla parete.' },
    { n: '3', titolo: 'Scegli e acquista',       testo: 'Scegli materiale e dimensioni, vedi il prezzo in tempo reale e procedi all\'acquisto direttamente online.' },
  ]

  return (
    <section style={{
      background: '#fff',
      borderTop: '1px solid #e8e4de',
      padding: 'clamp(48px,6vw,72px) clamp(16px,4vw,40px)',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 'clamp(22px,3.5vw,32px)',
          fontWeight: 700, color: '#1a1a1a',
          textAlign: 'center', margin: '0 0 40px',
        }}>
          Come funziona
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 28,
        }}>
          {steps.map(s => (
            <div key={s.n} style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `${AC}18`, border: `2px solid ${AC}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800, fontSize: '18px', color: AC,
              }}>
                {s.n}
              </div>
              <h3 style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontWeight: 700, fontSize: '18px', color: '#1a1a1a',
                margin: '0 0 8px',
              }}>
                {s.titolo}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b6660', lineHeight: 1.65, margin: 0 }}>
                {s.testo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer mini ──────────────────────────────────────────────────────────────

function FooterNote() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '24px 20px',
      fontSize: '12px', color: '#aaa',
      borderTop: '1px solid #e8e4de',
    }}>
      Tutte le composizioni sono realizzate artigianalmente in Italia · Ritiro in studio disponibile ·{' '}
      <a href="mailto:info@claudiospera.com" style={{ color: AC, textDecoration: 'none' }}>info@claudiospera.com</a>
    </div>
  )
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

export default function ComposizioniPage() {
  return (
    <div style={{ background: '#faf8f5', minHeight: '100vh' }}>
      <Hero />
      <GalleriaHeader />
      <ComposizioniGallery />
      <ComeFunziona />
      <WallPreviewTool />
      <FooterNote />
    </div>
  )
}

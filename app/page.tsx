import Image from 'next/image'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Heart, User, Users, Camera, Briefcase, Star,
} from 'lucide-react'

// Se il fotografo è già loggato, va direttamente alla dashboard
export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--tx)', background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 clamp(20px, 5vw, 60px)',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,15,13,.88)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--b1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: '3px 8px' }}>
            <Image src="/logo.png" alt="Storie da Raccontare" width={90} height={42} style={{ objectFit: 'contain', display: 'block' }} />
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: '15px', color: 'var(--tx)', letterSpacing: '-0.01em', display: 'none' }} className="brand-name">
            Storie da Raccontare
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <a href="#servizi" style={{ fontSize: '13px', color: 'var(--t2)', textDecoration: 'none', padding: '6px 12px', borderRadius: 'var(--r2)', transition: 'color .15s' }}
            className="nav-link">Servizi</a>
          <a href="#galleria-cliente" style={{ fontSize: '13px', color: 'var(--t2)', textDecoration: 'none', padding: '6px 12px', borderRadius: 'var(--r2)', transition: 'color .15s' }}
            className="nav-link">Galleria</a>
          <Link href="/login" style={{
            fontSize: '12px', fontWeight: 500, color: 'var(--tx)',
            background: 'var(--s2)', border: '1px solid var(--b2)',
            borderRadius: 'var(--r2)', padding: '7px 16px',
            textDecoration: 'none', transition: 'all .15s', marginLeft: 8,
          }}>
            Accedi
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{
        height: '100vh', minHeight: 560,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        textAlign: 'center',
        padding: '0 clamp(24px, 6vw, 80px)',
      }}>

        {/* Background glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(125,171,150,.07) 0%, transparent 70%)',
        }} />

        {/* Vertical decorative line */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 1, height: '30%',
          background: 'linear-gradient(to bottom, transparent, rgba(125,171,150,.35), transparent)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, animation: 'slideUp .7s ease both' }}>
          <p style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '.22em',
            textTransform: 'uppercase', color: 'var(--ac)', marginBottom: 22, opacity: .8,
          }}>
            Claudio Spera &nbsp;·&nbsp; Mirabella Eclano (AV)
          </p>

          <h1 style={{
            fontFamily: 'Playfair Display, serif', fontWeight: 700,
            fontSize: 'clamp(44px, 8vw, 88px)',
            lineHeight: 1.03, letterSpacing: '-0.025em',
            color: 'var(--tx)', marginBottom: 24,
          }}>
            Storie da<br />
            <em style={{ color: 'var(--ac)', fontStyle: 'italic' }}>Raccontare</em>
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 2vw, 18px)', color: 'var(--t2)',
            lineHeight: 1.75, fontWeight: 300,
            maxWidth: 500, margin: '0 auto 44px',
          }}>
            Fotografia di matrimonio, ritratto e famiglia.<br />
            Ogni momento merita di essere ricordato per sempre.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#servizi" style={{
              background: 'var(--ac)', color: '#0f0f0d',
              borderRadius: 'var(--r2)', padding: '13px 30px',
              fontSize: '13px', fontWeight: 700, textDecoration: 'none',
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>
              Scopri i servizi
            </a>
            <a href="#galleria-cliente" style={{
              background: 'var(--s2)', color: 'var(--tx)',
              border: '1px solid var(--b2)', borderRadius: 'var(--r2)',
              padding: '13px 30px', fontSize: '13px', fontWeight: 500,
              textDecoration: 'none', letterSpacing: '.02em',
            }}>
              La tua galleria
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: .45,
        }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, var(--ac), transparent)' }} />
        </div>
      </section>

      {/* ── SERVIZI ─────────────────────────────────────────────────────── */}
      <section id="servizi" style={{
        padding: 'clamp(64px, 9vw, 110px) clamp(24px, 5vw, 60px)',
        borderTop: '1px solid var(--b1)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ marginBottom: 56, textAlign: 'center' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--ac)', marginBottom: 14, opacity: .8 }}>Cosa faccio</p>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 46px)', color: 'var(--tx)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Ogni occasione,<br />la sua storia
            </h2>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(290px, 100%), 1fr))', gap: 1, border: '1px solid var(--b1)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
            {[
              { title: 'Matrimonio',       desc: "Il giorno più importante della vostra vita, raccontato con delicatezza e rispetto.", Icon: Heart },
              { title: 'Ritratto',         desc: 'La tua personalità e la tua essenza, catturate in ogni singolo scatto.',              Icon: User },
              { title: 'Famiglia',         desc: 'I momenti insieme che crescono con voi. Ricordi veri, naturali, per sempre.',          Icon: Users },
              { title: 'Newborn',          desc: 'I primissimi giorni della vita, la prima storia che inizia a scriversi.',              Icon: Star },
              { title: 'Moda / Editorial', desc: 'Creatività e stile, fusi insieme per raccontare il tuo brand o la tua immagine.',     Icon: Camera },
              { title: 'Corporate',        desc: 'Il volto professionale della tua azienda, comunicato con eleganza e precisione.',      Icon: Briefcase },
            ].map(({ title, desc, Icon }, i) => (
              <div key={title} style={{
                padding: '36px 32px',
                background: 'var(--s1)',
                borderRight: '1px solid var(--b1)',
                borderBottom: '1px solid var(--b1)',
                animation: `fadeIn .5s ease ${i * 0.07}s both`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--acd)', border: '1px solid rgba(125,171,150,.15)',
                  display: 'grid', placeItems: 'center', marginBottom: 22,
                }}>
                  <Icon size={17} color="var(--ac)" strokeWidth={1.8} />
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--tx)', marginBottom: 10, letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--t3)', lineHeight: 1.7, fontWeight: 300 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILOSOFIA ───────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px, 9vw, 110px) clamp(24px, 5vw, 60px)',
        borderTop: '1px solid var(--b1)',
        background: 'var(--s1)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: 2, height: 48, background: 'var(--ac)', margin: '0 auto 32px', opacity: .4,
          }} />
          <blockquote style={{
            fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
            fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 400,
            color: 'var(--tx)', lineHeight: 1.55, letterSpacing: '-0.01em',
            marginBottom: 28,
          }}>
            &ldquo;Non fotografo eventi. Racconto emozioni, sguardi, silenzi — tutto ciò che le parole non riescono a dire.&rdquo;
          </blockquote>
          <p style={{ fontSize: '13px', color: 'var(--ac)', fontWeight: 500, letterSpacing: '.06em' }}>
            Claudio Spera
          </p>
        </div>
      </section>

      {/* ── GALLERIA CLIENTE ────────────────────────────────────────────── */}
      <section id="galleria-cliente" style={{
        padding: 'clamp(64px, 9vw, 110px) clamp(24px, 5vw, 60px)',
        borderTop: '1px solid var(--b1)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>

          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--acd)', border: '1px solid rgba(125,171,150,.18)',
            display: 'grid', placeItems: 'center', margin: '0 auto 28px',
          }}>
            <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="var(--ac)" strokeWidth={1.7} strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>

          <h2 style={{
            fontFamily: 'Playfair Display, serif', fontWeight: 700,
            fontSize: 'clamp(26px, 4vw, 38px)', color: 'var(--tx)',
            letterSpacing: '-0.02em', marginBottom: 16,
          }}>
            La tua galleria ti aspetta
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--t2)', lineHeight: 1.7, marginBottom: 10, fontWeight: 300 }}>
            Hai ricevuto un link alla tua galleria privata?<br />
            Aprilo direttamente per sfogliare e scaricare le tue foto.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--t3)', lineHeight: 1.6, marginBottom: 40 }}>
            Non riesci a trovare il link? Scrivimi su WhatsApp.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/393897855581"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#25d366', color: '#fff',
                borderRadius: 'var(--r2)', padding: '13px 26px',
                fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Scrivimi su WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--b1)',
        padding: 'clamp(28px, 4vw, 44px) clamp(24px, 5vw, 60px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        background: 'var(--s1)',
      }}>
        <div>
          <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '15px', color: 'var(--tx)', marginBottom: 4, letterSpacing: '-0.01em' }}>
            Storie da Raccontare
          </p>
          <p style={{ fontSize: '12px', color: 'var(--t3)', lineHeight: 1.5 }}>
            Claudio Spera · Fotografia · Mirabella Eclano (AV)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="https://wa.me/393897855581" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--t3)', textDecoration: 'none' }}>WhatsApp</a>
          <span style={{ fontSize: '12px', color: 'var(--t3)' }}>© {new Date().getFullYear()}</span>
          <Link href="/login" style={{ fontSize: '11px', color: 'var(--t3)', textDecoration: 'none', opacity: .4, letterSpacing: '.04em' }}>
            Area fotografo
          </Link>
        </div>
      </footer>

    </div>
  )
}

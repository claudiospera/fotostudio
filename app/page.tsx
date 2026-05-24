import Image from 'next/image'
import Link from 'next/link'

export default async function HomePage() {
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', color: '#0a0a0a', background: '#ffffff', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 clamp(20px, 5vw, 60px)', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #e8e8e8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ borderRadius: 8, padding: '3px 8px', background: '#f3f3f3' }}>
            <Image src="/logo.png" alt="Storie da Raccontare" width={90} height={42} style={{ objectFit: 'contain', display: 'block' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/servizi" style={{ fontSize: '13px', color: '#555', textDecoration: 'none', padding: '6px 14px', borderRadius: 10, transition: 'all .15s' }} className="nav-link">Servizi Fotografici</Link>
          <a href="#galleria-cliente" style={{ fontSize: '13px', color: '#555', textDecoration: 'none', padding: '6px 14px', borderRadius: 10, transition: 'all .15s' }} className="nav-link">Galleria</a>
          <Link href="/shop" style={{ fontSize: '13px', color: '#00c1de', fontWeight: 700, textDecoration: 'none', padding: '6px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 5 }} className="nav-link">Shop</Link>
          <Link href="/login" style={{ fontSize: '12px', fontWeight: 600, color: '#fff', background: '#00c1de', borderRadius: 10, padding: '8px 18px', textDecoration: 'none', transition: 'all .15s', marginLeft: 8 }} className="nav-cta">Accedi</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
        padding: '80px clamp(24px, 6vw, 80px) 0', background: '#ffffff',
      }}>
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,193,222,0.07) 0%, rgba(149,140,255,0.05) 60%, transparent 80%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,193,222,0.08)', border: '1px solid rgba(0,193,222,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c1de' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#00c1de' }}>Claudio Spera · Mirabella Eclano (AV)</span>
          </div>

          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(42px, 8vw, 90px)', lineHeight: 1.02, letterSpacing: '-0.03em', color: '#0a0a0a', marginBottom: 24 }}>
            Storie da<br /><span style={{ color: '#00c1de' }}>Raccontare</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#555', lineHeight: 1.75, fontWeight: 400, maxWidth: 480, margin: '0 auto 44px' }}>
            Fotografia di matrimonio, ritratto e famiglia.<br />Ogni momento merita di essere ricordato per sempre.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/servizi" style={{ background: '#00c1de', color: '#fff', borderRadius: 12, padding: '14px 32px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', letterSpacing: '.04em' }}>Scopri i servizi fotografici</a>
            <a href="/shop" style={{ background: '#f3f3f3', color: '#0a0a0a', border: '1px solid #e8e8e8', borderRadius: 12, padding: '14px 32px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>Area shop</a>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: .35 }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, #00c1de, transparent)' }} />
        </div>
      </section>

      {/* ── REEL INSTAGRAM ── */}
      <section style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 60px)', background: '#ffffff', borderTop: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#00c1de', margin: 0 }}>Reel &amp; Stories</p>
            <a href="https://www.instagram.com/claudiosperafotografo/" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: '#999', textDecoration: 'none', letterSpacing: '.04em' }}>
              @claudiosperafotografo →
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="reel-home-grid">
            {[
              { url: 'https://www.instagram.com/reel/C89h_8sonFN/', cover: 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev/images/galleria/matrimoni/real-weddings/FRANCO%20E%20ANTONIO/_DSF8816.jpg' },
              { url: 'https://www.instagram.com/reel/DIJhGRToSmR/', cover: 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev/images/galleria/matrimoni/real-weddings/FABIO%20E%20ANGELA/ALCUNE%20SEL/DSCF3312.jpg' },
              { url: 'https://www.instagram.com/reel/C_yQ_f9Ild8/', cover: 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev/images/galleria/matrimoni/real-weddings/mario%20e%20marianna/DSCF5680-Migliorato-NR.jpg' },
              { url: 'https://www.instagram.com/reel/C_Q3B8xoBiV/', cover: 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev/images/galleria/reels/reel-4-cover.png' },
            ].map(({ url, cover }) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', textDecoration: 'none',
                  aspectRatio: '9/16', borderRadius: 12, overflow: 'hidden',
                  background: `url(${cover}) center/cover no-repeat #f3f3f3`,
                  position: 'relative',
                }} className="reel-home-card">
                <div className="reel-home-overlay" style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity .2s',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILOSOFIA ── */}
      <section style={{ padding: 'clamp(64px, 9vw, 110px) clamp(24px, 5vw, 60px)', background: '#ffffff', borderTop: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: 3, height: 48, background: '#00c1de', borderRadius: 4, marginBottom: 32 }} />
          <blockquote style={{ fontFamily: 'Poppins, sans-serif', fontStyle: 'italic', fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 600, color: '#0a0a0a', lineHeight: 1.5, letterSpacing: '-0.015em', marginBottom: 24 }}>
            &ldquo;Non fotografo eventi. Racconto emozioni, sguardi, silenzi — tutto cio che le parole non riescono a dire.&rdquo;
          </blockquote>
          <p style={{ fontSize: '13px', color: '#00c1de', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Claudio Spera</p>
        </div>
      </section>

      {/* ── SHOP ── */}
      <section id="shop" style={{ padding: 'clamp(64px, 9vw, 110px) clamp(24px, 5vw, 60px)', background: '#f3f3f3', borderTop: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 56, textAlign: 'center' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#00c1de', marginBottom: 14 }}>Shop</p>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 44px)', color: '#0a0a0a', letterSpacing: '-0.025em', lineHeight: 1.1 }}>Le tue foto,<br />sempre con te</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 16, marginBottom: 40 }}>
            {[
              { label: 'Stampe & Poster',      href: '/shop/stampe',              img: '/images/shop/stampe/poster.jpg' },
              { label: 'Stampa su Tela',        href: '/shop/decorazioni/tela',    img: '/images/shop/tela/catalogo.jpg' },
              { label: 'Cornici',               href: '/shop/decorazioni/cornici', img: '/images/shop/cornici/preview-bianco-1.jpg' },
              { label: 'Gadget Personalizzati', href: '/shop/gadget',              img: '/images/shop/gadget/cuscino-ambientata.jpg' },
            ].map(({ label, href, img }) => (
              <Link key={href} href={href} style={{ display: 'block', textDecoration: 'none', borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid #e8e8e8', transition: 'box-shadow .18s, transform .18s' }} className="shop-card">
                <div style={{ position: 'relative', aspectRatio: '4/3', background: '#f9f9f9' }}>
                  <Image src={img} alt={label} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '16px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0a0a0a' }}>{label}</span>
                  <span style={{ fontSize: '18px', color: '#00c1de', lineHeight: 1 }}>→</span>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/shop" style={{ display: 'inline-block', background: '#00c1de', color: '#fff', borderRadius: 12, padding: '13px 32px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', letterSpacing: '.04em' }}>
              Esplora tutto lo shop →
            </Link>
          </div>
        </div>
      </section>

      {/* ── GALLERIA CLIENTE ── */}
      <section id="galleria-cliente" style={{ padding: 'clamp(64px, 9vw, 110px) clamp(24px, 5vw, 60px)', background: '#f3f3f3', borderTop: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,193,222,0.10)', border: '1px solid rgba(0,193,222,0.2)', display: 'grid', placeItems: 'center', margin: '0 auto 28px' }}>
            <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="#00c1de" strokeWidth={1.8} strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(24px, 4vw, 36px)', color: '#0a0a0a', letterSpacing: '-0.02em', marginBottom: 14 }}>La tua galleria ti aspetta</h2>
          <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.7, marginBottom: 8 }}>Hai ricevuto un link alla tua galleria privata?<br />Aprilo direttamente per sfogliare e scaricare le tue foto.</p>
          <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.6, marginBottom: 40 }}>Non riesci a trovare il link? Scrivimi su WhatsApp.</p>
          <a href="https://wa.me/393897855581" target="_blank" rel="noopener noreferrer" style={{ background: '#25d366', color: '#fff', borderRadius: 12, padding: '13px 26px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Scrivimi su WhatsApp
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #e8e8e8', padding: 'clamp(28px, 4vw, 44px) clamp(24px, 5vw, 60px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: '#ffffff' }}>
        <div>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0a0a0a', marginBottom: 4 }}>Storie da Raccontare</p>
          <p style={{ fontSize: '12px', color: '#999', lineHeight: 1.5 }}>Claudio Spera · Fotografia · Mirabella Eclano (AV)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="https://wa.me/393897855581" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#999', textDecoration: 'none' }}>WhatsApp</a>
          <Link href="/shop" style={{ fontSize: '12px', color: '#00c1de', fontWeight: 600, textDecoration: 'none' }}>Shop</Link>
          <span style={{ fontSize: '12px', color: '#999' }}>© {new Date().getFullYear()}</span>
          <Link href="/login" style={{ fontSize: '11px', color: '#ccc', textDecoration: 'none', letterSpacing: '.04em' }}>Area fotografo</Link>
        </div>
      </footer>

      <style>{`
        .nav-link:hover { color: #0a0a0a !important; background: #f3f3f3; }
        .nav-cta:hover  { background: #009ab3 !important; }
        .shop-card:hover { box-shadow: 0 8px 28px rgba(0,193,222,0.12); transform: translateY(-2px); }
        .reel-home-card:hover .reel-home-overlay { opacity: 1 !important; }
        @media (max-width: 600px) { .reel-home-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: 'https://storiedaraccontare.it' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://storiedaraccontare.it/#photographer',
  name: 'Storie da Raccontare — Claudio Spera Fotografo',
  description: 'Fotografo di matrimoni, battesimi, ritratti e famiglia a Mirabella Eclano (AV), Campania.',
  url: 'https://storiedaraccontare.it',
  telephone: '+393897855581',
  image: 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev/images/galleria/matrimoni/real-weddings/FRANCO%20E%20ANTONIO/_DSF8816.jpg',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mirabella Eclano',
    addressRegion: 'AV',
    addressCountry: 'IT',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 41.0333,
    longitude: 14.9833,
  },
  areaServed: [
    { '@type': 'State', name: 'Campania' },
    { '@type': 'City',  name: 'Avellino' },
    { '@type': 'City',  name: 'Benevento' },
    { '@type': 'City',  name: 'Napoli' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Servizi fotografici',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Fotografia matrimoni' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Fotografia battesimi' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ritratti e famiglia' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Maternità e gravidanza' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Comunioni e cresime' } },
    ],
  },
  sameAs: [
    'https://www.instagram.com/claudiosperafotografo/',
  ],
}

export default async function HomePage() {
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', color: '#0a0a0a', background: '#ffffff', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

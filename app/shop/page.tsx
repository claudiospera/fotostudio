// app/shop/page.tsx

import { getFeaturedProducts, PRODUCTS } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'
import { CATEGORY_META } from '@/lib/shop/types'
import Link from 'next/link'

const CATEGORY_ICONS: Record<string, string> = {
  stampe: '🖼️',
  decorazioni: '🏠',
  gadget: '🎁',
}

export default function ShopHomePage() {
  const featured = getFeaturedProducts()

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'var(--n-surface)',
        padding: 'clamp(56px, 9vw, 100px) clamp(24px, 5vw, 60px)',
        textAlign: 'center',
        borderBottom: '1px solid var(--n-border)',
      }}>
        <p style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '.2em',
          textTransform: 'uppercase', color: 'var(--n-ac)', marginBottom: 16,
        }}>
          Claudio Spera Fotografo
        </p>
        <h1 style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 800,
          fontSize: 'clamp(32px, 5vw, 60px)',
          color: 'var(--n-tx)', lineHeight: 1.1,
          letterSpacing: '-0.025em', marginBottom: 20,
        }}>
          Le tue foto,{' '}
          <span style={{ color: 'var(--n-ac)' }}>per sempre</span>
        </h1>
        <p style={{
          fontSize: 'clamp(14px, 1.8vw, 17px)',
          color: 'var(--n-t2)', lineHeight: 1.7,
          maxWidth: 520, margin: '0 auto 36px',
        }}>
          Stampe fine art, decorazioni e gadget personalizzati.
          Ogni prodotto è realizzato con cura, pensato per durare.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#prodotti" style={{
            background: 'var(--n-ac)', color: '#fff',
            borderRadius: 'var(--n-r2)', padding: '13px 28px',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none',
            letterSpacing: '.03em',
          }}>
            Sfoglia il catalogo
          </a>
          <a href="#categorie" style={{
            background: '#fff', color: 'var(--n-tx)',
            border: '1px solid var(--n-border)',
            borderRadius: 'var(--n-r2)', padding: '13px 28px',
            fontSize: '13px', fontWeight: 500, textDecoration: 'none',
          }}>
            Vedi le categorie
          </a>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(24px, 5vw, 60px)' }}>

        {/* ── CATEGORIE ── */}
        <section id="categorie" style={{ padding: 'clamp(48px, 6vw, 80px) 0' }}>
          <h2 style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 700,
            fontSize: 'clamp(20px, 2.5vw, 28px)', color: 'var(--n-tx)',
            marginBottom: 28, letterSpacing: '-0.02em',
          }}>
            Categorie
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {Object.values(CATEGORY_META).map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#fff',
                  border: '1px solid var(--n-border)',
                  borderRadius: 'var(--n-r)',
                  padding: '28px 20px',
                  textAlign: 'center',
                  transition: 'all .18s',
                }}
                  className="category-card"
                >
                  <div style={{ fontSize: '32px', marginBottom: 12 }}>{CATEGORY_ICONS[cat.slug] ?? '📦'}</div>
                  <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'var(--n-tx)', marginBottom: 6 }}>
                    {cat.label}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--n-t3)', lineHeight: 1.5 }}>
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── IN EVIDENZA ── */}
        {featured.length > 0 && (
          <section style={{ paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <h2 style={{
                fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                fontSize: 'clamp(20px, 2.5vw, 28px)', color: 'var(--n-tx)',
                letterSpacing: '-0.02em', margin: 0,
              }}>
                In evidenza
              </h2>
              <span style={{
                background: 'var(--n-ac-dim)', color: 'var(--n-ac)',
                borderRadius: 100, padding: '3px 10px', fontSize: '11px', fontWeight: 700,
              }}>
                Scelti per te
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── TUTTI I PRODOTTI ── */}
        <section id="prodotti" style={{ paddingBottom: 'clamp(56px, 8vw, 100px)' }}>
          <h2 style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 700,
            fontSize: 'clamp(20px, 2.5vw, 28px)', color: 'var(--n-tx)',
            marginBottom: 28, letterSpacing: '-0.02em',
          }}>
            Tutti i prodotti
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {PRODUCTS.filter((p) => p.status !== 'discontinued').map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .category-card:hover {
          border-color: var(--n-ac);
          box-shadow: 0 4px 20px rgba(0,193,222,0.10);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

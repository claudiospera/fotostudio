// components/shop/CalendarsTeaserCard.tsx
// Card "Calendari 2027" per la griglia "In evidenza" della home shop — stessa
// resa visiva di ProductCard, ma punta al catalogo calendari (dati dinamici da
// calendar_models, non dal catalogo statico lib/shop/products.ts).

import Link from 'next/link'
import Image from 'next/image'

export function CalendarsTeaserCard({ imageUrl }: { imageUrl: string }) {
  return (
    <Link href="/shop/calendari" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
      <div
        className="product-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--n-r)',
          border: '1px solid var(--n-border)',
          background: '#fff',
          overflow: 'hidden',
          transition: 'box-shadow .2s, transform .2s',
        }}
      >
        <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: 'var(--n-surface)' }}>
          <Image
            src={imageUrl}
            alt="Calendari fotografici 2027"
            fill
            className="product-card-img"
            style={{ objectFit: 'cover', objectPosition: 'top', transition: 'transform .35s ease' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--n-tx)', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
            Calendari 2027
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--n-t2)', lineHeight: 1.55, margin: 0 }}>
            Personalizzato con le tue foto, su carta fotografica 30×45 cm
          </p>
          <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: '14px', fontWeight: 700, color: 'var(--n-ac)' }}>
            da 10 €
          </div>
        </div>
      </div>

      <style>{`
        .product-card:hover {
          box-shadow: 0 8px 32px rgba(0,193,222,0.12);
          transform: translateY(-2px);
        }
        .product-card:hover .product-card-img {
          transform: scale(1.04);
        }
      `}</style>
    </Link>
  )
}

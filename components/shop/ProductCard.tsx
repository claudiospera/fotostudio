// components/shop/ProductCard.tsx

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/shop/types'

interface ProductCardProps {
  product: Product
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function ProductCard({ product }: ProductCardProps) {
  const minPrice = Math.min(...product.variants.map((v) => v.price))
  const href = `/shop/${product.category}/${product.slug}`

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--n-r)',
        border: '1px solid var(--n-border)',
        background: '#fff',
        overflow: 'hidden',
        transition: 'box-shadow .2s, transform .2s',
      }}
        className="product-card"
      >
        {/* Immagine */}
        <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: 'var(--n-surface)' }}>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="product-card-img"
            style={{ objectFit: 'cover', transition: 'transform .35s ease' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {product.status === 'sold_out' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.75)',
            }}>
              <span style={{
                background: '#0a0a0a', color: '#fff',
                borderRadius: 8, padding: '4px 12px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              }}>
                Esaurito
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--n-tx)', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
            {product.name}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--n-t2)', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.shortDescription}
          </p>
          <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: '14px', fontWeight: 700, color: minPrice === 0 ? 'var(--n-t3)' : 'var(--n-ac)' }}>
            {minPrice === 0 ? 'Prezzo da definire' : `da ${formatPrice(minPrice)}`}
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

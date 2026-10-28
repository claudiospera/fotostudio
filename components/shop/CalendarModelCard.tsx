// components/shop/CalendarModelCard.tsx
// Card catalogo calendari — non riusa ProductCard.tsx perché i modelli calendario
// vengono da calendar_models (DB) e non hanno la forma di Product/ProductVariant.

import Link from 'next/link'
import Image from 'next/image'

export interface CalendarModelSummary {
  code: string
  title: string
  category: string
  photoSlots: number
  thumbUrl: string
}

export function CalendarModelCard({ model }: { model: CalendarModelSummary }) {
  return (
    <Link href={`/shop/calendari/${model.code}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
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
        <div style={{ position: 'relative', aspectRatio: '30 / 45', overflow: 'hidden', background: 'var(--n-surface)' }}>
          <Image
            src={model.thumbUrl}
            alt={model.title}
            fill
            className="product-card-img"
            style={{ objectFit: 'cover', transition: 'transform .35s ease' }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--n-tx)', fontFamily: 'Poppins, sans-serif' }}>
            {model.code}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--n-t2)', background: 'var(--n-surface)', borderRadius: 6, padding: '2px 7px' }}>
              {model.photoSlots === 1 ? '1 foto' : `${model.photoSlots} foto`}
            </span>
            {model.category && (
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--n-t2)', background: 'var(--n-surface)', borderRadius: 6, padding: '2px 7px' }}>
                {model.category}
              </span>
            )}
          </span>
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

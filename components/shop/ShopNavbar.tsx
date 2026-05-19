'use client'

// components/shop/ShopNavbar.tsx

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from './CartProvider'
import { CATEGORY_META } from '@/lib/shop/types'

export function ShopNavbar() {
  const { itemCount } = useCart()

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--n-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="https://storiedaraccontare.it" style={{ fontSize: '12px', color: 'var(--n-t3)', textDecoration: 'none', fontWeight: 500 }}>
            ← Home
          </a>
          <Link href="/shop" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--n-ac)' }}>
              Shop
            </span>
            <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'var(--n-tx)' }}>
              Storie da Raccontare
            </span>
          </Link>
        </div>

        {/* Categorie */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {Object.values(CATEGORY_META).map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--n-t2)',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 'var(--n-r2)',
                transition: 'all .15s',
              }}
              className="shop-nav-link"
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        {/* Carrello */}
        <Link href="/shop/carrello" style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--n-tx)',
          textDecoration: 'none',
          background: itemCount > 0 ? 'var(--n-ac-dim)' : 'var(--n-surface)',
          border: '1px solid var(--n-border)',
          borderRadius: 'var(--n-r2)',
          padding: '8px 16px',
          transition: 'all .15s',
        }}>
          <ShoppingCart size={16} color={itemCount > 0 ? 'var(--n-ac)' : 'var(--n-t2)'} />
          {itemCount > 0 ? (
            <span style={{ color: 'var(--n-ac)' }}>{itemCount}</span>
          ) : (
            <span style={{ color: 'var(--n-t2)' }}>Carrello</span>
          )}
        </Link>
      </div>

      <style>{`
        .shop-nav-link:hover {
          color: var(--n-tx) !important;
          background: var(--n-surface);
        }
        .shop-admin-link:hover {
          color: var(--n-ac) !important;
          border-color: var(--n-ac) !important;
        }
      `}</style>
    </header>
  )
}

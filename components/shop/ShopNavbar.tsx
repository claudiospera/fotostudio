'use client'

// components/shop/ShopNavbar.tsx

import Link from 'next/link'
import { ShoppingCart, User } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useCart } from './CartProvider'
import { CATEGORY_META } from '@/lib/shop/types'

export function ShopNavbar() {
  const { itemCount } = useCart()
  const { user, isLoaded } = useUser()

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
        <div className="shop-brand" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <a href="https://storiedaraccontare.it" className="shop-home-link" style={{ fontSize: '12px', color: 'var(--n-t3)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>
            ← Home
          </a>
          <Link href="/shop" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--n-ac)' }}>
              Shop
            </span>
            <span className="shop-brand-name" style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'var(--n-tx)', whiteSpace: 'nowrap' }}>
              Storie da Raccontare
            </span>
          </Link>
        </div>

        {/* Categorie */}
        <nav className="shop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
          <Link
            href="/shop/composizioni"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#7d9b76',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--n-r2)',
              background: 'rgba(125,155,118,0.1)',
              whiteSpace: 'nowrap',
              transition: 'all .15s',
            }}
            className="shop-nav-link"
          >
            ✦ Composizioni
          </Link>
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
                whiteSpace: 'nowrap',
              }}
              className="shop-nav-link"
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        {isLoaded && (
          user ? (
            <Link href="/shop/account" className="shop-auth-btn" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '13px', fontWeight: 600, color: 'var(--n-tx)',
              textDecoration: 'none',
              background: 'var(--n-surface)', border: '1px solid var(--n-border)',
              borderRadius: 'var(--n-r2)', padding: '8px 14px',
              transition: 'all .15s', flexShrink: 0,
            }}>
              <User size={15} color="var(--n-t2)" />
              <span className="shop-auth-label">{user.firstName || 'Account'}</span>
            </Link>
          ) : (
            <Link href="/shop/accedi" className="shop-auth-btn" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '13px', fontWeight: 600, color: '#00c1de',
              textDecoration: 'none',
              background: 'rgba(0,193,222,0.06)', border: '1.5px solid rgba(0,193,222,0.3)',
              borderRadius: 'var(--n-r2)', padding: '8px 14px',
              transition: 'all .15s', flexShrink: 0,
            }}>
              <User size={15} />
              <span className="shop-auth-label">Accedi</span>
            </Link>
          )
        )}

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
          flexShrink: 0,
        }}>
          <ShoppingCart size={16} color={itemCount > 0 ? 'var(--n-ac)' : 'var(--n-t2)'} />
          {itemCount > 0 ? (
            <span style={{ color: 'var(--n-ac)' }}>{itemCount}</span>
          ) : (
            <span className="shop-cart-label" style={{ color: 'var(--n-t2)' }}>Carrello</span>
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
        @media (max-width: 600px) {
          .shop-nav-links { display: none !important; }
          .shop-home-link { display: none !important; }
          .shop-cart-label { display: none !important; }
          .shop-brand-name { font-size: 13px !important; }
          .shop-auth-label { display: none !important; }
        }
      `}</style>
    </header>
  )
}

// app/shop/layout.tsx

import type { Metadata } from 'next'
import Link from 'next/link'
import { CartProvider } from '@/components/shop/CartProvider'
import { ShopNavbar } from '@/components/shop/ShopNavbar'
import { CookieBanner } from '@/components/shop/CookieBanner'
import { CookieSettingsLink } from '@/components/shop/CookieSettingsLink'

export const metadata: Metadata = {
  title: {
    template: '%s — Shop Storie da Raccontare',
    default: 'Shop — Storie da Raccontare',
  },
  description: 'Stampe fine art, album artigianali e file digitali di Claudio Spera Fotografo.',
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="neuro-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ShopNavbar />
        <main style={{ flex: 1 }}>{children}</main>

        <footer style={{
          borderTop: '1px solid #e8e8e8',
          background: '#fff',
          fontFamily: 'Montserrat, sans-serif',
        }}>
          {/* Link legali */}
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            padding: '28px clamp(20px, 5vw, 40px) 20px',
            display: 'flex', flexWrap: 'wrap', gap: '10px 28px',
            justifyContent: 'center',
          }}>
            {[
              { href: '/shop/privacy-policy',       label: 'Privacy Policy' },
              { href: '/shop/cookie-policy',         label: 'Cookie Policy' },
              { href: '/shop/termini-e-condizioni',  label: 'Termini e Condizioni' },
              { href: '/shop/diritto-di-recesso',    label: 'Diritto di Recesso' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
            <CookieSettingsLink />
          </div>

          {/* Copyright */}
          <div style={{
            borderTop: '1px solid #f0f0f0',
            padding: '14px clamp(20px, 5vw, 40px)',
            textAlign: 'center',
            fontSize: '11px',
            color: '#bbb',
          }}>
            © {new Date().getFullYear()} Claudio Spera Fotografo — P.IVA 02766080648 — Via Pianopantano snc, 83036 Mirabella Eclano (AV)
            {' · '}
            <a href="mailto:info@claudiospera.com" style={{ color: '#bbb', textDecoration: 'none' }}>info@claudiospera.com</a>
            {' · '}
            <a href="tel:+393897855581" style={{ color: '#bbb', textDecoration: 'none' }}>+39 389 785 5581</a>
          </div>
        </footer>

        <CookieBanner />
      </div>
    </CartProvider>
  )
}


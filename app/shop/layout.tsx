// app/shop/layout.tsx

import type { Metadata } from 'next'
import { CartProvider } from '@/components/shop/CartProvider'
import { ShopNavbar } from '@/components/shop/ShopNavbar'

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
          borderTop: '1px solid var(--n-border)',
          padding: '28px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--n-t3)',
          background: 'var(--n-surface)',
          fontFamily: 'Montserrat, sans-serif',
        }}>
          © {new Date().getFullYear()} Claudio Spera Fotografo — Mirabella Eclano (AV)
        </footer>
      </div>
    </CartProvider>
  )
}

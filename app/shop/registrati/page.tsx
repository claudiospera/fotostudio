// app/shop/registrati/page.tsx

import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Registrati — Storie da Raccontare',
}

export default function ShopRegisterPage() {
  return (
    <div style={{
      fontFamily: 'Montserrat, sans-serif',
      background: '#f9f9f9',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#00c1de', marginBottom: 8 }}>
          Shop
        </p>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 28px)', color: '#0a0a0a', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Storie da Raccontare
        </h1>
        <p style={{ fontSize: '14px', color: '#888' }}>
          Crea un account per salvare il carrello e tenere traccia dei tuoi ordini
        </p>
      </div>

      <SignUp
        forceRedirectUrl="/shop"
        signInUrl="/shop/accedi"
        appearance={{
          elements: {
            card: { boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: 16 },
            primaryButton: { background: '#00c1de', fontFamily: 'Poppins, sans-serif', fontWeight: 700 },
            footerActionLink: { color: '#00c1de' },
          },
        }}
      />
    </div>
  )
}

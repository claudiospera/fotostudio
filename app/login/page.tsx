'use client'

import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
    }}>
      <div style={{ animation: 'slideUp 0.3s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '26px',
            letterSpacing: '-0.02em',
            color: 'var(--tx)',
          }}>
            Foto<span style={{ color: 'var(--ac)' }}>Studio</span>
          </h1>
          <p style={{ color: 'var(--t2)', marginTop: '6px', fontSize: '13px' }}>
            Accedi al tuo studio
          </p>
        </div>
        <SignIn forceRedirectUrl="/dashboard" />
      </div>
    </div>
  )
}

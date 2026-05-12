'use client'

import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const { signIn, isLoaded, setActive } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        setError('Verifica richiesta — usa il codice 424242 se sei in sviluppo.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore durante il login'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
    }}>
      <div style={{ animation: 'slideUp 0.3s ease both', width: '100%', maxWidth: '380px' }}>
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

        <form onSubmit={handleSubmit} style={{
          background: 'var(--s1)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--r)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--t2)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="info@esempio.com"
              style={{
                background: 'var(--s2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--r2)',
                padding: '10px 14px',
                color: 'var(--tx)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--t2)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                background: 'var(--s2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--r2)',
                padding: '10px 14px',
                color: 'var(--tx)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--red)', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--ac)',
              color: '#111',
              border: 'none',
              borderRadius: 'var(--r2)',
              padding: '11px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '4px',
            }}
          >
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}

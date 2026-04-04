'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o password non corretti.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
      <div style={{
        width: '100%',
        maxWidth: '380px',
        animation: 'slideUp 0.3s ease both',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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

        {/* Card */}
        <form
          onSubmit={handleLogin}
          style={{
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            borderRadius: 'var(--r)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--t3)', fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="info@claudiofotografo.com"
              required
              autoFocus
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--b1)',
                borderRadius: 'var(--r2)',
                padding: '10px 12px',
                color: 'var(--tx)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--b3)')}
              onBlur={e => (e.target.style.borderColor = 'var(--b1)')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--t3)', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--b1)',
                borderRadius: 'var(--r2)',
                padding: '10px 12px',
                color: 'var(--tx)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--b3)')}
              onBlur={e => (e.target.style.borderColor = 'var(--b1)')}
            />
          </div>

          {error && (
            <p style={{
              color: 'var(--red)',
              fontSize: '13px',
              padding: '8px 12px',
              background: 'rgba(217,112,112,0.1)',
              borderRadius: 'var(--r2)',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              background: loading ? 'var(--s3)' : 'var(--ac)',
              color: loading ? 'var(--t2)' : '#111210',
              border: 'none',
              borderRadius: 'var(--r2)',
              padding: '11px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}

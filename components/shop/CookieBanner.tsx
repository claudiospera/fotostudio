'use client'

// components/shop/CookieBanner.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ necessary: true, analytics: false, marketing: false, date: new Date().toISOString() }))
    setVisible(false)
  }

  function acceptAll() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ necessary: true, analytics: true, marketing: true, date: new Date().toISOString() }))
    setVisible(false)
  }

  function reject() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ necessary: true, analytics: false, marketing: false, date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#fff', borderTop: '1px solid #e0e0e0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
      fontFamily: 'Montserrat, sans-serif',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: 'clamp(16px, 3vw, 24px) clamp(20px, 5vw, 40px)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* Messaggio principale */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0a0a0a', marginBottom: 6 }}>
              🍪 Questo sito utilizza i cookie
            </p>
            <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6 }}>
              Usiamo cookie tecnici necessari al funzionamento del sito (es. carrello).
              Attualmente non utilizziamo cookie analitici o di marketing.{' '}
              <Link href="/shop/cookie-policy" style={{ color: '#00c1de', textDecoration: 'underline' }}>
                Leggi la Cookie Policy
              </Link>
            </p>
          </div>

          {/* Bottoni */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            <button
              onClick={() => setShowDetail(v => !v)}
              style={{
                padding: '9px 16px', borderRadius: 8, border: '1.5px solid #d0d0d0',
                background: '#fff', color: '#555', fontFamily: 'Poppins, sans-serif',
                fontWeight: 600, fontSize: '12px', cursor: 'pointer',
              }}
            >
              Gestisci preferenze
            </button>
            <button
              onClick={reject}
              style={{
                padding: '9px 16px', borderRadius: 8, border: '1.5px solid #d0d0d0',
                background: '#fff', color: '#555', fontFamily: 'Poppins, sans-serif',
                fontWeight: 600, fontSize: '12px', cursor: 'pointer',
              }}
            >
              Solo necessari
            </button>
            <button
              onClick={acceptAll}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: '#00c1de', color: '#fff', fontFamily: 'Poppins, sans-serif',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}
            >
              Accetta tutti
            </button>
          </div>
        </div>

        {/* Dettaglio preferenze */}
        {showDetail && (
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              Dettaglio categorie
            </p>
            {[
              { label: 'Cookie tecnici (necessari)', desc: 'Carrello, sessione, preferenze. Non disattivabili.', locked: true },
              { label: 'Cookie analitici', desc: 'Statistiche di utilizzo anonime. Attualmente non utilizzati.', locked: false },
              { label: 'Cookie marketing', desc: 'Pubblicità personalizzata. Attualmente non utilizzati.', locked: false },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>{item.label}</p>
                  <p style={{ fontSize: '12px', color: '#888' }}>{item.desc}</p>
                </div>
                <div style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: item.locked ? '#00c1de' : '#e0e0e0',
                  display: 'flex', alignItems: 'center',
                  padding: '2px 3px', flexShrink: 0,
                  opacity: item.locked ? 1 : 0.5,
                  cursor: item.locked ? 'default' : 'not-allowed',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    marginLeft: item.locked ? 'auto' : 0,
                    transition: 'margin .2s',
                  }} />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                onClick={accept}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: '#00c1de', color: '#fff', fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                }}
              >
                Salva preferenze
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Funzione esportata per aprire il banner dalle impostazioni del footer
export function resetCookieConsent() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cookie_consent')
    window.location.reload()
  }
}

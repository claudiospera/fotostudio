'use client'

// components/shop/CookieSettingsLink.tsx

export function CookieSettingsLink() {
  return (
    <button
      onClick={() => { localStorage.removeItem('cookie_consent'); window.location.reload() }}
      style={{
        fontSize: '12px', color: '#888', background: 'none',
        border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Montserrat, sans-serif',
      }}
    >
      Gestisci cookie
    </button>
  )
}

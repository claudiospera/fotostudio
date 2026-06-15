'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#333' }}>
          <h2>Qualcosa è andato storto</h2>
          <p style={{ color: '#888' }}>Il problema è stato segnalato automaticamente.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 20px', cursor: 'pointer' }}>
            Ricarica la pagina
          </button>
        </div>
      </body>
    </html>
  )
}

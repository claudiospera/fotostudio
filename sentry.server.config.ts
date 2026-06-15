import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Campiona il 100% degli errori server-side (API routes, SSR)
  tracesSampleRate: 1.0,

  enabled: process.env.NODE_ENV === 'production',
})

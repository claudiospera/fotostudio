import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Cattura il 10% delle sessioni per Session Replay (utile per vedere cosa faceva l'utente prima dell'errore)
  replaysSessionSampleRate: 0.1,
  // Cattura sempre il replay quando c'è un errore
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Non loggare in sviluppo locale
  enabled: process.env.NODE_ENV === 'production',
})

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/cliente(.*)',
  '/api/public(.*)',
  '/api/preventivi-pubblici/(.*)',
  // ── Sito pubblico ──────────────────────────────────────────────────
  '/servizi(.*)',
  '/galleria(.*)',
  '/chi-sono(.*)',
  '/contatti(.*)',
  '/shop(.*)',
  '/link(.*)',
  '/p(.*)',
  '/provino(.*)',
  // ── Admin locale ───────────────────────────────────────────────────
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

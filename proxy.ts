import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/p(.*)',
  '/cliente(.*)',
  '/api/public(.*)',
  '/api/preventivi-pubblici/(.*)',
  '/api/preventivo-sessioni/(.*)',
  '/api/shop/orders',
  '/api/shop/stripe-webhook',
  '/api/shop/presign-photo',
  // Sito pubblico
  '/servizi(.*)',
  '/galleria(.*)',
  '/chi-sono(.*)',
  '/contatti(.*)',
  '/link(.*)',
  '/provino(.*)',
  // Admin locale
  '/admin(.*)',
  '/api/admin(.*)',
  // Shop pubblico — /shop/admin resta protetto
  '/shop',
  '/shop/carrello',
  '/shop/checkout',
  '/shop/ordine-confermato',
  '/shop/stampe(.*)',
  '/shop/decorazioni(.*)',
  '/shop/[categoria](.*)',
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

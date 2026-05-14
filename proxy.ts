import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/cliente(.*)',
  '/api/public(.*)',
  '/api/preventivi-pubblici/(.*)',
  // Shop pubblico — /shop/admin resta protetto (non incluso qui)
  '/shop',
  '/shop/carrello',
  '/shop/:categoria',
  '/shop/:categoria/:prodotto',
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

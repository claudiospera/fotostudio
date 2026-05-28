import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/login',
          '/provino',
          '/link',
          '/shop/accedi',
          '/shop/registrati',
          '/shop/account',
          '/shop/checkout',
          '/shop/carrello',
          '/shop/admin',
        ],
      },
    ],
    sitemap: 'https://storiedaraccontare.it/sitemap.xml',
  }
}

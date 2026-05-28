import type { MetadataRoute } from 'next'
import { WEDDINGS } from './(public)/galleria/matrimoni/real-weddings/_data'

const BASE = 'https://storiedaraccontare.it'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    // Pagine principali
    { url: BASE,                         changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/chi-sono`,           changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/contatti`,           changeFrequency: 'monthly', priority: 0.9 },

    // Servizi
    { url: `${BASE}/servizi`,                                         changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/servizi/matrimoni`,                               changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/servizi/battesimi-prima-infanzia`,                changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/servizi/battesimi-prima-infanzia/battesimi`,      changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/servizi/battesimi-prima-infanzia/compleanni`,     changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/servizi/comunioni-cresime`,                       changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/servizi/maternita-gravidanza`,                    changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/servizi/compleanni-feste`,                        changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/servizi/ritratti-famiglie`,                       changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/servizi/shooting-studio`,                         changeFrequency: 'monthly', priority: 0.6 },

    // Galleria
    { url: `${BASE}/galleria`,                                        changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/galleria/matrimoni`,                              changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/galleria/matrimoni/real-weddings`,                changeFrequency: 'weekly',  priority: 0.7 },

    // Shop
    { url: `${BASE}/shop`,                                            changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/shop/stampe`,                                     changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shop/stampe/stampe-classiche`,                    changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shop/stampe/poster`,                              changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shop/stampe/hahnemuhle`,                          changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shop/stampe/instax`,                              changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shop/decorazioni/tela`,                           changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shop/decorazioni/cornici`,                        changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shop/decorazioni/forex`,                          changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shop/gadget`,                                     changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shop/composizioni`,                               changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Real Weddings — pagine dinamiche
  const weddingRoutes: MetadataRoute.Sitemap = WEDDINGS.map(w => ({
    url: `${BASE}/galleria/matrimoni/real-weddings/${w.slug}`,
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...weddingRoutes]
}

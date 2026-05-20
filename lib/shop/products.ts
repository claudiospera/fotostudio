// lib/shop/products.ts
// Prezzi da listino DiLand. Tutti i valori in centesimi di euro.

import type { Product, PriceBreak } from './types'

// Scaglioni riutilizzabili ─────────────────────────────────────────────────

const breaks10x15: PriceBreak[] = [
  { minQty: 1,   price: 200 },
  { minQty: 2,   price: 150 },
  { minQty: 6,   price:  90 },
  { minQty: 11,  price:  80 },
  { minQty: 21,  price:  70 },
  { minQty: 31,  price:  60 },
  { minQty: 51,  price:  50 },
  { minQty: 71,  price:  35 },
  { minQty: 91,  price:  30 },
  { minQty: 200, price:  25 },
  { minQty: 500, price:  20 },
]

const breaks13x18: PriceBreak[] = [
  { minQty: 1,   price: 250 },
  { minQty: 2,   price: 200 },
  { minQty: 6,   price: 150 },
  { minQty: 11,  price: 120 },
  { minQty: 21,  price: 110 },
  { minQty: 31,  price:  90 },
  { minQty: 51,  price:  80 },
  { minQty: 71,  price:  70 },
  { minQty: 91,  price:  50 },
  { minQty: 200, price:  40 },
  { minQty: 500, price:  30 },
]

const breaks15x20: PriceBreak[] = [
  { minQty: 1,   price: 300 },
  { minQty: 2,   price: 250 },
  { minQty: 11,  price: 220 },
  { minQty: 31,  price: 200 },
  { minQty: 51,  price: 180 },
  { minQty: 100, price: 150 },
  { minQty: 300, price: 100 },
]

// 13x9: come 10x15 ma senza lo scaglione da 6
const breaks13x9: PriceBreak[] = [
  { minQty: 1,   price: 200 },
  { minQty: 2,   price: 150 },
  { minQty: 11,  price:  80 },
  { minQty: 21,  price:  70 },
  { minQty: 31,  price:  60 },
  { minQty: 51,  price:  50 },
  { minQty: 71,  price:  35 },
  { minQty: 91,  price:  30 },
  { minQty: 200, price:  25 },
  { minQty: 500, price:  20 },
]

const breaksInstax: PriceBreak[] = [
  { minQty:   1, price: 200 },
  { minQty:   2, price: 150 },
  { minQty:  11, price:  80 },
  { minQty:  21, price:  70 },
  { minQty:  31, price:  60 },
  { minQty:  51, price:  50 },
  { minQty:  71, price:  35 },
  { minQty:  91, price:  30 },
  { minQty: 200, price:  25 },
  { minQty: 500, price:  20 },
]

// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [

  // ─── STAMPE ───────────────────────────────────────────────────────────────

  {
    id: 'stampe-classiche',
    slug: 'stampe-classiche',
    name: 'Stampe Classiche',
    shortDescription: 'Stampe fotografiche nei formati più richiesti, con prezzi a volume',
    description:
      'Stampe fotografiche professionali su carta fotografica di alta qualità. ' +
      'Più stampe ordini, meno paghi: il prezzo unitario scende automaticamente in base alla quantità.',
    category: 'stampe',
    status: 'available',
    images: ['/images/shop/stampe/classiche.png'],
    variants: [
      {
        id: 'sc-10x15',
        label: '10×15 cm',
        price: 200,
        priceBreaks: breaks10x15,
      },
      {
        id: 'sc-13x18',
        label: '13×18 cm',
        price: 250,
        priceBreaks: breaks13x18,
      },
      {
        id: 'sc-13x19',
        label: '13×19 cm',
        price: 250,
        priceBreaks: breaks13x18,
      },
      {
        id: 'sc-15x15',
        label: '15×15 cm',
        price: 250,
        priceBreaks: breaks13x18,
      },
      {
        id: 'sc-15x20',
        label: '15×20 cm',
        price: 300,
        priceBreaks: breaks15x20,
      },
      {
        id: 'sc-15x23',
        label: '15×23 cm',
        price: 300,
        priceBreaks: breaks15x20,
      },
      {
        id: 'sc-13x9',
        label: '13×9 cm',
        price: 200,
        priceBreaks: breaks13x9,
      },
    ],
    featured: true,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'stampe-instax',
    slug: 'instax',
    name: 'Stampa Instax / Polaroid',
    shortDescription: 'Formato Instax Mini, Square e Wide con prezzi a volume',
    description:
      'Stampe nel formato Instax originale: Mini (54×86 mm), Square (62×62 mm) e Wide (99×62 mm). ' +
      'Perfette come ricordo da regalare o da esporre in una galleria fotografica.',
    category: 'stampe',
    status: 'available',
    images: ['/images/shop/stampe/instax.png'],
    variants: [
      {
        id: 'pol-mini',
        label: 'Instax Mini (54×86 mm)',
        price: 200,
        priceBreaks: breaksInstax,
      },
      {
        id: 'pol-square',
        label: 'Instax Square (62×62 mm)',
        price: 200,
        priceBreaks: breaksInstax,
      },
      {
        id: 'pol-wide',
        label: 'Instax Wide (99×62 mm)',
        price: 200,
        priceBreaks: breaksInstax,
      },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'hahnemuhle',
    slug: 'hahnemuhle',
    name: 'Stampa Fine Art Hahnemühle',
    shortDescription: 'Stampa su carta Fine Art 100% cotone: Photo Rag, Museum Etching, Matt Baryta, Matte FineArt',
    description:
      'Stampa professionale su carta Fine Art Hahnemühle 100% cotone. ' +
      'Quattro tipi di carta tra cui scegliere: Photo Rag 308, Museum Etching 350, Photo Rag Matt Baryta 308 e Matte FineArt 200. ' +
      'Disponibile in 25 formati fino al 60×90 cm.',
    category: 'stampe',
    status: 'available',
    images: ['/images/shop/hahnemuhle/catalogo.jpg'],
    thumbnailImage: '/images/shop/hahnemuhle/catalogo.jpg',
    variants: [
      // prezzo minimo = Matte FineArt 10x15 = €4.00
      { id: 'hah-10x15', label: '10×15 cm', price: 400, widthCm: 10, heightCm: 15 },
    ],
    featured: true,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'poster',
    slug: 'poster',
    name: 'Poster',
    shortDescription: 'Grandi formati per un impatto visivo massimo',
    description:
      'Poster fotografici nei formati grandi, ideali per decorare pareti. Stampa su carta fotografica ad alta definizione.',
    category: 'stampe',
    status: 'available',
    images: ['/images/shop/stampe/poster.jpg'],
    variants: [
      { id: 'pos-20x30', label: '20×30 cm', price:  600 },
      { id: 'pos-24x30', label: '24×30 cm', price:  700 },
      { id: 'pos-30x30', label: '30×30 cm', price:  800 },
      { id: 'pos-30x40', label: '30×40 cm', price: 1000 },
      { id: 'pos-30x45', label: '30×45 cm', price: 1200 },
      { id: 'pos-36x42', label: '36×42 cm', price: 1200 },
      { id: 'pos-40x40', label: '40×40 cm', price: 1600 },
      { id: 'pos-35x50', label: '35×50 cm', price: 1600 },
      { id: 'pos-40x50', label: '40×50 cm', price: 1700 },
      { id: 'pos-40x60', label: '40×60 cm', price: 1900 },
      { id: 'pos-50x50', label: '50×50 cm', price: 2000 },
      { id: 'pos-50x60', label: '50×60 cm', price: 2300 },
      { id: 'pos-50x70', label: '50×70 cm', price: 2500 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  // ─── DECORAZIONI ──────────────────────────────────────────────────────────

  {
    id: 'tela',
    slug: 'tela',
    name: 'Stampa su Tela',
    shortDescription: 'Le tue foto stampate su tela con telaio in legno',
    description:
      'Stampa fotografica su tela canvas con telaio in legno di pino. ' +
      'Effetto pittorico elegante, pronta da appendere.',
    category: 'decorazioni',
    status: 'available',
    images: ['/images/shop/tela/catalogo.jpg', '/images/shop/tela/interno.png'],
    variants: [
      { id: 'tel-30x30',  label: '30×30 cm',  price:  3000 },
      { id: 'tel-30x40',  label: '30×40 cm',  price:  3500 },
      { id: 'tel-30x50',  label: '30×50 cm',  price:  4000 },
      { id: 'tel-40x40',  label: '40×40 cm',  price:  4000 },
      { id: 'tel-40x50',  label: '40×50 cm',  price:  4500 },
      { id: 'tel-40x60',  label: '40×60 cm',  price:  4700 },
      { id: 'tel-50x70',  label: '50×70 cm',  price:  6000 },
      { id: 'tel-70x100', label: '70×100 cm', price: 10000 },
    ],
    featured: true,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'forex',
    slug: 'forex',
    name: 'Stampa su Forex',
    shortDescription: 'Stampa rigida su pannello in forex 5mm',
    description:
      'Stampa fotografica su pannello in forex (PVC espanso) da 5mm. Effetto moderno e minimalista, leggerissima e pronta da appendere.',
    category: 'decorazioni',
    status: 'available',
    images: ['/images/shop/forex/ambientata.png', '/images/shop/forex/catalogo.png'],
    thumbnailImage: '/images/shop/forex/catalogo.png',
    variants: [
      { id: 'fx-15x20', label: '15×20 cm', price: 1000, widthCm: 15, heightCm: 20 },
      { id: 'fx-20x30', label: '20×30 cm', price: 2000, widthCm: 20, heightCm: 30 },
      { id: 'fx-30x30', label: '30×30 cm', price: 2500, widthCm: 30, heightCm: 30 },
      { id: 'fx-30x40', label: '30×40 cm', price: 3000, widthCm: 30, heightCm: 40 },
      { id: 'fx-30x50', label: '30×50 cm', price: 3500, widthCm: 30, heightCm: 50 },
      { id: 'fx-40x40', label: '40×40 cm', price: 3500, widthCm: 40, heightCm: 40 },
      { id: 'fx-40x50', label: '40×50 cm', price: 4000, widthCm: 40, heightCm: 50 },
      { id: 'fx-40x60', label: '40×60 cm', price: 4200, widthCm: 40, heightCm: 60 },
      { id: 'fx-50x50', label: '50×50 cm', price: 4500, widthCm: 50, heightCm: 50 },
      { id: 'fx-50x60', label: '50×60 cm', price: 4700, widthCm: 50, heightCm: 60 },
      { id: 'fx-50x70', label: '50×70 cm', price: 5000, widthCm: 50, heightCm: 70 },
    ],
    featured: true,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'cornici',
    slug: 'cornici',
    name: 'Foto in Cornice',
    shortDescription: 'La tua foto incorniciata, pronta da appendere o regalare',
    description:
      'La tua foto stampata e incorniciata, pronta da appendere. Scegli la cornice, il tipo di carta e il passepartout.',
    category: 'decorazioni',
    status: 'available',
    images: ['/images/shop/stampe/cornici.png'],
    variants: [
      { id: '10x15', label: '10×15 cm', price: 1500, widthCm: 10, heightCm: 15 },
      { id: '13x18', label: '13×18 cm', price: 1800, widthCm: 13, heightCm: 18 },
      { id: '15x20', label: '15×20 cm', price: 2200, widthCm: 15, heightCm: 20 },
      { id: '20x30', label: '20×30 cm', price: 2800, widthCm: 20, heightCm: 30 },
      { id: '30x40', label: '30×40 cm', price: 3800, widthCm: 30, heightCm: 40 },
    ],
    featured: true,
    createdAt: '2026-01-01T00:00:00Z',
    options: {
      frames: [
        { id: 'bianco',      label: 'Bianco',         color: '#FFFFFF', border: '#d0d0d0' },
        { id: 'nero',        label: 'Nero',           color: '#1a1a1a', border: '#000000' },
        { id: 'oak',         label: 'Oak',            color: '#C19A6B', border: '#A0784A' },
        { id: 'argentato',   label: 'Argentato',      color: '#C0C0C0', border: '#A8A8A8' },
        { id: 'dorato',      label: 'Dorato',         color: '#D4AF37', border: '#B8960C' },
        { id: 'marrone-oro', label: 'Marrone Dorato', color: '#5C3A1E', border: '#D4AF37' },
      ],
      printTypes: [
        { id: 'foto',       label: 'Carta Fotografica',      description: 'Lucida, colori brillanti',   extraPrice:   0 },
        { id: 'hahnemuhle', label: 'Hahnemühle Matt Fibre',  description: 'Fine art, opaca, premium',   extraPrice: 800 },
      ],
      passepartout: [
        { id: 'none',  label: 'Senza passepartout', color: undefined,   extraPrice:   0 },
        { id: 'bianco', label: 'Passepartout Bianco', color: '#FFFFFF', extraPrice: 500 },
        { id: 'nero',   label: 'Passepartout Nero',  color: '#1a1a1a',  extraPrice: 500 },
      ],
    },
  },

  // ─── GADGET ───────────────────────────────────────────────────────────────

  {
    id: 'cuscino',
    slug: 'cuscino',
    name: 'Cuscino Personalizzato',
    shortDescription: 'Cuscino 40×40 cm con la tua foto',
    description: 'Cuscino in pile 40×40 cm con stampa fotografica personalizzata. Include imbottitura.',
    category: 'gadget',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80'],
    variants: [
      { id: 'cus-40x40', label: '40×40 cm', price: 2500 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'puzzle',
    slug: 'puzzle',
    name: 'Puzzle Fotografico',
    shortDescription: 'Puzzle personalizzato con la tua foto — tessera tradizionale o grande',
    description:
      'Puzzle fotografico personalizzato su cartone rigido. ' +
      'Scegli tra tessera tradizionale (più piccola) e tessera grande (pezzi grandi, ideale per bambini). ' +
      'Disponibile in tre formati con numero di pezzi variabile.',
    category: 'gadget',
    status: 'available',
    images: ['/images/shop/gadget/puzzle.png'],
    variants: [
      { id: 'puz-trad-13x18', label: 'Tradizionale 13×18 cm — 48 pezzi',  price: 1200 },
      { id: 'puz-trad-20x30', label: 'Tradizionale 20×30 cm — 192 pezzi', price: 2000 },
      { id: 'puz-trad-30x40', label: 'Tradizionale 30×40 cm — 384 pezzi', price: 2800 },
      { id: 'puz-gran-20x30', label: 'Grande 20×30 cm — 48 pezzi',        price: 2000 },
      { id: 'puz-gran-30x40', label: 'Grande 30×40 cm — 96 pezzi',        price: 2800 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'tazza',
    slug: 'tazza',
    name: 'Tazza Bianca Personalizzata',
    shortDescription: 'Tazza in ceramica con la tua foto',
    description: 'Tazza in ceramica bianca da 325ml con stampa fotografica personalizzata. Lavabile in lavastoviglie.',
    category: 'gadget',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1572119865084-43c285814d63?w=800&q=80'],
    variants: [
      { id: 'taz-bianca', label: 'Tazza bianca', price: 1500 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'salvadanaio',
    slug: 'salvadanaio',
    name: 'Salvadanaio Personalizzato',
    shortDescription: 'Salvadanaio in ceramica con la tua foto',
    description: 'Salvadanaio in ceramica con stampa fotografica personalizzata. Originale idea regalo.',
    category: 'gadget',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80'],
    variants: [
      { id: 'sal-std', label: 'Standard', price: 1500 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'borraccia-inox',
    slug: 'borraccia-inox',
    name: 'Borraccia Inox Sport',
    shortDescription: 'Borraccia in acciaio inox 600ml con la tua foto',
    description:
      'Borraccia sportiva in acciaio inox a doppia parete da 600ml con stampa fotografica personalizzata. ' +
      'Mantiene le bevande fredde fino a 24h e calde fino a 12h.',
    category: 'gadget',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1589365278144-c9e705f843ba?w=800&q=80'],
    variants: [
      { id: 'bor-inox-600', label: '600ml', price: 1500 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'portachiavi',
    slug: 'portachiavi',
    name: 'Portachiavi Plexilite',
    shortDescription: 'Portachiavi in plexilite con la tua foto',
    description: 'Portachiavi in plexilite trasparente con stampa fotografica. Robusto e leggero, ottimo come ricordino.',
    category: 'gadget',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80'],
    variants: [
      { id: 'por-plexi', label: 'Plexilite', price: 1000 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'tappetino-mouse',
    slug: 'tappetino-mouse',
    name: 'Tappetino Mouse Personalizzato',
    shortDescription: 'Tappetino mouse rettangolare con la tua foto',
    description: 'Tappetino mouse rettangolare con base in gomma antiscivolo e superficie in tessuto. Stampa fotografica ad alta risoluzione.',
    category: 'gadget',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=800&q=80'],
    variants: [
      { id: 'tap-rett', label: 'Rettangolare', price: 1300 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'pannello',
    slug: 'pannello',
    name: 'Pannello 30×40',
    shortDescription: 'Pannello fotografico rigido 30×40 cm',
    description: 'Pannello fotografico rigido 30×40 cm. Stampa ad alta qualità su supporto rigido, ideale come decorazione da appoggiare o appendere.',
    category: 'gadget',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80'],
    variants: [
      { id: 'pan-30x40', label: '30×40 cm', price: 3000 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
]

// ─── Helper ───────────────────────────────────────────────────────────────

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug)
}

export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter((p) => p.category === category && p.status !== 'discontinued')
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.featured && p.status === 'available')
}

/**
 * Restituisce il prezzo unitario corretto dato una variante e una quantità.
 * Se la variante non ha priceBreaks, restituisce sempre il price base.
 */
export function getPriceForQuantity(
  variantPrice: number,
  priceBreaks: PriceBreak[] | undefined,
  qty: number
): number {
  if (!priceBreaks || priceBreaks.length === 0) return variantPrice
  // Scaglioni ordinati decrescenti per minQty: prendo il primo che si applica
  const sorted = [...priceBreaks].sort((a, b) => b.minQty - a.minQty)
  const match = sorted.find((b) => qty >= b.minQty)
  return match ? match.price : variantPrice
}

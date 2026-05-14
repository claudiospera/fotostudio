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

// Instax (tutti i formati): stesso listino del 13x9
const breaksInstax: PriceBreak[] = breaks13x9

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
    images: ['https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=800&q=80'],
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
    slug: 'stampe-polaroid',
    name: 'Stampa Instax / Polaroid',
    shortDescription: 'Formato Instax Mini, Square e Wide con prezzi a volume',
    description:
      'Stampe nel formato Instax originale: Mini (54×86 mm), Square (62×62 mm) e Wide (99×62 mm). ' +
      'Perfette come ricordo da regalare o da esporre in una galleria fotografica.',
    category: 'stampe',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80'],
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
    id: 'poster',
    slug: 'poster',
    name: 'Poster',
    shortDescription: 'Grandi formati per un impatto visivo massimo',
    description:
      'Poster fotografici nei formati grandi, ideali per decorare pareti. Stampa su carta fotografica ad alta definizione.',
    category: 'stampe',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=800&q=80'],
    variants: [
      { id: 'pos-20x30',  label: '20×30 cm',  price:  600 },
      { id: 'pos-30x40',  label: '30×40 cm',  price: 1000 },
      { id: 'pos-30x45',  label: '30×45 cm',  price: 1200 },
      { id: 'pos-40x50',  label: '40×50 cm',  price: 1700 },
      { id: 'pos-40x60',  label: '40×60 cm',  price: 1900 },
      { id: 'pos-50x60',  label: '50×60 cm',  price: 2300 },
      { id: 'pos-50x70',  label: '50×70 cm',  price: 2500 },
      { id: 'pos-70x100', label: '70×100 cm', price: 5000 },
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
    images: ['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80'],
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
    images: ['https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=800&q=80'],
    variants: [
      { id: 'fx-20x30', label: '20×30 cm', price: 0 },
      { id: 'fx-30x40', label: '30×40 cm', price: 0 },
      { id: 'fx-40x60', label: '40×60 cm', price: 0 },
      { id: 'fx-50x70', label: '50×70 cm', price: 0 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'cornici',
    slug: 'cornici',
    name: 'Foto in Cornice',
    shortDescription: 'Stampa + cornice, pronta da regalare o appendere',
    description:
      'Stampa fotografica montata in cornice in legno. Disponibile con o senza passepartout. Colori cornice: nero, bianco, legno naturale.',
    category: 'decorazioni',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=800&q=80'],
    variants: [
      { id: 'cor-10x15-no', label: '10×15 cm — senza passepartout', price: 0 },
      { id: 'cor-10x15-si', label: '10×15 cm — con passepartout',   price: 0 },
      { id: 'cor-13x18-no', label: '13×18 cm — senza passepartout', price: 0 },
      { id: 'cor-13x18-si', label: '13×18 cm — con passepartout',   price: 0 },
      { id: 'cor-15x20-no', label: '15×20 cm — senza passepartout', price: 0 },
      { id: 'cor-15x20-si', label: '15×20 cm — con passepartout',   price: 0 },
      { id: 'cor-20x30-no', label: '20×30 cm — senza passepartout', price: 0 },
      { id: 'cor-20x30-si', label: '20×30 cm — con passepartout',   price: 0 },
      { id: 'cor-30x40-no', label: '30×40 cm — senza passepartout', price: 0 },
      { id: 'cor-30x40-si', label: '30×40 cm — con passepartout',   price: 0 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
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
    shortDescription: 'Puzzle personalizzato con la tua foto, vari formati',
    description: 'Puzzle fotografico personalizzato su cartone rigido. Disponibile in tre formati.',
    category: 'gadget',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1585373683920-671438c82bfa?w=800&q=80'],
    variants: [
      { id: 'puz-13x18', label: '13×18 cm', price: 1200 },
      { id: 'puz-20x30', label: '20×30 cm', price: 2000 },
      { id: 'puz-30x40', label: '30×40 cm', price: 2800 },
    ],
    featured: false,
    createdAt: '2026-01-01T00:00:00Z',
  },

  {
    id: 'puzzle-bimbo',
    slug: 'puzzle-bimbo',
    name: 'Puzzle Bimbo (pezzi grandi)',
    shortDescription: 'Puzzle con pezzi grandi, ideale per i più piccoli',
    description: 'Puzzle fotografico con pezzi grandi, pensato per bambini. Cartone rigido, facile da maneggiare.',
    category: 'gadget',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1585373683920-671438c82bfa?w=800&q=80'],
    variants: [
      { id: 'puzb-20x30', label: '20×30 cm', price: 2000 },
      { id: 'puzb-30x40', label: '30×40 cm', price: 2800 },
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

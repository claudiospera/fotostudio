// lib/shop/types.ts

export type ProductStatus = 'available' | 'sold_out' | 'discontinued'
export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled'
export type PaymentMethod = 'online' | 'studio'
export type ProductCategory = 'stampe' | 'decorazioni' | 'gadget'

// Scaglione di prezzo per quantità (stampe con listino a volume)
export interface PriceBreak {
  minQty: number  // quantità minima per applicare questo prezzo
  price: number   // prezzo unitario in centesimi
}

export interface ProductVariant {
  id: string
  label: string         // es. "30x40 cm", "A4", "Digitale HD"
  price: number         // prezzo unitario base (da 1 pz) in centesimi
  priceBreaks?: PriceBreak[]  // scaglioni volume — se assente, prezzo fisso
  stock?: number        // undefined = illimitato
  // dimensioni fisiche (cm) — usate per calcolare l'aspect ratio nell'anteprima
  widthCm?: number
  heightCm?: number
  // dimensioni esterne (es. Instax: card intera con bordo)
  outerW?: number
  outerH?: number
  // padding bordo [top, right, bottom, left] in cm — per prodotti con cornice (Instax)
  pad?: [number, number, number, number]
}

// Opzioni configuratore cornici ──────────────────────────────────────────────

export interface FrameOption {
  id: string
  label: string
  color: string   // CSS color per il swatch della cornice
  border: string  // CSS color per il contorno del swatch
}

export interface PrintTypeOption {
  id: string
  label: string
  description: string
  extraPrice: number  // in centesimi (aggiuntivo al prezzo base variante)
}

export interface PassepartoutOption {
  id: string
  label: string
  color?: string      // CSS color (undefined per 'none')
  extraPrice: number  // in centesimi
}

export interface ProductOptions {
  frames?: FrameOption[]
  printTypes?: PrintTypeOption[]
  passepartout?: PassepartoutOption[]
}

// ─────────────────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  shortDescription: string
  category: ProductCategory
  status: ProductStatus
  images: string[]         // URLs — images[0] usata nella scheda prodotto
  thumbnailImage?: string  // se presente, usata al posto di images[0] nella card categoria
  variants: ProductVariant[]
  featured: boolean
  createdAt: string
  options?: ProductOptions  // configuratore avanzato (es. cornici)
  maskUrl?: string          // PNG trasparente sovrapposto all'anteprima (gadget a forma speciale)
}

export interface CartItem {
  productId: string
  variantId: string
  quantity: number
  // snapshot al momento dell'aggiunta
  productName: string
  variantLabel: string
  price: number       // in centesimi
  image: string
  filename?: string   // nome originale del file caricato dal cliente
  notes?: string      // info aggiuntive libere (es. URL retro portachiavi, colore scelto)
}

export interface Cart {
  items: CartItem[]
  updatedAt: string
}

export interface OrderItem {
  productId: string
  variantId: string
  productName: string
  variantLabel: string
  price: number
  quantity: number
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  notes?: string
}

export interface Order {
  id: string
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: 'unpaid' | 'paid'
  customer: CustomerInfo
  items: OrderItem[]
  total: number       // in centesimi
  stripe_session_id?: string
  createdAt: string
  updatedAt: string
}

export type CategoryMeta = {
  slug: ProductCategory
  label: string
  description: string
}

export const CATEGORY_META: Record<ProductCategory, CategoryMeta> = {
  stampe: {
    slug: 'stampe',
    label: 'Stampe',
    description: 'Stampe classiche, polaroid e poster su carta fotografica premium',
  },
  decorazioni: {
    slug: 'decorazioni',
    label: 'Decorazioni',
    description: 'Stampe su tela, forex e foto in cornice per arredare con le tue foto',
  },
  gadget: {
    slug: 'gadget',
    label: 'Gadget',
    description: 'Borracce personalizzate, tazze, cuscini e altri gadget fotografici',
  },
}

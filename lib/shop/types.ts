// lib/shop/types.ts

export type ProductStatus = 'available' | 'sold_out' | 'discontinued'
export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentMethod = 'online' | 'studio'
export type DeliveryMethod = 'pickup' | 'shipping'
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
  // crop data (set when the customer has repositioned/zoomed the photo)
  cropX?: number       // 0–100, horizontal center of crop
  cropY?: number       // 0–100, vertical center of crop
  cropZoom?: number    // zoom factor
  formatLabel?: string // e.g. "10×15 cm" for ratio computation
  frameLabel?: string  // for instax: frame design label
  instaxText?: string        // for instax: bottom text label
  instaxLabelColor?: string  // for instax: text color (hex)
  instaxLabelFont?: string   // for instax: CSS font-family string
  // calendari 2027 — riga a scaglione (1ª copia prezzo pieno, successive scontate)
  kind?: 'calendar'
  modelCode?: string    // es. "C2830"
  calendarFormat?: string // es. "foglio_30x45" — serve a ricalcolare lineTotal quando cambia quantity
  photoKeys?: string[]  // chiavi R2 delle foto cliente (tmp finché l'ordine non è confermato)
  photoUrls?: string[]  // URL pubblici delle stesse foto, solo per mostrare le miniature nel carrello/admin
  note?: string
  lineTotal?: number    // totale riga già calcolato — bypassa price*quantity (vedi getLineTotal)
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

export interface ShippingAddress {
  recipientName: string
  address: string
  zip: string          // CAP italiano, 5 cifre
  city: string
  province: string      // sigla provincia, 2 lettere
  phone: string
  intercomNote?: string // note per il citofono
}

export interface Order {
  id: string
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: 'unpaid' | 'paid'
  customer: CustomerInfo
  items: OrderItem[]
  delivery_method: DeliveryMethod
  shipping_cost: number           // in centesimi
  shipping_address?: ShippingAddress | null
  tracking_number?: string | null
  total: number       // in centesimi — subtotale - sconto + shipping_cost
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

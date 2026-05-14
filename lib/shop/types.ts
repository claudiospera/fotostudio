// lib/shop/types.ts

export type ProductStatus = 'available' | 'sold_out' | 'discontinued'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
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
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  shortDescription: string
  category: ProductCategory
  status: ProductStatus
  images: string[]    // URLs
  variants: ProductVariant[]
  featured: boolean
  createdAt: string
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
  phone?: string
  address?: {
    street: string
    city: string
    zip: string
    province: string
  }
}

export interface Order {
  id: string
  status: OrderStatus
  customer: CustomerInfo
  items: OrderItem[]
  subtotal: number    // in centesimi
  shipping: number    // in centesimi
  total: number       // in centesimi
  notes?: string
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

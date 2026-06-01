// app/api/shop-products/route.ts
// Espone il catalogo prodotti dello shop al portale cliente.
// Non richiede autenticazione — è un endpoint pubblico.

import { NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/shop/products'

export async function GET() {
  const available = PRODUCTS.filter(p => p.status === 'available')
  return NextResponse.json(available)
}

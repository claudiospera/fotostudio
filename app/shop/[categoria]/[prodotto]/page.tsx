'use client'

// app/shop/[categoria]/[prodotto]/page.tsx
// Pagina singolo prodotto

import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getProductBySlug } from '@/lib/shop/products'
import { CATEGORY_META, type ProductCategory, type ProductVariant } from '@/lib/shop/types'
import { useCart } from '@/components/shop/CartProvider'

interface Props {
  params: Promise<{ categoria: string; prodotto: string }>
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
    cents / 100
  )
}

export default function ProductPage({ params }: Props) {
  const { categoria, prodotto } = use(params)
  const product = getProductBySlug(prodotto)
  const { addItem } = useCart()

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product?.variants[0] ?? null
  )
  const [added, setAdded] = useState(false)

  if (!product || product.category !== (categoria as ProductCategory)) notFound()

  // Dopo notFound(), product è garantito non-undefined per TS
  const safeProduct = product
  const categoryMeta = CATEGORY_META[safeProduct.category]

  function handleAddToCart() {
    if (!selectedVariant) return
    addItem({
      productId: safeProduct.id,
      variantId: selectedVariant.id,
      quantity: 1,
      productName: safeProduct.name,
      variantLabel: selectedVariant.label,
      price: selectedVariant.price,
      image: safeProduct.images[0] ?? '',
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-gray-400">
        <a href="/shop" className="hover:text-gray-700">Shop</a>
        <span>/</span>
        <a href={`/shop/${categoria}`} className="hover:text-gray-700">{categoryMeta.label}</a>
        <span>/</span>
        <span className="text-gray-600">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Immagine */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-300">
              Nessuna immagine
            </div>
          )}
        </div>

        {/* Dettagli */}
        <div className="flex flex-col">
          <span className="mb-2 text-xs uppercase tracking-widest text-gray-400">
            {categoryMeta.label}
          </span>
          <h1 className="mb-3 text-3xl font-semibold text-gray-900">{product.name}</h1>
          <p className="mb-6 text-gray-500">{product.description}</p>

          {/* Varianti */}
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-gray-700">Formato / Opzione</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`rounded border px-4 py-2 text-sm transition-colors ${
                    selectedVariant?.id === v.id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-500'
                  }`}
                >
                  {v.label}
                  <span className="ml-2 text-xs opacity-70">{formatPrice(v.price)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prezzo selezionato */}
          {selectedVariant && (
            <p className="mb-6 text-2xl font-semibold text-gray-900">
              {formatPrice(selectedVariant.price)}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || product.status === 'sold_out'}
            className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {product.status === 'sold_out'
              ? 'Esaurito'
              : added
              ? 'Aggiunto al carrello ✓'
              : 'Aggiungi al carrello'}
          </button>
        </div>
      </div>
    </div>
  )
}

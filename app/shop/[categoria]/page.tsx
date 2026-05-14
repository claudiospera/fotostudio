// app/shop/[categoria]/page.tsx

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProductsByCategory } from '@/lib/shop/products'
import { CATEGORY_META, type ProductCategory } from '@/lib/shop/types'
import { ProductCard } from '@/components/shop/ProductCard'
import Link from 'next/link'

interface Props {
  params: Promise<{ categoria: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params
  const meta = CATEGORY_META[categoria as ProductCategory]
  if (!meta) return {}
  return { title: meta.label, description: meta.description }
}

export function generateStaticParams() {
  return Object.keys(CATEGORY_META).map((slug) => ({ categoria: slug }))
}

export default async function CategoryPage({ params }: Props) {
  const { categoria } = await params
  const meta = CATEGORY_META[categoria as ProductCategory]
  if (!meta) notFound()

  const products = getProductsByCategory(categoria)

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* Header categoria */}
      <div style={{
        background: 'var(--n-surface)',
        borderBottom: '1px solid var(--n-border)',
        padding: 'clamp(36px, 5vw, 64px) clamp(24px, 5vw, 60px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '12px', color: 'var(--n-t3)' }}>
            <Link href="/shop" style={{ color: 'var(--n-t2)', textDecoration: 'none' }}>Shop</Link>
            <span>/</span>
            <span style={{ color: 'var(--n-tx)', fontWeight: 600 }}>{meta.label}</span>
          </div>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 800,
            fontSize: 'clamp(26px, 4vw, 44px)', color: 'var(--n-tx)',
            letterSpacing: '-0.025em', marginBottom: 10,
          }}>
            {meta.label}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--n-t2)', maxWidth: 540 }}>{meta.description}</p>
        </div>
      </div>

      {/* Prodotti */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 60px)' }}>
        {products.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: 'var(--n-t3)', fontSize: '15px',
          }}>
            Nessun prodotto disponibile in questa categoria.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

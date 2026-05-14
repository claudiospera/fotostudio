// app/shop/admin/page.tsx
// Dashboard Admin Shop — protetta da Clerk

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, ExternalLink } from 'lucide-react'

export default async function ShopAdminPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', minHeight: '100vh', background: '#f3f3f3' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 clamp(24px, 5vw, 48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              href="/dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: '13px', fontWeight: 500, color: '#555',
                textDecoration: 'none', padding: '6px 12px',
                borderRadius: 8, border: '1px solid #e8e8e8',
                background: '#fff', transition: 'all .15s',
              }}
            >
              <ArrowLeft size={14} />
              Torna al CRM
            </Link>
            <span style={{ color: '#e8e8e8' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} color="#00c1de" />
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0a0a0a' }}>
                Admin Shop
              </span>
            </div>
          </div>
          <Link
            href="/shop"
            target="_blank"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '12px', fontWeight: 600, color: '#00c1de',
              textDecoration: 'none',
            }}
          >
            Vai allo shop
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* Contenuto */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) clamp(24px, 5vw, 48px)' }}>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Ordini totali',    value: '—' },
            { label: 'Fatturato',        value: '—' },
            { label: 'Ordini in attesa', value: '—' },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: '#fff', border: '1px solid #e8e8e8',
              borderRadius: 16, padding: '24px 20px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
                {kpi.label}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: '#0a0a0a' }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Ordini recenti */}
        <div style={{
          background: '#fff', border: '1px solid #e8e8e8',
          borderRadius: 16, overflow: 'hidden', marginBottom: 24,
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e8e8e8',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0a0a0a', margin: 0 }}>
              Ordini recenti
            </h2>
            <Link
              href="/shop/admin/ordini"
              style={{ fontSize: '12px', fontWeight: 600, color: '#00c1de', textDecoration: 'none' }}
            >
              Vedi tutti →
            </Link>
          </div>
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: 12 }}>📦</div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#555', marginBottom: 6 }}>
              Nessun ordine ancora
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              Gli ordini appariranno qui dopo l&apos;integrazione con Supabase.
            </p>
          </div>
        </div>

        {/* Azioni rapide */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/shop/admin/ordini"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#00c1de', color: '#fff',
              borderRadius: 10, padding: '11px 22px',
              fontSize: '13px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            <ShoppingBag size={14} />
            Gestisci ordini
          </Link>
          <Link
            href="/shop"
            target="_blank"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#fff', color: '#555',
              border: '1px solid #e8e8e8',
              borderRadius: 10, padding: '11px 22px',
              fontSize: '13px', fontWeight: 500, textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} />
            Vai allo shop
          </Link>
        </div>
      </div>
    </div>
  )
}

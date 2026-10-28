'use client'

// app/shop/calendari/page.tsx — Catalogo Calendari fotografici 2027

import { useEffect, useMemo, useState } from 'react'
import { CalendarModelCard, type CalendarModelSummary } from '@/components/shop/CalendarModelCard'

interface ModelsResponse {
  items: CalendarModelSummary[]
  settings: { bannerText: string | null; bannerDate: string | null }
}

export default function CalendariCatalogoPage() {
  const [data, setData] = useState<ModelsResponse | null>(null)
  const [category, setCategory] = useState<string>('')
  const [photoSlots, setPhotoSlots] = useState<number | ''>('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/shop/calendari/models')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  const categories = useMemo(() => {
    if (!data) return []
    const set = new Set(data.items.map(m => m.category).filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  const photoSlotOptions = useMemo(() => {
    if (!data) return []
    const set = new Set(data.items.map(m => m.photoSlots))
    return Array.from(set).sort((a, b) => a - b)
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.items.filter(m => {
      if (category && m.category !== category) return false
      if (photoSlots !== '' && m.photoSlots !== photoSlots) return false
      if (q && !m.code.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, category, photoSlots, search])

  const bannerDateLabel = data?.settings.bannerDate
    ? new Date(data.settings.bannerDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'var(--n-surface)',
        borderBottom: '1px solid var(--n-border)',
        padding: 'clamp(36px, 5vw, 64px) clamp(24px, 5vw, 60px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 800,
            fontSize: 'clamp(26px, 4vw, 44px)', color: 'var(--n-tx)',
            letterSpacing: '-0.025em', marginBottom: 10,
          }}>
            Calendari fotografici 2027
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--n-t2)', maxWidth: 560, marginBottom: 16 }}>
            Scegli un modello, carica le tue foto e personalizza il tuo calendario 2027.
            Stampa su carta fotografica 30×45 cm, con astine e gancio per appenderlo.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, background: '#fff', border: '1px solid var(--n-border)', borderRadius: 'var(--n-r2)', padding: '10px 16px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--n-ac)', fontFamily: 'Poppins, sans-serif' }}>10 €</span>
            <span style={{ fontSize: '13px', color: 'var(--n-t2)' }}>a calendario · dalla seconda copia 8 €</span>
          </div>

          {(data?.settings.bannerText || bannerDateLabel) && (
            <div style={{
              marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--n-ac-dim)', border: '1px solid rgba(0,193,222,0.25)',
              borderRadius: 'var(--n-r2)', padding: '10px 14px', fontSize: '13px', color: 'var(--n-ac-dark)', maxWidth: 560,
            }}>
              <span>📅</span>
              <span>
                {data?.settings.bannerText}
                {bannerDateLabel && ` — entro il ${bannerDateLabel} per averlo prima di Natale`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filtri */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px clamp(24px, 5vw, 60px) 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per codice (es. C2830)"
            style={{
              flex: '1 1 220px', maxWidth: 280, padding: '9px 14px',
              borderRadius: 'var(--n-r2)', border: '1px solid var(--n-border)',
              fontSize: '13px', fontFamily: 'Montserrat, sans-serif', color: 'var(--n-tx)',
            }}
          />
          {categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                onClick={() => setCategory('')}
                style={{
                  padding: '8px 14px', borderRadius: 'var(--n-r2)', fontSize: '12px', fontWeight: 600,
                  border: category === '' ? '1px solid var(--n-ac)' : '1px solid var(--n-border)',
                  background: category === '' ? 'var(--n-ac-dim)' : '#fff',
                  color: category === '' ? 'var(--n-ac-dark)' : 'var(--n-t2)',
                  cursor: 'pointer',
                }}
              >
                Tutte
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--n-r2)', fontSize: '12px', fontWeight: 600,
                    border: category === c ? '1px solid var(--n-ac)' : '1px solid var(--n-border)',
                    background: category === c ? 'var(--n-ac-dim)' : '#fff',
                    color: category === c ? 'var(--n-ac-dark)' : 'var(--n-t2)',
                    cursor: 'pointer',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {photoSlotOptions.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--n-t3)', fontWeight: 600 }}>N° foto:</span>
            <button
              onClick={() => setPhotoSlots('')}
              style={{
                padding: '8px 14px', borderRadius: 'var(--n-r2)', fontSize: '12px', fontWeight: 600,
                border: photoSlots === '' ? '1px solid var(--n-ac)' : '1px solid var(--n-border)',
                background: photoSlots === '' ? 'var(--n-ac-dim)' : '#fff',
                color: photoSlots === '' ? 'var(--n-ac-dark)' : 'var(--n-t2)',
                cursor: 'pointer',
              }}
            >
              Tutte
            </button>
            {photoSlotOptions.map(n => (
              <button
                key={n}
                onClick={() => setPhotoSlots(n)}
                style={{
                  padding: '8px 14px', borderRadius: 'var(--n-r2)', fontSize: '12px', fontWeight: 600,
                  border: photoSlots === n ? '1px solid var(--n-ac)' : '1px solid var(--n-border)',
                  background: photoSlots === n ? 'var(--n-ac-dim)' : '#fff',
                  color: photoSlots === n ? 'var(--n-ac-dark)' : 'var(--n-t2)',
                  cursor: 'pointer',
                }}
              >
                {n === 1 ? '1 foto' : `${n} foto`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Griglia modelli */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px clamp(24px, 5vw, 60px) clamp(40px, 6vw, 72px)' }}>
        {!data ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--n-t3)', fontSize: '15px' }}>Caricamento…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--n-t3)', fontSize: '15px' }}>
            Nessun modello trovato.
          </div>
        ) : (
          <div
            className="calendari-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}
          >
            {filtered.map(m => <CalendarModelCard key={m.code} model={m} />)}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .calendari-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 18px !important; }
        }
        @media (min-width: 900px) {
          .calendari-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (min-width: 1200px) {
          .calendari-grid { grid-template-columns: repeat(5, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

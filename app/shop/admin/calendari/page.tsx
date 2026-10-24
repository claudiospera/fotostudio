'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react'

interface ModelRow {
  id: string
  code: string
  title: string
  format: string
  category: string
  photoSlots: number
  thumbUrl: string
  active: boolean
  sortOrder: number
}

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', fontSize: 13,
  border: '1px solid #e8e8e8', borderRadius: 8,
  background: '#fff', color: '#0a0a0a', outline: 'none',
}

const PAGE_SIZE = 60

export default function AdminCalendariPage() {
  const [models, setModels] = useState<ModelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [dragId, setDragId] = useState<string | null>(null)

  const [bannerText, setBannerText] = useState('')
  const [bannerDate, setBannerDate] = useState('')
  const [bannerSaving, setBannerSaving] = useState(false)
  const [bannerSaved, setBannerSaved] = useState(false)

  useEffect(() => {
    fetch('/api/shop/admin/calendar-models')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setModels(data) })
      .finally(() => setLoading(false))

    fetch('/api/shop/admin/calendar-settings')
      .then(r => r.json())
      .then(data => { setBannerText(data.bannerText ?? ''); setBannerDate(data.bannerDate ?? '') })
      .catch(() => {})
  }, [])

  const categories = useMemo(() => {
    const set = new Set(models.map(m => m.category).filter(Boolean))
    return Array.from(set).sort()
  }, [models])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return models.filter(m => {
      if (categoryFilter === '__none__' && m.category) return false
      if (categoryFilter && categoryFilter !== '__none__' && m.category !== categoryFilter) return false
      if (q && !m.code.toLowerCase().includes(q)) return false
      return true
    })
  }, [models, search, categoryFilter])

  const visible = filtered.slice(0, visibleCount)

  async function updateModel(id: string, patch: Partial<Pick<ModelRow, 'category' | 'photoSlots' | 'active'>>) {
    setModels(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
    await fetch('/api/shop/admin/calendar-models', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
  }

  async function saveBanner() {
    setBannerSaving(true)
    await fetch('/api/shop/admin/calendar-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerText, bannerDate }),
    })
    setBannerSaving(false)
    setBannerSaved(true)
    setTimeout(() => setBannerSaved(false), 2000)
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const ids = visible.map(m => m.id)
    const fromIdx = ids.indexOf(dragId)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, dragId)

    // Riassegna sort_order consecutivi ai soli modelli visibili al momento del drag.
    const base = visible[0]?.sortOrder ?? 0
    const updates = reordered.map((id, i) => ({ id, sortOrder: base + i }))

    setModels(prev => {
      const bySortOrder = new Map(updates.map(u => [u.id, u.sortOrder]))
      return prev
        .map(m => bySortOrder.has(m.id) ? { ...m, sortOrder: bySortOrder.get(m.id)! } : m)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    })
    setDragId(null)

    fetch('/api/shop/admin/calendar-models', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reorder: updates }),
    })
  }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', minHeight: '100vh', background: '#f3f3f3' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 clamp(24px, 5vw, 48px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/shop/admin" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 500, color: '#555',
            textDecoration: 'none', padding: '6px 12px',
            borderRadius: 8, border: '1px solid #e8e8e8',
          }}>
            <ArrowLeft size={14} /> Admin Shop
          </Link>
          <span style={{ color: '#ccc', fontSize: 18 }}>/</span>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: '#0a0a0a' }}>
            Modelli Calendario
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>{models.length} modelli</span>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(28px, 4vw, 48px) clamp(24px, 5vw, 48px)' }}>

        {/* Banner scadenza ordini */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#0a0a0a', marginBottom: 16 }}>
            Banner scadenza ordini
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 280px' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Testo</label>
              <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} value={bannerText} onChange={e => setBannerText(e.target.value)} placeholder="Es. Ordina entro Natale!" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Data</label>
              <input style={inputStyle} type="date" value={bannerDate} onChange={e => setBannerDate(e.target.value)} />
            </div>
            <button
              onClick={saveBanner}
              disabled={bannerSaving}
              style={{ background: bannerSaved ? '#16a34a' : '#00c1de', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              {bannerSaved ? '✓ Salvato' : bannerSaving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </div>

        {/* Filtri */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <input
            style={{ ...inputStyle, flex: '1 1 220px' }}
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
            placeholder="Cerca per codice…"
          />
          <select
            style={inputStyle}
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
          >
            <option value="">Tutte le categorie</option>
            <option value="__none__">Senza categoria</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Lista modelli */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#999', fontSize: 14 }}>Caricamento…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#999', fontSize: 14 }}>Nessun modello trovato.</div>
          ) : (
            <>
              {visible.map(m => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={() => setDragId(m.id)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', borderBottom: '1px solid #f3f3f3',
                    opacity: m.active ? 1 : 0.5,
                  }}
                >
                  <GripVertical size={16} color="#ccc" style={{ cursor: 'grab', flexShrink: 0 }} />
                  <div style={{ position: 'relative', width: 40, height: 60, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#f3f3f3' }}>
                    <Image src={m.thumbUrl} alt={m.code} fill style={{ objectFit: 'cover' }} sizes="40px" />
                  </div>
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#0a0a0a', width: 80, flexShrink: 0 }}>
                    {m.code}
                  </span>
                  <input
                    style={{ ...inputStyle, width: 160 }}
                    value={m.category}
                    onChange={e => updateModel(m.id, { category: e.target.value })}
                    placeholder="Categoria"
                    list="calendar-categories"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <label style={{ fontSize: 11, color: '#999' }}>Foto:</label>
                    <input
                      style={{ ...inputStyle, width: 52 }}
                      type="number"
                      min={1}
                      value={m.photoSlots}
                      onChange={e => updateModel(m.id, { photoSlots: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <button
                      onClick={() => updateModel(m.id, { active: !m.active })}
                      title={m.active ? 'Disattiva' : 'Attiva'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: m.active ? '#00c1de' : '#ccc' }}
                    >
                      {m.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </div>
                </div>
              ))}
              {visibleCount < filtered.length && (
                <div style={{ padding: 16, textAlign: 'center' }}>
                  <button
                    onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                    style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer' }}
                  >
                    Carica altri ({filtered.length - visibleCount} rimanenti)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <datalist id="calendar-categories">
          {categories.map(c => <option key={c} value={c} />)}
        </datalist>
      </div>
    </div>
  )
}

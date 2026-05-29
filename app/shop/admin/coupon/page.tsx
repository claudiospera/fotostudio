'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

const PRODUCTS = [
  { group: 'Stampe',      items: [
    { id: 'stampe-classiche',  label: 'Stampe Classiche' },
    { id: 'stampe-instax',     label: 'Stampe Instax / Polaroid' },
    { id: 'hahnemuhle',        label: 'Stampe Hahnemühle Fine Art' },
    { id: 'poster',            label: 'Poster' },
  ]},
  { group: 'Decorazioni', items: [
    { id: 'tela',    label: 'Stampa su Tela' },
    { id: 'forex',   label: 'Stampa su Forex' },
    { id: 'cornici', label: 'Cornici' },
  ]},
  { group: 'Gadget', items: [
    { id: 'cuscino',               label: 'Cuscino' },
    { id: 'puzzle',                label: 'Puzzle' },
    { id: 'tazza',                 label: 'Tazza' },
    { id: 'salvadanaio',           label: 'Salvadanaio' },
    { id: 'borraccia-inox',        label: 'Borraccia Inox' },
    { id: 'borraccia-alluminio',   label: 'Borraccia Alluminio' },
    { id: 'portachiavi',           label: 'Portachiavi' },
    { id: 'portachiavi-ecopelle',  label: 'Portachiavi Ecopelle' },
    { id: 'tappetino-mouse',       label: 'Tappetino Mouse' },
    { id: 'photo-globe-cuore',     label: 'Photo Globe Cuore' },
  ]},
]

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  valid_from: string | null
  valid_until: string | null
  max_uses: number | null
  used_count: number
  active: boolean
  created_at: string
  product_ids: string[]
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14,
  border: '1px solid #e8e8e8', borderRadius: 8,
  background: '#fff', color: '#0a0a0a', outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#666',
  letterSpacing: '.07em', textTransform: 'uppercase',
  display: 'block', marginBottom: 5,
}

export default function AdminCouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Form state
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/shop/admin/coupons')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCoupons(data) })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!code.trim() || !value) { setFormError('Codice e valore sono obbligatori'); return }

    setSaving(true)
    const res = await fetch('/api/shop/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        type,
        value: type === 'fixed' ? Math.round(parseFloat(value) * 100) : parseInt(value),
        valid_from: validFrom || null,
        valid_until: validUntil || null,
        max_uses: maxUses ? parseInt(maxUses) : null,
        product_ids: selectedProducts,
      }),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setFormError(data.error || 'Errore'); return }

    setCoupons(prev => [data, ...prev])
    setShowForm(false)
    setCode(''); setValue(''); setValidFrom(''); setValidUntil(''); setMaxUses('')
    setType('percent'); setSelectedProducts([])
  }

  async function handleToggle(coupon: Coupon) {
    await fetch('/api/shop/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
    })
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo codice sconto?')) return
    await fetch('/api/shop/admin/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', minHeight: '100vh', background: '#f3f3f3' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 clamp(24px, 5vw, 48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              Codici Sconto
            </span>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setFormError('') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#00c1de', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Nuovo coupon
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(28px, 4vw, 48px) clamp(24px, 5vw, 48px)' }}>

        {/* Form crea coupon */}
        {showForm && (
          <div style={{
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16,
            padding: '28px 28px', marginBottom: 28,
          }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#0a0a0a', marginBottom: 24 }}>
              Crea nuovo codice sconto
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Codice *</label>
                  <input
                    style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="Es. ESTATE25"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tipo sconto *</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={type}
                    onChange={e => { setType(e.target.value as 'percent' | 'fixed'); setValue('') }}
                  >
                    <option value="percent">Percentuale (%)</option>
                    <option value="fixed">Importo fisso (€)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>
                    {type === 'percent' ? 'Percentuale (1–100) *' : 'Importo in € *'}
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={type === 'percent' ? 1 : 0.01}
                    max={type === 'percent' ? 100 : undefined}
                    step={type === 'fixed' ? '0.01' : '1'}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={type === 'percent' ? 'Es. 20' : 'Es. 10.00'}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Valido dal</label>
                  <input style={inputStyle} type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Valido fino al</label>
                  <input style={inputStyle} type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                </div>
              </div>

              <div style={{ maxWidth: 200 }}>
                <label style={labelStyle}>Max utilizzi (vuoto = illimitato)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={e => setMaxUses(e.target.value)}
                  placeholder="Es. 50"
                />
              </div>

              {/* Selettore prodotti */}
              <div>
                <label style={labelStyle}>
                  Prodotti applicabili
                  <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                    — lascia tutto deselezionato per applicare a tutti i prodotti
                  </span>
                </label>
                <div style={{
                  border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden',
                  background: '#fafafa',
                }}>
                  {PRODUCTS.map(group => (
                    <div key={group.group}>
                      {/* Intestazione gruppo con checkbox seleziona-tutti */}
                      <div style={{
                        padding: '8px 14px',
                        background: '#f3f3f3', borderBottom: '1px solid #e8e8e8',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <input
                          type="checkbox"
                          style={{ accentColor: '#00c1de', cursor: 'pointer' }}
                          checked={group.items.every(p => selectedProducts.includes(p.id))}
                          onChange={e => {
                            const ids = group.items.map(p => p.id)
                            setSelectedProducts(prev =>
                              e.target.checked
                                ? [...new Set([...prev, ...ids])]
                                : prev.filter(id => !ids.includes(id))
                            )
                          }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                          {group.group}
                        </span>
                      </div>
                      {/* Prodotti del gruppo */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 0 }}>
                        {group.items.map(product => (
                          <label key={product.id} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 14px', cursor: 'pointer',
                            borderBottom: '1px solid #f3f3f3',
                            background: selectedProducts.includes(product.id) ? 'rgba(0,193,222,0.05)' : 'transparent',
                            transition: 'background .1s',
                          }}>
                            <input
                              type="checkbox"
                              style={{ accentColor: '#00c1de', cursor: 'pointer', flexShrink: 0 }}
                              checked={selectedProducts.includes(product.id)}
                              onChange={e => {
                                setSelectedProducts(prev =>
                                  e.target.checked
                                    ? [...prev, product.id]
                                    : prev.filter(id => id !== product.id)
                                )
                              }}
                            />
                            <span style={{ fontSize: 13, color: '#333' }}>{product.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedProducts.length > 0 && (
                  <p style={{ fontSize: 12, color: '#00c1de', marginTop: 6, fontWeight: 600 }}>
                    ✓ Sconto valido solo su: {selectedProducts.map(id => {
                      const found = PRODUCTS.flatMap(g => g.items).find(p => p.id === id)
                      return found?.label ?? id
                    }).join(', ')}
                  </p>
                )}
              </div>

              {formError && (
                <p style={{ fontSize: 13, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '9px 13px' }}>
                  {formError}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: saving ? '#aaa' : '#00c1de', color: '#fff',
                    border: 'none', borderRadius: 8, padding: '11px 24px',
                    fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
                  }}
                >
                  {saving ? 'Salvataggio…' : 'Crea coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError('') }}
                  style={{
                    background: '#fff', color: '#555', border: '1px solid #e8e8e8',
                    borderRadius: 8, padding: '11px 20px',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista coupon */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e8e8e8' }}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#0a0a0a', margin: 0 }}>
              Coupon attivi e scaduti
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#999', fontSize: 14 }}>
              Caricamento…
            </div>
          ) : coupons.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#555', marginBottom: 6 }}>Nessun coupon</p>
              <p style={{ fontSize: 13, color: '#999' }}>Clicca "Nuovo coupon" per crearne uno.</p>
            </div>
          ) : (
            <div>
              {/* Intestazione tabella */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '130px 80px 80px 90px 90px 60px 1fr 70px 80px',
                padding: '10px 24px',
                background: '#f9f9f9', borderBottom: '1px solid #e8e8e8',
                fontSize: 11, fontWeight: 700, color: '#999',
                letterSpacing: '.07em', textTransform: 'uppercase',
                gap: 8,
              }}>
                <span>Codice</span>
                <span>Tipo</span>
                <span>Valore</span>
                <span>Dal</span>
                <span>Al</span>
                <span>Usi</span>
                <span>Prodotti</span>
                <span>Stato</span>
                <span></span>
              </div>

              {coupons.map(coupon => {
                const expired = coupon.valid_until && new Date(coupon.valid_until) < new Date()
                const exhausted = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses
                const inactive = !coupon.active || expired || exhausted

                return (
                  <div
                    key={coupon.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '130px 80px 80px 90px 90px 60px 1fr 70px 80px',
                      padding: '14px 24px',
                      borderBottom: '1px solid #f3f3f3',
                      alignItems: 'center', gap: 8,
                      opacity: inactive ? 0.55 : 1,
                    }}
                  >
                    <span style={{
                      fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 13,
                      color: '#0a0a0a', letterSpacing: '.06em',
                    }}>
                      {coupon.code}
                    </span>
                    <span style={{ fontSize: 12, color: '#555' }}>
                      {coupon.type === 'percent' ? 'Percentuale' : 'Fisso'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#00c1de' }}>
                      {coupon.type === 'percent'
                        ? `${coupon.value}%`
                        : formatPrice(coupon.value)}
                    </span>
                    <span style={{ fontSize: 12, color: '#555' }}>{formatDate(coupon.valid_from)}</span>
                    <span style={{ fontSize: 12, color: expired ? '#e53e3e' : '#555' }}>
                      {formatDate(coupon.valid_until)}
                    </span>
                    <span style={{ fontSize: 12, color: exhausted ? '#e53e3e' : '#555' }}>
                      {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                    </span>

                    {/* Prodotti */}
                    <span style={{ fontSize: 11, color: '#555' }}>
                      {!coupon.product_ids?.length
                        ? <span style={{ color: '#aaa' }}>Tutti</span>
                        : coupon.product_ids.map(id => {
                            const found = PRODUCTS.flatMap(g => g.items).find(p => p.id === id)
                            return found?.label ?? id
                          }).join(', ')
                      }
                    </span>

                    {/* Badge stato */}
                    <span style={{
                      display: 'inline-block', padding: '3px 8px',
                      borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: inactive ? '#f3f3f3' : '#dcfce7',
                      color: inactive ? '#999' : '#16a34a',
                    }}>
                      {expired ? 'Scaduto' : exhausted ? 'Esaurito' : coupon.active ? 'Attivo' : 'Disattivo'}
                    </span>

                    {/* Azioni */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleToggle(coupon)}
                        title={coupon.active ? 'Disattiva' : 'Attiva'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: coupon.active ? '#00c1de' : '#ccc' }}
                      >
                        {coupon.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        title="Elimina"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ccc' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#e53e3e')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SERVICE_TYPES } from '@/lib/constants'
import type { Preventivo, PreventivoTemplate, VocePreventivo, ServiceType, PreventivoStato } from '@/lib/types'

interface NuovaProposta {
  cliente: string
  email: string
  servizio: ServiceType | ''
  data_evento: string
  stato: PreventivoStato
  note: string
  voci: VocePreventivo[]
}

interface NuovaPropostaProps {
  isOpen: boolean
  onClose: () => void
  template?: PreventivoTemplate | null
  onSave: (data: Omit<Preventivo, 'id' | 'user_id' | 'created_at'>) => void
}

const EMPTY: NuovaProposta = {
  cliente: '',
  email: '',
  servizio: '',
  data_evento: '',
  stato: 'bozza',
  note: '',
  voci: [{ desc: '', prezzo: 0 }],
}

export const NuovaPropostaModal = ({ isOpen, onClose, template, onSave }: NuovaPropostaProps) => {
  const [form, setForm] = useState<NuovaProposta>(() =>
    template
      ? {
          cliente: '',
          email: '',
          servizio: template.servizio,
          data_evento: '',
          stato: 'bozza',
          note: '',
          voci: template.voci.map(v => ({ ...v })),
        }
      : { ...EMPTY, voci: [{ desc: '', prezzo: 0 }] }
  )

  // Reset when template changes
  useEffect(() => {
    if (template) {
      setForm({
        cliente: '',
        email: '',
        servizio: template.servizio,
        data_evento: '',
        stato: 'bozza',
        note: '',
        voci: template.voci.map(v => ({ ...v })),
      })
    }
  }, [template])

  const totale = form.voci.reduce((sum, v) => sum + (v.prezzo || 0), 0)

  const updateVoce = (i: number, field: keyof VocePreventivo, value: string | number) => {
    setForm(f => {
      const voci = [...f.voci]
      voci[i] = { ...voci[i], [field]: value }
      return { ...f, voci }
    })
  }

  const addVoce = () => setForm(f => ({ ...f, voci: [...f.voci, { desc: '', prezzo: 0 }] }))

  const removeVoce = (i: number) =>
    setForm(f => ({ ...f, voci: f.voci.filter((_, idx) => idx !== i) }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cliente.trim()) return
    onSave({
      cliente: form.cliente,
      email: form.email || undefined,
      servizio: form.servizio || undefined,
      data_evento: form.data_evento || undefined,
      stato: form.stato,
      note: form.note || undefined,
      voci: form.voci.filter(v => v.desc.trim()),
      totale,
      gallery_id: undefined,
    })
    onClose()
    setForm({ ...EMPTY, voci: [{ desc: '', prezzo: 0 }] })
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative', width: '100%', maxWidth: 640,
          background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--r)', overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17 }}>
              {template ? `Nuovo preventivo — ${template.nome}` : 'Nuovo preventivo'}
            </h2>
            {template && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--t3)' }}>
                Basato sul template "{template.nome}"
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'var(--s2)', color: 'var(--t2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Cliente + Email */}
            <div className="form-grid-2">
              <Field label="Cliente *">
                <input
                  required
                  placeholder="Nome e cognome"
                  value={form.cliente}
                  onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  placeholder="email@esempio.it"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Servizio + Data + Stato */}
            <div className="form-grid-3">
              <Field label="Servizio">
                <select
                  value={form.servizio}
                  onChange={e => setForm(f => ({ ...f, servizio: e.target.value as ServiceType }))}
                  style={inputStyle}
                >
                  <option value="">— Seleziona —</option>
                  {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Data evento">
                <input
                  type="date"
                  value={form.data_evento}
                  onChange={e => setForm(f => ({ ...f, data_evento: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Stato">
                <select
                  value={form.stato}
                  onChange={e => setForm(f => ({ ...f, stato: e.target.value as PreventivoStato }))}
                  style={inputStyle}
                >
                  <option value="bozza">Bozza</option>
                  <option value="inviato">Inviato</option>
                  <option value="accettato">Accettato</option>
                  <option value="rifiutato">Rifiutato</option>
                </select>
              </Field>
            </div>

            {/* Voci */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Voci del preventivo
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={addVoce}>
                  <Plus size={12} /> Aggiungi voce
                </Button>
              </div>

              <div
                style={{
                  background: 'var(--s2)', borderRadius: 'var(--r2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 110px 32px',
                    gap: 8, padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descrizione</span>
                  <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Importo €</span>
                  <span />
                </div>

                {form.voci.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 110px 32px',
                      gap: 8, padding: '8px 12px',
                      borderBottom: i < form.voci.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      placeholder="es. Servizio fotografico cerimonia"
                      value={v.desc}
                      onChange={e => updateVoce(i, 'desc', e.target.value)}
                      style={{ ...inputStyle, margin: 0 }}
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={v.prezzo || ''}
                      onChange={e => updateVoce(i, 'prezzo', parseFloat(e.target.value) || 0)}
                      style={{ ...inputStyle, margin: 0, textAlign: 'right' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeVoce(i)}
                      disabled={form.voci.length === 1}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'transparent',
                        color: form.voci.length === 1 ? 'var(--t3)' : 'var(--red)',
                        cursor: form.voci.length === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* Total row */}
                <div
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(142,201,176,0.05)',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>Totale</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--ac)' }}>
                    {totale.toLocaleString('it-IT')} €
                  </span>
                </div>
              </div>
            </div>

            {/* Note */}
            <Field label="Note interne">
              <textarea
                placeholder="Note visibili solo a te..."
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
              />
            </Field>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0 24px 20px',
              display: 'flex', justifyContent: 'flex-end', gap: 8,
              borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 4,
            }}
          >
            <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
            <Button type="submit" variant="primary">Salva preventivo</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Helpers ─── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--s2)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 'var(--r2)',
  color: 'var(--tx)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {label}
    </label>
    {children}
  </div>
)

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Copy, FileText, Pencil, Plus, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PREVENTIVO_TEMPLATES, SERVICE_TYPES_CERIMONIE } from '@/lib/constants'
import type { PreventivoTemplate, ServiceType, VocePreventivo } from '@/lib/types'

const STORAGE_KEY = 'fotostudio_custom_templates'

function loadCustomTemplates(): Record<string, PreventivoTemplate> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveCustomTemplates(custom: Record<string, PreventivoTemplate>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
}

interface TemplatesViewProps {
  onUseTemplate: (template: PreventivoTemplate) => void
}

export const TemplatesView = ({ onUseTemplate }: TemplatesViewProps) => {
  const [filterServizio, setFilterServizio] = useState<ServiceType | 'tutti'>('tutti')
  const [preview, setPreview] = useState<PreventivoTemplate | null>(null)
  const [editing, setEditing] = useState<PreventivoTemplate | null>(null)
  const [custom, setCustom] = useState<Record<string, PreventivoTemplate>>({})

  useEffect(() => {
    setCustom(loadCustomTemplates())
  }, [])

  // Merge: custom overrides defaults by id
  const templates = PREVENTIVO_TEMPLATES.map(t => custom[t.id] ?? t)

  const filtrati = filterServizio === 'tutti'
    ? templates
    : templates.filter(t => t.servizio === filterServizio)

  const formatEuro = (n: number) =>
    n === 0 ? 'incluso' : n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

  const handleSave = useCallback((updated: PreventivoTemplate) => {
    const next = { ...custom, [updated.id]: updated }
    setCustom(next)
    saveCustomTemplates(next)
    setEditing(null)
  }, [custom])

  const handleReset = useCallback((id: string) => {
    const next = { ...custom }
    delete next[id]
    setCustom(next)
    saveCustomTemplates(next)
    setEditing(null)
  }, [custom])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <FilterChip
          label="Tutti"
          active={filterServizio === 'tutti'}
          onClick={() => setFilterServizio('tutti')}
        />
        {SERVICE_TYPES_CERIMONIE.map(s => (
          <FilterChip
            key={s}
            label={s}
            active={filterServizio === s}
            onClick={() => setFilterServizio(s)}
          />
        ))}
      </div>

      {/* Templates grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {filtrati.map(t => (
          <TemplateCard
            key={t.id}
            template={t}
            isCustomized={!!custom[t.id]}
            formatEuro={formatEuro}
            onPreview={() => setPreview(t)}
            onUse={() => onUseTemplate(t)}
            onEdit={() => setEditing({ ...t, voci: t.voci.map(v => ({ ...v })) })}
          />
        ))}
      </div>

      {/* Preview modal */}
      {preview && (
        <TemplatePreviewModal
          template={preview}
          formatEuro={formatEuro}
          onClose={() => setPreview(null)}
          onUse={() => { onUseTemplate(preview); setPreview(null) }}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <TemplateEditModal
          template={editing}
          isCustomized={!!custom[editing.id]}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onReset={() => handleReset(editing.id)}
        />
      )}
    </div>
  )
}

/* ─── Filter Chip ─── */
const FilterChip = ({
  label, active, onClick,
}: {
  label: string; active: boolean; onClick: () => void
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '5px 14px',
      borderRadius: 20,
      border: active ? '1px solid var(--ac)' : '1px solid rgba(255,255,255,0.08)',
      background: active ? 'rgba(142,201,176,0.14)' : 'var(--s2)',
      color: active ? 'var(--ac)' : 'var(--t2)',
      fontSize: 12,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
)

/* ─── Template Card ─── */
const TemplateCard = ({
  template: t, isCustomized, formatEuro, onPreview, onUse, onEdit,
}: {
  template: PreventivoTemplate
  isCustomized: boolean
  formatEuro: (n: number) => string
  onPreview: () => void
  onUse: () => void
  onEdit: () => void
}) => (
  <div
    style={{
      background: 'var(--s1)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 'var(--r)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.15s',
    }}
    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)')}
    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)')}
  >
    {/* Color accent bar */}
    <div style={{ height: 3, background: t.colore }} />

    <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h3
              style={{
                margin: 0, fontFamily: 'Syne, sans-serif',
                fontWeight: 700, fontSize: 15, color: 'var(--tx)',
              }}
            >
              {t.nome}
            </h3>
            {isCustomized && (
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 4,
                background: 'rgba(142,201,176,0.14)', color: 'var(--ac)',
                border: '1px solid rgba(142,201,176,0.28)', fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                modificato
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: 'var(--s2)', color: 'var(--t3)',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {t.servizio}
          </span>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--t3)', lineHeight: 1.4 }}>
          {t.descrizione}
        </p>
      </div>

      {/* Voci preview */}
      <div style={{ flex: 1 }}>
        {t.voci.slice(0, 3).map((v, i) => (
          <div
            key={i}
            style={{
              display: 'flex', justifyContent: 'space-between', gap: 8,
              padding: '5px 0',
              borderBottom: i < Math.min(t.voci.length, 3) - 1
                ? '1px solid rgba(255,255,255,0.04)'
                : 'none',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v.desc}
            </span>
            <span style={{ fontSize: 12, color: v.prezzo === 0 ? 'var(--t3)' : 'var(--tx)', flexShrink: 0 }}>
              {formatEuro(v.prezzo)}
            </span>
          </div>
        ))}
        {t.voci.length > 3 && (
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--t3)' }}>
            + {t.voci.length - 3} voci incluse
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>Totale indicativo</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.colore }}>
            {t.totale.toLocaleString('it-IT')} €
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--t3)', fontSize: 11 }}>
            <Clock size={11} />
            {t.durata_ore}h
          </div>
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <FileText size={12} />
            Dettaglio
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil size={12} />
            Modifica
          </Button>
          <Button variant="primary" size="sm" onClick={onUse}>
            <Copy size={12} />
            Usa
          </Button>
        </div>
      </div>
    </div>
  </div>
)

/* ─── Template Edit Modal ─── */
const TemplateEditModal = ({
  template, isCustomized, onClose, onSave, onReset,
}: {
  template: PreventivoTemplate
  isCustomized: boolean
  onClose: () => void
  onSave: (t: PreventivoTemplate) => void
  onReset: () => void
}) => {
  const [draft, setDraft] = useState<PreventivoTemplate>({ ...template, voci: template.voci.map(v => ({ ...v })) })

  const updateVoce = (i: number, field: keyof VocePreventivo, value: string | number) => {
    setDraft(prev => {
      const voci = prev.voci.map((v, idx) => idx === i ? { ...v, [field]: value } : v)
      const totale = voci.reduce((sum, v) => sum + (typeof v.prezzo === 'number' ? v.prezzo : 0), 0)
      return { ...prev, voci, totale }
    })
  }

  const addVoce = () => {
    setDraft(prev => ({ ...prev, voci: [...prev.voci, { desc: '', prezzo: 0 }] }))
  }

  const removeVoce = (i: number) => {
    setDraft(prev => {
      const voci = prev.voci.filter((_, idx) => idx !== i)
      const totale = voci.reduce((sum, v) => sum + v.prezzo, 0)
      return { ...prev, voci, totale }
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--s3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--r2)',
    color: 'var(--tx)',
    fontSize: 13,
    padding: '7px 10px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div
        style={{
          position: 'relative', width: '100%', maxWidth: 600,
          maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--r)', overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 3, background: draft.colore }} />

        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>
              Modifica template
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--t3)' }}>
              Le modifiche sono salvate localmente e sovrascrivono il template predefinito.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
              background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nome + durata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--t3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Nome template
              </label>
              <input
                style={inputStyle}
                value={draft.nome}
                onChange={e => setDraft(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--t3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Durata (ore)
              </label>
              <input
                style={{ ...inputStyle, width: 80 }}
                type="number"
                min={1}
                value={draft.durata_ore}
                onChange={e => setDraft(prev => ({ ...prev, durata_ore: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Descrizione */}
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--t3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Descrizione
            </label>
            <input
              style={inputStyle}
              value={draft.descrizione}
              onChange={e => setDraft(prev => ({ ...prev, descrizione: e.target.value }))}
            />
          </div>

          {/* Voci */}
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--t3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Voci del preventivo
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {draft.voci.map((v, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 28px', gap: 8, alignItems: 'center' }}>
                  <input
                    style={inputStyle}
                    placeholder="Descrizione voce"
                    value={v.desc}
                    onChange={e => updateVoce(i, 'desc', e.target.value)}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inputStyle, paddingRight: 22 }}
                      type="number"
                      min={0}
                      placeholder="0 = incluso"
                      value={v.prezzo}
                      onChange={e => updateVoce(i, 'prezzo', Number(e.target.value))}
                    />
                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--t3)', pointerEvents: 'none' }}>€</span>
                  </div>
                  <button
                    onClick={() => removeVoce(i)}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)',
                      background: 'transparent', color: 'var(--t3)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Rimuovi voce"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={addVoce}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 'var(--r2)',
                  border: '1px dashed rgba(255,255,255,0.12)',
                  background: 'transparent', color: 'var(--t3)', cursor: 'pointer',
                  fontSize: 12, width: '100%', justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                <Plus size={12} />
                Aggiungi voce
              </button>
            </div>
          </div>

          {/* Totale calcolato */}
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(142,201,176,0.08)',
              border: '1px solid rgba(142,201,176,0.2)',
              borderRadius: 'var(--r2)',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--t2)' }}>Totale calcolato automaticamente</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: draft.colore }}>
              {draft.totale.toLocaleString('it-IT')} €
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0 24px 20px',
            display: 'flex', justifyContent: 'space-between', gap: 8,
          }}
        >
          <div>
            {isCustomized && (
              <Button variant="ghost" onClick={onReset}>
                <RotateCcw size={13} />
                Ripristina default
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>Annulla</Button>
            <Button variant="primary" onClick={() => onSave(draft)}>
              Salva modifiche
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Template Preview Modal ─── */
const TemplatePreviewModal = ({
  template: t, formatEuro, onClose, onUse,
}: {
  template: PreventivoTemplate
  formatEuro: (n: number) => string
  onClose: () => void
  onUse: () => void
}) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}
    onClick={e => { if (e.target === e.currentTarget) onClose() }}
  >
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
    <div
      style={{
        position: 'relative', width: '100%', maxWidth: 560,
        background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--r)', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: t.colore }} />

      {/* Header */}
      <div
        style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>
            {t.nome}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--t3)' }}>{t.descrizione}</p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
            background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <Stat label="Servizio" value={t.servizio} />
          <Stat label="Durata" value={`${t.durata_ore} ore`} />
          <Stat label="Voci" value={`${t.voci.length} elementi`} />
        </div>

        <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Voci del preventivo
        </h4>
        <div
          style={{
            background: 'var(--s2)', borderRadius: 'var(--r2)',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          {t.voci.map((v, i) => (
            <VoceRow key={i} voce={v} formatEuro={formatEuro} last={i === t.voci.length - 1} />
          ))}
        </div>

        {/* Total */}
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, padding: '12px 16px',
            background: 'rgba(142,201,176,0.08)',
            border: '1px solid rgba(142,201,176,0.2)',
            borderRadius: 'var(--r2)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>Totale indicativo</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: t.colore }}>
            {t.totale.toLocaleString('it-IT')} €
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '0 24px 20px',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}
      >
        <Button variant="secondary" onClick={onClose}>Chiudi</Button>
        <Button variant="primary" onClick={onUse}>
          <Copy size={13} />
          Usa questo template
        </Button>
      </div>
    </div>
  </div>
)

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      flex: 1, padding: '10px 14px',
      background: 'var(--s2)', borderRadius: 'var(--r2)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)', marginBottom: 2 }}>{label}</p>
    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{value}</p>
  </div>
)

const VoceRow = ({ voce, formatEuro, last }: { voce: VocePreventivo; formatEuro: (n: number) => string; last: boolean }) => (
  <div
    style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
      gap: 12,
    }}
  >
    <span style={{ fontSize: 13, color: 'var(--tx)', flex: 1 }}>{voce.desc}</span>
    <span
      style={{
        fontSize: 13, fontWeight: 600, flexShrink: 0,
        color: voce.prezzo === 0 ? 'var(--t3)' : 'var(--ac)',
      }}
    >
      {formatEuro(voce.prezzo)}
    </span>
  </div>
)

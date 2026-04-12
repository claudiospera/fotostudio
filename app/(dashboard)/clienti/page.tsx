'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Phone, Mail, Calendar, MapPin } from 'lucide-react'
import type { Cliente, CategoriaCliente, PacchettoCliente } from '@/lib/types'

// ── colori per categoria ────────────────────────────────────────────────────

const CAT_COLORS: Record<CategoriaCliente, string> = {
  'Matrimonio':          '#7a4a6e',
  'Battesimo':           '#4a7a9b',
  'Comunione':           '#5e8a5e',
  '1 Anno':              '#c9a84c',
  '18 Anni':             '#b85c38',
  'Anniversario':        '#6b5b8a',
  'Shooting Fotografico':'#3d6b6b',
  'Altra Cerimonia':     '#7a6b55',
}

const CATEGORIE: CategoriaCliente[] = [
  'Matrimonio', 'Battesimo', 'Comunione', '1 Anno',
  '18 Anni', 'Anniversario', 'Shooting Fotografico', 'Altra Cerimonia',
]

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

function saldo(c: Cliente) {
  return (c.importo_totale || 0) - (c.acconto || 0) - (c.saldo || 0)
}

// ── EMPTY FORM ──────────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<Cliente, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  categoria: 'Matrimonio',
  data_evento: undefined,
  luogo_evento: '',
  nome1: '',
  tel1: '', email1: '', whatsapp1: '', indirizzo1: '', citta1: '',
  nome2: '', tel2: '', email2: '', whatsapp2: '', indirizzo2: '', citta2: '',
  genitore1_nome: '', genitore1_tel: '', genitore2_nome: '', genitore2_tel: '',
  album_tipo: '', album_formato: '', album_pagine: undefined, album_copertina: '',
  video: false, video_tipo: '',
  pacchetti: [],
  importo_totale: 0, acconto: 0, data_acconto: undefined,
  saldo: 0, data_saldo: undefined,
  gallery_id: undefined, note: '',
  colore: '#7a4a6e',
}

// ── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function ClientiPage() {
  const [clienti, setClienti]     = useState<Cliente[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState<CategoriaCliente | 'tutti'>('tutti')
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Cliente | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const fetchClienti = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/clienti')
    if (res.ok) setClienti(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchClienti() }, [fetchClienti])

  const filtrati = clienti.filter(c => {
    const matchCat = filterCat === 'tutti' || c.categoria === filterCat
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.nome1.toLowerCase().includes(q) ||
      (c.nome2 ?? '').toLowerCase().includes(q) ||
      (c.luogo_evento ?? '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const handleSave = async (data: Omit<Cliente, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editing) {
      const res = await fetch(`/api/clienti/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const updated = await res.json()
        setClienti(prev => prev.map(c => c.id === updated.id ? updated : c))
      }
    } else {
      const res = await fetch('/api/clienti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const nuovo = await res.json()
        setClienti(prev => [nuovo, ...prev])
      }
    }
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/clienti/${id}`, { method: 'DELETE' })
    if (res.ok) setClienti(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const openEdit = (c: Cliente) => { setEditing(c); setShowForm(true) }
  const openNew  = () => { setEditing(null); setShowForm(true) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>

      {/* ── TOPBAR ── */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: '1px solid var(--b1)',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, margin: 0 }}>
          Clienti
        </h1>
        <span style={{ fontSize: 12, color: 'var(--t3)', background: 'var(--s2)', borderRadius: 20, padding: '2px 10px' }}>
          {clienti.length}
        </span>

        {/* Filtri categoria */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 8 }}>
          {(['tutti', ...CATEGORIE] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                border: filterCat === cat ? `1px solid ${cat === 'tutti' ? 'var(--ac)' : CAT_COLORS[cat as CategoriaCliente]}` : '1px solid rgba(255,255,255,0.08)',
                background: filterCat === cat ? (cat === 'tutti' ? 'rgba(142,201,176,0.14)' : `${CAT_COLORS[cat as CategoriaCliente]}22`) : 'var(--s2)',
                color: filterCat === cat ? (cat === 'tutti' ? 'var(--ac)' : CAT_COLORS[cat as CategoriaCliente]) : 'var(--t2)',
              }}
            >
              {cat === 'tutti' ? 'Tutti' : cat}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {/* Ricerca */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none' }} />
            <input
              placeholder="Cerca cliente…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: 'var(--r2)',
                border: '1px solid var(--b1)', background: 'var(--s2)', color: 'var(--tx)',
                fontSize: 13, outline: 'none', width: 200,
              }}
            />
          </div>
          <button
            onClick={openNew}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 16px', height: 36, borderRadius: 'var(--r2)',
              background: 'var(--ac)', color: '#111', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Nuovo cliente
          </button>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--t3)' }}>
            Caricamento…
          </div>
        ) : filtrati.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--t3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>👥</div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              {search || filterCat !== 'tutti' ? 'Nessun cliente trovato' : 'Nessun cliente ancora'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--t3)' }}>
              {search || filterCat !== 'tutti' ? 'Prova a cambiare i filtri' : 'Clicca "Nuovo cliente" per iniziare'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {filtrati.map(c => (
              <ClienteCard
                key={c.id}
                cliente={c}
                onEdit={() => openEdit(c)}
                onDelete={() => setDeleting(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── FORM MODAL ── */}
      {showForm && (
        <ClienteForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleting && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeleting(null)}
        >
          <div
            style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', padding: 28, maxWidth: 380, width: '100%', margin: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, marginBottom: 8 }}>
              Elimina cliente
            </h3>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 24 }}>
              Sei sicuro? Questa azione non può essere annullata.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleting(null)}
                style={{ padding: '8px 16px', borderRadius: 'var(--r2)', border: '1px solid var(--b1)', background: 'transparent', color: 'var(--t2)', cursor: 'pointer', fontSize: 13 }}
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(deleting)}
                style={{ padding: '8px 16px', borderRadius: 'var(--r2)', border: 'none', background: 'var(--red)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CLIENTE CARD ────────────────────────────────────────────────────────────

function ClienteCard({ cliente: c, onEdit, onDelete }: {
  cliente: Cliente
  onEdit: () => void
  onDelete: () => void
}) {
  const col = CAT_COLORS[c.categoria] ?? '#8ec9b0'
  const residuo = saldo(c)

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 'var(--r)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
    >
      {/* Barra colore categoria */}
      <div style={{ height: 4, background: col }} />

      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, margin: 0, color: 'var(--tx)' }}>
              {c.nome1}{c.nome2 ? ` & ${c.nome2}` : ''}
            </h3>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 20, marginTop: 4, display: 'inline-block',
              background: `${col}22`, color: col, border: `1px solid ${col}44`, fontWeight: 600, letterSpacing: '0.06em',
            }}>
              {c.categoria}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={onEdit} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Pencil size={12} />
            </button>
            <button onClick={onDelete} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s2)', color: 'var(--red)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {c.data_evento && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--t2)' }}>
              <Calendar size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
              {formatDate(c.data_evento)}
            </div>
          )}
          {c.luogo_evento && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--t2)' }}>
              <MapPin size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
              {c.luogo_evento}
            </div>
          )}
          {c.tel1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--t2)' }}>
              <Phone size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
              {c.tel1}
            </div>
          )}
          {c.email1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--t2)' }}>
              <Mail size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
              {c.email1}
            </div>
          )}
        </div>

        {/* Pagamenti */}
        {c.importo_totale > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6,
            paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <PayBox label="Totale" value={c.importo_totale} color="var(--tx)" />
            <PayBox label="Acconto" value={c.acconto} color="var(--ac)" />
            <PayBox label="Residuo" value={residuo} color={residuo > 0 ? 'var(--amber)' : 'var(--ac)'} />
          </div>
        )}
      </div>
    </div>
  )
}

function PayBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ margin: 0, fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color }}>{value.toLocaleString('it-IT')} €</p>
    </div>
  )
}

// ── FORM ────────────────────────────────────────────────────────────────────

type FormData = Omit<Cliente, 'id' | 'user_id' | 'created_at' | 'updated_at'>

function ClienteForm({ initial, onSave, onClose }: {
  initial?: Cliente
  onSave: (data: FormData) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<FormData>(() =>
    initial
      ? { ...initial }
      : { ...EMPTY_FORM }
  )
  const [newPacchetto, setNewPacchetto] = useState({ nome: '', prezzo: 0 })

  const set = (k: keyof FormData, v: unknown) =>
    setForm(f => ({ ...f, [k]: v, colore: k === 'categoria' ? CAT_COLORS[v as CategoriaCliente] : f.colore }))

  const addPacchetto = () => {
    if (!newPacchetto.nome.trim()) return
    setForm(f => ({ ...f, pacchetti: [...f.pacchetti, { ...newPacchetto }] }))
    setNewPacchetto({ nome: '', prezzo: 0 })
  }
  const removePacchetto = (i: number) =>
    setForm(f => ({ ...f, pacchetti: f.pacchetti.filter((_, idx) => idx !== i) }))

  const input: React.CSSProperties = {
    width: '100%', background: 'var(--s3)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--r2)', color: 'var(--tx)', fontSize: 13, padding: '8px 10px', outline: 'none', boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: 11, color: 'var(--t3)', marginBottom: 5,
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  const showPersona2 = ['Matrimonio', 'Anniversario'].includes(form.categoria)
  const showGenitori = ['Battesimo', 'Comunione', '1 Anno', '18 Anni'].includes(form.categoria)

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--r)', width: '100%', maxWidth: 680,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Barra colore */}
        <div style={{ height: 3, background: CAT_COLORS[form.categoria] }} />

        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, margin: 0 }}>
            {initial ? 'Modifica cliente' : 'Nuovo cliente'}
          </h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center' }}>×</button>
        </div>

        {/* Body scrollabile */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Sezione: Evento */}
          <Section title="Evento">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={label}>Categoria *</span>
                <select value={form.categoria} onChange={e => set('categoria', e.target.value)} style={input}>
                  {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <span style={label}>Data evento</span>
                <input type="date" value={form.data_evento ?? ''} onChange={e => set('data_evento', e.target.value || undefined)} style={input} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={label}>Luogo</span>
              <input value={form.luogo_evento ?? ''} onChange={e => set('luogo_evento', e.target.value)} placeholder="es. Villa dei Fiori, Avellino" style={input} />
            </div>
          </Section>

          {/* Sezione: Persona 1 */}
          <Section title={showPersona2 ? 'Persona 1 (Sposo/a)' : 'Cliente'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Nome e cognome *" style={label}>
                <input value={form.nome1} onChange={e => set('nome1', e.target.value)} placeholder="Nome e cognome" style={input} />
              </Field>
              <Field label="Telefono" style={label}>
                <input value={form.tel1 ?? ''} onChange={e => set('tel1', e.target.value)} placeholder="+39 333 000 0000" style={input} />
              </Field>
              <Field label="Email" style={label}>
                <input type="email" value={form.email1 ?? ''} onChange={e => set('email1', e.target.value)} placeholder="email@esempio.it" style={input} />
              </Field>
              <Field label="WhatsApp" style={label}>
                <input value={form.whatsapp1 ?? ''} onChange={e => set('whatsapp1', e.target.value)} placeholder="+39 333 000 0000" style={input} />
              </Field>
              <Field label="Indirizzo" style={label}>
                <input value={form.indirizzo1 ?? ''} onChange={e => set('indirizzo1', e.target.value)} placeholder="Via Roma 1" style={input} />
              </Field>
              <Field label="Città" style={label}>
                <input value={form.citta1 ?? ''} onChange={e => set('citta1', e.target.value)} placeholder="Napoli" style={input} />
              </Field>
            </div>
          </Section>

          {/* Sezione: Persona 2 (solo matrimoni/anniversari) */}
          {showPersona2 && (
            <Section title="Persona 2 (Sposo/a)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Nome e cognome" style={label}>
                  <input value={form.nome2 ?? ''} onChange={e => set('nome2', e.target.value)} placeholder="Nome e cognome" style={input} />
                </Field>
                <Field label="Telefono" style={label}>
                  <input value={form.tel2 ?? ''} onChange={e => set('tel2', e.target.value)} placeholder="+39 333 000 0000" style={input} />
                </Field>
                <Field label="Email" style={label}>
                  <input type="email" value={form.email2 ?? ''} onChange={e => set('email2', e.target.value)} placeholder="email@esempio.it" style={input} />
                </Field>
                <Field label="WhatsApp" style={label}>
                  <input value={form.whatsapp2 ?? ''} onChange={e => set('whatsapp2', e.target.value)} placeholder="+39 333 000 0000" style={input} />
                </Field>
                <Field label="Indirizzo" style={label}>
                  <input value={form.indirizzo2 ?? ''} onChange={e => set('indirizzo2', e.target.value)} placeholder="Via Roma 1" style={input} />
                </Field>
                <Field label="Città" style={label}>
                  <input value={form.citta2 ?? ''} onChange={e => set('citta2', e.target.value)} placeholder="Napoli" style={input} />
                </Field>
              </div>
            </Section>
          )}

          {/* Sezione: Genitori */}
          {showGenitori && (
            <Section title="Genitori / Referenti">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Genitore 1 — Nome" style={label}>
                  <input value={form.genitore1_nome ?? ''} onChange={e => set('genitore1_nome', e.target.value)} style={input} />
                </Field>
                <Field label="Genitore 1 — Telefono" style={label}>
                  <input value={form.genitore1_tel ?? ''} onChange={e => set('genitore1_tel', e.target.value)} style={input} />
                </Field>
                <Field label="Genitore 2 — Nome" style={label}>
                  <input value={form.genitore2_nome ?? ''} onChange={e => set('genitore2_nome', e.target.value)} style={input} />
                </Field>
                <Field label="Genitore 2 — Telefono" style={label}>
                  <input value={form.genitore2_tel ?? ''} onChange={e => set('genitore2_tel', e.target.value)} style={input} />
                </Field>
              </div>
            </Section>
          )}

          {/* Sezione: Pacchetti */}
          <Section title="Pacchetti & Opzioni">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {form.pacchetti.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--tx)' }}>{p.nome}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac)' }}>{p.prezzo > 0 ? `${p.prezzo} €` : 'incluso'}</span>
                  <button onClick={() => removePacchetto(i)} style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer', padding: 2 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto', gap: 8, alignItems: 'flex-end' }}>
              <div>
                <span style={label}>Nome pacchetto</span>
                <input value={newPacchetto.nome} onChange={e => setNewPacchetto(p => ({ ...p, nome: e.target.value }))} placeholder="es. Servizio fotografico 6 ore" style={input} onKeyDown={e => e.key === 'Enter' && addPacchetto()} />
              </div>
              <div>
                <span style={label}>Prezzo €</span>
                <input type="number" min={0} value={newPacchetto.prezzo || ''} onChange={e => setNewPacchetto(p => ({ ...p, prezzo: Number(e.target.value) }))} placeholder="0" style={input} onKeyDown={e => e.key === 'Enter' && addPacchetto()} />
              </div>
              <button
                onClick={addPacchetto}
                style={{ height: 36, padding: '0 14px', borderRadius: 'var(--r2)', background: 'var(--s3)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--tx)', cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}
              >
                + Aggiungi
              </button>
            </div>
          </Section>

          {/* Sezione: Pagamenti */}
          <Section title="Pagamenti">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Importo totale €" style={label}>
                <input type="number" min={0} value={form.importo_totale || ''} onChange={e => set('importo_totale', Number(e.target.value))} placeholder="0" style={input} />
              </Field>
              <Field label="Acconto €" style={label}>
                <input type="number" min={0} value={form.acconto || ''} onChange={e => set('acconto', Number(e.target.value))} placeholder="0" style={input} />
              </Field>
              <Field label="Data acconto" style={label}>
                <input type="date" value={form.data_acconto ?? ''} onChange={e => set('data_acconto', e.target.value || undefined)} style={input} />
              </Field>
              <Field label="Saldo pagato €" style={label}>
                <input type="number" min={0} value={form.saldo || ''} onChange={e => set('saldo', Number(e.target.value))} placeholder="0" style={input} />
              </Field>
              <Field label="Data saldo" style={label}>
                <input type="date" value={form.data_saldo ?? ''} onChange={e => set('data_saldo', e.target.value || undefined)} style={input} />
              </Field>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)', flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Residuo</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: (form.importo_totale - form.acconto - form.saldo) > 0 ? 'var(--amber)' : 'var(--ac)' }}>
                    {(form.importo_totale - form.acconto - form.saldo).toLocaleString('it-IT')} €
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Note */}
          <Section title="Note">
            <textarea
              value={form.note ?? ''}
              onChange={e => set('note', e.target.value)}
              placeholder="Note interne…"
              rows={3}
              style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Section>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--r2)', border: '1px solid var(--b1)', background: 'transparent', color: 'var(--t2)', cursor: 'pointer', fontSize: 13 }}>
            Annulla
          </button>
          <button
            onClick={() => { if (form.nome1.trim()) onSave(form) }}
            style={{ padding: '9px 20px', borderRadius: 'var(--r2)', border: 'none', background: 'var(--ac)', color: '#111', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {initial ? 'Salva modifiche' : 'Crea cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helper components ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function Field({ label: lbl, children, style: _ }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--t3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {lbl}
      </label>
      {children}
    </div>
  )
}

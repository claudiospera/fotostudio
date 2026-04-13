'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, GripVertical, ExternalLink, Copy, Check, Image as ImageIcon, Menu } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import type { SezionePreventivo, ProdottoPreventivo, CategoriaCliente } from '@/lib/types'

// ── Default template per Matrimonio ─────────────────────────────────────────

const IMG = (seed: string) => `https://picsum.photos/seed/${seed}/480/560`

const DEFAULT_MATRIMONIO: SezionePreventivo[] = [
  {
    id: 's-fotolibro', titolo: 'Fotolibro',
    citazione: 'La carta è preziosa, sa custodire i nostri ricordi: è il luogo della memoria.',
    sottotitolo: 'Gli album rappresentano il ricordo tangibile del vostro matrimonio, costruiti per durare per sempre, concepiti per contenere le immagini degli eventi più memorabili.',
    prodotti: [
      { id: 'fl1', nome: 'Fotolibro 30×40', sottotitolo: '45 fogli circa 150 foto', immagine: IMG('photobook1'), prezzo: 2200, layout: 'card' },
      { id: 'fl2', nome: 'Fotolibro 24×30', sottotitolo: '45 fogli circa 150 foto', immagine: IMG('photobook2'), prezzo: 2000, layout: 'card' },
      { id: 'fl3', nome: 'Fotolibro 30×30', sottotitolo: '45 fogli circa 150 foto', immagine: IMG('photobook3'), prezzo: 2000, layout: 'card' },
    ],
  },
  {
    id: 's-album', titolo: 'Album Tradizionale', sottotitolo: '',
    prodotti: [
      { id: 'at1', nome: 'Album 30×40', sottotitolo: '50 fogli circa 100 foto', immagine: IMG('album30x40'), prezzo: 2200, layout: 'card' },
      { id: 'at2', nome: 'Album 24×30', sottotitolo: '50 fogli circa 100 foto', immagine: IMG('album24x30'), prezzo: 2000, layout: 'card' },
      { id: 'at3', nome: 'Album 30×30', sottotitolo: '50 fogli circa 100 foto', immagine: IMG('album30x30'), prezzo: 2000, layout: 'card' },
      { id: 'at4', nome: 'Stampato su Carta Hahnemühle', descrizione: 'Un Album Matrimonio Fine Art: una magia che inizia dai colori ed arriva dritta al cuore.', immagine: IMG('hahnemuhle'), prezzo: 200, layout: 'horizontal' },
    ],
  },
  {
    id: 's-mini', titolo: '2 Mini Album per i genitori', sottotitolo: 'Stampati su Carta Fotografica',
    prodotti: [
      { id: 'ma1', nome: '2 Mini Album Pro', descrizione: '2 Minialbum (50 facciate), copertina come album sposi, misure 15×20/20×20 circa 25/30 fogli.', immagine: IMG('minialbum1'), prezzo: 300, layout: 'card' },
      { id: 'ma2', nome: '2 Mini Album Eco', descrizione: '2 Minialbum (20 facciate), copertina fotografica, misura 15×20.', immagine: IMG('minialbum2'), prezzo: 150, layout: 'card' },
    ],
  },
  {
    id: 's-prewedding', titolo: 'Pre-Wedding', sottotitolo: "Il servizio comprende un'uscita con gli sposi in un luogo da stabilire insieme.",
    prodotti: [
      { id: 'pw1', nome: 'Foto', immagine: IMG('prewedding1'), prezzo: 150, layout: 'horizontal' },
      { id: 'pw2', nome: 'Video', immagine: IMG('prewedding2'), prezzo: 150, layout: 'horizontal' },
    ],
  },
  {
    id: 's-extra', titolo: 'Extra & Servizi', sottotitolo: '',
    prodotti: [
      { id: 'ex1', nome: 'Drone', immagine: IMG('drone'), prezzo: 300, layout: 'horizontal' },
      { id: 'ex2', nome: 'Doppio Staff Casa Sposo', descrizione: 'Qualora le distanze siano eccessive e gli sposi necessitino del servizio fotografico anche a casa dello sposo.', prezzo: 300, layout: 'text' },
      { id: 'ex3', nome: 'Proiezione Trailer', prezzo: 250, layout: 'text' },
      { id: 'ex4', nome: 'Stampa Foto Parenti (giorno del matrimonio)', descrizione: 'Stampa 13×18 consegnata in una cartellina personalizzata. Prezzo per massimo 100 foto.', prezzo: 250, layout: 'text' },
    ],
  },
]

const DEFAULT_BATTESIMO: SezionePreventivo[] = [
  {
    id: 's-foto', titolo: 'Servizio Fotografico', sottotitolo: 'Immortaliamo ogni momento del battesimo con cura e attenzione.',
    prodotti: [
      { id: 'bf1', nome: 'Servizio completo', sottotitolo: 'Dalla preparazione alla festa', immagine: IMG('baptism1'), prezzo: 800, layout: 'horizontal' },
      { id: 'bf2', nome: 'Servizio essenziale', sottotitolo: 'Cerimonia e foto di gruppo', immagine: IMG('baptism2'), prezzo: 500, layout: 'horizontal' },
    ],
  },
  {
    id: 's-album-b', titolo: 'Album & Ricordi', sottotitolo: '',
    prodotti: [
      { id: 'ba1', nome: 'Fotolibro 24×30', sottotitolo: '30 fogli circa 80 foto', immagine: IMG('baptismbook1'), prezzo: 450, layout: 'card' },
      { id: 'ba2', nome: 'Fotolibro 20×20', sottotitolo: '30 fogli circa 80 foto', immagine: IMG('baptismbook2'), prezzo: 350, layout: 'card' },
    ],
  },
]

const DEFAULTS: Partial<Record<CategoriaCliente, SezionePreventivo[]>> = {
  'Matrimonio': DEFAULT_MATRIMONIO,
  'Promessa di Matrimonio': DEFAULT_MATRIMONIO,
  'Battesimo': DEFAULT_BATTESIMO,
}

const CATEGORIE: CategoriaCliente[] = [
  'Matrimonio', 'Promessa di Matrimonio', 'Battesimo', 'Comunione',
  '1 Anno', '18 Anni', 'Anniversario', 'Shooting Fotografico', 'Altra Cerimonia',
]

// ── Utilities ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)
const fmt = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2 }) + ' €'

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PreventivoEditorPage() {
  const openSidebar = useUIStore(s => s.openSidebar)
  const [categoria, setCategoria] = useState<CategoriaCliente>('Matrimonio')
  const [sezioni, setSezioni] = useState<SezionePreventivo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingSezione, setEditingSezione] = useState<SezionePreventivo | null>(null)
  const [editingProdotto, setEditingProdotto] = useState<{ sezioneId: string; prodotto: ProdottoPreventivo } | null>(null)

  const loadTemplate = useCallback(async (cat: CategoriaCliente) => {
    setLoading(true)
    const res = await fetch(`/api/preventivo-templates?categoria=${encodeURIComponent(cat)}`)
    if (res.ok) {
      const data = await res.json()
      if (data?.sezioni?.length) {
        setSezioni(data.sezioni)
      } else {
        setSezioni(DEFAULTS[cat] ?? [])
      }
    } else {
      setSezioni(DEFAULTS[cat] ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadTemplate(categoria) }, [categoria, loadTemplate])

  const saveTemplate = async () => {
    setSaving(true)
    await fetch('/api/preventivo-templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria, sezioni }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addSezione = () => {
    const s: SezionePreventivo = { id: uid(), titolo: 'Nuova sezione', prodotti: [] }
    setSezioni(prev => [...prev, s])
    setEditingSezione(s)
  }

  const updateSezione = (updated: SezionePreventivo) =>
    setSezioni(prev => prev.map(s => s.id === updated.id ? updated : s))

  const deleteSezione = (id: string) =>
    setSezioni(prev => prev.filter(s => s.id !== id))

  const addProdotto = (sezioneId: string) => {
    const p: ProdottoPreventivo = { id: uid(), nome: 'Nuovo prodotto', prezzo: 0, layout: 'card' }
    setSezioni(prev => prev.map(s =>
      s.id === sezioneId ? { ...s, prodotti: [...s.prodotti, p] } : s
    ))
    setEditingProdotto({ sezioneId, prodotto: p })
  }

  const updateProdotto = (sezioneId: string, updated: ProdottoPreventivo) =>
    setSezioni(prev => prev.map(s =>
      s.id === sezioneId
        ? { ...s, prodotti: s.prodotti.map(p => p.id === updated.id ? updated : p) }
        : s
    ))

  const deleteProdotto = (sezioneId: string, prodottoId: string) =>
    setSezioni(prev => prev.map(s =>
      s.id === sezioneId
        ? { ...s, prodotti: s.prodotti.filter(p => p.id !== prodottoId) }
        : s
    ))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Topbar */}
      <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={openSidebar} className="hamburger-btn w-10 h-10 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] place-items-center text-[var(--t2)] hover:text-[var(--tx)] transition-colors shrink-0" aria-label="Apri menu">
          <Menu size={16} />
        </button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, margin: 0 }}>
          Editor Preventivo
        </h1>
        <div style={{ flex: 1 }} />
        <button
          onClick={saveTemplate}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', height: 36, borderRadius: 'var(--r2)', background: saved ? 'var(--ac)' : 'var(--ac)', color: '#111', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saved ? <><Check size={14} /> Salvato</> : saving ? 'Salvataggio…' : '💾 Salva template'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Selezione categoria */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIE.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat as CategoriaCliente)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: categoria === cat ? '1px solid var(--ac)' : '1px solid rgba(255,255,255,0.08)',
                background: categoria === cat ? 'rgba(142,201,176,0.14)' : 'var(--s2)',
                color: categoria === cat ? 'var(--ac)' : 'var(--t2)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>Caricamento…</div>
        ) : (
          <>
            {/* Sezioni */}
            {sezioni.map((sez) => (
              <SezioneCard
                key={sez.id}
                sezione={sez}
                onEditSezione={() => setEditingSezione(sez)}
                onDeleteSezione={() => deleteSezione(sez.id)}
                onAddProdotto={() => addProdotto(sez.id)}
                onEditProdotto={(p) => setEditingProdotto({ sezioneId: sez.id, prodotto: p })}
                onDeleteProdotto={(pid) => deleteProdotto(sez.id, pid)}
              />
            ))}

            <button
              onClick={addSezione}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderRadius: 'var(--r)', border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
            >
              <Plus size={16} /> Aggiungi sezione
            </button>
          </>
        )}
      </div>

      {/* Modal edit sezione */}
      {editingSezione && (
        <SezioneModal
          sezione={editingSezione}
          onSave={(updated) => { updateSezione(updated); setEditingSezione(null) }}
          onClose={() => setEditingSezione(null)}
        />
      )}

      {/* Modal edit prodotto */}
      {editingProdotto && (
        <ProdottoModal
          prodotto={editingProdotto.prodotto}
          onSave={(updated) => { updateProdotto(editingProdotto.sezioneId, updated); setEditingProdotto(null) }}
          onClose={() => setEditingProdotto(null)}
        />
      )}
    </div>
  )
}

// ── Sezione Card ─────────────────────────────────────────────────────────────

function SezioneCard({ sezione: s, onEditSezione, onDeleteSezione, onAddProdotto, onEditProdotto, onDeleteProdotto }: {
  sezione: SezionePreventivo
  onEditSezione: () => void
  onDeleteSezione: () => void
  onAddProdotto: () => void
  onEditProdotto: (p: ProdottoPreventivo) => void
  onDeleteProdotto: (id: string) => void
}) {
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
      {/* Header sezione */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <GripVertical size={14} style={{ color: 'var(--t3)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>{s.titolo}</span>
          {s.sottotitolo && <span style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 10 }}>{s.sottotitolo.slice(0, 60)}{s.sottotitolo.length > 60 ? '…' : ''}</span>}
        </div>
        <button onClick={onEditSezione} style={iconBtn}>✏️</button>
        <button onClick={onDeleteSezione} style={{ ...iconBtn, color: 'var(--red)' }}><Trash2 size={13} /></button>
      </div>

      {/* Prodotti */}
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {s.prodotti.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--s2)', borderRadius: 'var(--r2)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {p.immagine
              ? <img src={p.immagine} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--s3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><ImageIcon size={16} style={{ color: 'var(--t3)' }} /></div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{p.nome}</p>
              {p.sottotitolo && <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>{p.sottotitolo}</p>}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac)', flexShrink: 0 }}>{fmt(p.prezzo)}</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--s3)', color: 'var(--t3)', flexShrink: 0 }}>{p.layout}</span>
            <button onClick={() => onEditProdotto(p)} style={iconBtn}>✏️</button>
            <button onClick={() => onDeleteProdotto(p.id)} style={{ ...iconBtn, color: 'var(--red)' }}><Trash2 size={12} /></button>
          </div>
        ))}
        <button onClick={onAddProdotto} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--r2)', border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 12 }}>
          <Plus size={13} /> Aggiungi prodotto
        </button>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
  background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', fontSize: 13,
  display: 'grid', placeItems: 'center', flexShrink: 0,
}

// ── Modal Sezione ─────────────────────────────────────────────────────────────

function SezioneModal({ sezione, onSave, onClose }: {
  sezione: SezionePreventivo; onSave: (s: SezionePreventivo) => void; onClose: () => void
}) {
  const [form, setForm] = useState({ ...sezione })
  return (
    <Modal title="Modifica sezione" onClose={onClose} onSave={() => onSave(form)}>
      <FormField label="Titolo sezione">
        <input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} style={inp} />
      </FormField>
      <FormField label="Sottotitolo / descrizione">
        <textarea value={form.sottotitolo ?? ''} onChange={e => setForm(f => ({ ...f, sottotitolo: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
      </FormField>
      <FormField label="Citazione (opzionale — appare in corsivo sopra la sezione)">
        <input value={form.citazione ?? ''} onChange={e => setForm(f => ({ ...f, citazione: e.target.value }))} style={inp} placeholder="Es. La carta è preziosa…" />
      </FormField>
    </Modal>
  )
}

// ── Modal Prodotto ────────────────────────────────────────────────────────────

function ProdottoModal({ prodotto, onSave, onClose }: {
  prodotto: ProdottoPreventivo; onSave: (p: ProdottoPreventivo) => void; onClose: () => void
}) {
  const [form, setForm] = useState({ ...prodotto })
  return (
    <Modal title="Modifica prodotto" onClose={onClose} onSave={() => onSave(form)}>
      <FormField label="Nome prodotto *">
        <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={inp} />
      </FormField>
      <FormField label="Sottotitolo (es. 45 fogli circa 150 foto)">
        <input value={form.sottotitolo ?? ''} onChange={e => setForm(f => ({ ...f, sottotitolo: e.target.value }))} style={inp} />
      </FormField>
      <FormField label="Descrizione (testo esteso)">
        <textarea value={form.descrizione ?? ''} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
      </FormField>
      <FormField label="URL immagine">
        <input value={form.immagine ?? ''} onChange={e => setForm(f => ({ ...f, immagine: e.target.value }))} style={inp} placeholder="https://…" />
      </FormField>
      {form.immagine && (
        <img src={form.immagine} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Prezzo €">
          <input type="number" min={0} value={form.prezzo || ''} onChange={e => setForm(f => ({ ...f, prezzo: Number(e.target.value) }))} style={inp} placeholder="0" />
        </FormField>
        <FormField label="Layout di visualizzazione">
          <select value={form.layout} onChange={e => setForm(f => ({ ...f, layout: e.target.value as ProdottoPreventivo['layout'] }))} style={inp}>
            <option value="card">Card (griglia)</option>
            <option value="horizontal">Orizzontale (immagine + testo)</option>
            <option value="text">Solo testo (nessuna immagine)</option>
          </select>
        </FormField>
      </div>
    </Modal>
  )
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--s3)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 'var(--r2)', color: 'var(--tx)', fontSize: 13, padding: '8px 10px',
  outline: 'none', boxSizing: 'border-box',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 10, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Modal({ title, children, onSave, onClose }: {
  title: string; children: React.ReactNode; onSave: () => void; onClose: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--r)', width: '100%', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '18px 22px' }}>{children}</div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--r2)', border: '1px solid var(--b1)', background: 'transparent', color: 'var(--t2)', cursor: 'pointer', fontSize: 13 }}>Annulla</button>
          <button onClick={onSave} style={{ padding: '8px 18px', borderRadius: 'var(--r2)', border: 'none', background: 'var(--ac)', color: '#111', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Salva</button>
        </div>
      </div>
    </div>
  )
}

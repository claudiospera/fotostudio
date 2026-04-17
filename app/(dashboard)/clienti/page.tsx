'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, Phone, Mail, Calendar, MapPin, Download, Menu } from 'lucide-react'
import type { Cliente, CategoriaCliente, PacchettoCliente } from '@/lib/types'
import { useUIStore } from '@/store/ui'

// ── colori ed emoji per categoria ───────────────────────────────────────────

const CAT_COLORS: Record<CategoriaCliente, string> = {
  'Matrimonio':             '#7a4a6e',
  'Promessa di Matrimonio': '#9e5a8a',
  'Battesimo':              '#4a7a9b',
  'Comunione':              '#5e8a5e',
  '1 Anno':                 '#c9a84c',
  '18 Anni':                '#b85c38',
  'Anniversario':           '#6b5b8a',
  'Shooting Fotografico':   '#3d6b6b',
  'Altra Cerimonia':        '#7a6b55',
}

const CAT_EMOJI: Record<CategoriaCliente, string> = {
  'Matrimonio':             '💍',
  'Promessa di Matrimonio': '💝',
  'Battesimo':              '🕊️',
  'Comunione':              '✝️',
  '1 Anno':                 '🎂',
  '18 Anni':                '🥂',
  'Anniversario':           '💑',
  'Shooting Fotografico':   '📸',
  'Altra Cerimonia':        '🎊',
}

const CATEGORIE: CategoriaCliente[] = [
  'Matrimonio', 'Promessa di Matrimonio', 'Battesimo', 'Comunione',
  '1 Anno', '18 Anni', 'Anniversario', 'Shooting Fotografico', 'Altra Cerimonia',
]

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

function saldo(c: Cliente) {
  return (c.importo_totale || 0) - (c.acconto || 0) - (c.saldo || 0)
}

// ── EMPTY FORM ──────────────────────────────────────────────────────────────

const MATRIMONIO_TYPES: CategoriaCliente[] = ['Matrimonio', 'Promessa di Matrimonio', 'Anniversario']
const CASA2_TYPES:      CategoriaCliente[] = ['Matrimonio', 'Promessa di Matrimonio']
const GENITORI_TYPES:   CategoriaCliente[] = ['Battesimo', 'Comunione', '1 Anno', '18 Anni', 'Shooting Fotografico']
const NO_PERSONA1_TYPES:CategoriaCliente[] = ['Battesimo', 'Comunione', '1 Anno']
const PKG_TYPES:        CategoriaCliente[] = ['Promessa di Matrimonio', 'Battesimo', 'Comunione', '18 Anni', 'Anniversario', 'Altra Cerimonia']

const PACCHETTI_DEFAULT = [
  { nome: '📒 Fotolibro 30×30 (30 fogli)', prezzo: 600 },
  { nome: '📒 Fotolibro 25×25 (30 fogli)', prezzo: 500 },
  { nome: '🖼️ Anteprima',                  prezzo: 50  },
  { nome: '📗 Album Classico 30×30',        prezzo: 400 },
  { nome: '🖼️ 40 Foto',                    prezzo: 350 },
  { nome: '💾 Solo File',                   prezzo: 0   },
  { nome: '🎨 Carta Hahnemühle',            prezzo: 100 },
  { nome: '🎬 Video',                       prezzo: 350 },
]

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
  extra: {},
  gallery_id: undefined, note: '',
  colore: '#7a4a6e',
}

// ── MAIN PAGE ───────────────────────────────────────────────────────────────

function ClientiContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const openSidebar = useUIStore(s => s.openSidebar)
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

  // Auto-open a client when coming from calendar (?apri=<id>)
  useEffect(() => {
    const apriId = searchParams.get('apri')
    if (!apriId || loading || clienti.length === 0) return
    const cliente = clienti.find(c => c.id === apriId)
    if (cliente) {
      setEditing(cliente)
      setShowForm(true)
      router.replace('/clienti')
    }
  }, [searchParams, clienti, loading, router])

  // Auto-open new client form (?nuovo=1)
  useEffect(() => {
    if (searchParams.get('nuovo') !== '1') return
    setEditing(null)
    setShowForm(true)
    router.replace('/clienti')
  }, [searchParams, router])

  const filtrati = clienti.filter(c => {
    const matchCat = filterCat === 'tutti' || c.categoria === filterCat
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.nome1.toLowerCase().includes(q) ||
      (c.nome2 ?? '').toLowerCase().includes(q) ||
      (c.luogo_evento ?? '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const esportaCSV = () => {
    const cols = [
      'Categoria', 'Data evento', 'Luogo',
      'Nome 1', 'Tel 1', 'Email 1', 'WhatsApp 1',
      'Nome 2', 'Tel 2', 'Email 2',
      'Genitore 1', 'Tel genitore 1', 'Genitore 2', 'Tel genitore 2',
      'Importo totale', 'Acconto', 'Data acconto', 'Saldo', 'Data saldo',
      'Album tipo', 'Album formato', 'Album pagine',
      'Video', 'Note',
    ]
    const esc = (v: string | number | boolean | undefined | null) => {
      if (v == null) return ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = filtrati.map(c => [
      c.categoria, c.data_evento ?? '', c.luogo_evento ?? '',
      c.nome1, c.tel1 ?? '', c.email1 ?? '', c.whatsapp1 ?? '',
      c.nome2 ?? '', c.tel2 ?? '', c.email2 ?? '',
      c.genitore1_nome ?? '', c.genitore1_tel ?? '', c.genitore2_nome ?? '', c.genitore2_tel ?? '',
      c.importo_totale ?? 0, c.acconto ?? 0, c.data_acconto ?? '', c.saldo ?? 0, c.data_saldo ?? '',
      c.album_tipo ?? '', c.album_formato ?? '', c.album_pagine ?? '',
      c.video ? 'Sì' : 'No', c.note ?? '',
    ].map(esc).join(','))

    const csv = '\uFEFF' + [cols.join(','), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clienti_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
        {/* Hamburger — mobile only */}
        <button
          onClick={openSidebar}
          className="hamburger-btn w-10 h-10 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] place-items-center text-[var(--t2)] hover:text-[var(--tx)] transition-colors shrink-0"
          aria-label="Apri menu"
        >
          <Menu size={16} />
        </button>
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
            onClick={esportaCSV}
            title={`Esporta ${filtrati.length} clienti in CSV`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px', height: 36, borderRadius: 'var(--r2)',
              background: 'transparent', color: 'var(--t2)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Download size={14} /> CSV
          </button>
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

export default function ClientiPage() {
  return (
    <Suspense>
      <ClientiContent />
    </Suspense>
  )
}

// ── CLIENTE CARD ────────────────────────────────────────────────────────────

function ClienteCard({ cliente: c, onEdit, onDelete }: {
  cliente: Cliente
  onEdit: () => void
  onDelete: () => void
}) {
  const col     = CAT_COLORS[c.categoria] ?? '#8ec9b0'
  const emoji   = CAT_EMOJI[c.categoria]  ?? '📋'
  const residuo = saldo(c)
  const contatto = c.tel1 || c.email1 || c.whatsapp1

  const openWhatsApp = () => {
    const num = (c.whatsapp1 || c.tel1 || '').replace(/\D/g, '')
    if (num) window.open(`https://wa.me/39${num}`, '_blank')
  }
  const openEmail = () => {
    if (c.email1) window.open(`mailto:${c.email1}`, '_blank')
  }

  return (
    <div style={{
      background: 'var(--s1)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 'var(--r)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Barra categoria */}
      <div style={{ height: 5, background: col }} />

      {/* Corpo */}
      <div style={{ padding: '18px 18px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Nome + badge categoria */}
        <div>
          <h3 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 18, margin: '0 0 8px', color: 'var(--tx)', lineHeight: 1.2,
          }}>
            {c.nome1}{c.nome2 ? ` e ${c.nome2}` : ''}
          </h3>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, padding: '4px 10px', borderRadius: 20,
            background: `${col}22`, color: col,
            border: `1px solid ${col}55`,
            fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
          }}>
            {emoji} {c.categoria}
          </span>
        </div>

        {/* Data + luogo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {c.data_evento && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--t2)' }}>
              <span>📅</span>
              <span>{formatDate(c.data_evento)}</span>
            </div>
          )}
          {c.luogo_evento && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--t2)' }}>
              <span>📍</span>
              <span>{c.luogo_evento}</span>
            </div>
          )}
          {!contatto && (
            <span style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic' }}>Nessun contatto</span>
          )}
          {contatto && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--t2)' }}>
              <Phone size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
              <span>{c.tel1 || c.whatsapp1}</span>
            </div>
          )}
        </div>

        {/* Email */}
        {c.email1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--t2)' }}>
            <Mail size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email1}</span>
          </div>
        )}

        {/* Pacchetti selezionati */}
        {c.pacchetti && c.pacchetti.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {c.pacchetti.map(p => (
              <span key={p.nome} style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 20,
                background: 'rgba(142,201,176,0.1)', color: 'var(--ac)',
                border: '1px solid rgba(142,201,176,0.25)',
              }}>
                {p.nome}
              </span>
            ))}
          </div>
        )}

        {/* Album */}
        {(c.album_copertina || c.album_formato) && (
          <div style={{ fontSize: 12, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📒</span>
            <span>{[c.album_formato, c.album_copertina].filter(Boolean).join(' · ')}</span>
          </div>
        )}

        {/* Note */}
        {c.note && (
          <div style={{
            fontSize: 12, color: 'var(--t3)', fontStyle: 'italic',
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {c.note}
          </div>
        )}

        {/* Box ACCONTO + TOTALE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Acconto</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: (c.acconto || 0) > 0 ? 'var(--ac)' : 'var(--t3)' }}>
              {(c.acconto || 0) > 0 ? `${(c.acconto).toLocaleString('it-IT')} €` : '—'}
            </p>
          </div>
          <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Totale</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: (c.importo_totale || 0) > 0 ? 'var(--tx)' : 'var(--t3)' }}>
              {(c.importo_totale || 0) > 0 ? `${(c.importo_totale).toLocaleString('it-IT')} €` : '—'}
            </p>
          </div>
        </div>

        {/* Saldo residuo */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: 14,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>Saldo residuo</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: residuo > 0 ? 'var(--amber)' : residuo < 0 ? 'var(--red)' : 'var(--t3)' }}>
            {residuo !== 0 ? `${residuo.toLocaleString('it-IT')} €` : '—'}
          </span>
        </div>
      </div>

      {/* Pulsanti azione */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: '✏️ Modifica',  action: onEdit,       border: true  },
          { label: '🗑️ Elimina',   action: onDelete,     border: false, danger: true },
          { label: '💬 WhatsApp',  action: openWhatsApp, border: true, disabled: !c.tel1 && !c.whatsapp1 },
          { label: '✉️ Email',     action: openEmail,    border: false, disabled: !c.email1 },
        ].map(({ label, action, border, danger, disabled }) => (
          <button
            key={label}
            onClick={disabled ? undefined : action}
            style={{
              padding: '11px 0',
              fontSize: 12, fontWeight: 500,
              background: 'transparent',
              color: danger ? 'var(--red)' : disabled ? 'var(--t3)' : 'var(--t2)',
              border: 'none',
              borderRight: border ? '1px solid rgba(255,255,255,0.06)' : 'none',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.4 : 1,
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'var(--s2)' }}
            onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── FORM ────────────────────────────────────────────────────────────────────

type FormData = Omit<Cliente, 'id' | 'user_id' | 'created_at' | 'updated_at'>
type ExtraKey = keyof NonNullable<Cliente['extra']>

const INP: React.CSSProperties = {
  width: '100%', background: 'var(--s3)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 'var(--r2)', color: 'var(--tx)', fontSize: 13,
  padding: '8px 10px', outline: 'none', boxSizing: 'border-box',
}
const LBL: React.CSSProperties = {
  display: 'block', fontSize: 10, color: 'var(--t3)', marginBottom: 4,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
}
const BOX: React.CSSProperties = {
  background: 'var(--s2)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 'var(--r2)', padding: '12px 14px', marginBottom: 8,
}

const CATEGORIA_OPTIONS: { value: CategoriaCliente; label: string }[] = [
  { value: 'Matrimonio',             label: '💍 Matrimonio'             },
  { value: 'Promessa di Matrimonio', label: '💝 Promessa di Matrimonio' },
  { value: 'Battesimo',              label: '🕊️ Battesimo'              },
  { value: 'Comunione',              label: '✝️ Comunione'              },
  { value: '1 Anno',                 label: '🎂 1° Anno'                },
  { value: '18 Anni',                label: '🎉 18 Anni'                },
  { value: 'Anniversario',           label: '💑 Anniversario'           },
  { value: 'Shooting Fotografico',   label: '📸 Shooting Fotografico'   },
  { value: 'Altra Cerimonia',        label: '🎊 Altra Cerimonia'        },
]

function ClienteForm({ initial, onSave, onClose }: {
  initial?: Cliente
  onSave: (data: FormData) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<FormData>(() =>
    initial ? { ...initial, extra: initial.extra ?? {} } : { ...EMPTY_FORM }
  )

  const set = (k: keyof FormData, v: unknown) =>
    setForm(f => ({ ...f, [k]: v, colore: k === 'categoria' ? (CAT_COLORS[v as CategoriaCliente] ?? f.colore) : f.colore }))

  const ex = (k: ExtraKey) => (form.extra ?? {})[k] ?? ''
  const setEx = (k: ExtraKey, v: string) =>
    setForm(f => ({ ...f, extra: { ...(f.extra ?? {}), [k]: v } }))

  const togglePkg = (nome: string, prezzo: number) => {
    const has = form.pacchetti.some(p => p.nome === nome)
    setForm(f => ({
      ...f,
      pacchetti: has
        ? f.pacchetti.filter(p => p.nome !== nome)
        : [...f.pacchetti, { nome, prezzo }],
    }))
  }

  const col             = CAT_COLORS[form.categoria] ?? '#8ec9b0'
  const showIndirizzi   = MATRIMONIO_TYPES.includes(form.categoria)
  const showCasa2       = CASA2_TYPES.includes(form.categoria)
  const showPersona1    = !NO_PERSONA1_TYPES.includes(form.categoria)
  const showPersona2    = MATRIMONIO_TYPES.includes(form.categoria)
  const showGenitori    = GENITORI_TYPES.includes(form.categoria)
  const showPacchetti   = PKG_TYPES.includes(form.categoria)
  const residuo         = (form.importo_totale || 0) - (form.acconto || 0) - (form.saldo || 0)

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--r)', width: '100%', maxWidth: 700,
        maxHeight: '94vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
      }}>
        {/* Barra colore categoria */}
        <div style={{ height: 4, background: col, flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, margin: 0 }}>
            {initial ? 'Modifica cliente' : 'Nuovo cliente'}
          </h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center' }}>×</button>
        </div>

        {/* Body scrollabile */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── 👤 DATI CLIENTE ── */}
          <Section title="👤 Dati Cliente">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Nome *">
                <input value={form.nome1} onChange={e => set('nome1', e.target.value)} placeholder="Es. Maria Rossi" style={INP} />
              </Field>
              <Field label="Tipo di servizio *">
                <select value={form.categoria} onChange={e => set('categoria', e.target.value as CategoriaCliente)} style={INP}>
                  {CATEGORIA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Data evento">
                <input type="date" value={form.data_evento ?? ''} onChange={e => set('data_evento', e.target.value || undefined)} style={INP} />
              </Field>
              <Field label="Luogo evento">
                <input value={form.luogo_evento ?? ''} onChange={e => set('luogo_evento', e.target.value)} placeholder="Es. Villa Reale, Milano" style={INP} />
              </Field>
            </div>
          </Section>

          {/* ── 📍 INDIRIZZI (matrimonio/promessa/anniversario) ── */}
          {showIndirizzi && (
            <Section title="📍 Indirizzi">
              {/* Casa 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 10, marginBottom: 10 }}>
                <Field label="🏠 Nome — Casa 1">
                  <input value={ex('addr_casa_nome')} onChange={e => setEx('addr_casa_nome', e.target.value)} placeholder="Es. Sposa, Maria Rossi…" style={INP} />
                </Field>
                <Field label="Indirizzo Casa 1">
                  <input value={ex('addr_casa')} onChange={e => setEx('addr_casa', e.target.value)} placeholder="Via, numero civico, città" style={INP} />
                </Field>
                <Field label="🕐 Ora partenza">
                  <input type="time" value={ex('ora_casa')} onChange={e => setEx('ora_casa', e.target.value)} style={INP} />
                </Field>
              </div>

              {/* Casa 2 (solo matrimonio/promessa) */}
              {showCasa2 && (
                <div style={{ ...BOX, marginBottom: 10 }}>
                  <div style={{ ...LBL, marginBottom: 10 }}>🏠 Casa 2 — Sposo/a</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 10 }}>
                    <Field label="Nome — Casa 2">
                      <input value={ex('addr_casa2_nome')} onChange={e => setEx('addr_casa2_nome', e.target.value)} placeholder="Es. Sposo, Luca Bianchi…" style={INP} />
                    </Field>
                    <Field label="Indirizzo Casa 2">
                      <input value={ex('addr_casa2')} onChange={e => setEx('addr_casa2', e.target.value)} placeholder="Via, numero civico, città" style={INP} />
                    </Field>
                    <Field label="🕐 Ora partenza">
                      <input type="time" value={ex('ora_casa2')} onChange={e => setEx('ora_casa2', e.target.value)} style={INP} />
                    </Field>
                  </div>
                </div>
              )}

              {/* Chiesa */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 10 }}>
                <Field label="⛪ Chiesa / Cerimonia">
                  <input value={ex('addr_chiesa')} onChange={e => setEx('addr_chiesa', e.target.value)} placeholder="Nome chiesa o location, indirizzo" style={INP} />
                </Field>
                <Field label="🕐 Ora cerimonia">
                  <input type="time" value={ex('ora_chiesa')} onChange={e => setEx('ora_chiesa', e.target.value)} style={INP} />
                </Field>
              </div>

              {/* Ristorante */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                <Field label="🍽️ Ristorante / Ricevimento">
                  <input value={ex('addr_ristorante')} onChange={e => setEx('addr_ristorante', e.target.value)} placeholder="Nome e indirizzo del ristorante" style={INP} />
                </Field>
                <Field label="🕐 Ora ricevimento">
                  <input type="time" value={ex('ora_ristorante')} onChange={e => setEx('ora_ristorante', e.target.value)} style={INP} />
                </Field>
              </div>
            </Section>
          )}

          {/* ── 📞 CONTATTI PERSONA 1 ── */}
          {showPersona1 && (
            <Section title={showPersona2 ? '📞 Contatti — Persona 1' : '📞 Contatti'}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                <Field label="Cellulare">
                  <input type="tel" value={form.tel1 ?? ''} onChange={e => set('tel1', e.target.value)} placeholder="+39 333 000 0000" style={INP} />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.email1 ?? ''} onChange={e => set('email1', e.target.value)} placeholder="email@esempio.it" style={INP} />
                </Field>
                <Field label="Instagram / Social">
                  <input value={ex('social1')} onChange={e => setEx('social1', e.target.value)} placeholder="@nickname" style={INP} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="WhatsApp">
                  <input type="tel" value={form.whatsapp1 ?? ''} onChange={e => set('whatsapp1', e.target.value)} placeholder="+39 333 000 0000" style={INP} />
                </Field>
                <Field label="Facebook">
                  <input value={ex('facebook1')} onChange={e => setEx('facebook1', e.target.value)} placeholder="Nome profilo o link" style={INP} />
                </Field>
              </div>

              {/* Contatti Persona 2 (matrimonio/promessa/anniversario) */}
              {showPersona2 && (
                <div style={{ ...BOX, marginTop: 12 }}>
                  <div style={{ ...LBL, marginBottom: 10 }}>
                    📞 Contatti — {form.categoria === 'Anniversario' ? 'Persona 2' : 'Sposo/a 2'}
                  </div>
                  <Field label="Nome e cognome">
                    <input value={form.nome2 ?? ''} onChange={e => set('nome2', e.target.value)} placeholder="Nome e cognome" style={{ ...INP, marginBottom: 10 }} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <Field label="Cellulare 2">
                      <input type="tel" value={form.tel2 ?? ''} onChange={e => set('tel2', e.target.value)} placeholder="+39 333 000 0000" style={INP} />
                    </Field>
                    <Field label="Email 2">
                      <input type="email" value={form.email2 ?? ''} onChange={e => set('email2', e.target.value)} placeholder="email@esempio.it" style={INP} />
                    </Field>
                    <Field label="Instagram / Social 2">
                      <input value={ex('social2')} onChange={e => setEx('social2', e.target.value)} placeholder="@nickname" style={INP} />
                    </Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="WhatsApp 2">
                      <input type="tel" value={form.whatsapp2 ?? ''} onChange={e => set('whatsapp2', e.target.value)} placeholder="+39 333 000 0000" style={INP} />
                    </Field>
                    <Field label="Facebook 2">
                      <input value={ex('facebook2')} onChange={e => setEx('facebook2', e.target.value)} placeholder="Nome profilo o link" style={INP} />
                    </Field>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* ── 👨‍👩‍👧 GENITORI (battesimo/comunione/1anno/18anni/shooting) ── */}
          {showGenitori && (
            <Section title="📞 Contatti — Genitori">
              {/* Genitore 1 */}
              <div style={BOX}>
                <div style={{ ...LBL, marginBottom: 10 }}>👨‍👩‍👧 Genitore 1</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <Field label="Nome Genitore 1">
                    <input value={form.genitore1_nome ?? ''} onChange={e => set('genitore1_nome', e.target.value)} placeholder="Nome e cognome" style={INP} />
                  </Field>
                  <Field label="Cellulare">
                    <input type="tel" value={form.genitore1_tel ?? ''} onChange={e => set('genitore1_tel', e.target.value)} placeholder="+39 333 000 0000" style={INP} />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <Field label="Email">
                    <input type="email" value={ex('gen1_email')} onChange={e => setEx('gen1_email', e.target.value)} placeholder="email@esempio.it" style={INP} />
                  </Field>
                  <Field label="WhatsApp">
                    <input type="tel" value={ex('gen1_whatsapp')} onChange={e => setEx('gen1_whatsapp', e.target.value)} placeholder="+39 333 000 0000" style={INP} />
                  </Field>
                  <Field label="Instagram / Social">
                    <input value={ex('gen1_social')} onChange={e => setEx('gen1_social', e.target.value)} placeholder="@nickname" style={INP} />
                  </Field>
                </div>
              </div>

              {/* Genitore 2 */}
              <div style={BOX}>
                <div style={{ ...LBL, marginBottom: 10 }}>👨‍👩‍👧 Genitore 2</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <Field label="Nome Genitore 2">
                    <input value={form.genitore2_nome ?? ''} onChange={e => set('genitore2_nome', e.target.value)} placeholder="Nome e cognome" style={INP} />
                  </Field>
                  <Field label="Cellulare">
                    <input type="tel" value={form.genitore2_tel ?? ''} onChange={e => set('genitore2_tel', e.target.value)} placeholder="+39 333 000 0000" style={INP} />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <Field label="Email">
                    <input type="email" value={ex('gen2_email')} onChange={e => setEx('gen2_email', e.target.value)} placeholder="email@esempio.it" style={INP} />
                  </Field>
                  <Field label="WhatsApp">
                    <input type="tel" value={ex('gen2_whatsapp')} onChange={e => setEx('gen2_whatsapp', e.target.value)} placeholder="+39 333 000 0000" style={INP} />
                  </Field>
                  <Field label="Instagram / Social">
                    <input value={ex('gen2_social')} onChange={e => setEx('gen2_social', e.target.value)} placeholder="@nickname" style={INP} />
                  </Field>
                </div>
              </div>
            </Section>
          )}

          {/* ── 📒 ALBUM ── */}
          <Section title="📒 Album Fotografico">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label="Copertina album">
                <input value={form.album_copertina ?? ''} onChange={e => set('album_copertina', e.target.value)} placeholder="Es. Pelle nera, tela beige, rigida…" style={INP} />
              </Field>
              <Field label="Grandezza album">
                <input value={form.album_formato ?? ''} onChange={e => set('album_formato', e.target.value)} placeholder="Es. 30×40, 40×50, 20×30 cm" style={INP} />
              </Field>
            </div>
            <Field label="Note album (materiali, pagine, stampe, extra)">
              <textarea value={ex('album_note')} onChange={e => setEx('album_note', e.target.value)} placeholder="Es. Carta lucida, 60 pagine, copertina personalizzata…" rows={2} style={{ ...INP, resize: 'vertical', fontFamily: 'inherit' }} />
            </Field>
          </Section>

          {/* ── 🎬 VIDEO ── */}
          <Section title="🎬 Video">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label="Tipo di video">
                <input value={form.video_tipo ?? ''} onChange={e => set('video_tipo', e.target.value)} placeholder="Es. Highlight, Full length, Drone, SDE…" style={INP} />
              </Field>
              <Field label="Durata">
                <input value={ex('video_durata')} onChange={e => setEx('video_durata', e.target.value)} placeholder="Es. 3-5 min, 30 min completo" style={INP} />
              </Field>
              <Field label="Formato / Consegna">
                <input value={ex('video_formato_consegna')} onChange={e => setEx('video_formato_consegna', e.target.value)} placeholder="Es. MP4 4K, USB, link privato…" style={INP} />
              </Field>
              <Field label="Canzone / Musica">
                <input value={ex('video_musica')} onChange={e => setEx('video_musica', e.target.value)} placeholder="Es. Ed Sheeran - Perfect" style={INP} />
              </Field>
            </div>
            <Field label="Note video (richieste speciali, scene, stile)">
              <textarea value={ex('video_note')} onChange={e => setEx('video_note', e.target.value)} placeholder="Es. Drone esterno, interviste ospiti, effetto cinematico…" rows={2} style={{ ...INP, resize: 'vertical', fontFamily: 'inherit' }} />
            </Field>
          </Section>

          {/* ── 📦 PACCHETTI (solo alcuni tipi) ── */}
          {showPacchetti && (
            <Section title="📦 Pacchetti & Opzioni">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PACCHETTI_DEFAULT.map(p => {
                  const checked = form.pacchetti.some(pp => pp.nome === p.nome)
                  return (
                    <label
                      key={p.nome}
                      onClick={() => togglePkg(p.nome, p.prezzo)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 'var(--r2)', cursor: 'pointer',
                        background: checked ? 'rgba(142,201,176,0.1)' : 'var(--s2)',
                        border: checked ? '1px solid rgba(142,201,176,0.4)' : '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.12s',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        background: checked ? 'var(--ac)' : 'var(--s3)',
                        border: checked ? 'none' : '1px solid rgba(255,255,255,0.15)',
                        display: 'grid', placeItems: 'center',
                      }}>
                        {checked && <span style={{ fontSize: 10, color: '#111', fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ flex: 1, fontSize: 12, color: checked ? 'var(--ac)' : 'var(--t2)' }}>{p.nome}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: checked ? 'var(--ac)' : 'var(--t3)', flexShrink: 0 }}>
                        {p.prezzo > 0 ? `€${p.prezzo}` : '—'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </Section>
          )}

          {/* ── 💶 PAGAMENTI ── */}
          <Section title="💶 Pagamenti">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 10 }}>
              <Field label="Totale preventivo">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--t3)' }}>€</span>
                  <input type="number" min={0} value={form.importo_totale || ''} onChange={e => set('importo_totale', Number(e.target.value))} placeholder="0" style={{ ...INP, paddingLeft: 24 }} />
                </div>
              </Field>
              <Field label="Acconto ricevuto">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--t3)' }}>€</span>
                  <input type="number" min={0} value={form.acconto || ''} onChange={e => set('acconto', Number(e.target.value))} placeholder="0" style={{ ...INP, paddingLeft: 24 }} />
                </div>
              </Field>
              <Field label="Saldo residuo">
                <div style={{ ...INP, background: 'var(--s2)', color: residuo > 0 ? 'var(--amber)' : residuo < 0 ? 'var(--red)' : 'var(--ac)', fontWeight: 700 }}>
                  {(form.importo_totale > 0 || form.acconto > 0)
                    ? (residuo === 0 ? 'Saldato ✓' : `${residuo.toLocaleString('it-IT')} €`)
                    : '—'}
                </div>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Data pagamento acconto">
                <input type="date" value={form.data_acconto ?? ''} onChange={e => set('data_acconto', e.target.value || undefined)} style={INP} />
              </Field>
              <Field label="Data saldo prevista">
                <input type="date" value={form.data_saldo ?? ''} onChange={e => set('data_saldo', e.target.value || undefined)} style={INP} />
              </Field>
            </div>
          </Section>

          {/* ── 📝 NOTE ── */}
          <Section title="📝 Note">
            <textarea
              value={form.note ?? ''}
              onChange={e => set('note', e.target.value)}
              placeholder="Preferenze, outfit, richieste speciali, persone coinvolte…"
              rows={3}
              style={{ ...INP, resize: 'vertical', fontFamily: 'inherit' }}
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
            💾 {initial ? 'Salva modifiche' : 'Salva Cliente'}
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
      <h4 style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function Field({ label: lbl, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={LBL}>{lbl}</label>
      {children}
    </div>
  )
}

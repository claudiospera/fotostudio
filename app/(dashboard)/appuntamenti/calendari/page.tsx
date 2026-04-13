'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Link2, MoreHorizontal, ExternalLink, Pencil, Trash2, Menu } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import type { CalendarioAppuntamenti } from '@/lib/types'

const COLORI = ['#e85454','#e8854a','#e8c54a','#6abf6a','#4a9fe8','#7b4ae8','#e84ab5','#e8944a','#3dba8a']

const DEFAULT_COLORE = '#3dba8a'

function NuovoCalendarioModal({ onClose, onSaved }: { onClose: () => void; onSaved: (c: CalendarioAppuntamenti) => void }) {
  const [nome, setNome] = useState('')
  const [dataInizio, setDataInizio] = useState('')
  const [dataFine, setDataFine] = useState('')
  const [colore, setColore] = useState(DEFAULT_COLORE)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!nome.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/calendari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, data_inizio: dataInizio, data_fine: dataFine, colore, attivo: true, mostra_descrizione: false, inizia_settimana: 'lunedi' }),
      })
      if (res.ok) {
        const data = await res.json()
        onSaved(data)
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  const INP: React.CSSProperties = {
    width: '100%', background: 'var(--s3)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--r2)', color: 'var(--tx)', fontSize: 13,
    padding: '8px 10px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--r)', width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, margin: 0 }}>Nuovo calendario</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Shooting Primavera 2026" style={INP} autoFocus />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Data inizio</label>
            <input type="date" value={dataInizio} onChange={e => setDataInizio(e.target.value)} style={INP} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Data fine</label>
            <input type="date" value={dataFine} onChange={e => setDataFine(e.target.value)} style={INP} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Colore calendario</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORI.map(c => (
              <button
                key={c}
                onClick={() => setColore(c)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: colore === c ? '3px solid var(--tx)' : '2px solid transparent', cursor: 'pointer', outline: 'none' }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: '0 18px', height: 36, borderRadius: 'var(--r2)', background: 'var(--s2)', color: 'var(--t2)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, cursor: 'pointer' }}>
            Annulla
          </button>
          <button onClick={handleSave} disabled={!nome.trim() || saving} style={{ padding: '0 22px', height: 36, borderRadius: 'var(--r2)', background: 'var(--ac)', color: '#111', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!nome.trim() || saving) ? 0.5 : 1 }}>
            {saving ? 'Creando…' : 'Crea calendario'}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDateRange(d1?: string, d2?: string) {
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  if (d1 && d2) return `${fmt(d1)} – ${fmt(d2)}`
  if (d1) return `Dal ${fmt(d1)}`
  if (d2) return `Fino al ${fmt(d2)}`
  return 'Senza scadenza'
}

export default function CalendariPage() {
  const router = useRouter()
  const openSidebar = useUIStore(s => s.openSidebar)
  const [calendari, setCalendari] = useState<CalendarioAppuntamenti[]>([])
  const [loading, setLoading] = useState(true)
  const [showNuovo, setShowNuovo] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/calendari')
      .then(r => r.ok ? r.json() : [])
      .then(setCalendari)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo calendario e tutte le sue prenotazioni?')) return
    const res = await fetch(`/api/calendari/${id}`, { method: 'DELETE' })
    if (res.ok) setCalendari(prev => prev.filter(c => c.id !== id))
    setMenuOpen(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Topbar */}
      <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={openSidebar} className="hamburger-btn w-10 h-10 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] place-items-center text-[var(--t2)] hover:text-[var(--tx)] transition-colors shrink-0" aria-label="Apri menu">
          <Menu size={16} />
        </button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, margin: 0 }}>Calendari</h1>
        <span style={{ fontSize: 12, color: 'var(--t3)', background: 'var(--s2)', borderRadius: 20, padding: '2px 10px' }}>{calendari.length}</span>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setShowNuovo(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', height: 36, borderRadius: 'var(--r2)', background: 'var(--ac)', color: '#111', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> Nuovo calendario
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--t3)' }}>Caricamento…</div>
        ) : calendari.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--t3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📅</div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Nessun calendario</p>
            <p style={{ fontSize: 13 }}>Clicca "Nuovo calendario" per iniziare</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {calendari.map(cal => (
              <div
                key={cal.id}
                style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* Color bar */}
                <div style={{ height: 4, background: cal.colore }} />

                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cal.attivo ? '#4ade80' : 'var(--t3)', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--tx)' }}>{cal.nome}</span>
                    </div>
                    {/* 3-dot menu */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setMenuOpen(menuOpen === cal.id ? null : cal.id)}
                        style={{ width: 28, height: 28, borderRadius: 'var(--r2)', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--t2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {menuOpen === cal.id && (
                        <div style={{ position: 'absolute', right: 0, top: 32, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', zIndex: 20, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                          <button onClick={() => { router.push(`/appuntamenti/calendari/${cal.id}`); setMenuOpen(null) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', fontSize: 13, color: 'var(--tx)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Pencil size={13} /> Modifica
                          </button>
                          <button onClick={() => handleDelete(cal.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', fontSize: 13, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={13} /> Elimina
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
                    Disponibilità: {formatDateRange(cal.data_inizio, cal.data_fine)}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => router.push(`/appuntamenti/calendari/${cal.id}`)}
                      style={{ padding: '6px 14px', borderRadius: 'var(--r2)', background: 'var(--s2)', color: 'var(--tx)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                    >
                      Apri
                    </button>
                    <button style={{ width: 30, height: 30, borderRadius: 'var(--r2)', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--ac)', cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Link prenotazione">
                      <Link2 size={13} />
                    </button>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--ac)', background: 'var(--acd)', border: '1px solid rgba(142,201,176,0.2)', borderRadius: 20, padding: '3px 10px' }}>
                      Prenotazioni: {cal.prenotazioni_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop for menu */}
      {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(null)} />}

      {showNuovo && (
        <NuovoCalendarioModal
          onClose={() => setShowNuovo(false)}
          onSaved={cal => setCalendari(prev => [cal, ...prev])}
        />
      )}
    </div>
  )
}

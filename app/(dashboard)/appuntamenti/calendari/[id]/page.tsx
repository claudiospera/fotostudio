'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Link2, Check, Menu } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import type { CalendarioAppuntamenti } from '@/lib/types'

type Tab = 'generale' | 'disponibilita' | 'escludi' | 'form' | 'pagamenti' | 'regole' | 'redirect'

const TABS: { id: Tab; label: string }[] = [
  { id: 'generale',      label: 'Generale'               },
  { id: 'disponibilita', label: 'Servizi/Disponibilità'  },
  { id: 'escludi',       label: 'Escludi Date'           },
  { id: 'form',          label: 'Form'                   },
  { id: 'pagamenti',     label: 'Pagamenti'              },
  { id: 'regole',        label: 'Regole di prenotazione' },
  { id: 'redirect',      label: 'Redirect'               },
]

const COLORI = ['#e85454','#e8854a','#e8c54a','#6abf6a','#4a9fe8','#7b4ae8','#e84ab5','#e8944a','#3dba8a','#4ade80']

const INP: React.CSSProperties = {
  width: '100%', background: 'var(--s3)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 'var(--r2)', color: 'var(--tx)', fontSize: 13,
  padding: '10px 12px', outline: 'none', boxSizing: 'border-box',
}
const LBL: React.CSSProperties = {
  display: 'block', fontSize: 10, color: 'var(--t3)', marginBottom: 6,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--t3)' }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🚧</div>
      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>{label}</p>
      <p style={{ fontSize: 13, marginTop: 4 }}>Sezione in arrivo</p>
    </div>
  )
}

export default function CalendarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const openSidebar = useUIStore(s => s.openSidebar)
  const [calendario, setCalendario] = useState<CalendarioAppuntamenti | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('generale')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [nome, setNome] = useState('')
  const [dataInizio, setDataInizio] = useState('')
  const [dataFine, setDataFine] = useState('')
  const [iniziaSettimana, setIniziaSettimana] = useState<'lunedi' | 'domenica'>('lunedi')
  const [descrizione, setDescrizione] = useState('')
  const [mostraDescrizione, setMostraDescrizione] = useState(false)
  const [colore, setColore] = useState('#3dba8a')
  const [attivo, setAttivo] = useState(true)

  const loadCalendario = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendari/${id}`)
      if (!res.ok) { router.push('/appuntamenti/calendari'); return }
      const data: CalendarioAppuntamenti = await res.json()
      setCalendario(data)
      setNome(data.nome)
      setDataInizio(data.data_inizio ?? '')
      setDataFine(data.data_fine ?? '')
      setIniziaSettimana(data.inizia_settimana)
      setDescrizione(data.descrizione ?? '')
      setMostraDescrizione(data.mostra_descrizione)
      setColore(data.colore)
      setAttivo(data.attivo)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { loadCalendario() }, [loadCalendario])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/calendari/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, data_inizio: dataInizio, data_fine: dataFine, inizia_settimana: iniziaSettimana, descrizione, mostra_descrizione: mostraDescrizione, colore, attivo }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t3)' }}>Caricamento…</div>
  if (!calendario) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Topbar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <button onClick={openSidebar} className="hamburger-btn w-10 h-10 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] place-items-center text-[var(--t2)] hover:text-[var(--tx)] transition-colors shrink-0" aria-label="Apri menu">
          <Menu size={16} />
        </button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, margin: 0 }}>{calendario.nome}</h1>
        <button style={{ width: 28, height: 28, borderRadius: 'var(--r2)', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--ac)', cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Link prenotazione pubblica">
          <Link2 size={13} />
        </button>
        {/* Breadcrumb */}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--t3)', display: 'flex', gap: 6 }}>
          <span style={{ cursor: 'pointer', color: 'var(--t2)' }} onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span>›</span>
          <span style={{ cursor: 'pointer', color: 'var(--t2)' }} onClick={() => router.push('/appuntamenti/calendari')}>Calendari</span>
          <span>›</span>
          <span>{calendario.nome}</span>
        </div>
      </div>

      {/* Warning banner (se non ha pagamenti configurati) */}
      <div style={{ padding: '10px 24px', background: 'rgba(201,160,90,0.1)', borderBottom: '1px solid rgba(201,160,90,0.2)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: 'var(--amber)' }}>
          ⚠ <strong>Presta attenzione</strong> — Imposta il tuo metodo di pagamento per questo calendario
        </span>
      </div>

      {/* Stato toggle top-right */}
      <div style={{ padding: '12px 24px 0', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <span style={{ fontSize: 13, color: 'var(--t2)' }}>Stato calendario</span>
          <div
            onClick={() => setAttivo(a => !a)}
            style={{
              width: 40, height: 22, borderRadius: 11,
              background: attivo ? 'var(--ac)' : 'var(--s3)',
              position: 'relative', cursor: 'pointer', transition: 'background .2s',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: attivo ? 20 : 2, transition: 'left .2s' }} />
          </div>
        </label>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--b1)', flexShrink: 0, overflowX: 'auto', padding: '0 24px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: 'none', border: 'none',
              color: tab === t.id ? 'var(--ac)' : 'var(--t2)',
              borderBottom: tab === t.id ? '2px solid var(--ac)' : '2px solid transparent',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 80px' }}>
        {tab === 'generale' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LBL}>Nome</label>
                <input value={nome} onChange={e => setNome(e.target.value)} style={INP} />
              </div>
              <div>
                <label style={LBL}>Data inizio</label>
                <input type="date" value={dataInizio} onChange={e => setDataInizio(e.target.value)} style={INP} />
              </div>
              <div>
                <label style={LBL}>Data fine</label>
                <input type="date" value={dataFine} onChange={e => setDataFine(e.target.value)} style={INP} />
              </div>
              <div>
                <label style={LBL}>Inizia la settimana di</label>
                <select value={iniziaSettimana} onChange={e => setIniziaSettimana(e.target.value as 'lunedi' | 'domenica')} style={{ ...INP, cursor: 'pointer' }}>
                  <option value="lunedi">Lunedì</option>
                  <option value="domenica">Domenica</option>
                </select>
              </div>
            </div>

            {/* Right column — Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={LBL}>Descrizione</label>
                <textarea
                  value={descrizione}
                  onChange={e => setDescrizione(e.target.value)}
                  placeholder="Descrizione visibile ai clienti…"
                  rows={8}
                  style={{ ...INP, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div
                  onClick={() => setMostraDescrizione(v => !v)}
                  style={{ width: 36, height: 20, borderRadius: 10, background: mostraDescrizione ? 'var(--ac)' : 'var(--s3)', position: 'relative', cursor: 'pointer', transition: 'background .2s', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: mostraDescrizione ? 18 : 2, transition: 'left .2s' }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--t2)' }}>Mostra descrizione ai clienti</span>
              </label>
            </div>

            {/* Colore — full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LBL}>Colore calendario</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {COLORI.map(c => (
                  <button
                    key={c}
                    onClick={() => setColore(c)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: colore === c ? '3px solid var(--tx)' : '2px solid transparent', cursor: 'pointer', outline: 'none', display: 'grid', placeItems: 'center' }}
                  >
                    {colore === c && <Check size={14} color="#fff" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'disponibilita' && <TabPlaceholder label="Servizi / Disponibilità" />}
        {tab === 'escludi'       && <TabPlaceholder label="Escludi Date" />}
        {tab === 'form'          && <TabPlaceholder label="Form prenotazione" />}
        {tab === 'pagamenti'     && <TabPlaceholder label="Pagamenti" />}
        {tab === 'regole'        && <TabPlaceholder label="Regole di prenotazione" />}
        {tab === 'redirect'      && <TabPlaceholder label="Redirect" />}
      </div>

      {/* Save button — fixed bottom */}
      {tab === 'generale' && (
        <div style={{ position: 'sticky', bottom: 0, padding: '12px 24px', borderTop: '1px solid var(--b1)', background: 'var(--bg)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 28px', height: 40, borderRadius: 'var(--r2)', background: saved ? '#4ade80' : 'var(--ac)', color: '#111', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background .3s', opacity: saving ? 0.7 : 1 }}
          >
            {saved ? <><Check size={15} /> Salvato</> : saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      )}
    </div>
  )
}

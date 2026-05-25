'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  FileText, FileSignature, LayoutTemplate, Users2, Wallet, BookOpen, Plus, Search, UserPlus, X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PreventiviCalendar } from './PreventiviCalendar'
import { PreventiviStats } from './PreventiviStats'
import { TemplatesView } from './TemplatesView'
import { NuovaPropostaModal } from './NuovaProposta'
import type { Preventivo, PreventivoTemplate, Cliente } from '@/lib/types'

interface Sessione {
  id: string
  slug: string
  template_nome: string
  colore: string
  selected: number[]
  voci: { desc: string; prezzo: number }[]
  firma: string | null
  firmato_at: string | null
  note: string | null
  created_at: string
  expires_at: string
}


type Tab = 'proposte' | 'contratti' | 'templates' | 'referrals' | 'acconti' | 'risorse'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'proposte',   label: 'Eventi',     icon: <FileText size={14} /> },
  { id: 'contratti',  label: 'Contratti',  icon: <FileSignature size={14} /> },
  { id: 'templates',  label: 'Templates',  icon: <LayoutTemplate size={14} /> },
  { id: 'referrals',  label: 'Referrals',  icon: <Users2 size={14} /> },
  { id: 'acconti',    label: 'Acconti',    icon: <Wallet size={14} /> },
  { id: 'risorse',    label: 'Risorse',    icon: <BookOpen size={14} /> },
]

export const PreventiviDashboard = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tab = searchParams.get('tab')
    return (tab && ['proposte', 'contratti', 'templates', 'referrals', 'acconti', 'risorse'].includes(tab))
      ? (tab as Tab)
      : 'proposte'
  })
  const [preventivi, setPreventivi] = useState<Preventivo[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [showNuova, setShowNuova] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<PreventivoTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingPreventivi, setLoadingPreventivi] = useState(true)
  const [sessioni, setSessioni] = useState<Sessione[]>([])
  const [loadingSessioni, setLoadingSessioni] = useState(true)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/preventivi').then(r => r.ok ? r.json() : []),
      fetch('/api/clienti').then(r => r.ok ? r.json() : []),
    ]).then(([preventivi, clienti]) => {
      setPreventivi(preventivi)
      setClienti(clienti)
    }).catch(() => {}).finally(() => setLoadingPreventivi(false))
  }, [])

  useEffect(() => {
    fetch('/api/preventivo-sessioni')
      .then(r => r.ok ? r.json() : [])
      .then(setSessioni)
      .catch(() => {})
      .finally(() => setLoadingSessioni(false))
  }, [])

  const handleDeleteSessione = async (slug: string) => {
    setDeletingSlug(slug)
    await fetch(`/api/preventivo-sessioni/${slug}`, { method: 'DELETE' })
    setSessioni(prev => prev.filter(s => s.slug !== slug))
    setDeletingSlug(null)
  }

  const handleSessioneCreata = (nuova: Sessione) => {
    setSessioni(prev => [nuova, ...prev])
  }

  const handleSavePreventivo = async (data: Omit<Preventivo, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const res = await fetch('/api/preventivi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const nuovo: Preventivo = await res.json()
        setPreventivi(prev => [nuovo, ...prev])
      }
    } catch {
      // silenzioso — l'utente vede che il preventivo non è apparso
    }
  }

  const handleUseTemplate = (template: PreventivoTemplate) => {
    setActiveTemplate(template)
    setActiveTab('proposte')
    setShowNuova(true)
  }

  const handleDayClick = (date: Date) => {
    setShowNuova(true)
    setActiveTemplate(null)
  }

  const handleClienteClick = (id: string) => {
    router.push(`/clienti?apri=${id}`)
  }

  const currentYear = new Date().getFullYear()

  return (
    <>
      {/* Tab navigation */}
      <div className="preventivi-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '12px 16px',
              fontSize: 13, fontWeight: 500,
              color: activeTab === tab.id ? 'var(--ac)' : 'var(--t2)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--ac)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        {/* Spacer + Risorse a destra */}
        <div style={{ flex: 1 }} />
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 'clamp(12px, 3vw, 20px) clamp(12px, 3vw, 24px)' }}>
        {activeTab === 'proposte' && (
          <div className="preventivi-layout">
            {/* Left: calendar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Action bar */}
              <div className="cal-actions">
                <Button variant="secondary" size="sm" onClick={() => { setActiveTemplate(null); setShowNuova(true) }}>
                  <Plus size={13} />
                  Nuova proposta
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push('/clienti?nuovo=1')}>
                  <UserPlus size={13} />
                  Nuovo cliente
                </Button>
                <div
                  className="cal-search"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 12px', height: 28,
                    background: 'var(--s2)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--r2)',
                    flex: 1,
                  }}
                >
                  <Search size={13} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                  <input
                    placeholder="Cerca cliente, servizio..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: 'var(--tx)', fontSize: 12, width: '100%',
                    }}
                  />
                </div>
              </div>

              {(() => {
                const q = searchQuery.toLowerCase()
                const filteredPreventivi = searchQuery
                  ? preventivi.filter(p => p.cliente.toLowerCase().includes(q) || p.servizio?.toLowerCase().includes(q))
                  : preventivi
                const filteredClienti = searchQuery
                  ? clienti.filter(c => (c.nome1 + ' ' + (c.nome2 ?? '')).toLowerCase().includes(q))
                  : clienti
                return (
                  <PreventiviCalendar
                    preventivi={filteredPreventivi}
                    clienti={filteredClienti}
                    onDayClick={handleDayClick}
                    onClienteClick={handleClienteClick}
                  />
                )
              })()}

              {/* Lista preventivi */}
              {preventivi.length > 0 && (() => {
                const q = searchQuery.toLowerCase()
                const filtered = searchQuery
                  ? preventivi.filter(p => p.cliente.toLowerCase().includes(q) || p.servizio?.toLowerCase().includes(q))
                  : preventivi
                return (
                  <div
                    style={{
                      background: 'var(--s1)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 'var(--r)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
                        {searchQuery
                          ? `${filtered.length} risultat${filtered.length === 1 ? 'o' : 'i'} su ${preventivi.length}`
                          : `Tutti i preventivi (${preventivi.length})`}
                      </span>
                    </div>
                    {filtered.length === 0 ? (
                      <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
                        Nessun preventivo trovato per &ldquo;{searchQuery}&rdquo;
                      </div>
                    ) : (
                      <div>
                        {filtered.map(p => (
                          <PreventivoRow key={p.id} preventivo={p} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              {preventivi.length === 0 && (
                <EmptyState
                  title="Nessun preventivo ancora"
                  description="Crea la tua prima proposta o parti da un template."
                  action={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <Button variant="primary" size="sm" onClick={() => { setActiveTemplate(null); setShowNuova(true) }}>
                        <Plus size={13} /> Nuova proposta
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab('templates')}>
                        <LayoutTemplate size={13} /> Usa un template
                      </Button>
                    </div>
                  }
                />
              )}
            </div>

            {/* Right: stats */}
            <div className="preventivi-stats-col">
              <PreventiviStats preventivi={preventivi} year={currentYear} />
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <TemplatesView
            onUseTemplate={handleUseTemplate}
            onSessioneCreata={handleSessioneCreata}
          />
        )}

        {activeTab === 'contratti' && (
          <ContrattiView
            sessioni={sessioni}
            loading={loadingSessioni}
            deletingSlug={deletingSlug}
            onDelete={handleDeleteSessione}
          />
        )}

        {activeTab === 'referrals' && (
          <ComingSoon label="Referrals" description="Traccia i clienti che ti hanno consigliato ad altri." />
        )}

        {activeTab === 'acconti' && (
          <AccontiView clienti={clienti} loading={loadingPreventivi} />
        )}

        {activeTab === 'risorse' && (
          <ComingSoon label="Risorse" description="Guide, template di email e materiali utili." />
        )}
      </div>

      {/* Modal nuova proposta — key forza remount quando cambia template */}
      <NuovaPropostaModal
        key={activeTemplate?.id ?? 'empty'}
        isOpen={showNuova}
        onClose={() => { setShowNuova(false); setActiveTemplate(null) }}
        template={activeTemplate}
        onSave={handleSavePreventivo}
      />
    </>
  )
}

/* ─── Acconti View ─── */
const AccontiView = ({ clienti, loading }: { clienti: Cliente[]; loading: boolean }) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('tutti')

  if (loading) return <p style={{ color: 'var(--t3)', fontSize: 13, padding: '24px 0' }}>Caricamento…</p>

  const conPagamenti = clienti.filter(c => Number(c.importo_totale) > 0)

  if (conPagamenti.length === 0) return (
    <EmptyState
      title="Nessun cliente con importo"
      description="Aggiungi importo totale e acconti alle schede cliente per vederli qui."
    />
  )

  const fmt = (n: number) => `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`

  // Categorie disponibili
  const categorie = ['tutti', ...Array.from(new Set(conPagamenti.map(c => c.categoria))).sort()]

  // Filtri attivi
  const filtrati = conPagamenti.filter(c => {
    const nome = [c.nome1, c.nome2].filter(Boolean).join(' ').toLowerCase()
    const matchSearch = search === '' || nome.includes(search.toLowerCase())
    const matchCat = catFilter === 'tutti' || c.categoria === catFilter
    return matchSearch && matchCat
  })

  const totaleImportiFiltrati = filtrati.reduce((s, c) => s + Number(c.importo_totale ?? 0), 0)
  const totaleAccontiFiltrati = filtrati.reduce((s, c) => s + Number(c.acconto ?? 0), 0)
  const totaleSaldiFiltrati   = filtrati.reduce((s, c) => s + Math.max(0, Number(c.importo_totale ?? 0) - Number(c.acconto ?? 0)), 0)

  // Ordina: prima chi ha saldo aperto con data_evento più vicina
  const sorted = [...filtrati].sort((a, b) => {
    const saldoA = Number(a.importo_totale ?? 0) - Number(a.acconto ?? 0)
    const saldoB = Number(b.importo_totale ?? 0) - Number(b.acconto ?? 0)
    if (saldoA > 0 && saldoB <= 0) return -1
    if (saldoB > 0 && saldoA <= 0) return 1
    return (a.data_evento ?? '').localeCompare(b.data_evento ?? '')
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Totale contratti', value: fmt(totaleImportiFiltrati), color: 'var(--tx)' },
          { label: 'Acconti incassati', value: fmt(totaleAccontiFiltrati), color: 'var(--ac)' },
          { label: 'Saldi da incassare', value: fmt(totaleSaldiFiltrati), color: totaleSaldiFiltrati > 0 ? 'var(--amber)' : 'var(--t3)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: k.color, fontFamily: 'Syne, sans-serif' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Ricerca + filtri categoria */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 34, background: 'var(--s2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--r2)', maxWidth: 320 }}>
          <Search size={13} style={{ color: 'var(--t3)', flexShrink: 0 }} />
          <input
            placeholder="Cerca cliente…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--tx)', fontSize: 13, width: '100%' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
          )}
        </div>

        {/* Filtri categoria */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categorie.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: catFilter === cat ? '1px solid var(--ac)' : '1px solid rgba(255,255,255,0.08)',
                background: catFilter === cat ? 'rgba(142,201,176,0.14)' : 'var(--s2)',
                color: catFilter === cat ? 'var(--ac)' : 'var(--t3)',
              }}
            >
              {cat === 'tutti' ? 'Tutti' : cat}
              {cat !== 'tutti' && (
                <span style={{ marginLeft: 4, opacity: 0.6 }}>
                  ({conPagamenti.filter(c => c.categoria === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filtrati.length !== conPagamenti.length && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>
            {filtrati.length} su {conPagamenti.length} clienti
          </p>
        )}
      </div>

      {/* Tabella clienti */}
      <div style={{ background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 110px 110px 80px', gap: 8, padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--s2)' }}>
          {['Cliente', 'Evento', 'Totale', 'Acconto', 'Saldo', 'Stato'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {sorted.map(c => {
          const saldo = Math.max(0, Number(c.importo_totale ?? 0) - Number(c.acconto ?? 0))
          const saldato = saldo === 0
          const nomeCliente = [c.nome1, c.nome2].filter(Boolean).join(' & ')
          const accontiList: { importo: number; data: string; nota?: string }[] = c.extra?.acconti ?? []

          return (
            <div
              key={c.id}
              onClick={() => router.push(`/clienti?apri=${c.id}`)}
              style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.12s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--s2)')}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
            >
              {/* Riga principale */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 110px 110px 80px', gap: 8, padding: '12px 18px', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{nomeCliente}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>{c.categoria}</p>
                </div>
                <span style={{ fontSize: 12, color: 'var(--t2)' }}>
                  {c.data_evento ? new Date(c.data_evento).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{fmt(Number(c.importo_totale ?? 0))}</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac)' }}>{fmt(Number(c.acconto ?? 0))}</span>
                  {accontiList.length > 1 && (
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--t3)' }}>{accontiList.length} rate</span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: saldato ? 'var(--t3)' : 'var(--amber)' }}>
                  {saldato ? '—' : fmt(saldo)}
                </span>
                <span style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700,
                  background: saldato ? 'rgba(142,201,176,0.14)' : 'rgba(201,160,90,0.14)',
                  color: saldato ? 'var(--ac)' : 'var(--amber)',
                  border: `1px solid ${saldato ? 'rgba(142,201,176,0.3)' : 'rgba(201,160,90,0.3)'}`,
                  whiteSpace: 'nowrap',
                }}>
                  {saldato ? 'Saldato' : 'Da saldare'}
                </span>
              </div>

              {/* Rata detail (se > 1 acconto) */}
              {accontiList.length > 1 && (
                <div style={{ padding: '0 18px 12px 32px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {accontiList.map((a, i) => (
                    <span key={i} style={{ fontSize: 11, color: 'var(--t3)', background: 'var(--s2)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {fmt(Number(a.importo))} · {a.data ? new Date(a.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—'}{a.nota ? ` · ${a.nota}` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Contratti View ─── */
const ContrattiView = ({ sessioni, loading, deletingSlug, onDelete }: {
  sessioni: Sessione[]
  loading: boolean
  deletingSlug: string | null
  onDelete: (slug: string) => void
}) => {
  const firmati = sessioni.filter(s => !!s.firma)
  const inAttesa = sessioni.filter(s => !s.firma)
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  if (loading) return <p style={{ color: 'var(--t3)', fontSize: 13, padding: '24px 0' }}>Caricamento…</p>

  if (sessioni.length === 0) return (
    <EmptyState
      title="Nessun preventivo inviato"
      description="Invia un preventivo interattivo da un template — apparirà qui quando il cliente lo accetta."
    />
  )

  const SessioneRow = ({ s }: { s: Sessione }) => {
    const totale = Array.isArray(s.voci) && Array.isArray(s.selected)
      ? s.voci.filter((_, i) => s.selected.includes(i)).reduce((acc, v) => acc + v.prezzo, 0)
      : 0
    const firmato = !!s.firma
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap',
        padding: '14px 18px',
        background: firmato ? 'rgba(142,201,176,0.06)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.colore, flexShrink: 0, marginTop: 5 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{s.template_nome}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--t3)' }}>
            Inviato il {new Date(s.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
            {' · '}Scade il {new Date(s.expires_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          {s.note && (
            <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              📝 {s.note}
            </p>
          )}
          {firmato && (
            <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--ac)' }}>
              ✓ Firmato da <strong>{s.firma}</strong> il {new Date(s.firmato_at!).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        {totale > 0 && (
          <span style={{ fontSize: 14, fontWeight: 700, color: s.colore, flexShrink: 0 }}>
            €{totale.toLocaleString('it-IT')}
          </span>
        )}
        <button
          onClick={() => navigator.clipboard.writeText(`${appUrl}/p/${s.slug}`)}
          style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s3)', color: 'var(--t2)', cursor: 'pointer', flexShrink: 0 }}
        >
          Copia link
        </button>
        <button
          onClick={() => onDelete(s.slug)}
          disabled={deletingSlug === s.slug}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s3)', color: 'var(--red)', cursor: 'pointer', flexShrink: 0, display: 'grid', placeItems: 'center', opacity: deletingSlug === s.slug ? 0.5 : 1 }}
          title="Elimina"
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Firmati */}
      {firmati.length > 0 && (
        <div style={{ background: 'var(--s1)', border: '1px solid rgba(142,201,176,0.2)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(142,201,176,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--ac)' }}>
              ✓ Firmati ({firmati.length})
            </span>
          </div>
          {firmati.map(s => <SessioneRow key={s.id} s={s} />)}
        </div>
      )}

      {/* In attesa */}
      {inAttesa.length > 0 && (
        <div style={{ background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--t2)' }}>
              In attesa di firma ({inAttesa.length})
            </span>
          </div>
          {inAttesa.map(s => <SessioneRow key={s.id} s={s} />)}
        </div>
      )}
    </div>
  )
}

/* ─── Preventivo Row ─── */
const STATO_COLORS: Record<string, string> = {
  bozza:     'var(--t3)',
  inviato:   'var(--amber)',
  accettato: 'var(--ac)',
  rifiutato: 'var(--red)',
}

const STATO_LABELS: Record<string, string> = {
  bozza: 'Bozza', inviato: 'Inviato', accettato: 'Accettato', rifiutato: 'Rifiutato',
}

const PreventivoRow = ({ preventivo: p }: { preventivo: Preventivo }) => (
  <div
    style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 18px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      cursor: 'pointer',
      transition: 'background 0.12s',
    }}
    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--s2)')}
    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>{p.cliente}</p>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>
        {p.servizio ?? '—'}
        {p.data_evento && ` · ${new Date(p.data_evento).toLocaleDateString('it-IT')}`}
      </p>
    </div>
    <span
      style={{
        fontSize: 11, padding: '3px 9px', borderRadius: 20,
        background: 'rgba(255,255,255,0.04)',
        color: STATO_COLORS[p.stato] ?? 'var(--t3)',
        fontWeight: 500,
      }}
    >
      {STATO_LABELS[p.stato] ?? p.stato}
    </span>
    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', minWidth: 80, textAlign: 'right' }}>
      {p.totale.toLocaleString('it-IT')} €
    </span>
  </div>
)

/* ─── Empty State ─── */
const EmptyState = ({
  title, description, action,
}: {
  title: string; description: string; action?: React.ReactNode
}) => (
  <div
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '48px 24px',
      background: 'var(--s1)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 'var(--r)',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'var(--s2)', border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <FileText size={20} style={{ color: 'var(--t3)' }} />
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--tx)' }}>{title}</p>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--t3)' }}>{description}</p>
    </div>
    {action}
  </div>
)

/* ─── Coming Soon ─── */
const ComingSoon = ({ label, description }: { label: string; description: string }) => (
  <EmptyState
    title={`${label} — in arrivo`}
    description={description}
  />
)

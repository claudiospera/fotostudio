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
    Promise.allSettled([
      fetch('/api/preventivi').then(r => r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))),
      fetch('/api/clienti').then(r => r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))),
    ]).then(([prevResult, clientiResult]) => {
      if (prevResult.status === 'fulfilled') setPreventivi(prevResult.value)
      else console.error('Errore fetch preventivi:', prevResult.reason)
      if (clientiResult.status === 'fulfilled') setClienti(clientiResult.value)
      else console.error('Errore fetch clienti:', clientiResult.reason)
    }).finally(() => setLoadingPreventivi(false))
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
          <RisorseView />
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

/* ─── Risorse View ─── */
const GUIDE_PREZZI = [
  {
    id: 'matrimonio',
    titolo: 'Matrimonio',
    colore: '#2e7d5e',
    emoji: '💍',
    hero: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    foto: [
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80',
    ],
    pacchetti: [
      { nome: 'Essential', prezzo: 1800, ore: 8, desc: 'Cerimonia + Ricevimento · 500 foto consegnate · Galleria privata online' },
      { nome: 'Classic', prezzo: 2500, ore: 10, desc: 'Preparativi + Cerimonia + Ricevimento · 800 foto · Album 24×30 incluso' },
      { nome: 'Premium', prezzo: 3500, ore: 'tutto il giorno', desc: '2 Fotografi · Drone · Album 30×40 · Video Highlights · 1200 foto' },
    ],
  },
  {
    id: 'promessa',
    titolo: 'Promessa di Matrimonio',
    colore: '#7c5cbf',
    emoji: '💜',
    hero: 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=800&q=80',
    foto: [
      'https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=400&q=80',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400&q=80',
    ],
    pacchetti: [
      { nome: 'Base', prezzo: 900, ore: 4, desc: 'Cerimonia + momento conviviale · 300 foto · Galleria online' },
      { nome: 'Completo', prezzo: 1400, ore: 6, desc: 'Preparativi + Cerimonia + Ricevimento · 500 foto · Mini album' },
    ],
  },
  {
    id: 'battesimo',
    titolo: 'Battesimo',
    colore: '#1a7abf',
    emoji: '🕊️',
    hero: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80',
    foto: [
      'https://images.unsplash.com/photo-1612532275214-e4ca76d0e4d1?w=400&q=80',
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&q=80',
    ],
    pacchetti: [
      { nome: 'Essenziale', prezzo: 400, ore: 3, desc: 'Cerimonia + foto di gruppo · 200 foto · Galleria online' },
      { nome: 'Completo', prezzo: 650, ore: 5, desc: 'Preparativi + Cerimonia + Pranzo · 400 foto · Album 20×20' },
    ],
  },
  {
    id: 'comunione',
    titolo: 'Comunione / Cresima',
    colore: '#c9a05a',
    emoji: '✝️',
    hero: 'https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?w=800&q=80',
    foto: [
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    ],
    pacchetti: [
      { nome: 'Base', prezzo: 350, ore: 3, desc: 'Cerimonia + foto ricordo · 200 foto · Galleria online' },
      { nome: 'Premium', prezzo: 550, ore: 5, desc: 'Preparativi + Cerimonia + Pranzo · 350 foto · Album 20×20' },
    ],
  },
  {
    id: '18anni',
    titolo: '18 Anni',
    colore: '#d97070',
    emoji: '🎂',
    hero: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
    foto: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80',
    ],
    pacchetti: [
      { nome: 'Party', prezzo: 300, ore: 3, desc: 'Festa + foto di gruppo · 200 foto · Galleria online' },
      { nome: 'Full Day', prezzo: 500, ore: 6, desc: 'Shooting + Festa · 350 foto · Album 20×30' },
    ],
  },
  {
    id: '1anno',
    titolo: '1° Anno / Smash Cake',
    colore: '#e07aa0',
    emoji: '🎈',
    hero: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',
    foto: [
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80',
      'https://images.unsplash.com/photo-1504184006757-bc80e19e0b96?w=400&q=80',
    ],
    pacchetti: [
      { nome: 'Mini', prezzo: 200, ore: 1.5, desc: 'Sessione studio · 80 foto consegnate · Galleria online' },
      { nome: 'Smash Cake', prezzo: 320, ore: 2.5, desc: 'Sessione studio + torta · 150 foto · Album 20×20' },
    ],
  },
  {
    id: 'anniversario',
    titolo: 'Anniversario',
    colore: '#b35c8a',
    emoji: '💑',
    hero: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
    foto: [
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
      'https://images.unsplash.com/photo-1620434880200-d6be1f59a7ad?w=400&q=80',
    ],
    pacchetti: [
      { nome: 'Shooting', prezzo: 350, ore: 2, desc: 'Sessione outdoor · 150 foto · Galleria online' },
      { nome: 'Celebrazione', prezzo: 600, ore: 4, desc: 'Shooting + Cena/Evento · 300 foto · Album 24×30' },
    ],
  },
  {
    id: 'shooting',
    titolo: 'Shooting Fotografico',
    colore: '#4a9e8a',
    emoji: '📸',
    hero: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
    foto: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80',
    ],
    pacchetti: [
      { nome: 'Mini', prezzo: 150, ore: 1, desc: '1 location · 50 foto consegnate · Galleria online' },
      { nome: 'Standard', prezzo: 280, ore: 2, desc: '2 location · 120 foto · Galleria online' },
      { nome: 'Premium', prezzo: 450, ore: 4, desc: 'Location illimitate · 250 foto · Album incluso' },
    ],
  },
]

function RisorseView() {
  const [aperto, setAperto] = useState<string | null>(null)

  const handleStampa = (id: string) => {
    const el = document.getElementById(`guida-${id}`)
    if (!el) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Guida Prezzi</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; background: #fff; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${el.innerHTML}</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 }}>Guide Prezzi</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--t3)' }}>Seleziona un servizio per visualizzare e stampare la tua guida prezzi personalizzata.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {GUIDE_PREZZI.map(g => (
          <div
            key={g.id}
            onClick={() => setAperto(aperto === g.id ? null : g.id)}
            style={{
              background: 'var(--s1)', border: aperto === g.id ? `1px solid ${g.colore}` : '1px solid rgba(255,255,255,0.07)',
              borderRadius: 'var(--r)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{ height: 3, background: g.colore }} />
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{g.emoji}</span>
              <div>
                <p style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--tx)' }}>{g.titolo}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>{g.pacchetti.length} pacchetti</p>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--t3)' }}>{aperto === g.id ? '▲' : '▼'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview + stampa */}
      {aperto && (() => {
        const g = GUIDE_PREZZI.find(x => x.id === aperto)!
        return (
          <div style={{ background: 'var(--s1)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 'var(--r)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>Anteprima — {g.titolo}</span>
              <button
                onClick={() => handleStampa(g.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 'var(--r2)', background: g.colore, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                🖨️ Stampa / PDF
              </button>
            </div>

            {/* Template stampabile */}
            <div id={`guida-${g.id}`} style={{ background: '#fff', color: '#111', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
              {/* Hero */}
              <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.hero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.65))` }} />
                <div style={{ position: 'absolute', bottom: 32, left: 40, right: 40 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Storie da Raccontare · Claudio Spera</p>
                  <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {g.emoji} {g.titolo}
                  </h1>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Guida ai Prezzi 2026</p>
                </div>
              </div>

              {/* Pacchetti */}
              <div style={{ padding: '40px 40px 24px' }}>
                <h2 style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em' }}>I Pacchetti</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {g.pacchetti.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '20px 24px', border: `2px solid ${i === 1 ? g.colore : '#eee'}`, borderRadius: 12, background: i === 1 ? `${g.colore}08` : '#fff' }}>
                      <div style={{ flexShrink: 0, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: g.colore }}>€{p.prezzo.toLocaleString('it-IT')}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{typeof p.ore === 'number' ? `${p.ore}h` : p.ore}</p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#111' }}>{p.nome}</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.6 }}>{p.desc}</p>
                      </div>
                      {i === 1 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: g.colore, color: '#fff', fontWeight: 700, flexShrink: 0 }}>POPOLARE</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery placeholder */}
              <div style={{ padding: '0 40px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {g.foto.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding: '20px 40px 32px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>Storie da Raccontare</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#999' }}>Claudio Spera · Fotografo · Mirabella Eclano (AV)</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#999' }}>storiedaraccontare.it</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#999' }}>+39 389 785 5581</p>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
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
            {!firmato && <>{' · '}Scade il {new Date(s.expires_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</>}
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
          onClick={() => { if (confirm('Eliminare questo preventivo?')) onDelete(s.slug) }}
          disabled={deletingSlug === s.slug}
          style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, border: '1px solid rgba(209,112,112,0.3)', background: 'rgba(209,112,112,0.08)', color: 'var(--red)', cursor: 'pointer', flexShrink: 0, opacity: deletingSlug === s.slug ? 0.5 : 1 }}
        >
          {deletingSlug === s.slug ? '...' : 'Elimina'}
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

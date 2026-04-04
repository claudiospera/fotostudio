'use client'

import { useState } from 'react'
import {
  FileText, FileSignature, LayoutTemplate, Users2, Wallet, BookOpen, Plus, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PreventiviCalendar } from './PreventiviCalendar'
import { PreventiviStats } from './PreventiviStats'
import { TemplatesView } from './TemplatesView'
import { NuovaPropostaModal } from './NuovaProposta'
import type { Preventivo, PreventivoTemplate } from '@/lib/types'

/* ─── Mock data (da sostituire con Supabase) ─── */
const MOCK_PREVENTIVI: Preventivo[] = []

type Tab = 'proposte' | 'contratti' | 'templates' | 'referrals' | 'acconti' | 'risorse'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'proposte',   label: 'Proposte',   icon: <FileText size={14} /> },
  { id: 'contratti',  label: 'Contratti',  icon: <FileSignature size={14} /> },
  { id: 'templates',  label: 'Templates',  icon: <LayoutTemplate size={14} /> },
  { id: 'referrals',  label: 'Referrals',  icon: <Users2 size={14} /> },
  { id: 'acconti',    label: 'Acconti',    icon: <Wallet size={14} /> },
  { id: 'risorse',    label: 'Risorse',    icon: <BookOpen size={14} /> },
]

export const PreventiviDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('proposte')
  const [preventivi, setPreventivi] = useState<Preventivo[]>(MOCK_PREVENTIVI)
  const [showNuova, setShowNuova] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<PreventivoTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSavePreventivo = (data: Omit<Preventivo, 'id' | 'user_id' | 'created_at'>) => {
    const nuovo: Preventivo = {
      ...data,
      id: crypto.randomUUID(),
      user_id: 'mock',
      created_at: new Date().toISOString(),
    }
    setPreventivi(prev => [nuovo, ...prev])
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
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => { setActiveTemplate(null); setShowNuova(true) }}>
                  <Plus size={13} />
                  Nuova proposta
                </Button>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 12px', height: 28,
                    background: 'var(--s2)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--r2)',
                    flex: 1, maxWidth: 320,
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

              <PreventiviCalendar preventivi={preventivi} onDayClick={handleDayClick} />

              {/* Lista preventivi */}
              {preventivi.length > 0 && (
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
                      Tutti i preventivi ({preventivi.length})
                    </span>
                  </div>
                  <div>
                    {preventivi
                      .filter(p => {
                        if (!searchQuery) return true
                        const q = searchQuery.toLowerCase()
                        return p.cliente.toLowerCase().includes(q) || p.servizio?.toLowerCase().includes(q)
                      })
                      .map(p => (
                        <PreventivoRow key={p.id} preventivo={p} />
                      ))}
                  </div>
                </div>
              )}

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
          <TemplatesView onUseTemplate={handleUseTemplate} />
        )}

        {activeTab === 'contratti' && (
          <ComingSoon label="Contratti" description="Gestisci contratti firmati e in attesa di firma." />
        )}

        {activeTab === 'referrals' && (
          <ComingSoon label="Referrals" description="Traccia i clienti che ti hanno consigliato ad altri." />
        )}

        {activeTab === 'acconti' && (
          <ComingSoon label="Acconti" description="Monitora i pagamenti e gli acconti ricevuti." />
        )}

        {activeTab === 'risorse' && (
          <ComingSoon label="Risorse" description="Guide, template di email e materiali utili." />
        )}
      </div>

      {/* Modal nuova proposta */}
      <NuovaPropostaModal
        isOpen={showNuova}
        onClose={() => { setShowNuova(false); setActiveTemplate(null) }}
        template={activeTemplate}
        onSave={handleSavePreventivo}
      />
    </>
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

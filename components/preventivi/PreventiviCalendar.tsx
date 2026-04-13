'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ClienteCardModal } from '@/components/clienti/ClienteCardModal'
import type { Preventivo, Cliente } from '@/lib/types'

interface PreventiviCalendarProps {
  preventivi: Preventivo[]
  clienti?: Cliente[]
  onDayClick: (date: Date) => void
  onClienteClick?: (id: string) => void
}

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
const GIORNI = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM']

const CAT_COLORS: Record<string, string> = {
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

type ViewMode = 'mese' | 'settimana' | 'giorno'

interface DayEvent {
  id: string
  label: string
  color: string
  type: 'preventivo' | 'cliente'
}

export const PreventiviCalendar = ({ preventivi, clienti = [], onDayClick, onClienteClick }: PreventiviCalendarProps) => {
  const router = useRouter()
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [view, setView] = useState<ViewMode>('mese')
  const [popup, setPopup] = useState<{ date: string; events: DayEvent[] } | null>(null)
  const [cardModal, setCardModal] = useState<{ clienti: Cliente[]; dateLabel: string } | null>(null)

  const prevMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))
  const nextMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))
  const goToday   = () => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))

  const year  = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)

  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const getEventsForDay = (day: number): DayEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const evPreventivi: DayEvent[] = preventivi
      .filter(p => p.data_evento === dateStr)
      .map(p => ({ id: p.id, label: p.cliente, color: 'var(--ac)', type: 'preventivo' as const }))
    const evClienti: DayEvent[] = clienti
      .filter(c => c.data_evento === dateStr)
      .map(c => ({
        id: c.id,
        label: c.nome1 + (c.nome2 ? ` & ${c.nome2}` : ''),
        color: CAT_COLORS[c.categoria] ?? '#8ec9b0',
        type: 'cliente' as const,
      }))
    return [...evClienti, ...evPreventivi]
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayClienti = clienti.filter(c => c.data_evento === dateStr)

    if (dayClienti.length > 0) {
      const dateLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      setCardModal({ clienti: dayClienti, dateLabel })
      return
    }

    const events = getEventsForDay(day)
    if (events.length > 0) {
      setPopup({ date: dateStr, events })
    } else {
      onDayClick(new Date(year, month, day))
    }
  }

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--r)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Controls row */}
        <div className="cal-header-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={prevMonth} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer' }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={nextMonth} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer' }}>
              <ChevronRight size={14} />
            </button>
            <Button variant="ghost" size="sm" onClick={goToday}>Oggi</Button>
          </div>
          <span className="cal-month-label" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--tx)', minWidth: 140, textAlign: 'center' }}>
            {MESI[month].toUpperCase()} {year}
          </span>
          <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
            {(['mese', 'settimana', 'giorno'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, background: view === v ? 'var(--s3)' : 'var(--s2)', color: view === v ? 'var(--tx)' : 'var(--t3)', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {/* Legenda — nascosta su mobile via CSS */}
        <div className="cal-legend">
          <LegendDot color="var(--ac)" label="Preventivi" />
          {Object.entries(CAT_COLORS).slice(0, 3).map(([cat, col]) => (
            <LegendDot key={cat} color={col} label={cat} />
          ))}
          {Object.keys(CAT_COLORS).length > 3 && (
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>+{Object.keys(CAT_COLORS).length - 3} categorie</span>
          )}
        </div>
      </div>

      {/* Giorni settimana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {GIORNI.map(g => (
          <div key={g} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--t3)', letterSpacing: '0.06em' }}>
            {g}
          </div>
        ))}
      </div>

      {/* Griglia */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          const events = day ? getEventsForDay(day) : []
          const todayCell = day ? isToday(day) : false
          const hasEvents = events.length > 0
          return (
            <div
              key={i}
              onClick={() => day && handleDayClick(day)}
              className="cal-cell"
              style={{
                padding: '6px 8px',
                borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                borderBottom: i < cells.length - 7 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: day ? 'pointer' : 'default',
                background: todayCell ? 'rgba(142,201,176,0.06)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (day) (e.currentTarget as HTMLDivElement).style.background = todayCell ? 'rgba(142,201,176,0.1)' : 'var(--s2)' }}
              onMouseLeave={e => { if (day) (e.currentTarget as HTMLDivElement).style.background = todayCell ? 'rgba(142,201,176,0.06)' : 'transparent' }}
            >
              {day && (
                <>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, borderRadius: '50%', fontSize: 12, fontWeight: 500,
                    background: todayCell ? 'var(--ac)' : 'transparent',
                    color: todayCell ? '#0f0f0f' : 'var(--t2)',
                  }}>
                    {day}
                  </span>
                  {hasEvents && (
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {events.slice(0, 2).map(ev => (
                        <div key={ev.id} style={{
                          fontSize: 10, padding: '2px 5px', borderRadius: 4,
                          background: `${ev.color}22`,
                          color: ev.color,
                          border: `1px solid ${ev.color}44`,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                        }} title={ev.label}>
                          {ev.label}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <span style={{ fontSize: 10, color: 'var(--t3)' }}>+{events.length - 2} altri</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Card modal per clienti del giorno */}
      {cardModal && (
        <ClienteCardModal
          clienti={cardModal.clienti}
          dateLabel={cardModal.dateLabel}
          onClose={() => setCardModal(null)}
          onModifica={(c) => { setCardModal(null); router.push(`/clienti?apri=${c.id}`) }}
          onElimina={(c) => {
            if (!confirm(`Eliminare ${c.nome1}?`)) return
            fetch(`/api/clienti/${c.id}`, { method: 'DELETE' })
              .then(r => { if (r.ok) setCardModal(prev => prev ? { ...prev, clienti: prev.clienti.filter(x => x.id !== c.id) } : null) })
          }}
        />
      )}

      {/* Popup eventi del giorno */}
      {popup && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPopup(null)}
        >
          <div
            style={{ background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--r)', width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                {new Date(popup.date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setPopup(null)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', fontSize: 14, display: 'grid', placeItems: 'center' }}>×</button>
            </div>
            <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {popup.events.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => {
                    if (ev.type === 'cliente' && onClienteClick) {
                      setPopup(null)
                      onClienteClick(ev.id)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: 'var(--s2)', borderRadius: 'var(--r2)', border: `1px solid ${ev.color}33`,
                    cursor: ev.type === 'cliente' && onClienteClick ? 'pointer' : 'default',
                    transition: 'border-color 0.12s',
                  }}
                  onMouseEnter={e => { if (ev.type === 'cliente' && onClienteClick) (e.currentTarget as HTMLDivElement).style.borderColor = `${ev.color}77` }}
                  onMouseLeave={e => { if (ev.type === 'cliente' && onClienteClick) (e.currentTarget as HTMLDivElement).style.borderColor = `${ev.color}33` }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{ev.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>
                      {ev.type === 'cliente' ? 'Cliente · apri scheda →' : 'Preventivo'}
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => { setPopup(null); onDayClick(new Date(popup.date + 'T00:00:00')) }}
                style={{ marginTop: 4, padding: '8px', borderRadius: 'var(--r2)', border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 12 }}
              >
                + Nuovo preventivo in questo giorno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
    <span style={{ fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{label}</span>
  </div>
)

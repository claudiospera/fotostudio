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
const GIORNI_BREVI = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM']
const GIORNI_LUNGHI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

const PAL = {
  coral:   '#e8614a',
  yellow:  '#f2c929',
  pink:    '#e8849d',
  magenta: '#d1346b',
  orange:  '#e8a02a',
  cyan:    '#38b8c8',
}

const CAT_COLORS: Record<string, string> = {
  'Matrimonio':             PAL.magenta,
  'Promessa di Matrimonio': PAL.pink,
  'Battesimo':              PAL.cyan,
  'Comunione':              '#5e8a5e',
  '1 Anno':                 PAL.yellow,
  '18 Anni':                PAL.coral,
  'Anniversario':           '#6b5b8a',
  'Shooting Fotografico':   PAL.orange,
  'Altra Cerimonia':        '#7a6b55',
}

type ViewMode = 'mese' | 'settimana' | 'giorno'

interface DayEvent {
  id: string
  label: string
  color: string
  type: 'preventivo' | 'cliente'
}

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const getWeekStart = (d: Date): Date => {
  const day = (d.getDay() + 6) % 7 // 0=Mon
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
}

export const PreventiviCalendar = ({ preventivi, clienti = [], onDayClick, onClienteClick }: PreventiviCalendarProps) => {
  const router = useRouter()
  const today = new Date()
  const todayStr = toDateStr(today)
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const [view, setView] = useState<ViewMode>('mese')
  const [popup, setPopup] = useState<{ date: string; events: DayEvent[] } | null>(null)
  const [cardModal, setCardModal] = useState<{ clienti: Cliente[]; dateLabel: string } | null>(null)

  const prev = () => {
    if (view === 'mese') setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))
    else if (view === 'settimana') setCurrent(new Date(current.getTime() - 7 * 86400000))
    else setCurrent(new Date(current.getTime() - 86400000))
  }
  const next = () => {
    if (view === 'mese') setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))
    else if (view === 'settimana') setCurrent(new Date(current.getTime() + 7 * 86400000))
    else setCurrent(new Date(current.getTime() + 86400000))
  }
  const goToday = () => setCurrent(new Date(today.getFullYear(), today.getMonth(), today.getDate()))

  const getEventsForDate = (dateStr: string): DayEvent[] => {
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

  const handleDayClick = (date: Date) => {
    const dateStr = toDateStr(date)
    const dayClienti = clienti.filter(c => c.data_evento === dateStr)

    if (dayClienti.length > 0) {
      const dateLabel = date.toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      setCardModal({ clienti: dayClienti, dateLabel })
      return
    }

    const events = getEventsForDate(dateStr)
    if (events.length > 0) {
      setPopup({ date: dateStr, events })
    } else {
      onDayClick(date)
    }
  }

  /* ── Header label ── */
  const headerLabel = (() => {
    if (view === 'mese') return `${MESI[current.getMonth()].toUpperCase()} ${current.getFullYear()}`
    if (view === 'giorno') {
      return current.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    // settimana
    const ws = getWeekStart(current)
    const we = new Date(ws.getTime() + 6 * 86400000)
    const startDay = ws.getDate()
    const endDay = we.getDate()
    const startMon = MESI[ws.getMonth()].substring(0, 3).toUpperCase()
    const endMon = MESI[we.getMonth()].substring(0, 3).toUpperCase()
    if (ws.getMonth() === we.getMonth()) return `${startDay} – ${endDay} ${endMon} ${we.getFullYear()}`
    return `${startDay} ${startMon} – ${endDay} ${endMon} ${we.getFullYear()}`
  })()

  /* ── Month view data ── */
  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  /* ── Week view data ── */
  const weekStart = getWeekStart(current)
  const weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86400000))

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--r)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="cal-header-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div className="cal-nav-group" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={prev}
              className="cal-nav-btn"
              aria-label="Precedente"
              style={{ background: PAL.coral, border: 'none', color: '#1a0a06' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="cal-nav-btn"
              aria-label="Successivo"
              style={{ background: PAL.cyan, border: 'none', color: '#061618' }}
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={goToday}
              style={{
                minHeight: 36, padding: '0 16px', fontSize: 14, fontWeight: 600,
                background: PAL.yellow, border: 'none', borderRadius: 8,
                color: '#1a1400', cursor: 'pointer',
              }}
            >
              Oggi
            </button>
          </div>
          <span className="cal-month-label" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: PAL.orange, textAlign: 'center', flex: 1, letterSpacing: '-0.01em' }}>
            {headerLabel}
          </span>
          <div className="cal-view-switcher" style={{ display: 'flex', border: `1px solid ${PAL.magenta}44`, borderRadius: 8, overflow: 'hidden' }}>
            {([
              { v: 'mese',      color: PAL.magenta },
              { v: 'settimana', color: PAL.orange  },
              { v: 'giorno',    color: PAL.pink    },
            ] as { v: ViewMode; color: string }[]).map(({ v, color }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '6px 12px', fontSize: 13, fontWeight: 600,
                  background: view === v ? color : 'var(--s2)',
                  color: view === v ? '#fff' : 'var(--t3)',
                  border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                  minHeight: 36, transition: 'background 0.15s, color 0.15s',
                }}
              >
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

      {/* ── MONTH VIEW ── */}
      {view === 'mese' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {GIORNI_BREVI.map((g, i) => {
              const dayColors = [PAL.coral, PAL.orange, PAL.yellow, PAL.cyan, PAL.pink, PAL.magenta, PAL.orange]
              return (
                <div key={g} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: dayColors[i], letterSpacing: '0.06em' }}>
                  {g}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
              const events = day ? getEventsForDate(dateStr) : []
              const isToday = dateStr === todayStr
              return (
                <div
                  key={i}
                  onClick={() => day && handleDayClick(new Date(year, month, day))}
                  className="cal-cell"
                  style={{
                    padding: '6px 8px',
                    borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    borderBottom: i < cells.length - 7 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    cursor: day ? 'pointer' : 'default',
                    background: isToday ? 'rgba(142,201,176,0.06)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (day) (e.currentTarget as HTMLDivElement).style.background = isToday ? 'rgba(142,201,176,0.1)' : 'var(--s2)' }}
                  onMouseLeave={e => { if (day) (e.currentTarget as HTMLDivElement).style.background = isToday ? 'rgba(142,201,176,0.06)' : 'transparent' }}
                >
                  {day && (
                    <>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 22, height: 22, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                        background: isToday ? PAL.magenta : 'transparent',
                        color: isToday ? '#fff' : 'var(--t2)',
                        boxShadow: isToday ? `0 0 8px ${PAL.magenta}88` : 'none',
                      }}>
                        {day}
                      </span>
                      {events.length > 0 && (
                        <div className="cal-event-list">
                          {events.slice(0, 2).map(ev => (
                            <div key={ev.id} className="cal-event-pill" style={{
                              background: `${ev.color}22`,
                              color: ev.color,
                              border: `1px solid ${ev.color}44`,
                            }} title={ev.label}>
                              {ev.label}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <span style={{ fontSize: 10, color: 'var(--t3)' }}>+{events.length - 2}</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── WEEK VIEW ── */}
      {view === 'settimana' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {weekDays.map((d, i) => {
              const isToday = toDateStr(d) === todayStr
              return (
                <div key={i} style={{
                  padding: '10px 6px', textAlign: 'center',
                  background: isToday ? 'rgba(142,201,176,0.06)' : 'transparent',
                  borderRight: i < 6 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {GIORNI_BREVI[i]}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: isToday ? PAL.magenta : 'transparent',
                    color: isToday ? '#fff' : 'var(--tx)',
                    fontSize: 14, fontWeight: 700,
                    boxShadow: isToday ? `0 0 10px ${PAL.magenta}88` : 'none',
                  }}>
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 180 }}>
            {weekDays.map((d, i) => {
              const dateStr = toDateStr(d)
              const events = getEventsForDate(dateStr)
              const isToday = dateStr === todayStr
              return (
                <div
                  key={i}
                  onClick={() => handleDayClick(d)}
                  style={{
                    padding: '8px 4px', minHeight: 120,
                    borderRight: i < 6 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isToday ? 'rgba(142,201,176,0.04)' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = isToday ? 'rgba(142,201,176,0.08)' : 'var(--s2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isToday ? 'rgba(142,201,176,0.04)' : 'transparent' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {events.map(ev => (
                      <div key={ev.id} style={{
                        fontSize: 10, padding: '3px 5px', borderRadius: 4,
                        background: `${ev.color}22`, color: ev.color,
                        border: `1px solid ${ev.color}44`,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }} title={ev.label}>
                        {ev.label}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── DAY VIEW ── */}
      {view === 'giorno' && (
        <div style={{ padding: 16 }}>
          {(() => {
            const dateStr = toDateStr(current)
            const events = getEventsForDate(dateStr)
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.length === 0 ? (
                  <div
                    onClick={() => onDayClick(current)}
                    style={{
                      padding: '32px 16px', textAlign: 'center',
                      border: '1px dashed rgba(255,255,255,0.10)', borderRadius: 'var(--r2)',
                      color: 'var(--t3)', fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Nessun evento · clicca per aggiungere
                  </div>
                ) : (
                  events.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        if (ev.type === 'cliente' && onClienteClick) onClienteClick(ev.id)
                        else setPopup({ date: dateStr, events: [ev] })
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 'var(--r2)',
                        background: `${ev.color}18`, border: `1px solid ${ev.color}44`,
                        cursor: 'pointer', transition: 'border-color 0.12s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${ev.color}88` }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${ev.color}44` }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{ev.label}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>
                          {ev.type === 'cliente' ? 'Cliente · apri scheda →' : 'Preventivo'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <button
                  onClick={() => onDayClick(current)}
                  style={{
                    marginTop: 4, padding: '10px', borderRadius: 'var(--r2)',
                    border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent',
                    color: 'var(--t3)', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  + Nuovo preventivo in questo giorno
                </button>
              </div>
            )
          })()}
        </div>
      )}

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

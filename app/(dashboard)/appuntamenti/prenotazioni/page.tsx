'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import type { Prenotazione, CalendarioAppuntamenti } from '@/lib/types'

type ViewMode = 'mese' | 'settimana' | 'giorno'
type TabFilter = 'tutte' | 'prossimamente' | 'passato' | 'annullate'

const GIORNI_BREVE = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM']
const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

// Ore visibili 08:00 → 20:00 con intervalli di 15 minuti
const SLOT_START = 8   // 08:00
const SLOT_END   = 20  // 20:00
const SLOT_MIN   = 15  // 15 minuti

function buildTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = SLOT_START; h < SLOT_END; h++) {
    for (let m = 0; m < 60; m += SLOT_MIN) {
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    }
  }
  return slots
}
const TIME_SLOTS = buildTimeSlots() // ['08:00','08:15','08:30','08:45','09:00', ...]

// Slot altezza in px
const SLOT_H = 20

function getWeekDates(base: Date): Date[] {
  const d = new Date(base)
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1 // lunedì = 0
  d.setDate(d.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d)
    x.setDate(d.getDate() + i)
    return x
  })
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatHeaderDate(d: Date) {
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
}

function isToday(d: Date) {
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

function slotIndex(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - SLOT_START) * 60 + m) / SLOT_MIN
}

export default function PrenotazioniPage() {
  const openSidebar = useUIStore(s => s.openSidebar)
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const [view, setView] = useState<ViewMode>('settimana')
  const [tab, setTab] = useState<TabFilter>('tutte')
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([])
  const [calendari, setCalendari] = useState<CalendarioAppuntamenti[]>([])
  const [showCalendariFilter, setShowCalendariFilter] = useState(false)
  const [selectedCalendari, setSelectedCalendari] = useState<string[]>([]) // empty = tutti
  const nowLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/prenotazioni').then(r => r.ok ? r.json() : []),
      fetch('/api/calendari').then(r => r.ok ? r.json() : []),
    ]).then(([p, c]) => { setPrenotazioni(p); setCalendari(c) }).catch(() => {})
  }, [])

  // Scroll to current time on mount
  useEffect(() => {
    if (nowLineRef.current) {
      nowLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const weekDates = getWeekDates(current)

  const prevPeriod = () => {
    const d = new Date(current)
    if (view === 'settimana') d.setDate(d.getDate() - 7)
    else if (view === 'mese') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 1)
    setCurrent(d)
  }
  const nextPeriod = () => {
    const d = new Date(current)
    if (view === 'settimana') d.setDate(d.getDate() + 7)
    else if (view === 'mese') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 1)
    setCurrent(d)
  }

  // Header label
  const headerLabel = (() => {
    if (view === 'settimana') {
      const first = weekDates[0]
      const last  = weekDates[6]
      const d1 = first.getDate()
      const d2 = last.getDate()
      const m1 = MESI[first.getMonth()].slice(0,3).toUpperCase()
      const m2 = MESI[last.getMonth()].slice(0,3).toUpperCase()
      const y  = last.getFullYear()
      return first.getMonth() === last.getMonth()
        ? `${d1} – ${d2} ${m1} ${y}`
        : `${d1} ${m1} – ${d2} ${m2} ${y}`
    }
    if (view === 'mese') return `${MESI[current.getMonth()]} ${current.getFullYear()}`
    return current.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  })()

  // Filter prenotazioni by tab
  const filtered = prenotazioni.filter(p => {
    if (selectedCalendari.length > 0 && !selectedCalendari.includes(p.calendario_id)) return false
    if (tab === 'annullate') return p.stato === 'annullata'
    if (tab === 'passato') return p.data < isoDate(today) && p.stato !== 'annullata'
    if (tab === 'prossimamente') return p.data >= isoDate(today) && p.stato !== 'annullata'
    return p.stato !== 'annullata'
  })

  // Get prenotazioni for a specific day+slot
  const getPrenotazioni = (dateStr: string) =>
    filtered.filter(p => p.data === dateStr)

  // Now line position
  const nowSlot = (() => {
    const h = today.getHours()
    const m = today.getMinutes()
    if (h < SLOT_START || h >= SLOT_END) return null
    return ((h - SLOT_START) * 60 + m) / SLOT_MIN * SLOT_H
  })()

  const TABS: { id: TabFilter; label: string }[] = [
    { id: 'tutte',         label: 'Tutte le prenotazioni' },
    { id: 'prossimamente', label: 'Prossimamente'         },
    { id: 'passato',       label: 'Passato'               },
    { id: 'annullate',     label: 'Annullate'             },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Topbar */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <button onClick={openSidebar} className="hamburger-btn w-10 h-10 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] place-items-center text-[var(--t2)] hover:text-[var(--tx)] transition-colors shrink-0" aria-label="Apri menu">
          <Menu size={16} />
        </button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, margin: 0 }}>Prenotazioni</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--b1)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
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

      {/* Toolbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        {/* Nav arrows */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={prevPeriod} style={{ width: 32, height: 32, borderRadius: 'var(--r2)', background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <ChevronLeft size={15} />
          </button>
          <button onClick={nextPeriod} style={{ width: 32, height: 32, borderRadius: 'var(--r2)', background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <ChevronRight size={15} />
          </button>
        </div>

        <button onClick={() => setCurrent(new Date())} style={{ padding: '0 14px', height: 32, borderRadius: 'var(--r2)', background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          Oggi
        </button>

        {/* Calendari filter */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowCalendariFilter(o => !o)}
            style={{ padding: '0 14px', height: 32, borderRadius: 'var(--r2)', background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Calendari {selectedCalendari.length > 0 ? `(${selectedCalendari.length})` : ''}
          </button>
          {showCalendariFilter && (
            <div style={{ position: 'absolute', left: 0, top: 36, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', zIndex: 20, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', padding: 8 }}>
              <button onClick={() => setSelectedCalendari([])} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: 12, color: selectedCalendari.length === 0 ? 'var(--ac)' : 'var(--t2)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                Tutti i calendari
              </button>
              {calendari.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCalendari(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                  style={{ width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: 12, color: selectedCalendari.includes(c.id) ? 'var(--ac)' : 'var(--t2)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.colore, flexShrink: 0 }} />
                  {c.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Header label */}
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--tx)', margin: '0 auto' }}>
          {headerLabel}
        </span>

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--s2)', borderRadius: 'var(--r2)', border: '1px solid var(--b1)', overflow: 'hidden' }}>
          {(['mese','settimana','giorno'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{ padding: '0 14px', height: 32, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: view === v ? 'var(--s3)' : 'transparent', color: view === v ? 'var(--tx)' : 'var(--t2)' }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'settimana' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
              <div style={{ padding: '8px 0', fontSize: 11, color: 'var(--t3)', textAlign: 'center', borderRight: '1px solid var(--b1)' }}>
                <span style={{ display: 'block', marginBottom: 2 }}>Tutto il</span>
                <span>giorno</span>
              </div>
              {weekDates.map((d, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 4px', textAlign: 'center',
                    borderRight: i < 6 ? '1px solid var(--b1)' : 'none',
                    background: isToday(d) ? 'rgba(142,201,176,0.06)' : 'transparent',
                  }}
                >
                  <span style={{ fontSize: 11, color: isToday(d) ? 'var(--ac)' : 'var(--t3)', fontWeight: 600, display: 'block' }}>
                    {GIORNI_BREVE[i]}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: isToday(d) ? 700 : 400, color: isToday(d) ? 'var(--ac)' : 'var(--tx)' }}>
                    {d.getDate()}/{String(d.getMonth()+1).padStart(2,'0')}
                  </span>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
              <div style={{ position: 'relative', minHeight: TIME_SLOTS.length * SLOT_H }}>
                {/* Time labels + grid */}
                {TIME_SLOTS.map((slot, si) => {
                  const isHour = slot.endsWith(':00')
                  return (
                    <div
                      key={slot}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '64px repeat(7, 1fr)',
                        height: SLOT_H,
                        borderBottom: isHour ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      }}
                    >
                      <div style={{
                        borderRight: '1px solid var(--b1)',
                        paddingRight: 8,
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                        fontSize: 10, color: 'var(--t3)', fontWeight: 500,
                        transform: 'translateY(-6px)',
                        visibility: isHour ? 'visible' : 'hidden',
                      }}>
                        {slot}
                      </div>
                      {weekDates.map((d, di) => {
                        const dayPrenotazioni = getPrenotazioni(isoDate(d))
                        return (
                          <div
                            key={di}
                            style={{
                              borderRight: di < 6 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                              background: isToday(d) ? 'rgba(142,201,176,0.03)' : 'transparent',
                              position: 'relative',
                            }}
                          >
                            {/* Show booking starting at this slot */}
                            {dayPrenotazioni
                              .filter(p => p.ora_inizio === slot)
                              .map(p => {
                                const startIdx = slotIndex(p.ora_inizio)
                                const endIdx   = slotIndex(p.ora_fine)
                                const h = Math.max(1, endIdx - startIdx) * SLOT_H
                                const calColor = p.calendario?.colore ?? 'var(--ac)'
                                return (
                                  <div
                                    key={p.id}
                                    style={{
                                      position: 'absolute', left: 2, right: 2, top: 0,
                                      height: h - 2, borderRadius: 4,
                                      background: `${calColor}33`,
                                      border: `1px solid ${calColor}`,
                                      padding: '2px 4px', fontSize: 10,
                                      color: calColor, overflow: 'hidden',
                                      zIndex: 2, cursor: 'pointer',
                                    }}
                                    title={`${p.cliente_nome} — ${p.ora_inizio}/${p.ora_fine}`}
                                  >
                                    <strong>{p.cliente_nome}</strong>
                                  </div>
                                )
                              })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}

                {/* Now line */}
                {nowSlot !== null && isToday(weekDates[0]) || weekDates.some(isToday) ? (
                  <div
                    ref={nowLineRef}
                    style={{
                      position: 'absolute',
                      left: 64,
                      right: 0,
                      top: nowSlot ?? 0,
                      height: 2,
                      background: 'var(--red)',
                      zIndex: 5,
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', position: 'absolute', left: -4, top: -3 }} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {view === 'giorno' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
              <div style={{ borderRight: '1px solid var(--b1)' }} />
              <div style={{ padding: '8px 16px', background: isToday(current) ? 'rgba(142,201,176,0.06)' : 'transparent' }}>
                <span style={{ fontSize: 11, color: isToday(current) ? 'var(--ac)' : 'var(--t3)', fontWeight: 600, display: 'block' }}>
                  {current.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase()}
                </span>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: isToday(current) ? 'var(--ac)' : 'var(--tx)' }}>
                  {current.getDate()}
                </span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
              <div style={{ minHeight: TIME_SLOTS.length * SLOT_H }}>
                {TIME_SLOTS.map((slot, si) => {
                  const isHour = slot.endsWith(':00')
                  const dayPrenotazioni = getPrenotazioni(isoDate(current))
                  return (
                    <div
                      key={slot}
                      style={{ display: 'grid', gridTemplateColumns: '64px 1fr', height: SLOT_H, borderBottom: isHour ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                    >
                      <div style={{ borderRight: '1px solid var(--b1)', paddingRight: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', fontSize: 10, color: 'var(--t3)', fontWeight: 500, transform: 'translateY(-6px)', visibility: isHour ? 'visible' : 'hidden' }}>
                        {slot}
                      </div>
                      <div style={{ position: 'relative', background: isToday(current) ? 'rgba(142,201,176,0.03)' : 'transparent' }}>
                        {dayPrenotazioni.filter(p => p.ora_inizio === slot).map(p => {
                          const h = Math.max(1, slotIndex(p.ora_fine) - slotIndex(p.ora_inizio)) * SLOT_H
                          const calColor = p.calendario?.colore ?? 'var(--ac)'
                          return (
                            <div key={p.id} style={{ position: 'absolute', left: 4, right: 4, top: 0, height: h - 2, borderRadius: 4, background: `${calColor}33`, border: `1px solid ${calColor}`, padding: '2px 8px', fontSize: 12, color: calColor, zIndex: 2, cursor: 'pointer' }}>
                              <strong>{p.cliente_nome}</strong> — {p.ora_inizio}/{p.ora_fine}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'mese' && (
          <MonthView current={current} prenotazioni={filtered} />
        )}
      </div>

      {/* Backdrop for dropdowns */}
      {showCalendariFilter && <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowCalendariFilter(false)} />}
    </div>
  )
}

function MonthView({ current, prenotazioni }: { current: Date; prenotazioni: Prenotazione[] }) {
  const year  = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const getDay = (day: number) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return prenotazioni.filter(p => p.data === ds)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--b1)' }}>
        {['LUN','MAR','MER','GIO','VEN','SAB','DOM'].map(g => (
          <div key={g} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--t3)', borderRight: '1px solid var(--b1)' }}>{g}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {cells.map((day, i) => {
          const dayPren = day ? getDay(day) : []
          const isTodayCell = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
          return (
            <div
              key={i}
              style={{
                minHeight: 90, padding: '6px 8px',
                borderRight: i % 7 < 6 ? '1px solid var(--b1)' : 'none',
                borderBottom: '1px solid var(--b1)',
                background: isTodayCell ? 'rgba(142,201,176,0.06)' : 'transparent',
              }}
            >
              {day && (
                <>
                  <span style={{ fontSize: 12, fontWeight: isTodayCell ? 700 : 400, color: isTodayCell ? 'var(--ac)' : 'var(--t3)', display: 'block', marginBottom: 4 }}>{day}</span>
                  {dayPren.slice(0,3).map(p => (
                    <div key={p.id} style={{ fontSize: 10, padding: '2px 4px', borderRadius: 3, background: `${p.calendario?.colore ?? 'var(--ac)'}33`, color: p.calendario?.colore ?? 'var(--ac)', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {p.ora_inizio} {p.cliente_nome}
                    </div>
                  ))}
                  {dayPren.length > 3 && <span style={{ fontSize: 10, color: 'var(--t3)' }}>+{dayPren.length - 3} altri</span>}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

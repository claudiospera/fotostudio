'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Preventivo } from '@/lib/types'

interface PreventiviCalendarProps {
  preventivi: Preventivo[]
  onDayClick: (date: Date) => void
}

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
const GIORNI = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM']

type ViewMode = 'mese' | 'settimana' | 'giorno'

export const PreventiviCalendar = ({ preventivi, onDayClick }: PreventiviCalendarProps) => {
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [view, setView] = useState<ViewMode>('mese')

  const prevMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))
  const nextMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))
  const goToday = () => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))

  // Build calendar grid
  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday-first: 0=Mon...6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return preventivi.filter(p => p.data_evento === dateStr)
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div
      style={{
        background: 'var(--s1)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 'var(--r)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>
          Calendario
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Nav controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={prevMonth}
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={nextMonth}
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer',
              }}
            >
              <ChevronRight size={14} />
            </button>
            <Button variant="ghost" size="sm" onClick={goToday}>Oggi</Button>
          </div>

          <span
            style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: 14, color: 'var(--tx)', minWidth: 140, textAlign: 'center',
            }}
          >
            {MESI[month].toUpperCase()} {year}
          </span>

          {/* View toggle */}
          <div
            style={{
              display: 'flex', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, overflow: 'hidden',
            }}
          >
            {(['mese', 'settimana', 'giorno'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '4px 10px', fontSize: 12, fontWeight: 500,
                  background: view === v ? 'var(--s3)' : 'var(--s2)',
                  color: view === v ? 'var(--tx)' : 'var(--t3)',
                  border: 'none', cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Days of week header */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {GIORNI.map(g => (
          <div
            key={g}
            style={{
              padding: '8px 0', textAlign: 'center',
              fontSize: 11, fontWeight: 600, color: 'var(--t3)',
              letterSpacing: '0.06em',
            }}
          >
            {g}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          const events = day ? getEventsForDay(day) : []
          const todayCell = day ? isToday(day) : false
          return (
            <div
              key={i}
              onClick={() => day && onDayClick(new Date(year, month, day))}
              style={{
                minHeight: 80,
                padding: '6px 8px',
                borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                borderBottom: i < cells.length - 7 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: day ? 'pointer' : 'default',
                background: todayCell ? 'rgba(142,201,176,0.06)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (day) (e.currentTarget as HTMLDivElement).style.background = todayCell
                  ? 'rgba(142,201,176,0.1)'
                  : 'var(--s2)'
              }}
              onMouseLeave={e => {
                if (day) (e.currentTarget as HTMLDivElement).style.background = todayCell
                  ? 'rgba(142,201,176,0.06)'
                  : 'transparent'
              }}
            >
              {day && (
                <>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: '50%',
                      fontSize: 12, fontWeight: 500,
                      background: todayCell ? 'var(--ac)' : 'transparent',
                      color: todayCell ? '#0f0f0f' : 'var(--t2)',
                    }}
                  >
                    {day}
                  </span>
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {events.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        style={{
                          fontSize: 10, padding: '2px 5px', borderRadius: 4,
                          background: 'rgba(142,201,176,0.15)',
                          color: 'var(--ac)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}
                        title={ev.cliente}
                      >
                        {ev.cliente}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <span style={{ fontSize: 10, color: 'var(--t3)' }}>+{events.length - 2}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

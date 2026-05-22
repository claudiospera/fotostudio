'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Menu, Calendar, Copy, RefreshCw, Check } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import type { Cliente, CategoriaCliente } from '@/lib/types'

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

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const GIORNI = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

// Returns 0=Mon … 6=Sun
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export default function CalendarioClientiPage() {
  const router  = useRouter()
  const openSidebar = useUIStore(s => s.openSidebar)

  const [clienti, setClienti]       = useState<Cliente[]>([])
  const [loading, setLoading]       = useState(true)
  const [today]                     = useState(() => new Date())
  const [year,  setYear]            = useState(() => new Date().getFullYear())
  const [month, setMonth]           = useState(() => new Date().getMonth())
  const [selected, setSelected]     = useState<Date | null>(null)
  const [icalToken, setIcalToken]   = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)
  const [showIcal, setShowIcal]     = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const fetchClienti = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/clienti')
    if (res.ok) setClienti(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchClienti() }, [fetchClienti])

  // Carica il token iCal
  useEffect(() => {
    fetch('/api/ical-token').then(r => r.ok ? r.json() : null).then(d => { if (d?.token) setIcalToken(d.token) })
  }, [])

  const icalUrl = icalToken
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/api/ical?token=${icalToken}`
    : ''

  const copyIcalUrl = () => {
    if (!icalUrl) return
    navigator.clipboard.writeText(icalUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const regenerateToken = async () => {
    setRegenerating(true)
    const res = await fetch('/api/ical-token', { method: 'POST' })
    if (res.ok) { const d = await res.json(); setIcalToken(d.token) }
    setRegenerating(false)
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(today) }

  // Index clienti per giorno del mese corrente
  const byDay = React.useMemo(() => {
    const map: Record<number, Cliente[]> = {}
    for (const c of clienti) {
      if (!c.data_evento) continue
      const d = new Date(c.data_evento + 'T00:00:00')
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(c)
      }
    }
    return map
  }, [clienti, year, month])

  const daysInMonth  = getDaysInMonth(year, month)
  const firstDayOff  = getFirstDayOfMonth(year, month)
  const totalCells   = Math.ceil((daysInMonth + firstDayOff) / 7) * 7

  const selectedDay   = selected ? selected.getDate() : null
  const selectedMonth = selected ? selected.getMonth() : null
  const selectedYear  = selected ? selected.getFullYear() : null
  const selectedClienti = clienti.filter(c => {
    if (!c.data_evento) return false
    const d = new Date(c.data_evento + 'T00:00:00')
    return d.getDate() === selectedDay && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
  })

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const isSelected = (day: number) =>
    day === selectedDay && month === selectedMonth && year === selectedYear

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* TOPBAR */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: '1px solid var(--b1)',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <button
          onClick={openSidebar}
          className="hamburger-btn w-10 h-10 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] place-items-center text-[var(--t2)] hover:text-[var(--tx)] transition-colors shrink-0"
          aria-label="Apri menu"
        >
          <Menu size={16} />
        </button>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, margin: 0 }}>
          Calendario clienti
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {/* Bottone iCal */}
          <button
            onClick={() => setShowIcal(v => !v)}
            title="Sincronizza con iPhone / iCal"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 'var(--r2)', fontSize: 12, fontWeight: 600,
              border: `1px solid ${showIcal ? 'var(--ac)' : 'rgba(255,255,255,0.1)'}`,
              background: showIcal ? 'var(--acd)' : 'var(--s2)',
              color: showIcal ? 'var(--ac)' : 'var(--t2)', cursor: 'pointer', transition: 'all .15s',
            }}
          >
            <Calendar size={13} /> iCal
          </button>
          <button
            onClick={goToday}
            style={{
              padding: '6px 14px', borderRadius: 'var(--r2)', fontSize: 12, fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.1)', background: 'var(--s2)',
              color: 'var(--t2)', cursor: 'pointer',
            }}
          >
            Oggi
          </button>
          <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 'var(--r2)', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, minWidth: 160, textAlign: 'center' }}>
            {MESI[month]} {year}
          </span>
          <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 'var(--r2)', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* PANNELLO iCAL */}
      {showIcal && (
        <div style={{
          padding: '14px 28px',
          borderBottom: '1px solid var(--b1)',
          background: 'var(--s1)',
          display: 'flex', flexDirection: 'column', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} color="var(--ac)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>
              Sincronizza con iPhone / Mac / Google Calendar
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>
            Copia il link e aggiungilo come <strong style={{ color: 'var(--tx)' }}>calendario sottoscritto</strong> su iPhone
            (Calendario → Aggiungi account → Altro → Aggiungi calendario sottoscritto) oppure su Mac o Google Calendar.
            Si aggiorna automaticamente ogni ora.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1, minWidth: 0,
              background: 'var(--s2)', border: '1px solid var(--b1)',
              borderRadius: 'var(--r2)', padding: '8px 12px',
              fontSize: 11, fontFamily: 'monospace', color: 'var(--t2)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {icalUrl || 'Caricamento…'}
            </div>
            <button
              onClick={copyIcalUrl}
              disabled={!icalUrl}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 'var(--r2)',
                border: 'none', cursor: icalUrl ? 'pointer' : 'not-allowed',
                background: copied ? '#22c55e' : 'var(--ac)',
                color: '#fff', fontSize: 12, fontWeight: 700,
                transition: 'background .2s', flexShrink: 0,
              }}
            >
              {copied ? <><Check size={13} /> Copiato!</> : <><Copy size={13} /> Copia link</>}
            </button>
            <button
              onClick={regenerateToken}
              disabled={regenerating}
              title="Rigenera link (invalida il precedente)"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 'var(--r2)',
                border: '1px solid var(--b1)', background: 'var(--s2)',
                color: 'var(--t3)', cursor: 'pointer', fontSize: 12, flexShrink: 0,
              }}
            >
              <RefreshCw size={13} style={{ animation: regenerating ? 'spin 1s linear infinite' : 'none' }} />
              Rigenera
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>
            ⚠️ Il link è privato — chiunque lo possieda può vedere i tuoi eventi. Usa &quot;Rigenera&quot; per invalidare il vecchio link.
          </p>
        </div>
      )}

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* CALENDARIO */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 24px' }}>

          {/* Intestazione giorni */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {GIORNI.map(g => (
              <div key={g} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 0' }}>
                {g}
              </div>
            ))}
          </div>

          {/* Griglia giorni */}
          {loading ? (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--t3)', fontSize: 13 }}>
              Caricamento…
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: `repeat(${totalCells / 7}, 1fr)`,
              gap: 3,
              flex: 1,
              overflow: 'hidden',
            }}>
              {Array.from({ length: totalCells }).map((_, i) => {
                const day = i - firstDayOff + 1
                const valid = day >= 1 && day <= daysInMonth
                const events = valid ? (byDay[day] ?? []) : []
                const todayCell = valid && isToday(day)
                const selCell   = valid && isSelected(day)

                return (
                  <div
                    key={i}
                    onClick={() => valid && setSelected(new Date(year, month, day))}
                    style={{
                      background: selCell ? 'rgba(142,201,176,0.12)' : 'var(--s1)',
                      border: selCell
                        ? '1px solid rgba(142,201,176,0.4)'
                        : todayCell
                        ? '1px solid rgba(142,201,176,0.25)'
                        : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 'var(--r2)',
                      padding: '6px 7px',
                      cursor: valid ? 'pointer' : 'default',
                      opacity: valid ? 1 : 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      minHeight: 0,
                      transition: 'border-color 0.12s, background 0.12s',
                    }}
                    onMouseEnter={e => { if (valid && !selCell) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
                    onMouseLeave={e => { if (valid && !selCell) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)' }}
                  >
                    {valid && (
                      <>
                        <span style={{
                          fontSize: 12, fontWeight: todayCell ? 700 : 400,
                          color: todayCell ? 'var(--ac)' : selCell ? 'var(--ac)' : 'var(--t2)',
                          lineHeight: 1,
                        }}>
                          {day}
                        </span>
                        {events.slice(0, 3).map(c => (
                          <div
                            key={c.id}
                            title={`${c.nome1}${c.nome2 ? ` e ${c.nome2}` : ''} — ${c.categoria}`}
                            style={{
                              fontSize: 10, fontWeight: 500,
                              background: `${CAT_COLORS[c.categoria] ?? '#8ec9b0'}33`,
                              color: CAT_COLORS[c.categoria] ?? 'var(--ac)',
                              borderLeft: `2px solid ${CAT_COLORS[c.categoria] ?? 'var(--ac)'}`,
                              borderRadius: '0 3px 3px 0',
                              padding: '1px 4px',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {CAT_EMOJI[c.categoria]} {c.nome1}{c.nome2 ? ` e ${c.nome2}` : ''}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div style={{ fontSize: 9, color: 'var(--t3)', paddingLeft: 4 }}>
                            +{events.length - 3} altri
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PANNELLO LATERALE — eventi del giorno selezionato */}
        {selected && (
          <div style={{
            width: 280,
            borderLeft: '1px solid var(--b1)',
            padding: '20px 18px',
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, margin: '0 0 14px', color: 'var(--tx)' }}>
              {selected.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>

            {selectedClienti.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic' }}>Nessun evento in questa data.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedClienti.map(c => {
                  const col = CAT_COLORS[c.categoria] ?? '#8ec9b0'
                  const emoji = CAT_EMOJI[c.categoria] ?? '📋'
                  const residuo = Number(c.importo_totale ?? 0) - Number(c.acconto ?? 0)
                  return (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--s1)',
                        border: `1px solid ${col}44`,
                        borderLeft: `3px solid ${col}`,
                        borderRadius: 'var(--r2)',
                        padding: '12px 12px',
                        cursor: 'pointer',
                        transition: 'background 0.12s',
                      }}
                      onClick={() => router.push(`/clienti?apri=${c.id}`)}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--s2)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--s1)' }}
                    >
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                        {c.nome1}{c.nome2 ? ` e ${c.nome2}` : ''}
                      </div>
                      <div style={{ fontSize: 11, color: col, marginBottom: 6 }}>
                        {emoji} {c.categoria}
                      </div>
                      {c.luogo_evento && (
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>
                          📍 {c.luogo_evento}
                        </div>
                      )}
                      {(c.tel1 || c.whatsapp1 || c.genitore1_tel) && (
                        <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 4 }}>
                          📞 {c.tel1 || c.whatsapp1 || c.genitore1_tel}
                        </div>
                      )}
                      {(Number(c.importo_totale) > 0 || Number(c.acconto) > 0) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          {Number(c.acconto) > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--ac)', background: 'rgba(142,201,176,0.1)', border: '1px solid rgba(142,201,176,0.2)', borderRadius: 4, padding: '2px 6px' }}>
                              Acconto: {Number(c.acconto).toLocaleString('it-IT')} €
                            </span>
                          )}
                          {residuo > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--amber)', background: 'rgba(201,160,90,0.1)', border: '1px solid rgba(201,160,90,0.2)', borderRadius: 4, padding: '2px 6px' }}>
                              Saldo: {residuo.toLocaleString('it-IT')} €
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); window.open(`/api/scheda-pub/${c.id}`, '_blank') }}
                        style={{
                          marginTop: 8, width: '100%', padding: '5px 0',
                          borderRadius: 'var(--r2)', border: '1px solid rgba(142,201,176,0.2)',
                          background: 'transparent', color: 'var(--ac)',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        📄 Scheda cliente
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

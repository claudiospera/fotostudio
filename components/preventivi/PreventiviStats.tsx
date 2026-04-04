'use client'

import type { Preventivo } from '@/lib/types'

interface PreventiviStatsProps {
  preventivi: Preventivo[]
  year: number
}

const PIE_COLORS = ['#8ec9b0', '#c9a05a', '#d97070', '#9bc4e2', '#c9a0e8', '#e8a0b4']

export const PreventiviStats = ({ preventivi, year }: PreventiviStatsProps) => {
  const firmati = preventivi.filter(p => p.stato === 'accettato').length
  const nonFirmati = preventivi.filter(p => p.stato !== 'accettato').length
  const totale = preventivi.length
  const tasso = totale > 0 ? Math.round((firmati / totale) * 100) : 0

  // Raggruppamento per servizio per il grafico
  const byService: Record<string, number> = {}
  for (const p of preventivi) {
    const s = p.servizio ?? 'Altro'
    byService[s] = (byService[s] ?? 0) + 1
  }
  const serviceEntries = Object.entries(byService).sort((a, b) => b[1] - a[1])
  const total = serviceEntries.reduce((acc, [, n]) => acc + n, 0)

  // SVG pie chart
  const radius = 60
  const cx = 80
  const cy = 80
  let startAngle = -90

  const slices = serviceEntries.map(([name, count], i) => {
    const pct = total > 0 ? count / total : 0
    const angle = pct * 360
    const endAngle = startAngle + angle
    const largeArc = angle > 180 ? 1 : 0
    const x1 = cx + radius * Math.cos((startAngle * Math.PI) / 180)
    const y1 = cy + radius * Math.sin((startAngle * Math.PI) / 180)
    const x2 = cx + radius * Math.cos((endAngle * Math.PI) / 180)
    const y2 = cy + radius * Math.sin((endAngle * Math.PI) / 180)
    const d = total === 0 ? '' : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
    startAngle = endAngle
    return { name, count, pct, d, color: PIE_COLORS[i % PIE_COLORS.length] }
  })

  // Prossimi eventi (entro 30 giorni)
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const prossimi = preventivi
    .filter(p => {
      if (!p.data_evento) return false
      const d = new Date(p.data_evento)
      return d >= now && d <= in30
    })
    .sort((a, b) => (a.data_evento ?? '').localeCompare(b.data_evento ?? ''))
    .slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Panoramica */}
      <div
        style={{
          background: 'var(--s1)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--r)',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>Panoramica</span>
          <span
            style={{
              fontSize: 12, color: 'var(--t2)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, padding: '2px 10px',
              cursor: 'pointer',
            }}
          >
            {year} ▾
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--t2)' }}>Preventivi Firmati</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac)' }}>{firmati}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--t2)' }}>Preventivi non Firmati</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{nonFirmati}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--t2)' }}>Totale</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{totale}</span>
          </div>
          <div
            style={{
              height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Tasso di conversione</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: tasso > 50 ? 'var(--ac)' : 'var(--amber)' }}>
              {tasso}%
            </span>
          </div>
        </div>
      </div>

      {/* Grafico per servizio */}
      <div
        style={{
          background: 'var(--s1)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--r)',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>Per servizio</span>
        </div>

        {total === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--t3)', fontSize: 13 }}>
            Nessun preventivo ancora
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <svg width={160} height={160} viewBox="0 0 160 160">
                {slices.map((s, i) => (
                  <path key={i} d={s.d} fill={s.color} stroke="var(--s1)" strokeWidth={2} />
                ))}
                {/* Hole for donut */}
                <circle cx={cx} cy={cy} r={34} fill="var(--s1)" />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--tx)">
                  {total}
                </text>
                <text x={cx} y={cy + 16} textAnchor="middle" fontSize={8} fill="var(--t3)">
                  totale
                </text>
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {slices.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: s.color, flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--t3)', flexShrink: 0 }}>
                    {Math.round(s.pct * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Prossimi appuntamenti */}
      <div
        style={{
          background: 'var(--s1)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--r)',
          padding: 20,
        }}
      >
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 14 }}>
          Prossimi appuntamenti
        </span>

        {prossimi.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>Nessun appuntamento in programma</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prossimi.map(p => {
              const d = new Date(p.data_evento!)
              return (
                <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'var(--s2)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac)', lineHeight: 1 }}>
                      {d.getDate()}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--t3)', lineHeight: 1 }}>
                      {d.toLocaleString('it-IT', { month: 'short' }).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.cliente}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>{p.servizio ?? 'Servizio non specificato'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

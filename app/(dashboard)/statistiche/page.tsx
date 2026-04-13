'use client'

import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import type { Cliente, CategoriaCliente } from '@/lib/types'
import { useUIStore } from '@/store/ui'

// ── Colori categoria ────────────────────────────────────────────────────────

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

const MESI_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

function fmt(n: number) {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

// ── Pagina ──────────────────────────────────────────────────────────────────

export default function StatistichePage() {
  const openSidebar = useUIStore(s => s.openSidebar)
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  useEffect(() => {
    fetch('/api/clienti')
      .then(r => r.ok ? r.json() : [])
      .then((data: Cliente[]) => { setClienti(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Anni disponibili dai dati
  const anni = Array.from(new Set(
    clienti
      .filter(c => c.data_evento)
      .map(c => new Date(c.data_evento!).getFullYear())
  )).sort((a, b) => b - a)
  if (!anni.includes(selectedYear) && anni.length > 0) {
    // non fare nulla, mantieni l'anno selezionato
  }

  // Clienti dell'anno selezionato (con data_evento)
  const clientiAnno = clienti.filter(c => {
    if (!c.data_evento) return false
    return new Date(c.data_evento).getFullYear() === selectedYear
  })

  // ── KPI ────────────────────────────────────────────────────────────────────
  const fatturato    = clientiAnno.reduce((s, c) => s + (c.importo_totale || 0), 0)
  const incassato    = clientiAnno.reduce((s, c) => s + (c.acconto || 0) + (c.saldo || 0), 0)
  const daIncassare  = fatturato - incassato
  const nEventi      = clientiAnno.length
  const conAcconto   = clientiAnno.filter(c => (c.acconto || 0) > 0).length
  const pctAcconto   = nEventi > 0 ? Math.round((conAcconto / nEventi) * 100) : 0
  const mediaFattura = nEventi > 0 ? Math.round(fatturato / nEventi) : 0

  // ── Entrate mensili ────────────────────────────────────────────────────────
  const meseAcconto = Array(12).fill(0)
  const meseSaldo   = Array(12).fill(0)
  for (const c of clientiAnno) {
    const m = new Date(c.data_evento!).getMonth()
    meseAcconto[m] += c.acconto || 0
    meseSaldo[m]   += c.saldo   || 0
  }
  const meseMax = Math.max(...meseAcconto.map((a, i) => a + meseSaldo[i]), 1)

  // ── Clienti per categoria ──────────────────────────────────────────────────
  const byCat: Partial<Record<CategoriaCliente, number>> = {}
  for (const c of clientiAnno) {
    byCat[c.categoria] = (byCat[c.categoria] ?? 0) + 1
  }
  const catEntries = (Object.entries(byCat) as [CategoriaCliente, number][])
    .sort((a, b) => b[1] - a[1])
  const catTotal = catEntries.reduce((s, [, n]) => s + n, 0)

  // SVG donut
  const R = 56, CX = 70, CY = 70
  let ang = -90
  const slices = catEntries.map(([cat, n]) => {
    const pct   = catTotal > 0 ? n / catTotal : 0
    const sweep = pct * 360
    const end   = ang + sweep
    const large = sweep > 180 ? 1 : 0
    const x1 = CX + R * Math.cos((ang * Math.PI) / 180)
    const y1 = CY + R * Math.sin((ang * Math.PI) / 180)
    const x2 = CX + R * Math.cos((end * Math.PI) / 180)
    const y2 = CY + R * Math.sin((end * Math.PI) / 180)
    const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`
    ang = end
    return { cat, n, pct, d, color: CAT_COLORS[cat] }
  })

  // ── Clienti per anno (trend storico) ──────────────────────────────────────
  const byYear: Record<number, number> = {}
  for (const c of clienti) {
    if (!c.data_evento) continue
    const y = new Date(c.data_evento).getFullYear()
    byYear[y] = (byYear[y] ?? 0) + 1
  }
  const trendEntries = Object.entries(byYear)
    .map(([y, n]) => ({ year: Number(y), n }))
    .sort((a, b) => a.year - b.year)
  const trendMax = Math.max(...trendEntries.map(e => e.n), 1)

  // ── Top 5 per importo ─────────────────────────────────────────────────────
  const top5 = [...clientiAnno]
    .filter(c => (c.importo_totale || 0) > 0)
    .sort((a, b) => (b.importo_totale || 0) - (a.importo_totale || 0))
    .slice(0, 5)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Topbar */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: '1px solid var(--b1)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <button onClick={openSidebar} className="hamburger-btn w-10 h-10 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] place-items-center text-[var(--t2)] hover:text-[var(--tx)] transition-colors shrink-0" aria-label="Apri menu">
          <Menu size={16} />
        </button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, margin: 0 }}>
          Statistiche
        </h1>

        {/* Selettore anno */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          {(anni.length > 0 ? anni : [currentYear]).map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              style={{
                padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: selectedYear === y ? '1px solid var(--ac)' : '1px solid rgba(255,255,255,0.08)',
                background: selectedYear === y ? 'rgba(142,201,176,0.14)' : 'var(--s2)',
                color: selectedYear === y ? 'var(--ac)' : 'var(--t2)',
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--t3)' }}>Caricamento…</div>
        ) : (
          <>
            {/* ── KPI ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <KpiCard label="Fatturato anno" value={fmt(fatturato)} sub={`${nEventi} eventi`} accent />
              <KpiCard label="Incassato" value={fmt(incassato)} sub={`${fatturato > 0 ? Math.round((incassato / fatturato) * 100) : 0}% del totale`} />
              <KpiCard label="Da incassare" value={fmt(daIncassare)} sub="saldo residuo" warn={daIncassare > 0} />
              <KpiCard label="Media per evento" value={fmt(mediaFattura)} sub="importo medio" />
              <KpiCard label="Acconti ricevuti" value={`${pctAcconto}%`} sub={`${conAcconto} su ${nEventi}`} />
            </div>

            {/* ── Riga grafici ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>

              {/* Barre mensili */}
              <Card title="Entrate mensili" subtitle={String(selectedYear)}>
                {fatturato === 0 ? (
                  <Empty />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, minWidth: 480, paddingBottom: 24 }}>
                      {MESI_SHORT.map((mes, i) => {
                        const acc = meseAcconto[i]
                        const sal = meseSaldo[i]
                        const tot = acc + sal
                        const hAcc = meseMax > 0 ? Math.round((acc / meseMax) * 130) : 0
                        const hSal = meseMax > 0 ? Math.round((sal / meseMax) * 130) : 0
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            {tot > 0 && (
                              <span style={{ fontSize: 9, color: 'var(--t3)', marginBottom: 2, whiteSpace: 'nowrap' }}>
                                {tot >= 1000 ? `${Math.round(tot / 1000)}k` : tot}€
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 130 }}>
                              {hAcc > 0 && (
                                <div
                                  style={{ width: 10, height: hAcc, background: '#8ec9b0', borderRadius: '3px 3px 0 0' }}
                                  title={`Acconto: ${fmt(acc)}`}
                                />
                              )}
                              {hSal > 0 && (
                                <div
                                  style={{ width: 10, height: hSal, background: '#c9a05a', borderRadius: '3px 3px 0 0' }}
                                  title={`Saldo: ${fmt(sal)}`}
                                />
                              )}
                              {tot === 0 && (
                                <div style={{ width: 20, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }} />
                              )}
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--t3)' }}>{mes}</span>
                          </div>
                        )
                      })}
                    </div>
                    {/* Legenda */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                      <LegendDot color="#8ec9b0" label="Acconto" />
                      <LegendDot color="#c9a05a" label="Saldo" />
                    </div>
                  </div>
                )}
              </Card>

              {/* Donut categoria */}
              <Card title="Per categoria" style={{ width: 260 }}>
                {catTotal === 0 ? (
                  <Empty />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <svg width={140} height={140} viewBox="0 0 140 140">
                      {slices.map((s, i) => (
                        <path key={i} d={s.d} fill={s.color} stroke="var(--s1)" strokeWidth={2} />
                      ))}
                      <circle cx={CX} cy={CY} r={30} fill="var(--s1)" />
                      <text x={CX} y={CY + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--tx)">
                        {catTotal}
                      </text>
                    </svg>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {slices.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.cat}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>
                            {s.n} · {Math.round(s.pct * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* ── Seconda riga ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

              {/* Trend storico */}
              <Card title="Clienti per anno" subtitle="tutti gli anni">
                {trendEntries.length === 0 ? (
                  <Empty />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 130 }}>
                    {trendEntries.map(({ year, n }) => {
                      const h = Math.max(Math.round((n / trendMax) * 110), 4)
                      const isSelected = year === selectedYear
                      return (
                        <div
                          key={year}
                          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                          onClick={() => setSelectedYear(year)}
                        >
                          <span style={{ fontSize: 11, color: isSelected ? 'var(--ac)' : 'var(--t3)' }}>{n}</span>
                          <div
                            style={{
                              width: '100%', height: h,
                              background: isSelected ? 'var(--ac)' : 'var(--s3)',
                              borderRadius: '4px 4px 0 0',
                              border: isSelected ? '1px solid var(--ac2)' : '1px solid rgba(255,255,255,0.06)',
                              transition: 'background 0.15s',
                            }}
                          />
                          <span style={{ fontSize: 10, color: isSelected ? 'var(--ac)' : 'var(--t3)' }}>{year}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              {/* Top 5 */}
              <Card title={`Top 5 eventi ${selectedYear}`} subtitle="per importo">
                {top5.length === 0 ? (
                  <Empty />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {top5.map((c, i) => {
                      const col = CAT_COLORS[c.categoria] ?? '#8ec9b0'
                      const pct = fatturato > 0 ? Math.round(((c.importo_totale || 0) / fatturato) * 100) : 0
                      return (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', minWidth: 16, textAlign: 'right' }}>
                            {i + 1}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.nome1}{c.nome2 ? ` & ${c.nome2}` : ''}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx)', flexShrink: 0, marginLeft: 8 }}>
                                {fmt(c.importo_totale || 0)}
                              </span>
                            </div>
                            <div style={{ height: 4, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 2 }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sottocomponenti ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent, warn }: {
  label: string; value: string; sub?: string; accent?: boolean; warn?: boolean
}) {
  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 'var(--r)', padding: '18px 20px',
    }}>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: '8px 0 4px', fontSize: 26, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: accent ? 'var(--ac)' : warn ? 'var(--amber)' : 'var(--tx)', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)' }}>{sub}</p>}
    </div>
  )
}

function Card({ title, subtitle, children, style }: {
  title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 'var(--r)', padding: 20, ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>{title}</span>
        {subtitle && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 11, color: 'var(--t3)' }}>{label}</span>
    </div>
  )
}

function Empty() {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--t3)', fontSize: 13 }}>
      Nessun dato per questo anno
    </div>
  )
}

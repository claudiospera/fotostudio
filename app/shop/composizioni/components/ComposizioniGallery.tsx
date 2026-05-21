'use client'

// app/shop/composizioni/components/ComposizioniGallery.tsx

import { COMPOSIZIONI, type Composizione, type Slot } from '@/lib/composizioni-data'

// ─── Colori ──────────────────────────────────────────────────────────────────

const AC = '#7d9b76'
const WALL_BG    = '#ede8e0'
const PANEL_BG   = '#c8c0b4'
const PANEL_LIGHT = '#d4ccc0'

// ─── SVG preview di una composizione ────────────────────────────────────────

function CompositionSvg({ slots, panoramica }: { slots: Slot[]; panoramica?: boolean }) {
  const VW = 100, VH = 70

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={VW} height={VH} fill={WALL_BG} />
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={i} x1={0} y1={i * 10} x2={VW} y2={i * 10} stroke="rgba(0,0,0,0.03)" strokeWidth={0.4} />
      ))}

      <rect x={0} y={VH * 0.82} width={VW} height={VH * 0.18} fill="#c4a07a" />
      <line x1={0} y1={VH * 0.82} x2={VW} y2={VH * 0.82} stroke="#b89060" strokeWidth={0.5} />

      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0.4" dy="1.2" stdDeviation="1" floodColor="rgba(0,0,0,0.22)" />
        </filter>
        {panoramica && (
          <linearGradient id="pano-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#8a9cb0" />
            <stop offset="40%"  stopColor="#b0c0cc" />
            <stop offset="100%" stopColor="#90a8b8" />
          </linearGradient>
        )}
        <linearGradient id="panel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={PANEL_LIGHT} />
          <stop offset="100%" stopColor={PANEL_BG}    />
        </linearGradient>
      </defs>

      {slots.map((slot, i) => {
        const x  = slot.x  * VW / 100
        const y  = slot.y  * VH / 100
        const sw = slot.w  * VW / 100
        const sh = slot.h  * VH / 100
        return (
          <g key={i} filter="url(#shadow)">
            <rect
              x={x} y={y} width={sw} height={sh}
              fill={panoramica ? 'url(#pano-grad)' : 'url(#panel-grad)'}
              rx={0.5}
            />
            <rect x={x} y={y} width={sw} height={0.6} fill="rgba(255,255,255,0.3)" rx={0.3} />
          </g>
        )
      })}

      {panoramica && slots.map((slot, i) => {
        if (i === 0) return null
        const x = slot.x * VW / 100
        const y = slot.y * VH / 100
        const sh = slot.h * VH / 100
        return <line key={`div-${i}`} x1={x} y1={y} x2={x} y2={y + sh} stroke={WALL_BG} strokeWidth={1.5} />
      })}

      <g opacity={0.5}>
        <line x1={VW - 18} y1={VH - 4} x2={VW - 3} y2={VH - 4} stroke="#888" strokeWidth={0.6} />
        <line x1={VW - 18} y1={VH - 5.5} x2={VW - 18} y2={VH - 2.5} stroke="#888" strokeWidth={0.6} />
        <line x1={VW - 3}  y1={VH - 5.5} x2={VW - 3}  y2={VH - 2.5} stroke="#888" strokeWidth={0.6} />
      </g>
    </svg>
  )
}

// ─── Singola card composizione ───────────────────────────────────────────────

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  'Più venduto':           { bg: '#fef9c3', color: '#854d0e' },
  'Tendenza':              { bg: '#e0f2fe', color: '#0369a1' },
  'Perfetto per famiglie': { bg: '#fce7f3', color: '#9d174d' },
  'Design esclusivo':      { bg: '#f3e8ff', color: '#6b21a8' },
  'Effetto wow':           { bg: '#dcfce7', color: '#166534' },
  'Impatto massimo':       { bg: '#fee2e2', color: '#991b1b' },
  'Grande formato':        { bg: '#fff7ed', color: '#9a3412' },
  'Grande impatto':        { bg: '#fef2f2', color: '#b91c1c' },
  'Gallery wall':          { bg: '#ecfdf5', color: '#065f46' },
  'Classico':              { bg: '#f8fafc', color: '#475569' },
  'Geometrico':            { bg: '#eef2ff', color: '#3730a3' },
  'Narrativo':             { bg: '#fdf4ff', color: '#7e22ce' },
}

function CompositionCard({ c, index }: { c: Composizione; index: number }) {
  const badge = c.badge ? BADGE_COLORS[c.badge] : null

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #e8e4de',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow .2s, transform .2s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Numero composizione */}
      <div style={{ padding: '10px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#bbb', letterSpacing: '.1em' }}>
          N° {String(index + 1).padStart(2, '0')}
        </span>
        {badge && (
          <span style={{
            fontSize: '10px', fontWeight: 700,
            letterSpacing: '.06em', textTransform: 'uppercase',
            background: badge.bg, color: badge.color,
            padding: '2px 8px', borderRadius: 20,
          }}>
            {c.badge}
          </span>
        )}
      </div>

      {/* SVG preview */}
      <div style={{ padding: '8px 14px' }}>
        <CompositionSvg slots={c.slots} panoramica={c.panoramica} />
      </div>

      {/* Info */}
      <div style={{ padding: '4px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700, fontSize: '16px',
          color: '#1a1a1a', lineHeight: 1.2,
          margin: 0,
        }}>
          {c.nome}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11px', fontWeight: 700,
            background: `${AC}18`, color: AC,
            padding: '3px 8px', borderRadius: 20,
          }}>
            {c.pezzi} {c.pezzi === 1 ? 'pannello' : 'pannelli'}
          </span>
          <span style={{ fontSize: '11px', color: '#9b9590' }}>{c.materiale}</span>
        </div>

        <p style={{ fontSize: '12px', color: '#6b6660', lineHeight: 1.55, margin: 0 }}>
          {c.descrizione}
        </p>

        <div style={{ marginTop: 'auto', paddingTop: 6 }}>
          {c.dimensioni.map(d => (
            <div key={d.id} style={{ fontSize: '11px', color: '#888', marginBottom: 2 }}>
              <span style={{ fontWeight: 600, color: '#555' }}>{d.label}</span>
              <span style={{ color: '#bbb' }}> · {d.pareteLabel}</span>
            </div>
          ))}
        </div>

        <a
          href="#tool"
          style={{
            display: 'block',
            marginTop: 10,
            padding: '9px 0',
            borderRadius: 10,
            background: AC,
            color: '#fff',
            textAlign: 'center',
            fontSize: '13px', fontWeight: 700,
            textDecoration: 'none',
            transition: 'background .15s',
            fontFamily: 'Montserrat, sans-serif',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#6a8564' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = AC }}
        >
          Visualizza con la tua foto →
        </a>
      </div>
    </div>
  )
}

// ─── Gallery griglia con intestazioni di gruppo ───────────────────────────────

export function ComposizioniGallery() {
  // Raggruppa composizioni per gruppo
  const gruppi = COMPOSIZIONI.reduce<Record<string, { comps: Composizione[]; indices: number[] }>>(
    (acc, c, i) => {
      if (!acc[c.gruppo]) acc[c.gruppo] = { comps: [], indices: [] }
      acc[c.gruppo].comps.push(c)
      acc[c.gruppo].indices.push(i)
      return acc
    },
    {},
  )

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,40px) 64px' }}>
      {Object.entries(gruppi).map(([gruppo, { comps, indices }]) => (
        <div key={gruppo} style={{ marginBottom: 64 }}>
          {/* Intestazione gruppo */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
            paddingBottom: 14, borderBottom: '1px solid #e8e4de',
          }}>
            <h3 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(18px,2.5vw,24px)',
              fontWeight: 700, color: '#1a1a1a',
              margin: 0,
            }}>
              {gruppo}
            </h3>
            <span style={{
              fontSize: '12px', fontWeight: 600,
              background: `${AC}14`, color: AC,
              padding: '3px 10px', borderRadius: 20,
              whiteSpace: 'nowrap',
            }}>
              {comps.length} composizioni
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
            gap: 20,
          }}>
            {comps.map((c, j) => (
              <CompositionCard key={c.id} c={c} index={indices[j]} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Trash2, MapPin, Printer, Route, X } from 'lucide-react'
import type { ClienteTimelineItem } from '@/lib/types'

const INP: React.CSSProperties = {
  width: '100%', background: 'var(--s3)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 'var(--r2)', color: 'var(--tx)', fontSize: 13,
  padding: '8px 10px', outline: 'none', boxSizing: 'border-box',
}
const LBL: React.CSSProperties = {
  display: 'block', fontSize: 10, color: 'var(--t3)', marginBottom: 4,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function formatDateFull(d?: string) {
  if (!d) return ''
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface ClienteTimelineProps {
  items: ClienteTimelineItem[]
  team: string[]
  onChangeItems: (items: ClienteTimelineItem[]) => void
  onChangeTeam: (team: string[]) => void
  saveStatus: 'idle' | 'saving' | 'saved'
  nomeCliente: string
  dataEvento?: string
}

export function ClienteTimeline({
  items, team, onChangeItems, onChangeTeam, saveStatus, nomeCliente, dataEvento,
}: ClienteTimelineProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null)
  const [teamInput, setTeamInput] = useState('')

  const selected = items.find(i => i.id === selectedId) ?? null

  const addItem = (tipo: ClienteTimelineItem['tipo']) => {
    const item: ClienteTimelineItem = { id: uid(), tipo, titolo: '', ...(tipo === 'tappa' ? { ora: '', indirizzo: '' } : {}) }
    onChangeItems([...items, item])
    setSelectedId(item.id)
  }

  const updateItem = (id: string, patch: Partial<ClienteTimelineItem>) => {
    onChangeItems(items.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  const removeItem = (id: string) => {
    onChangeItems(items.filter(i => i.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const moveItem = (index: number, dir: -1 | 1) => {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChangeItems(next)
  }

  const addTeamMember = () => {
    const v = teamInput.trim()
    if (!v || team.includes(v)) { setTeamInput(''); return }
    onChangeTeam([...team, v])
    setTeamInput('')
  }

  const removeTeamMember = (name: string) => onChangeTeam(team.filter(t => t !== name))

  const tappeConIndirizzo = items.filter(i => i.tipo === 'tappa' && i.indirizzo?.trim())

  const mostraPercorso = () => {
    if (tappeConIndirizzo.length < 2) {
      alert('Servono almeno 2 tappe con indirizzo per mostrare il percorso.')
      return
    }
    const addrs = tappeConIndirizzo.map(i => encodeURIComponent(i.indirizzo!.trim()))
    const origin = addrs[0]
    const destination = addrs[addrs.length - 1]
    const waypoints = addrs.slice(1, -1).join('|')
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`
    window.open(url, '_blank')
  }

  const stampaTimeline = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const righe = items.map(i => {
      if (i.tipo === 'nota') {
        return `<div class="riga nota"><span class="badge">NOTA</span><div class="corpo"><p class="titolo">${i.titolo || '—'}</p></div></div>`
      }
      return `<div class="riga">
        <span class="ora">${i.ora || '--:--'}</span>
        <div class="corpo">
          <p class="titolo">${i.titolo || '—'}</p>
          ${i.indirizzo ? `<p class="dettaglio">📍 ${i.indirizzo}</p>` : ''}
          ${i.note ? `<p class="dettaglio">${i.note}</p>` : ''}
        </div>
      </div>`
    }).join('')
    const teamHtml = team.length > 0
      ? `<div class="team"><strong>Team operativo:</strong> ${team.join(', ')}</div>`
      : ''
    win.document.write(`<html><head><title>Timeline — ${nomeCliente}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:13px;line-height:1.5;padding:32px;max-width:640px;margin:0 auto;color:#222;}
        h1{font-size:19px;margin:0 0 4px;}
        .sub{color:#666;margin:0 0 20px;font-size:13px;}
        .riga{display:flex;gap:14px;padding:12px 0;border-top:1px solid #ddd;}
        .riga.nota{background:#f7f5f0;}
        .ora{width:54px;flex-shrink:0;font-weight:700;color:#333;}
        .badge{width:54px;flex-shrink:0;font-size:10px;font-weight:700;color:#8a7a4a;letter-spacing:0.06em;}
        .titolo{margin:0 0 2px;font-weight:600;}
        .dettaglio{margin:0;color:#555;font-size:12px;}
        .team{margin-top:20px;padding-top:14px;border-top:1px solid #ddd;font-size:12px;color:#444;}
        @media print{body{padding:0;}}
      </style></head>
      <body>
        <h1>Timeline — ${nomeCliente}</h1>
        <p class="sub">${dataEvento ? formatDateFull(dataEvento) : ''}</p>
        ${righe}
        ${teamHtml}
        <script>window.onload=()=>{window.print()}<\/script>
      </body></html>`)
    win.document.close()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
          Organizza tappe e note della giornata.{' '}
          {saveStatus === 'saving' && <span style={{ color: 'var(--t2)' }}>Salvataggio…</span>}
          {saveStatus === 'saved' && <span style={{ color: 'var(--ac)' }}>Salvato ✓</span>}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={mostraPercorso}
            disabled={tappeConIndirizzo.length < 2}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--r2)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: tappeConIndirizzo.length < 2 ? 'var(--t3)' : 'var(--t2)', fontSize: 12, cursor: tappeConIndirizzo.length < 2 ? 'not-allowed' : 'pointer' }}
          >
            <Route size={13} /> Mostra percorso
          </button>
          <button
            onClick={stampaTimeline}
            disabled={items.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--r2)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: items.length === 0 ? 'var(--t3)' : 'var(--t2)', fontSize: 12, cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            <Printer size={13} /> Stampa timeline
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Lista */}
        <div>
          {items.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', marginBottom: 10 }}>Nessuna tappa ancora.</p>
          )}
          {items.map((item, i) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--r2)',
                marginBottom: 4, cursor: 'pointer',
                background: selectedId === item.id ? 'rgba(142,201,176,0.1)' : 'transparent',
                border: selectedId === item.id ? '1px solid rgba(142,201,176,0.35)' : '1px solid transparent',
              }}
            >
              <span style={{ width: 40, flexShrink: 0, fontSize: 10, fontWeight: 700, color: item.tipo === 'nota' ? 'var(--amber)' : 'var(--t2)' }}>
                {item.tipo === 'nota' ? 'NOTA' : (item.ora || '--:--')}
              </span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.titolo || 'Nuovo'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button onClick={e => { e.stopPropagation(); moveItem(i, -1) }} disabled={i === 0}
                  style={{ width: 16, height: 11, border: 'none', background: 'transparent', color: i === 0 ? 'var(--s4)' : 'var(--t3)', cursor: i === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <ChevronUp size={11} />
                </button>
                <button onClick={e => { e.stopPropagation(); moveItem(i, 1) }} disabled={i === items.length - 1}
                  style={{ width: 16, height: 11, border: 'none', background: 'transparent', color: i === items.length - 1 ? 'var(--s4)' : 'var(--t3)', cursor: i === items.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <ChevronDown size={11} />
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <button onClick={() => addItem('tappa')} style={{ fontSize: 12, color: 'var(--ac)', background: 'transparent', border: '1px dashed rgba(142,201,176,0.4)', borderRadius: 'var(--r2)', padding: '6px 10px', cursor: 'pointer' }}>
              + Aggiungi tappa
            </button>
            <button onClick={() => addItem('nota')} style={{ fontSize: 12, color: 'var(--t2)', background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 'var(--r2)', padding: '6px 10px', cursor: 'pointer' }}>
              + Aggiungi nota
            </button>
          </div>

          {/* Team operativo */}
          <div style={{ marginTop: 18 }}>
            <label style={LBL}>Team operativo</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {team.map(name => (
                <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(142,201,176,0.1)', color: 'var(--ac)', border: '1px solid rgba(142,201,176,0.25)' }}>
                  {name}
                  <X size={11} style={{ cursor: 'pointer' }} onClick={() => removeTeamMember(name)} />
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={teamInput}
                onChange={e => setTeamInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTeamMember() } }}
                placeholder="Nome collaboratore…"
                style={{ ...INP, fontSize: 12 }}
              />
              <button onClick={addTeamMember} style={{ padding: '0 12px', borderRadius: 'var(--r2)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--t2)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                Aggiungi
              </button>
            </div>
          </div>
        </div>

        {/* Dettaglio */}
        <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: 16, border: '1px solid rgba(255,255,255,0.06)', minHeight: 220 }}>
          {!selected ? (
            <p style={{ fontSize: 13, color: 'var(--t3)', fontStyle: 'italic' }}>Seleziona o aggiungi una tappa per modificarla.</p>
          ) : selected.tipo === 'nota' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.07em' }}>NOTA</span>
                <button onClick={() => removeItem(selected.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', display: 'flex' }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div>
                <label style={LBL}>Testo nota</label>
                <textarea
                  value={selected.titolo}
                  onChange={e => updateItem(selected.id, { titolo: e.target.value })}
                  rows={4}
                  placeholder="Es. Portare luci extra, verificare parcheggio…"
                  style={{ ...INP, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>Tappa</span>
                <button onClick={() => removeItem(selected.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', display: 'flex' }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
                <div>
                  <label style={LBL}>Location</label>
                  <input value={selected.titolo} onChange={e => updateItem(selected.id, { titolo: e.target.value })} placeholder="Es. Chiesa San Marco" style={INP} />
                </div>
                <div>
                  <label style={LBL}>Ora</label>
                  <input type="time" value={selected.ora ?? ''} onChange={e => updateItem(selected.id, { ora: e.target.value })} style={INP} />
                </div>
              </div>
              <div>
                <label style={LBL}><MapPin size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />Indirizzo</label>
                <input value={selected.indirizzo ?? ''} onChange={e => updateItem(selected.id, { indirizzo: e.target.value })} placeholder="Es. Via Roma 1, Napoli" style={INP} />
              </div>
              <div>
                <label style={LBL}>Note</label>
                <textarea
                  value={selected.note ?? ''}
                  onChange={e => updateItem(selected.id, { note: e.target.value })}
                  rows={3}
                  placeholder="Dettagli per questa tappa…"
                  style={{ ...INP, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

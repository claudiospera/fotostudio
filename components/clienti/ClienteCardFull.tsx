'use client'

import React from 'react'
import { Phone, Mail } from 'lucide-react'
import type { Cliente, CategoriaCliente } from '@/lib/types'

export const CAT_COLORS: Record<CategoriaCliente, string> = {
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

export const CAT_EMOJI: Record<CategoriaCliente, string> = {
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

export function formatDateFull(d?: string) {
  if (!d) return '—'
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ClienteCardFull({ cliente: c, onEdit, onDelete }: {
  cliente: Cliente
  onEdit: () => void
  onDelete: () => void
}) {
  const col     = CAT_COLORS[c.categoria] ?? '#8ec9b0'
  const emoji   = CAT_EMOJI[c.categoria]  ?? '📋'
  const residuo = Number(c.importo_totale ?? 0) - Number(c.acconto ?? 0)
  const contatto = c.tel1 || c.email1 || c.whatsapp1 || c.genitore1_tel
  const phoneNumber  = c.whatsapp1 || c.tel1 || c.genitore1_tel || ''
  const emailAddress = c.email1 || ''

  const openWhatsApp = () => {
    const num = phoneNumber.replace(/\D/g, '')
    if (num) window.open(`https://wa.me/39${num}`, '_blank')
  }
  const openEmail = () => {
    if (emailAddress) window.open(`mailto:${emailAddress}`, '_blank')
  }

  const saveJpeg = async () => {
    const res = await fetch(`/api/scheda-pdf/${c.id}`)
    if (!res.ok) return
    let html = await res.text()
    html = html.replace(/<script>window\.onload[^<]*<\/script>/g, '')
               .replace(/<div class="toolbar"[\s\S]*?<\/div>\s*<\/div>/, '')
    const iframe = document.createElement('iframe')
    Object.assign(iframe.style, { position: 'fixed', left: '-9999px', top: '0', width: '800px', height: '1px', border: 'none', visibility: 'hidden' })
    document.body.appendChild(iframe)
    await new Promise<void>(resolve => {
      iframe.onload = () => resolve()
      iframe.contentDocument!.open()
      iframe.contentDocument!.write(html)
      iframe.contentDocument!.close()
    })
    await new Promise(r => setTimeout(r, 1800))
    iframe.style.height = `${iframe.contentDocument!.documentElement.scrollHeight}px`
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(iframe.contentDocument!.body, { backgroundColor: '#F2EDE6', scale: 2, useCORS: true, width: 800, windowWidth: 800 })
    document.body.removeChild(iframe)
    const link = document.createElement('a')
    link.download = `scheda-${c.nome1}${c.nome2 ? `-${c.nome2}` : ''}.jpg`
    link.href = canvas.toDataURL('image/jpeg', 0.92)
    link.click()
  }

  const printScheda = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const nome = `${c.nome1}${c.nome2 ? ` e ${c.nome2}` : ''}`
    const lines = [
      `Categoria: ${c.categoria}`,
      c.data_evento ? `Data evento: ${formatDateFull(c.data_evento)}` : '',
      c.luogo_evento ? `Luogo: ${c.luogo_evento}` : '',
      c.tel1 ? `Tel: ${c.tel1}` : '',
      c.email1 ? `Email: ${c.email1}` : '',
      Number(c.importo_totale) > 0 ? `Totale: €${Number(c.importo_totale).toLocaleString('it-IT')}` : '',
      Number(c.acconto) > 0 ? `Acconto: €${Number(c.acconto).toLocaleString('it-IT')}` : '',
      residuo !== 0 ? `Saldo residuo: €${residuo.toLocaleString('it-IT')}` : '',
      c.note ? `Note: ${c.note}` : '',
    ].filter(Boolean).join('\n')
    win.document.write(`<html><head><title>Scheda — ${nome}</title>
      <style>body{font-family:Arial,sans-serif;font-size:13px;line-height:1.6;padding:32px;max-width:600px;margin:0 auto;color:#222;}
      h1{font-size:18px;margin:0 0 4px;}hr{border:none;border-top:1px solid #ccc;margin:16px 0;}
      pre{white-space:pre-wrap;font-family:inherit;margin:0;}@media print{body{padding:0;}}</style></head>
      <body><h1>${nome}</h1><p style="color:#666;margin:0 0 16px">${c.categoria}${c.data_evento ? ` · ${formatDateFull(c.data_evento)}` : ''}</p>
      <hr/><pre>${lines}</pre><script>window.onload=()=>{window.print()}<\/script></body></html>`)
    win.document.close()
  }

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 'var(--r)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ height: 5, background: col }} />

      <div style={{ padding: '18px 18px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, margin: '0 0 8px', color: 'var(--tx)', lineHeight: 1.2 }}>
            {c.nome1}{c.nome2 ? ` e ${c.nome2}` : ''}
          </h3>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, padding: '4px 10px', borderRadius: 20,
            background: `${col}22`, color: col, border: `1px solid ${col}55`,
            fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
          }}>
            {emoji} {c.categoria}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {c.data_evento && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--t2)' }}>
              <span>📅</span><span>{formatDateFull(c.data_evento)}</span>
            </div>
          )}
          {c.luogo_evento && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--t2)' }}>
              <span>📍</span><span>{c.luogo_evento}</span>
            </div>
          )}
          {!contatto && <span style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic' }}>Nessun contatto</span>}
          {contatto && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--t2)' }}>
              <Phone size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
              <span>{c.tel1 || c.whatsapp1 || c.genitore1_tel}</span>
            </div>
          )}
        </div>

        {c.email1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--t2)' }}>
            <Mail size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email1}</span>
          </div>
        )}

        {c.pacchetti && c.pacchetti.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {c.pacchetti.map(p => (
              <span key={p.nome} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(142,201,176,0.1)', color: 'var(--ac)', border: '1px solid rgba(142,201,176,0.25)' }}>
                {p.nome}
              </span>
            ))}
          </div>
        )}

        {c.note && (
          <div style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {c.note}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          {[
            { label: 'Acconto', value: c.acconto,        color: Number(c.acconto) > 0 ? 'var(--ac)' : 'var(--t3)' },
            { label: 'Totale',  value: c.importo_totale, color: Number(c.importo_totale) > 0 ? 'var(--tx)' : 'var(--t3)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color }}>
                {Number(value) > 0 ? `${Number(value).toLocaleString('it-IT')} €` : '—'}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>Saldo residuo</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: residuo > 0 ? 'var(--amber)' : residuo < 0 ? 'var(--red)' : 'var(--t3)' }}>
            {residuo !== 0 ? `${residuo.toLocaleString('it-IT')} €` : '—'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: '✏️ Modifica',   action: onEdit,       border: true  },
          { label: '🗑️ Elimina',    action: onDelete,     border: false, danger: true },
          { label: '💬 WhatsApp',   action: openWhatsApp, border: true,  disabled: !phoneNumber },
          { label: '✉️ Email',      action: openEmail,    border: false, disabled: !emailAddress },
          { label: '🖨️ Stampa',     action: printScheda,  border: true  },
          { label: '🖼️ Salva JPEG', action: saveJpeg,     border: false },
        ].map(({ label, action, border, danger, disabled }) => (
          <button key={label} onClick={disabled ? undefined : action} style={{
            padding: '11px 0', fontSize: 12, fontWeight: 500,
            background: 'transparent',
            color: danger ? 'var(--red)' : disabled ? 'var(--t3)' : 'var(--t2)',
            border: 'none',
            borderRight: border ? '1px solid rgba(255,255,255,0.06)' : 'none',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
            transition: 'background 0.12s, color 0.12s',
          }}
            onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'var(--s2)' }}
            onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >{label}</button>
        ))}
        <button onClick={() => window.open(`/api/scheda-pdf/${c.id}`, '_blank')} style={{
          padding: '10px 0', fontSize: 12, fontWeight: 600, background: 'transparent', color: 'var(--ac)', border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer', transition: 'background 0.12s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(142,201,176,0.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >🖨️ Stampa Scheda</button>
        <button onClick={() => {
          const url = `${window.location.origin}/api/scheda-pub/${c.id}`
          if (navigator.clipboard) {
            navigator.clipboard.writeText(url)
            alert('Link copiato! Incollalo su WhatsApp o email per inviarlo al cliente.')
          } else window.open(url, '_blank')
        }} style={{
          padding: '10px 0', fontSize: 12, fontWeight: 600, background: 'transparent', color: 'var(--ac)', border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'background 0.12s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(142,201,176,0.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >🔗 Invia al cliente</button>
      </div>
    </div>
  )
}

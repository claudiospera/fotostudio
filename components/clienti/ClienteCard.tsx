'use client'

import { useRef } from 'react'
import { Pencil, Printer, Image, Mail, MessageCircle, Trash2, MapPin, Phone } from 'lucide-react'
import type { Cliente, CategoriaCliente, Profile } from '@/lib/types'

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

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatEuro(n?: number) {
  if (!n) return '—'
  return '€' + n.toLocaleString('it-IT')
}

interface ClienteCardProps {
  cliente: Cliente
  profile: Partial<Profile>
  onModifica: (c: Cliente) => void
  onElimina: (c: Cliente) => void
}

export const ClienteCard = ({ cliente: c, profile, onModifica, onElimina }: ClienteCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)

  const saldo = (c.importo_totale ?? 0) - (c.acconto ?? 0) - (c.saldo ?? 0)
  const catColor = CAT_COLORS[c.categoria] ?? '#666'
  const catEmoji = CAT_EMOJI[c.categoria] ?? '📷'

  const nomeDisplay = c.nome2 ? `${c.nome1} e ${c.nome2}` : c.nome1
  const hasContact  = !!(c.tel1 || c.email1 || c.tel2 || c.email2)

  const profileName = profile.studio_name || profile.name || 'FotoStudio'
  const profileTel  = profile.telefono
  const profileEmail = profile.email
  const profileIban  = profile.iban

  const handleStampa = () => {
    if (!cardRef.current) return
    const html = cardRef.current.outerHTML
    const win = window.open('', '_blank', 'width=480,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${nomeDisplay}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #fff; font-family: 'DM Sans', sans-serif; }
  .cliente-card-inner { width: 380px; margin: 0 auto; border: 1px solid #ddd; }
  @media print {
    body { margin: 0; }
    @page { size: A5; margin: 8mm; }
  }
</style>
</head>
<body>${html}</body>
</html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  const handleSalvaJpeg = async () => {
    if (!cardRef.current) return
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#faf7f2',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `${nomeDisplay.replace(/\s+/g, '_')}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
    } catch {
      alert('Errore nel salvataggio JPEG')
    }
  }

  const handleEmail = () => {
    const dest = c.email1 || c.email2 || ''
    window.open(`mailto:${dest}`, '_blank')
  }

  const handleWhatsApp = () => {
    const tel = (c.whatsapp1 || c.tel1 || '').replace(/\D/g, '')
    window.open(`https://wa.me/39${tel}`, '_blank')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Card printable area */}
      <div
        ref={cardRef}
        className="cliente-card-inner"
        style={{
          background: '#faf7f2',
          border: '1px solid #e0d9d0',
          borderRadius: 8,
          overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header fotografo */}
        <div style={{
          background: '#1a1018',
          color: '#fff',
          padding: '10px 14px',
          fontSize: 11,
          lineHeight: 1.6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <strong style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '-0.01em' }}>
              {profileName}
            </strong>
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#bbb', flexWrap: 'wrap' }}>
              {profileTel  && <span>📞 {profileTel}</span>}
              {profileEmail && <span>✉ {profileEmail}</span>}
            </div>
          </div>
          {profileIban && (
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
              IBAN: {profileIban}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Nome + categoria */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 20, lineHeight: 1.15, color: '#1a1018',
              textTransform: 'lowercase', flex: 1,
            }}>
              {nomeDisplay}
            </h3>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '4px 10px',
              borderRadius: 20, whiteSpace: 'nowrap',
              background: `${catColor}22`, color: catColor,
              border: `1px solid ${catColor}55`,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {catEmoji} {c.categoria}
            </span>
          </div>

          {/* Data */}
          <div style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>📅</span>
            <span>{formatDate(c.data_evento)}</span>
          </div>

          {/* Luogo */}
          {c.luogo_evento && (
            <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={11} />
              <span style={{ fontStyle: 'italic' }}>{c.luogo_evento}</span>
            </div>
          )}

          {/* Contatto */}
          {hasContact ? (
            <div style={{ fontSize: 11, color: '#555', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {c.tel1 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={10} /> {c.nome1}: {c.tel1}
                </span>
              )}
              {c.tel2 && c.nome2 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={10} /> {c.nome2}: {c.tel2}
                </span>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>Nessun contatto</p>
          )}

          {/* Note */}
          {c.note && (
            <p style={{
              fontSize: 10, color: '#777', fontStyle: 'italic',
              borderLeft: `3px solid ${catColor}66`, paddingLeft: 8,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {c.note}
            </p>
          )}

          {/* Acconto / Totale */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'ACCONTO', value: c.acconto },
              { label: 'TOTALE',  value: c.importo_totale },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: '#f0ece6', borderRadius: 6, padding: '8px 10px',
                border: '1px solid #e0d9d0',
              }}>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {label}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800, color: '#1a1018', fontFamily: 'Syne, sans-serif' }}>
                  {formatEuro(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Saldo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
            <span style={{ fontSize: 12, color: '#888' }}>Saldo residuo</span>
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: saldo > 0 ? '#c0392b' : saldo < 0 ? '#27ae60' : '#aaa',
            }}>
              {saldo === 0 ? '—' : formatEuro(Math.abs(saldo))}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons (fuori dalla card, non stampati) */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
        borderTop: '1px solid #e0d9d0',
      }}>
        {[
          { label: 'Modifica',   icon: <Pencil size={11} />,         onClick: () => onModifica(c),  color: '#555' },
          { label: 'Stampa',     icon: <Printer size={11} />,        onClick: handleStampa,          color: '#555' },
          { label: 'Salva JPEG', icon: <Image size={11} />,          onClick: handleSalvaJpeg,       color: '#2d7a4f' },
          { label: 'Email',      icon: <Mail size={11} />,           onClick: handleEmail,           color: '#555' },
          { label: 'WhatsApp',   icon: <MessageCircle size={11} />,  onClick: handleWhatsApp,        color: '#25a244' },
          { label: 'Elimina',    icon: <Trash2 size={11} />,         onClick: () => onElimina(c),    color: '#c0392b' },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 4px', fontSize: 11, fontWeight: 500,
              background: '#f5f0eb', border: '1px solid #e0d9d0',
              color: btn.color, cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#ede7de')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#f5f0eb')}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import type { Cliente, PacchettoCliente } from '@/lib/types'

const NUMERIC_FIELDS = ['importo_totale', 'acconto', 'saldo', 'album_pagine']
const DATE_FIELDS    = ['data_evento', 'data_acconto', 'data_saldo']

function normalizeCliente(row: Record<string, unknown>): Cliente {
  const out = { ...row }
  for (const f of NUMERIC_FIELDS) {
    if (out[f] !== null && out[f] !== undefined) out[f] = Number(out[f])
  }
  for (const f of DATE_FIELDS) {
    if (out[f] instanceof Date) {
      out[f] = (out[f] as Date).toISOString().slice(0, 10)
    } else if (typeof out[f] === 'string' && out[f]) {
      out[f] = (out[f] as string).slice(0, 10)
    }
  }
  if (!Array.isArray(out['pacchetti'])) out['pacchetti'] = []
  return out as unknown as Cliente
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function esc(s: string | undefined | null) {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function row(label: string, value: string | undefined | null) {
  if (!value) return ''
  return `<tr><td class="lbl">${esc(label)}</td><td>${esc(value)}</td></tr>`
}

function field(label: string, value: string | undefined | null): string {
  if (!value) return ''
  return `
    <div class="field">
      <span class="field-label">${esc(label)}</span>
      <span class="field-value">${esc(value)}</span>
    </div>`
}

function section(emoji: string, title: string, content: string): string {
  if (!content.trim()) return ''
  return `
  <div class="section">
    <div class="section-header">
      <span class="section-emoji">${emoji}</span>
      <span class="section-title">${esc(title)}</span>
    </div>
    <div class="section-body">
      ${content}
    </div>
  </div>`
}

function buildHtml(c: Cliente): string {
  const ex      = c.extra ?? {}
  const nomi    = c.nome1 + (c.nome2 ? ` e ${c.nome2}` : '')
  const residuo = Number(c.importo_totale ?? 0) - Number(c.acconto ?? 0)
  const oggi    = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Dati evento ────────────────────────────────────────────────────────────
  const datEvento = [
    field('Data evento', formatDate(c.data_evento)),
    field('Luogo', c.luogo_evento),
    field('Ora ricevimento', ex.ora_ricevimento),
  ].filter(Boolean).join('')

  // ── Contatti persona 1 ─────────────────────────────────────────────────────
  const cont1 = [
    field('Telefono', c.tel1),
    field('WhatsApp', c.whatsapp1),
    field('Email', c.email1),
    field('Instagram', ex.social1),
    field('Facebook', ex.facebook1),
    c.indirizzo1 ? field('Indirizzo', `${c.indirizzo1}${c.citta1 ? ', ' + c.citta1 : ''}`) : '',
  ].filter(Boolean).join('')

  // ── Contatti persona 2 ─────────────────────────────────────────────────────
  const cont2 = c.nome2 ? [
    field('Telefono', c.tel2),
    field('WhatsApp', c.whatsapp2),
    field('Email', c.email2),
    field('Instagram', ex.social2),
    field('Facebook', ex.facebook2),
    c.indirizzo2 ? field('Indirizzo', `${c.indirizzo2}${c.citta2 ? ', ' + c.citta2 : ''}`) : '',
  ].filter(Boolean).join('') : ''

  // ── Genitori ───────────────────────────────────────────────────────────────
  const gen1parts = [c.genitore1_nome, c.genitore1_tel, ex.gen1_email, ex.gen1_whatsapp ? `WA: ${ex.gen1_whatsapp}` : ''].filter(Boolean).join(' · ')
  const gen2parts = [c.genitore2_nome, c.genitore2_tel, ex.gen2_email, ex.gen2_whatsapp ? `WA: ${ex.gen2_whatsapp}` : ''].filter(Boolean).join(' · ')
  const genitori  = [
    gen1parts ? field('Genitore 1', gen1parts) : '',
    gen2parts ? field('Genitore 2', gen2parts) : '',
  ].filter(Boolean).join('')

  const contattiContent = [
    cont1 ? `<div class="sub-group"><div class="sub-title">${c.nome2 ? esc(c.nome1) : 'Contatti'}</div>${cont1}</div>` : '',
    cont2 ? `<div class="sub-group"><div class="sub-title">${esc(c.nome2 ?? '')}</div>${cont2}</div>` : '',
    genitori ? `<div class="sub-group"><div class="sub-title">Genitori</div>${genitori}</div>` : '',
  ].filter(Boolean).join('')

  // ── Indirizzi ──────────────────────────────────────────────────────────────
  const indirizzi = [
    (ex.addr_casa_nome || ex.addr_casa) ? field(`Casa${ex.addr_casa_nome ? ' ' + ex.addr_casa_nome : ' 1'}`, `${ex.addr_casa ?? ''}${ex.ora_casa ? '  ·  partenza ore ' + ex.ora_casa : ''}`) : '',
    ex.addr_casa2 ? field(`Casa 2${ex.addr_casa2_nome ? ' ' + ex.addr_casa2_nome : ''}`, `${ex.addr_casa2}${ex.ora_casa2 ? '  ·  partenza ore ' + ex.ora_casa2 : ''}`) : '',
    ex.addr_chiesa ? field('Chiesa / Cerimonia', `${ex.addr_chiesa}${ex.ora_chiesa ? '  ·  ore ' + ex.ora_chiesa : ''}`) : '',
    ex.addr_ristorante ? field('Ricevimento', `${ex.addr_ristorante}${ex.ora_ristorante ? '  ·  ore ' + ex.ora_ristorante : ''}`) : '',
  ].filter(Boolean).join('')

  // ── Album ──────────────────────────────────────────────────────────────────
  const album = [
    field('Copertina', c.album_copertina),
    field('Formato', c.album_formato),
    c.album_pagine ? field('Pagine', `${c.album_pagine} fogli`) : '',
    field('Note', ex.album_note),
  ].filter(Boolean).join('')

  // ── Video ──────────────────────────────────────────────────────────────────
  const video = [
    field('Tipo', c.video_tipo),
    field('Durata', ex.video_durata),
    field('Consegna', ex.video_formato_consegna),
    field('Musica', ex.video_musica),
    field('Note', ex.video_note),
  ].filter(Boolean).join('')

  // ── Pacchetti ──────────────────────────────────────────────────────────────
  const pacchettiContent = (c.pacchetti as PacchettoCliente[]).length > 0
    ? `<div class="pkg-grid">${c.pacchetti.map((p: PacchettoCliente) =>
        `<div class="pkg-item">
          <span class="pkg-nome">${esc(p.nome)}</span>
          ${p.prezzo ? `<span class="pkg-prezzo">€ ${p.prezzo.toLocaleString('it-IT')}</span>` : ''}
        </div>`
      ).join('')}</div>`
    : ''

  // ── Pagamenti ──────────────────────────────────────────────────────────────
  const residuoColor = residuo > 0 ? '#9a6200' : residuo < 0 ? '#b94040' : '#4A6B44'
  const pagamentiContent = `
    <div class="pay-grid">
      <div class="pay-box">
        <div class="pay-label">Totale preventivo</div>
        <div class="pay-val">${Number(c.importo_totale ?? 0) > 0 ? `€ ${Number(c.importo_totale).toLocaleString('it-IT')}` : '—'}</div>
        ${c.data_saldo ? `<div class="pay-date">Saldo previsto: ${esc(formatDate(c.data_saldo))}</div>` : ''}
      </div>
      <div class="pay-box">
        <div class="pay-label">Acconto ricevuto</div>
        <div class="pay-val">${Number(c.acconto ?? 0) > 0 ? `€ ${Number(c.acconto).toLocaleString('it-IT')}` : '—'}</div>
        ${c.data_acconto ? `<div class="pay-date">${esc(formatDate(c.data_acconto))}</div>` : ''}
      </div>
      <div class="pay-box">
        <div class="pay-label">Saldo residuo</div>
        <div class="pay-val" style="color:${residuoColor}">${residuo !== 0 ? `€ ${Math.abs(residuo).toLocaleString('it-IT')}${residuo < 0 ? ' (eccedenza)' : ''}` : 'Saldato ✓'}</div>
      </div>
    </div>`

  // ── Note ───────────────────────────────────────────────────────────────────
  const noteContent = c.note ? `<p class="note-text">${esc(c.note)}</p>` : ''

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Scheda — ${esc(nomi)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 12px;
      font-weight: 400;
      line-height: 1.6;
      color: #3a3530;
      background: #F2EDE6;
      min-height: 100vh;
    }

    .page {
      max-width: 780px;
      margin: 0 auto;
      background: #F2EDE6;
    }

    /* ── HEADER ── */
    .header {
      background: #D4C9B8;
      border-bottom: 3px solid #7D9B76;
      padding: 24px 32px 20px;
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .header-logo {
      flex-shrink: 0;
      background: #fff;
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
    }
    .header-logo img {
      height: 52px;
      width: auto;
      display: block;
    }
    .header-info {
      flex: 1;
    }
    .header-label {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #7D9B76;
      margin-bottom: 6px;
    }
    .header-nome {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      color: #2a2520;
      line-height: 1.15;
      margin-bottom: 10px;
      letter-spacing: -0.01em;
    }
    .header-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
    }
    .badge-cat {
      background: #7D9B7633;
      color: #4A6B44;
      border: 1px solid #7D9B7666;
      font-weight: 600;
    }
    .badge-data {
      background: rgba(255,255,255,0.5);
      color: #5a5040;
      border: 1px solid rgba(0,0,0,0.1);
    }
    .badge-luogo {
      background: rgba(255,255,255,0.5);
      color: #5a5040;
      border: 1px solid rgba(0,0,0,0.1);
    }
    .header-date {
      font-size: 9px;
      color: #8a7e70;
      margin-top: 10px;
    }

    /* ── MAIN CONTENT ── */
    .content {
      padding: 20px 32px 0;
    }

    /* ── SECTIONS ── */
    .section {
      margin-bottom: 14px;
      page-break-inside: avoid;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #C8BFB0;
    }
    .section-header {
      background: #D8E8D6;
      padding: 7px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #b8d4b4;
    }
    .section-emoji { font-size: 13px; }
    .section-title {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: #4A6B44;
    }
    .section-body {
      background: #FAF7F3;
      padding: 12px 14px;
    }

    /* ── FIELDS ── */
    .field {
      display: flex;
      gap: 0;
      padding: 5px 0;
      border-bottom: 1px solid #EDE8E0;
      align-items: baseline;
    }
    .field:last-child { border-bottom: none; }
    .field-label {
      flex-shrink: 0;
      width: 148px;
      font-size: 10px;
      font-weight: 600;
      color: #8a7e6e;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding-right: 12px;
    }
    .field-value {
      flex: 1;
      font-size: 12px;
      color: #2e2820;
      font-weight: 400;
    }

    /* ── SUB-GROUPS (contatti multipli) ── */
    .sub-group {
      margin-bottom: 10px;
    }
    .sub-group:last-child { margin-bottom: 0; }
    .sub-title {
      font-family: 'Playfair Display', serif;
      font-size: 12px;
      font-weight: 600;
      color: #4A6B44;
      margin-bottom: 4px;
      padding-bottom: 3px;
      border-bottom: 1px dashed #C8D8C4;
    }

    /* ── DUE COLONNE (dati evento) ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
    }

    /* ── PACCHETTI ── */
    .pkg-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .pkg-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F2EDE6;
      border: 1px solid #C8BFB0;
      border-radius: 5px;
      padding: 6px 10px;
      gap: 8px;
    }
    .pkg-nome {
      font-size: 11px;
      color: #3a3530;
      flex: 1;
    }
    .pkg-prezzo {
      font-size: 11px;
      font-weight: 600;
      color: #4A6B44;
      flex-shrink: 0;
    }

    /* ── PAGAMENTI ── */
    .pay-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .pay-box {
      background: #F2EDE6;
      border: 1px solid #C8BFB0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .pay-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #8a7e6e;
      margin-bottom: 5px;
    }
    .pay-val {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 600;
      color: #2a2520;
      line-height: 1;
      margin-bottom: 4px;
    }
    .pay-date {
      font-size: 10px;
      color: #8a7e6e;
      margin-top: 4px;
    }

    /* ── NOTE ── */
    .note-text {
      font-size: 12px;
      color: #5a5040;
      font-style: italic;
      line-height: 1.7;
    }

    /* ── STRIP CONTATTI STUDIO ── */
    .studio-strip {
      background: #D4C9B8;
      border-top: 2px solid #7D9B76;
      margin-top: 20px;
      padding: 14px 32px;
    }
    .studio-strip-title {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #7D9B76;
      margin-bottom: 10px;
    }
    .studio-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 16px;
    }
    .studio-item {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .studio-item-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #7D9B76;
    }
    .studio-item-val {
      font-size: 11px;
      color: #3a3530;
      font-weight: 500;
    }
    .studio-iban {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      gap: 1px;
      margin-top: 4px;
    }
    .iban-val {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: 700;
      color: #2a2520;
      letter-spacing: 0.06em;
    }

    /* ── FOOTER ── */
    .footer {
      background: #4A6B44;
      padding: 10px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand {
      font-family: 'Playfair Display', serif;
      font-size: 13px;
      font-weight: 600;
      color: #D8E8D6;
      letter-spacing: 0.02em;
    }
    .footer-date {
      font-size: 10px;
      color: #9ab894;
    }

    /* ── PRINT ── */
    @media print {
      body { background: #F2EDE6; }
      .page { max-width: 100%; }
      @page { margin: 10mm 10mm; size: A4; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <header class="header">
    <div class="header-logo">
      <img src="/logo.png" alt="Claudio Spera Fotografo" />
    </div>
    <div class="header-info">
      <div class="header-label">Scheda Cliente</div>
      <div class="header-nome">${esc(nomi)}</div>
      <div class="header-badges">
        <span class="badge badge-cat">${esc(c.categoria)}</span>
        ${c.data_evento ? `<span class="badge badge-data">📅 ${esc(formatDate(c.data_evento))}</span>` : ''}
        ${c.luogo_evento ? `<span class="badge badge-luogo">📍 ${esc(c.luogo_evento)}</span>` : ''}
      </div>
      <div class="header-date">Generata il ${oggi}</div>
    </div>
  </header>

  <!-- CONTENT -->
  <div class="content">

    ${datEvento ? section('📋', 'Dati Evento', datEvento) : ''}
    ${contattiContent ? section('👤', 'Contatti', contattiContent) : ''}
    ${indirizzi ? section('📍', 'Indirizzi &amp; Orari', indirizzi) : ''}
    ${album ? section('📒', 'Album Fotografico', album) : ''}
    ${video ? section('🎬', 'Video', video) : ''}
    ${pacchettiContent ? section('📦', 'Pacchetti &amp; Opzioni', pacchettiContent) : ''}
    ${section('💶', 'Pagamenti', pagamentiContent)}
    ${noteContent ? section('📝', 'Note', noteContent) : ''}

  </div>

  <!-- STRIP STUDIO -->
  <div class="studio-strip">
    <div class="studio-strip-title">Contatti Studio</div>
    <div class="studio-grid">
      <div class="studio-item">
        <span class="studio-item-label">Telefono</span>
        <span class="studio-item-val">389 785 5581</span>
      </div>
      <div class="studio-item">
        <span class="studio-item-label">Email</span>
        <span class="studio-item-val">info@claudiospera.com</span>
      </div>
      <div class="studio-item">
        <span class="studio-item-label">Sito web</span>
        <span class="studio-item-val">www.claudiospera.com</span>
      </div>
      <div class="studio-item">
        <span class="studio-item-label">Instagram</span>
        <span class="studio-item-val">@claudiosperafotografo</span>
      </div>
      <div class="studio-item">
        <span class="studio-item-label">Studio</span>
        <span class="studio-item-val">@studiofotograficoclaudiospera</span>
      </div>
      <div class="studio-item">
        <span class="studio-item-label">Sede</span>
        <span class="studio-item-val">Mirabella Eclano (AV)</span>
      </div>
      <div class="studio-iban">
        <span class="studio-item-label">IBAN</span>
        <span class="iban-val">IT72 V053 8775 7700 0000 2430 292</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="footer">
    <span class="footer-brand">Claudio Spera Fotografo — Storie da Raccontare</span>
    <span class="footer-date">${oggi}</span>
  </footer>

</div>
<script>window.onload = () => { window.print() }</script>
</body>
</html>`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return new NextResponse('Non autorizzato', { status: 401 })

  const rows = await sql`
    SELECT * FROM clienti WHERE id = ${id} AND user_id = ${userId}
  `
  const arr = rows as Record<string, unknown>[]
  if (!arr.length) return new NextResponse('Cliente non trovato', { status: 404 })

  const cliente = normalizeCliente(arr[0])
  const html    = buildHtml(cliente)

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

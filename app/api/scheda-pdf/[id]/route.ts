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

function buildHtml(c: Cliente): string {
  const ex = c.extra ?? {}
  const nomi = c.nome1 + (c.nome2 ? ` e ${c.nome2}` : '')
  const residuo = Number(c.importo_totale ?? 0) - Number(c.acconto ?? 0)

  const contatti1 = [
    row('Telefono', c.tel1),
    row('WhatsApp', c.whatsapp1),
    row('Email', c.email1),
    row('Instagram', ex.social1),
    row('Facebook', ex.facebook1),
    row('Indirizzo', c.indirizzo1),
    row('Città', c.citta1),
  ].filter(Boolean).join('\n')

  const contatti2 = c.nome2 ? [
    row('Telefono', c.tel2),
    row('WhatsApp', c.whatsapp2),
    row('Email', c.email2),
    row('Instagram', ex.social2),
    row('Facebook', ex.facebook2),
    row('Indirizzo', c.indirizzo2),
    row('Città', c.citta2),
  ].filter(Boolean).join('\n') : ''

  const genitori = [
    c.genitore1_nome ? `<tr><td class="lbl">Genitore 1</td><td>${esc(c.genitore1_nome)}${c.genitore1_tel ? ` · ${esc(c.genitore1_tel)}` : ''}${ex.gen1_email ? ` · ${esc(ex.gen1_email)}` : ''}${ex.gen1_whatsapp ? ` (WA: ${esc(ex.gen1_whatsapp)})` : ''}</td></tr>` : '',
    c.genitore2_nome ? `<tr><td class="lbl">Genitore 2</td><td>${esc(c.genitore2_nome)}${c.genitore2_tel ? ` · ${esc(c.genitore2_tel)}` : ''}${ex.gen2_email ? ` · ${esc(ex.gen2_email)}` : ''}${ex.gen2_whatsapp ? ` (WA: ${esc(ex.gen2_whatsapp)})` : ''}</td></tr>` : '',
  ].filter(Boolean).join('\n')

  const indirizzi = [
    ex.addr_casa_nome || ex.addr_casa ? `<tr><td class="lbl">Casa ${ex.addr_casa_nome ? `(${esc(ex.addr_casa_nome)})` : '1'}</td><td>${esc(ex.addr_casa)}${ex.ora_casa ? ` — partenza: ${esc(ex.ora_casa)}` : ''}</td></tr>` : '',
    ex.addr_casa2 ? `<tr><td class="lbl">Casa 2 ${ex.addr_casa2_nome ? `(${esc(ex.addr_casa2_nome)})` : ''}</td><td>${esc(ex.addr_casa2)}${ex.ora_casa2 ? ` — partenza: ${esc(ex.ora_casa2)}` : ''}</td></tr>` : '',
    ex.addr_chiesa ? `<tr><td class="lbl">Chiesa / Cerimonia</td><td>${esc(ex.addr_chiesa)}${ex.ora_chiesa ? ` — ore ${esc(ex.ora_chiesa)}` : ''}</td></tr>` : '',
    ex.addr_ristorante ? `<tr><td class="lbl">Ricevimento</td><td>${esc(ex.addr_ristorante)}${ex.ora_ristorante ? ` — ore ${esc(ex.ora_ristorante)}` : ''}${ex.ora_ricevimento ? ` (ricevimento: ${esc(ex.ora_ricevimento)})` : ''}</td></tr>` : '',
  ].filter(Boolean).join('\n')

  const album = [
    row('Copertina', c.album_copertina),
    row('Formato', c.album_formato),
    c.album_pagine ? `<tr><td class="lbl">Pagine</td><td>${c.album_pagine} fogli</td></tr>` : '',
    row('Note album', ex.album_note),
  ].filter(Boolean).join('\n')

  const video = [
    row('Tipo', c.video_tipo),
    row('Durata', ex.video_durata),
    row('Consegna', ex.video_formato_consegna),
    row('Musica', ex.video_musica),
    row('Note video', ex.video_note),
  ].filter(Boolean).join('\n')

  const pacchetti = (c.pacchetti as PacchettoCliente[]).length > 0
    ? c.pacchetti.map((p: PacchettoCliente) => `<li>${esc(p.nome)}${p.prezzo ? ` <span class="price">€${p.prezzo.toLocaleString('it-IT')}</span>` : ''}</li>`).join('\n')
    : ''

  const section = (title: string, content: string) =>
    content ? `<section><h2>${esc(title)}</h2><table>${content}</table></section>` : ''

  const pacchettiSection = pacchetti
    ? `<section><h2>Pacchetti &amp; Opzioni</h2><ul class="pkgs">${pacchetti}</ul></section>`
    : ''

  const noteSection = c.note
    ? `<section><h2>Note</h2><p class="note">${esc(c.note)}</p></section>`
    : ''

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Scheda — ${esc(nomi)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.55;
      color: #1a1a1a;
      background: #fff;
      padding: 32px 40px;
      max-width: 720px;
      margin: 0 auto;
    }
    header {
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    header h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    header .meta {
      font-size: 12px;
      color: #555;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    header .meta span::before {
      content: '• ';
      color: #aaa;
    }
    header .meta span:first-child::before { content: ''; }
    section {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    section h2 {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #666;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 4px 0; vertical-align: top; }
    td.lbl {
      width: 160px;
      color: #555;
      font-size: 11px;
      padding-right: 12px;
      white-space: nowrap;
    }
    .pkgs { list-style: none; display: flex; flex-direction: column; gap: 4px; }
    .pkgs li {
      font-size: 12px;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .pkgs li::before { content: '•'; color: #aaa; }
    .price { font-weight: 600; color: #1a1a1a; }
    .pagamenti-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 4px;
    }
    .pagamenti-grid .box {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .pagamenti-grid .box .lbl2 {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      margin-bottom: 4px;
    }
    .pagamenti-grid .box .val {
      font-size: 16px;
      font-weight: 700;
    }
    .residuo { color: ${residuo > 0 ? '#b45309' : residuo < 0 ? '#dc2626' : '#16a34a'}; }
    .note { color: #444; font-style: italic; font-size: 12px; line-height: 1.6; }
    footer {
      margin-top: 24px;
      border-top: 1px solid #e0e0e0;
      padding-top: 10px;
      font-size: 10px;
      color: #aaa;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 16px 20px; }
      @page { margin: 16mm 14mm; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${esc(nomi)}</h1>
    <div class="meta">
      <span>${esc(c.categoria)}</span>
      ${c.data_evento ? `<span>${esc(formatDate(c.data_evento))}</span>` : ''}
      ${c.luogo_evento ? `<span>${esc(c.luogo_evento)}</span>` : ''}
    </div>
  </header>

  ${contatti1 ? section('Contatti' + (c.nome2 ? ` — ${esc(c.nome1)}` : ''), contatti1) : ''}
  ${contatti2 ? section(`Contatti — ${esc(c.nome2 ?? '')}`, contatti2) : ''}
  ${genitori ? section('Genitori', genitori) : ''}
  ${indirizzi ? section('Indirizzi & Orari', indirizzi) : ''}
  ${album ? section('Album Fotografico', album) : ''}
  ${video ? section('Video', video) : ''}
  ${pacchettiSection}

  <section>
    <h2>Pagamenti</h2>
    <div class="pagamenti-grid">
      <div class="box">
        <div class="lbl2">Totale preventivo</div>
        <div class="val">${Number(c.importo_totale ?? 0) > 0 ? `€ ${Number(c.importo_totale).toLocaleString('it-IT')}` : '—'}</div>
        ${c.data_saldo ? `<div style="font-size:10px;color:#888;margin-top:2px">Saldo: ${esc(formatDate(c.data_saldo))}</div>` : ''}
      </div>
      <div class="box">
        <div class="lbl2">Acconto ricevuto</div>
        <div class="val">${Number(c.acconto ?? 0) > 0 ? `€ ${Number(c.acconto).toLocaleString('it-IT')}` : '—'}</div>
        ${c.data_acconto ? `<div style="font-size:10px;color:#888;margin-top:2px">${esc(formatDate(c.data_acconto))}</div>` : ''}
      </div>
      <div class="box">
        <div class="lbl2">Saldo residuo</div>
        <div class="val residuo">${residuo !== 0 ? `€ ${residuo.toLocaleString('it-IT')}` : 'Saldato ✓'}</div>
      </div>
    </div>
  </section>

  ${noteSection}

  <footer>
    <span>FotoStudio — Scheda Cliente</span>
    <span>Generata il ${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  </footer>

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

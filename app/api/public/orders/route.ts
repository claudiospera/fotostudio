import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const PHOTOGRAPHER_EMAIL = 'info@claudiospera.com'

// ── email HTML template ──────────────────────────────────────────────────────
function buildEmailHtml(order: {
  client_name: string | null
  client_email: string | null
  gallery_name: string
  items: { photo_url: string; filename: string; type: string; format_label: string; qty: number; unit_price: number; total: number }[]
  total: number
  notes: string | null
}) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;vertical-align:middle">
        <img src="${item.photo_url}" width="56" height="56" style="border-radius:6px;object-fit:cover;display:block" alt="${item.filename}"/>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;vertical-align:middle">
        <strong style="display:block;margin-bottom:2px">${item.filename}</strong>
        <span style="color:#6b7280">${item.type === 'carta' ? '📄 Stampa carta' : '🖼️ Stampa su tela'} · ${item.format_label}</span>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;color:#374151;vertical-align:middle">
        ${item.qty}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;color:#374151;vertical-align:middle">
        ${item.unit_price.toFixed(2).replace('.', ',')} €
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:700;color:#111827;vertical-align:middle">
        ${item.total.toFixed(2).replace('.', ',')} €
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:#2a3830;padding:28px 32px;text-align:center">
      <p style="margin:0;font-size:22px;font-weight:800;color:#8ec9b0;letter-spacing:-0.02em">Storie da Raccontare</p>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.55)">Nuovo ordine stampe ricevuto</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px">

      <!-- Galleria -->
      <div style="background:#f3f4f6;border-radius:8px;padding:14px 18px;margin-bottom:24px">
        <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Galleria</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#111827">${order.gallery_name}</p>
      </div>

      <!-- Cliente -->
      <div style="margin-bottom:24px">
        <p style="margin:0 0 10px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Dati cliente</p>
        <p style="margin:0;font-size:14px;color:#374151">
          <strong>${order.client_name || 'Non specificato'}</strong>
          ${order.client_email ? `<br><a href="mailto:${order.client_email}" style="color:#8ec9b0">${order.client_email}</a>` : ''}
        </p>
      </div>

      <!-- Prodotti -->
      <p style="margin:0 0 10px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Prodotti ordinati</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;border-bottom:2px solid #e5e7eb">Foto</th>
            <th style="padding:8px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;border-bottom:2px solid #e5e7eb">Prodotto</th>
            <th style="padding:8px;text-align:center;font-size:11px;color:#9ca3af;font-weight:600;border-bottom:2px solid #e5e7eb">Qtà</th>
            <th style="padding:8px;text-align:right;font-size:11px;color:#9ca3af;font-weight:600;border-bottom:2px solid #e5e7eb">Prezzo</th>
            <th style="padding:8px;text-align:right;font-size:11px;color:#9ca3af;font-weight:600;border-bottom:2px solid #e5e7eb">Totale</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <!-- Totale -->
      <div style="background:#f3f4f6;border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:${order.notes ? '20px' : '0'}">
        <span style="font-size:14px;color:#6b7280;font-weight:600">Totale ordine</span>
        <span style="font-size:22px;font-weight:800;color:#111827">${order.total.toFixed(2).replace('.', ',')} €</span>
      </div>

      ${order.notes ? `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px">
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.08em">Note cliente</p>
        <p style="margin:0;font-size:13px;color:#374151;font-style:italic">${order.notes}</p>
      </div>` : ''}

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af">Questo ordine è stato inviato tramite il portale clienti Storie da Raccontare</p>
    </div>
  </div>
</body>
</html>`
}

// ── email conferma cliente ───────────────────────────────────────────────────
function buildClientConfirmHtml(order: {
  client_name: string | null
  gallery_name: string
  items: { photo_url: string; filename: string; type: string; format_label: string; qty: number; unit_price: number; total: number }[]
  total: number
  notes: string | null
}) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;vertical-align:middle">
        <img src="${item.photo_url}" width="48" height="48" style="border-radius:6px;object-fit:cover;display:block" alt="${item.filename}"/>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;vertical-align:middle">
        <strong style="display:block;margin-bottom:2px">${item.filename}</strong>
        <span style="color:#6b7280">${item.type === 'carta' ? 'Stampa carta' : 'Stampa su tela'} · ${item.format_label}</span>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;color:#374151;vertical-align:middle">${item.qty}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:700;color:#111827;vertical-align:middle">
        ${item.total.toFixed(2).replace('.', ',')} €
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:#2a3830;padding:28px 32px;text-align:center">
      <p style="margin:0;font-size:22px;font-weight:800;color:#8ec9b0;letter-spacing:-0.02em">Storie da Raccontare</p>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.55)">Ordine ricevuto con successo</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px">

      <p style="font-size:15px;color:#111827;margin:0 0 6px">Ciao${order.client_name ? ' ' + order.client_name : ''}!</p>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.6">
        Ho ricevuto il tuo ordine di stampe dalla galleria <strong style="color:#111827">${order.gallery_name}</strong>.
        Ti contatterò a breve per organizzare la consegna.
      </p>

      <!-- Riepilogo -->
      <p style="margin:0 0 10px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Riepilogo ordine</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;border-bottom:2px solid #e5e7eb">Foto</th>
            <th style="padding:8px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;border-bottom:2px solid #e5e7eb">Prodotto</th>
            <th style="padding:8px;text-align:center;font-size:11px;color:#9ca3af;font-weight:600;border-bottom:2px solid #e5e7eb">Qtà</th>
            <th style="padding:8px;text-align:right;font-size:11px;color:#9ca3af;font-weight:600;border-bottom:2px solid #e5e7eb">Totale</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <!-- Totale -->
      <div style="background:#f3f4f6;border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:${order.notes ? '20px' : '0'}">
        <span style="font-size:14px;color:#6b7280;font-weight:600">Totale ordine</span>
        <span style="font-size:22px;font-weight:800;color:#111827">${order.total.toFixed(2).replace('.', ',')} €</span>
      </div>

      ${order.notes ? `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-top:16px">
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.08em">Le tue note</p>
        <p style="margin:0;font-size:13px;color:#374151;font-style:italic">${order.notes}</p>
      </div>` : ''}

      <p style="font-size:13px;color:#9ca3af;margin:24px 0 0;text-align:center">
        Per qualsiasi domanda rispondi a questa email o scrivi a <a href="mailto:info@claudiospera.com" style="color:#8ec9b0">info@claudiospera.com</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af">© Storie da Raccontare · Napoli</p>
    </div>
  </div>
</body>
</html>`
}

// ── GET: storico ordini per session_id ───────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const session_id = searchParams.get('session_id')
  const gallery_id = searchParams.get('gallery_id')

  if (!session_id || !gallery_id) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('print_orders')
    .select('*')
    .eq('session_id', session_id)
    .eq('gallery_id', gallery_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// ── POST: crea ordine ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { gallery_id, session_id, client_name, client_email, items, total, notes } = await req.json()

  if (!gallery_id || !session_id || !items?.length || total == null) {
    return NextResponse.json({ error: 'Dati ordine incompleti' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Recupera nome galleria per l'email
  const { data: gallery } = await supabase.from('galleries').select('name').eq('id', gallery_id).single()

  // Salva ordine su DB
  const { data: order, error } = await supabase
    .from('print_orders')
    .insert({ gallery_id, session_id, client_name, client_email, items, total, notes, status: 'nuovo' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Invia email al fotografo
  const emailPayload = {
    client_name,
    client_email,
    gallery_name: gallery?.name ?? 'Galleria',
    items,
    total,
    notes,
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      // Email al fotografo
      await resend.emails.send({
        from: 'Storie da Raccontare <onboarding@resend.dev>',
        to: PHOTOGRAPHER_EMAIL,
        subject: `Nuovo ordine stampe - ${gallery?.name ?? 'Galleria'}`,
        html: buildEmailHtml(emailPayload),
      })

      // Email di conferma al cliente (solo se ha fornito l'email)
      if (client_email) {
        await resend.emails.send({
          from: 'Storie da Raccontare <onboarding@resend.dev>',
          to: client_email,
          subject: `Conferma ordine - ${gallery?.name ?? 'Galleria'}`,
          html: buildClientConfirmHtml(emailPayload),
        })
      }
    } catch (emailErr) {
      console.error('[orders] Email error:', emailErr)
    }
  } else {
    console.log('[orders] RESEND_API_KEY non configurato. Ordine ricevuto:', emailPayload)
  }

  return NextResponse.json(order, { status: 201 })
}

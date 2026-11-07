import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const PHOTOGRAPHER_EMAIL = 'info@claudiospera.com'

interface CoverOrderPayload {
  gallery_id: string
  session_id: string
  client_name?: string | null
  client_email?: string | null
  size_label: string
  color_label: string
  decor_label?: string | null
  text_content?: string | null
  font_label?: string | null
  text_color?: string | null
  cover_image_url: string
  notes?: string | null
}

// ── email HTML al fotografo ───────────────────────────────────────────────────
function buildEmailHtml(order: CoverOrderPayload & { gallery_name: string }) {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08)">
    <div style="background:#2a3830;padding:28px 32px;text-align:center">
      <p style="margin:0;font-size:22px;font-weight:800;color:#8ec9b0;letter-spacing:-0.02em">Storie da Raccontare</p>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.55)">Nuova richiesta "Crea Copertina"</p>
    </div>
    <div style="padding:28px 32px">
      <div style="background:#f3f4f6;border-radius:8px;padding:14px 18px;margin-bottom:24px">
        <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Galleria</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#111827">${order.gallery_name}</p>
      </div>
      <div style="margin-bottom:24px">
        <p style="margin:0 0 10px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Cliente</p>
        <p style="margin:0;font-size:14px;color:#374151">
          <strong>${order.client_name || 'Non specificato'}</strong>
          ${order.client_email ? `<br><a href="mailto:${order.client_email}" style="color:#8ec9b0">${order.client_email}</a>` : ''}
        </p>
      </div>
      <p style="margin:0 0 10px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Anteprima copertina</p>
      <img src="${order.cover_image_url}" alt="Copertina" style="width:100%;max-width:320px;display:block;border-radius:10px;margin-bottom:20px;border:1px solid #e5e7eb"/>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#374151">
        <tr><td style="padding:6px 0;color:#6b7280">Misura</td><td style="padding:6px 0;text-align:right;font-weight:600">${order.size_label}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Colore</td><td style="padding:6px 0;text-align:right;font-weight:600">${order.color_label}</td></tr>
        ${order.decor_label ? `<tr><td style="padding:6px 0;color:#6b7280">Decoro</td><td style="padding:6px 0;text-align:right;font-weight:600">${order.decor_label}</td></tr>` : ''}
        ${order.text_content ? `<tr><td style="padding:6px 0;color:#6b7280">Testo</td><td style="padding:6px 0;text-align:right;font-weight:600">"${order.text_content}" (${order.font_label ?? ''})</td></tr>` : ''}
      </table>
      ${order.notes ? `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-top:20px">
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.08em">Note cliente</p>
        <p style="margin:0;font-size:13px;color:#374151;font-style:italic">${order.notes}</p>
      </div>` : ''}
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af">Richiesta inviata tramite il portale clienti Storie da Raccontare</p>
    </div>
  </div>
</body>
</html>`
}

// ── Telegram (stesso canale/credenziali usato per i nuovi ordini shop) ───────
async function sendTelegram(order: CoverOrderPayload & { gallery_name: string }) {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const text = [
    `🖼️ *Nuova richiesta Crea Copertina*`,
    ``,
    `📁 Galleria: ${order.gallery_name}`,
    `👤 ${order.client_name || 'Cliente non specificato'}`,
    order.client_email ? `📧 ${order.client_email}` : null,
    ``,
    `📐 Misura: ${order.size_label}`,
    `🎨 Colore: ${order.color_label}`,
    order.decor_label ? `✨ Decoro: ${order.decor_label}` : null,
    order.text_content ? `✏️ Testo: "${order.text_content}" (${order.font_label ?? ''})` : null,
  ].filter(Boolean).join('\n')

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: order.cover_image_url, caption: text, parse_mode: 'Markdown' }),
    })
  } catch (err) {
    console.error('[cover-orders] Telegram error:', err)
  }
}

// ── GET: storico richieste per session_id ────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const session_id = searchParams.get('session_id')
  const gallery_id = searchParams.get('gallery_id')

  if (!session_id || !gallery_id) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  }

  const data = await sql`
    SELECT id, gallery_id, session_id, client_name, client_email,
           size_label, color_label, decor_label, text_content, font_label, text_color,
           cover_image_url, status, notes, created_at
    FROM cover_orders
    WHERE session_id = ${session_id} AND gallery_id = ${gallery_id}
    ORDER BY created_at DESC
  `
  return NextResponse.json(data)
}

// ── POST: crea richiesta ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  const body = await req.json() as CoverOrderPayload
  const { gallery_id, session_id, client_name, client_email, size_label, color_label,
    decor_label, text_content, font_label, text_color, cover_image_url, notes } = body

  if (!gallery_id || !session_id || !size_label || !color_label || !cover_image_url) {
    return NextResponse.json({ error: 'Dati richiesta incompleti' }, { status: 400 })
  }

  const [gallery] = await sql`SELECT name FROM galleries WHERE id = ${gallery_id}`

  const [order] = await sql`
    INSERT INTO cover_orders (
      gallery_id, session_id, client_name, client_email,
      size_label, color_label, decor_label, text_content, font_label, text_color,
      cover_image_url, notes, status
    )
    VALUES (
      ${gallery_id}, ${session_id}, ${client_name ?? null}, ${client_email ?? null},
      ${size_label}, ${color_label}, ${decor_label ?? null}, ${text_content ?? null},
      ${font_label ?? null}, ${text_color ?? null},
      ${cover_image_url}, ${notes ?? null}, 'nuovo'
    )
    RETURNING *
  `
  if (!order) return NextResponse.json({ error: 'Errore creazione richiesta' }, { status: 500 })

  // Registra/aggiorna il cliente in gallery_clients (solo se ha fornito nome o email)
  if (client_name || client_email) {
    try {
      await sql`
        INSERT INTO gallery_clients (gallery_id, name, email, orders, last_access)
        VALUES (${gallery_id}, ${client_name ?? ''}, ${client_email ?? ''}, 1, now())
        ON CONFLICT (gallery_id, email)
        DO UPDATE SET
          name        = EXCLUDED.name,
          orders      = gallery_clients.orders + 1,
          last_access = now()
      `
    } catch (err) {
      console.error('[cover-orders] gallery_clients upsert failed:', err)
    }
  }

  const notifyPayload = { ...body, gallery_name: gallery?.name ?? 'Galleria' }

  await Promise.allSettled([
    sendTelegram(notifyPayload),
    (async () => {
      if (!process.env.RESEND_API_KEY) {
        console.log('[cover-orders] RESEND_API_KEY non configurato. Richiesta ricevuta:', body)
        return
      }
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Storie da Raccontare <onboarding@resend.dev>',
        to: PHOTOGRAPHER_EMAIL,
        subject: `Nuova richiesta Crea Copertina - ${gallery?.name ?? 'Galleria'}`,
        html: buildEmailHtml(notifyPayload),
      })
    })().catch(emailErr => console.error('[cover-orders] Email error:', emailErr)),
  ])

  return NextResponse.json(order, { status: 201 })
}

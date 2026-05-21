// app/api/composizioni/preventivo/route.ts
// Invia richiesta preventivo composizione via Resend

import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const FOTOGRAFO_EMAIL = 'info@claudiospera.com'
const resend = new Resend(process.env.RESEND_API_KEY)

interface PreventivoBody {
  nome: string
  email: string
  telefono?: string
  composizione: string
  materiale: string
  dimensioni: string
  pareteLabel: string
  note?: string
  gdpr: boolean
  photoBase64?: string   // data:image/jpeg;base64,...
  photoSizeMb?: number
}

function buildEmailFotografo(data: PreventivoBody): string {
  const photoSection = data.photoBase64
    ? `<div style="margin-top:20px">
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase">Foto caricata dal cliente</p>
        <img src="${data.photoBase64}" style="max-width:100%;max-height:300px;border-radius:8px;border:1px solid #e5e7eb" alt="Foto cliente" />
      </div>`
    : data.photoSizeMb && data.photoSizeMb > 5
      ? `<p style="color:#f59e0b;font-size:13px">⚠️ Il cliente ha caricato una foto (${data.photoSizeMb.toFixed(1)} MB) troppo grande per l'allegato email.</p>`
      : ''

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08)">

    <div style="background:#2a3830;padding:28px 32px;text-align:center">
      <p style="margin:0;font-size:20px;font-weight:800;color:#8ec9b0;letter-spacing:-0.02em">Storie da Raccontare</p>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.6)">Nuova richiesta preventivo composizione</p>
    </div>

    <div style="padding:28px 32px">

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;font-size:12px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Composizione richiesta</p>
        <p style="margin:6px 0 0;font-size:18px;font-weight:700;color:#14532d">${data.composizione}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#166534">${data.dimensioni} · ${data.pareteLabel}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#166534">Materiale preferito: <strong>${data.materiale}</strong></p>
      </div>

      <div style="margin-bottom:20px">
        <p style="margin:0 0 10px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.08em">Dati cliente</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:5px 0;font-size:13px;color:#6b7280;width:100px">Nome</td><td style="padding:5px 0;font-size:14px;font-weight:600;color:#111827">${data.nome}</td></tr>
          <tr><td style="padding:5px 0;font-size:13px;color:#6b7280">Email</td><td style="padding:5px 0;font-size:14px;color:#111827"><a href="mailto:${data.email}" style="color:#2a3830">${data.email}</a></td></tr>
          ${data.telefono ? `<tr><td style="padding:5px 0;font-size:13px;color:#6b7280">Telefono</td><td style="padding:5px 0;font-size:14px;color:#111827"><a href="tel:${data.telefono}" style="color:#2a3830">${data.telefono}</a></td></tr>` : ''}
        </table>
      </div>

      ${data.note ? `
      <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase">Note cliente</p>
        <p style="margin:0;font-size:14px;color:#374151">${data.note.replace(/\n/g, '<br>')}</p>
      </div>` : ''}

      ${photoSection}

    </div>

    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af">Richiesta ricevuta dal tool "Composizioni su Tela & Cornice" su storiedaraccontare.it</p>
    </div>
  </div>
</body>
</html>`
}

function buildEmailCliente(data: PreventivoBody): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08)">

    <div style="background:#2a3830;padding:28px 32px;text-align:center">
      <p style="margin:0;font-size:20px;font-weight:800;color:#8ec9b0">Storie da Raccontare</p>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.6)">Claudio Spera Fotografo</p>
    </div>

    <div style="padding:32px">
      <p style="font-size:16px;color:#111827;font-weight:600;margin:0 0 8px">Ciao ${data.nome}! 👋</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px">
        Ho ricevuto la tua richiesta per la composizione <strong>${data.composizione}</strong> e ti risponderò
        entro 24–48 ore con un preventivo personalizzato.
      </p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:24px">
        <p style="margin:0 0 10px;font-size:12px;color:#166534;font-weight:700;text-transform:uppercase">Riepilogo richiesta</p>
        <p style="margin:0 0 4px;font-size:14px;color:#14532d"><strong>Composizione:</strong> ${data.composizione}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#14532d"><strong>Dimensioni:</strong> ${data.dimensioni}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#14532d"><strong>Parete:</strong> ${data.pareteLabel}</p>
        <p style="margin:0;font-size:14px;color:#14532d"><strong>Materiale:</strong> ${data.materiale}</p>
      </div>

      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px">
        Se hai domande puoi rispondere direttamente a questa email o contattarmi:
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a href="mailto:info@claudiospera.com" style="display:inline-block;background:#2a3830;color:#8ec9b0;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700">
          ✉️ info@claudiospera.com
        </a>
        <a href="tel:+393897855581" style="display:inline-block;background:#f0fdf4;color:#166534;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;border:1px solid #bbf7d0">
          📞 +39 389 785 5581
        </a>
      </div>
    </div>

    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af">
        © ${new Date().getFullYear()} Claudio Spera Fotografo · P.IVA 02766080648<br>
        Via Pianopantano snc, 83036 Mirabella Eclano (AV)
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: Request) {
  try {
    const data: PreventivoBody = await req.json()

    if (!data.nome || !data.email || !data.composizione || !data.gdpr) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('[preventivo] RESEND_API_KEY non configurata — email non inviata')
      return NextResponse.json({ ok: true, warning: 'email non inviata (dev mode)' })
    }

    // Email al fotografo
    await resend.emails.send({
      from: 'Storie da Raccontare <noreply@storiedaraccontare.it>',
      to: [FOTOGRAFO_EMAIL],
      replyTo: data.email,
      subject: `Preventivo composizione — ${data.composizione} — ${data.nome}`,
      html: buildEmailFotografo(data),
    })

    // Auto-reply al cliente
    await resend.emails.send({
      from: 'Claudio Spera <noreply@storiedaraccontare.it>',
      to: [data.email],
      subject: 'Richiesta ricevuta — Composizione su Tela & Cornice',
      html: buildEmailCliente(data),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[preventivo] Errore invio email:', err)
    return NextResponse.json({ error: 'Errore invio email' }, { status: 500 })
  }
}

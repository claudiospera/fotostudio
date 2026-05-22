// app/api/contatti/route.ts
// Invia messaggio di contatto del sito pubblico via Resend

import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const FOTOGRAFO_EMAIL = 'info@claudiospera.com'
const resend = new Resend(process.env.RESEND_API_KEY)

interface ContattiBody {
  nome: string
  nomePartner?: string
  email: string
  telefono?: string
  dataEvento?: string
  location?: string
  tipoEvento: string[]
  durata?: string
  video?: string
  comeHaTrovato?: string
  instagram?: string
  messaggio?: string
  gdpr: boolean
}

function buildEmailFotografo(d: ContattiBody): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08)">

    <div style="background:#1a1612;padding:28px 32px;text-align:center">
      <p style="margin:0;font-size:20px;font-weight:400;color:#C9A96E;font-style:italic;font-family:Georgia,serif">Claudio Spera · Fotografo</p>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.55)">Nuova richiesta di contatto</p>
    </div>

    <div style="padding:28px 32px">

      <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 6px;font-size:12px;color:#9a8a7a;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Tipo di evento</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#1a1612">${d.tipoEvento.length ? d.tipoEvento.join(', ') : 'Non specificato'}</p>
        ${d.dataEvento ? `<p style="margin:6px 0 0;font-size:13px;color:#6b5a4a">📅 ${d.dataEvento}</p>` : ''}
        ${d.location ? `<p style="margin:4px 0 0;font-size:13px;color:#6b5a4a">📍 ${d.location}</p>` : ''}
        ${d.durata ? `<p style="margin:4px 0 0;font-size:13px;color:#6b5a4a">⏱ ${d.durata}</p>` : ''}
      </div>

      <div style="margin-bottom:20px">
        <p style="margin:0 0 10px;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.08em">Dati cliente</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:5px 0;font-size:13px;color:#9ca3af;width:130px">Nome</td><td style="padding:5px 0;font-size:14px;font-weight:600;color:#111827">${d.nome}</td></tr>
          ${d.nomePartner ? `<tr><td style="padding:5px 0;font-size:13px;color:#9ca3af">Partner</td><td style="padding:5px 0;font-size:14px;color:#111827">${d.nomePartner}</td></tr>` : ''}
          <tr><td style="padding:5px 0;font-size:13px;color:#9ca3af">Email</td><td style="padding:5px 0;font-size:14px;color:#111827"><a href="mailto:${d.email}" style="color:#1a1612">${d.email}</a></td></tr>
          ${d.telefono ? `<tr><td style="padding:5px 0;font-size:13px;color:#9ca3af">Telefono</td><td style="padding:5px 0;font-size:14px;color:#111827"><a href="tel:${d.telefono}" style="color:#1a1612">${d.telefono}</a></td></tr>` : ''}
          ${d.video ? `<tr><td style="padding:5px 0;font-size:13px;color:#9ca3af">Video</td><td style="padding:5px 0;font-size:14px;color:#111827">${d.video}</td></tr>` : ''}
          ${d.comeHaTrovato ? `<tr><td style="padding:5px 0;font-size:13px;color:#9ca3af">Come ha trovato</td><td style="padding:5px 0;font-size:14px;color:#111827">${d.comeHaTrovato}</td></tr>` : ''}
          ${d.instagram ? `<tr><td style="padding:5px 0;font-size:13px;color:#9ca3af">Instagram</td><td style="padding:5px 0;font-size:14px;color:#111827">${d.instagram}</td></tr>` : ''}
        </table>
      </div>

      ${d.messaggio ? `
      <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase">Messaggio</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7">${d.messaggio.replace(/\n/g, '<br>')}</p>
      </div>` : ''}

    </div>

    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af">Richiesta ricevuta dal sito storiedaraccontare.it</p>
    </div>
  </div>
</body>
</html>`
}

function buildEmailCliente(d: ContattiBody): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08)">

    <div style="background:#1a1612;padding:32px;text-align:center">
      <p style="margin:0;font-size:22px;font-weight:400;color:#C9A96E;font-style:italic;font-family:Georgia,serif">Claudio Spera · Fotografo</p>
      <p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,.5);letter-spacing:.12em;text-transform:uppercase">Mirabella Eclano · Campania</p>
    </div>

    <div style="padding:36px 32px">
      <p style="font-size:18px;color:#1a1612;font-weight:400;font-style:italic;font-family:Georgia,serif;margin:0 0 16px">Ciao ${d.nome},</p>
      <p style="font-size:15px;color:#4a3f35;line-height:1.75;margin:0 0 24px">
        Ho ricevuto il tuo messaggio e ti risponderò personalmente entro 24–48 ore.
        Non vedo l'ora di sentire la tua storia e capire come posso aiutarti a raccontarla.
      </p>

      <div style="border-top:1px solid #e8e0d0;border-bottom:1px solid #e8e0d0;padding:20px 0;margin:0 0 28px">
        <p style="margin:0 0 6px;font-size:11px;color:#9a8a7a;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Nel frattempo puoi trovarmi qui</p>
        <p style="margin:8px 0 4px;font-size:14px;color:#4a3f35">✉️ <a href="mailto:info@claudiospera.com" style="color:#1a1612">info@claudiospera.com</a></p>
        <p style="margin:4px 0;font-size:14px;color:#4a3f35">📞 <a href="tel:+393897855581" style="color:#1a1612">+39 389 785 5581</a></p>
      </div>

      <p style="font-size:14px;color:#9a8a7a;line-height:1.7;margin:0;font-style:italic">
        Le tue informazioni saranno trattate in modo riservato e utilizzate esclusivamente per rispondere alla tua richiesta.
      </p>
    </div>

    <div style="background:#1a1612;padding:20px 32px;text-align:center">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,.35);letter-spacing:.08em">
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
    const data: ContattiBody = await req.json()

    if (!data.nome || !data.email || !data.gdpr) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('[contatti] RESEND_API_KEY non configurata — email non inviata')
      return NextResponse.json({ ok: true, warning: 'email non inviata (dev mode)' })
    }

    const tipoLabel = data.tipoEvento.length ? data.tipoEvento.join(', ') : 'Contatto generico'

    await resend.emails.send({
      from: 'Storie da Raccontare <noreply@storiedaraccontare.it>',
      to: [FOTOGRAFO_EMAIL],
      replyTo: data.email,
      subject: `Nuovo contatto — ${tipoLabel} — ${data.nome}`,
      html: buildEmailFotografo(data),
    })

    await resend.emails.send({
      from: 'Claudio Spera <noreply@storiedaraccontare.it>',
      to: [data.email],
      subject: 'Ho ricevuto il tuo messaggio — Claudio Spera Fotografo',
      html: buildEmailCliente(data),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contatti] Errore invio email:', err)
    return NextResponse.json({ error: 'Errore invio email' }, { status: 500 })
  }
}

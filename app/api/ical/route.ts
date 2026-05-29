// app/api/ical/route.ts
// Feed iCalendar pubblico — accessibile tramite token segreto (no auth richiesta)
// iPhone/Mac Calendar lo sottoscrive e si aggiorna automaticamente.

import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function escapeIcal(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function toIcalDate(dateStr: string): string {
  // dateStr = "YYYY-MM-DD" → "YYYYMMDD"
  return dateStr.replace(/-/g, '')
}

const CAT_EMOJI: Record<string, string> = {
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse('Token mancante', { status: 400 })
  }

  // Trova l'utente tramite il token
  const profiles = await sql`
    SELECT id, name, studio_name FROM profiles WHERE ical_token = ${token}
  `
  if (!profiles.length) {
    return new NextResponse('Token non valido', { status: 404 })
  }

  const profile = profiles[0] as { id: string; name: string; studio_name: string }

  // Carica tutti i clienti con data_evento
  const clienti = await sql`
    SELECT id, nome1, categoria, data_evento, luogo_evento, note
    FROM clienti
    WHERE user_id = ${profile.id} AND data_evento IS NOT NULL
    ORDER BY data_evento ASC
  ` as {
    id: string
    nome1: string
    categoria: string
    data_evento: string
    luogo_evento: string | null
    note: string | null
  }[]

  const calName = escapeIcal(`${profile.studio_name ?? profile.name ?? 'Studio'} — Clienti`)
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const events = clienti.map(c => {
    const emoji = CAT_EMOJI[c.categoria] ?? '📅'
    const summary = escapeIcal(`${emoji} ${c.nome1} — ${c.categoria}`)
    const dateStr = c.data_evento.slice(0, 10)
    const icalDate = toIcalDate(dateStr)
    // Giorno intero → DTSTART;VALUE=DATE + DTEND giorno dopo
    const dtstart = `DTSTART;VALUE=DATE:${icalDate}`
    // DTEND = giorno successivo per eventi all-day
    const nextDay = new Date(dateStr + 'T00:00:00')
    nextDay.setDate(nextDay.getDate() + 1)
    const dtend = `DTEND;VALUE=DATE:${toIcalDate(nextDay.toISOString().slice(0, 10))}`

    const uid = `cliente-${c.id}@storiedaraccontare.it`
    const location = c.luogo_evento ? `LOCATION:${escapeIcal(c.luogo_evento)}\r\n` : ''
    const description = c.note ? `DESCRIPTION:${escapeIcal(c.note)}\r\n` : ''

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      dtstart,
      dtend,
      `SUMMARY:${summary}`,
      location.trim(),
      description.trim(),
      'END:VEVENT',
    ].filter(Boolean).join('\r\n')
  })

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Storie da Raccontare//CRM//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Europe/Rome',
    'X-APPLE-CALENDAR-COLOR:#7a4a6e',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="clienti.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

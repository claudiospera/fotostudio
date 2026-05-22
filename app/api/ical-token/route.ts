// app/api/ical-token/route.ts
// GET → restituisce il token corrente; POST → rigenera il token

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  await sql`INSERT INTO profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`

  // Se non ha ancora un token, ne genera uno
  const existing = await sql`SELECT ical_token FROM profiles WHERE id = ${userId}`
  let token = (existing[0] as { ical_token: string | null })?.ical_token

  if (!token) {
    token = randomBytes(24).toString('hex')
    await sql`UPDATE profiles SET ical_token = ${token} WHERE id = ${userId}`
  }

  return NextResponse.json({ token })
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const token = randomBytes(24).toString('hex')
  await sql`UPDATE profiles SET ical_token = ${token} WHERE id = ${userId}`

  return NextResponse.json({ token })
}

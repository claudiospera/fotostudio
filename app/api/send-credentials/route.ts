import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { email, galleryId, password } = await request.json()
  if (!email || !galleryId) {
    return NextResponse.json({ error: 'Email e galleryId sono obbligatori' }, { status: 400 })
  }

  // TODO: Inviare email con Resend
  return NextResponse.json(
    { message: `Credenziali inviate a ${email} per la galleria ${galleryId}` },
    { status: 200 }
  )
}

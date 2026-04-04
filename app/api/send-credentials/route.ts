import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { email, galleryId, password } = await request.json()

  if (!email || !galleryId) {
    return NextResponse.json({ error: 'Email e galleryId sono obbligatori' }, { status: 400 })
  }

  // TODO: Inviare email con Resend
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({ ... })

  return NextResponse.json(
    { message: `Credenziali inviate a ${email} per la galleria ${galleryId}` },
    { status: 200 }
  )
}

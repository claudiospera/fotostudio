import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data, error } = await supabase
    .from('prenotazioni_appuntamenti')
    .select('*, calendario:calendari_appuntamenti(id, nome, colore)')
    .eq('user_id', user.id)
    .order('data', { ascending: true })
    .order('ora_inizio', { ascending: true })

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('prenotazioni_appuntamenti')
    .insert({ ...body, user_id: user.id, stato: body.stato ?? 'confermata' })
    .select('*, calendario:calendari_appuntamenti(id, nome, colore)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

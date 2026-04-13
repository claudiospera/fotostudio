import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data, error } = await supabase
    .from('calendari_appuntamenti')
    .select('*, prenotazioni:prenotazioni_appuntamenti(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json([], { status: 200 })

  const result = (data ?? []).map((c: Record<string, unknown>) => ({
    ...c,
    prenotazioni_count: Array.isArray(c.prenotazioni) ? (c.prenotazioni[0] as { count?: number })?.count ?? 0 : 0,
  }))

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('calendari_appuntamenti')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

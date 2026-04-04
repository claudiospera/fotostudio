import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: gallery } = await auth.from('galleries').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!gallery) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('print_orders')
    .select('*')
    .eq('gallery_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { order_id, status } = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('print_orders')
    .update({ status })
    .eq('id', order_id)
    .eq('gallery_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: gallery } = await auth.from('galleries').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!gallery) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  const { order_id } = await req.json()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('print_orders')
    .delete()
    .eq('id', order_id)
    .eq('gallery_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

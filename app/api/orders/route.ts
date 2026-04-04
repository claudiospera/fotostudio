import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/orders — tutti gli ordini del fotografo autenticato
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Recupera gli ID delle gallerie del fotografo
  const { data: galleries } = await supabase
    .from('galleries')
    .select('id, name')
    .eq('user_id', user.id)

  if (!galleries?.length) return NextResponse.json([])

  const galleryMap = Object.fromEntries(galleries.map(g => [g.id, g]))
  const galleryIds = galleries.map(g => g.id)

  const { data, error } = await supabase
    .from('print_orders')
    .select('*')
    .in('gallery_id', galleryIds)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Arricchisce ogni ordine con i dati della galleria
  const enriched = (data ?? []).map(order => ({
    ...order,
    galleries: galleryMap[order.gallery_id] ?? null,
  }))

  return NextResponse.json(enriched)
}

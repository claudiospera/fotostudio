import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/public/favorites?gallery_id=&session_id=
// Ritorna tutti i photo_id preferiti da questa sessione per la galleria
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const gallery_id = searchParams.get('gallery_id')
  const session_id = searchParams.get('session_id')

  if (!gallery_id || !session_id) {
    return NextResponse.json({ error: 'gallery_id e session_id obbligatori' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('photo_favorites')
    .select('photo_id')
    .eq('gallery_id', gallery_id)
    .eq('session_id', session_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data ?? []).map(r => r.photo_id))
}

// POST /api/public/favorites
// Toggle: se il preferito esiste lo rimuove, altrimenti lo aggiunge
export async function POST(req: Request) {
  const { photo_id, gallery_id, session_id } = await req.json()

  if (!photo_id || !gallery_id || !session_id) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Controlla se esiste già
  const { data: existing } = await supabase
    .from('photo_favorites')
    .select('id')
    .eq('photo_id', photo_id)
    .eq('session_id', session_id)
    .single()

  if (existing) {
    await supabase.from('photo_favorites').delete().eq('id', existing.id)
    return NextResponse.json({ favorited: false })
  }

  await supabase.from('photo_favorites').insert({ photo_id, gallery_id, session_id })
  return NextResponse.json({ favorited: true })
}

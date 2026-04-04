import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/public/comments?gallery_id=
// Ritorna i conteggi dei commenti per ogni foto della galleria
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const gallery_id = searchParams.get('gallery_id')

  if (!gallery_id) {
    return NextResponse.json({ error: 'gallery_id obbligatorio' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('photo_comments')
    .select('photo_id')
    .eq('gallery_id', gallery_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Conta commenti per photo_id
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.photo_id] = (counts[row.photo_id] ?? 0) + 1
  }

  return NextResponse.json(counts)
}

// POST /api/public/comments
export async function POST(req: Request) {
  const { photo_id, gallery_id, session_id, author_name, body } = await req.json()

  if (!photo_id || !gallery_id || !session_id || !body?.trim()) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('photo_comments')
    .insert({
      photo_id,
      gallery_id,
      session_id,
      author_name: author_name?.trim() || 'Anonimo',
      body: body.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

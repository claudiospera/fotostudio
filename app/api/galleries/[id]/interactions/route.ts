import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/galleries/[id]/interactions
// Solo il fotografo autenticato può vedere preferiti e commenti della propria galleria
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Verifica che l'utente sia il fotografo proprietario
  const authSupabase = await createServerClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: gallery } = await authSupabase
    .from('galleries').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!gallery) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  // Usa il service client per leggere senza limitazioni RLS
  const supabase = createServiceClient()

  const [favRes, comRes] = await Promise.all([
    supabase
      .from('photo_favorites')
      .select('photo_id')
      .eq('gallery_id', id),
    supabase
      .from('photo_comments')
      .select('id, photo_id, author_name, body, created_at, photos(url, filename)')
      .eq('gallery_id', id)
      .order('created_at', { ascending: false }),
  ])

  // Conta preferiti per photo_id
  const favCount: Record<string, number> = {}
  for (const f of favRes.data ?? []) {
    favCount[f.photo_id] = (favCount[f.photo_id] ?? 0) + 1
  }

  return NextResponse.json({
    favorites: favCount,          // { [photo_id]: count }
    comments: comRes.data ?? [],
    total_favorites: (favRes.data ?? []).length,
    total_comments: (comRes.data ?? []).length,
  })
}

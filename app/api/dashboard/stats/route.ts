import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const [galleriesRes, preventiviRes, uploadsRes, photosRes] = await Promise.all([
    supabase.from('galleries').select('id', { count: 'exact' }).eq('user_id', user.id).eq('status', 'active'),
    supabase.from('preventivi').select('id', { count: 'exact' }).eq('user_id', user.id).in('stato', ['bozza', 'inviato']),
    supabase.from('upload_links').select('uploads').eq('user_id', user.id).eq('active', true),
    supabase.from('photos').select('id', { count: 'exact' }).in(
      'gallery_id',
      (await supabase.from('galleries').select('id').eq('user_id', user.id)).data?.map(g => g.id) ?? []
    ),
  ])

  const uploadTotal = (uploadsRes.data ?? []).reduce((sum, r) => sum + (r.uploads ?? 0), 0)

  return NextResponse.json({
    gallerieAttive: galleriesRes.count ?? 0,
    preventiviAperti: preventiviRes.count ?? 0,
    uploadRicevuti: uploadTotal,
    fotoTotali: photosRes.count ?? 0,
  })
}

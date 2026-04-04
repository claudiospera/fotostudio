import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Recupera tutte le foto dell'utente con size_bytes e gallery info
  const { data: photos, error } = await supabase
    .from('photos')
    .select('size_bytes, gallery_id, galleries!inner(id, name, status, user_id)')
    .eq('galleries.user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const bytesByGallery: Record<string, { bytes: number; name: string; status: string }> = {}
  let totalBytes = 0

  for (const photo of photos ?? []) {
    const size = photo.size_bytes ?? 0
    const gId = photo.gallery_id
    const gallery = Array.isArray(photo.galleries) ? photo.galleries[0] : photo.galleries
    if (!bytesByGallery[gId]) {
      bytesByGallery[gId] = { bytes: 0, name: (gallery as { name: string }).name ?? 'Senza nome', status: (gallery as { status: string }).status ?? '' }
    }
    bytesByGallery[gId].bytes += size
    totalBytes += size
  }

  const galleriesList = Object.entries(bytesByGallery)
    .map(([id, { bytes, name, status }]) => ({ id, name, status, bytes }))
    .sort((a, b) => b.bytes - a.bytes)

  return NextResponse.json({
    totalBytes,
    limitBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    galleries: galleriesList,
  })
}

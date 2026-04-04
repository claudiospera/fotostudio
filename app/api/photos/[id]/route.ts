import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Recupera la foto e verifica che appartenga a una galleria del fotografo
  const { data: photo } = await supabase
    .from('photos')
    .select('id, storage_path, gallery_id, galleries(user_id)')
    .eq('id', id)
    .single()

  if (!photo) return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 })

  const gallery = (Array.isArray(photo.galleries) ? photo.galleries[0] : photo.galleries) as { user_id: string } | null
  if (gallery?.user_id !== user.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  // Elimina da Supabase Storage
  try {
    await supabase.storage.from('photos').remove([photo.storage_path])
  } catch { /* se storage fallisce prosegui comunque */ }

  // Elimina dal DB
  const { error } = await supabase.from('photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

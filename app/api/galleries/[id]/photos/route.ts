import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Verifica che la galleria appartenga all'utente
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!gallery) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  // Recupera tutti i path delle foto da eliminare
  const { data: photosList, error: fetchError } = await supabase
    .from('photos')
    .select('id, storage_path')
    .eq('gallery_id', id)
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!photosList || photosList.length === 0) return NextResponse.json({ deleted: 0 })

  // Elimina da Supabase Storage
  const storagePaths = photosList.map(p => p.storage_path)
  try {
    await supabase.storage.from('photos').remove(storagePaths)
  } catch { /* se lo storage fallisce, prosegui comunque */ }

  // Elimina dal DB (CASCADE rimuove anche favorites e comments)
  const { error: deleteError } = await supabase
    .from('photos')
    .delete()
    .eq('gallery_id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ deleted: photosList.length })
}

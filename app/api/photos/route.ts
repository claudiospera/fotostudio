import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { gallery_id, url, storage_path, filename, size_bytes, folder } = await request.json()
  if (!gallery_id || !url || !storage_path) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('photos')
    .insert({ gallery_id, url, storage_path, filename, size_bytes: size_bytes ?? null, folder: folder ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl } from '@/lib/r2'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { filename, contentType, galleryId, folder } = await request.json()
  if (!filename || !contentType || !galleryId) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  }

  const ext = filename.split('.').pop()
  const folderPath = folder ? `${folder}/` : ''
  const key = `${user.id}/${galleryId}/${folderPath}${Date.now()}.${ext}`

  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key)
  return NextResponse.json({ uploadUrl, publicUrl, key })
}

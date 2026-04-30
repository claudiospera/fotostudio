import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPresignedUploadUrl, ensureCors } from '@/lib/r2'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { filename, contentType, galleryId, folder } = await request.json()
  if (!filename || !contentType || !galleryId) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  }

  // Tenta di applicare CORS — non blocca l'upload se fallisce
  const cors = await ensureCors()
  if (!cors.ok) console.warn('[presign] CORS non applicata:', cors.error)

  const ext = filename.split('.').pop()
  const folderPath = folder ? `${folder}/` : ''
  const key = `${userId}/${galleryId}/${folderPath}${Date.now()}.${ext}`

  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key)
  return NextResponse.json({ uploadUrl, publicUrl, key })
}

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

  // Garantisce che il bucket R2 abbia la CORS policy corretta
  await ensureCors()

  const ext = filename.split('.').pop()
  const folderPath = folder ? `${folder}/` : ''
  const key = `${userId}/${galleryId}/${folderPath}${Date.now()}.${ext}`

  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key)
  return NextResponse.json({ uploadUrl, publicUrl, key })
}

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data, error } = await supabase
    .from('galleries')
    .select('*, photos(*), clients:gallery_clients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .order('filename', { referencedTable: 'photos', ascending: true })
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Verifica proprietà
  const { data: gallery } = await supabase.from('galleries').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!gallery) return NextResponse.json({ error: 'Galleria non trovata' }, { status: 404 })

  // Elimina tutti gli oggetti R2 della galleria
  try {
    const listed = await r2.send(new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Prefix: `${user.id}/${id}/`,
    }))
    const keys = (listed.Contents ?? []).map(o => ({ Key: o.Key! }))
    if (keys.length > 0) {
      await r2.send(new DeleteObjectsCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Delete: { Objects: keys },
      }))
    }
  } catch { /* se R2 fallisce, prosegui comunque */ }

  // Elimina dal DB (CASCADE elimina photos, favorites, comments)
  const { error } = await supabase.from('galleries').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('galleries')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

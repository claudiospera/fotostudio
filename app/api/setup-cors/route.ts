import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ensureCors } from '@/lib/r2'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const result = await ensureCors()
  return NextResponse.json({
    ...result,
    app_url: process.env.NEXT_PUBLIC_APP_URL,
    bucket: process.env.CLOUDFLARE_R2_BUCKET,
  })
}

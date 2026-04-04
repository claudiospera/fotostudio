import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Route pubblica: nessun auth check, usa service role.
// Espone solo gallerie con status 'active'.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('galleries')
    .select(`
      id, name, subtitle, type, date, status, cover_color, cover_url, settings,
      photos ( id, url, filename, size_bytes, order_index ),
      profiles ( name, studio_name )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Galleria non trovata o non disponibile' }, { status: 404 })
  }

  // Ordina le foto
  if (data.photos) {
    (data.photos as { order_index: number }[]).sort((a, b) => a.order_index - b.order_index)
  }

  return NextResponse.json(data)
}

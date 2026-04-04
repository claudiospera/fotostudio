import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Gallery } from '@/lib/types'

export const useGalleries = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error: err } = await supabase
      .from('galleries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (err) setError(`Errore caricamento gallerie: ${err.message}`)
    else setGalleries(data as Gallery[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetch() }, [fetch])

  const deleteGallery = async (id: string) => {
    const { error: err } = await supabase.from('galleries').delete().eq('id', id)
    if (err) throw new Error(`Errore eliminazione galleria: ${err.message}`)
    setGalleries((prev) => prev.filter((g) => g.id !== id))
  }

  return { galleries, loading, error, refetch: fetch, deleteGallery }
}

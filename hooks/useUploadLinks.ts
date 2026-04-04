import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UploadLink } from '@/lib/types'

export const useUploadLinks = () => {
  const [links, setLinks] = useState<UploadLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error: err } = await supabase
      .from('upload_links')
      .select('*, gallery:galleries(id, name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (err) setError(`Errore caricamento link upload: ${err.message}`)
    else setLinks(data as UploadLink[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetch() }, [fetch])

  const deleteLink = async (id: string) => {
    const { error: err } = await supabase.from('upload_links').delete().eq('id', id)
    if (err) throw new Error(`Errore eliminazione link: ${err.message}`)
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  return { links, loading, error, refetch: fetch, deleteLink }
}

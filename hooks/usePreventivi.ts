import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Preventivo } from '@/lib/types'

export const usePreventivi = () => {
  const [preventivi, setPreventivi] = useState<Preventivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error: err } = await supabase
      .from('preventivi')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (err) setError(`Errore caricamento preventivi: ${err.message}`)
    else setPreventivi(data as Preventivo[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetch() }, [fetch])

  const deletePreventivo = async (id: string) => {
    const { error: err } = await supabase.from('preventivi').delete().eq('id', id)
    if (err) throw new Error(`Errore eliminazione preventivo: ${err.message}`)
    setPreventivi((prev) => prev.filter((p) => p.id !== id))
  }

  return { preventivi, loading, error, refetch: fetch, deletePreventivo }
}

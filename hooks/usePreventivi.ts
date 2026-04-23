import { useState, useEffect, useCallback } from 'react'
import type { Preventivo } from '@/lib/types'

export const usePreventivi = () => {
  const [preventivi, setPreventivi] = useState<Preventivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.fetch('/api/preventivi')
      if (!res.ok) throw new Error('Errore caricamento preventivi')
      const data = await res.json()
      setPreventivi(data as Preventivo[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const deletePreventivo = async (id: string) => {
    const res = await window.fetch(`/api/preventivi/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Errore eliminazione preventivo')
    setPreventivi((prev) => prev.filter((p) => p.id !== id))
  }

  return { preventivi, loading, error, refetch: fetch, deletePreventivo }
}

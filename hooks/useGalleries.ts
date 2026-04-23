import { useState, useEffect, useCallback } from 'react'
import type { Gallery } from '@/lib/types'

export const useGalleries = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.fetch('/api/galleries')
      if (!res.ok) throw new Error('Errore caricamento gallerie')
      const data = await res.json()
      setGalleries(data as Gallery[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const deleteGallery = async (id: string) => {
    const res = await window.fetch(`/api/galleries/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Errore eliminazione galleria')
    setGalleries((prev) => prev.filter((g) => g.id !== id))
  }

  return { galleries, loading, error, refetch: fetch, deleteGallery }
}

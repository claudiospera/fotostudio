import { useState, useEffect, useCallback } from 'react'
import type { UploadLink } from '@/lib/types'

export const useUploadLinks = () => {
  const [links, setLinks] = useState<UploadLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.fetch('/api/upload-links')
      if (!res.ok) throw new Error('Errore caricamento link upload')
      const data = await res.json()
      setLinks(data as UploadLink[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const deleteLink = async (id: string) => {
    const res = await window.fetch(`/api/upload-links/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Errore eliminazione link')
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  return { links, loading, error, refetch: fetch, deleteLink }
}

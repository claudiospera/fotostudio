'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Gallery, Photo, GalleryStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

// ─── helpers ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<GalleryStatus, string> = {
  active:   'Attiva',
  draft:    'Bozza',
  archived: 'Archiviata',
}

const STATUS_COLORS: Record<GalleryStatus, React.CSSProperties> = {
  active:   { background: 'rgba(142,201,176,.18)', color: 'var(--ac)',  border: '1px solid rgba(142,201,176,.28)' },
  draft:    { background: 'rgba(255,255,255,.07)', color: 'var(--t2)',  border: '1px solid var(--b1)' },
  archived: { background: 'rgba(217,112,112,.15)', color: 'var(--red)', border: '1px solid rgba(217,112,112,.25)' },
}

function formatDate(d?: string) {
  if (!d) return null
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatBytes(b?: number) {
  if (!b) return ''
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

// Comprime client-side via Canvas. HEIC/HEIF non supportati da Canvas → restituisce file originale.
async function compressImage(file: File, maxSide = 1920, quality = 0.7): Promise<File> {
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
    /\.hei[cf]$/i.test(file.name)
  if (isHeic) return file
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        if (!blob) return resolve(file)
        const name = file.name.replace(/\.[^.]+$/, '.jpg')
        resolve(new File([blob], name, { type: 'image/jpeg' }))
      }, 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

// ─── sub-components ────────────────────────────────────────────────────────

const TABS = [
  { id: 'photos',   label: 'Foto',
    icon: <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
  { id: 'sharing',  label: 'Condivisioni',
    icon: <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'orders',   label: 'Ordini stampa',
    icon: <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
  { id: 'settings', label: 'Impostazioni',
    icon: <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

const ORDER_STATUS: Record<string, { label: string; style: React.CSSProperties }> = {
  nuovo:      { label: 'Nuovo',      style: { background: 'rgba(142,201,176,.18)', color: 'var(--ac)',    border: '1px solid rgba(142,201,176,.28)' } },
  confermato: { label: 'Confermato', style: { background: 'rgba(201,160,90,.18)',  color: 'var(--amber)', border: '1px solid rgba(201,160,90,.28)' } },
  spedito:    { label: 'Spedito',    style: { background: 'rgba(100,160,220,.18)', color: '#7ab0dc',      border: '1px solid rgba(100,160,220,.28)' } },
  completato: { label: 'Completato', style: { background: 'rgba(255,255,255,.07)', color: 'var(--t2)',    border: '1px solid var(--b1)' } },
}

// ─── main component ────────────────────────────────────────────────────────

export default function GalleryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos]   = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('photos')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved]   = useState(false)

  // upload state
  const [uploads, setUploads]     = useState<Map<string, number>>(new Map())
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver]   = useState(false)
  const [uploadQuality, setUploadQuality] = useState<'alta' | 'bassa'>('alta')
  const [togglingStatus, setTogglingStatus] = useState(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  // folder state
  const [activeFolder, setActiveFolder]   = useState<string | null>(null) // null = "Tutte"
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [uploadFolder, setUploadFolder]   = useState<string | null>(null) // cartella target upload

  // sharing state
  const [copied, setCopied]       = useState(false)

  // interactions (preferiti + commenti)
  interface CommentWithPhoto {
    id: string
    photo_id: string
    author_name: string
    body: string
    created_at: string
    photos: { url: string; filename: string } | null
  }
  const [favCounts, setFavCounts]     = useState<Record<string, number>>({})
  const [comments, setComments]       = useState<CommentWithPhoto[]>([])
  const [totalFav, setTotalFav]       = useState(0)
  const [loadingInt, setLoadingInt]   = useState(false)
  const [selectedFavs, setSelectedFavs] = useState<Set<string>>(new Set())
  const [downloading, setDownloading]   = useState(false)

  // orders
  interface PrintOrderItem { photo_id: string; photo_url: string; filename: string; type: string; format_label: string; qty: number; unit_price: number; total: number }
  interface PrintOrder { id: string; client_name: string | null; client_email: string | null; items: PrintOrderItem[]; total: number; status: string; notes: string | null; created_at: string }
  const [orders, setOrders]           = useState<PrintOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  // delete gallery
  const [confirmDeleteGallery, setConfirmDeleteGallery] = useState(false)
  const [deletingGallery, setDeletingGallery]           = useState(false)

  // delete single photo
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<string | null>(null)
  const [deletingPhoto, setDeletingPhoto]           = useState<string | null>(null)

  // cover photo
  const [settingCover, setSettingCover] = useState<string | null>(null)
  const [coverSaved, setCoverSaved]     = useState(false)

  // clear all photos
  const [confirmClearPhotos, setConfirmClearPhotos] = useState(false)
  const [clearingPhotos, setClearingPhotos]         = useState(false)
  const [clearPhotosSuccess, setClearPhotosSuccess] = useState(false)
  const [clearPhotosError, setClearPhotosError]     = useState<string | null>(null)

  // ── fetch gallery ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/galleries/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push('/gallerie'); return }
        setGallery(data)
        setPhotos((data.photos ?? []).sort((a: Photo, b: Photo) => (a.filename ?? '').localeCompare(b.filename ?? '', 'it', { numeric: true, sensitivity: 'base' })))
      })
      .finally(() => setLoading(false))
  }, [id, router])

  // ── upload logic ───────────────────────────────────────────────────────
  const uploadFiles = useCallback(async (files: FileList | File[], targetFolder?: string | null) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/') || f.type === '' || f.name.match(/\.(jpe?g|png|heic|heif|webp|gif|tiff?)$/i))
    if (!list.length) return

    const folder = targetFolder !== undefined ? targetFolder : uploadFolder

    for (const file of list) {
      const key = `${file.name}-${file.size}`
      setUploads(m => new Map(m).set(key, 0))

      try {
        // 1. Comprimi se qualità bassa
        const fileToUpload = uploadQuality === 'bassa' ? await compressImage(file) : file

        // 2. Carica su Supabase Storage (supporta iOS Safari nativamente)
        const supabase = createClient()
        const ext = fileToUpload.name.split('.').pop() ?? 'jpg'
        const storagePath = `${id}/${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data: uploaded, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(storagePath, fileToUpload, { upsert: false, contentType: fileToUpload.type || 'image/jpeg' })
        if (uploadError) throw new Error(`Upload fallito: ${uploadError.message}`)
        setUploads(m => new Map(m).set(key, 100))

        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(uploaded.path)

        // 2. Salva i metadati nel DB
        const saveRes = await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gallery_id: id, url: publicUrl, storage_path: uploaded.path, filename: file.name, size_bytes: fileToUpload.size, folder }),
        })
        if (!saveRes.ok) {
          const e = await saveRes.json().catch(() => ({}))
          throw new Error(`Salvataggio DB fallito: ${e.error ?? saveRes.status}`)
        }
        const photo: Photo = await saveRes.json()
        setPhotos(prev => [...prev, photo].sort((a, b) => (a.filename ?? '').localeCompare(b.filename ?? '', 'it', { numeric: true, sensitivity: 'base' })))
      } catch (err) {
        setUploadError(`Errore "${file.name}": ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setUploads(m => { const n = new Map(m); n.delete(key); return n })
      }
    }
  }, [id, uploadFolder, uploadQuality])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    uploadFiles(e.dataTransfer.files)
  }, [uploadFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files)
    e.target.value = ''
  }, [uploadFiles])

  // ── load interactions (al mount + quando si apre sharing) ────────────
  useEffect(() => {
    setLoadingInt(true)
    fetch(`/api/galleries/${id}/interactions`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setFavCounts(data.favorites ?? {})
          setComments(data.comments ?? [])
          setTotalFav(data.total_favorites ?? 0)
        }
      })
      .finally(() => setLoadingInt(false))
  }, [id])

  // ── load orders (al mount + quando si apre orders) ────────────────────
  useEffect(() => {
    if (tab !== 'orders') return
    setLoadingOrders(true)
    fetch(`/api/galleries/${id}/orders`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data) })
      .finally(() => setLoadingOrders(false))
  }, [tab, id])

  // carica ordini in background per le statistiche (solo la prima volta)
  useEffect(() => {
    fetch(`/api/galleries/${id}/orders`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data) })
      .catch(() => {})
  }, [id])

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId)
    const res = await fetch(`/api/galleries/${id}/orders`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId, status }) })
    if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    setUpdatingOrderId(null)
  }, [id])

  // ── toggle status ─────────────────────────────────────────────────────
  const toggleStatus = useCallback(async () => {
    if (!gallery) return
    const newStatus = gallery.status === 'active' ? 'draft' : 'active'
    setTogglingStatus(true)
    const res = await fetch(`/api/galleries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setGallery(updated)
    }
    setTogglingStatus(false)
  }, [gallery, id])

  // ── delete gallery ─────────────────────────────────────────────────────
  const deleteGallery = useCallback(async () => {
    setDeletingGallery(true)
    const res = await fetch(`/api/galleries/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/gallerie')
    else setDeletingGallery(false)
  }, [id, router])

  // ── delete single photo ────────────────────────────────────────────────
  const deletePhoto = useCallback(async (photoId: string) => {
    setDeletingPhoto(photoId)
    setConfirmDeletePhoto(null)
    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
    if (res.ok) setPhotos(prev => prev.filter(p => p.id !== photoId))
    setDeletingPhoto(null)
  }, [])

  // ── clear all photos ──────────────────────────────────────────────────
  const clearAllPhotos = useCallback(async () => {
    setClearingPhotos(true)
    setConfirmClearPhotos(false)
    const res = await fetch(`/api/galleries/${id}/photos`, { method: 'DELETE' })
    if (res.ok) {
      setPhotos([])
      setClearPhotosSuccess(true)
      setTimeout(() => setClearPhotosSuccess(false), 3000)
    } else {
      const e = await res.json().catch(() => ({}))
      setClearPhotosError(e.error ?? 'Errore durante l\'eliminazione')
      setTimeout(() => setClearPhotosError(null), 4000)
    }
    setClearingPhotos(false)
  }, [id])

  // ── set cover photo ────────────────────────────────────────────────────
  const setCoverPhoto = useCallback(async (photoUrl: string | null, photoId: string) => {
    setSettingCover(photoId)
    const res = await fetch(`/api/galleries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_url: photoUrl || null }),
    })
    const json = await res.json()
    if (res.ok) {
      setGallery(prev => prev ? { ...prev, cover_url: json.cover_url } : prev)
      setCoverSaved(true)
      setTimeout(() => setCoverSaved(false), 2500)
    } else {
      console.error('[setCoverPhoto] errore:', json)
      alert('Errore nel salvataggio della cover: ' + (json.error ?? 'sconosciuto'))
    }
    setSettingCover(null)
  }, [id])

  // ── gallery settings (watermark, ecc.) ───────────────────────────────
  const toggleSetting = useCallback(async (key: string, value: boolean) => {
    if (!gallery) return
    const newSettings = { ...(gallery.settings ?? {}), [key]: value }
    setGallery(prev => prev ? { ...prev, settings: newSettings as typeof prev.settings } : prev)
    setSavingSettings(true)
    await fetch(`/api/galleries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: newSettings }),
    })
    setSavingSettings(false)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }, [gallery, id])

  // ── copy link ──────────────────────────────────────────────────────────
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/cliente/${id}`
    : `/cliente/${id}`

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shareUrl])

  // ── render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--t3)', fontSize: '13px' }}>Caricamento…</p>
      </div>
    )
  }

  if (!gallery) return null

  const status = gallery.status as GalleryStatus

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start gap-[14px] pb-5 mb-0 border-b border-[var(--b1)]">
          {/* Back button */}
          <button
            onClick={() => router.push('/gallerie')}
            style={{
              width: 34, height: 34, flexShrink: 0, marginTop: 3,
              background: 'var(--s1)', border: '1px solid var(--b1)',
              borderRadius: 'var(--r2)', display: 'grid', placeItems: 'center',
              cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--b2)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--s2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--b1)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--s1)' }}
          >
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--t2)" strokeWidth={2} strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800,
              marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {gallery.name}
              </span>
              <span style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '.08em',
                textTransform: 'uppercase', padding: '3px 8px', borderRadius: '12px',
                flexShrink: 0, ...STATUS_COLORS[status],
              }}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--t3)' }}>
              {gallery.type && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {gallery.type}
                </span>
              )}
              {gallery.date && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {formatDate(gallery.date)}
                </span>
              )}
              {gallery.subtitle && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {gallery.subtitle}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {photos.length} foto
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto md:flex-shrink-0">
          <button
            onClick={toggleStatus}
            disabled={togglingStatus}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: gallery.status === 'active' ? 'rgba(217,112,112,.15)' : 'rgba(142,201,176,.15)',
              color: gallery.status === 'active' ? 'var(--red)' : 'var(--ac)',
              border: `1px solid ${gallery.status === 'active' ? 'rgba(217,112,112,.3)' : 'rgba(142,201,176,.3)'}`,
              borderRadius: 'var(--r2)', padding: '0 14px', height: 34,
              fontSize: '12px', fontWeight: 500, cursor: togglingStatus ? 'not-allowed' : 'pointer',
              opacity: togglingStatus ? .6 : 1, transition: 'all .15s', flexShrink: 0,
            }}
          >
            {togglingStatus ? (
              <div style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            ) : gallery.status === 'active' ? (
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            {gallery.status === 'active' ? 'Disattiva' : 'Attiva galleria'}
          </button>

          {/* CTA anteprima portale */}
          <a
            href={`/cliente/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            title={gallery.status !== 'active' ? 'Attiva la galleria per renderla visibile ai clienti' : 'Apri anteprima portale cliente'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--s2)', color: gallery.status === 'active' ? 'var(--t2)' : 'var(--t3)',
              border: '1px solid var(--b1)', borderRadius: 'var(--r2)',
              padding: '0 14px', height: 34, fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', flexShrink: 0, textDecoration: 'none',
              transition: 'all .15s', position: 'relative',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--b2)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--tx)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--b1)'; (e.currentTarget as HTMLAnchorElement).style.color = gallery.status === 'active' ? 'var(--t2)' : 'var(--t3)' }}
          >
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Anteprima
            {gallery.status !== 'active' && (
              <span style={{ fontSize: '9px', background: 'var(--amber)', color: '#111', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>BOZZA</span>
            )}
          </a>

          {/* CTA upload */}
          <button
            onClick={() => { setTab('photos'); fileInputRef.current?.click() }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--ac)', color: '#111210',
              border: 'none', borderRadius: 'var(--r2)',
              padding: '0 14px', height: 34, fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', flexShrink: 0,
              transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--ac2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--ac)')}
          >
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Aggiungi foto
          </button>

          {/* CTA elimina galleria */}
          {confirmDeleteGallery ? (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={deleteGallery}
                disabled={deletingGallery}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(217,112,112,.2)', color: 'var(--red)', border: '1px solid rgba(217,112,112,.4)', borderRadius: 'var(--r2)', padding: '0 12px', height: 34, fontSize: '12px', fontWeight: 500, cursor: deletingGallery ? 'not-allowed' : 'pointer' }}
              >
                {deletingGallery && <div style={{ width: 11, height: 11, border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />}
                Sì, elimina
              </button>
              <button
                onClick={() => setConfirmDeleteGallery(false)}
                style={{ height: 34, padding: '0 12px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', fontSize: '12px', color: 'var(--t2)', cursor: 'pointer' }}
              >
                Annulla
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteGallery(true)}
              title="Elimina galleria"
              style={{ width: 34, height: 34, flexShrink: 0, background: 'none', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--t3)', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(217,112,112,.4)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--b1)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--t3)' }}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
          </div>
        </div>

        {/* ── LAYOUT: STATS COLONNA SX + CONTENUTO PRINCIPALE ─────────── */}
        <div className="flex flex-col md:flex-row gap-5 md:items-start mt-5">

          {/* Colonna statistiche (sinistra) */}
          {gallery && (() => {
            const totalIncassi = orders.reduce((s, o) => s + (o.total ?? 0), 0)
            const statItems = [
              { label: 'Foto',      value: photos.length,   icon: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
              { label: 'Clienti',   value: (gallery.clients ?? []).length, icon: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { label: 'Preferiti', value: totalFav,        icon: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg> },
              { label: 'Commenti',  value: comments.length, icon: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              { label: 'Ordini',    value: orders.length,   icon: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
              { label: 'Incassi',   value: `${totalIncassi.toFixed(2).replace('.', ',')} €`, icon: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
            ]
            return (
              <div className="w-full grid grid-cols-3 gap-2 md:w-[180px] md:flex md:flex-col md:flex-shrink-0">
                <p className="hidden md:block col-span-3" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--t3)', paddingLeft: 2, marginBottom: 4 }}>Statistiche</p>
                {statItems.map(({ label, value, icon }) => (
                  <div key={label} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--acd)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      {icon}
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--t3)', lineHeight: 1, marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--tx)', fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Contenuto principale (destra) */}
          <div className="w-full min-w-0" style={{ flex: 1 }}>

        {/* ── TABS ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--b1)',
          marginBottom: '20px', overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 16px', fontSize: '12px', fontWeight: tab === t.id ? 500 : 400,
                color: tab === t.id ? 'var(--ac)' : 'var(--t3)',
                border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--ac)' : 'transparent'}`,
                background: 'transparent', cursor: 'pointer',
                whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all .15s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: FOTO ────────────────────────────────────────────────── */}
        {tab === 'photos' && (
          <div style={{ animation: 'fadeIn .2s ease' }}>

            {/* ── CARTELLE ───────────────────────────────────────────── */}
            {(() => {
              const folders = Array.from(new Set(photos.map(p => p.folder).filter(Boolean))) as string[]
              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>

                    {/* Pill "Tutte" */}
                    <button
                      onClick={() => { setActiveFolder(null); setUploadFolder(null) }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 20, fontSize: '12px', fontWeight: 500,
                        border: `1px solid ${activeFolder === null ? 'rgba(142,201,176,.35)' : 'var(--b1)'}`,
                        background: activeFolder === null ? 'var(--acd)' : 'var(--s2)',
                        color: activeFolder === null ? 'var(--ac)' : 'var(--t2)',
                        cursor: 'pointer', transition: 'all .15s',
                      }}
                    >
                      <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      Tutte ({photos.length})
                    </button>

                    {/* Pills cartelle esistenti */}
                    {folders.map(folder => {
                      const count = photos.filter(p => p.folder === folder).length
                      const isActive = activeFolder === folder
                      return (
                        <button
                          key={folder}
                          onClick={() => { setActiveFolder(folder); setUploadFolder(folder) }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 20, fontSize: '12px', fontWeight: 500,
                            border: `1px solid ${isActive ? 'rgba(142,201,176,.35)' : 'var(--b1)'}`,
                            background: isActive ? 'var(--acd)' : 'var(--s2)',
                            color: isActive ? 'var(--ac)' : 'var(--t2)',
                            cursor: 'pointer', transition: 'all .15s',
                          }}
                        >
                          <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          {folder} ({count})
                        </button>
                      )
                    })}

                    {/* Crea nuova cartella */}
                    {creatingFolder ? (
                      <form
                        onSubmit={e => {
                          e.preventDefault()
                          const name = newFolderName.trim()
                          if (!name || folders.includes(name)) { setCreatingFolder(false); setNewFolderName(''); return }
                          setActiveFolder(name)
                          setUploadFolder(name)
                          setCreatingFolder(false)
                          setNewFolderName('')
                        }}
                        style={{ display: 'flex', gap: 4 }}
                      >
                        <input
                          autoFocus
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          placeholder="Nome cartella…"
                          style={{
                            background: 'var(--s2)', border: '1px solid var(--ac)',
                            borderRadius: 20, padding: '4px 12px',
                            fontSize: '12px', color: 'var(--tx)', outline: 'none', width: 150,
                          }}
                        />
                        <button type="submit" style={{ padding: '4px 10px', background: 'var(--ac)', border: 'none', borderRadius: 20, fontSize: '11px', fontWeight: 600, color: '#111', cursor: 'pointer' }}>
                          Crea
                        </button>
                        <button type="button" onClick={() => { setCreatingFolder(false); setNewFolderName('') }} style={{ padding: '4px 10px', background: 'var(--s3)', border: 'none', borderRadius: 20, fontSize: '11px', color: 'var(--t2)', cursor: 'pointer' }}>
                          Annulla
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setCreatingFolder(true)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 11px', borderRadius: 20, fontSize: '12px',
                          border: '1px dashed var(--b2)', background: 'transparent',
                          color: 'var(--t3)', cursor: 'pointer', transition: 'all .15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--ac)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ac)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--b2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--t3)' }}
                      >
                        <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nuova cartella
                      </button>
                    )}

                    {/* Indicatore cartella upload attiva */}
                    {uploadFolder && (
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Upload in:
                        <span style={{ color: 'var(--ac)', fontWeight: 500 }}>{uploadFolder}</span>
                        <button onClick={() => setUploadFolder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', lineHeight: 1 }}>×</button>
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Cover attuale + toast */}
            {(gallery.cover_url || coverSaved) && (
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)' }}>
                {gallery.cover_url && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={gallery.cover_url} alt="cover" style={{ width: 52, height: 36, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tx)', marginBottom: 2 }}>Cover galleria</p>
                      <p style={{ fontSize: '10px', color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {gallery.cover_url.split('/').pop()}
                      </p>
                    </div>
                    <button
                      onClick={() => setCoverPhoto('', '')}
                      title="Rimuovi cover"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </>
                )}
                {coverSaved && (
                  <span style={{ fontSize: '11px', color: 'var(--ac)', display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
                    <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Cover salvata
                  </span>
                )}
              </div>
            )}

            {/* Qualità upload toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '12px', color: 'var(--t3)', flexShrink: 0 }}>Qualità upload:</span>
              <div style={{ display: 'flex', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: 3, gap: 3 }}>
                {(['alta', 'bassa'] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => setUploadQuality(q)}
                    style={{
                      fontSize: '12px', fontWeight: 500, padding: '4px 12px',
                      borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all .15s',
                      background: uploadQuality === q ? 'var(--ac)' : 'transparent',
                      color: uploadQuality === q ? '#111210' : 'var(--t2)',
                    }}
                  >
                    {q === 'alta' ? 'Alta risoluzione' : 'Bassa risoluzione'}
                  </button>
                ))}
              </div>
              {uploadQuality === 'bassa' && (
                <span style={{ fontSize: '11px', color: 'var(--t3)' }}>max 1920px · qualità 70%</span>
              )}

            </div>

            {/* ── Svuota cartella ── */}
            {photos.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                {clearPhotosSuccess && (
                  <span style={{ fontSize: '12px', color: '#2e7d5c', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Foto eliminate con successo
                  </span>
                )}
                {clearPhotosError && (
                  <span style={{ fontSize: '12px', color: '#c0392b' }}>{clearPhotosError}</span>
                )}
                {confirmClearPhotos ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#fff0f0', border: '1px solid #e57373', borderRadius: 8 }}>
                    <span style={{ fontSize: '13px', color: '#333' }}>
                      Eliminare tutte le <strong>{photos.length}</strong> foto?
                    </span>
                    <button
                      onClick={clearAllPhotos}
                      disabled={clearingPhotos}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '13px', fontWeight: 600, color: '#fff', background: '#e53935', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: clearingPhotos ? 'not-allowed' : 'pointer', opacity: clearingPhotos ? .6 : 1 }}
                    >
                      {clearingPhotos && <div style={{ width: 11, height: 11, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />}
                      Sì, elimina tutto
                    </button>
                    <button
                      onClick={() => setConfirmClearPhotos(false)}
                      style={{ fontSize: '13px', color: '#555', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}
                    >
                      Annulla
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearPhotos(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 500, color: '#c62828', background: '#ffebee', border: '2px solid #e57373', borderRadius: 8, padding: '7px 16px', cursor: 'pointer' }}
                  >
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Svuota cartella ({photos.length} foto)
                  </button>
                )}
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--ac)' : 'var(--b2)'}`,
                borderRadius: 'var(--r)', padding: '28px',
                textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'var(--acd2)' : 'transparent',
                transition: 'all .2s', marginBottom: '16px', position: 'relative',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,image/heic,image/heif"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                onClick={e => e.stopPropagation()}
                onChange={handleFileInput}
              />
              <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="var(--t3)" strokeWidth={1.5} strokeLinecap="round" style={{ margin: '0 auto 8px', display: 'block' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p style={{ fontSize: '12px', color: 'var(--t3)' }}>
                Trascina le foto qui o <strong style={{ color: 'var(--ac)' }}>sfoglia dal computer</strong>
                {uploadFolder && <span style={{ color: 'var(--ac)' }}> → {uploadFolder}</span>}
              </p>
              {uploadError && (
                <p style={{ fontSize: '11px', color: 'var(--red)', marginTop: 8, padding: '6px 10px', background: 'rgba(201,96,96,.1)', borderRadius: 6, wordBreak: 'break-all' }}>
                  {uploadError}
                </p>
              )}
              <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>
                JPG · PNG · HEIC · WEBP · max 50MB
              </p>
            </div>

            {/* Upload progress indicators */}
            {uploads.size > 0 && (
              <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Array.from(uploads.keys()).map(key => (
                  <div key={key} style={{
                    background: 'var(--s2)', border: '1px solid var(--b1)',
                    borderRadius: 'var(--r2)', padding: '8px 12px',
                    display: 'flex', alignItems: 'center', gap: 10, fontSize: '12px', color: 'var(--t2)',
                  }}>
                    <div style={{
                      width: 14, height: 14, border: '2px solid var(--ac)',
                      borderTopColor: 'transparent', borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite', flexShrink: 0,
                    }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {key.split('-').slice(0, -1).join('-')}
                    </span>
                    <span style={{ color: 'var(--t3)', flexShrink: 0 }}>Caricamento…</span>
                  </div>
                ))}
              </div>
            )}

            {/* Photo grid — helper per renderizzare una griglia di foto */}
            {(() => {
              const renderPhotoGrid = (subset: Photo[], indexOffset = 0) => (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '8px',
                }}>
                  {subset.map((photo, i) => {
                    const isDeleting   = deletingPhoto === photo.id
                    const isConfirming = confirmDeletePhoto === photo.id
                    return (
                      <div
                        key={photo.id}
                        style={{
                          aspectRatio: '1', borderRadius: 'var(--r2)', overflow: 'hidden',
                          position: 'relative', background: 'var(--s2)',
                          animation: `slideUp .25s ease ${(indexOffset + i) * 0.03}s both`,
                          opacity: isDeleting ? .4 : 1, transition: 'opacity .2s',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.filename}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        {/* Overlay on hover */}
                        <div
                          className="photo-overlay"
                          style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,.55)',
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '6px', opacity: 0, transition: 'opacity .2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => { if (confirmDeletePhoto !== photo.id) e.currentTarget.style.opacity = '0' }}
                        >
                          {/* Pulsanti in alto */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                            {/* ★ Cover — sinistra */}
                            {(() => {
                              const isCover = gallery?.cover_url === photo.url
                              const isSettingThis = settingCover === photo.id
                              return (
                                <button
                                  onClick={e => { e.stopPropagation(); if (!isCover) setCoverPhoto(photo.url, photo.id) }}
                                  title={isCover ? 'Cover attuale' : 'Usa come cover della galleria'}
                                  style={{
                                    width: 24, height: 24,
                                    background: isCover ? 'rgba(142,201,176,.9)' : 'rgba(0,0,0,.5)',
                                    border: 'none', borderRadius: 5, cursor: isCover ? 'default' : 'pointer',
                                    display: 'grid', placeItems: 'center', transition: 'background .15s',
                                  }}
                                >
                                  {isSettingThis ? (
                                    <div style={{ width: 10, height: 10, border: '1.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                                  ) : (
                                    <svg viewBox="0 0 24 24" width={11} height={11} fill={isCover ? '#111' : 'none'} stroke={isCover ? '#111' : '#fff'} strokeWidth={2} strokeLinecap="round">
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                    </svg>
                                  )}
                                </button>
                              )
                            })()}

                            {/* X elimina — destra */}
                            {isDeleting ? (
                              <div style={{ width: 24, height: 24, display: 'grid', placeItems: 'center' }}>
                                <div style={{ width: 12, height: 12, border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                              </div>
                            ) : isConfirming ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  onClick={e => { e.stopPropagation(); deletePhoto(photo.id) }}
                                  style={{ fontSize: '10px', fontWeight: 600, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}
                                >
                                  Elimina
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setConfirmDeletePhoto(null) }}
                                  style={{ fontSize: '10px', background: 'rgba(0,0,0,.5)', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={e => { e.stopPropagation(); setConfirmDeletePhoto(photo.id) }}
                                title="Elimina foto"
                                style={{ width: 24, height: 24, background: 'rgba(217,112,112,.85)', border: 'none', borderRadius: 5, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                              >
                                <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* Info in basso */}
                          <div>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                              {photo.filename}
                            </p>
                            {photo.size_bytes && (
                              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,.45)', marginTop: '2px' }}>
                                {formatBytes(photo.size_bytes)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )

              if (photos.length === 0 && uploads.size === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                    <p style={{ fontSize: '13px' }}>Nessuna foto ancora. Carica la prima!</p>
                  </div>
                )
              }

              // Filtro per cartella attiva
              if (activeFolder !== null) {
                const filtered = photos.filter(p => p.folder === activeFolder)
                if (filtered.length === 0) return (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                    <p style={{ fontSize: '13px' }}>Nessuna foto in questa cartella.</p>
                  </div>
                )
                return renderPhotoGrid(filtered)
              }

              // Vista "Tutte" — raggruppa per cartella
              const folders = Array.from(new Set(photos.map(p => p.folder).filter(Boolean))) as string[]
              const noFolder = photos.filter(p => !p.folder)
              let offset = 0
              const sections: React.ReactNode[] = []

              if (noFolder.length > 0) {
                sections.push(
                  <div key="__no_folder" style={{ marginBottom: 20 }}>
                    {folders.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Senza cartella</span>
                        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>({noFolder.length})</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
                      </div>
                    )}
                    {renderPhotoGrid(noFolder, offset)}
                  </div>
                )
                offset += noFolder.length
              }

              for (const folder of folders) {
                const folderPhotos = photos.filter(p => p.folder === folder)
                sections.push(
                  <div key={folder} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ac)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{folder}</span>
                      <span style={{ fontSize: '11px', color: 'var(--t3)' }}>({folderPhotos.length})</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
                      <button
                        onClick={() => { setActiveFolder(folder); setUploadFolder(folder) }}
                        style={{ fontSize: '10px', color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--ac)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
                      >
                        Filtra →
                      </button>
                    </div>
                    {renderPhotoGrid(folderPhotos, offset)}
                  </div>
                )
                offset += folderPhotos.length
              }

              return <>{sections}</>
            })()}
          </div>
        )}

        {/* ── TAB: CONDIVISIONI ────────────────────────────────────────── */}
        {tab === 'sharing' && (
          <div style={{ animation: 'fadeIn .2s ease', maxWidth: '640px' }}>

            {/* Link portale */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--ac)" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>Link portale cliente</div>
                  <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: 2 }}>Condividi con il cliente per dargli accesso alla galleria · se hanno già scaricato le foto, possono usare questo link anche per ordinare stampe</div>
                </div>
                {/* KPI inline */}
                {!loadingInt && (totalFav > 0 || comments.length > 0) && (
                  <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                    {totalFav > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg viewBox="0 0 24 24" width={11} height={11} fill="var(--red)" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        {totalFav}
                      </span>
                    )}
                    {comments.length > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="var(--ac)" strokeWidth={2} strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {comments.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '7px 10px' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '12px', color: 'var(--t2)' }}>
                    {shareUrl}
                  </span>
                  <button onClick={copyLink} title="Copia link" style={{ width: 28, height: 28, background: copied ? 'var(--acd)' : 'var(--s3)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'background .15s' }}>
                    {copied
                      ? <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="var(--ac)" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="var(--t2)" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    }
                  </button>
                </div>
                {copied && <p style={{ fontSize: '11px', color: 'var(--ac)', marginTop: 5 }}>Link copiato!</p>}
              </div>
            </div>

            {loadingInt ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0', color: 'var(--t3)', fontSize: '12px' }}>
                <div style={{ width: 14, height: 14, border: '2px solid var(--ac)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                Caricamento interazioni…
              </div>
            ) : (
              <>
                {/* ── Preferiti per foto ──────────────────────────────── */}
                {Object.keys(favCounts).length > 0 && (() => {
                  const favPhotos = photos
                    .filter(p => favCounts[p.id])
                    .sort((a, b) => (favCounts[b.id] ?? 0) - (favCounts[a.id] ?? 0))
                  const allSelected = favPhotos.every(p => selectedFavs.has(p.id))

                  const togglePhoto = (photoId: string) => {
                    setSelectedFavs(prev => {
                      const next = new Set(prev)
                      next.has(photoId) ? next.delete(photoId) : next.add(photoId)
                      return next
                    })
                  }

                  const toggleAll = () => {
                    setSelectedFavs(allSelected
                      ? new Set()
                      : new Set(favPhotos.map(p => p.id))
                    )
                  }

                  const downloadSelected = async () => {
                    const toDownload = favPhotos.filter(p => selectedFavs.has(p.id))
                    if (!toDownload.length) return
                    setDownloading(true)
                    for (const photo of toDownload) {
                      try {
                        const res = await fetch(photo.url)
                        const blob = await res.blob()
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(blob)
                        a.download = photo.filename
                        a.click()
                        URL.revokeObjectURL(a.href)
                        await new Promise(r => setTimeout(r, 400))
                      } catch { /* skip failed */ }
                    }
                    setDownloading(false)
                  }

                  return (
                    <div style={{ marginBottom: 20 }}>
                      {/* Header con controlli */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', letterSpacing: '.08em', textTransform: 'uppercase', flex: 1, margin: 0 }}>
                          Foto preferite ({totalFav} ♡ · {favPhotos.length} foto)
                        </p>
                        <button
                          onClick={toggleAll}
                          style={{ fontSize: '11px', color: 'var(--t2)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}
                        >
                          {allSelected ? 'Deseleziona tutto' : 'Seleziona tutto'}
                        </button>
                        {selectedFavs.size > 0 && (
                          <button
                            onClick={downloadSelected}
                            disabled={downloading}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: downloading ? 'var(--s3)' : 'var(--ac)',
                              color: downloading ? 'var(--t3)' : '#111210',
                              border: 'none', borderRadius: 6, padding: '5px 10px',
                              fontSize: '11px', fontWeight: 500, cursor: downloading ? 'not-allowed' : 'pointer',
                              transition: 'background .15s',
                            }}
                          >
                            {downloading ? (
                              <div style={{ width: 10, height: 10, border: '1.5px solid var(--t3)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                            ) : (
                              <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            )}
                            Scarica {selectedFavs.size} foto
                          </button>
                        )}
                      </div>

                      {/* Griglia foto */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
                        {favPhotos.map(photo => {
                          const selected = selectedFavs.has(photo.id)
                          return (
                            <div
                              key={photo.id}
                              onClick={() => togglePhoto(photo.id)}
                              style={{
                                position: 'relative', borderRadius: 8, overflow: 'hidden',
                                aspectRatio: '1', cursor: 'pointer',
                                outline: selected ? '2px solid var(--ac)' : '2px solid transparent',
                                outlineOffset: 1,
                                transition: 'outline .1s',
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo.url} alt={photo.filename} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                              {/* Checkbox */}
                              <div style={{
                                position: 'absolute', top: 5, left: 5,
                                width: 18, height: 18, borderRadius: 5,
                                background: selected ? 'var(--ac)' : 'rgba(0,0,0,.55)',
                                border: selected ? 'none' : '1.5px solid rgba(255,255,255,.5)',
                                display: 'grid', placeItems: 'center',
                                transition: 'background .1s',
                              }}>
                                {selected && (
                                  <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="#111" strokeWidth={3} strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                )}
                              </div>

                              {/* Badge cuori */}
                              <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(217,112,112,.9)', borderRadius: 5, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <svg viewBox="0 0 24 24" width={9} height={9} fill="#fff" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700 }}>{favCounts[photo.id]}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* ── Commenti ────────────────────────────────────────── */}
                {comments.length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                      Commenti ({comments.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {comments.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: 10, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '10px 12px' }}>
                          {c.photos && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.photos.url} alt="" style={{ width: 40, height: 40, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)' }}>{c.author_name}</span>
                              <span style={{ fontSize: '10px', color: 'var(--t3)' }}>
                                {new Date(c.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.5 }}>{c.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {Object.keys(favCounts).length === 0 && comments.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--t3)' }}>
                    <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" style={{ margin: '0 auto 10px', display: 'block', opacity: .4 }}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <p style={{ fontSize: '12px' }}>Nessuna interazione ancora.</p>
                    <p style={{ fontSize: '11px', marginTop: 4 }}>Condividi il link per ricevere preferiti e commenti.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: ORDINI STAMPA ───────────────────────────────────────── */}
        {tab === 'orders' && (
          <div style={{ animation: 'fadeIn .2s ease', maxWidth: '700px' }}>
            {loadingOrders ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontSize: '12px', padding: '20px 0' }}>
                <div style={{ width: 13, height: 13, border: '2px solid var(--ac)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                Caricamento ordini…
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" style={{ margin: '0 auto 10px', display: 'block', opacity: .4 }}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <p style={{ fontSize: '12px' }}>Nessun ordine ancora.</p>
                <p style={{ fontSize: '11px', marginTop: 4 }}>Gli ordini dei clienti appariranno qui.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map(order => {
                  const st = ORDER_STATUS[order.status] ?? ORDER_STATUS.nuovo
                  const isUpdating = updatingOrderId === order.id
                  return (
                    <div key={order.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                      {/* Order header */}
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>
                              {order.client_name || 'Cliente anonimo'}
                            </span>
                            {order.client_email && <span style={{ fontSize: '11px', color: 'var(--t3)' }}>{order.client_email}</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 10, fontSize: '11px', color: 'var(--t3)' }}>
                            <span>{new Date(order.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <span>·</span>
                            <span>{order.items.length} prodott{order.items.length === 1 ? 'o' : 'i'}</span>
                            <span>·</span>
                            <span style={{ fontWeight: 600, color: 'var(--tx)' }}>{order.total.toFixed(2).replace('.', ',')} €</span>
                          </div>
                        </div>

                        {/* Status selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isUpdating && <div style={{ width: 12, height: 12, border: '2px solid var(--ac)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />}
                          <select
                            value={order.status}
                            disabled={isUpdating}
                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                            style={{ ...st.style, fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: 20, cursor: 'pointer', outline: 'none' }}
                          >
                            {Object.entries(ORDER_STATUS).map(([key, { label }]) => (
                              <option key={key} value={key} style={{ background: 'var(--s2)', color: 'var(--tx)' }}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Order items */}
                      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '11px', color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
                              <p style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 2 }}>
                                {item.type === 'carta' ? '📄' : '🖼️'} {item.format_label} · {item.qty} {item.qty === 1 ? 'copia' : 'copie'} · {item.unit_price.toFixed(2).replace('.', ',')} €/cad.
                              </p>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)', flexShrink: 0 }}>
                              {item.total.toFixed(2).replace('.', ',')} €
                            </span>
                          </div>
                        ))}
                        {order.notes && (
                          <div style={{ marginTop: 4, padding: '6px 10px', background: 'var(--s2)', borderRadius: 6, fontSize: '11px', color: 'var(--t2)', fontStyle: 'italic' }}>
                            💬 {order.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && gallery && (
          <div style={{ animation: 'fadeIn .2s ease', maxWidth: '560px' }}>

            {/* Helper per la riga toggle */}
            {([
              { key: 'download_singolo', label: 'Download singola foto', desc: 'Il cliente può scaricare le foto una alla volta dal portale.' },
              { key: 'download_zip',     label: 'Scarica tutte le foto', desc: 'Il cliente può scaricare tutte le foto in un file ZIP.' },
              { key: 'watermark',        label: 'Watermark sulle foto',  desc: 'Aggiunge il tuo nome in sovrimpressione su ogni foto nel portale. Le foto originali non vengono modificate.' },
            ] as { key: keyof NonNullable<typeof gallery.settings>; label: string; desc: string }[]).map(({ key, label, desc }) => {
              const val = !!gallery.settings?.[key]
              return (
                <div key={key} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', padding: '16px 20px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--tx)', marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: '11px', color: 'var(--t3)', lineHeight: 1.5 }}>{desc}</p>
                    </div>
                    <button
                      onClick={() => toggleSetting(key as string, !val)}
                      style={{ width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: val ? 'var(--ac)' : 'var(--s3)', position: 'relative', flexShrink: 0, transition: 'background .2s' }}
                    >
                      <span style={{ position: 'absolute', top: 3, left: val ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', display: 'block' }} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Feedback salvataggio */}
            {(savingSettings || settingsSaved) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: settingsSaved ? 'var(--ac)' : 'var(--t3)', padding: '6px 0' }}>
                {savingSettings
                  ? <><div style={{ width: 10, height: 10, border: '2px solid var(--t3)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> Salvataggio…</>
                  : <><svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Impostazioni salvate</>
                }
              </div>
            )}

          </div>
        )}

          </div> {/* fine contenuto principale */}
        </div> {/* fine layout stats+contenuto */}

      </div>

      {/* spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .photo-overlay { opacity: 0; }
        .photo-overlay:hover { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

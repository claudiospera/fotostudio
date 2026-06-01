'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Photo } from '@/lib/types'

interface LightboxProps {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  // optional action bar
  favorites?: Set<string>
  onToggleFavorite?: (photoId: string) => void
  onOpenComment?: (photo: Photo) => void
  onDownload?: (photo: Photo) => void
  showDownload?: boolean
  onOpenOrder?: (photo: Photo) => void
  showOrder?: boolean
  // selection
  selectedPhotos?: Set<string>
  onToggleSelect?: (photoId: string) => void
}

export const Lightbox = ({
  photos, currentIndex, onClose, onNavigate,
  favorites, onToggleFavorite, onOpenComment, onDownload, showDownload, onOpenOrder, showOrder,
  selectedPhotos, onToggleSelect,
}: LightboxProps) => {
  const photo = photos[currentIndex]
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isFavorited = favorites?.has(photo?.id ?? '') ?? false
  const isSelected  = selectedPhotos?.has(photo?.id ?? '') ?? false

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft'  && currentIndex > 0)              onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [currentIndex, photos.length, onClose, onNavigate])

  // Touch gestures
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y
      touchStartRef.current = null
      if (Math.abs(dy) > Math.abs(dx) && dy < -70) { onClose(); return }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0 && currentIndex < photos.length - 1) onNavigate(currentIndex + 1)
        if (dx > 0 && currentIndex > 0) onNavigate(currentIndex - 1)
      }
    }
    const onMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return
      const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x)
      const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y)
      if (dx > dy && dx > 10) e.preventDefault()
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd,   { passive: true })
    el.addEventListener('touchmove', onMove,  { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchmove', onMove)
    }
  }, [currentIndex, photos.length, onClose, onNavigate])

  const stopProp = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  if (!photo) return null

  const topBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '6px 10px', borderRadius: 6,
    fontSize: '13px', fontWeight: 500,
    color: '#666', letterSpacing: '.01em',
    fontFamily: 'Inter, DM Sans, sans-serif',
    whiteSpace: 'nowrap',
    transition: 'color .12s',
  }

  const navBtn: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(0,0,0,.06)', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10, transition: 'background .15s',
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff', display: 'flex', flexDirection: 'column', animation: 'fadeIn .15s ease' }}
    >
      {/* ── TOP BAR ── */}
      <div style={{ height: 54, borderBottom: '1px solid rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0 }}>

        {/* ← Torna */}
        <button onClick={onClose} style={{ ...topBtn, paddingLeft: 10, marginRight: 'auto' }}>
          <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        </button>

        {/* Counter */}
        <span style={{ fontSize: '12px', color: '#ccc', fontFamily: 'Inter, DM Sans, sans-serif', marginRight: 8, flexShrink: 0 }}>
          {currentIndex + 1} / {photos.length}
        </span>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,.1)', marginRight: 8, flexShrink: 0 }} />

        {/* ♡ Favorite */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(photo.id)}
            style={{ ...topBtn, color: isFavorited ? '#e04060' : '#666' }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="nav-label" style={{ fontSize: '13px' }}>Favorite</span>
          </button>
        )}

        {/* ↓ Download */}
        {showDownload !== false && onDownload && (
          <button onClick={() => onDownload(photo)} style={topBtn}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span className="nav-label" style={{ fontSize: '13px' }}>Download</span>
          </button>
        )}

        {/* 💬 Commento */}
        {onOpenComment && (
          <button onClick={() => { onOpenComment(photo); onClose() }} style={topBtn}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="nav-label" style={{ fontSize: '13px' }}>Commento</span>
          </button>
        )}

        {/* 🛒 Ordina */}
        {showOrder !== false && onOpenOrder && (
          <button onClick={() => { onOpenOrder(photo); onClose() }} style={topBtn}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className="nav-label" style={{ fontSize: '13px' }}>Ordina</span>
          </button>
        )}

        {/* ☑ Seleziona */}
        {onToggleSelect && (
          <button
            onClick={() => onToggleSelect(photo.id)}
            style={{ ...topBtn, color: isSelected ? '#8ec9b0' : '#666', fontWeight: isSelected ? 700 : 500 }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill={isSelected ? '#8ec9b0' : 'none'} stroke={isSelected ? '#8ec9b0' : 'currentColor'} strokeWidth={1.8} strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              {isSelected && <polyline points="8 12 11 15 16 9"/>}
            </svg>
            <span className="nav-label" style={{ fontSize: '13px' }}>{isSelected ? 'Selezionata' : 'Seleziona'}</span>
          </button>
        )}
      </div>

      {/* ── PHOTO AREA ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fff' }}>

        {/* Left nav */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => { stopProp(e); onNavigate(currentIndex - 1) }}
            style={{ ...navBtn, left: 16 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,.06)' }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}

        {/* Photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.filename}
          draggable={false}
          style={{
            maxWidth: 'calc(100vw - 120px)',
            maxHeight: 'calc(100vh - 120px)',
            objectFit: 'contain',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            display: 'block',
            animation: 'fadeIn .18s ease',
          }}
        />

        {/* Right nav */}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={(e) => { stopProp(e); onNavigate(currentIndex + 1) }}
            style={{ ...navBtn, right: 16 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,.06)' }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        )}
      </div>

      {/* ── FILENAME ── */}
      <div style={{ height: 38, borderTop: '1px solid rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', color: '#ccc', fontFamily: 'Inter, DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60vw' }}>
          {photo.filename}
        </span>
      </div>
    </div>
  )
}

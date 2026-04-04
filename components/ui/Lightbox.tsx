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
}

export const Lightbox = ({ photos, currentIndex, onClose, onNavigate, favorites, onToggleFavorite, onOpenComment, onDownload, showDownload, onOpenOrder, showOrder }: LightboxProps) => {
  const photo = photos[currentIndex]
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [currentIndex, photos.length, onClose, onNavigate])

  // Touch gestures — non-passive so we can preventDefault on horizontal swipe
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

      // Swipe UP to close (vertical dominant, upward, min 70px)
      if (Math.abs(dy) > Math.abs(dx) && dy < -70) {
        onClose()
        return
      }
      // Swipe left/right to navigate (horizontal dominant, min 50px)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0 && currentIndex < photos.length - 1) onNavigate(currentIndex + 1)
        if (dx > 0 && currentIndex > 0) onNavigate(currentIndex - 1)
      }
    }

    const onMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return
      const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x)
      const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y)
      // prevent page scroll during horizontal swipe
      if (dx > dy && dx > 10) e.preventDefault()
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchmove', onMove)
    }
  }, [currentIndex, photos.length, onClose, onNavigate])

  const stopProp = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  if (!photo) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 animate-fade-in select-none"
    >
      {/* Counter + swipe hint — top left */}
      <div className="absolute top-4 left-4 flex flex-col gap-0.5 pointer-events-none">
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif' }}>
          {currentIndex + 1} / {photos.length}
        </span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
          ↑ scorri su per chiudere
        </span>
      </div>

      {/* Close button — top right */}
      <button
        onClick={onClose}
        aria-label="Chiudi"
        style={{
          position: 'absolute', top: 12, right: 12,
          width: 40, height: 40,
          background: 'var(--ac)', color: '#111',
          border: 'none', borderRadius: 'var(--r2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Left arrow */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { stopProp(e); onNavigate(currentIndex - 1) }}
          aria-label="Precedente"
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44,
            background: 'var(--ac)', color: '#111',
            border: 'none', borderRadius: 'var(--r2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Photo — no click to close */}
      <img
        src={photo.url}
        alt={photo.filename}
        draggable={false}
        style={{
          maxWidth: '90vw', maxHeight: '85vh',
          objectFit: 'contain',
          userSelect: 'none', WebkitUserSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Right arrow */}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={(e) => { stopProp(e); onNavigate(currentIndex + 1) }}
          aria-label="Successiva"
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44,
            background: 'var(--ac)', color: '#111',
            border: 'none', borderRadius: 'var(--r2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Bottom bar: actions + filename */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 py-4 px-6"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
      >
        {/* Action buttons */}
        {(onToggleFavorite || onOpenComment || onDownload || onOpenOrder) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(photo.id)}
                aria-label="Preferito"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={favorites?.has(photo.id) ? 'var(--ac)' : 'none'} stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span style={{ fontSize: '10px', color: 'var(--ac)', fontFamily: 'DM Sans, sans-serif' }}>
                  {favorites?.has(photo.id) ? 'Salvata' : 'Preferita'}
                </span>
              </button>
            )}
            {onOpenComment && (
              <button
                onClick={() => { onOpenComment(photo); onClose() }}
                aria-label="Commenta"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span style={{ fontSize: '10px', color: 'var(--ac)', fontFamily: 'DM Sans, sans-serif' }}>Commento</span>
              </button>
            )}
            {showDownload !== false && onDownload && (
              <button
                onClick={() => onDownload(photo)}
                aria-label="Scarica"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span style={{ fontSize: '10px', color: 'var(--ac)', fontFamily: 'DM Sans, sans-serif' }}>Scarica</span>
              </button>
            )}
            {showOrder !== false && onOpenOrder && (
              <button
                onClick={() => { onOpenOrder(photo); onClose() }}
                aria-label="Ordina stampa"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span style={{ fontSize: '10px', color: 'var(--ac)', fontFamily: 'DM Sans, sans-serif' }}>Ordina</span>
              </button>
            )}
          </div>
        )}

        {/* Filename */}
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
          color: 'rgba(255,255,255,0.45)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80vw',
        }}>
          {photo.filename}
        </span>
      </div>
    </div>
  )
}

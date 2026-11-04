'use client'

// components/home/HeroServiceTiles.tsx
// Due tile grandi in home (hero) con foto a scorrimento automatico (crossfade),
// al posto dei due pulsanti di testo — più facili da notare e da cliccare.

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const R2 = 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev'

interface Tile {
  href: string
  label: string
  title: string
  subtitle: string
  images: string[]
}

const TILES: Tile[] = [
  {
    href: '/servizi',
    label: 'Servizi fotografici',
    title: 'Scopri i servizi fotografici',
    subtitle: 'Matrimoni, battesimi, ritratti e famiglia',
    images: [
      `${R2}/images/galleria/matrimoni/real-weddings/stefano%20e%20teodora/036b.jpg`,
      `${R2}/images/servizi/ritratti-famiglie/gallery/DSCF8132-21.jpg`,
      `${R2}/images/servizi/battesimi/cover.jpg`,
    ],
  },
  {
    href: '/shop',
    label: 'Shop & Stampa',
    title: 'Area shop e stampa',
    subtitle: 'Stampe, tela, cornici e gadget personalizzati',
    images: [
      '/images/shop/stampe/poster.jpg',
      '/images/shop/tela/catalogo.jpg',
      '/images/shop/cornici/preview-bianco-1.jpg',
      '/images/shop/gadget/cuscino-ambientata.jpg',
    ],
  },
]

const INTERVAL_MS = 4200

function TileCard({ tile }: { tile: Tile }) {
  const [index, setIndex] = useState(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return
      setIndex(i => (i + 1) % tile.images.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [tile.images.length])

  return (
    <Link
      href={tile.href}
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      style={{
        position: 'relative', display: 'block', textDecoration: 'none',
        borderRadius: 20, overflow: 'hidden', minHeight: 240,
        boxShadow: '0 14px 44px rgba(0,0,0,0.14)',
      }}
      className="hero-tile"
    >
      {tile.images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="(max-width: 760px) 100vw, 50vw"
          style={{ objectFit: 'cover', opacity: i === index ? 1 : 0, transition: 'opacity 1.1s ease' }}
        />
      ))}

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(10,10,10,0.05) 0%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.78) 100%)',
      }} />

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: 'clamp(18px, 3vw, 28px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <span style={{
            display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.06em',
            textTransform: 'uppercase', color: '#5fe3ff', marginBottom: 6, whiteSpace: 'nowrap',
          }}>
            {tile.label}
          </span>
          <span style={{
            display: 'block', fontFamily: 'Poppins, sans-serif', fontWeight: 800,
            fontSize: 'clamp(17px, 2.1vw, 22px)', color: '#fff', letterSpacing: '-0.015em', lineHeight: 1.2,
          }}>
            {tile.title}
          </span>
          <span style={{ display: 'block', fontSize: '12.5px', color: 'rgba(255,255,255,0.78)', marginTop: 4 }}>
            {tile.subtitle}
          </span>
        </div>
        <div style={{
          flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: '#00c1de',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '17px', color: '#fff', transition: 'transform .2s',
        }} className="hero-tile-arrow">
          →
        </div>
      </div>
    </Link>
  )
}

export function HeroServiceTiles() {
  return (
    <div className="hero-tiles-grid" style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18,
      width: '100%', maxWidth: 820, margin: '0 auto',
    }}>
      {TILES.map(t => <TileCard key={t.href} tile={t} />)}

      <style>{`
        .hero-tile:hover .hero-tile-arrow { transform: translateX(3px); }
        @media (max-width: 640px) {
          .hero-tiles-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

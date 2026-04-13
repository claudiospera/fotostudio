'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ClienteCard } from './ClienteCard'
import type { Cliente, Profile } from '@/lib/types'

interface ClienteCardModalProps {
  clienti: Cliente[]
  dateLabel: string
  onClose: () => void
  onModifica: (c: Cliente) => void
  onElimina: (c: Cliente) => void
}

export const ClienteCardModal = ({
  clienti, dateLabel, onClose, onModifica, onElimina,
}: ClienteCardModalProps) => {
  const [profile, setProfile] = useState<Partial<Profile>>({})

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : {})
      .then(setProfile)
      .catch(() => {})
  }, [])

  if (clienti.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 1200 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header modale */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div>
            <h2 style={{
              margin: 0, color: '#fff',
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20,
            }}>
              {dateLabel}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {clienti.length} {clienti.length === 1 ? 'evento' : 'eventi'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Griglia card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {clienti.map(c => (
            <ClienteCard
              key={c.id}
              cliente={c}
              profile={profile}
              onModifica={onModifica}
              onElimina={onElimina}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

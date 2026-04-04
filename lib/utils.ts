import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { GalleryStatus, PreventivoStato } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const uid = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36)

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const statusLabel: Record<GalleryStatus, string> = {
  active:   'Attiva',
  draft:    'Bozza',
  archived: 'Archiviata',
}

export const preventivoLabel: Record<PreventivoStato, string> = {
  bozza:     'Bozza',
  inviato:   'Inviato',
  accettato: 'Accettato',
  rifiutato: 'Rifiutato',
}

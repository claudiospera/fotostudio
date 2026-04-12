// lib/types.ts

export type GalleryStatus = 'active' | 'draft' | 'archived'
export type PreventivoStato = 'bozza' | 'inviato' | 'accettato' | 'rifiutato'
export type ServiceType =
  | 'Matrimonio'
  | 'Battesimo'
  | 'Comunione'
  | '1 Anno'
  | '18 Anni'
  | 'Anniversario'
  | 'Shooting Fotografico'
  | 'Altra Cerimonia'
  | 'Ritratto'
  | 'Famiglia'
  | 'Moda / Editorial'
  | 'Corporate'
  | 'Evento'
  | 'Newborn'

export interface PreventivoTemplate {
  id: string
  nome: string
  servizio: ServiceType
  descrizione: string
  voci: VocePreventivo[]
  totale: number
  durata_ore: number
  colore: string
}

export interface GallerySettings {
  preferiti: boolean
  commenti: boolean
  social: boolean
  servizio_stampa: boolean
  download_singolo: boolean
  download_hd: boolean
  download_zip: boolean
  watermark: boolean
  nome_file: boolean
  pagamenti: {
    negozio: boolean
    paypal: boolean
    bonifico: boolean
  }
}

export interface Photo {
  id: string
  gallery_id: string
  storage_path: string
  url: string
  filename: string
  size_bytes?: number
  width?: number
  height?: number
  order_index: number
  folder?: string | null
  created_at: string
}

export interface GalleryClient {
  id: string
  gallery_id: string
  name: string
  email: string
  active: boolean
  favorites: number
  comments: number
  orders: number
  last_access?: string
  created_at: string
}

export interface TimelineItem {
  id: string
  gallery_id: string
  time: string       // "HH:MM"
  label: string
  order_index: number
}

export interface Gallery {
  id: string
  user_id: string
  name: string
  subtitle?: string
  type?: ServiceType
  date?: string
  status: GalleryStatus
  cover_color?: string
  cover_url?: string | null
  settings?: GallerySettings
  created_at: string
  updated_at: string
  // relazioni
  photos?: Photo[]
  clients?: GalleryClient[]
  timeline?: TimelineItem[]
}

export interface VocePreventivo {
  desc: string
  prezzo: number
}

export interface Preventivo {
  id: string
  user_id: string
  gallery_id?: string
  cliente: string
  email?: string
  servizio?: ServiceType
  data_evento?: string
  voci: VocePreventivo[]
  totale: number
  stato: PreventivoStato
  note?: string
  created_at: string
}

export interface UploadLink {
  id: string
  user_id: string
  gallery_id?: string
  nome: string
  slug: string
  expires_at?: string
  max_photos?: number
  uploads: number
  active: boolean
  created_at: string
  // join
  gallery?: Pick<Gallery, 'id' | 'name'>
}

export type CategoriaCliente =
  | 'Matrimonio'
  | 'Battesimo'
  | 'Comunione'
  | '1 Anno'
  | '18 Anni'
  | 'Anniversario'
  | 'Shooting Fotografico'
  | 'Altra Cerimonia'

export interface PacchettoCliente {
  nome: string
  prezzo: number
}

export interface Cliente {
  id: string
  user_id: string
  categoria: CategoriaCliente
  data_evento?: string
  luogo_evento?: string
  // Persona 1
  nome1: string
  tel1?: string
  email1?: string
  whatsapp1?: string
  indirizzo1?: string
  citta1?: string
  // Persona 2
  nome2?: string
  tel2?: string
  email2?: string
  whatsapp2?: string
  indirizzo2?: string
  citta2?: string
  // Genitori
  genitore1_nome?: string
  genitore1_tel?: string
  genitore2_nome?: string
  genitore2_tel?: string
  // Album
  album_tipo?: string
  album_formato?: string
  album_pagine?: number
  album_copertina?: string
  // Video
  video?: boolean
  video_tipo?: string
  // Pacchetti
  pacchetti: PacchettoCliente[]
  // Pagamenti
  importo_totale: number
  acconto: number
  data_acconto?: string
  saldo: number
  data_saldo?: string
  // Extra
  gallery_id?: string
  note?: string
  colore: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  name?: string
  studio_name?: string
  plan: 'free' | 'pro' | 'professional'
  created_at: string
}

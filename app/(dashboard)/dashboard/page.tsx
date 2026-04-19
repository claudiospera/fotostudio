'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'
import {
  Images, HardDrive, TrendingUp, ArrowRight,
  ShoppingCart, Trash2, AlertCircle, Search, ChevronDown,
} from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function storageColor(pct: number) {
  if (pct < 60) return 'var(--ac)'
  if (pct < 85) return 'var(--amber)'
  return 'var(--red)'
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buongiorno'
  if (h < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

function todayLabel() {
  return new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── types ────────────────────────────────────────────────────────────────────

interface Stats {
  gallerieAttive: number
  preventiviAperti: number
  uploadRicevuti: number
  fotoTotali: number
}

interface GalleryStorage {
  id: string; name: string; status: string; bytes: number
}

interface StorageData {
  totalBytes: number; limitBytes: number; galleries: GalleryStorage[]
}

interface RecentOrder {
  id: string
  client_name: string | null
  total: number
  status: string
  created_at: string
  galleries?: { name: string }
}

interface GalleryItem {
  id: string
  name: string
  type?: string
  date?: string
  status: string
  created_at: string
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, bg, textColor = '#fff', href,
}: {
  label: string
  value: string | number
  bg: string
  textColor?: string
  href?: string
}) {
  const content = (
    <div style={{ background: bg, borderRadius: 16, padding: '22px 24px', cursor: href ? 'pointer' : 'default' }}>
      <p style={{ fontSize: 34, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: textColor, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, color: textColor, opacity: 0.8, fontWeight: 500, letterSpacing: '0.02em' }}>{label}</p>
    </div>
  )
  return href ? <Link href={href} className="block">{content}</Link> : content
}

// ── Quick Action ──────────────────────────────────────────────────────────────

function QuickAction({ label, href, bg, textColor = '#fff' }: {
  label: string; href: string; bg: string; textColor?: string
}) {
  return (
    <Link
      href={href}
      style={{ background: bg, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: textColor, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </Link>
  )
}

// ── main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats]             = useState<Stats | null>(null)
  const [storage, setStorage]         = useState<StorageData | null>(null)
  const [orders, setOrders]           = useState<RecentOrder[]>([])
  const [loadingStats, setLoadingStats]     = useState(true)
  const [loadingStorage, setLoadingStorage] = useState(true)
  const [loadingOrders, setLoadingOrders]   = useState(true)
  const [galleries, setGalleries]     = useState<GalleryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingGalleries, setLoadingGalleries] = useState(true)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [confirmId, setConfirmId]     = useState<string | null>(null)
  const [eventiOpen, setEventiOpen]   = useState(false)
  const [storageOpen, setStorageOpen] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .finally(() => setLoadingStats(false))

    fetch('/api/orders')
      .then(r => r.ok ? r.json() : [])
      .then((d: RecentOrder[]) => setOrders(d.slice(0, 5)))
      .finally(() => setLoadingOrders(false))

    fetch('/api/galleries')
      .then(r => r.ok ? r.json() : [])
      .then((d: GalleryItem[]) => setGalleries(d.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())))
      .finally(() => setLoadingGalleries(false))
  }, [])

  const fetchStorage = useCallback(() => {
    setLoadingStorage(true)
    fetch('/api/dashboard/storage')
      .then(r => r.json())
      .then(d => { if (!d.error) setStorage(d) })
      .finally(() => setLoadingStorage(false))
  }, [])

  useEffect(() => { fetchStorage() }, [fetchStorage])

  const deleteGallery = useCallback(async (id: string) => {
    setDeletingId(id); setConfirmId(null)
    const res = await fetch(`/api/galleries/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchStorage()
      setStats(p => p ? { ...p, gallerieAttive: Math.max(0, p.gallerieAttive - 1) } : p)
    }
    setDeletingId(null)
  }, [fetchStorage])

  const usedPct = storage ? Math.min((storage.totalBytes / storage.limitBytes) * 100, 100) : 0
  const storCol = storageColor(usedPct)
  const newOrders = orders.filter(o => o.status === 'nuovo').length

  return (
    <>
      <Topbar title="Dashboard" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: '#f5f5f3' }}>
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6" style={{ padding: '20px 24px' }}>

          {/* ── Greeting ─────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3 pb-4 border-b border-[rgba(0,0,0,0.08)]">
            <div className="min-w-0">
              <p className="text-[11px] mb-2 capitalize tracking-[.05em]" style={{ color: '#999' }}>{todayLabel()}</p>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 30px)', color: '#1a1a1a', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                {greeting()}, Claudio
              </h1>
            </div>
            {newOrders > 0 && (
              <Link href="/ordini" className="flex items-center gap-2 rounded-[var(--r2)] px-3 py-2 transition-colors self-start sm:self-auto shrink-0" style={{ background: 'rgba(201,96,96,.10)', border: '1px solid rgba(201,96,96,.2)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,96,96,.16)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(201,96,96,.10)')}
              >
                <AlertCircle size={13} className="text-[var(--red)]" />
                <span className="text-[12px] font-semibold text-[var(--red)]">
                  {newOrders} {newOrders === 1 ? 'nuovo ordine' : 'nuovi ordini'}
                </span>
              </Link>
            )}
          </div>

          {/* ── KPI ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Gallerie attive"    value={loadingStats ? '…' : (stats?.gallerieAttive ?? '—')}   bg="#00BCD4"           href="/gallerie" />
            <KpiCard label="Preventivi aperti"  value={loadingStats ? '…' : (stats?.preventiviAperti ?? '—')} bg="#FF7043"           href="/preventivi" />
            <KpiCard label="Upload ricevuti"    value={loadingStats ? '…' : (stats?.uploadRicevuti ?? '—')}   bg="#7B1FA2"           href="/upload" />
            <KpiCard label="Foto totali"        value={loadingStats ? '…' : (stats?.fotoTotali ?? '—')}       bg="#FDD835" textColor="#333" />
          </div>

          {/* ── Azioni rapide ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction label="Calendario eventi" href="/preventivi?tab=proposte" bg="#F06292" />
            <QuickAction label="Clienti"            href="/clienti"                bg="#E91E8C" />
            <QuickAction label="Preventivi"         href="/preventivi?tab=templates" bg="#FFB300" textColor="#333" />
            <QuickAction label="Link upload"        href="/upload"                  bg="#7B1FA2" />
          </div>

          {/* ── Ultimi eventi ────────────────────────────────────────── */}
          <Card>
            {/* Header — cliccabile per espandere */}
            <CardHeader
              className="justify-between pb-3 cursor-pointer select-none"
              onClick={() => setEventiOpen(o => !o)}
            >
              <div className="flex items-center gap-2">
                <Images size={15} className="text-[var(--ac)]" />
                <CardTitle>Ultimi eventi</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                {eventiOpen && (
                  <Link
                    href="/gallerie"
                    onClick={e => e.stopPropagation()}
                    className="text-[11px] text-[var(--ac)] hover:text-[var(--ac2)] transition-colors flex items-center gap-1 shrink-0"
                  >
                    Vedi tutte <ArrowRight size={11} />
                  </Link>
                )}
                <ChevronDown
                  size={15}
                  className="text-[var(--t3)] transition-transform duration-200"
                  style={{ transform: eventiOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </div>
            </CardHeader>

            {eventiOpen && (
              <>
            {/* Search bar — full width */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--r2)] border border-[var(--b1)] bg-[var(--s2)]">
                <Search size={13} className="text-[var(--t3)] shrink-0" />
                <input
                  type="text"
                  placeholder="Cerca galleria…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--tx)', width: '100%' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', lineHeight: 1, padding: 0, fontSize: 14 }}>✕</button>
                )}
              </div>
            </div>

            <CardContent className="p-0">
              {loadingGalleries ? (
                <div className="flex items-center justify-center gap-2 py-10 text-[var(--t3)] text-sm">
                  <div className="w-4 h-4 border-2 border-[var(--ac)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (() => {
                const filtered = galleries.filter(g =>
                  g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (g.type ?? '').toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 10)
                return filtered.length === 0 ? (
                  <p className="text-center py-10 text-[var(--t3)] text-sm">
                    {searchQuery ? 'Nessuna galleria trovata.' : 'Nessuna galleria ancora.'}
                  </p>
                ) : (
                  <>
                    {/* Header tabella — nascosto su mobile */}
                    <div className="hidden sm:grid px-5 py-2 border-y border-[var(--b1)] bg-[var(--s2)]" style={{ gridTemplateColumns: '1fr 130px 120px 90px' }}>
                      {['Nome galleria', 'Tipo', 'Data evento', 'Stato'].map(h => (
                        <span key={h} className="text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--t3)]">{h}</span>
                      ))}
                    </div>

                    <div className="divide-y divide-[var(--b1)]">
                      {filtered.map(g => {
                        const statusColor = g.status === 'active' ? 'var(--ac)' : g.status === 'archived' ? 'var(--red)' : 'var(--amber)'
                        const statusLabel = g.status === 'active' ? 'Attiva' : g.status === 'archived' ? 'Archiviata' : 'Bozza'
                        const dateStr = g.date ? new Date(g.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null

                        return (
                          <Link
                            key={g.id}
                            href={`/gallerie/${g.id}`}
                            className="flex flex-col gap-1 sm:grid px-5 py-4 hover:bg-[var(--s2)] transition-colors"
                            style={{ gridTemplateColumns: '1fr 130px 120px 90px', alignItems: 'center' }}
                          >
                            {/* Nome — sempre visibile */}
                            <span className="text-[14px] font-semibold text-[var(--tx)] truncate pr-4 leading-snug">{g.name}</span>

                            {/* Mobile: riga secondaria con info + stato */}
                            <div className="flex items-center gap-3 sm:hidden">
                              {g.type && <span className="text-[12px] text-[var(--t2)]">{g.type}</span>}
                              {g.type && dateStr && <span className="text-[var(--b2)]">·</span>}
                              {dateStr && <span className="text-[12px] text-[var(--t2)]">{dateStr}</span>}
                              <span className="ml-auto text-[12px] font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
                            </div>

                            {/* Desktop: colonne separate */}
                            <span className="hidden sm:block text-[13px] text-[var(--t2)] truncate">{g.type ?? '—'}</span>
                            <span className="hidden sm:block text-[13px] text-[var(--t2)]">{dateStr ?? '—'}</span>
                            <span className="hidden sm:block text-[12px] font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </CardContent>
              </>
            )}
          </Card>

          {/* ── Middle row ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4">

            {/* Ultimi ordini */}
            <Card>
              <CardHeader className="justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={15} className="text-[var(--ac)]" />
                  <CardTitle>Ultimi ordini stampe</CardTitle>
                </div>
                <Link href="/ordini" className="text-[11px] text-[var(--ac)] hover:text-[var(--ac2)] transition-colors flex items-center gap-1">
                  Vedi tutti <ArrowRight size={11} />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loadingOrders ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-[var(--t3)] text-sm">
                    <div className="w-4 h-4 border-2 border-[var(--ac)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10 text-[var(--t3)] text-sm">
                    Nessun ordine ricevuto
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--b1)]">
                    {orders.map(order => (
                      <Link
                        key={order.id}
                        href="/ordini"
                        className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--s2)] transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--tx)] truncate">
                            {order.client_name ?? 'Cliente anonimo'}
                          </p>
                          <p className="text-[11px] text-[var(--t3)] mt-0.5">
                            {order.galleries?.name ?? '—'} · {new Date(order.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={order.status === 'nuovo' ? 'danger' : order.status === 'completato' ? 'active' : 'warning'}>
                            {order.status === 'nuovo' ? 'Nuovo' : order.status === 'visto' ? 'Visto' : 'Completato'}
                          </Badge>
                          <span className="text-sm font-['Syne'] font-bold text-[var(--tx)]">
                            {order.total.toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Storage ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader
              className="justify-between cursor-pointer select-none"
              onClick={() => setStorageOpen(o => !o)}
            >
              <div className="flex items-center gap-2">
                <HardDrive size={15} className="text-[var(--ac)]" />
                <div>
                  <CardTitle>Storage Cloudflare R2</CardTitle>
                  <p className="text-[10px] text-[var(--t3)] mt-0.5">Piano gratuito · 10 GB inclusi</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!loadingStorage && storage && (
                  <div className="text-right">
                    <p className="text-sm font-bold font-['Syne']" style={{ color: storCol }}>
                      {formatBytes(storage.totalBytes)}
                    </p>
                    <p className="text-[10px] text-[var(--t3)]">di 10 GB</p>
                  </div>
                )}
                <ChevronDown
                  size={15}
                  className="text-[var(--t3)] transition-transform duration-200"
                  style={{ transform: storageOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </div>
            </CardHeader>
            {storageOpen && <CardContent>
              {loadingStorage ? (
                <div className="flex items-center gap-2 text-[var(--t3)] text-sm py-2">
                  <div className="w-4 h-4 border-2 border-[var(--ac)] border-t-transparent rounded-full animate-spin" />
                  Calcolo spazio occupato…
                </div>
              ) : !storage ? (
                <p className="text-sm text-[var(--t3)]">Impossibile caricare i dati storage.</p>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="h-2 bg-[var(--s3)] rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${usedPct.toFixed(1)}%`, background: storCol }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--t3)]">
                      <span style={{ color: storCol }}>{usedPct.toFixed(1)}% utilizzato</span>
                      <span>{formatBytes(storage.limitBytes - storage.totalBytes)} liberi</span>
                    </div>
                  </div>

                  {/* Galleries list */}
                  {storage.galleries.length === 0 ? (
                    <p className="text-sm text-[var(--t3)] text-center py-4">Nessuna foto caricata su R2 ancora.</p>
                  ) : (
                    <>
                      <p className="text-[10px] font-semibold tracking-[.08em] uppercase text-[var(--t3)] mb-3 flex items-center gap-1.5">
                        <TrendingUp size={11} /> Gallerie per spazio occupato
                      </p>
                      <div className="space-y-2">
                        {storage.galleries.map(g => {
                          const gPct   = (g.bytes / storage.limitBytes) * 100
                          const isDel  = deletingId === g.id
                          const isConf = confirmId === g.id
                          return (
                            <div
                              key={g.id}
                              className="flex items-center gap-3 px-3 py-2.5 bg-[var(--s2)] border border-[var(--b1)] rounded-[var(--r2)]"
                            >
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => router.push(`/gallerie/${g.id}`)}
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[13px] font-medium text-[var(--tx)] truncate">{g.name}</span>
                                  {g.status === 'active' && (
                                    <Badge variant="active">Attiva</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-[var(--s3)] rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${Math.min(gPct * 10, 100)}%`, background: storageColor(gPct * 10) }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-[var(--t3)] shrink-0">{formatBytes(g.bytes)}</span>
                                </div>
                              </div>

                              {isConf ? (
                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    onClick={() => deleteGallery(g.id)}
                                    className="text-[11px] font-medium bg-[rgba(217,112,112,.15)] text-[var(--red)] border border-[rgba(217,112,112,.25)] rounded-md px-2.5 py-1 cursor-pointer hover:bg-[rgba(217,112,112,.25)] transition-colors"
                                  >
                                    Conferma
                                  </button>
                                  <button
                                    onClick={() => setConfirmId(null)}
                                    className="text-[11px] bg-[var(--s3)] text-[var(--t2)] border-none rounded-md px-2.5 py-1 cursor-pointer hover:bg-[var(--s4)] transition-colors"
                                  >
                                    Annulla
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmId(g.id)}
                                  disabled={isDel}
                                  title="Elimina galleria"
                                  className="w-7 h-7 bg-transparent border border-[var(--b1)] rounded-md grid place-items-center text-[var(--t3)] hover:border-[rgba(217,112,112,.4)] hover:text-[var(--red)] transition-all shrink-0 disabled:opacity-40"
                                >
                                  {isDel
                                    ? <div className="w-3 h-3 border border-[var(--red)] border-t-transparent rounded-full animate-spin" />
                                    : <Trash2 size={12} />
                                  }
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>}
          </Card>

        </div>
      </div>
    </>
  )
}

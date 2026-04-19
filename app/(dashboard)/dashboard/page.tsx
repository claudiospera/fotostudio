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
    <div style={{ background: bg, borderRadius: 16, height: 88, padding: '0 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: href ? 'pointer' : 'default' }}>
      <p style={{ fontSize: 30, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: textColor, lineHeight: 1, marginBottom: 5 }}>
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
      style={{ background: bg, borderRadius: 16, height: 88, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
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
  const [ordiniOpen, setOrdiniOpen]   = useState(false)
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
        <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6" style={{ padding: '20px 24px' }}>

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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <KpiCard label="Gallerie attive"    value={loadingStats ? '…' : (stats?.gallerieAttive ?? '—')}   bg="#00BCD4"           href="/gallerie" />
            <KpiCard label="Preventivi aperti"  value={loadingStats ? '…' : (stats?.preventiviAperti ?? '—')} bg="#FF7043"           href="/preventivi" />
            <KpiCard label="Foto totali"        value={loadingStats ? '…' : (stats?.fotoTotali ?? '—')}       bg="#FDD835" textColor="#333" />
          </div>

          {/* ── Azioni rapide ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <QuickAction label="Calendario eventi" href="/preventivi?tab=proposte" bg="#F06292" />
            <QuickAction label="Clienti"            href="/clienti"                bg="#E91E8C" />
            <QuickAction label="Preventivi"         href="/preventivi?tab=templates" bg="#FFB300" textColor="#333" />
          </div>

          {/* ── Sezioni espandibili ─────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

            {/* Ultimi eventi */}
            <button
              onClick={() => setEventiOpen(o => !o)}
              style={{ background: '#26C6DA', borderRadius: 16, height: 88, padding: '0 20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Ultimi eventi</span>
              <ChevronDown size={15} style={{ color: 'rgba(255,255,255,0.8)', transform: eventiOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>

            {/* Ultimi ordini stampe */}
            <button
              onClick={() => setOrdiniOpen(o => !o)}
              style={{ background: '#EF5350', borderRadius: 16, height: 88, padding: '0 20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Ultimi ordini stampe</span>
              <ChevronDown size={15} style={{ color: 'rgba(255,255,255,0.8)', transform: ordiniOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>

            {/* Storage */}
            <button
              onClick={() => setStorageOpen(o => !o)}
              style={{ background: '#AB47BC', borderRadius: 16, height: 88, padding: '0 20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', display: 'block' }}>Storage Cloudflare R2</span>
                {!loadingStorage && storage && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{formatBytes(storage.totalBytes)} / 10 GB</span>
                )}
              </div>
              <ChevronDown size={15} style={{ color: 'rgba(255,255,255,0.8)', transform: storageOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>
          </div>

          {/* Ultimi eventi — contenuto espanso */}
          {eventiOpen && (
            <div style={{ background: 'var(--s1)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 36, background: 'var(--s2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                  <Search size={13} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Cerca galleria…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--tx)', width: '100%' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', lineHeight: 1, padding: 0, fontSize: 14 }}>✕</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px 10px' }}>
                <Link href="/gallerie" style={{ fontSize: 11, color: 'var(--ac)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Vedi tutte <ArrowRight size={11} />
                </Link>
              </div>
              {loadingGalleries ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <div className="w-4 h-4 border-2 border-[var(--ac)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (() => {
                const filtered = galleries.filter(g =>
                  g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (g.type ?? '').toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 10)
                return filtered.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px', color: 'var(--t3)', fontSize: 13 }}>
                    {searchQuery ? 'Nessuna galleria trovata.' : 'Nessuna galleria ancora.'}
                  </p>
                ) : (
                  <div>
                    <div className="hidden sm:grid" style={{ gridTemplateColumns: '1fr 130px 120px 90px', padding: '8px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--s2)' }}>
                      {['Nome galleria', 'Tipo', 'Data evento', 'Stato'].map(h => (
                        <span key={h} style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--t3)' }}>{h}</span>
                      ))}
                    </div>
                    <div>
                      {filtered.map(g => {
                        const statusColor = g.status === 'active' ? 'var(--ac)' : g.status === 'archived' ? 'var(--red)' : 'var(--amber)'
                        const statusLabel = g.status === 'active' ? 'Attiva' : g.status === 'archived' ? 'Archiviata' : 'Bozza'
                        const dateStr = g.date ? new Date(g.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null
                        return (
                          <Link
                            key={g.id}
                            href={`/gallerie/${g.id}`}
                            className="flex flex-col gap-1 sm:grid"
                            style={{ gridTemplateColumns: '1fr 130px 120px 90px', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16 }}>{g.name}</span>
                            <div className="flex items-center gap-2 sm:hidden" style={{ marginTop: 2 }}>
                              {g.type && <span style={{ fontSize: 12, color: 'var(--t2)' }}>{g.type}</span>}
                              {dateStr && <span style={{ fontSize: 12, color: 'var(--t2)' }}>· {dateStr}</span>}
                              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                            </div>
                            <span className="hidden sm:block" style={{ fontSize: 13, color: 'var(--t2)' }}>{g.type ?? '—'}</span>
                            <span className="hidden sm:block" style={{ fontSize: 13, color: 'var(--t2)' }}>{dateStr ?? '—'}</span>
                            <span className="hidden sm:block" style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Ultimi ordini — contenuto espanso */}
          {ordiniOpen && (
            <div style={{ background: 'var(--s1)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px 8px' }}>
                <Link href="/ordini" style={{ fontSize: 11, color: 'var(--ac)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Vedi tutti <ArrowRight size={11} />
                </Link>
              </div>
              {loadingOrders ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <div className="w-4 h-4 border-2 border-[var(--ac)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--t3)', fontSize: 13 }}>Nessun ordine ricevuto</div>
              ) : (
                <div className="divide-y divide-[var(--b1)]">
                  {orders.map(order => (
                    <Link
                      key={order.id}
                      href="/ordini"
                      className="flex items-center gap-3 hover:bg-[var(--s2)] transition-colors"
                      style={{ padding: '12px 20px', textDecoration: 'none' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.client_name ?? 'Cliente anonimo'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                          {order.galleries?.name ?? '—'} · {new Date(order.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Badge variant={order.status === 'nuovo' ? 'danger' : order.status === 'completato' ? 'active' : 'warning'}>
                          {order.status === 'nuovo' ? 'Nuovo' : order.status === 'visto' ? 'Visto' : 'Completato'}
                        </Badge>
                        <span style={{ fontSize: 14, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--tx)' }}>
                          {order.total.toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Storage — contenuto espanso */}
          {storageOpen && (
            <div style={{ background: 'var(--s1)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
              {loadingStorage ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontSize: 13 }}>
                  <div className="w-4 h-4 border-2 border-[var(--ac)] border-t-transparent rounded-full animate-spin" />
                  Calcolo spazio occupato…
                </div>
              ) : !storage ? (
                <p style={{ fontSize: 13, color: 'var(--t3)' }}>Impossibile caricare i dati storage.</p>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ height: 8, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ height: '100%', borderRadius: 99, transition: 'width 0.7s', width: `${usedPct.toFixed(1)}%`, background: storCol }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)' }}>
                      <span style={{ color: storCol }}>{usedPct.toFixed(1)}% utilizzato</span>
                      <span>{formatBytes(storage.limitBytes - storage.totalBytes)} liberi</span>
                    </div>
                  </div>
                  {storage.galleries.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', padding: '16px 0' }}>Nessuna foto caricata su R2 ancora.</p>
                  ) : (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={11} /> Gallerie per spazio occupato
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {storage.galleries.map(g => {
                          const gPct  = (g.bytes / storage.limitBytes) * 100
                          const isDel = deletingId === g.id
                          const isConf = confirmId === g.id
                          return (
                            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--s2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => router.push(`/gallerie/${g.id}`)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                                  {g.status === 'active' && <Badge variant="active">Attiva</Badge>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, height: 4, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(gPct * 10, 100)}%`, background: storageColor(gPct * 10) }} />
                                  </div>
                                  <span style={{ fontSize: 10, color: 'var(--t3)', flexShrink: 0 }}>{formatBytes(g.bytes)}</span>
                                </div>
                              </div>
                              {isConf ? (
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                  <button onClick={() => deleteGallery(g.id)} className="text-[11px] font-medium bg-[rgba(217,112,112,.15)] text-[var(--red)] border border-[rgba(217,112,112,.25)] rounded-md px-2.5 py-1 cursor-pointer hover:bg-[rgba(217,112,112,.25)] transition-colors">Conferma</button>
                                  <button onClick={() => setConfirmId(null)} className="text-[11px] bg-[var(--s3)] text-[var(--t2)] border-none rounded-md px-2.5 py-1 cursor-pointer hover:bg-[var(--s4)] transition-colors">Annulla</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmId(g.id)} disabled={isDel} title="Elimina galleria" className="w-7 h-7 bg-transparent border border-[var(--b1)] rounded-md grid place-items-center text-[var(--t3)] hover:border-[rgba(217,112,112,.4)] hover:text-[var(--red)] transition-all shrink-0 disabled:opacity-40">
                                  {isDel ? <div className="w-3 h-3 border border-[var(--red)] border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
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
            </div>
          )}

        </div>
      </div>
    </>
  )
}

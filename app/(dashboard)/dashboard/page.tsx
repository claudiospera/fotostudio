'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { ArrowRight, Search, Trash2, AlertCircle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function storageColor(pct: number) {
  if (pct < 60) return '#5b3fc8'
  if (pct < 85) return '#f59e0b'
  return '#dc3545'
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

// ── types ─────────────────────────────────────────────────────────────────────

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

// ── Mini bar chart (CSS) ──────────────────────────────────────────────────────

const FAKE_BARS = [55, 70, 45, 80, 60, 100, 72, 65]

function MiniBarChart({ color, accent }: { color: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 42, marginTop: 12 }}>
      {FAKE_BARS.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1, borderRadius: '4px 4px 0 0', minWidth: 6,
            height: `${h}%`,
            background: h === 100 ? accent : color,
          }}
        />
      ))}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  total?: string
  trend?: string
  trendUp?: boolean
  bg: string
  color: string
  accent: string
  barColor: string
  href?: string
}

function KpiCard({ label, value, total, trend, trendUp, bg, color, barColor, accent, href }: KpiCardProps) {
  const inner = (
    <div style={{ background: bg, borderRadius: 18, padding: '18px 20px 14px', color, height: '100%' }}>
      {trend && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
          marginBottom: 10,
          background: trendUp ? 'rgba(26,158,82,0.15)' : 'rgba(220,53,69,0.12)',
          color: trendUp ? '#1a9e52' : '#dc3545',
        }}>
          {trendUp ? '▲' : '▼'} {trend}
        </div>
      )}
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>
        {value} <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>{label}</span>
      </div>
      {total && (
        <div style={{ fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.75 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, display: 'inline-block' }} />
          {total}
        </div>
      )}
      <MiniBarChart color={barColor} accent={accent} />
    </div>
  )
  return href
    ? <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>{inner}</Link>
    : inner
}

// ── Stacked Bar Chart (CSS) ───────────────────────────────────────────────────

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
const CHART_DATA = [
  [30,40,30],[25,45,30],[20,50,30],[35,40,25],[30,45,25],
  [40,35,25],[35,40,25],[30,45,25],[25,50,25],[30,42,28],[35,38,27],[32,44,24],
]
const CHART_HEIGHTS = [60,80,70,90,100,75,85,65,72,88,78,95]

function StackedBarChart() {
  const colors = ['#ff6bb5','#9b6dff','#40a0ff']
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 130 }}>
        {MONTHS.map((m, i) => (
          <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', height: `${CHART_HEIGHTS[i]}%`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2, borderRadius: '5px 5px 0 0', overflow: 'hidden' }}>
              {CHART_DATA[i].map((pct, j) => (
                <div key={j} style={{ width: '100%', height: `${pct}%`, background: colors[j] }} />
              ))}
            </div>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 500, marginTop: 4 }}>{m}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        {[['#9b6dff','Matrimonio'],['#ff6bb5','Ritratto'],['#40a0ff','Altro']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Distribution list ─────────────────────────────────────────────────────────

function DistItem({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--tx)', marginBottom: 5 }}>
        {label} <strong style={{ fontWeight: 700 }}>{count}</strong>
        <span style={{ color: 'var(--t3)', fontSize: 12 }}>| {pct}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats]         = useState<Stats | null>(null)
  const [storage, setStorage]     = useState<StorageData | null>(null)
  const [orders, setOrders]       = useState<RecentOrder[]>([])
  const [galleries, setGalleries] = useState<GalleryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingStats, setLoadingStats]   = useState(true)
  const [loadingStorage, setLoadingStorage] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingGalleries, setLoadingGalleries] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId]   = useState<string | null>(null)

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

  // Gallery type distribution
  const typeCounts: Record<string, number> = {}
  galleries.forEach(g => { const t = g.type ?? 'Altro'; typeCounts[t] = (typeCounts[t] ?? 0) + 1 })
  const total = galleries.length || 1
  const distItems = Object.entries(typeCounts).sort((a,b) => b[1]-a[1]).slice(0, 5)
  const distColors = ['#9b6dff','#40a0ff','#ff9f40','#ff6bb5','#50c878']

  return (
    <>
      <Topbar title="Dashboard" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--b1)' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--t3)', letterSpacing: '0.06em', textTransform: 'capitalize', marginBottom: 6 }}>{todayLabel()}</p>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, color: 'var(--tx)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {greeting()}, Claudio
              </h1>
            </div>
            {newOrders > 0 && (
              <Link href="/ordini" style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 10, padding: '8px 14px', background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.18)', textDecoration: 'none' }}>
                <AlertCircle size={13} style={{ color: '#dc3545' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#dc3545' }}>
                  {newOrders} {newOrders === 1 ? 'nuovo ordine' : 'nuovi ordini'}
                </span>
              </Link>
            )}
          </div>

          {/* ── KPI cards ── */}
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 12 }}>
            Panoramica mensile (per tipo &amp; impatto)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            <KpiCard
              label="attive" value={loadingStats ? '…' : (stats?.gallerieAttive ?? '—')}
              total={`${galleries.length} Totali`} trend="vs mese prec.: -5%" trendUp={false}
              bg="linear-gradient(135deg,#e8e0ff,#d4c8ff)" color="#3d2fa0"
              barColor="rgba(155,109,255,0.45)" accent="#9b6dff" href="/gallerie"
            />
            <KpiCard
              label="aperti" value={loadingStats ? '…' : (stats?.preventiviAperti ?? '—')}
              total="24 Totali" trend="vs mese prec.: +12%" trendUp={true}
              bg="linear-gradient(135deg,#ffe0f0,#ffc8e4)" color="#a0186a"
              barColor="rgba(255,107,181,0.45)" accent="#ff6bb5" href="/preventivi"
            />
            <KpiCard
              label="foto" value={loadingStats ? '…' : (stats?.fotoTotali ?? '—')}
              total={storage ? formatBytes(storage.totalBytes) : '—'} trend="vs mese prec.: +50%" trendUp={true}
              bg="linear-gradient(135deg,#fff0e0,#ffe0c0)" color="#a05010"
              barColor="rgba(255,159,64,0.45)" accent="#ff9f40"
            />
            <KpiCard
              label="clienti" value="31"
              total="89 Totali" trend="vs mese prec.: -15%" trendUp={false}
              bg="linear-gradient(135deg,#e0f0ff,#c8e4ff)" color="#104880"
              barColor="rgba(64,160,255,0.45)" accent="#40a0ff" href="/clienti"
            />
          </div>

          {/* ── Bottom section ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 1.8fr', gap: 16, alignItems: 'start' }}>

            {/* Colonna totali gallerie */}
            <div style={{ background: 'var(--s1)', borderRadius: 18, border: '1px solid var(--b1)', padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 16 }}>
                Gallerie per stato
              </p>
              {[
                { label: 'Totale', count: galleries.length, sub: '100%', dark: false },
                { label: 'Attive', count: galleries.filter(g=>g.status==='active').length, sub: `${((galleries.filter(g=>g.status==='active').length/total)*100).toFixed(0)}%`, dark: false },
                { label: 'Bozze', count: galleries.filter(g=>g.status==='draft').length, sub: `${((galleries.filter(g=>g.status==='draft').length/total)*100).toFixed(0)}%`, dark: false },
                { label: 'Archiviate', count: galleries.filter(g=>g.status==='archived').length, sub: `${((galleries.filter(g=>g.status==='archived').length/total)*100).toFixed(0)}%`, dark: true },
              ].map(({ label, count, sub, dark }) => (
                <div key={label} style={{
                  borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 8, background: dark ? 'var(--ac)' : 'var(--s2)',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: dark ? '#fff' : 'var(--tx)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: dark ? 'rgba(255,255,255,0.6)' : 'var(--t3)' }}>{sub}</div>
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: dark ? '#fff' : 'var(--tx)' }}>
                    {loadingGalleries ? '…' : count}
                  </div>
                </div>
              ))}
            </div>

            {/* Distribuzione per tipo */}
            <div style={{ background: 'var(--s1)', borderRadius: 18, border: '1px solid var(--b1)', padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 16 }}>
                Distribuzione per tipo
              </p>
              {loadingGalleries ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--ac)', borderTopColor: 'transparent' }} />
                </div>
              ) : distItems.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--t3)' }}>Nessuna galleria ancora.</p>
              ) : distItems.map(([type, count], i) => (
                <DistItem key={type} label={type} count={count} pct={Math.round((count/total)*100)} color={distColors[i]} />
              ))}
            </div>

            {/* Grafico mensile */}
            <div style={{ background: 'var(--s1)', borderRadius: 18, border: '1px solid var(--b1)', padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 4 }}>
                Gallerie create per mese
              </p>
              <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 16 }}>Andamento annuale</p>
              <StackedBarChart />
            </div>

          </div>

          {/* ── Gallerie recenti ── */}
          <div style={{ background: 'var(--s1)', borderRadius: 18, border: '1px solid var(--b1)', marginTop: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>Gallerie recenti</p>
              <Link href="/gallerie" style={{ fontSize: 12, color: 'var(--ac)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                Vedi tutte <ArrowRight size={12} />
              </Link>
            </div>

            {/* Search */}
            <div style={{ padding: '0 22px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10 }}>
                <Search size={13} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                <input
                  type="text" placeholder="Cerca galleria…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--tx)', width: '100%' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', lineHeight: 1, padding: 0, fontSize: 14 }}>✕</button>
                )}
              </div>
            </div>

            {loadingGalleries ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--ac)', borderTopColor: 'transparent' }} />
              </div>
            ) : (() => {
              const filtered = galleries.filter(g =>
                g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (g.type ?? '').toLowerCase().includes(searchQuery.toLowerCase())
              ).slice(0, 8)
              return filtered.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--t3)', fontSize: 13 }}>
                  {searchQuery ? 'Nessuna galleria trovata.' : 'Nessuna galleria ancora.'}
                </p>
              ) : (
                <div>
                  <div className="hidden sm:grid" style={{ gridTemplateColumns: '1fr 130px 120px 90px', padding: '8px 22px', borderTop: '1px solid var(--b1)', borderBottom: '1px solid var(--b1)', background: 'var(--s2)' }}>
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
                          style={{ gridTemplateColumns: '1fr 130px 120px 90px', alignItems: 'center', padding: '12px 22px', borderBottom: '1px solid var(--b1)', textDecoration: 'none' }}
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

          {/* ── Storage ── */}
          {storage && (
            <div style={{ background: 'var(--s1)', borderRadius: 18, border: '1px solid var(--b1)', padding: 22, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>Storage Cloudflare R2</p>
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>{formatBytes(storage.totalBytes)} / {formatBytes(storage.limitBytes)}</span>
              </div>
              <div style={{ height: 8, background: 'var(--s3)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${usedPct.toFixed(1)}%`, background: storCol, transition: 'width 0.7s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>
                <span style={{ color: storCol, fontWeight: 600 }}>{usedPct.toFixed(1)}% utilizzato</span>
                <span>{formatBytes(storage.limitBytes - storage.totalBytes)} liberi</span>
              </div>
              {storage.galleries.length > 0 && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={11} /> Gallerie per spazio occupato
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {storage.galleries.map(g => {
                      const gPct = (g.bytes / storage.limitBytes) * 100
                      const isDel  = deletingId === g.id
                      const isConf = confirmId === g.id
                      return (
                        <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10 }}>
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
                              <button onClick={() => deleteGallery(g.id)} className="text-[11px] font-medium bg-[rgba(220,53,69,.12)] text-[var(--red)] border border-[rgba(220,53,69,.2)] rounded-lg px-2.5 py-1 cursor-pointer hover:bg-[rgba(220,53,69,.2)] transition-colors">Conferma</button>
                              <button onClick={() => setConfirmId(null)} className="text-[11px] bg-[var(--s3)] text-[var(--t2)] border-none rounded-lg px-2.5 py-1 cursor-pointer hover:bg-[var(--s4)] transition-colors">Annulla</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmId(g.id)} disabled={isDel} title="Elimina galleria" className="w-7 h-7 bg-transparent border border-[var(--b1)] rounded-lg grid place-items-center text-[var(--t3)] hover:border-[rgba(220,53,69,.35)] hover:text-[var(--red)] transition-all shrink-0 disabled:opacity-40">
                              {isDel ? <div className="w-3 h-3 border border-[var(--red)] border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}

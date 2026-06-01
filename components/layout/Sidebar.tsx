'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui'
import { useClerk } from '@clerk/nextjs'
import {
  LayoutGrid, Images, FileText, Upload, ShoppingCart, LogOut, Plus, Users, BarChart2,
  CalendarCheck, ChevronDown, CalendarDays, ClipboardList, ShoppingBag,
} from 'lucide-react'

// ─── CRM / Gestionale ────────────────────────────────────────────────────────
const gestionaleItems = [
  { href: '/dashboard',                label: 'Dashboard',          icon: LayoutGrid  },
  { href: '/gallerie',                 label: 'Gallerie',            icon: Images      },
  { href: '/clienti',                  label: 'Clienti',             icon: Users       },
  { href: '/preventivi',               label: 'Contratti',           icon: FileText    },
  { href: '/statistiche',              label: 'Statistiche',         icon: BarChart2   },
]

const lavoroItems = [
  { href: '/upload', label: 'Upload clienti', icon: Upload },
]

// ─── Shop admin ───────────────────────────────────────────────────────────────
const shopItems = [
  { href: '/ordini',     label: 'Ordini stampe', icon: ShoppingCart },
  { href: '/shop/admin', label: 'Vai allo shop',  icon: ShoppingBag  },
]

export const Sidebar = () => {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const [newShopOrders, setNewShopOrders] = useState(0)
  const [appuntamentiOpen, setAppuntamentiOpen] = useState(
    () => pathname.startsWith('/appuntamenti')
  )
  const { isSidebarOpen, closeSidebar } = useUIStore()

  useEffect(() => { closeSidebar() }, [pathname, closeSidebar])
  useEffect(() => {
    if (pathname.startsWith('/appuntamenti')) setAppuntamentiOpen(true)
  }, [pathname])
  useEffect(() => {
    if (isSidebarOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isSidebarOpen])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSidebar() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeSidebar])

  // Badge ordini nuovi (galleria + shop)
  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then(r => r.ok ? r.json() : []),
      fetch('/api/shop/orders').then(r => r.ok ? r.json() : []),
    ]).then(([galleryOrders, shopOrders]) => {
      const nuoviGalleria = Array.isArray(galleryOrders) ? galleryOrders.filter((o: { status: string }) => o.status === 'nuovo').length : 0
      const nuoviShop = Array.isArray(shopOrders) ? shopOrders.filter((o: { status: string }) => o.status === 'pending').length : 0
      setNewShopOrders(nuoviGalleria + nuoviShop)
    }).catch(() => {})
  }, [])

  const isActive = (href: string) => {
    if (href === '/shop/admin') return pathname === '/shop/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const NavLink = ({ href, label, icon: Icon, badge = 0 }: {
    href: string; label: string; icon: React.ElementType; badge?: number
  }) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 pl-5 pr-3 rounded-[var(--r2)] mb-1 text-[14px] transition-all duration-150 select-none relative',
          active
            ? 'text-[var(--ac)] font-medium'
            : 'text-[var(--t2)] hover:text-[var(--tx)] hover:bg-[var(--s2)]'
        )}
        style={{ minHeight: 52, ...(active ? { background: 'var(--acd)' } : {}) }}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
            style={{ height: '60%', background: 'var(--ac)' }}
          />
        )}
        <Icon size={17} className={cn('shrink-0', active ? 'opacity-100' : 'opacity-50')} />
        <span className="flex-1 leading-none">{label}</span>
        {badge > 0 && (
          <span className="text-white text-[10px] font-bold rounded-full px-2 py-0.5 leading-none shrink-0" style={{ background: 'var(--red)' }}>
            {badge}
          </span>
        )}
      </Link>
    )
  }

  const isAppuntamentiActive = pathname.startsWith('/appuntamenti')

  return (
    <>
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <aside
        style={{ width: 'var(--sw)' }}
        className={cn(
          'dashboard-sidebar bg-[var(--s1)] border-r border-[var(--b1)] flex flex-col h-screen fixed left-0 top-0 z-50 overflow-hidden',
          isSidebarOpen && 'is-open'
        )}
      >
        {/* Accent line */}
        <div className="h-[2px] w-full shrink-0" style={{ background: 'linear-gradient(90deg, var(--ac) 0%, transparent 80%)', opacity: 0.45 }} />

        {/* Logo */}
        <div className="px-4 py-4 border-b border-[var(--b1)] flex items-center justify-between shrink-0">
          <div style={{ background: '#fff', borderRadius: 8, padding: '5px 10px' }}>
            <Image src="/logo.png" alt="Storie da Raccontare" width={140} height={66} style={{ objectFit: 'contain', display: 'block' }} priority />
          </div>
          <button
            onClick={closeSidebar}
            className="hamburger-btn w-8 h-8 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] place-items-center text-[var(--t3)] hover:text-[var(--tx)] transition-colors"
            aria-label="Chiudi menu"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-2">

          {/* ── GESTIONALE ─────────────────────────────── */}
          <div className="px-4 pt-5 pb-1">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--t3)] px-2 mb-2">
              Gestionale
            </p>
            {gestionaleItems.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} />
            ))}
          </div>

          {/* ── AGENDA (collapsible) ────────────────────── */}
          <div className="px-4 pt-2 pb-1">
            <button
              onClick={() => setAppuntamentiOpen(o => !o)}
              className={cn(
                'w-full flex items-center gap-3 pl-5 pr-3 rounded-[var(--r2)] mb-1 text-[14px] transition-all duration-150 select-none relative',
                isAppuntamentiActive
                  ? 'text-[var(--ac)] font-medium'
                  : 'text-[var(--t2)] hover:text-[var(--tx)] hover:bg-[var(--s2)]'
              )}
              style={{ minHeight: 52, ...(isAppuntamentiActive ? { background: 'var(--acd)' } : {}) }}
            >
              {isAppuntamentiActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full" style={{ height: '60%', background: 'var(--ac)' }} />
              )}
              <CalendarCheck size={17} className={cn('shrink-0', isAppuntamentiActive ? 'opacity-100' : 'opacity-50')} />
              <span className="flex-1 leading-none text-left">Appuntamenti</span>
              <ChevronDown size={14} className={cn('shrink-0 transition-transform duration-200', appuntamentiOpen ? 'rotate-180' : '')} style={{ opacity: 0.5 }} />
            </button>
            {appuntamentiOpen && (
              <div className="ml-4 pl-3 border-l border-[rgba(255,255,255,0.07)] mb-1">
                <NavLink href="/clienti/calendario"        label="Calendario clienti" icon={CalendarDays}  />
                <NavLink href="/appuntamenti/calendari"    label="Calendari booking"  icon={CalendarCheck} />
                <NavLink href="/appuntamenti/prenotazioni" label="Prenotazioni"       icon={ClipboardList} />
              </div>
            )}

            {/* Upload clienti sotto agenda */}
            {lavoroItems.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} />
            ))}
          </div>

          {/* ── SHOP ───────────────────────────────────── */}
          <div className="px-4 pt-4 pb-1 mx-4 mt-3 rounded-xl" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase px-2 mb-2" style={{ color: 'var(--ac)', opacity: 0.7 }}>
              Shop online
            </p>
            <NavLink href="/ordini"      label="Ordini stampe"  icon={ShoppingCart} badge={newShopOrders} />
            <NavLink href="/shop/admin" label="Vai allo shop"  icon={ShoppingBag}  />
          </div>

          {/* ── AZIONI RAPIDE ──────────────────────────── */}
          <div className="px-4 pt-5 pb-1">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--t3)] px-2 mb-2">
              Azioni rapide
            </p>
            {[
              { href: '/gallerie',  label: 'Nuova galleria',   icon: Images    },
              { href: '/preventivi',label: 'Nuovo contratto',  icon: FileText  },
              { href: '/upload',    label: 'Nuovo link upload', icon: Upload   },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 pl-5 pr-3 rounded-[var(--r2)] mb-1 text-[14px] text-[var(--t2)] hover:text-[var(--ac)] hover:bg-[var(--acd)] transition-all duration-150"
                style={{ minHeight: 52 }}
              >
                <Icon size={17} className="shrink-0 opacity-50" />
                <span className="flex-1 leading-none">{label}</span>
                <Plus size={11} className="shrink-0 opacity-30" />
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-4 pb-2 shrink-0 border-t border-[var(--b1)] pt-3">
          <Link
            href="/"
            className="flex items-center gap-2 pl-5 pr-3 rounded-[var(--r2)] text-[13px] text-[var(--t3)] hover:text-[var(--t2)] hover:bg-[var(--s2)] transition-all duration-150 mb-1"
            style={{ minHeight: 40 }}
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
            <span>Torna al sito</span>
          </Link>
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="w-full flex items-center gap-2 pl-5 pr-3 rounded-[var(--r2)] text-[13px] transition-all duration-150 mb-1"
            style={{ minHeight: 40, color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(217,112,112,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={14} className="shrink-0 opacity-70" />
            <span>Esci</span>
          </button>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-t border-[var(--b1)] shrink-0">
          <div
            className="flex items-center gap-3 pl-5 pr-3 rounded-[var(--r2)] hover:bg-[var(--s2)] transition-colors cursor-pointer group"
            style={{ minHeight: 52 }}
            onClick={() => signOut({ redirectUrl: '/' })}
            title="Esci"
          >
            <div
              className="w-8 h-8 rounded-full grid place-items-center font-['Syne'] font-bold text-[12px] shrink-0"
              style={{ background: 'var(--acd)', color: 'var(--ac)', border: '1px solid rgba(125,171,150,.2)' }}
            >
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--tx)] truncate leading-none mb-1">Claudio Spera</p>
              <p className="text-[11px] leading-none" style={{ color: 'var(--ac)', opacity: 0.65 }}>Piano Pro</p>
            </div>
            <LogOut size={14} className="text-[var(--t3)] opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
          </div>
        </div>
      </aside>
    </>
  )
}

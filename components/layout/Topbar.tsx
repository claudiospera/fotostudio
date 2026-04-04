'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Breadcrumb } from './Breadcrumb'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui'

interface TopbarProps {
  actions?: React.ReactNode
  title?: string
}

export const Topbar = ({ actions, title }: TopbarProps) => {
  const pathname = usePathname()
  const openSidebar = useUIStore(s => s.openSidebar)

  return (
    <header
      style={{ height: 'var(--hh)' }}
      className="bg-[var(--s1)] border-b border-[var(--b1)] flex items-center px-4 gap-3 shrink-0 sticky top-0 z-40"
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={openSidebar}
        className="hamburger-btn w-10 h-10 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] place-items-center text-[var(--t2)] hover:text-[var(--tx)] transition-colors shrink-0"
        aria-label="Apri menu"
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <Breadcrumb pathname={pathname} title={title} />

      <div className={cn('flex items-center gap-2 ml-auto')}>
        {actions}
        <button className="w-8 h-8 rounded-[var(--r2)] bg-[var(--s2)] border border-[var(--b1)] grid place-items-center hover:bg-[var(--s3)] hover:border-[var(--b2)] transition-all duration-150 relative" title="Notifiche">
          <Bell size={13} className="text-[var(--t3)]" />
        </button>
      </div>
    </header>
  )
}

'use client'

const routeLabels: Record<string, string> = {
  dashboard:  'Dashboard',
  gallerie:   'Gallerie',
  preventivi: 'Preventivi',
  upload:     'Upload clienti',
}

interface BreadcrumbProps {
  pathname: string
  title?: string
}

export const Breadcrumb = ({ pathname, title }: BreadcrumbProps) => {
  const segments = pathname.split('/').filter(Boolean)

  if (!segments.length) return null

  const first = routeLabels[segments[0]] ?? segments[0]

  if (segments.length === 1) {
    return (
      <nav className="flex items-center gap-1.5">
        <span className="font-['Syne'] font-700 text-sm text-[var(--tx)] tracking-[-0.01em]">{title ?? first}</span>
      </nav>
    )
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-[var(--t3)]">
      <span className="text-[11px]">{first}</span>
      <span className="text-[var(--b3)] text-[11px]">/</span>
      <span className="font-['Syne'] font-700 text-sm text-[var(--tx)] tracking-[-0.01em]">{title ?? segments[segments.length - 1]}</span>
    </nav>
  )
}

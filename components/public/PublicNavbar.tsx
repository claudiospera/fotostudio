// components/public/PublicNavbar.tsx
import Link from 'next/link'

interface PublicNavbarProps {
  bg?: string
  ink?: string
  border?: string
}

const NAV_LINKS = [
  { label: 'Home',                href: '/' },
  { label: 'Servizi Fotografici', href: '/servizi' },
  { label: 'Chi sono',            href: '/chi-sono' },
  { label: 'Contatti',            href: '/contatti' },
]

export function PublicNavbar({ bg = '#F5F0E8', ink = '#1a1612', border = 'rgba(26,22,18,0.12)' }: PublicNavbarProps) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '22px clamp(24px,5vw,64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: bg, borderBottom: `1px solid ${border}`,
    }}>
      <Link href="/" style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontStyle: 'italic', fontWeight: 400,
        fontSize: 'clamp(15px,1.6vw,18px)',
        color: ink, textDecoration: 'none', letterSpacing: '0.01em',
      }}>
        Claudio Spera · Fotografo
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px,2.5vw,36px)' }}>
        {NAV_LINKS.map(({ label, href }) => (
          <Link key={href} href={href} style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: ink, textDecoration: 'none', opacity: 0.7,
          }}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

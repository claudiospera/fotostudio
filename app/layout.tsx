import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const BASE_URL = 'https://storiedaraccontare.it'
const OG_IMAGE  = 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev/images/galleria/matrimoni/real-weddings/FRANCO%20E%20ANTONIO/_DSF8816.jpg'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Storie da Raccontare — Claudio Spera Fotografo',
    template: '%s — Claudio Spera Fotografo',
  },
  description: 'Fotografo di matrimoni, battesimi, ritratti e famiglia a Mirabella Eclano (AV), Campania. Ogni momento merita di essere ricordato per sempre.',
  keywords: [
    'fotografo matrimoni Campania',
    'fotografo Avellino',
    'fotografo Mirabella Eclano',
    'fotografia matrimonio',
    'fotografo battesimi',
    'fotografo ritratti',
    'Claudio Spera fotografo',
    'Storie da Raccontare',
  ],
  authors: [{ name: 'Claudio Spera', url: BASE_URL }],
  creator: 'Claudio Spera',
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: BASE_URL,
    siteName: 'Storie da Raccontare',
    title: 'Storie da Raccontare — Claudio Spera Fotografo',
    description: 'Fotografo di matrimoni, battesimi, ritratti e famiglia a Mirabella Eclano (AV), Campania.',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Claudio Spera Fotografo — Storie da Raccontare' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Storie da Raccontare — Claudio Spera Fotografo',
    description: 'Fotografo di matrimoni, battesimi, ritratti e famiglia a Mirabella Eclano (AV), Campania.',
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="it" className="h-full">
        <body className="h-full">{children}</body>
      </html>
    </ClerkProvider>
  )
}

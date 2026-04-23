import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Storie da Raccontare — Claudio Spera Fotografo',
  description: 'Fotografia di cerimonia, ritratto e famiglia. Ogni momento merita di essere ricordato.',
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

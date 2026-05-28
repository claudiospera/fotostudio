import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contatti — Claudio Spera Fotografo',
  description: 'Scrivimi per informazioni su matrimoni, battesimi, ritratti e tutti i servizi fotografici. Rispondo entro 24 ore.',
  alternates: { canonical: 'https://storiedaraccontare.it/contatti' },
  openGraph: {
    title: 'Contatti — Claudio Spera Fotografo',
    description: 'Scrivimi per informazioni su matrimoni, battesimi, ritratti e tutti i servizi fotografici.',
    url: 'https://storiedaraccontare.it/contatti',
  },
}

export default function ContattiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

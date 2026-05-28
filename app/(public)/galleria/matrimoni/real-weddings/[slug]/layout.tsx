import type { Metadata } from 'next'
import { WEDDINGS } from '../_data'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const wedding = WEDDINGS.find(w => w.slug === slug)
  if (!wedding) return { title: 'Matrimonio — Claudio Spera Fotografo' }

  return {
    title: `${wedding.title} — Matrimonio — Claudio Spera Fotografo`,
    description: `Galleria fotografica del matrimonio di ${wedding.title}${wedding.location ? ` a ${wedding.location}` : ''}${wedding.date ? ` · ${wedding.date}` : ''}. Fotografie di Claudio Spera.`,
    alternates: { canonical: `https://storiedaraccontare.it/galleria/matrimoni/real-weddings/${slug}` },
    openGraph: {
      title: `${wedding.title} — Matrimonio fotografato da Claudio Spera`,
      description: `Sfoglia le fotografie del matrimonio di ${wedding.title}.`,
      url: `https://storiedaraccontare.it/galleria/matrimoni/real-weddings/${slug}`,
      images: [{ url: wedding.cover, width: 1200, height: 630, alt: `Matrimonio ${wedding.title}` }],
    },
  }
}

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

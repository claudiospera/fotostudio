// lib/image-optimize.ts
// Molte foto del sito sono servite da R2 come export originali a piena
// risoluzione (spesso 4-6MB l'una). Invece di un <img src> diretto, le
// instradiamo attraverso l'ottimizzatore immagini di Next.js (ridimensiona
// e converte in WebP/AVIF), così il browser scarica miniature leggere.
//
// Nota: l'endpoint /_next/image accetta solo le width in images.deviceSizes/
// imageSizes e, salvo configurazione esplicita in next.config.ts, solo
// quality=75 — usare SIZES sotto invece di valori arbitrari.
export const SIZES = {
  thumb: 828,   // griglie/card
  hero:  1920,  // foto grande in primo piano (es. prima foto di una galleria)
  full:  2048,  // lightbox / foto a schermo intero
} as const

export function optimizedSrc(url: string, width: number, quality = 75): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`
}

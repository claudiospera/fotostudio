// app/(public)/galleria/matrimoni/real-weddings/_data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Per aggiungere un nuovo matrimonio:
//   1. Crea una cartella: public/images/galleria/matrimoni/real-weddings/[slug]/
//   2. Aggiungi le foto nella cartella (cover.jpg + foto-01.jpg, foto-02.jpg …)
//   3. Aggiungi un oggetto nell'array WEDDINGS qui sotto.
// ─────────────────────────────────────────────────────────────────────────────

export interface Wedding {
  slug:      string
  title:     string
  location?: string
  date?:     string
  cover:     string          // path relativo a /public
  photos:    string[]        // paths relativi a /public, in ordine
}

export const WEDDINGS: Wedding[] = [
  // Esempio — decommenta e personalizza:
  // {
  //   slug:     'lucia-e-marco-avellino-2024',
  //   title:    'Lucia & Marco',
  //   location: 'Avellino',
  //   date:     '2024',
  //   cover:    '/images/galleria/matrimoni/real-weddings/lucia-e-marco-avellino-2024/cover.jpg',
  //   photos: [
  //     '/images/galleria/matrimoni/real-weddings/lucia-e-marco-avellino-2024/foto-01.jpg',
  //     '/images/galleria/matrimoni/real-weddings/lucia-e-marco-avellino-2024/foto-02.jpg',
  //   ],
  // },
]

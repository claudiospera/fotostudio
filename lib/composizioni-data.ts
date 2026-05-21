// lib/composizioni-data.ts
// Dati per le 10 composizioni dimostrative — slot in coordinate % (viewBox 100×70)

export interface Slot {
  x: number  // % della larghezza viewBox (0–100)
  y: number  // % dell'altezza viewBox (0–100)
  w: number  // % larghezza slot
  h: number  // % altezza slot
}

export interface DimensioneOpzione {
  id: string
  label: string       // "3 pannelli da 30×40 cm"
  pareteLabel: string // "Occupa circa 100×40 cm"
}

export interface Composizione {
  id: string
  nome: string
  descrizione: string
  pezzi: number
  materiale: string
  badge?: string
  dimensioni: DimensioneOpzione[]
  slots: Slot[]
  panoramica?: boolean  // se true: un'immagine divisa tra tutti gli slot
}

export const COMPOSIZIONI: Composizione[] = [
  // ── 1. Trittico Verticale ──────────────────────────────────────────────────
  {
    id: 'trittico-verticale',
    nome: 'Trittico Verticale',
    descrizione: 'Tre tele verticali affiancate per un effetto elegante e bilanciato. Ideale per ritratti di coppia o fotografie di matrimonio.',
    pezzi: 3,
    materiale: 'Tela su telaio',
    badge: 'Più venduto',
    dimensioni: [
      { id: '30x40', label: '3 pannelli da 30×40 cm', pareteLabel: 'Occupa circa 100×40 cm' },
      { id: '40x60', label: '3 pannelli da 40×60 cm', pareteLabel: 'Occupa circa 130×60 cm' },
      { id: '50x70', label: '3 pannelli da 50×70 cm', pareteLabel: 'Occupa circa 162×70 cm' },
    ],
    slots: [
      { x: 2.5, y: 5, w: 29, h: 60 },
      { x: 35.5, y: 5, w: 29, h: 60 },
      { x: 68.5, y: 5, w: 29, h: 60 },
    ],
  },

  // ── 2. Quadrittico Scalato ──────────────────────────────────────────────────
  {
    id: 'quadrittico-scalato',
    nome: 'Quadrittico Scalato',
    descrizione: 'Quattro tele verticali di uguale dimensione disposte a scalare. Il ritmo creato rende ogni foto protagonista a turno.',
    pezzi: 4,
    materiale: 'Tela su telaio',
    badge: 'Tendenza',
    dimensioni: [
      { id: '20x60', label: '4 pannelli da 20×60 cm', pareteLabel: 'Occupa circa 92×60 cm' },
    ],
    slots: [
      { x: 4,  y: 22, w: 20, h: 44 },
      { x: 28, y: 5,  w: 20, h: 61 },
      { x: 52, y: 12, w: 20, h: 54 },
      { x: 76, y: 18, w: 20, h: 48 },
    ],
  },

  // ── 3. Gallery Wall 7 pezzi ─────────────────────────────────────────────────
  {
    id: 'gallery-wall-7',
    nome: 'Gallery Wall 7 Pezzi',
    descrizione: 'Composizione asimmetrica con formati misti: grandi, medi e piccoli insieme. La soluzione più ricercata per chi vuole un muro da galleria d\'arte.',
    pezzi: 7,
    materiale: 'Mix tela e cornice',
    badge: 'Perfetto per famiglie',
    dimensioni: [
      {
        id: 'mix-std',
        label: '1×50×50 + 2×40×40 + 2×30×30 + 2×20×20 cm',
        pareteLabel: 'Occupa circa 100×70 cm',
      },
    ],
    slots: [
      { x: 3,  y: 5,  w: 32, h: 34 },   // 50×50 grande
      { x: 38, y: 5,  w: 22, h: 34 },   // 40×40 medio
      { x: 63, y: 5,  w: 34, h: 25 },   // 40×40 medio
      { x: 63, y: 33, w: 34, h: 22 },   // 30×30
      { x: 38, y: 42, w: 22, h: 23 },   // 30×30
      { x: 3,  y: 42, w: 15, h: 23 },   // 20×20 piccolo
      { x: 21, y: 42, w: 15, h: 23 },   // 20×20 piccolo
    ],
  },

  // ── 4. Dittico Orizzontale ──────────────────────────────────────────────────
  {
    id: 'dittico-orizzontale',
    nome: 'Dittico Orizzontale',
    descrizione: 'Due grandi stampe orizzontali affiancate. Perfetto per pareti ampie e fotografie di paesaggio o matrimonio.',
    pezzi: 2,
    materiale: 'Tela su telaio',
    dimensioni: [
      { id: '60x40', label: '2 pannelli da 60×40 cm', pareteLabel: 'Occupa circa 125×40 cm' },
      { id: '80x60', label: '2 pannelli da 80×60 cm', pareteLabel: 'Occupa circa 165×60 cm' },
    ],
    slots: [
      { x: 3,  y: 18, w: 45, h: 34 },
      { x: 52, y: 18, w: 45, h: 34 },
    ],
  },

  // ── 5. L-Shape ──────────────────────────────────────────────────────────────
  {
    id: 'l-shape',
    nome: 'Composizione L-Shape',
    descrizione: 'Una grande tela verticale affiancata da due stampe più piccole impilate. Composizione asimmetrica elegante e originale.',
    pezzi: 3,
    materiale: 'Tela su telaio o Forex',
    badge: 'Design esclusivo',
    dimensioni: [
      { id: 'std', label: '1×60×80 cm + 2×30×40 cm', pareteLabel: 'Occupa circa 95×80 cm' },
    ],
    slots: [
      { x: 3,  y: 5,  w: 54, h: 60 },
      { x: 61, y: 5,  w: 36, h: 27 },
      { x: 61, y: 38, w: 36, h: 27 },
    ],
  },

  // ── 6. Griglia 2×2 ──────────────────────────────────────────────────────────
  {
    id: 'griglia-2x2',
    nome: 'Griglia 2×2',
    descrizione: 'Quattro tele quadrate in griglia perfetta e simmetrica. Lo stile più pulito e moderno, sempre di impatto.',
    pezzi: 4,
    materiale: 'Tela su telaio',
    dimensioni: [
      { id: '30x30', label: '4 pannelli da 30×30 cm', pareteLabel: 'Occupa circa 65×65 cm' },
      { id: '40x40', label: '4 pannelli da 40×40 cm', pareteLabel: 'Occupa circa 85×85 cm' },
    ],
    slots: [
      { x: 8,  y: 3,  w: 38, h: 30 },
      { x: 54, y: 3,  w: 38, h: 30 },
      { x: 8,  y: 37, w: 38, h: 30 },
      { x: 54, y: 37, w: 38, h: 30 },
    ],
  },

  // ── 7. Trittico Orizzontale Impilato ────────────────────────────────────────
  {
    id: 'trittico-impilato',
    nome: 'Trittico Orizzontale Impilato',
    descrizione: 'Tre stampe panoramiche impilate verticalmente. L\'effetto cinematografico che trasforma qualsiasi corridoio o ingresso.',
    pezzi: 3,
    materiale: 'Tela su telaio o Forex',
    dimensioni: [
      { id: '60x20', label: '3 pannelli da 60×20 cm', pareteLabel: 'Occupa circa 60×70 cm' },
    ],
    slots: [
      { x: 5, y: 5,  w: 90, h: 16 },
      { x: 5, y: 27, w: 90, h: 16 },
      { x: 5, y: 49, w: 90, h: 16 },
    ],
  },

  // ── 8. Panoramica Divisa ────────────────────────────────────────────────────
  {
    id: 'panoramica-divisa',
    nome: 'Panoramica Divisa',
    descrizione: 'Un\'unica fotografia panoramica suddivisa su tre tele affiancate. L\'effetto continuità è garantito: sembra un\'unica grande stampa.',
    pezzi: 3,
    materiale: 'Tela su telaio',
    badge: 'Effetto wow',
    panoramica: true,
    dimensioni: [
      { id: '40x60', label: '3 pannelli da 40×60 cm', pareteLabel: 'Occupa circa 125×60 cm' },
    ],
    slots: [
      { x: 2.5,  y: 5, w: 29, h: 60 },
      { x: 35.5, y: 5, w: 29, h: 60 },
      { x: 68.5, y: 5, w: 29, h: 60 },
    ],
  },

  // ── 9. Composizione 5 Pezzi ─────────────────────────────────────────────────
  {
    id: 'composizione-5',
    nome: 'Composizione 5 Pezzi',
    descrizione: 'Una tela centrale grande con quattro piccole stampe agli angoli. Effetto gallery professionale, equilibrio perfetto.',
    pezzi: 5,
    materiale: 'Tela su telaio',
    dimensioni: [
      { id: 'std', label: '1×50×50 cm + 4×20×20 cm', pareteLabel: 'Occupa circa 95×90 cm' },
    ],
    slots: [
      { x: 28, y: 12, w: 44, h: 46 },   // centrale
      { x: 3,  y: 3,  w: 23, h: 8  },   // angolo alto sinistra
      { x: 74, y: 3,  w: 23, h: 8  },   // angolo alto destra
      { x: 3,  y: 59, w: 23, h: 8  },   // angolo basso sinistra
      { x: 74, y: 59, w: 23, h: 8  },   // angolo basso destra
    ],
  },

  // ── 10. Singola Statement XL ────────────────────────────────────────────────
  {
    id: 'singola-xl',
    nome: 'Singola Statement XL',
    descrizione: 'Un\'unica grande tela che diventa il punto focale di tutta la stanza. Semplice, potente, indimenticabile.',
    pezzi: 1,
    materiale: 'Tela su telaio o Forex',
    badge: 'Impatto massimo',
    dimensioni: [
      { id: '80x80',   label: '1 pannello da 80×80 cm',   pareteLabel: 'Occupa circa 80×80 cm'   },
      { id: '100x100', label: '1 pannello da 100×100 cm', pareteLabel: 'Occupa circa 100×100 cm' },
    ],
    slots: [
      { x: 10, y: 5, w: 80, h: 60 },
    ],
  },
]

// lib/composizioni-data.ts
// 30 composizioni multifoto — slot in coordinate % (viewBox 100×70)

export interface Slot {
  x: number  // % della larghezza viewBox (0–100)
  y: number  // % dell'altezza viewBox (0–100)
  w: number  // % larghezza slot
  h: number  // % altezza slot
}

export interface DimensioneOpzione {
  id: string
  label: string       // "3 pannelli da 30×60 cm"
  pareteLabel: string // "Occupa circa 90×60 cm"
}

export interface Composizione {
  id: string
  nome: string
  descrizione: string
  pezzi: number
  materiale: string
  badge?: string
  gruppo: string
  dimensioni: DimensioneOpzione[]
  slots: Slot[]
  panoramica?: boolean
}

export const COMPOSIZIONI: Composizione[] = [

  // ══════════════════════════════════════════════════════
  // GRUPPO A — Formati Speciali 30×60
  // ══════════════════════════════════════════════════════

  {
    id: 'a1-trio-verticale-30x60',
    nome: 'Trio Verticale 30×60',
    descrizione: 'Tre moduli verticali 30×60 affiancati orizzontalmente per un effetto panoramico elegante.',
    pezzi: 3,
    materiale: 'Tela su telaio',
    badge: 'Effetto wow',
    gruppo: 'A — Formati Speciali 30×60',
    dimensioni: [
      { id: 'std', label: '3 × 30×60 cm', pareteLabel: 'Occupa circa 90×60 cm' },
    ],
    // totalW=93, totalH=60, scale≈1.01 → fits in viewBox with 3pt margin
    slots: [
      { x: 3,    y: 5, w: 30, h: 61 },
      { x: 35,   y: 5, w: 30, h: 61 },
      { x: 66.5, y: 5, w: 30, h: 61 },
    ],
  },

  {
    id: 'a2-colonna-30x60',
    nome: 'Colonna 30×60',
    descrizione: 'Tre moduli orizzontali 30×60 sovrapposti verticalmente: una colonna verticale dall\'effetto monumentale.',
    pezzi: 3,
    materiale: 'Tela su telaio o Forex',
    gruppo: 'A — Formati Speciali 30×60',
    dimensioni: [
      { id: 'std', label: '3 × 30×60 cm', pareteLabel: 'Occupa circa 30×180 cm' },
    ],
    // totalW=30, totalH=183 → tall column, scale=0.339
    slots: [
      { x: 44, y: 4,  w: 10, h: 20 },
      { x: 44, y: 25, w: 10, h: 20 },
      { x: 44, y: 46, w: 10, h: 20 },
    ],
  },

  {
    id: 'a3-dittico-quadrato-30x60',
    nome: 'Dittico Quadrato 30×60',
    descrizione: 'Due moduli 30×60 affiancati sul lato lungo formano un perfetto quadrato 60×60 cm.',
    pezzi: 2,
    materiale: 'Tela su telaio',
    gruppo: 'A — Formati Speciali 30×60',
    dimensioni: [
      { id: 'std', label: '2 × 30×60 cm', pareteLabel: 'Occupa circa 60×60 cm' },
    ],
    // totalW=61.5, totalH=60, scale=1.033
    slots: [
      { x: 18, y: 4, w: 31, h: 62 },
      { x: 51, y: 4, w: 31, h: 62 },
    ],
  },

  {
    id: 'a4-griglia-2x2-30x60',
    nome: 'Griglia 2×2 — 30×60',
    descrizione: 'Quattro moduli 30×60 disposti in griglia 2×2 per un insieme verticale di grande impatto.',
    pezzi: 4,
    materiale: 'Tela su telaio',
    gruppo: 'A — Formati Speciali 30×60',
    dimensioni: [
      { id: 'std', label: '4 × 30×60 cm', pareteLabel: 'Occupa circa 60×120 cm' },
    ],
    // totalW=61.5, totalH=121.5, scale=0.51
    slots: [
      { x: 34, y: 4,  w: 15, h: 31 },
      { x: 51, y: 4,  w: 15, h: 31 },
      { x: 34, y: 36, w: 15, h: 31 },
      { x: 51, y: 36, w: 15, h: 31 },
    ],
  },

  {
    id: 'a5-griglia-3x2-30x60',
    nome: 'Griglia 3×2 — 30×60',
    descrizione: 'Sei moduli 30×60 in griglia 3 colonne × 2 righe: composizione massiva da parete principale.',
    pezzi: 6,
    materiale: 'Tela su telaio',
    badge: 'Grande formato',
    gruppo: 'A — Formati Speciali 30×60',
    dimensioni: [
      { id: 'std', label: '6 × 30×60 cm', pareteLabel: 'Occupa circa 90×120 cm' },
    ],
    // totalW=93, totalH=121.5, scale=0.51
    slots: [
      { x: 26, y: 4,  w: 15, h: 31 },
      { x: 43, y: 4,  w: 15, h: 31 },
      { x: 59, y: 4,  w: 15, h: 31 },
      { x: 26, y: 36, w: 15, h: 31 },
      { x: 43, y: 36, w: 15, h: 31 },
      { x: 59, y: 36, w: 15, h: 31 },
    ],
  },

  // ══════════════════════════════════════════════════════
  // GRUPPO B — Dittici (2 Immagini)
  // ══════════════════════════════════════════════════════

  {
    id: 'b1-dittico-20x30',
    nome: 'Dittico 20×30',
    descrizione: 'Due piccoli pannelli verticali affiancati: composizione essenziale, perfetta per un ingresso o comodino.',
    pezzi: 2,
    materiale: 'Stampa con cornice',
    gruppo: 'B — Dittici',
    dimensioni: [
      { id: 'std', label: '2 × 20×30 cm', pareteLabel: 'Occupa circa 40×30 cm' },
    ],
    // totalW=41.5, totalH=30, scale=2.067
    slots: [
      { x: 7,  y: 4, w: 41, h: 62 },
      { x: 51, y: 4, w: 41, h: 62 },
    ],
  },

  {
    id: 'b2-dittico-40x60',
    nome: 'Dittico 40×60',
    descrizione: 'Due grandi pannelli verticali 40×60 affiancati: ideale per fotografie di coppia o ritratti.',
    pezzi: 2,
    materiale: 'Tela su telaio',
    badge: 'Più venduto',
    gruppo: 'B — Dittici',
    dimensioni: [
      { id: 'std', label: '2 × 40×60 cm', pareteLabel: 'Occupa circa 80×60 cm' },
    ],
    // totalW=81.5, totalH=60, scale=1.033
    slots: [
      { x: 8,  y: 4, w: 41, h: 62 },
      { x: 51, y: 4, w: 41, h: 62 },
    ],
  },

  {
    id: 'b3-dittico-quadrato-50x50',
    nome: 'Dittico Quadrato 50×50',
    descrizione: 'Due grandi quadrati 50×50 affiancati: composizione panoramica e bilanciata.',
    pezzi: 2,
    materiale: 'Tela su telaio',
    gruppo: 'B — Dittici',
    dimensioni: [
      { id: 'std', label: '2 × 50×50 cm', pareteLabel: 'Occupa circa 100×50 cm' },
    ],
    // totalW=101.5, totalH=50, scale=0.926
    slots: [
      { x: 3,  y: 12, w: 46, h: 46 },
      { x: 51, y: 12, w: 46, h: 46 },
    ],
  },

  {
    id: 'b4-dittico-orizzontale-sovrapposto',
    nome: 'Dittico Orizzontale',
    descrizione: 'Due pannelli orizzontali 30×20 sovrapposti verticalmente: classico abbinamento per corridor e ingressi.',
    pezzi: 2,
    materiale: 'Stampa con cornice o Forex',
    gruppo: 'B — Dittici',
    dimensioni: [
      { id: 'std', label: '2 × 30×20 cm', pareteLabel: 'Occupa circa 30×40 cm' },
    ],
    // totalW=30, totalH=41.5, scale=1.494
    slots: [
      { x: 28, y: 4,  w: 45, h: 30 },
      { x: 28, y: 36, w: 45, h: 30 },
    ],
  },

  // ══════════════════════════════════════════════════════
  // GRUPPO C — Trittici (3 Immagini)
  // ══════════════════════════════════════════════════════

  {
    id: 'c1-trittico-40x80',
    nome: 'Trittico 40×80',
    descrizione: 'Tre pannelli verticali 40×80 affiancati: composizione monumentale da parete principale.',
    pezzi: 3,
    materiale: 'Tela su telaio',
    badge: 'Grande impatto',
    gruppo: 'C — Trittici',
    dimensioni: [
      { id: 'std', label: '3 × 40×80 cm', pareteLabel: 'Occupa circa 120×80 cm' },
    ],
    // totalW=123, totalH=80, scale=0.764
    slots: [
      { x: 3,  y: 5, w: 31, h: 61 },
      { x: 35, y: 5, w: 31, h: 61 },
      { x: 67, y: 5, w: 31, h: 61 },
    ],
  },

  {
    id: 'c2-trittico-misto-centrale',
    nome: 'Trittico Misto — Centrale',
    descrizione: 'Un pannello centrale 50×70 dominante con due pannelli 35×50 più piccoli ai lati: gerarchico ed elegante.',
    pezzi: 3,
    materiale: 'Tela su telaio',
    badge: 'Design esclusivo',
    gruppo: 'C — Trittici',
    dimensioni: [
      { id: 'std', label: '1×50×70 cm + 2×35×50 cm', pareteLabel: 'Occupa circa 120×70 cm' },
    ],
    // totalW=123, totalH=70, scale=0.764; laterals center-aligned vertically
    slots: [
      { x: 3,  y: 16, w: 27, h: 38 },  // left 35×50, center-aligned
      { x: 31, y: 8,  w: 38, h: 54 },  // center 50×70
      { x: 70, y: 16, w: 27, h: 38 },  // right 35×50, center-aligned
    ],
  },

  {
    id: 'c3-trittico-quadri-40x40',
    nome: 'Trittico Quadri 40×40',
    descrizione: 'Tre quadrati 40×40 affiancati in orizzontale: semplicità geometrica e impatto visivo immediato.',
    pezzi: 3,
    materiale: 'Tela su telaio o Forex',
    gruppo: 'C — Trittici',
    dimensioni: [
      { id: 'std', label: '3 × 40×40 cm', pareteLabel: 'Occupa circa 120×40 cm' },
    ],
    // totalW=123, totalH=40, scale=0.764; centered vertically
    slots: [
      { x: 3,    y: 20, w: 31, h: 31 },
      { x: 35,   y: 20, w: 31, h: 31 },
      { x: 66.5, y: 20, w: 31, h: 31 },
    ],
  },

  {
    id: 'c4-trittico-orizzontale-60x40',
    nome: 'Trittico Orizzontale 60×40',
    descrizione: 'Tre pannelli orizzontali 60×40 sovrapposti in colonna verticale: look cinematografico per corridoi.',
    pezzi: 3,
    materiale: 'Tela su telaio o Forex',
    gruppo: 'C — Trittici',
    dimensioni: [
      { id: 'std', label: '3 × 60×40 cm', pareteLabel: 'Occupa circa 60×120 cm' },
    ],
    // totalW=60, totalH=123, scale=0.504
    slots: [
      { x: 35, y: 4,  w: 30, h: 20 },
      { x: 35, y: 25, w: 30, h: 20 },
      { x: 35, y: 46, w: 30, h: 20 },
    ],
  },

  {
    id: 'c5-trittico-scala-diagonale',
    nome: 'Trittico a Scala Diagonale',
    descrizione: 'Tre pannelli 40×30 disposti a scalare in diagonale: ritmo dinamico che guida lo sguardo.',
    pezzi: 3,
    materiale: 'Stampa con cornice',
    badge: 'Tendenza',
    gruppo: 'C — Trittici',
    dimensioni: [
      { id: 'std', label: '3 × 40×30 cm', pareteLabel: 'Dimensione dinamica ≈ 120×70 cm' },
    ],
    // staggered: each panel offset +20cm right, +15cm down; scale=1.033
    slots: [
      { x: 9,  y: 4,  w: 41, h: 31 },
      { x: 29, y: 20, w: 41, h: 31 },
      { x: 50, y: 36, w: 41, h: 31 },
    ],
  },

  // ══════════════════════════════════════════════════════
  // GRUPPO D — Quadrittici e Griglie (4 Immagini)
  // ══════════════════════════════════════════════════════

  {
    id: 'd1-quadrittico-30x90',
    nome: 'Quadrittico 30×90',
    descrizione: 'Quattro pannelli verticali 30×90 affiancati: composizione verticale di grande presenza.',
    pezzi: 4,
    materiale: 'Tela su telaio',
    gruppo: 'D — Quadrittici e Griglie',
    dimensioni: [
      { id: 'std', label: '4 × 30×90 cm', pareteLabel: 'Occupa circa 120×90 cm' },
    ],
    // totalW=124.5, totalH=90, scale=0.689
    slots: [
      { x: 7,  y: 4, w: 21, h: 62 },
      { x: 29, y: 4, w: 21, h: 62 },
      { x: 51, y: 4, w: 21, h: 62 },
      { x: 73, y: 4, w: 21, h: 62 },
    ],
  },

  {
    id: 'd2-griglia-2x2-30x30',
    nome: 'Griglia 2×2 — 30×30',
    descrizione: 'Quattro quadrati 30×30 in griglia simmetrica: il layout più pulito e moderno.',
    pezzi: 4,
    materiale: 'Tela su telaio',
    badge: 'Classico',
    gruppo: 'D — Quadrittici e Griglie',
    dimensioni: [
      { id: 'std', label: '4 × 30×30 cm', pareteLabel: 'Occupa circa 60×60 cm' },
    ],
    // totalW=61.5, totalH=61.5, scale=1.008
    slots: [
      { x: 19, y: 4,  w: 30, h: 30 },
      { x: 51, y: 4,  w: 30, h: 30 },
      { x: 19, y: 36, w: 30, h: 30 },
      { x: 51, y: 36, w: 30, h: 30 },
    ],
  },

  {
    id: 'd3-griglia-2x2-40x50',
    nome: 'Griglia 2×2 — 40×50',
    descrizione: 'Quattro pannelli rettangolari 40×50 in griglia 2×2: proporzioni verticali in composizione quadrata.',
    pezzi: 4,
    materiale: 'Tela su telaio',
    gruppo: 'D — Quadrittici e Griglie',
    dimensioni: [
      { id: 'std', label: '4 × 40×50 cm', pareteLabel: 'Occupa circa 80×100 cm' },
    ],
    // totalW=81.5, totalH=101.5, scale=0.611
    slots: [
      { x: 25, y: 4,  w: 24, h: 31 },
      { x: 51, y: 4,  w: 24, h: 31 },
      { x: 25, y: 36, w: 24, h: 31 },
      { x: 51, y: 36, w: 24, h: 31 },
    ],
  },

  {
    id: 'd4-layout-finestra',
    nome: 'Layout Finestra',
    descrizione: 'Quattro pannelli 30×30 ravvicinati come i vetri di una finestra: cornici sottili, effetto architettonico.',
    pezzi: 4,
    materiale: 'Stampa con cornice',
    badge: 'Design esclusivo',
    gruppo: 'D — Quadrittici e Griglie',
    dimensioni: [
      { id: 'std', label: '4 × 30×30 cm', pareteLabel: 'Occupa circa 60×60 cm' },
    ],
    // same total as d2 but gap is 0.5cm (window-pane look)
    slots: [
      { x: 17,   y: 4,  w: 32, h: 31 },
      { x: 50.5, y: 4,  w: 32, h: 31 },
      { x: 17,   y: 36, w: 32, h: 31 },
      { x: 50.5, y: 36, w: 32, h: 31 },
    ],
  },

  {
    id: 'd5-layout-asimmetrico-30x60',
    nome: 'Layout Asimmetrico 2+2',
    descrizione: 'Due pannelli verticali 30×60 ai lati e due orizzontali 60×30 al centro: composizione bilanciata ma dinamica.',
    pezzi: 4,
    materiale: 'Tela su telaio o Forex',
    gruppo: 'D — Quadrittici e Griglie',
    dimensioni: [
      { id: 'std', label: '2×30×60 cm + 2×60×30 cm', pareteLabel: 'Occupa circa 120×60 cm' },
    ],
    // totalW=123, totalH=60, scale=0.764
    slots: [
      { x: 3,  y: 12, w: 23, h: 46 },   // left vertical
      { x: 27, y: 12, w: 46, h: 23 },   // top horizontal
      { x: 27, y: 36, w: 46, h: 23 },   // bottom horizontal
      { x: 74, y: 12, w: 23, h: 46 },   // right vertical
    ],
  },

  // ══════════════════════════════════════════════════════
  // GRUPPO E — Layout Complessi (5 Immagini)
  // ══════════════════════════════════════════════════════

  {
    id: 'e1-layout-croce',
    nome: 'Layout a Croce',
    descrizione: 'Un pannello 40×40 centrale con quattro quadrati 20×20 ai lati: composizione a croce, equilibrio perfetto.',
    pezzi: 5,
    materiale: 'Tela su telaio',
    badge: 'Geometrico',
    gruppo: 'E — Layout Complessi',
    dimensioni: [
      { id: 'std', label: '1×40×40 cm + 4×20×20 cm', pareteLabel: 'Dimensione dinamica ≈ 80×80 cm' },
    ],
    // BBox=83×83, scale=0.747, offsetX=19, offsetY=4
    slots: [
      { x: 35, y: 20, w: 30, h: 30 },   // center 40×40
      { x: 35, y: 4,  w: 15, h: 15 },   // top 20×20
      { x: 19, y: 20, w: 15, h: 15 },   // left 20×20
      { x: 66, y: 20, w: 15, h: 15 },   // right 20×20
      { x: 35, y: 51, w: 15, h: 15 },   // bottom 20×20
    ],
  },

  {
    id: 'e2-layout-greco',
    nome: 'Layout Greco',
    descrizione: 'Un pannello orizzontale 60×40 centrale con quattro pannelli verticali 20×30 agli angoli.',
    pezzi: 5,
    materiale: 'Stampa con cornice o Forex',
    gruppo: 'E — Layout Complessi',
    dimensioni: [
      { id: 'std', label: '1×60×40 cm + 4×20×30 cm', pareteLabel: 'Dimensione dinamica ≈ 100×103 cm' },
    ],
    // BBox=103×103, scale=0.602, offsetX=19, offsetY=4
    slots: [
      { x: 32, y: 23, w: 36, h: 24 },   // center 60×40
      { x: 19, y: 4,  w: 12, h: 18 },   // top-left 20×30
      { x: 69, y: 4,  w: 12, h: 18 },   // top-right
      { x: 19, y: 48, w: 12, h: 18 },   // bottom-left
      { x: 69, y: 48, w: 12, h: 18 },   // bottom-right
    ],
  },

  {
    id: 'e3-galleria-lineare-20x50',
    nome: 'Galleria Lineare',
    descrizione: 'Cinque pannelli verticali 20×50 affiancati in fila: ritmo seriale perfetto per corridoi lunghi.',
    pezzi: 5,
    materiale: 'Tela su telaio o Forex',
    gruppo: 'E — Layout Complessi',
    dimensioni: [
      { id: 'std', label: '5 × 20×50 cm', pareteLabel: 'Occupa circa 100×50 cm' },
    ],
    // totalW=106, totalH=50, scale=0.887, offsetX=3, offsetY=13
    slots: [
      { x: 3,  y: 13, w: 18, h: 44 },
      { x: 22, y: 13, w: 18, h: 44 },
      { x: 41, y: 13, w: 18, h: 44 },
      { x: 60, y: 13, w: 18, h: 44 },
      { x: 79, y: 13, w: 18, h: 44 },
    ],
  },

  {
    id: 'e4-layout-fumetto',
    nome: 'Layout Fumetto',
    descrizione: 'Tre pannelli 30×40 in alto e due grandi 45×30 in basso: composizione narrativa come le vignette di un fumetto.',
    pezzi: 5,
    materiale: 'Stampa con cornice',
    badge: 'Tendenza',
    gruppo: 'E — Layout Complessi',
    dimensioni: [
      { id: 'std', label: '3×30×40 cm + 2×45×30 cm', pareteLabel: 'Occupa circa 90×70 cm' },
    ],
    // totalW=93, totalH=71.5, scale=0.867, offsetX=10, offsetY=4
    slots: [
      { x: 10, y: 4,  w: 26, h: 35 },   // top-left 30×40
      { x: 37, y: 4,  w: 26, h: 35 },   // top-mid
      { x: 64, y: 4,  w: 26, h: 35 },   // top-right
      { x: 11, y: 40, w: 39, h: 26 },   // bottom-left 45×30
      { x: 51, y: 40, w: 39, h: 26 },   // bottom-right
    ],
  },

  {
    id: 'e5-piramide',
    nome: 'Piramide',
    descrizione: 'Due pannelli 45×30 in alto centrati e tre quadrati 30×30 come base: composizione piramidale bilanciata.',
    pezzi: 5,
    materiale: 'Tela su telaio',
    gruppo: 'E — Layout Complessi',
    dimensioni: [
      { id: 'std', label: '2×45×30 cm + 3×30×30 cm', pareteLabel: 'Dimensione dinamica ≈ 90×60 cm' },
    ],
    // totalW=93, totalH=61.5, scale=1.008, offsetX=3, offsetY=4
    slots: [
      { x: 3,  y: 4,  w: 45, h: 30 },   // top-left 45×30
      { x: 50, y: 4,  w: 45, h: 30 },   // top-right 45×30
      { x: 3,  y: 36, w: 30, h: 30 },   // base-left 30×30
      { x: 35, y: 36, w: 30, h: 30 },   // base-mid
      { x: 66, y: 36, w: 30, h: 30 },   // base-right
    ],
  },

  // ══════════════════════════════════════════════════════
  // GRUPPO F — Massimo Output (6 Immagini)
  // ══════════════════════════════════════════════════════

  {
    id: 'f1-griglia-3x2-30x40',
    nome: 'Griglia 3×2 — 30×40',
    descrizione: 'Sei pannelli verticali 30×40 in griglia 3 colonne × 2 righe: gallery wall compatta e professionale.',
    pezzi: 6,
    materiale: 'Tela su telaio',
    badge: 'Gallery wall',
    gruppo: 'F — Massimo Output',
    dimensioni: [
      { id: 'std', label: '6 × 30×40 cm', pareteLabel: 'Occupa circa 90×80 cm' },
    ],
    // totalW=93, totalH=81.5, scale=0.761, offsetX=15, offsetY=4
    slots: [
      { x: 15, y: 4,  w: 23, h: 30 },
      { x: 39, y: 4,  w: 23, h: 30 },
      { x: 63, y: 4,  w: 23, h: 30 },
      { x: 15, y: 36, w: 23, h: 30 },
      { x: 39, y: 36, w: 23, h: 30 },
      { x: 63, y: 36, w: 23, h: 30 },
    ],
  },

  {
    id: 'f2-griglia-2x3-40x30',
    nome: 'Griglia 2×3 — 40×30',
    descrizione: 'Sei pannelli orizzontali 40×30 in griglia 2 colonne × 3 righe: composizione verticale densa.',
    pezzi: 6,
    materiale: 'Tela su telaio o Forex',
    gruppo: 'F — Massimo Output',
    dimensioni: [
      { id: 'std', label: '6 × 40×30 cm', pareteLabel: 'Occupa circa 80×90 cm' },
    ],
    // totalW=81.5, totalH=93, scale=0.667, offsetX=23, offsetY=4
    slots: [
      { x: 23, y: 4,  w: 27, h: 20 },
      { x: 51, y: 4,  w: 27, h: 20 },
      { x: 23, y: 25, w: 27, h: 20 },
      { x: 51, y: 25, w: 27, h: 20 },
      { x: 23, y: 46, w: 27, h: 20 },
      { x: 51, y: 46, w: 27, h: 20 },
    ],
  },

  {
    id: 'f3-panorama-spezzato-20x60',
    nome: 'Panorama Spezzato',
    descrizione: "Un'unica foto panoramica divisa su sei pannelli 20×60 affiancati: effetto continuità su tutta la parete.",
    pezzi: 6,
    materiale: 'Tela su telaio',
    badge: 'Effetto wow',
    panoramica: true,
    gruppo: 'F — Massimo Output',
    dimensioni: [
      { id: 'std', label: '6 × 20×60 cm', pareteLabel: 'Occupa circa 120×60 cm' },
    ],
    // totalW=127.5, totalH=60, scale=0.737, offsetX=3, offsetY=13
    slots: [
      { x: 3,  y: 13, w: 15, h: 44 },
      { x: 19, y: 13, w: 15, h: 44 },
      { x: 35, y: 13, w: 15, h: 44 },
      { x: 51, y: 13, w: 15, h: 44 },
      { x: 67, y: 13, w: 15, h: 44 },
      { x: 83, y: 13, w: 15, h: 44 },
    ],
  },

  {
    id: 'f4-nido-dape',
    nome: "Nido d'Ape",
    descrizione: 'Due quadrati 40×40 al centro affiancati da quattro pannelli verticali 20×40 ai lati: composizione densa e modulare.',
    pezzi: 6,
    materiale: 'Tela su telaio',
    gruppo: 'F — Massimo Output',
    dimensioni: [
      { id: 'std', label: '2×40×40 cm + 4×20×40 cm', pareteLabel: 'Dimensione dinamica ≈ 100×80 cm' },
    ],
    // 3 cols: [20×40 | 40×40 | 20×40] with 2 rows each, totalW=83, totalH=81.5, scale=0.761, offsetX=18, offsetY=4
    slots: [
      { x: 35, y: 4,  w: 30, h: 30 },   // center top 40×40
      { x: 35, y: 36, w: 30, h: 30 },   // center bot 40×40
      { x: 18, y: 4,  w: 15, h: 30 },   // left top 20×40
      { x: 18, y: 36, w: 15, h: 30 },   // left bot 20×40
      { x: 66, y: 4,  w: 15, h: 30 },   // right top 20×40
      { x: 66, y: 36, w: 15, h: 30 },   // right bot 20×40
    ],
  },

  {
    id: 'f5-griglia-quadrata-3x2-20x20',
    nome: 'Griglia Quadrata 3×2',
    descrizione: 'Sei quadrati 20×20 in griglia 3×2: composizione minimalista e ordinata, perfetta per piccoli formati.',
    pezzi: 6,
    materiale: 'Stampa con cornice',
    gruppo: 'F — Massimo Output',
    dimensioni: [
      { id: 'std', label: '6 × 20×20 cm', pareteLabel: 'Occupa circa 60×40 cm' },
    ],
    // totalW=63, totalH=41.5, scale=1.492, offsetX=3, offsetY=4
    slots: [
      { x: 3,  y: 4,  w: 30, h: 30 },
      { x: 35, y: 4,  w: 30, h: 30 },
      { x: 67, y: 4,  w: 30, h: 30 },
      { x: 3,  y: 36, w: 30, h: 30 },
      { x: 35, y: 36, w: 30, h: 30 },
      { x: 67, y: 36, w: 30, h: 30 },
    ],
  },

  {
    id: 'f6-layout-cinema',
    nome: 'Layout Cinema',
    descrizione: 'Sei pannelli orizzontali 30×20 su due file da tre: come una pellicola cinematografica, sequenziale ed evocativo.',
    pezzi: 6,
    materiale: 'Stampa con cornice o Forex',
    badge: 'Narrativo',
    gruppo: 'F — Massimo Output',
    dimensioni: [
      { id: 'std', label: '6 × 30×20 cm', pareteLabel: 'Occupa circa 90×40 cm' },
    ],
    // totalW=93, totalH=41.5, scale=1.011, offsetX=3, offsetY=14
    slots: [
      { x: 3,  y: 14, w: 30, h: 20 },
      { x: 35, y: 14, w: 30, h: 20 },
      { x: 67, y: 14, w: 30, h: 20 },
      { x: 3,  y: 36, w: 30, h: 20 },
      { x: 35, y: 36, w: 30, h: 20 },
      { x: 67, y: 36, w: 30, h: 20 },
    ],
  },
]

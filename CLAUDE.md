# CLAUDE.md — FotoStudio CRM

> Questo file guida Claude Code su architettura, convenzioni e priorità del progetto.
> Aggiornalo ogni volta che aggiungi una feature significativa o cambi una convenzione.

---

## 🎯 Cos'è questo progetto

**FotoStudio** è un CRM per fotografi professionisti, ispirato a [upyourshoot.com](https://upyourshoot.com).
Permette al fotografo di gestire gallerie clienti, preventivi, upload foto e condivisioni — tutto da un'unica dashboard.

**Stato attuale:** prototipo funzionante in HTML/CSS/JS vanilla con localStorage.
**Obiettivo:** migrare a Next.js + Supabase per avere un prodotto reale, deployabile e scalabile.

---

## 🏗 Stack tecnologico

### Attuale (prototipo)
- HTML5 + CSS custom properties
- JavaScript vanilla (ES2022)
- localStorage per la persistenza
- Font: `Syne` (titoli) + `DM Sans` (corpo) — da Google Fonts

### Target (produzione)
```
Frontend       Next.js 14+ (App Router) + TypeScript
Styling        Tailwind CSS + shadcn/ui
Database       Supabase (PostgreSQL)
Storage        Supabase Storage (foto) + Cloudflare R2 (backup)
Auth           Supabase Auth (fotografo + portale clienti)
Email          Resend (credenziali, notifiche, link upload)
Deploy         Vercel
```

---

## 🎨 Design system

### Palette colori
```css
--bg:    #111210   /* sfondo principale */
--s1:    #1a1c1a   /* surface livello 1 (sidebar, card) */
--s2:    #222422   /* surface livello 2 (input, blocchi interni) */
--s3:    #2c2e2c   /* surface livello 3 (hover, active) */
--s4:    #363836   /* surface livello 4 (bordi forti) */

--tx:    #eeecea   /* testo principale */
--t2:    #9a9890   /* testo secondario */
--t3:    #616460   /* testo terziario / label */

--ac:    #8ec9b0   /* accent verde salvia (CTA primari) */
--ac2:   #b2ddc8   /* accent chiaro (hover) */
--acd:   rgba(142,201,176,0.14)  /* accent dim (bg badge attivo) */

--red:   #d97070   /* errori / elimina */
--amber: #c9a05a   /* warning / bozza */
```

### Tipografia
- **Titoli / heading:** `Syne` — weight 700–800, letter-spacing: -0.02em
- **Corpo / UI:** `DM Sans` — weight 300–500
- **Codice / link tecnici:** monospace system font

### Border radius
- `--r: 12px` — card, modal, blocchi principali
- `--r2: 8px` — bottoni, input, badge, elementi piccoli

### Regole di stile
- Tema **sempre dark** — non esiste light mode
- Bordi sottili: `rgba(255,255,255,0.06)` normale, `0.11` hover, `0.18` focus
- Animazioni: `slideUp` (0.3s ease) per card, `fadeIn` (0.2s) per page transition
- Scrollbar: larghezza 3px, colore `var(--s4)`
- **Non usare mai** Inter, Roboto, Arial o gradients purple-on-white

---

## 📁 Struttura cartelle (target Next.js)

```
fotostudio/
├── CLAUDE.md                    ← questo file
├── app/
│   ├── layout.tsx               ← font, metadata, providers globali
│   ├── page.tsx                 ← redirect a /dashboard
│   ├── (dashboard)/             ← route group con sidebar
│   │   ├── layout.tsx           ← Sidebar + Topbar wrapper
│   │   ├── dashboard/page.tsx
│   │   ├── gallerie/
│   │   │   ├── page.tsx         ← lista gallerie
│   │   │   └── [id]/
│   │   │       ├── page.tsx     ← dettaglio galleria
│   │   │       └── [tab]/       ← cover | foto | impostazioni | workflow | condivisioni
│   │   ├── preventivi/page.tsx
│   │   └── upload/page.tsx
│   ├── (cliente)/               ← portale clienti separato (no sidebar)
│   │   └── [token]/page.tsx     ← accesso con link privato
│   └── api/
│       ├── galleries/route.ts
│       ├── photos/route.ts
│       ├── preventivi/route.ts
│       ├── upload-links/route.ts
│       └── send-credentials/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── Breadcrumb.tsx
│   ├── gallery/
│   │   ├── GalleryCard.tsx
│   │   ├── GalleryGrid.tsx
│   │   ├── GalleryFilters.tsx
│   │   └── tabs/
│   │       ├── CoverTab.tsx
│   │       ├── PhotosTab.tsx
│   │       ├── SettingsTab.tsx
│   │       ├── WorkflowTab.tsx
│   │       └── SharingTab.tsx
│   ├── preventivi/
│   │   ├── PreventivoTable.tsx
│   │   ├── PreventivoModal.tsx
│   │   └── PreventivoRow.tsx
│   ├── upload/
│   │   ├── UploadLinkCard.tsx
│   │   └── PortalPreview.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Toggle.tsx
│       ├── Badge.tsx
│       ├── Toast.tsx
│       ├── Lightbox.tsx
│       ├── DropZone.tsx
│       └── KpiCard.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            ← createBrowserClient
│   │   ├── server.ts            ← createServerClient
│   │   └── middleware.ts
│   ├── types.ts                 ← tutti i tipi TypeScript
│   ├── utils.ts                 ← uid(), formatDate(), slugify()
│   └── constants.ts             ← SERVICE_TYPES, STATUS_OPTIONS, ecc.
├── hooks/
│   ├── useGalleries.ts
│   ├── usePreventivi.ts
│   └── useUploadLinks.ts
├── store/
│   └── ui.ts                    ← Zustand per stato UI (modal aperti, tab attivi)
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    └── seed.sql
```

---

## 🗄 Schema database (Supabase)

```sql
-- Utenti (gestito da Supabase Auth)
-- auth.users → id, email, created_at

-- Profilo fotografo
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id),
  name        text,
  studio_name text,
  plan        text DEFAULT 'free',  -- 'free' | 'pro' | 'professional'
  created_at  timestamptz DEFAULT now()
);

-- Gallerie
CREATE TABLE galleries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  subtitle    text,
  type        text,               -- 'Matrimonio' | 'Ritratto' | ecc.
  date        date,
  status      text DEFAULT 'draft', -- 'active' | 'draft' | 'archived'
  cover_color text DEFAULT '#2a3830',
  settings    jsonb DEFAULT '{}', -- preferiti, commenti, watermark, ecc.
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Foto (riferimenti a Supabase Storage)
CREATE TABLE photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE,
  storage_path text NOT NULL,     -- path in Supabase Storage
  url         text,               -- URL pubblico CDN
  filename    text,
  size_bytes  bigint,
  width       int,
  height      int,
  order_index int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Clienti ospiti per galleria
CREATE TABLE gallery_clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text NOT NULL,
  password_hash text,             -- gestito lato server
  active      boolean DEFAULT true,
  favorites   int DEFAULT 0,
  comments    int DEFAULT 0,
  orders      int DEFAULT 0,
  last_access timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- Timeline giornata (dentro gallery)
CREATE TABLE timeline_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE,
  time        time NOT NULL,
  label       text NOT NULL,
  order_index int DEFAULT 0
);

-- Preventivi
CREATE TABLE preventivi (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  gallery_id  uuid REFERENCES galleries(id) ON DELETE SET NULL,
  cliente     text NOT NULL,
  email       text,
  servizio    text,
  data_evento date,
  voci        jsonb DEFAULT '[]',  -- [{desc, prezzo}]
  totale      numeric DEFAULT 0,
  stato       text DEFAULT 'bozza', -- 'bozza' | 'inviato' | 'accettato' | 'rifiutato'
  note        text,
  created_at  timestamptz DEFAULT now()
);

-- Link upload clienti
CREATE TABLE upload_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  gallery_id  uuid REFERENCES galleries(id) ON DELETE SET NULL,
  nome        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  expires_at  timestamptz,
  max_photos  int,                -- NULL = illimitato
  uploads     int DEFAULT 0,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
```

---

## 📦 Tipi TypeScript principali

```typescript
// lib/types.ts

export type GalleryStatus = 'active' | 'draft' | 'archived'
export type PreventivoStato = 'bozza' | 'inviato' | 'accettato' | 'rifiutato'
export type ServiceType = 'Matrimonio' | 'Ritratto' | 'Famiglia' | 'Moda / Editorial' | 'Corporate' | 'Evento' | 'Newborn'

export interface Gallery {
  id: string
  user_id: string
  name: string
  subtitle?: string
  type?: ServiceType
  date?: string
  status: GalleryStatus
  cover_color?: string
  settings?: GallerySettings
  created_at: string
  updated_at: string
  // relazioni
  photos?: Photo[]
  clients?: GalleryClient[]
  timeline?: TimelineItem[]
}

export interface GallerySettings {
  preferiti: boolean
  commenti: boolean
  social: boolean
  servizio_stampa: boolean
  download_singolo: boolean
  download_hd: boolean
  download_zip: boolean
  watermark: boolean
  nome_file: boolean
  pagamenti: {
    negozio: boolean
    paypal: boolean
    bonifico: boolean
  }
}

export interface Photo {
  id: string
  gallery_id: string
  storage_path: string
  url: string
  filename: string
  size_bytes?: number
  width?: number
  height?: number
  order_index: number
  created_at: string
}

export interface GalleryClient {
  id: string
  gallery_id: string
  name: string
  email: string
  active: boolean
  favorites: number
  comments: number
  orders: number
  last_access?: string
  created_at: string
}

export interface TimelineItem {
  id: string
  gallery_id: string
  time: string       // "HH:MM"
  label: string
  order_index: number
}

export interface Preventivo {
  id: string
  user_id: string
  gallery_id?: string
  cliente: string
  email?: string
  servizio?: ServiceType
  data_evento?: string
  voci: VocePreventivo[]
  totale: number
  stato: PreventivoStato
  note?: string
  created_at: string
}

export interface VocePreventivo {
  desc: string
  prezzo: number
}

export interface UploadLink {
  id: string
  user_id: string
  gallery_id?: string
  nome: string
  slug: string
  expires_at?: string
  max_photos?: number
  uploads: number
  active: boolean
  created_at: string
  // join
  gallery?: Pick<Gallery, 'id' | 'name'>
}
```

---

## 🔄 Convenzioni di codice

### Generali
- **Lingua:** commenti e nomi variabili in inglese, UI e stringhe utente in **italiano**
- **TypeScript:** strict mode attivo, no `any` espliciti
- **Componenti:** sempre functional components con arrow function
- **Naming:**
  - Componenti → PascalCase (`GalleryCard.tsx`)
  - Hook → camelCase con prefisso `use` (`useGalleries.ts`)
  - Utils → camelCase (`formatDate`, `slugify`)
  - Tipi/interfacce → PascalCase (`Gallery`, `GallerySettings`)
  - Costanti → SCREAMING_SNAKE_CASE (`SERVICE_TYPES`)

### Componenti React
```tsx
// ✅ CORRETTO
interface GalleryCardProps {
  gallery: Gallery
  onClick: (id: string) => void
  onDelete: (id: string) => void
}

export const GalleryCard = ({ gallery, onClick, onDelete }: GalleryCardProps) => {
  return (...)
}

// ❌ SBAGLIATO — no default export su componenti shared
export default function GalleryCard() { ... }
```

### Chiamate Supabase
```typescript
// ✅ Sempre gestire l'errore
const { data, error } = await supabase
  .from('galleries')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

if (error) throw new Error(`Errore fetch gallerie: ${error.message}`)

// ✅ Usare il tipo ritornato
const { data: gallery } = await supabase
  .from('galleries')
  .select('*, photos(*), clients:gallery_clients(*)')
  .eq('id', id)
  .single<Gallery>()
```

### API Routes (Next.js)
```typescript
// app/api/galleries/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  // ...
}
```

---

## 🚀 Comandi utili

```bash
# Sviluppo
npm run dev              # avvia Next.js su localhost:3000

# Database
npx supabase start       # avvia Supabase locale (Docker)
npx supabase db push     # applica le migrations
npx supabase db reset    # reset DB + seed

# Tipi Supabase (rigenera dopo modifiche schema)
npx supabase gen types typescript --local > lib/supabase/database.types.ts

# Build e deploy
npm run build            # build produzione
vercel deploy            # deploy su Vercel
vercel deploy --prod     # deploy su produzione
```

---

## 📋 Feature implementate (prototipo HTML)

| Feature | Stato prototipo | Da migrare |
|---------|----------------|------------|
| Dashboard con KPI | ✅ Funzionante | Dati reali da DB |
| Lista gallerie (grid/list) | ✅ Funzionante | Query Supabase |
| Filtri e ricerca gallerie | ✅ Funzionante | Server-side filtering |
| Dettaglio galleria | ✅ Funzionante | Route dinamica |
| Tab Cover con preview | ✅ Funzionante | Salvataggio su DB |
| Tab Foto / Upload | ✅ base64 locale | Supabase Storage |
| Tab Impostazioni galleria | ✅ Toggle UI | Persistenza jsonb |
| Tab Flusso di lavoro | ✅ Funzionante | Timeline su DB |
| Tab Condivisioni / Clienti | ✅ Funzionante | Auth clienti reale |
| Preventivi CRUD | ✅ Funzionante | Tabella Supabase |
| Portale Upload Link | ✅ Funzionante | Upload reale |
| Lightbox foto | ✅ Funzionante | Mantenere |
| Toast notifiche | ✅ Funzionante | Sostituire con sonner |

---

## 📋 Feature da costruire (non ancora nel prototipo)

| Feature | Priorità | Note |
|---------|----------|------|
| Autenticazione fotografo | 🔴 Alta | Supabase Auth, email/password |
| Portale clienti (`/cliente/[token]`) | 🔴 Alta | Accesso con link privato |
| Upload foto reale | 🔴 Alta | Supabase Storage, progress bar |
| Email automatiche | 🟡 Media | Resend — credenziali, notifiche |
| Statistiche con grafici | 🟡 Media | Recharts — visite, download, preferiti |
| Sezione Appuntamenti | 🟡 Media | Calendario (react-big-calendar) |
| Sezione Clienti / Anagrafica | 🟡 Media | CRM base con storico |
| Watermark automatico | 🟠 Bassa | Sharp.js su API route |
| Servizio stampa / shop | 🟠 Bassa | Stripe integration |
| App mobile (PWA) | 🟠 Bassa | next-pwa |

---

## ⚠️ Regole importanti per Claude Code

1. **Non rompere mai il design system** — usa sempre le CSS variables definite sopra. Non introdurre nuovi colori senza aggiornarli qui.

2. **Ogni componente deve avere i suoi tipi** — nessun `any`, nessuna prop senza tipo esplicito.

3. **Supabase client lato server nelle API routes, browser client nei componenti** — non mixare mai i due.

4. **Le foto NON vanno mai in base64 nel database** — devono andare in Supabase Storage. Il DB salva solo l'URL.

5. **Tutte le stringhe UI in italiano** — nomi di campi, messaggi di errore, label, placeholder.

6. **Proteggere sempre le API routes con auth check** — ogni route deve verificare `supabase.auth.getUser()` prima di fare qualsiasi query.

7. **Componenti UI riutilizzabili in `/components/ui/`** — Button, Modal, Toggle, Badge non vanno riscritti inline nei componenti pagina.

8. **Il prototipo HTML (`fotogramas-dashboard.html`) è la fonte di verità per design e UX** — qualsiasi dubbio su come deve apparire qualcosa, guarda lì.

---

## 🔧 Variabili d'ambiente necessarie

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # solo lato server, non esporre mai

RESEND_API_KEY=                   # per le email
NEXT_PUBLIC_APP_URL=              # es. https://fotostudio.vercel.app

# Opzionale
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
```

---

## 📞 Contesto progetto

- **Sviluppatore:** Claudio (Napoli)
- **Lingua del codice:** inglese
- **Lingua UI:** italiano
- **Ispirazione:** [upyourshoot.com](https://upyourshoot.com)
- **Obiettivo:** strumento professionale per fotografi italiani

---

*Ultimo aggiornamento: Marzo 2026 — versione prototipo HTML completata, inizio migrazione Next.js*

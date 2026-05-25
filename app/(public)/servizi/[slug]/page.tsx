// app/(public)/servizi/[slug]/page.tsx

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import GalleryLightbox from './GalleryLightbox'

// ─── Dati servizi ─────────────────────────────────────────────────────────────

const R2 = 'https://pub-53356d483eb74822990977c0e5c21f6c.r2.dev'

interface Categoria {
  nome: string
  href: string
  cover?: string
}

interface ServizioData {
  nome: string
  location: string
  quote: string
  descrizione: string
  include: string[]
  cover?: string
  gallery?: string[]
  categorie?: Categoria[]
}

const SERVIZI: Record<string, ServizioData> = {
  'matrimoni': {
    nome: 'Matrimoni',
    location: 'Campania · e dintorni',
    quote: 'Ogni matrimonio porta con se una luce che non assomiglia a nessun\'altra.',
    descrizione: 'Racconto il vostro matrimonio come una storia scritta insieme, fotogramma dopo fotogramma. Emozioni autentiche: lo sguardo che si incrocia prima del si, il tremore delle mani, le lacrime che scappano prima del previsto. Lavoro in Campania e dintorni, disponibile a seguirvi ovunque la vostra storia vi porti. Ogni report e unico, ogni album e un libro che racconta esattamente la vostra giornata.',
    include: [
      'Sopralluogo e consulenza pre-matrimonio',
      'Copertura dell\'intera giornata',
      'Preparativi sposi (entrambi)',
      'Cerimonia civile o religiosa',
      'Servizio esterno e ricevimento',
      'Gallery digitale ad alta risoluzione',
      'Selezione e post-produzione delle immagini',
      'Album fotografico professionale (su richiesta)',
      'Consegna entro 60 giorni',
      'Secondo fotografo (su richiesta)',
    ],
  },
  'battesimi-prima-infanzia': {
    nome: 'Battesimi, Compleanni e Feste',
    location: 'Studio · Esterno',
    quote: 'I primi giorni, le prime ore. Il tempo non aspetta, ma le fotografie si.',
    categorie: [
      { nome: 'Battesimi',  href: '/servizi/battesimi-prima-infanzia/battesimi',  cover: undefined },
      { nome: 'Compleanni', href: '/servizi/battesimi-prima-infanzia/compleanni', cover: undefined },
      { nome: 'Smash Cake', href: '/servizi/battesimi-prima-infanzia/smash-cake', cover: undefined },
    ],
    descrizione: 'I primi mesi di vita scorrono in fretta. Fotografare un neonato significa fermare un tempo che non tornera: la piccola mano che stringe un dito, il respiro tranquillo, i tratti ancora morbidi. Per il battesimo seguo la cerimonia in chiesa, le emozioni dei genitori, il momento del Sacramento, e poi la festa con la famiglia. In studio creo un ambiente caldo e sicuro, adatto ai bambini piccolissimi, con luce naturale o artificiale morbida.',
    include: [
      'Sessione in studio o esterno',
      'Servizio battesimo completo (chiesa + ricevimento)',
      'Newborn session (0-20 giorni)',
      'Sessione bambini 0-12 mesi',
      'Gallery digitale ad alta risoluzione',
      'Selezione e post-produzione delle immagini',
      'Stampe e prodotti fotografici (su richiesta)',
      'Ambiente studio attrezzato e sicuro',
      'Consulenza pre-sessione',
      'Consegna entro 30 giorni',
    ],
  },
  'comunioni-cresime': {
    nome: 'Comunioni & Cresime',
    location: 'Chiesa · Ricevimento',
    quote: 'Un passo importante nella vita di un bambino, un ricordo per tutta la famiglia.',
    descrizione: 'La Prima Comunione e la Cresima sono momenti carichi di significato, non solo religioso ma familiare. Seguo il bambino o il ragazzo durante tutta la giornata: dalla preparazione mattutina alla cerimonia in chiesa, fino al pranzo o cena con la famiglia. L\'approccio e discreto durante il rito sacro, piu coinvolto nei momenti di festa. Il risultato e un racconto completo, con le emozioni dei protagonisti e quelle di chi li circonda.',
    include: [
      'Preparativi mattutini',
      'Cerimonia in chiesa completa',
      'Servizio esterno post-cerimonia',
      'Pranzo o cena con la famiglia',
      'Gallery digitale ad alta risoluzione',
      'Selezione e post-produzione delle immagini',
      'Stampe e prodotti fotografici (su richiesta)',
      'Album fotografico professionale (su richiesta)',
      'Consulenza pre-evento',
      'Consegna entro 30 giorni',
    ],
  },
  'maternita-gravidanza': {
    nome: 'Maternità',
    location: 'Studio · Natura',
    quote: 'Il corpo che accoglie. La luce che trasforma. Un momento che dura per sempre.',
    descrizione: 'La gravidanza e una delle forme piu belle della femminilita. Ogni sessione e pensata per valorizzare il corpo della donna in attesa, con una luce calda, ambienti naturali o di studio, e un approccio rispettoso e delicato. Il momento ideale per la sessione e tra la 28a e la 34a settimana, quando il pancione e tondo e ben visibile ma la mobilita e ancora buona. Posso includere il partner e i bambini gia nati per un ritratto di famiglia in attesa.',
    cover: `${R2}/images/servizi/maternita/gallery/DSCF0224.jpg`,
    gallery: [
      ...['DSCF0127', 'DSCF0176', 'DSCF0184', 'DSCF0207', 'DSCF0224',
        'DSCF0243', 'DSCF0252', 'DSCF0273', 'DSCF1067h', 'DSCF1127',
        'DSCF1256', 'DSCF1259', 'DSCF1310', 'DSCF4857', 'DSCF4869',
        'DSCF4882', 'DSCF4918', 'DSCF5363', 'DSCF5369',
      ].map(n => `${R2}/images/servizi/maternita/gallery/${n}.jpg`),
      `${R2}/images/servizi/maternita/gallery/hf_20260505_141929_c2f37b6c-93c1-4fcd-ad3b-d9f5dfab2dcb.png`,
      `${R2}/images/servizi/maternita/gallery/hf_20260505_143559_a8fd24f8-790f-41b3-b6ad-768e0c15e922.png`,
      `${R2}/images/servizi/maternita/gallery/hf_20260525_190153_fd6244af-c468-4707-ae56-4242cde14e0d%20copia.png`,
      `${R2}/images/servizi/maternita/gallery/hf_20260525_190357_f1cfb640-c185-442d-aeda-281311adb458.png`,
      `${R2}/images/servizi/maternita/gallery/hf_20260525_190509_8ec04632-e58f-4ca1-8160-be8c273a19bf.png`,
      `${R2}/images/servizi/maternita/gallery/hf_20260525_191720_5d1ff886-38a5-493e-89a4-ba98b1192df2.png`,
    ],
    include: [
      'Sessione in studio o in natura',
      'Consulenza pre-sessione su abiti e location',
      'Fino a 2 ore di ripresa',
      'Inclusione del partner e dei fratellini (opzionale)',
      'Gallery digitale ad alta risoluzione',
      'Selezione e post-produzione delle immagini',
      'Stampe fine art (su richiesta)',
      'Consigli su mise e ambientazione',
      'Consegna entro 21 giorni',
    ],
  },
  'compleanni-feste': {
    nome: '18 Anni',
    location: 'Location · Esterno',
    quote: 'La festa e un\'emozione collettiva. Il compito del fotografo e non farla sfuggire.',
    descrizione: 'Ogni compleanno e una storia a se: un primo anno di vita, un diciottesimo spensierato, un cinquantesimo pieno di gratitudine. Arrivo prima che inizino gli ospiti, seguo l\'allestimento, il taglio della torta, le risate, i brindisi. Mi muovo in modo discreto tra le persone, senza organizzare pose artificiali, per restituire la vera atmosfera della giornata. Sono disponibile per feste private, eventi in location, garden party e ricevimenti.',
    include: [
      'Copertura dell\'intero evento',
      'Servizio pre-evento (allestimento e preparativi)',
      'Fotografie degli ospiti e dei momenti salienti',
      'Taglio della torta e brindisi',
      'Gallery digitale ad alta risoluzione',
      'Selezione e post-produzione delle immagini',
      'Stampe e prodotti fotografici (su richiesta)',
      'Disponibile anche in orario serale',
      'Consulenza pre-evento',
      'Consegna entro 21 giorni',
    ],
  },
  'ritratti-famiglie': {
    nome: 'Ritratti & Famiglie',
    location: 'Studio · Esterno',
    quote: 'Un ritratto onesto dice piu di mille parole. Una fotografia di famiglia racconta chi siamo.',
    descrizione: 'Il ritratto e l\'essenza della fotografia: guardare una persona negli occhi e trovare il momento in cui si lascia vedere davvero. Lavoro sia in studio, con luce controllata e sfondi neutri, sia in esterno, sfruttando la luce naturale e le location significative per il cliente. Per le famiglie propongo sessioni informali, in cui i bambini giocano e gli adulti interagiscono liberamente, per fotografie spontanee e autentiche.',
    include: [
      'Sessione in studio o esterno',
      'Fino a 90 minuti di ripresa',
      'Famiglie fino a 6 persone (aggiuntivi su richiesta)',
      'Consulenza pre-sessione su location e abbigliamento',
      'Gallery digitale ad alta risoluzione',
      'Selezione e post-produzione delle immagini',
      'Stampe fine art e canvas (su richiesta)',
      'Ritratti individuali, di coppia o familiari',
      'Sessioni aziendali e professionali',
      'Consegna entro 14 giorni',
    ],
  },
}

// ─── Metadata dinamici ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = SERVIZI[slug]
  if (!s) return { title: 'Servizio non trovato' }
  return {
    title: `${s.nome} — Claudio Spera Fotografo`,
    description: s.descrizione.slice(0, 155) + '...',
  }
}

export function generateStaticParams() {
  return Object.keys(SERVIZI).map(slug => ({ slug }))
}

// ─── Costanti stile ───────────────────────────────────────────────────────────

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const GOLD   = '#C9A96E'
const SAGE   = '#7D9B76'
const BORDER = 'rgba(26,22,18,0.12)'

// ─── Pagina ───────────────────────────────────────────────────────────────────

export default async function ServizioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const servizio = SERVIZI[slug]
  if (!servizio) notFound()

  const cols = 3
  const rows = Math.ceil(servizio.include.length / cols)

  return (
    <div style={{ background: BG, minHeight: '100vh', color: INK }}>

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '22px clamp(24px,5vw,64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: BG, borderBottom: `1px solid ${BORDER}`,
      }}>
        <Link href="/" style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(15px,1.6vw,18px)',
          color: INK, textDecoration: 'none',
        }}>
          Claudio Spera · Fotografo
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(20px,3vw,40px)' }}>
          {['Servizi', 'Chi sono', 'Contatti'].map(label => (
            <Link key={label} href={`/${label.toLowerCase().replace(' ', '-')}`} style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: INK, textDecoration: 'none', opacity: 0.7,
            }}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── BACK LINK ──────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 'calc(64px + clamp(24px,4vw,48px))', paddingLeft: 'clamp(24px,5vw,64px)' }}>
        <Link href="/#servizi" style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: INK, opacity: 0.5, textDecoration: 'none',
        }}>
          &larr; Tutti i servizi
        </Link>
      </div>

      {/* ── HERO IMMAGINE ──────────────────────────────────────────────────── */}
      <section style={{
        margin: 'clamp(24px,3vw,40px) clamp(24px,5vw,64px) 0',
        position: 'relative',
        aspectRatio: '16/7',
        background: 'rgba(26,22,18,0.08)',
        overflow: 'hidden',
      }}>
        {servizio.cover && (
          <img src={servizio.cover} alt="" style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
          }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(26,22,18,0.72) 0%, rgba(26,22,18,0.18) 55%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 'clamp(24px,3vw,40px)', left: 'clamp(24px,3vw,40px)',
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontWeight: 400,
            fontSize: 'clamp(28px,4vw,48px)',
            color: '#F5F0E8', lineHeight: 1.1,
          }}>
            {servizio.nome}
          </div>
          <div style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#F5F0E8', opacity: 0.6, marginTop: 8,
          }}>
            {servizio.location}
          </div>
        </div>
      </section>

      {/* ── INTRO 2 COLONNE ────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(56px,8vw,100px) clamp(24px,5vw,64px)',
        display: 'grid',
        gridTemplateColumns: '3px 1fr',
        gap: 'clamp(32px,4vw,64px)',
      }}>
        <div style={{ width: 3, background: GOLD, alignSelf: 'stretch', minHeight: 80 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontWeight: 400,
            fontSize: 'clamp(18px,2.2vw,24px)',
            color: INK, lineHeight: 1.5,
          }}>
            {servizio.quote}
          </div>
          <div style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: 13, lineHeight: 1.85, color: INK, opacity: 0.75,
            maxWidth: 660,
          }}>
            {servizio.descrizione}
          </div>
        </div>
      </section>

      {/* ── CATEGORIE ─────────────────────────────────────────────────────── */}
      {servizio.categorie && (
        <section style={{
          padding: '0 clamp(24px,5vw,64px) clamp(56px,8vw,96px)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${servizio.categorie.length}, 1fr)`,
            gap: 'clamp(16px,3vw,40px)',
            alignItems: 'end',
          }}>
            {servizio.categorie.map((cat, i) => (
              <Link key={cat.href} href={cat.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article>
                  <div style={{
                    aspectRatio: '3/4',
                    background: 'rgba(26,22,18,0.07)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    marginBottom: 18,
                    position: 'relative',
                    marginTop: i === 0 ? 'clamp(24px,6vw,80px)' : 0,
                  }}>
                    {cat.cover && (
                      <img
                        src={cat.cover}
                        alt={cat.nome}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s ease' }}
                      />
                    )}
                  </div>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontStyle: 'italic', fontWeight: 400,
                    fontSize: 'clamp(20px,2.2vw,28px)',
                    color: INK, letterSpacing: '0.01em',
                  }}>
                    {cat.nome}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── GALLERIA COMPLETA ─────────────────────────────────────────────── */}
      {servizio.gallery && <GalleryLightbox photos={servizio.gallery} />}

      {/* ── IL SERVIZIO COMPRENDE ──────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(64px,8vw,100px) clamp(24px,5vw,64px)',
      }}>
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 400,
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: SAGE, marginBottom: 'clamp(28px,4vw,48px)',
        }}>
          Il servizio comprende
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          border: `1px solid ${BORDER}`,
        }}>
          {servizio.include.map((voce, i) => {
            const col = i % cols
            const row = Math.floor(i / cols)
            const isLastRow = row === rows - 1
            const isLastCol = col === cols - 1
            return (
              <div key={i} style={{
                padding: 'clamp(18px,2vw,28px) clamp(20px,2.5vw,32px)',
                borderRight: !isLastCol ? `1px solid ${BORDER}` : 'none',
                borderBottom: !isLastRow ? `1px solid ${BORDER}` : 'none',
              }}>
                <div style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300,
                  fontSize: 'clamp(11px,1.1vw,13px)', lineHeight: 1.7,
                  color: INK, opacity: 0.8,
                }}>
                  {voce}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section style={{
        borderTop: `1px solid ${BORDER}`,
        padding: 'clamp(56px,8vw,96px) clamp(24px,5vw,64px)',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(28px,4vw,42px)',
          color: INK, lineHeight: 1.15,
        }}>
          Hai una storia da raccontare?
        </div>
        <Link href="/contatti" style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          background: INK, color: BG,
          padding: '14px 36px',
          textDecoration: 'none', display: 'inline-block',
        }}>
          Richiedi disponibilita
        </Link>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        padding: '24px clamp(24px,5vw,64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>
          &copy; {new Date().getFullYear()} Claudio Spera &middot; Fotografo
        </span>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>
          Mirabella Eclano, Avellino
        </span>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          nav > div:last-child { display: none !important; }
        }
        @media (max-width: 700px) {
          .pub-includes { grid-template-columns: 1fr !important; }
          .pub-gallery  { grid-template-columns: 1fr !important; grid-template-rows: auto !important; }
          .pub-gallery > div:first-child { grid-row: auto !important; }
        }
      `}</style>
    </div>
  )
}

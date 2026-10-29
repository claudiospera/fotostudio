// app/shop/termini-e-condizioni/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'
import { SHIPPING_FEE, ISLAND_SHIPPING_SURCHARGE, FREE_SHIPPING_THRESHOLD } from '@/lib/shop/shipping'

export const metadata: Metadata = {
  title: 'Termini e Condizioni — Storie da Raccontare',
  description: 'Condizioni generali di vendita del negozio online Storie da Raccontare.',
}

function euro(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

export default function TerminiPage() {
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) clamp(20px, 5vw, 48px)' }}>

        <nav style={{ fontSize: '12px', color: '#999', marginBottom: 32, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link href="/shop" style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a' }}>Termini e Condizioni</span>
        </nav>

        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 36px)', color: '#0a0a0a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Termini e Condizioni di Vendita
        </h1>
        <p style={{ fontSize: '13px', color: '#999', marginBottom: 48 }}>
          Ultimo aggiornamento: ottobre 2026 — ai sensi del D.Lgs. 206/2005 (Codice del Consumo)
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section title="1. Venditore">
            <ul>
              <li><strong>Claudio Spera</strong> — fotografo professionista</li>
              <li>Sede: Via Pianopantano snc, 83036 Mirabella Eclano (AV)</li>
              <li>P.IVA: 02766080648</li>
              <li>Email: <a href="mailto:info@claudiospera.com" style={{ color: '#00c1de' }}>info@claudiospera.com</a></li>
              <li>Tel: <a href="tel:+393897855581" style={{ color: '#00c1de' }}>+39 389 785 5581</a></li>
            </ul>
          </Section>

          <Section title="2. Prodotti e personalizzazione">
            <p>
              I prodotti offerti (stampe fotografiche, decorazioni, gadget) sono <strong>personalizzati</strong>
              con le foto fornite dal cliente al momento dell'ordine. Ogni prodotto viene realizzato
              su misura dopo la conferma del pagamento.
            </p>
            <p>
              Le immagini dei prodotti mostrate sul sito sono indicative. I colori reali possono
              variare leggermente in base alla calibrazione del monitor.
            </p>
          </Section>

          <Section title="3. Prezzi">
            <p>
              Tutti i prezzi sono espressi in euro e sono <strong>IVA inclusa</strong> ove applicabile.
              Le spese di spedizione non sono incluse nel prezzo del prodotto: il <strong>ritiro in
              studio è gratuito</strong>, mentre la <strong>spedizione a domicilio</strong> tramite
              corriere ha un costo fisso di <strong>{euro(SHIPPING_FEE)}</strong> ed è{' '}
              <strong>gratuita per ordini superiori a {euro(FREE_SHIPPING_THRESHOLD)}</strong>
              (calcolati sul subtotale dopo eventuali sconti). Per le spedizioni in{' '}
              <strong>Sicilia e Sardegna</strong> si applica un supplemento fisso di{' '}
              <strong>{euro(ISLAND_SHIPPING_SURCHARGE)}</strong>, non coperto dalla soglia di
              spedizione gratuita. Per le isole minori (es. Elba, Capri, Ischia, Pantelleria)
              potremmo contattarti per un supplemento ulteriore, da concordare in base al
              corriere disponibile.
            </p>
            <p>
              Ci riserviamo il diritto di modificare i prezzi in qualsiasi momento. Il prezzo
              applicato all'ordine è quello indicato al momento dell'acquisto.
            </p>
          </Section>

          <Section title="4. Conclusione del contratto">
            <p>
              L'ordine si intende concluso nel momento in cui il cliente visualizza la{' '}
              <strong>pagina di conferma d'ordine</strong> sul sito al termine del pagamento
              (o della conferma, per il pagamento in studio), dove sono riepilogati i dati
              dell&apos;ordine. Prima di tale momento il venditore può rifiutare l'ordine in caso di
              indisponibilità del servizio, errori di prezzo manifesti o sospetto di frode.
            </p>
          </Section>

          <Section title="5. Pagamento">
            <p>
              Accettiamo i seguenti metodi di pagamento:
            </p>
            <ul>
              <li><strong>Carta di credito / debito</strong> — tramite Stripe (sicuro, nessun dato carta viene salvato sui nostri server)</li>
              <li><strong>Pagamento in studio</strong> — contanti o POS al momento del ritiro, disponibile solo scegliendo il <strong>ritiro in studio</strong> come modalità di consegna</li>
            </ul>
            <p>
              Con la <strong>spedizione a domicilio</strong> è disponibile solo il pagamento online.
              Il pagamento online viene elaborato da <strong>Stripe Inc.</strong>, certificata PCI DSS.
            </p>
          </Section>

          <Section title="6. Produzione e tempi di consegna">
            <p>
              Ogni prodotto è realizzato <strong>artigianalmente</strong>, a mano, dopo la
              conferma del pagamento. Lo studio è chiuso il <strong>lunedì</strong>, il{' '}
              <strong>sabato</strong> e la <strong>domenica</strong>: i &ldquo;giorni
              lavorativi&rdquo; indicati in questa sezione vanno quindi dal martedì al venerdì,
              esclusi i giorni festivi.
            </p>
            <p>
              La produzione richiede fino a <strong>7 giorni lavorativi</strong> dalla conferma
              del pagamento. Per gli ordini con <strong>spedizione a domicilio</strong>, a questo
              tempo va sommato il transito del corriere: considera fino a{' '}
              <strong>una settimana aggiuntiva</strong> dalla spedizione alla consegna.
              I tempi possono variare durante periodi di alta stagione (Natale, San Valentino).
              Riceverai una notifica quando l'ordine è pronto o quando viene spedito.
            </p>
          </Section>

          <Section title="7. Ritiro in studio e spedizione">
            <p>
              Gli ordini possono essere ritirati presso lo studio di Mirabella Eclano (AV)
              previo appuntamento, oppure spediti all'indirizzo indicato al checkout.
              La spedizione avviene tramite corriere espresso con tracking.
            </p>
            <p>
              Il rischio di perdita o danneggiamento dei prodotti passa al cliente nel momento
              in cui il cliente, o un terzo da lui designato e diverso dal corriere, acquisisce
              il possesso fisico dei beni (art. 63 Codice del Consumo). Se invece è il cliente a
              scegliere, al momento del checkout, un corriere diverso da quelli da noi proposti,
              il rischio passa al cliente già al momento della consegna del prodotto a tale corriere.
            </p>
          </Section>

          <Section title="8. Diritto di recesso — Eccezione per prodotti personalizzati">
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}>
              <strong>⚠️ Importante:</strong> I prodotti personalizzati con le foto del cliente
              (stampe, decorazioni, gadget) sono <strong>esclusi dal diritto di recesso</strong>
              ai sensi dell'art. 59, comma 1, lett. c) del D.Lgs. 206/2005, in quanto realizzati
              su specifiche del consumatore o chiaramente personalizzati.
            </div>
            <p>
              Fanno eccezione i prodotti standard non personalizzati (es. prodotti senza foto),
              per i quali il diritto di recesso di 14 giorni si applica normalmente.
              Per maggiori dettagli consulta la nostra pagina{' '}
              <Link href="/shop/diritto-di-recesso" style={{ color: '#00c1de' }}>Diritto di Recesso</Link>.
            </p>
          </Section>

          <Section title="9. Difetti e reclami">
            <p>
              In caso di prodotto difettoso o non conforme all'ordine (errore di stampa, danno
              da spedizione), contattaci entro <strong>7 giorni</strong> dalla ricezione all'indirizzo
              <a href="mailto:info@claudiospera.com" style={{ color: '#00c1de' }}> info@claudiospera.com</a> allegando
              fotografie del difetto. Provvederemo alla ristampa o al rimborso senza costi aggiuntivi.
            </p>
            <p>
              La garanzia legale di conformità si applica ai sensi degli artt. 128–135 del
              D.Lgs. 206/2005.
            </p>
          </Section>

          <Section title="10. Proprietà intellettuale delle foto">
            <p>
              Il cliente dichiara di essere titolare dei diritti sulle foto caricate o di aver
              ottenuto le necessarie autorizzazioni dalle persone ritratte. Il cliente solleva
              il venditore da qualsiasi responsabilità per violazioni di diritti di terzi.
            </p>
            <p>
              Il venditore non rivendica alcun diritto sulle foto caricate e non le utilizzerà
              per scopi diversi dalla produzione dell'ordine.
            </p>
          </Section>

          <Section title="11. Limitazione di responsabilità">
            <p>
              Il venditore non è responsabile per ritardi causati da forza maggiore, scioperi
              di corrieri o eventi eccezionali. In tali casi provvederemo a informare il cliente
              tempestivamente.
            </p>
          </Section>

          <Section title="12. Legge applicabile e foro competente">
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per eventuali controversie
              con consumatori il foro competente è quello del luogo di residenza del consumatore,
              ai sensi dell'art. 66-bis del D.Lgs. 206/2005.
            </p>
            <p>
              Per la risoluzione alternativa delle controversie (ODR) è disponibile la piattaforma
              europea:{' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#00c1de' }}>
                ec.europa.eu/consumers/odr
              </a>
            </p>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', color: '#0a0a0a', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #e8e8e8' }}>
        {title}
      </h2>
      <div style={{ fontSize: '14px', color: '#444', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  )
}

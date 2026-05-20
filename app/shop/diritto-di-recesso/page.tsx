// app/shop/diritto-di-recesso/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Diritto di Recesso — Storie da Raccontare',
  description: 'Informazioni sul diritto di recesso per gli acquisti online.',
}

export default function DirittoRecesaoPage() {
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) clamp(20px, 5vw, 48px)' }}>

        <nav style={{ fontSize: '12px', color: '#999', marginBottom: 32, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link href="/shop" style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a' }}>Diritto di Recesso</span>
        </nav>

        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 36px)', color: '#0a0a0a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Diritto di Recesso
        </h1>
        <p style={{ fontSize: '13px', color: '#999', marginBottom: 48 }}>
          Ai sensi degli artt. 52–59 del D.Lgs. 206/2005 (Codice del Consumo)
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '15px', color: '#856404', marginBottom: 8 }}>
              ⚠️ Attenzione — Prodotti personalizzati esclusi
            </p>
            <p style={{ fontSize: '14px', color: '#856404', lineHeight: 1.7 }}>
              La quasi totalità dei prodotti venduti su questo shop è realizzata su misura con le foto
              del cliente. Questi prodotti sono <strong>esclusi dal diritto di recesso</strong> ai
              sensi dell'art. 59, comma 1, lett. c) del D.Lgs. 206/2005.
            </p>
          </div>

          <Section title="Prodotti esclusi dal recesso">
            <p>Non è possibile esercitare il diritto di recesso per:</p>
            <ul>
              <li>Stampe Instax / Polaroid personalizzate con foto del cliente</li>
              <li>Stampe classiche e poster con foto del cliente</li>
              <li>Stampe Hahnemühle Fine Art con foto del cliente</li>
              <li>Pannelli Forex personalizzati</li>
              <li>Stampe su tela personalizzate</li>
              <li>Cornici con stampa personalizzata</li>
              <li>Qualsiasi prodotto realizzato su specifiche del consumatore</li>
            </ul>
            <p>
              <strong>Motivazione legale:</strong> L'art. 59, comma 1, lett. c) del D.Lgs. 206/2005
              esclude il diritto di recesso per i &quot;beni confezionati su misura o chiaramente personalizzati&quot;.
              La produzione di questi articoli inizia immediatamente dopo la conferma del pagamento
              e non è possibile reindirizzarli ad altri clienti.
            </p>
          </Section>

          <Section title="Prodotti per i quali il recesso è ammesso">
            <p>
              Per eventuali prodotti standard <strong>non personalizzati</strong> il consumatore
              ha diritto di recedere dal contratto entro <strong>14 giorni</strong> dalla ricezione
              del prodotto, senza necessità di fornire alcuna motivazione.
            </p>
          </Section>

          <Section title="Come esercitare il recesso (per prodotti standard)">
            <p>Per esercitare il diritto di recesso è necessario comunicarlo prima della scadenza
            dei 14 giorni tramite:</p>
            <ul>
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:info@claudiospera.com" style={{ color: '#00c1de' }}>info@claudiospera.com</a>
                {' '}con oggetto &quot;Recesso ordine #[numero ordine]&quot;
              </li>
              <li>
                <strong>Raccomandata A/R:</strong> Claudio Spera, Via Pianopantano snc,
                83036 Mirabella Eclano (AV)
              </li>
            </ul>
            <p>
              Il prodotto deve essere restituito entro 14 giorni dalla comunicazione del recesso,
              in condizioni originali e imballaggio integro. Le spese di restituzione sono a carico
              del consumatore, salvo diverso accordo.
            </p>
          </Section>

          <Section title="Rimborso">
            <p>
              In caso di recesso legittimamente esercitato, il rimborso dell'intero importo
              (incluse le spese di consegna originarie) avverrà entro <strong>14 giorni</strong>
              dal ricevimento della merce restituita, tramite lo stesso metodo di pagamento
              utilizzato per l'acquisto.
            </p>
          </Section>

          <Section title="Prodotti difettosi">
            <p>
              La disciplina del recesso è distinta dalla garanzia per difetti di conformità.
              Se hai ricevuto un prodotto difettoso o non conforme all'ordine, hai diritto alla
              ristampa o al rimborso indipendentemente dall'esclusione dal recesso.
              Contattaci entro 7 giorni dalla ricezione a{' '}
              <a href="mailto:info@claudiospera.com" style={{ color: '#00c1de' }}>info@claudiospera.com</a>.
            </p>
          </Section>

          <Section title="Modulo di recesso (facoltativo)">
            <p>
              Puoi utilizzare il seguente modulo standard (non obbligatorio — è sufficiente
              qualsiasi comunicazione chiara):
            </p>
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.8, color: '#555' }}>
              <p>Destinatario: Claudio Spera — info@claudiospera.com</p>
              <p>Con la presente notifico il recesso dal contratto di vendita del seguente bene:</p>
              <p>— Ordine n. ________________</p>
              <p>— Ordinato il: ________________ / Ricevuto il: ________________</p>
              <p>— Nome consumatore: ________________</p>
              <p>— Indirizzo consumatore: ________________</p>
              <p>— Firma (solo se comunicato su carta): ________________</p>
              <p>— Data: ________________</p>
            </div>
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

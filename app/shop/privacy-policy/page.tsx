// app/shop/privacy-policy/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Storie da Raccontare',
  description: 'Informativa sul trattamento dei dati personali ai sensi del GDPR.',
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) clamp(20px, 5vw, 48px)' }}>

        <nav style={{ fontSize: '12px', color: '#999', marginBottom: 32, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link href="/shop" style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a' }}>Privacy Policy</span>
        </nav>

        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 36px)', color: '#0a0a0a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '13px', color: '#999', marginBottom: 48 }}>
          Ultimo aggiornamento: maggio 2025
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section title="1. Titolare del trattamento">
            <p>Il titolare del trattamento dei dati personali è:</p>
            <ul>
              <li><strong>Claudio Spera</strong></li>
              <li>Sede operativa: Via Pianopantano snc, 83036 Mirabella Eclano (AV)</li>
              <li>P.IVA: 02766080648</li>
              <li>Email: <a href="mailto:info@claudiospera.com">info@claudiospera.com</a></li>
              <li>Tel: +39 389 785 5581</li>
            </ul>
          </Section>

          <Section title="2. Dati raccolti e finalità">
            <p>Raccogliamo i seguenti dati personali:</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: 12 }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Dato</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Finalità</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Base giuridica</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Nome, email, telefono', 'Gestione dell\'ordine e comunicazioni', 'Esecuzione contratto (art. 6.1.b GDPR)'],
                  ['Foto caricate', 'Produzione delle stampe ordinate', 'Esecuzione contratto (art. 6.1.b GDPR)'],
                  ['Indirizzo IP, dati di navigazione', 'Sicurezza e prevenzione frodi', 'Legittimo interesse (art. 6.1.f GDPR)'],
                  ['Dati di pagamento', 'Elaborazione pagamento (gestito da Stripe)', 'Esecuzione contratto (art. 6.1.b GDPR)'],
                ].map(([dato, fin, base], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{dato}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{fin}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="3. Foto caricate dagli utenti">
            <p>
              Le foto che carichi per la personalizzazione delle stampe vengono temporaneamente archiviate
              sui nostri server sicuri al solo scopo di produrre l'ordine. Dopo la produzione le foto
              vengono eliminate entro <strong>30 giorni</strong> dalla data di conferma dell'ordine.
              Non utilizziamo le tue foto per nessun altro scopo (pubblicità, portfolio, social) senza
              tuo esplicito consenso scritto.
            </p>
          </Section>

          <Section title="4. Conservazione dei dati">
            <p>I dati relativi agli ordini vengono conservati per <strong>10 anni</strong> ai fini degli obblighi fiscali e contabili (D.P.R. 600/1973). I dati di contatto, in assenza di ulteriori ordini, vengono eliminati dopo <strong>3 anni</strong> dall'ultimo acquisto.</p>
          </Section>

          <Section title="5. Condivisione con terze parti">
            <p>I tuoi dati non vengono venduti né ceduti a terzi a scopo commerciale. Possono essere condivisi esclusivamente con:</p>
            <ul>
              <li><strong>Stripe Inc.</strong> — elaborazione pagamenti (Privacy Policy: <a href="https://stripe.com/it/privacy" target="_blank" rel="noopener noreferrer">stripe.com/it/privacy</a>)</li>
              <li><strong>Corrieri / Spedizionieri</strong> — per la consegna dell'ordine (nome e indirizzo)</li>
              <li><strong>Autorità competenti</strong> — ove richiesto dalla legge</li>
            </ul>
          </Section>

          <Section title="6. Trasferimento dati extra-UE">
            <p>
              Stripe Inc. è certificata ai sensi del Data Privacy Framework EU-USA. Per gli altri fornitori
              ci assicuriamo che siano adottate adeguate garanzie (clausole contrattuali standard) prima
              di qualsiasi trasferimento.
            </p>
          </Section>

          <Section title="7. I tuoi diritti (GDPR)">
            <p>In qualità di interessato, hai diritto a:</p>
            <ul>
              <li><strong>Accesso</strong> — ottenere copia dei tuoi dati</li>
              <li><strong>Rettifica</strong> — correggere dati inesatti</li>
              <li><strong>Cancellazione</strong> ("diritto all'oblio")</li>
              <li><strong>Limitazione</strong> del trattamento</li>
              <li><strong>Portabilità</strong> dei dati</li>
              <li><strong>Opposizione</strong> al trattamento per legittimo interesse</li>
              <li><strong>Revoca del consenso</strong> in qualsiasi momento</li>
            </ul>
            <p>
              Per esercitare i tuoi diritti scrivi a <a href="mailto:info@claudiospera.com">info@claudiospera.com</a>.
              Hai inoltre il diritto di proporre reclamo al <strong>Garante per la protezione dei dati personali</strong> (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>).
            </p>
          </Section>

          <Section title="8. Cookie">
            <p>
              Per informazioni dettagliate sull'uso dei cookie consulta la nostra{' '}
              <Link href="/shop/cookie-policy" style={{ color: '#00c1de' }}>Cookie Policy</Link>.
            </p>
          </Section>

          <Section title="9. Sicurezza">
            <p>
              Adottiamo misure tecniche e organizzative adeguate per proteggere i dati personali da
              accesso non autorizzato, perdita o divulgazione accidentale (connessioni HTTPS,
              accesso ai sistemi limitato al personale autorizzato).
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

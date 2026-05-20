// app/shop/cookie-policy/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy — Storie da Raccontare',
  description: 'Informativa sull\'utilizzo dei cookie sul sito Storie da Raccontare.',
}

export default function CookiePolicyPage() {
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) clamp(20px, 5vw, 48px)' }}>

        <nav style={{ fontSize: '12px', color: '#999', marginBottom: 32, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link href="/shop" style={{ color: '#777', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <span style={{ color: '#0a0a0a' }}>Cookie Policy</span>
        </nav>

        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 36px)', color: '#0a0a0a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Cookie Policy
        </h1>
        <p style={{ fontSize: '13px', color: '#999', marginBottom: 48 }}>
          Ultimo aggiornamento: maggio 2025
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section title="Cosa sono i cookie">
            <p>
              I cookie sono piccoli file di testo che i siti web salvano sul tuo dispositivo durante
              la navigazione. Servono a far funzionare correttamente il sito, a ricordare le tue
              preferenze e — se lo consenti — a raccogliere statistiche di utilizzo.
            </p>
          </Section>

          <Section title="Cookie tecnici (sempre attivi)">
            <p>
              Questi cookie sono strettamente necessari al funzionamento del sito e non richiedono
              il tuo consenso. Non possono essere disabilitati senza compromettere la fruibilità del servizio.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: 8 }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Nome</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Scopo</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Durata</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['fotostudio_cart', 'Salvataggio carrello (localStorage)', 'Fino a svuotamento'],
                  ['cookie_consent', 'Memorizza la tua scelta sui cookie', '12 mesi'],
                  ['__clerk_*', 'Sessione di autenticazione (Clerk)', 'Sessione / 30 giorni'],
                ].map(([nome, scopo, durata], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '8px 12px', border: '1px solid #e0e0e0', fontFamily: 'monospace', fontSize: '12px' }}>{nome}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{scopo}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{durata}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Cookie analitici (con consenso)">
            <p>
              Attualmente <strong>non utilizziamo</strong> cookie analitici di terze parti (es. Google Analytics).
              Qualora venissero introdotti in futuro, aggiorneremo questa pagina e chiederemo nuovamente
              il tuo consenso.
            </p>
          </Section>

          <Section title="Cookie di profilazione / marketing (con consenso)">
            <p>
              Attualmente <strong>non utilizziamo</strong> cookie di profilazione o marketing.
            </p>
          </Section>

          <Section title="Cookie di terze parti">
            <p>
              Il nostro servizio di pagamento <strong>Stripe</strong> può impostare cookie tecnici
              necessari all'elaborazione sicura dei pagamenti. Consulta la loro policy:{' '}
              <a href="https://stripe.com/it/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#00c1de' }}>
                stripe.com/it/privacy
              </a>.
            </p>
          </Section>

          <Section title="Come gestire i cookie">
            <p>
              Puoi revocare o modificare il tuo consenso in qualsiasi momento cliccando su
              <strong> &quot;Gestisci preferenze cookie&quot;</strong> nel footer del sito.
            </p>
            <p>
              Puoi inoltre disabilitare i cookie dal tuo browser. Tieni presente che la disabilitazione
              dei cookie tecnici potrebbe compromettere alcune funzionalità del sito (es. il carrello).
            </p>
            <p>Istruzioni per browser comuni:</p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" style={{ color: '#00c1de' }}>Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/it/kb/attivare-disattivare-cookie" target="_blank" rel="noopener noreferrer" style={{ color: '#00c1de' }}>Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" style={{ color: '#00c1de' }}>Apple Safari</a></li>
            </ul>
          </Section>

          <Section title="Contatti">
            <p>
              Per qualsiasi domanda sulla nostra Cookie Policy scrivici a{' '}
              <a href="mailto:info@claudiospera.com" style={{ color: '#00c1de' }}>info@claudiospera.com</a>.
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

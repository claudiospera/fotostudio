'use client'

// app/shop/composizioni/components/PreventivoForm.tsx

import { useState } from 'react'
import { COMPOSIZIONI } from '@/lib/composizioni-data'
import { Check, Send } from 'lucide-react'

const AC = '#7d9b76'

const MATERIALI = [
  'Tela su telaio',
  'Stampa su Forex',
  'Stampa con cornice',
  'Non so ancora — voglio un consiglio',
]

function InputField({
  label, id, type = 'text', required = false, placeholder = '', value, onChange, hint,
}: {
  label: string; id: string; type?: string; required?: boolean
  placeholder?: string; value: string; onChange: (v: string) => void; hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: 6, letterSpacing: '.04em' }}>
        {label}{required && <span style={{ color: '#c0392b', marginLeft: 3 }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '11px 14px',
          borderRadius: 10, border: '1.5px solid #ddd',
          fontSize: '14px', color: '#1a1a1a',
          background: '#fff', outline: 'none',
          transition: 'border-color .15s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = AC }}
        onBlur={e => { e.target.style.borderColor = '#ddd' }}
      />
      {hint && <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#aaa' }}>{hint}</p>}
    </div>
  )
}

export function PreventivoForm() {
  const [nome,        setNome]        = useState('')
  const [email,       setEmail]       = useState('')
  const [telefono,    setTelefono]    = useState('')
  const [compId,      setCompId]      = useState(COMPOSIZIONI[0].id)
  const [dimId,       setDimId]       = useState(COMPOSIZIONI[0].dimensioni[0].id)
  const [materiale,   setMateriale]   = useState(MATERIALI[0])
  const [note,        setNote]        = useState('')
  const [gdpr,        setGdpr]        = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [sent,        setSent]        = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const composizione = COMPOSIZIONI.find(c => c.id === compId) ?? COMPOSIZIONI[0]
  const dimensioneOpzione = composizione.dimensioni.find(d => d.id === dimId) ?? composizione.dimensioni[0]

  // Resetta dimId quando cambia composizione
  function handleCompChange(id: string) {
    setCompId(id)
    const c = COMPOSIZIONI.find(x => x.id === id)
    if (c) setDimId(c.dimensioni[0].id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gdpr) { setError('Devi accettare il trattamento dei dati per procedere.'); return }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/composizioni/preventivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, email, telefono,
          composizione: composizione.nome,
          materiale,
          dimensioni: dimensioneOpzione.label,
          pareteLabel: dimensioneOpzione.pareteLabel,
          note: note || undefined,
          gdpr: true,
        }),
      })

      if (!res.ok) throw new Error('Errore invio')
      setSent(true)
    } catch {
      setError('Errore nell\'invio. Riprova o scrivici direttamente a info@claudiospera.com')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <section id="preventivo" style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,40px)', textAlign: 'center' }}>
        <div style={{
          maxWidth: 520, margin: '0 auto',
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 20, padding: '48px 40px',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: AC, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Check size={28} color="#fff" strokeWidth={2.5} />
          </div>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '24px', color: '#14532d', margin: '0 0 12px' }}>
            Richiesta inviata!
          </h3>
          <p style={{ fontSize: '15px', color: '#166534', lineHeight: 1.65, margin: 0 }}>
            Ti risponderemo entro 24–48 ore con il preventivo personalizzato per la tua composizione <strong>{composizione.nome}</strong>.
            Controlla anche la cartella spam.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      id="preventivo"
      style={{
        padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,40px)',
        maxWidth: 1100, margin: '0 auto',
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: AC, marginBottom: 10 }}>
          Nessun impegno
        </p>
        <h2 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 'clamp(24px,4vw,36px)',
          fontWeight: 700, color: '#1a1a1a', margin: '0 0 14px',
        }}>
          Richiedi il tuo preventivo gratuito
        </h2>
        <p style={{ fontSize: '15px', color: '#6b6660', maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
          Compila il form e ti invierò un preventivo personalizzato entro 24–48 ore. Senza impegno.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 680, margin: '0 auto',
          background: '#fff', borderRadius: 20,
          border: '1px solid #e8e4de',
          padding: 'clamp(24px,4vw,40px)',
          display: 'flex', flexDirection: 'column', gap: 20,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Nome + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="shop-cfg-grid">
          <InputField label="Nome e Cognome" id="nome" required placeholder="Mario Rossi" value={nome} onChange={setNome} />
          <InputField label="Email" id="email" type="email" required placeholder="mario@email.it" value={email} onChange={setEmail} />
        </div>

        {/* Telefono */}
        <InputField
          label="Telefono (opzionale)"
          id="telefono"
          type="tel"
          placeholder="+39 333 123 4567"
          value={telefono}
          onChange={setTelefono}
          hint="Ti contatteremo anche via WhatsApp se preferisci"
        />

        {/* Composizione */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: 6 }}>
            Composizione scelta <span style={{ color: '#c0392b' }}>*</span>
          </label>
          <select
            value={compId}
            onChange={e => handleCompChange(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 10,
              border: '1.5px solid #ddd', background: '#fff',
              fontSize: '14px', color: '#1a1a1a', cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            {COMPOSIZIONI.map(c => (
              <option key={c.id} value={c.id}>{c.nome} — {c.pezzi} {c.pezzi === 1 ? 'pannello' : 'pannelli'}</option>
            ))}
          </select>
        </div>

        {/* Dimensioni */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: 6 }}>
            Dimensioni preferite <span style={{ color: '#c0392b' }}>*</span>
          </label>
          <select
            value={dimId}
            onChange={e => setDimId(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 10,
              border: '1.5px solid #ddd', background: '#fff',
              fontSize: '14px', color: '#1a1a1a', cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            {composizione.dimensioni.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: AC, fontWeight: 600 }}>
            📐 {dimensioneOpzione.pareteLabel}
          </p>
        </div>

        {/* Materiale */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: 10 }}>
            Materiale preferito <span style={{ color: '#c0392b' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MATERIALI.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMateriale(m)}
                style={{
                  padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                  border: `1.5px solid ${materiale === m ? AC : '#ddd'}`,
                  background: materiale === m ? `${AC}18` : '#fff',
                  color: materiale === m ? AC : '#666',
                  fontSize: '13px', fontWeight: materiale === m ? 700 : 500,
                  transition: 'all .15s',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: 6 }}>
            Note aggiuntive
          </label>
          <textarea
            id="note"
            rows={3}
            placeholder="Es. La foto è un ritratto di famiglia, vorrei uno stile caldo e naturale…"
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 10,
              border: '1.5px solid #ddd', fontSize: '14px', color: '#1a1a1a',
              background: '#fff', resize: 'vertical', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* GDPR */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <div
            onClick={() => setGdpr(!gdpr)}
            style={{
              width: 20, height: 20, borderRadius: 5, flexShrink: 0,
              border: `2px solid ${gdpr ? AC : '#ccc'}`,
              background: gdpr ? AC : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1, cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {gdpr && <Check size={12} color="#fff" strokeWidth={3} />}
          </div>
          <span style={{ fontSize: '12px', color: '#666', lineHeight: 1.55 }}>
            Acconsento al trattamento dei miei dati personali per ricevere il preventivo richiesto,
            in conformità alla{' '}
            <a href="/shop/privacy-policy" target="_blank" style={{ color: AC }}>Privacy Policy</a>.{' '}
            <span style={{ color: '#c0392b' }}>*</span>
          </span>
        </label>

        {/* Error */}
        {error && (
          <p style={{ fontSize: '13px', color: '#c0392b', background: '#fff5f5', padding: '10px 14px', borderRadius: 8, margin: 0 }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !nome || !email || !gdpr}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px', borderRadius: 12, border: 'none',
            background: (submitting || !nome || !email || !gdpr) ? '#ccc' : AC,
            color: '#fff', fontSize: '15px', fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif',
            cursor: (submitting || !nome || !email || !gdpr) ? 'not-allowed' : 'pointer',
            transition: 'background .2s',
          }}
        >
          <Send size={17} />
          {submitting ? 'Invio in corso…' : 'Invia richiesta preventivo'}
        </button>

        <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', margin: 0 }}>
          Risposta garantita entro 24–48 ore · Nessun impegno di acquisto
        </p>
      </form>
    </section>
  )
}

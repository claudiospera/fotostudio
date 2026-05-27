'use client'

// app/(public)/contatti/page.tsx
// Pagina Scrivimi — modulo di contatto pubblico

import { useState } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

// metadata non si può esportare da 'use client', la omettiamo
// (si può aggiungere in un layout separato se necessario)

const BG     = '#F5F0E8'
const INK    = '#1a1612'
const GOLD   = '#C9A96E'
const BORDER = 'rgba(26,22,18,0.14)'
const INPUT_BORDER = 'rgba(26,22,18,0.22)'

const TIPI_EVENTO = [
  'Matrimonio', 'Promessa di matrimonio', 'Ritratti',
  'Battesimo & Prima infanzia', 'Comunione & Cresima',
  'Maternità', 'Compleanno & Festa', 'Shooting Studio', 'Altro',
]

const DURATE = ['30 minuti', '1 ora', '2 ore', '4 ore', '6 ore', '8 ore', '10/12 ore']

const VIDEO_OPTIONS = ['Sì, sono interessato/a', 'No, grazie', 'Non so ancora']

const COME_HA_TROVATO = [
  'Google', 'Instagram', 'Facebook', 'Passaparola', 'Matrimonio.com',
  'WedPlan', 'Un matrimonio a cui ero ospite', 'Altro',
]

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '12px 14px',
    border: `1px solid ${focused ? INK : INPUT_BORDER}`,
    background: 'transparent', color: INK,
    fontSize: '14px', fontFamily: "'Jost', sans-serif", fontWeight: 300,
    outline: 'none', borderRadius: 0,
    transition: 'border-color .15s',
    boxSizing: 'border-box',
  }
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{
      display: 'block', fontSize: '9px', fontWeight: 400,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: INK, opacity: 0.55, marginBottom: 8,
      fontFamily: "'Jost', sans-serif",
    }}>
      {children}{required && <span style={{ color: GOLD, marginLeft: 3 }}>*</span>}
    </label>
  )
}

function TextField({
  id, label, type = 'text', required = false, placeholder = '',
  value, onChange,
}: {
  id: string; label: string; type?: string; required?: boolean
  placeholder?: string; value: string; onChange: (v: string) => void
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        id={id} type={type} placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={inputStyle(focused)}
      />
    </div>
  )
}

function SelectField({
  id, label, options, value, onChange,
}: {
  id: string; label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ position: 'relative' }}>
        <select
          id={id} value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...inputStyle(focused), appearance: 'none', cursor: 'pointer', paddingRight: 36 }}
        >
          <option value=""></option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', opacity: 0.4,
        }}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke={INK} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function ContattiPage() {
  const [nome,          setNome]          = useState('')
  const [nomePartner,   setNomePartner]   = useState('')
  const [email,         setEmail]         = useState('')
  const [telefono,      setTelefono]      = useState('')
  const [dataEvento,    setDataEvento]    = useState('')
  const [location,      setLocation]      = useState('')
  const [tipiSelezionati, setTipiSelezionati] = useState<string[]>([])
  const [durata,        setDurata]        = useState('')
  const [video,         setVideo]         = useState('')
  const [comeHaTrovato, setComeHaTrovato] = useState('')
  const [instagram,     setInstagram]     = useState('')
  const [messaggio,     setMessaggio]     = useState('')
  const [gdpr,          setGdpr]          = useState(false)
  const [submitting,    setSubmitting]    = useState(false)
  const [sent,          setSent]          = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [msgFocused,    setMsgFocused]    = useState(false)

  function toggleTipo(tipo: string) {
    setTipiSelezionati(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gdpr) { setError('Devi accettare il trattamento dei dati per procedere.'); return }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/contatti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, nomePartner: nomePartner || undefined,
          email, telefono: telefono || undefined,
          dataEvento: dataEvento || undefined,
          location: location || undefined,
          tipoEvento: tipiSelezionati,
          durata: durata || undefined,
          video: video || undefined,
          comeHaTrovato: comeHaTrovato || undefined,
          instagram: instagram || undefined,
          messaggio: messaggio || undefined,
          gdpr: true,
        }),
      })
      if (!res.ok) throw new Error('Errore invio')
      setSent(true)
    } catch {
      setError('Errore nell\'invio. Scrivimi direttamente a info@claudiospera.com')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', color: INK }}>

      {/* ── NAV ── */}
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
          color: INK, textDecoration: 'none', letterSpacing: '0.01em',
        }}>
          Claudio Spera · Fotografo
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(20px,3vw,40px)' }}>
          {[
            { label: 'Servizi Fotografici', href: '/servizi' },
            { label: 'Chi sono',            href: '/chi-sono' },
            { label: 'Contatti',            href: '/contatti' },
          ].map(({ label, href }) => (
            <Link key={href} href={href} style={{
              fontFamily: "'Jost', sans-serif", fontWeight: href === '/contatti' ? 500 : 300,
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: INK, textDecoration: 'none',
              opacity: href === '/contatti' ? 1 : 0.7,
            }}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        paddingTop: 'clamp(120px,14vw,180px)',
        paddingBottom: 'clamp(40px,6vw,64px)',
        paddingLeft: 'clamp(24px,7vw,96px)',
        paddingRight: 'clamp(24px,5vw,64px)',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Wedding', cursive",
          fontSize: 'clamp(48px,7vw,88px)',
          color: INK, lineHeight: 1.1,
          marginBottom: 'clamp(16px,2vw,24px)',
        }}>
          La tua storia merita<br />di essere raccontata.
        </div>
        <p style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 'clamp(13px,1.4vw,15px)', letterSpacing: '0.06em',
          color: INK, opacity: 0.6, maxWidth: 520, margin: '0 auto',
          lineHeight: 1.75,
        }}>
          Raccontami del tuo evento, della data, di dove si terrà e di come immagini questi momenti.
          Sarò felice di risponderti entro 24–48 ore.
        </p>
      </section>

      {/* ── CONTATTI RAPIDI ── */}
      <section style={{
        display: 'flex', justifyContent: 'center', gap: 'clamp(16px,3vw,32px)',
        flexWrap: 'wrap',
        paddingBottom: 'clamp(32px,4vw,48px)',
        paddingLeft: 'clamp(24px,5vw,64px)',
        paddingRight: 'clamp(24px,5vw,64px)',
      }}>
        <a href="tel:+393897855581" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 24px',
          border: `1px solid ${BORDER}`,
          color: INK, textDecoration: 'none',
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase',
          transition: 'border-color .15s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.17 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
          </svg>
          389 785 5581
        </a>
        <a href="https://wa.me/393897855581" target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 24px',
          border: `1px solid ${BORDER}`,
          color: INK, textDecoration: 'none',
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase',
          transition: 'border-color .15s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={INK}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>
      </section>

      {/* ── FORM ── */}
      {sent ? (
        <section style={{
          maxWidth: 640, margin: '0 auto clamp(80px,10vw,120px)',
          padding: '0 clamp(24px,5vw,48px)',
          textAlign: 'center',
        }}>
          <div style={{
            border: `1px solid ${BORDER}`, padding: 'clamp(40px,6vw,72px) clamp(24px,4vw,48px)',
          }}>
            <div style={{
              fontFamily: "'Wedding', cursive",
              fontSize: 'clamp(32px,4vw,48px)', color: GOLD, marginBottom: 20,
            }}>Grazie!</div>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontSize: 'clamp(18px,2vw,22px)',
              color: INK, lineHeight: 1.65, margin: 0,
            }}>
              Ho ricevuto il tuo messaggio, <strong>{nome}</strong>.<br />
              Ti risponderò entro 24–48 ore. Controlla anche la cartella spam.
            </p>
          </div>
        </section>
      ) : (
        <section style={{
          maxWidth: 900, margin: '0 auto clamp(80px,10vw,120px)',
          padding: '0 clamp(24px,5vw,48px)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Frase intro */}
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(22px,2.5vw,30px)', color: INK,
              marginBottom: 'clamp(32px,4vw,48px)', lineHeight: 1.3,
            }}>
              Ogni grande storia d&apos;amore merita di essere ricordata con eleganza.
            </div>

            {/* Bordo container */}
            <div style={{ border: `1px solid ${BORDER}`, padding: 'clamp(28px,4vw,52px)' }}>

              {/* Riga 1: Nome + Nome partner */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}
                className="shop-cfg-grid">
                <TextField id="nome" label="Il tuo nome" required value={nome} onChange={setNome} />
                <TextField id="nomePartner" label="Nome del/la partner" value={nomePartner} onChange={setNomePartner} />
              </div>

              {/* Riga 2: Email + Telefono */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}
                className="shop-cfg-grid">
                <TextField id="email" label="Email" type="email" required value={email} onChange={setEmail} />
                <TextField id="telefono" label="Telefono" type="tel" placeholder="+39 333 000 0000" value={telefono} onChange={setTelefono} />
              </div>

              {/* Riga 3: Data + Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 36 }}
                className="shop-cfg-grid">
                <TextField id="data" label="Data dell'evento" type="date" value={dataEvento} onChange={setDataEvento} />
                <TextField id="location" label="Location dell'evento" placeholder="Es. Villa Ferretti, Avellino" value={location} onChange={setLocation} />
              </div>

              {/* Tipo evento */}
              <div style={{ marginBottom: 36 }}>
                <FieldLabel>Tipo di servizio</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {TIPI_EVENTO.map(tipo => (
                    <label key={tipo} style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    }}>
                      <div
                        onClick={() => toggleTipo(tipo)}
                        style={{
                          width: 16, height: 16, border: `1px solid ${tipiSelezionati.includes(tipo) ? INK : INPUT_BORDER}`,
                          background: tipiSelezionati.includes(tipo) ? INK : 'transparent',
                          flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .12s',
                        }}
                      >
                        {tipiSelezionati.includes(tipo) && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3l2 2 4-4" stroke={BG} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{
                        fontFamily: "'Jost', sans-serif", fontWeight: 300,
                        fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: INK, opacity: tipiSelezionati.includes(tipo) ? 1 : 0.6,
                      }}>{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Durata */}
              <div style={{ marginBottom: 36 }}>
                <FieldLabel>Durata stimata del servizio</FieldLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {DURATE.map(d => (
                    <button key={d} type="button" onClick={() => setDurata(d)} style={{
                      padding: '8px 18px', border: `1px solid ${durata === d ? INK : INPUT_BORDER}`,
                      background: durata === d ? INK : 'transparent',
                      color: durata === d ? BG : INK,
                      fontFamily: "'Jost', sans-serif", fontWeight: 300,
                      fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all .12s',
                    }}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Video + Come ha trovato */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}
                className="shop-cfg-grid">
                <SelectField id="video" label="Sei interessato/a al video?" options={VIDEO_OPTIONS} value={video} onChange={setVideo} />
                <SelectField id="comeHaTrovato" label="Come mi hai trovato?" options={COME_HA_TROVATO} value={comeHaTrovato} onChange={setComeHaTrovato} />
              </div>

              {/* Instagram */}
              <div style={{ marginBottom: 28 }}>
                <FieldLabel>Instagram (opzionale)</FieldLabel>
                <input
                  type="url" placeholder="https://instagram.com/tuoprofilo"
                  value={instagram} onChange={e => setInstagram(e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              {/* Messaggio */}
              <div style={{ marginBottom: 32 }}>
                <FieldLabel>Messaggio</FieldLabel>
                <textarea
                  rows={5}
                  placeholder="Raccontami del tuo evento, di cosa ti aspetti, di come immagini questi momenti…"
                  value={messaggio} onChange={e => setMessaggio(e.target.value)}
                  onFocus={() => setMsgFocused(true)} onBlur={() => setMsgFocused(false)}
                  style={{
                    ...inputStyle(msgFocused),
                    resize: 'vertical', fontFamily: "'Jost', sans-serif",
                  }}
                />
              </div>

              {/* GDPR */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 28,
              }}>
                <div onClick={() => setGdpr(!gdpr)} style={{
                  width: 16, height: 16, border: `1px solid ${gdpr ? INK : INPUT_BORDER}`,
                  background: gdpr ? INK : 'transparent', flexShrink: 0, marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all .12s',
                }}>
                  {gdpr && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3l2 2 4-4" stroke={BG} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300,
                  fontSize: '11px', letterSpacing: '0.06em', color: INK, opacity: 0.65, lineHeight: 1.65,
                }}>
                  Ho letto e accetto la{' '}
                  <Link href="/shop/privacy-policy" target="_blank" style={{ color: INK }}>Privacy Policy</Link>
                  {' '}e acconsento al trattamento dei miei dati personali allo scopo di rispondere alla mia richiesta.{' '}
                  <span style={{ color: GOLD }}>*</span>
                </span>
              </label>

              {error && (
                <p style={{
                  fontFamily: "'Jost', sans-serif", fontSize: '13px',
                  color: '#c0392b', marginBottom: 16,
                }}>{error}</p>
              )}

              {/* Submit */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="submit"
                  disabled={submitting || !nome || !email || !gdpr}
                  style={{
                    padding: '16px 56px',
                    background: (submitting || !nome || !email || !gdpr) ? 'rgba(26,22,18,0.3)' : INK,
                    color: BG,
                    border: 'none', cursor: (submitting || !nome || !email || !gdpr) ? 'not-allowed' : 'pointer',
                    fontFamily: "'Jost', sans-serif", fontWeight: 300,
                    fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase',
                    transition: 'background .2s',
                  }}
                >
                  {submitting ? 'Invio in corso…' : 'Invia'}
                </button>
              </div>

              {/* Privacy note */}
              <p style={{
                fontFamily: "'Jost', sans-serif", fontWeight: 300,
                fontSize: '11px', letterSpacing: '0.04em',
                color: INK, opacity: 0.4, textAlign: 'center',
                margin: '24px 0 0', lineHeight: 1.65,
              }}>
                Le tue informazioni saranno trattate in modo riservato e utilizzate esclusivamente
                per rispondere alla tua richiesta. Nessuna comunicazione di marketing senza il tuo esplicito consenso.
              </p>

            </div>
          </form>
        </section>
      )}

      {/* ── CTA finale ── */}
      {sent && (
        <section style={{
          padding: 'clamp(64px,8vw,100px) clamp(24px,5vw,64px)',
          textAlign: 'center',
        }}>
          <Link href="/servizi" style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase',
            background: INK, color: BG, padding: '14px 36px',
            textDecoration: 'none', display: 'inline-block',
          }}>Scopri i servizi fotografici</Link>
        </section>
      )}

      {/* ── FOOTER ── */}
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
        }}>© {new Date().getFullYear()} Claudio Spera · Fotografo</span>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 300,
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: INK, opacity: 0.4,
        }}>Mirabella Eclano, Avellino</span>
      </footer>

      <style>{`
        @media (max-width: 600px) {
          div[style*='repeat(auto-fill, minmax(200px'] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}

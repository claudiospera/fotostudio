'use client'

import { useEffect, useState, useCallback } from 'react'
import { use } from 'react'

interface Voce { desc: string; prezzo: number }
interface Sessione {
  slug: string
  template_nome: string
  colore: string
  voci: Voce[]
  selected: number[]
}

// Mappa parole chiave → immagine prodotto
const IMG_BASE = '/images/preventivo/'

function getImgForVoce(desc: string): string | null {
  const d = desc.toLowerCase()
  if (d.includes('drone')) return IMG_BASE + 'Screenshot 2026-05-19 alle 16.31.42.png'
  if (d.includes('solo file')) return IMG_BASE + 'Screenshot 2026-05-19 alle 16.31.29.png'
  if (d.includes('hahnem')) return IMG_BASE + 'Screenshot 2026-05-19 alle 16.30.33.png'
  if (d.includes('mini album') && d.includes('20')) return IMG_BASE + 'Screenshot 2026-05-19 alle 16.31.03.png'
  if (d.includes('mini album')) return IMG_BASE + 'Screenshot 2026-05-19 alle 16.30.51.png'
  if (d.includes('anteprima') && d.includes('video')) return IMG_BASE + 'Screenshot 2026-05-19 alle 16.32.09.png'
  if (d.includes('anteprima')) return IMG_BASE + 'Screenshot 2026-05-19 alle 16.31.57.png'
  if (d.includes('fotolibro') || d.includes('album 30×40') || d.includes('album 24×30') || d.includes('album 20×30') || d.includes('album 30×30')) return IMG_BASE + 'Screenshot 2026-05-19 alle 16.30.01.png'
  if (d.includes('album classico') || d.includes('album tradizionale') || d.includes('albumino')) return IMG_BASE + 'Screenshot 2026-05-19 alle 16.30.20.png'
  return null
}

export default function PreventivoClientePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [sessione, setSessione] = useState<Sessione | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firma, setFirma] = useState('')
  const [firmato, setFirmato] = useState(false)

  useEffect(() => {
    fetch(`/api/preventivo-sessioni/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setSessione(data)
        setSelected(Array.isArray(data.selected) ? data.selected : [])
      })
      .catch(() => setError('Errore di connessione'))
      .finally(() => setLoading(false))
  }, [slug])

  const toggle = useCallback(async (i: number) => {
    const next = selected.includes(i)
      ? selected.filter(x => x !== i)
      : [...selected, i]
    setSelected(next)
    setSaving(true)
    await fetch(`/api/preventivo-sessioni/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected: next }),
    })
    setSaving(false)
  }, [selected, slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', fontFamily: '"Georgia", serif' }}>
      <p style={{ color: '#999', fontSize: 16 }}>Caricamento…</p>
    </div>
  )

  if (error || !sessione) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', fontFamily: '"Georgia", serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, marginBottom: 12 }}>😕</p>
        <p style={{ color: '#999', fontSize: 16 }}>Preventivo non trovato o scaduto.</p>
      </div>
    </div>
  )

  const voci = sessione.voci as Voce[]
  const totale = voci.filter((_, i) => selected.includes(i)).reduce((s, v) => s + v.prezzo, 0)

  const formatEuro = (n: number) =>
    n === 0 ? '—' : `€ ${n.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`

  return (
    <div style={{ background: '#fff', fontFamily: '"Helvetica Neue", Arial, sans-serif', color: '#111', minHeight: '100vh' }}>

      {/* Logo header */}
      <div style={{
        width: '100%',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 24px',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/preventivo/logo.png"
          alt="Claudio Spera Fotografo"
          style={{ height: 60, objectFit: 'contain' }}
        />
      </div>

      {/* Hero cover */}
      <div style={{
        width: '100%', height: 280,
        background: 'linear-gradient(135deg, #1a6b60 0%, #3aaea0 100%)',
        display: 'flex', alignItems: 'flex-end',
        padding: '32px 40px',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            Preventivo fotografico
          </p>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            {sessione.template_nome}
          </h1>
        </div>
      </div>

      {/* Intro */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 0' }}>
        <p style={{ fontSize: 16, color: '#555', lineHeight: 1.7, fontStyle: 'italic' }}>
          Seleziona le opzioni che desideri — il totale si aggiornerà in automatico.
        </p>
      </div>

      {/* Voci */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 24px 160px' }}>
        {voci.map((v, i) => {
          const checked = selected.includes(i)
          const img = getImgForVoce(v.desc)
          return (
            <div
              key={i}
              style={{
                borderBottom: '1px solid #eee',
                padding: '36px 0',
              }}
            >
              {/* Riga principale: immagine + contenuto */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

                {/* Foto prodotto (se disponibile) */}
                {img && (
                  <div style={{
                    width: 100, height: 100, flexShrink: 0,
                    borderRadius: 10, overflow: 'hidden',
                    background: '#f5f5f5',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={v.desc}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Testo + checkbox */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#111',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.3,
                    }}>
                      {v.desc}
                    </h2>
                  </div>

                  {/* Prezzo + checkbox */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0, minWidth: 90, textAlign: 'right' }}>
                    <span style={{
                      fontSize: 18, fontWeight: 700, color: '#111',
                      display: 'block',
                    }}>
                      {v.prezzo > 0 ? formatEuro(v.prezzo) : <span style={{ color: '#bbb', fontSize: 15 }}>incluso</span>}
                    </span>
                    {/* Checkbox rotondo */}
                    <button
                      onClick={() => toggle(i)}
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        border: checked ? '2px solid #2e7d5e' : '2px solid #ccc',
                        background: checked ? '#2e7d5e' : '#fff',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                        flexShrink: 0,
                      }}
                    >
                      {checked && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7L5.5 10.5L12 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Riepilogo */}
        <div style={{ marginTop: 60, paddingTop: 40, borderTop: '2px solid #111' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Riepilogo</h2>

          {selected.length === 0 ? (
            <p style={{ color: '#999', fontSize: 15 }}>Nessuna voce selezionata.</p>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {voci.filter((_, i) => selected.includes(i)).map((v, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: 15, color: '#333' }}>{v.desc}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{v.prezzo > 0 ? formatEuro(v.prezzo) : '—'}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', marginTop: 8, borderTop: '2px solid #111' }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>Totale</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#2e7d5e' }}>{formatEuro(totale)}</span>
              </div>
            </div>
          )}

          {/* Firma digitale */}
          {!firmato ? (
            <div style={{ marginTop: 40, padding: '32px', background: '#f9f9f9', borderRadius: 12 }}>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 20, textAlign: 'center' }}>
                Io, <strong>{firma || '___'}</strong>, accetto i termini di questo preventivo e sono d&apos;accordo
                che il mio nome digitato di seguito possa essere utilizzato come
                rappresentazione digitale di fatto della mia firma.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Digita il tuo nome per accettare"
                  value={firma}
                  onChange={e => setFirma(e.target.value)}
                  style={{
                    flex: 1, padding: '12px 16px', fontSize: 15,
                    border: '1px solid #ddd', borderRadius: 8,
                    outline: 'none', background: '#fff',
                  }}
                />
                <button
                  onClick={() => { if (firma.trim()) setFirmato(true) }}
                  disabled={!firma.trim() || selected.length === 0}
                  style={{
                    padding: '12px 24px', background: firma.trim() && selected.length > 0 ? '#2e7d5e' : '#ccc',
                    color: '#fff', border: 'none', borderRadius: 8,
                    fontSize: 15, fontWeight: 600, cursor: firma.trim() && selected.length > 0 ? 'pointer' : 'not-allowed',
                    transition: 'background 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  Accetta
                </button>
              </div>
              {selected.length === 0 && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#e07070', textAlign: 'center' }}>
                  Seleziona almeno una voce prima di accettare.
                </p>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 40, padding: '32px', background: '#f0faf5', border: '1px solid #a8d5bc', borderRadius: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>✅</p>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#2e7d5e' }}>Preventivo accettato!</h3>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: '#555' }}>
                Firmato da <strong>{firma}</strong>. Il fotografo riceverà la tua selezione.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1a6b60', padding: '40px 24px', textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/preventivo/logo.png"
          alt="Claudio Spera Fotografo"
          style={{ height: 40, objectFit: 'contain', marginBottom: 16, opacity: 0.9 }}
        />
        <p style={{ margin: '0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          © {new Date().getFullYear()} Claudio Spera fotografo
        </p>
      </div>

      {/* Totale fisso in basso */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #e8e8e8',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        zIndex: 100,
      }}>
        <p style={{ margin: 0, fontSize: 12, color: '#999', fontWeight: 500 }}>
          {saving ? 'Salvataggio…' : selected.length === 0 ? 'Seleziona le opzioni' : `${selected.length} ${selected.length === 1 ? 'voce' : 'voci'} selezionate`}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#999' }}>Totale</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>
            {totale > 0 ? formatEuro(totale) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

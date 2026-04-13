/**
 * Script di importazione: Firebase Firestore → Supabase
 * Legge tutti i clienti da Firebase e li inserisce in Supabase.
 *
 * Uso: node scripts/import-firebase.mjs
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { createClient } from '@supabase/supabase-js'

// ── Firebase config (dal gestionale) ───────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyC_L9k2xcUdfajdAeamnhTQ8ob03E6QKlA",
  authDomain: "fotostudio-claudio.firebaseapp.com",
  projectId: "fotostudio-claudio",
  storageBucket: "fotostudio-claudio.firebasestorage.app",
}

// ── Supabase (service role per bypassare RLS) ───────────────────────────────
const SUPABASE_URL = 'https://qnywajfyqgiaqxnwvqqb.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFueXdhamZ5cWdpYXF4bnd2cXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk5NTI5NywiZXhwIjoyMDkwNTcxMjk3fQ.2HJcqjto2EEyqC-bDOEWKUXu4jJhvMSAiPIB7RZUK9E'

// ── Mapping categorie Firebase → Supabase ───────────────────────────────────
const CAT_MAP = {
  'matrimonio':          'Matrimonio',
  'promessa-matrimonio': 'Matrimonio',
  'battesimo':           'Battesimo',
  'comunione':           'Comunione',
  'un-anno':             '1 Anno',
  'diciotto':            '18 Anni',
  'anniversario':        'Anniversario',
  'shooting':            'Shooting Fotografico',
  'altro':               'Altra Cerimonia',
}

const CAT_COLORS = {
  'Matrimonio':           '#7a4a6e',
  'Battesimo':            '#4a7a9b',
  'Comunione':            '#5e8a5e',
  '1 Anno':               '#c9a84c',
  '18 Anni':              '#b85c38',
  'Anniversario':         '#6b5b8a',
  'Shooting Fotografico': '#3d6b6b',
  'Altra Cerimonia':      '#7a6b55',
}

// ── Mapping campi Firebase → Supabase ───────────────────────────────────────
function mapCliente(fb, userId) {
  const categoria = CAT_MAP[fb.tipo] ?? 'Altra Cerimonia'
  return {
    user_id:        userId,
    categoria,
    colore:         CAT_COLORS[categoria] ?? '#8ec9b0',
    data_evento:    fb.data    || null,
    luogo_evento:   fb.luogo   || null,
    // Persona 1
    nome1:          fb.nome    || 'Senza nome',
    tel1:           fb.tel     || null,
    email1:         fb.email   || null,
    whatsapp1:      fb.whatsapp || null,
    indirizzo1:     fb.indirizzo || null,
    citta1:         fb.citta   || null,
    // Persona 2
    nome2:          fb.nome2   || null,
    tel2:           fb.tel2    || null,
    email2:         fb.email2  || null,
    whatsapp2:      fb.whatsapp2 || null,
    indirizzo2:     fb.indirizzo2 || null,
    citta2:         fb.citta2  || null,
    // Genitori
    genitore1_nome: fb.gen1Nome || null,
    genitore1_tel:  fb.gen1Tel  || null,
    genitore2_nome: fb.gen2Nome || null,
    genitore2_tel:  fb.gen2Tel  || null,
    // Album
    album_tipo:     fb.albumTipo     || null,
    album_formato:  fb.albumFormato  || null,
    album_pagine:   fb.albumPagine   || null,
    album_copertina:fb.albumCopertina|| null,
    // Video
    video:          !!fb.video,
    video_tipo:     fb.videoTipo || null,
    // Pacchetti
    pacchetti:      Array.isArray(fb.pacchetti) ? fb.pacchetti : [],
    // Pagamenti
    importo_totale: Number(fb.totale)   || 0,
    acconto:        Number(fb.acconto)  || 0,
    data_acconto:   fb.dataAcconto || null,
    saldo:          Number(fb.saldo)    || 0,
    data_saldo:     fb.dataSaldo   || null,
    // Note
    note:           fb.note || null,
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Leggi user_id da Supabase (primo utente)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id').limit(1)
  if (profileErr || !profiles?.length) {
    console.error('❌ Nessun profilo trovato in Supabase. Assicurati di aver effettuato almeno un login.')
    process.exit(1)
  }
  const userId = profiles[0].id
  console.log(`✅ User ID trovato: ${userId}`)

  // 2. Leggi da Firebase
  const app = initializeApp(firebaseConfig)
  const db  = getFirestore(app)
  const snap = await getDocs(collection(db, 'clienti'))
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  console.log(`📦 Trovati ${docs.length} clienti in Firebase`)

  if (docs.length === 0) {
    console.log('ℹ️  Nessun cliente da importare.')
    process.exit(0)
  }

  // 3. Mappa e inserisci in Supabase
  const mapped = docs.map(fb => mapCliente(fb, userId))

  let importati = 0, errori = 0
  for (const cliente of mapped) {
    const { error } = await supabase.from('clienti').insert(cliente)
    if (error) {
      console.error(`❌ Errore per "${cliente.nome1}":`, error.message)
      errori++
    } else {
      console.log(`✅ Importato: ${cliente.nome1} (${cliente.categoria} - ${cliente.data_evento ?? 'senza data'})`)
      importati++
    }
  }

  console.log(`\n🎉 Importazione completata: ${importati} importati, ${errori} errori`)
  process.exit(0)
}

main().catch(err => {
  console.error('Errore fatale:', err)
  process.exit(1)
})

import postgres from 'postgres'

const SUPABASE_URL = 'https://qnywajfyqgiaqxnwvqqb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFueXdhamZ5cWdpYXF4bnd2cXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk5NTI5NywiZXhwIjoyMDkwNTcxMjk3fQ.2HJcqjto2EEyqC-bDOEWKUXu4jJhvMSAiPIB7RZUK9E'
const NEON_URL = 'postgresql://neondb_owner:npg_GwBV5b3JTkXq@ep-soft-pine-alpaayny.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'

const dst = postgres(NEON_URL)

// Legge una tabella da Supabase via REST API
async function fetchTable(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*${params ? '&' + params : ''}`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Range': '0-9999',
    }
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Errore fetch ${table}: ${res.status} ${text}`)
  }
  return res.json()
}

// 1. Trova Clerk userId in Neon
const [clerkProfile] = await dst`SELECT id FROM profiles LIMIT 1`
if (!clerkProfile) {
  console.error('Nessun profilo su Neon. Ricarica /dashboard nel browser prima.')
  process.exit(1)
}
const clerkId = clerkProfile.id
console.log(`Clerk userId: ${clerkId}`)

// 2. Legge profilo Supabase
const profiles = await fetchTable('profiles')
if (!profiles.length) { console.error('Nessun profilo su Supabase'); process.exit(1) }
const supabaseProfile = profiles[0]
const oldId = supabaseProfile.id
console.log(`Supabase userId: ${oldId}`)

// 3. Aggiorna profilo Neon
await dst`
  UPDATE profiles SET
    name = ${supabaseProfile.name},
    studio_name = ${supabaseProfile.studio_name},
    plan = ${supabaseProfile.plan ?? 'free'},
    telefono = ${supabaseProfile.telefono},
    email = ${supabaseProfile.email},
    iban = ${supabaseProfile.iban}
  WHERE id = ${clerkId}
`
console.log('✓ Profilo aggiornato')

function remap(rows) {
  return rows.map(r => ({ ...r, ...(r.user_id === oldId ? { user_id: clerkId } : {}) }))
}

// 4. Gallerie
const galleries = await fetchTable('galleries')
console.log(`  Gallerie: ${galleries.length}`)
for (const g of remap(galleries)) {
  await dst`
    INSERT INTO galleries (id, user_id, name, subtitle, type, date, status, cover_color, cover_url, settings, created_at, updated_at)
    VALUES (${g.id}, ${g.user_id}, ${g.name}, ${g.subtitle ?? null}, ${g.type ?? null}, ${g.date ?? null},
            ${g.status}, ${g.cover_color ?? '#2a3830'}, ${g.cover_url ?? null},
            ${g.settings ? JSON.stringify(g.settings) : null},
            ${g.created_at}, ${g.updated_at})
    ON CONFLICT (id) DO NOTHING
  `
}
console.log('✓ Gallerie migrate')

// 5. Foto
const photos = await fetchTable('photos')
console.log(`  Foto: ${photos.length}`)
for (const p of photos) {
  await dst`
    INSERT INTO photos (id, gallery_id, storage_path, url, filename, size_bytes, width, height, order_index, folder, created_at)
    VALUES (${p.id}, ${p.gallery_id}, ${p.storage_path}, ${p.url ?? null}, ${p.filename ?? null},
            ${p.size_bytes ?? null}, ${p.width ?? null}, ${p.height ?? null},
            ${p.order_index ?? 0}, ${p.folder ?? null}, ${p.created_at})
    ON CONFLICT (id) DO NOTHING
  `
}
console.log('✓ Foto migrate')

// 6. Gallery clients
const galleryClients = await fetchTable('gallery_clients')
console.log(`  Gallery clients: ${galleryClients.length}`)
for (const c of galleryClients) {
  await dst`
    INSERT INTO gallery_clients (id, gallery_id, name, email, password_hash, active, favorites, comments, orders, last_access, created_at)
    VALUES (${c.id}, ${c.gallery_id}, ${c.name}, ${c.email}, ${c.password_hash ?? null},
            ${c.active ?? true}, ${c.favorites ?? 0}, ${c.comments ?? 0}, ${c.orders ?? 0},
            ${c.last_access ?? null}, ${c.created_at})
    ON CONFLICT (id) DO NOTHING
  `
}
console.log('✓ Gallery clients migrati')

// 7. Timeline
const timeline = await fetchTable('timeline_items')
console.log(`  Timeline: ${timeline.length}`)
for (const t of timeline) {
  await dst`
    INSERT INTO timeline_items (id, gallery_id, time, label, order_index)
    VALUES (${t.id}, ${t.gallery_id}, ${t.time}, ${t.label}, ${t.order_index ?? 0})
    ON CONFLICT (id) DO NOTHING
  `
}
console.log('✓ Timeline migrata')

// 8. Preventivi
const preventivi = await fetchTable('preventivi')
console.log(`  Preventivi: ${preventivi.length}`)
for (const p of remap(preventivi)) {
  await dst`
    INSERT INTO preventivi (id, user_id, gallery_id, cliente, email, servizio, data_evento, voci, totale, stato, note, created_at)
    VALUES (${p.id}, ${p.user_id}, ${p.gallery_id ?? null}, ${p.cliente}, ${p.email ?? null},
            ${p.servizio ?? null}, ${p.data_evento ?? null}, ${JSON.stringify(p.voci ?? [])},
            ${p.totale ?? 0}, ${p.stato ?? 'bozza'}, ${p.note ?? null}, ${p.created_at})
    ON CONFLICT (id) DO NOTHING
  `
}
console.log('✓ Preventivi migrati')

// 9. Upload links
const uploadLinks = await fetchTable('upload_links')
console.log(`  Upload links: ${uploadLinks.length}`)
for (const u of remap(uploadLinks)) {
  await dst`
    INSERT INTO upload_links (id, user_id, gallery_id, nome, slug, expires_at, max_photos, uploads, active, created_at)
    VALUES (${u.id}, ${u.user_id}, ${u.gallery_id ?? null}, ${u.nome}, ${u.slug},
            ${u.expires_at ?? null}, ${u.max_photos ?? null}, ${u.uploads ?? 0}, ${u.active ?? true}, ${u.created_at})
    ON CONFLICT (id) DO NOTHING
  `
}
console.log('✓ Upload links migrati')

// 10. Photo favorites
try {
  const favorites = await fetchTable('photo_favorites')
  console.log(`  Favorites: ${favorites.length}`)
  for (const f of favorites) {
    await dst`
      INSERT INTO photo_favorites (id, photo_id, gallery_id, session_id, created_at)
      VALUES (${f.id}, ${f.photo_id}, ${f.gallery_id}, ${f.session_id}, ${f.created_at})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log('✓ Favorites migrati')
} catch (e) { console.log(`  Favorites: skip (${e.message})`) }

// 11. Photo comments
try {
  const comments = await fetchTable('photo_comments')
  console.log(`  Comments: ${comments.length}`)
  for (const c of comments) {
    await dst`
      INSERT INTO photo_comments (id, photo_id, gallery_id, session_id, author_name, body, created_at)
      VALUES (${c.id}, ${c.photo_id}, ${c.gallery_id}, ${c.session_id}, ${c.author_name ?? null}, ${c.body}, ${c.created_at})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log('✓ Comments migrati')
} catch (e) { console.log(`  Comments: skip (${e.message})`) }

// 12. Print orders
try {
  const orders = await fetchTable('print_orders')
  console.log(`  Print orders: ${orders.length}`)
  for (const o of orders) {
    await dst`
      INSERT INTO print_orders (id, gallery_id, session_id, client_name, client_email, items, total, status, notes, created_at)
      VALUES (${o.id}, ${o.gallery_id}, ${o.session_id}, ${o.client_name ?? null}, ${o.client_email ?? null},
              ${JSON.stringify(o.items ?? [])}, ${o.total ?? 0}, ${o.status ?? 'nuovo'}, ${o.notes ?? null}, ${o.created_at})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log('✓ Print orders migrati')
} catch (e) { console.log(`  Print orders: skip (${e.message})`) }

// 13. Clienti
try {
  const clienti = await fetchTable('clienti')
  console.log(`  Clienti: ${clienti.length}`)
  for (const c of remap(clienti)) {
    await dst`
      INSERT INTO clienti (id, user_id, categoria, data_evento, luogo_evento,
        nome1, tel1, email1, whatsapp1, indirizzo1, citta1,
        nome2, tel2, email2, whatsapp2, indirizzo2, citta2,
        genitore1_nome, genitore1_tel, genitore2_nome, genitore2_tel,
        album_tipo, album_formato, album_pagine, album_copertina,
        video, video_tipo, pacchetti, importo_totale, acconto, data_acconto,
        saldo, data_saldo, gallery_id, note, colore, extra, created_at, updated_at)
      VALUES (${c.id}, ${c.user_id}, ${c.categoria}, ${c.data_evento ?? null}, ${c.luogo_evento ?? null},
        ${c.nome1}, ${c.tel1 ?? null}, ${c.email1 ?? null}, ${c.whatsapp1 ?? null}, ${c.indirizzo1 ?? null}, ${c.citta1 ?? null},
        ${c.nome2 ?? null}, ${c.tel2 ?? null}, ${c.email2 ?? null}, ${c.whatsapp2 ?? null}, ${c.indirizzo2 ?? null}, ${c.citta2 ?? null},
        ${c.genitore1_nome ?? null}, ${c.genitore1_tel ?? null}, ${c.genitore2_nome ?? null}, ${c.genitore2_tel ?? null},
        ${c.album_tipo ?? null}, ${c.album_formato ?? null}, ${c.album_pagine ?? null}, ${c.album_copertina ?? null},
        ${c.video ?? false}, ${c.video_tipo ?? null}, ${JSON.stringify(c.pacchetti ?? [])},
        ${c.importo_totale ?? 0}, ${c.acconto ?? 0}, ${c.data_acconto ?? null},
        ${c.saldo ?? 0}, ${c.data_saldo ?? null}, ${c.gallery_id ?? null}, ${c.note ?? null},
        ${c.colore ?? '#8ec9b0'}, ${JSON.stringify(c.extra ?? {})}, ${c.created_at}, ${c.updated_at})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log('✓ Clienti migrati')
} catch (e) { console.log(`  Clienti: skip (${e.message})`) }

// 14. Calendari
try {
  const calendari = await fetchTable('calendari_appuntamenti')
  console.log(`  Calendari: ${calendari.length}`)
  for (const c of remap(calendari)) {
    await dst`
      INSERT INTO calendari_appuntamenti (id, user_id, nome, data_inizio, data_fine, colore, attivo, descrizione, mostra_descrizione, inizia_settimana, created_at, updated_at)
      VALUES (${c.id}, ${c.user_id}, ${c.nome}, ${c.data_inizio ?? null}, ${c.data_fine ?? null},
              ${c.colore ?? '#3dba8a'}, ${c.attivo ?? true}, ${c.descrizione ?? null},
              ${c.mostra_descrizione ?? false}, ${c.inizia_settimana ?? 'lunedi'},
              ${c.created_at}, ${c.updated_at})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log('✓ Calendari migrati')
} catch (e) { console.log(`  Calendari: skip (${e.message})`) }

// 15. Prenotazioni
try {
  const prenotazioni = await fetchTable('prenotazioni_appuntamenti')
  console.log(`  Prenotazioni: ${prenotazioni.length}`)
  for (const p of remap(prenotazioni)) {
    await dst`
      INSERT INTO prenotazioni_appuntamenti (id, user_id, calendario_id, cliente_nome, cliente_email, cliente_tel, data, ora_inizio, ora_fine, note, stato, created_at)
      VALUES (${p.id}, ${p.user_id}, ${p.calendario_id}, ${p.cliente_nome}, ${p.cliente_email ?? null},
              ${p.cliente_tel ?? null}, ${p.data}, ${p.ora_inizio}, ${p.ora_fine},
              ${p.note ?? null}, ${p.stato ?? 'confermata'}, ${p.created_at})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log('✓ Prenotazioni migrate')
} catch (e) { console.log(`  Prenotazioni: skip (${e.message})`) }

await dst.end()
console.log('\n✅ Migrazione completata!')

import postgres from 'postgres'

const DATABASE_URL = 'postgresql://neondb_owner:npg_GwBV5b3JTkXq@ep-soft-pine-alpaayny.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'
const sql = postgres(DATABASE_URL)

try {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS gallery_visitor_names (
      gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
      session_id  text NOT NULL,
      name        text NOT NULL,
      updated_at  timestamptz DEFAULT now(),
      PRIMARY KEY (gallery_id, session_id)
    )
  `)
  console.log('✅ Tabella gallery_visitor_names creata')
} catch (e) {
  console.error('Errore:', e.message)
} finally {
  await sql.end()
}

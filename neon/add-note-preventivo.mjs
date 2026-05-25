import postgres from 'postgres'

const DATABASE_URL = 'postgresql://neondb_owner:npg_GwBV5b3JTkXq@ep-soft-pine-alpaayny.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'
const sql = postgres(DATABASE_URL)

try {
  await sql.unsafe(`
    ALTER TABLE preventivo_sessioni
      ADD COLUMN IF NOT EXISTS note text
  `)
  console.log('✅ Colonna note aggiunta a preventivo_sessioni')
} catch (e) {
  console.error('Errore:', e.message)
} finally {
  await sql.end()
}

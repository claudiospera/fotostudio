// Applica supabase/migrations/017_calendars.sql su Neon.
// Uso: node --env-file=.env.local neon/add-calendars.mjs
import postgres from 'postgres'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const schema = readFileSync(join(__dir, '..', 'supabase', 'migrations', '017_calendars.sql'), 'utf-8')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL non impostata. Lancia con: node --env-file=.env.local neon/add-calendars.mjs')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL)

try {
  await sql.unsafe(schema)
  console.log('✅ Tabelle calendar_models / calendar_settings create')
} catch (e) {
  console.error('Errore:', e.message)
  process.exit(1)
} finally {
  await sql.end()
}

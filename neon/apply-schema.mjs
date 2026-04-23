import postgres from 'postgres'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const schema = readFileSync(join(__dir, 'schema.sql'), 'utf-8')

const DATABASE_URL = 'postgresql://neondb_owner:npg_GwBV5b3JTkXq@ep-soft-pine-alpaayny.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'

const sql = postgres(DATABASE_URL)

console.log('Applying schema...')
try {
  await sql.unsafe(schema)
  console.log('Schema applied successfully!')
} catch (e) {
  console.error('Error applying schema:', e.message)
  process.exit(1)
} finally {
  await sql.end()
}
